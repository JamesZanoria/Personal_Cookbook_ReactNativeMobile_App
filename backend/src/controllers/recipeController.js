const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');

// GET /recipes  — public feed, optional filters + pagination
const getAll = async (req, res) => {
    try {
        const { category, difficulty, search, mine, sort, page = 1, limit = 20 } = req.query;

        const offset = (Number(page) - 1) * Number(limit);

        let sql = `
      SELECT r.*, u.name AS author_name, u.avatar_url AS author_avatar,
        COALESCE(ROUND((SELECT AVG(rv.rating) FROM reviews rv WHERE rv.recipe_id = r.id), 1), 0) AS avg_rating,
        (SELECT COUNT(*) FROM reviews rv WHERE rv.recipe_id = r.id) AS review_count,
        (SELECT COUNT(*) FROM saved_recipes sr WHERE sr.recipe_id = r.id) AS save_count,
        ${req.user ? '(SELECT 1 FROM saved_recipes sr2 WHERE sr2.user_id = ? AND sr2.recipe_id = r.id) AS is_saved,' : '0 AS is_saved,'}
        ${req.user ? '(SELECT 1 FROM recipe_likes rl WHERE rl.user_id = ? AND rl.recipe_id = r.id) AS is_liked' : '0 AS is_liked'}
      FROM recipes r
      JOIN users u ON u.id = r.user_id
      WHERE 1=1
    `;
        const params = req.user ? [req.user.id, req.user.id] : [];

        if (mine === 'true' && req.user) {
            sql += ' AND r.user_id = ?';
            params.push(req.user.id);
        } else {
            sql += ' AND r.is_published = 1';
        }

        if (category) { sql += ' AND r.category = ?'; params.push(category); }
        if (difficulty) { sql += ' AND r.difficulty = ?'; params.push(difficulty); }
        if (search) {
            sql += ' AND (r.title LIKE ? OR r.story LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        if (sort === 'trending') {
            sql += ' ORDER BY ((avg_rating * 10) + (review_count * 3) + (save_count * 2) + like_count) DESC, r.created_at DESC';
        } else {
            sql += ' ORDER BY r.created_at DESC';
        }

        sql += ' LIMIT ? OFFSET ?';
        params.push(Number(limit), offset);

        const [rows] = await db.query(sql, params);
        return res.json(rows);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: err.message });
    }
};

// GET /recipes/filter/by-ingredients
// Searches ALL published recipes, ranks by how many selected ingredients they contain.
// Supports pagination via ?page=1&limit=10
const getByIngredients = async (req, res) => {
    try {
        const { ingredients, page = 1, limit = 10 } = req.query;

        if (!ingredients) {
            return res.status(400).json({ error: 'ingredients parameter is required' });
        }

        const ingredientList = ingredients
            .split(',')
            .map(ing => ing.trim().toLowerCase())
            .filter(ing => ing.length > 0);

        console.log('DEBUG: Incoming ingredients query:', ingredients);
        console.log('DEBUG: Processed ingredientList:', ingredientList);

        if (ingredientList.length === 0) {
            return res.status(400).json({ error: 'At least one ingredient is required' });
        }

        // Fetch ALL published recipes (no user restriction)
        const [allRecipes] = await db.query(`
      SELECT r.*, u.name AS author_name, u.avatar_url AS author_avatar,
        COALESCE(ROUND((SELECT AVG(rv.rating) FROM reviews rv WHERE rv.recipe_id = r.id), 1), 0) AS avg_rating,
        (SELECT COUNT(*) FROM reviews rv WHERE rv.recipe_id = r.id) AS review_count,
        (SELECT COUNT(*) FROM saved_recipes sr WHERE sr.recipe_id = r.id) AS save_count,
        ${req.user ? '(SELECT 1 FROM saved_recipes sr2 WHERE sr2.user_id = ? AND sr2.recipe_id = r.id) AS is_saved,' : '0 AS is_saved,'}
        ${req.user ? '(SELECT 1 FROM recipe_likes rl WHERE rl.user_id = ? AND rl.recipe_id = r.id) AS is_liked' : '0 AS is_liked'}
      FROM recipes r
      JOIN users u ON u.id = r.user_id
      WHERE r.is_published = 1 ${req.user ? 'OR r.user_id = ?' : ''}
    `, req.user ? [req.user.id, req.user.id, req.user.id] : []);

        // Score every recipe against the selected ingredients
        const scored = allRecipes
            .map(recipe => {
                let parsed = [];
                try {
                    parsed = typeof recipe.ingredients === 'string'
                        ? JSON.parse(recipe.ingredients)
                        : (Array.isArray(recipe.ingredients) ? recipe.ingredients : []);
                } catch { parsed = []; }

                const recipeIngNames = parsed
                    .map(ing => {
                        if (typeof ing === 'string') return ing.toLowerCase();
                        if (ing && typeof ing === 'object') {
                            // Try common name fields: name, ingredient, text
                            const name = ing.name || ing.ingredient || ing.text || '';
                            return typeof name === 'string' ? name.toLowerCase() : '';
                        }
                        return '';
                    })
                    .filter(Boolean);

                const matchCount = ingredientList.filter(sel => {
                    const isMatch = recipeIngNames.some(ri => ri.includes(sel) || sel.includes(ri));
                    if (sel === 'apple') {
                        console.log(`DEBUG: Checking 'apple' against recipe ${recipe.id} (${recipe.title}). Recipe ingredients:`, recipeIngNames, 'Match:', isMatch);
                    }
                    return isMatch;
                }).length;

                if (matchCount === 0) return null;

                const matchPercentage = (matchCount / ingredientList.length) * 100;
                return { ...recipe, matchCount, matchPercentage };
            })
            .filter(Boolean)
            .sort((a, b) => {
                if (b.matchPercentage !== a.matchPercentage) return b.matchPercentage - a.matchPercentage;
                if (b.avg_rating !== a.avg_rating) return b.avg_rating - a.avg_rating;
                return new Date(b.created_at) - new Date(a.created_at);
            });

        // Paginate in application layer (results already filtered+sorted)
        const total = scored.length;
        const offset = (Number(page) - 1) * Number(limit);
        const paginated = scored.slice(offset, offset + Number(limit));

        return res.json({
            data: paginated,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit)),
                hasMore: offset + paginated.length < total,
            },
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: err.message });
    }
};

