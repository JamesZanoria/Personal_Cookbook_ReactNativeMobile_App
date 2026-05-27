import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'da_token';
const USER_KEY = 'da_user';

export const Storage = {
    // Token
    async getToken(){
        return await SecureStore.getItemAsync(TOKEN_KEY);
    },
    async setToken(token){
        await SecureStore.setItemAsync(TOKEN_KEY, token);
    },
    async removeToken(){
        await SecureStore.deleteItemAsync(TOKEN_KEY);
    },

    // User
    async getUser(){
        const raw = await SecureStore.getItemAsync(USER_KEY);
        return raw ? JSON.parse(raw) : null;
    },
    async setUser(user){
        await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
    },
    async removeUser(){
        await SecureStore.deleteItemAsync(USER_KEY);
    },

    // Clear all
    async clear(){
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        await SecureStore.deleteItemAsync(USER_KEY);
    },
};