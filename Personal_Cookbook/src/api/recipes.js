import { supabase } from '../../supabase';

const handleResponse = (res) => {
    if (res.error) throw res.error;
    return res.data;
};


// Re-implementing the handler to be cleaner
const safeRequest = async (promise) => {
    const { data, error } = await promise;
    if (error) throw error;
    return data;
};

const mergeUserStatus = async (recipes) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !recipes || recipes.length === 0) return recipes;

    const recipeIds = recipes.map(r => r.id);

    const { data: savedData } = await supabase
        .from('saved_recipes')
        .select('recipe_id')
        .eq('user_id', user.id)
        .in('recipe_id', recipeIds);

    const { data: likedData } = await supabase
        .from('recipe_likes')
        .select('recipe_id')
        .eq('user_id', user.id)
        .in('recipe_id', recipeIds);

    const savedIds = new Set(savedData?.map(item => item.recipe_id) || []);
    const likedIds = new Set(likedData?.map(item => item.recipe_id) || []);

    return recipes.map(r => ({
        ...r,
        is_saved: savedIds.has(r.id),
        is_liked: likedIds.has(r.id)
    }));
};

export const recipesAPI = {
    // Get public feed with user-specific save/like status
    getAll: async (params = {}) => {
        const recipesRaw = await safeRequest(supabase.from('recipes').select('*'));

        const recipes = recipesRaw.map(r => ({
            ...r,
            author_name: 'Chef'
        }));

        return await mergeUserStatus(recipes);
    },


    // Get recipes filtered by ingredients
    getByIngredients: async (ingredients, page = 1, limit = 10) => {
        const ingredientString = Array.isArray(ingredients)
            ? ingredients.join(',')
            : ingredients;

        return await safeRequest(
            supabase.rpc('search_recipes_by_ingredients', {
                search_term: ingredientString
            })
        );
    },

    // Get current user's own recipes
    getMine: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        return await safeRequest(
            supabase.from('recipes')
                .select('*')
                .eq('user_id', user?.id)
        );
    },

    // Get saved
    getSaved: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        const { data, error } = await supabase
            .from('saved_recipes')
            .select('recipe_id')
            .eq('user_id', user?.id);

        if (error) throw error;

        const recipeIds = data.map(item => item.recipe_id);
        return await safeRequest(
            supabase.from('recipes')
                .select('*')
                .in('id', recipeIds)
        );
    },

    // Get single recipe by ID
    getOne: async (id) => {
        const { data: { user } } = await supabase.auth.getUser();
        const recipeRaw = await safeRequest(supabase.from('recipes').select('*').eq('id', id).single());

        const recipe = {
            ...recipeRaw,
            author_name: 'Chef'
        };

        if (!user) return recipe;

        const { data: saved } = await supabase
            .from('saved_recipes')
            .select('recipe_id')
            .eq('user_id', user.id)
            .eq('recipe_id', id)
            .maybeSingle();

        const { data: liked } = await supabase
            .from('recipe_likes')
            .select('recipe_id')
            .eq('user_id', user.id)
            .eq('recipe_id', id)
            .maybeSingle();

        return {
            ...recipe,
            is_saved: !!saved,
            is_liked: !!liked
        };
    },

    // Create a new recipe
    create: async (data) =>
        await safeRequest(supabase.from('recipes').insert(data).select()),

    // Update an existing recipe, only the owner
    update: async (id, data) =>
        await safeRequest(supabase.from('recipes').update(data).eq('id', id).select()),

    // Delete a recipe, only the owner
    remove: async (id) =>
        await safeRequest(supabase.from('recipes').delete().eq('id', id)),

    // Toggle save
    toggleSave: async (id) => {
        const { data: { user } } = await supabase.auth.getUser();
        const { data: existing } = await supabase
            .from('saved_recipes')
            .select('*')
            .eq('user_id', user?.id)
            .eq('recipe_id', id)
            .maybeSingle();

        if (existing) {
            await supabase.from('saved_recipes').delete().eq('id', existing.id);
            return { saved: false };
        } else {
            await supabase.from('saved_recipes').insert({ user_id: user?.id, recipe_id: id });
            return { saved: true };
        }
    },

    // Post a review
    addReview: async (id, data) => {
        const { data: { user } } = await supabase.auth.getUser();
        const { data: result, error } = await supabase
            .from('reviews')
            .insert({
                ...data,
                recipe_id: id,
                user_id: user?.id
            })
            .select('*, users(name)')
            .single();

        if (error) throw error;
        return {
            ...result,
            reviewer_name: result.users?.name || 'Anonymous'
        };
    },

    // Toggle like
    toggleLike: async (id) => {
        const { data: { user } } = await supabase.auth.getUser();
        const { data: existing } = await supabase
            .from('recipe_likes')
            .select('*')
            .eq('user_id', user?.id)
            .eq('recipe_id', id)
            .maybeSingle();

        if (existing) {
            await supabase.from('recipe_likes').delete().eq('user_id', user?.id).eq('recipe_id', id);
            return { liked: false };
        } else {
            await supabase.from('recipe_likes').insert({ user_id: user?.id, recipe_id: id });
            return { liked: true };
        }
    },
};
