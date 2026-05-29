import { supabase } from '../../supabase';

export const searchAPI = {
    byIngredients: async (ingredients, page = 1, limit = 12) => {
        const ingredientList = Array.isArray(ingredients)
            ? ingredients.map(i => i.trim().toLowerCase())
            : [ingredients.trim().toLowerCase()];

        const ingredientString = ingredientList.join(',');

        // 1. Fetch from our App's Database
        let localRecipes = [];
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { data, error } = await supabase
                .rpc('search_recipes_by_ingredients', {
                    search_term: ingredientString
                });

            if (error) {
                console.error('Local search RPC error:', error);
            } else {
                // Filter to only include recipes created by the current user
                localRecipes = (data || []).filter(r => r.user_id === user?.id);
            }
        } catch (e) {
            console.error('Local search exception:', e);
        }

        // 2. Fetch from TheMealDB (All recipes in the world)
        let mealDbRecipes = [];
        try {
            const primaryIng = ingredientList[0];
            if (primaryIng) {
                const res = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?i=${encodeURIComponent(primaryIng)}`);
                const json = await res.json();
                if (json.meals) {
                    mealDbRecipes = json.meals.map(m => ({
                        id: `mealdb-${m.idMeal}`,
                        title: m.strMeal,
                        photo_url: m.strMealThumb,
                        source: 'mealdb',
                        sourceUrl: `https://www.themealdb.com/meal/${m.idMeal}`,
                        author_name: 'TheMealDB',
                        matchPercentage: 70,
                        usedIngredients: [primaryIng],
                        missedIngredients: [],
                        category: 'General',
                        cook_time: 30,
                        servings: 2,
                    }));
                }
            }
        } catch (e) {
            console.error('MealDB search error:', e);
        }

        // 3. Format and Merge
        const formattedLocal = localRecipes.map(r => ({
            ...r,
            source: 'local',
            matchPercentage: r.match_percentage || 100,
            usedIngredients: r.ingredients?.filter(i => ingredientList.includes(i)) || [],
            missedIngredients: [],
        }));

        const merged = [...formattedLocal, ...mealDbRecipes];

        // Sort by match percentage (highest first)
        merged.sort((a, b) => (b.matchPercentage || 0) - (a.matchPercentage || 0));

        return merged.slice(0, limit);
    },
};