// GET /recipes/saved
const getSaved = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT r.*, u.name AS author_name,
              COALESCE(ROUND((SELECT AVG(rv.rating) FROM reviews rv WHERE rv.recipe_id = r.id), 1), 0) AS avg_rating,
              (SELECT COUNT(*) FROM reviews rv WHERE rv.recipe_id = r.id) AS review_count,
              (SELECT COUNT(*) FROM saved_recipes sr2 WHERE sr2.recipe_id = r.id) AS save_count,
              1 AS is_saved,
              (SELECT 1 FROM recipe_likes rl WHERE rl.user_id = ? AND rl.recipe_id = r.id) AS is_liked
       FROM saved_recipes sr
       JOIN recipes r ON r.id = sr.recipe_id
       JOIN users   u ON u.id = r.user_id
       WHERE sr.user_id = ?
       ORDER BY sr.saved_at DESC`,
            [req.user.id, req.user.id]
        );
        return res.json(rows);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: err.message });
    }
};

// GET /recipes/:id
const getOne = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT r.*, u.name AS author_name, u.avatar_url AS author_avatar
       FROM recipes r
       JOIN users u ON u.id = r.user_id
       WHERE r.id = ?`,
            [req.params.id]
        );
        if (!rows.length) return res.status(404).json({ error: 'Recipe not found' });

        const recipe = rows[0];

        const [reviews] = await db.query(
            `SELECT rv.*, u.name AS reviewer_name
       FROM reviews rv
       JOIN users u ON u.id = rv.user_id
       WHERE rv.recipe_id = ?
       ORDER BY rv.created_at DESC`,
            [req.params.id]
        );

        const [[{ avg_rating, review_count }]] = await db.query(
            `SELECT ROUND(AVG(rating), 1) AS avg_rating, COUNT(*) AS review_count
       FROM reviews WHERE recipe_id = ?`,
            [req.params.id]
        );
        const [[{ save_count }]] = await db.query(
            'SELECT COUNT(*) AS save_count FROM saved_recipes WHERE recipe_id = ?',
            [req.params.id]
        );

        let is_saved = false;
        if (req.user) {
            const [[saved]] = await db.query(
                'SELECT 1 FROM saved_recipes WHERE user_id = ? AND recipe_id = ?',
                [req.user.id, req.params.id]
            );
            is_saved = !!saved;
        }

        let is_liked = false;
        if (req.user) {
            const [[liked]] = await db.query(
                'SELECT 1 FROM recipe_likes WHERE user_id = ? AND recipe_id = ?',
                [req.user.id, req.params.id]
            );
            is_liked = !!liked;
        }

        return res.json({
            ...recipe,
            reviews,
            avg_rating: avg_rating || 0,
            review_count: review_count || 0,
            save_count: save_count || 0,
            is_saved,
            is_liked,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: err.message });
    }
};

