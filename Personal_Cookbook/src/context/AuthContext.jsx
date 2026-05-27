import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api/auth';
import { Storage } from '../utils/storage';

const AuthContext = createContext(null);

export function AuthProvider({ children }){
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    // Restore session
    useEffect(() => {
        (async () => {
            try{
                const [storedToken, storedUser] = await Promise.all([
                    Storage.getToken(),
                    Storage.getUser(),
                ]);
                if(storedToken && storedUser){
                    setToken(storedToken);
                    setUser(storedUser);
                }
            } catch(err){
                console.warn('Session restore failed:', err.message);
            } finally{
                setLoading(false);
            }
        })();
    }, []);

    // Register
    const register = async (name, email, password) => {
        const { token: t, user: u } = await authAPI.register(name, email, password);
        await Storage.setToken(t);
        await Storage.setUser(u);
        setToken(t);
        setUser(u);
    };

    // Login
    const login = async (email, password) => {
        const { token: t, user: u } = await authAPI.login(email, password);
        await Storage.setToken(t);
        await Storage.setUser(u);
        setToken(t);
        setUser(u);
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