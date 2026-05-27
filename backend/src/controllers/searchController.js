const { v4: uuidv4 } = require('uuid');

// controllers/searchController.js
// Uses TheMealDB (https://www.themealdb.com/api.php) — 100% free, no API key,
// no rate limits for development. Merges results with local DB recipes.

const axios = require('axios');
const db    = require('../config/db');

const MEAL_DB_BASE = 'https://www.themealdb.com/api/json/v1/1';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseLocalIngredients(raw) {
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'string') {
        try { return JSON.parse(raw); } catch { return []; }
    }
    return [];
}

function localIngredientNames(raw) {
    return parseLocalIngredients(raw)
        .map(i => (typeof i === 'string' ? i : i?.name || '').toLowerCase())
        .filter(Boolean);
}

function scoreRecipe(recipe, ingredientList) {
    const names = localIngredientNames(recipe.ingredients);
    if (names.length === 0) return null;

    const coveredIngredients = names.filter(ri =>
        ingredientList.some(sel => ri.includes(sel) || sel.includes(ri))
    );
    const matchCount = coveredIngredients.length;

    if (matchCount === 0) return null;

    const missedIngredients = names.filter(ri =>
        !ingredientList.some(sel => ri.includes(sel) || sel.includes(ri))
    );

    return {
        ...recipe,
        source:          recipe.source || 'local',
        author_name:      recipe.author_name || (recipe.source === 'mealdb' ? 'TheMealDB' : 'Unknown'),
        matchCount,
        matchPercentage: Math.round((matchCount / names.length) * 100),
        image:           recipe.photo_url || null,
        readyInMinutes:  recipe.cook_time ?? null,
        summary:         recipe.story     || null,
        usedIngredients: coveredIngredients,
        missedIngredients: missedIngredients.slice(0, 5), // cap for UI
    };
}

// Extract ingredients array from a TheMealDB meal object
// TheMealDB stores ingredients as strIngredient1…strIngredient20
function extractMealDbIngredients(meal) {
    const result = [];
    for (let i = 1; i <= 20; i++) {
        const ing = meal[`strIngredient${i}`];
        const msr = meal[`strMeasure${i}`];
        if (ing && ing.trim()) {
            result.push({ name: ing.trim(), measure: (msr || '').trim() });
        }
    }
    return result;
}

function scoreMealDbRaw(meal, ingredientList) {
    const mealIngredients = extractMealDbIngredients(meal)
        .map(i => i.name.toLowerCase());
    if (mealIngredients.length === 0) return null;

    const coveredIngredients = mealIngredients.filter(mi =>
        ingredientList.some(sel => mi.includes(sel) || sel.includes(mi))
    );

    if (coveredIngredients.length === 0) return null;

    return {
        matchCount: coveredIngredients.length,
        matchPercentage: Math.round((coveredIngredients.length / mealIngredients.length) * 100),
    };
}

