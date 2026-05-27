import { supabase } from '../../supabase';

const handleResponse = (res) => {
    if (res.error) throw res.error;
    return res.data;
};

export const recipesAPI = {
    // Get public feed
    getAll: async (params = {}) =>
        handleResponse(await supabase.from('recipes').select('*')),

    // Get recipes filtered by ingredients
    getByIngredients: async (ingredients, page = 1, limit = 10) => {
        const ingredientString = Array.isArray(ingredients)
            ? ingredients.join(',')
            : ingredients;
        return handleResponse(
            await supabase.from('recipes')
                .select('*')
                .ilike('ingredients', `%${ingredientString}%`)
        );
    },

    // Get current user's own recipes
    getMine: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        return handleResponse(
            await supabase.from('recipes')
                .select('*')
                .eq('user_id', user?.id)
        );
    },

    // Get saved
    getSaved: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        // Assumes a 'saved_recipes' join table
        const { data, error } = await supabase
            .from('saved_recipes')
            .select('recipe_id')
            .eq('user_id', user?.id);

        if (error) throw error;

        const recipeIds = data.map(item => item.recipe_id);
        return handleResponse(
            await supabase.from('recipes')
                .select('*')
                .in('id', recipeIds)
        );
    },

    // Get single recipe by ID
    getOne: async (id) =>
        handleResponse(await supabase.from('recipes').select('*').eq('id', id).single()),

    // Create a new recipe
    create: async (data) =>
        handleResponse(await supabase.from('recipes').insert(data).select()),

    // Update an existing recipe, only the owner
    update: async (id, data) =>
        handleResponse(await supabase.from('recipes').update(data).eq('id', id).select()),

    // Delete a recipe, only the owner
    remove: async (id) =>
        handleResponse(await supabase.from('recipes').delete().eq('id', id)),

    // Toggle save
    toggleSave: async (id) => {
        const { data: { user } } = await supabase.auth.getUser();
        const { data: existing } = await supabase
            .from('saved_recipes')
            .select('*')
            .eq('user_id', user?.id)
            .eq('recipe_id', id)
            .single();

        if (existing) {
            await supabase.from('saved_recipes').delete().eq('id', existing.id);
            return { saved: false };
        } else {
            await supabase.from('saved_recipes').insert({ user_id: user?.id, recipe_id: id });
            return { saved: true };
        }
    },

    // Post a review
    addReview: async (id, data) =>
        handleResponse(await supabase.from('reviews').insert({ ...data, recipe_id: id }).select()),

    // Toggle like
    toggleLike: async (id) => {
        const { data: { user } } = await supabase.auth.getUser();
        const { data: existing } = await supabase
            .from('recipe_likes')
            .select('*')
            .eq('user_id', user?.id)
            .eq('recipe_id', id)
            .single();

        if (existing) {
            await supabase.from('recipe_likes').delete().eq('user_id', user?.id).eq('recipe_id', id);
            return { liked: false };
        } else {
            await supabase.from('recipe_likes').insert({ user_id: user?.id, recipe_id: id });
            return { liked: true };
        }
    },
};
