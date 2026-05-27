import client from './client';

export const authAPI = {
    // Register new account
    register: (name, email, password) => 
        client.post('/auth/register', { name, email, password }),

    // Login with email and password
    login: (email, password) => 
        client.post('/auth/login', { email, password }),

    // Fetch the currently logged-in user's profile
    me: () => client.get('/auth/me'),

    // Update name or avatar link
    updateMe: (data) => client.put('/auth/me', data),
};