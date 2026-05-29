import { supabase } from '../../supabase';

const handleResponse = (res) => {
    if (res.error) throw res.error;
    return res.data;
};

export const collectionsAPI = {
    getAll: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];
        const collections = handleResponse(
            await supabase
                .from('collections')
                .select('*')
                .eq('user_id', user.id)
        );

        // Manually fetch recipes for each collection to avoid complex joins
        const allCollectionsWithRecipes = await Promise.all(collections.map(async (col) => {
            const { data: rels } = await supabase
                .from('collection_recipes')
                .select('recipe_id')
                .eq('collection_id', col.id);

            const recipeIds = rels?.map(r => r.recipe_id) || [];
            const { data: recipes } = await supabase
                .from('recipes')
                .select('*')
                .in('id', recipeIds);

            return { ...col, recipes: recipes || [] };
        }));

        return allCollectionsWithRecipes;
    },

    getOne: async (id) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const collection = handleResponse(
            await supabase
                .from('collections')
                .select('*')
                .eq('id', id)
                .eq('user_id', user.id)
                .single()
        );

        const { data: rels } = await supabase
            .from('collection_recipes')
            .select('recipe_id')
            .eq('collection_id', id);

        const recipeIds = rels?.map(r => r.recipe_id) || [];
        const { data: recipes } = await supabase
            .from('recipes')
            .select('*')
            .in('id', recipeIds);

        return { ...collection, recipes: recipes || [] };
    },

    create: async (data) => {
        const { data: { user } } = await supabase.auth.getUser();
        return handleResponse(
            await supabase.from('collections').insert({
                ...data,
                user_id: user?.id
            }).select()
        );
    },

    update: async (id, data) =>
        handleResponse(await supabase.from('collections').update(data).eq('id', id).select()),

    remove: async (id) =>
        handleResponse(await supabase.from('collections').delete().eq('id', id)),

    addRecipe: async (colId, recipeId) =>
        handleResponse(await supabase.from('collection_recipes').insert({ collection_id: colId, recipe_id: recipeId })),

    removeRecipe: async (colId, recipeId) =>
        handleResponse(await supabase.from('collection_recipes').delete().eq('collection_id', colId).eq('recipe_id', recipeId)),
};

export const collectionAPI = collectionsAPI;
