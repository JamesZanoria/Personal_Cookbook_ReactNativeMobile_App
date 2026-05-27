import { supabase } from '../../supabase';

export const authAPI = {
    // Register new account
    register: async (name, email, password) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        });
        if (error) throw error;

        // Sync with our custom users table
        if (data.user) {
            const { error: profileError } = await supabase
                .from('users')
                .insert({
                    id: data.user.id,
                    name,
                    email,
                });
            if (profileError) console.error('Profile sync error:', profileError);
        }
        return data;
    },

    // Login with email and password
    login: async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) throw error;
        return data;
    },

    // Fetch the currently logged-in user's profile
    me: async () => {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;

        const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', user?.id)
            .single();

        if (profileError) throw profileError;
        return profile;
    },

    // Update name or avatar link
    updateMe: async (data) => {
        const { data: { user } } = await supabase.auth.getUser();
        const { data: updatedProfile, error } = await supabase
            .from('users')
            .update(data)
            .eq('id', user?.id)
            .select()
            .single();

        if (error) throw error;
        return updatedProfile;
    },
};