async function cacheMealDbRecipe(meal, ingredientList) {
    try {
        // Use a deterministic ID based on the MealDB ID to preserve references (like saved_recipes)
        const recipeId = `mealdb_${meal.idMeal}`;

        // Check if already cached
        const [existing] = await db.query(
            'SELECT id FROM recipes WHERE id = ?',
            [recipeId]
        );

        if (existing.length > 0) {
            return existing[0].id;
        }

        // Extract and format ingredients for JSON storage
        const ingredients = extractMealDbIngredients(meal).map(i => ({
            name: i.name,
            qty: i.measure
        }));

        console.log(`[Cache] Attempting to save MealDB recipe: ${meal.strMeal} (ID: ${recipeId})`);

        await db.query(
            `INSERT INTO recipes (
                id, user_id, title, story, category, difficulty,
                prep_time, cook_time, servings, ingredients,
                instructions, photo_url, is_published, source, external_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                recipeId,
                null, // Set user_id to null for cached recipes
                meal.strMeal,
                meal.strInstructions ? meal.strInstructions.slice(0, 1000) : null,
                meal.strCategory || null,
                'Medium', // Default for MealDB
                null,
                null,
                null,
                JSON.stringify(ingredients),
                JSON.stringify([ { text: meal.strInstructions || '', photo_url: null } ]),
                meal.strMealThumb,
                1, // Automatically published
                'mealdb',
                meal.idMeal
            ]
        );

        console.log(`[Cache] Successfully saved: ${meal.strMeal}`);
        return recipeId;
    } catch (err) {
        console.error('[cacheMealDbRecipe] CRITICAL ERROR during save:');
        console.error('Error Message:', err.message);
        if (err.sql) console.error('SQL State:', err.sqlState);
        console.error('Full Error Object:', err);
        return null;
    }
}

// ── GET /api/search/by-ingredients ───────────────────────────────────────────

const searchByIngredients = async (req, res) => {
    try {
        const { ingredients, page = 1, limit = 12 } = req.query;

        if (!ingredients) {
            return res.status(400).json({ error: 'ingredients parameter is required' });
        }

        const ingredientList = ingredients
            .split(',')
            .map(i => i.trim().toLowerCase())
            .filter(Boolean);

        if (ingredientList.length === 0) {
            return res.status(400).json({ error: 'At least one ingredient is required' });
        }

        // ── Cleanup: Remove cached MealDB recipes that aren't saved by the user ──
        // This keeps the DB size matched to Current Matches + User Recipes + Saved Recipes
        await db.query(`
            DELETE FROM recipes
            WHERE source = 'mealdb'
            AND id NOT IN (SELECT recipe_id FROM saved_recipes)
        `);

        const pageNum  = Math.max(1, Number(page));
        const limitNum = Math.min(50, Math.max(1, Number(limit)));
        const offset   = (pageNum - 1) * limitNum;

        // ── 1. TheMealDB: filter by each ingredient, collect unique meals ────
        const mealDbResults = [];
        const seenMealIds   = new Set();

        await Promise.all(
            ingredientList.map(async (ing) => {
                try {
                    // Attempt 1: Use the strict ingredient filter
                    const res = await axios.get(`${MEAL_DB_BASE}/filter.php`, {
                        params:  { i: ing },
                        timeout: 6000,
                        headers: { 'User-Agent': 'personal-cookbook-app' },
                    });

                    let meals = res.data?.meals;

                    // Attempt 2: If no results found with filter, try a general search by name
                    if (!meals || meals.length === 0) {
                        const searchRes = await axios.get(`${MEAL_DB_BASE}/search.php`, {
                            params:  { s: ing },
                            timeout: 6000,
                            headers: { 'User-Agent': 'personal-cookbook-app' },
                        });
                        meals = searchRes.data?.meals;
                    }

                    if (!Array.isArray(meals)) return;

                    await Promise.all(
                        meals.map(async (m) => {
                            if (seenMealIds.has(m.idMeal)) return;
                            seenMealIds.add(m.idMeal);
                            try {
                                const detail = await axios.get(`${MEAL_DB_BASE}/lookup.php`, {
                                    params:  { i: m.idMeal },
                                    timeout: 6000,
                                    headers: { 'User-Agent': 'personal-cookbook-app' },
                                });
                                const full = detail.data?.meals?.[0];
                                if (full) {
                                    // Only cache if it actually matches the search criteria
                                    if (scoreMealDbRaw(full, ingredientList)) {
                                        await cacheMealDbRecipe(full, ingredientList);
                                    }
                                }
                            } catch {
                                // skip failed lookups silently
                            }
                        })
                    );
                } catch {
                    // skip failed ingredient queries silently
                }
            })
        );

        // ── 2. DB: all published recipes (local + cached mealdb) that match ──────────
        const [allRecipes] = await db.query(`
            SELECT r.*, u.name AS author_name,
                COALESCE(ROUND(
                    (SELECT AVG(rv.rating) FROM reviews rv WHERE rv.recipe_id = r.id), 1
                ), 0) AS avg_rating,
                (SELECT COUNT(*) FROM saved_recipes sr WHERE sr.recipe_id = r.id) AS save_count,
                ${req.user
                    ? '(SELECT 1 FROM saved_recipes s2 WHERE s2.user_id = ? AND s2.recipe_id = r.id) AS is_saved'
                    : '0 AS is_saved'}
            FROM recipes r
            LEFT JOIN users u ON u.id = r.user_id
            WHERE r.is_published = 1 ${req.user ? 'OR r.user_id = ?' : ''}
        `, req.user ? [req.user.id, req.user.id] : []);

        const matches = allRecipes
            .map(r => scoreRecipe(r, ingredientList))
            .filter(Boolean)
            .sort((a, b) => b.matchPercentage - a.matchPercentage || b.avg_rating - a.avg_rating);

        console.log(`[Search] Found ${allRecipes.length} published/owned recipes. ${matches.length} matched ingredients.`);
        console.log(`[Search] Sources: local=${matches.filter(m => m.source === 'local').length}, mealdb=${matches.filter(m => m.source === 'mealdb').length}`);

        const total      = matches.length;
        const paginated  = matches.slice(offset, offset + limitNum);

        return res.json({
            data:       paginated,
            pagination: {
                page:       pageNum,
                limit:      limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
                hasMore:    offset + paginated.length < total,
            },
            ingredients: ingredientList,
        });

    } catch (err) {
        console.error('[searchByIngredients]', err.message);
        return res.status(500).json({ error: err.message });
    }
};

module.exports = { searchByIngredients };