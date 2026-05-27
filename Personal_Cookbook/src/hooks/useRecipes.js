import { useState, useEffect, useCallback } from 'react';
import { recipesAPI } from '../api/recipes';

// Fetch and manage recipes
export function useRecipes(mode = 'feed', filters = {}){
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    const fetch = useCallback(async (isRefresh = false) => {
        try{
            if(isRefresh) setRefreshing(true);
            else setLoading(true);
            setError(null);

            let data;
            if(mode === 'mine') data = await recipesAPI.getMine();
            else if(mode === 'saved') data = await recipesAPI.getSaved();
            else data = await recipesAPI.getAll(filters);

            setRecipes(data);
        } catch(err){
            setError(err.message);
        } finally{
            setLoading(false);
            setRefreshing(false);
        }
    }, [mode, JSON.stringify(filters)]);

    useEffect(() => { fetch(); }, [fetch]);

    // Returning the server payload keeps bookmark state aligned across Discover, Detail, and Cookbook.
    const toggleSave = useCallback(async (id) => {
        setRecipes(prev =>
            prev.map(r => r.id === id ? { ...r, is_saved: !r.is_saved } : r)
        );
        try{
            const result = await recipesAPI.toggleSave(id);
            setRecipes(prev =>
                prev.map(r => r.id === id ? { ...r, is_saved: result.saved, save_count: result.save_count ?? r.save_count } : r)
            );
            return result;
        } catch{
            // Revert on error
            setRecipes(prev =>
                prev.map(r => r.id === id ? { ...r, is_saved: !r.is_saved } : r)
            );
            throw new Error('Failed to update bookmark');
        }
    }, []);

    const refresh = useCallback(() => fetch(true), [fetch]);

    return { recipes, loading, error, refreshing, refresh, toggleSave, setRecipes };
}
