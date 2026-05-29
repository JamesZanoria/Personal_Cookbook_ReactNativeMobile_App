import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { recipesAPI } from '../api/recipes';

function deepEqual(a, b) {
    if (a === b) return true;
    if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) return false;
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    for (const key of keysA) {
        if (!keysB.includes(key) || !deepEqual(a[key], b[key])) return false;
    }
    return true;
}

// Fetch and manage recipes
export function useRecipes(mode = 'feed', filters = {}){
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    const filtersRef = useRef(filters);

    const fetch = useCallback(async (isRefresh = false) => {
        try{
            if(isRefresh) setRefreshing(true);
            else setLoading(true);
            setError(null);

            let data;
            if(mode === 'mine') data = await recipesAPI.getMine();
            else if(mode === 'saved') data = await recipesAPI.getSaved();
            else data = await recipesAPI.getAll(filtersRef.current);

            setRecipes(data);
        } catch(err){
            setError(err.message);
        } finally{
            setLoading(false);
            setRefreshing(false);
        }
    }, [mode]);

    useEffect(() => {
        if (!deepEqual(filters, filtersRef.current)) {
            filtersRef.current = filters;
            fetch();
        }
    }, [filters, fetch]);

    // Returning the server payload keeps bookmark state aligned across Discover, Detail, and Cookbook.
    const toggleSave = useCallback(async (id) => {
        setRecipes(prev =>
            prev.map(r => r.id === id ? {
                ...r,
                is_saved: !r.is_saved,
                save_count: Math.max((r.save_count || 0) + (r.is_saved ? -1 : 1), 0)
            } : r)
        );
        try{
            const result = await recipesAPI.toggleSave(id);
            setRecipes(prev =>
                prev.map(r => r.id === id ? {
                    ...r,
                    is_saved: result.saved,
                    save_count: result.save_count ?? r.save_count
                } : r)
            );
            return result;
        } catch{
            // Revert on error
            setRecipes(prev =>
                prev.map(r => r.id === id ? {
                    ...r,
                    is_saved: !r.is_saved,
                    save_count: Math.max((r.save_count || 0) + (r.is_saved ? 1 : -1), 0)
                } : r)
            );
            throw new Error('Failed to update bookmark');
        }
    }, []);

    const refresh = useCallback(() => fetch(true), [fetch]);

    const updateRecipe = useCallback((id, updates) => {
        setRecipes(prev =>
            prev.map(r => r.id === id ? { ...r, ...updates } : r)
        );
    }, []);

    // IMPORTANT: Memoize the return object to prevent infinite re-render loops
    // when used as a dependency in useEffect or useFocusEffect.
    return useMemo(() => ({
        recipes, loading, error, refreshing, refresh, toggleSave, updateRecipe, setRecipes
    }), [recipes, loading, error, refreshing, refresh, toggleSave, updateRecipe]);
}
