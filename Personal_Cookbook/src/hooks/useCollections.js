import { useState, useEffect, useCallback } from 'react';
import { collectionsAPI } from '../api/collections';

export function useCollections(){
    const [collections, setCollections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchAll = useCallback(async () => {
        try{
            setLoading(true);
            setError(null);
            const data = await collectionsAPI.getAll();
            setCollections(data);
        } catch(err){
            setError(err.message);
        } finally{
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const createCollection = async (name, description) => {
        const newCol = await collectionsAPI.create({ name, description });
        setCollections(prev => [newCol, ...prev]);
        return newCol;
    };

    const deleteCollection = async (id) => {
        await collectionsAPI.remove(id);
        setCollections(prev => prev.filter(c => c.id !== id));
    };

    const addRecipeToCollection = async (collectionId, recipeId) => {
        await collectionsAPI.addRecipe(collectionId, recipeId);
    };

    return {
        collections, loading, error,
        refresh: fetchAll,
        createCollection,
        deleteCollection,
        addRecipeToCollection,
    };
}