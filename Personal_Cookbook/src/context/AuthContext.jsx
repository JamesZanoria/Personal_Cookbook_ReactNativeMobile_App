import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api/auth';
import { Storage } from '../utils/storage';
import { supabase } from '../../supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }){
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    // Helper to fetch the full profile from the 'users' table
    const fetchUserProfile = async (userId) => {
        try {
            // Try a few times in case the database trigger is still processing
            for (let i = 0; i < 3; i++) {
                const profile = await authAPI.me();
                if (profile && profile.name) return profile;
                await sleep(500);
            }
            return null;
        } catch (err) {
            console.error('Could not fetch user profile:', err);
            return null;
        }
    };

    // Restore session
    useEffect(() => {
        (async () => {
            try {
                const storedToken = await Storage.getToken();
                if (storedToken) {
                    const { data: { user: authUser } } = await supabase.auth.getUser();
                    if (authUser) {
                        const profile = await fetchUserProfile(authUser.id);
                        setToken(storedToken);
                        setUser(profile || authUser);
                    }
                }
            } catch(err){
                console.warn('Session restore failed:', err.message);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    // Register
    const register = async (name, email, password) => {
        const data = await authAPI.register(name, email, password);
        const session = data.session;
        const authUser = data.user;

        if (session?.access_token) {
            await Storage.setToken(session.access_token);
        }

        // Wait a moment for the Supabase trigger to create the public.users row
        await sleep(1000);
        const profile = await fetchUserProfile(authUser?.id);

        setToken(session?.access_token || null);
        setUser(profile || authUser);
    };

    // Login
    const login = async (email, password) => {
        const data = await authAPI.login(email, password);
        const session = data.session;
        const authUser = data.user;

        if (session?.access_token) {
            await Storage.setToken(session.access_token);
        }

        const profile = await fetchUserProfile(authUser?.id);
        setToken(session?.access_token || null);
        setUser(profile || authUser);
    };

    // Logout
    const logout = async () => {
        await Storage.clear();
        setToken(null);
        setUser(null);
    };

    // Update local user cache
    const updateUser = async (updates) => {
        const updated = { ...user, ...updates };
        await Storage.setUser(updated);
        setUser(updated);
    };

    return(
        <AuthContext.Provider value={{ user, token, loading, register, login, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if(!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
    return ctx;
};
