import { supabase } from '../../supabase';

export const searchAPI = {
    byIngredients: async (ingredients, page = 1, limit = 12) => {
        const ingredientString = Array.isArray(ingredients)
            ? ingredients.join(',')
            : String(ingredients);

        // We use an RPC (Remote Procedure Call) because 'ingredients' is a JSONB column.
        // Standard .ilike() doesn't work on JSONB.
        // The 'search_recipes_by_ingredients' function must be created in the Supabase SQL editor.
        const { data, error } = await supabase
            .rpc('search_recipes_by_ingredients', {
                search_term: ingredientString
            });

        if (error) throw error;
        return data;
    },
};