// POST /recipes
const create = async (req, res) => {
    try {
        const {
            title, story, category, difficulty,
            prep_time, cook_time, servings,
            ingredients, instructions, photo_url, is_published,
        } = req.body;

        if (!title) return res.status(400).json({ error: 'title is required' });

        const id = uuidv4();

        await db.query(
            `INSERT INTO recipes
         (id, user_id, title, story, category, difficulty,
          prep_time, cook_time, servings,
          ingredients, instructions, photo_url, is_published)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id,
                req.user.id,
                title,
                story || null,
                category || null,
                difficulty || 'Easy',
                prep_time || null,
                cook_time || null,
                servings || null,
                JSON.stringify(ingredients || []),
                JSON.stringify(instructions || []),
                photo_url || null,
                is_published ? 1 : 0,
            ]
        );

        const [rows] = await db.query('SELECT * FROM recipes WHERE id = ?', [id]);
        return res.status(201).json(rows[0]);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: err.message });
    }
};

// PUT /recipes/:id
const update = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM recipes WHERE id = ?', [req.params.id]);
        if (!rows.length) return res.status(404).json({ error: 'Recipe not found' });
        if (rows[0].user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

        const {
            title, story, category, difficulty,
            prep_time, cook_time, servings,
            ingredients, instructions, photo_url, is_published,
        } = req.body;

        await db.query(
            `UPDATE recipes SET
         title        = COALESCE(?, title),
         story        = COALESCE(?, story),
         category     = COALESCE(?, category),
         difficulty   = COALESCE(?, difficulty),
         prep_time    = COALESCE(?, prep_time),
         cook_time    = COALESCE(?, cook_time),
         servings     = COALESCE(?, servings),
         ingredients  = COALESCE(?, ingredients),
         instructions = COALESCE(?, instructions),
         photo_url    = COALESCE(?, photo_url),
         is_published = COALESCE(?, is_published)
       WHERE id = ?`,
            [
                title || null,
                story || null,
                category || null,
                difficulty || null,
                prep_time || null,
                cook_time || null,
                servings || null,
                ingredients ? JSON.stringify(ingredients) : null,
                instructions ? JSON.stringify(instructions) : null,
                photo_url || null,
                is_published !== undefined ? (is_published ? 1 : 0) : null,
                req.params.id,
            ]
        );

        const [updated] = await db.query('SELECT * FROM recipes WHERE id = ?', [req.params.id]);
        return res.json(updated[0]);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: err.message });
    }
};

// DELETE /recipes/:id
const remove = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT user_id FROM recipes WHERE id = ?', [req.params.id]);
        if (!rows.length) return res.status(404).json({ error: 'Recipe not found' });
        if (rows[0].user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

        await db.query('DELETE FROM recipes WHERE id = ?', [req.params.id]);
        return res.json({ message: 'Recipe deleted' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: err.message });
    }
};

// POST /recipes/:id/save
const toggleSave = async (req, res) => {
    try {
        const [[exists]] = await db.query(
            'SELECT 1 FROM saved_recipes WHERE user_id = ? AND recipe_id = ?',
            [req.user.id, req.params.id]
        );

        if (exists) {
            await db.query('DELETE FROM saved_recipes WHERE user_id = ? AND recipe_id = ?', [req.user.id, req.params.id]);
            const [[{ save_count }]] = await db.query('SELECT COUNT(*) AS save_count FROM saved_recipes WHERE recipe_id = ?', [req.params.id]);
            return res.json({ saved: false, save_count });
        } else {
            await db.query('INSERT INTO saved_recipes (user_id, recipe_id) VALUES (?, ?)', [req.user.id, req.params.id]);
            const [[{ save_count }]] = await db.query('SELECT COUNT(*) AS save_count FROM saved_recipes WHERE recipe_id = ?', [req.params.id]);
            return res.json({ saved: true, save_count });
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: err.message });
    }
};

// POST /recipes/:id/reviews
const addReview = async (req, res) => {
    try {
        const { rating, body } = req.body;
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'rating must be between 1 and 5' });
        }

        const id = uuidv4();
        await db.query(
            'INSERT INTO reviews (id, recipe_id, user_id, rating, body) VALUES (?, ?, ?, ?, ?)',
            [id, req.params.id, req.user.id, rating, body || null]
        );

        const [rows] = await db.query(
            `SELECT rv.*, u.name AS reviewer_name FROM reviews rv JOIN users u ON u.id = rv.user_id WHERE rv.id = ?`,
            [id]
        );
        return res.status(201).json(rows[0]);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: err.message });
    }
};

// POST /recipes/:id/like
const toggleLike = async (req, res) => {
    try {
        const [[exists]] = await db.query(
            'SELECT 1 FROM recipe_likes WHERE user_id = ? AND recipe_id = ?',
            [req.user.id, req.params.id]
        );

        if (exists) {
            await db.query('DELETE FROM recipe_likes WHERE user_id = ? AND recipe_id = ?', [req.user.id, req.params.id]);
            await db.query('UPDATE recipes SET like_count = GREATEST(like_count - 1, 0) WHERE id = ?', [req.params.id]);
            const [[{ like_count }]] = await db.query('SELECT like_count FROM recipes WHERE id = ?', [req.params.id]);
            return res.json({ liked: false, like_count });
        } else {
            await db.query('INSERT INTO recipe_likes (user_id, recipe_id) VALUES (?, ?)', [req.user.id, req.params.id]);
            await db.query('UPDATE recipes SET like_count = like_count + 1 WHERE id = ?', [req.params.id]);
            const [[{ like_count }]] = await db.query('SELECT like_count FROM recipes WHERE id = ?', [req.params.id]);
            return res.json({ liked: true, like_count });
        }
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

module.exports = { getAll, getByIngredients, getSaved, getOne, create, update, remove, toggleSave, addReview, toggleLike };