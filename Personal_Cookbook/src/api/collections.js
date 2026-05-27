import { supabase } from '../../supabase';

const handleResponse = (res) => {
    if (res.error) throw res.error;
    return res.data;
};

export const collectionsAPI = {
    getAll: async () =>
        handleResponse(await supabase.from('collections').select('*')),

    getOne: async (id) =>
        handleResponse(await supabase.from('collections').select('*').eq('id', id).single()),

    create: async (data) =>
        handleResponse(await supabase.from('collections').insert(data).select()),

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
