import axios from 'axios';
import { Platform } from 'react-native';
import { Storage } from '../utils/storage';

const FALLBACK_API_BASE_URL = Platform.select({
    ios: 'http://localhost:3001/api/',
    android: 'http://10.0.2.2:3001/api/',
    default: 'http://localhost:3001/api/',
});

const API_BASE_URL =
    process.env.EXPO_PUBLIC_API_BASE_URL?.trim() || FALLBACK_API_BASE_URL;

const client = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
});

// attack bearer token
client.interceptors.request.use(
    async (config) => {
        const token = await Storage.getToken();
        if(token){
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// normalise errors
client.interceptors.response.use(
    (response) => response.data,
    async (error) => {
        const message =
            error.response?.data?.error ||
            error.response?.data?.message ||
            error.message ||
            'Something went wrong';

        // Auto-clear token on 401 so AuthContext re-routes to login
        if(error.response?.status === 401) {
            await Storage.clear();
        }

        return Promise.reject(new Error(message));
    }
);

export default client;
