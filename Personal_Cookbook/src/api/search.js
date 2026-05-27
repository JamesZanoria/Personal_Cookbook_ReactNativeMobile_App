import client from './client';

export const searchAPI = {
    byIngredients: (ingredients, page = 1, limit = 12) => {
        const ingredientString = Array.isArray(ingredients)
            ? ingredients.join(',')
            : String(ingredients);

        return client.get('/search/by-ingredients', {
            params: {
                ingredients: ingredientString,
                page:        String(page),
                limit:       String(limit),
            },
        });
    },
};