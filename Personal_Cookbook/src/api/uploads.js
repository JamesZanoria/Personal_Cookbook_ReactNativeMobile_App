import { supabase } from '../../supabase';

export const uploadImage = async (localUri) => {
    try {
        // 1. Convert local image URI to blob
        const response = await fetch(localUri);
        const blob = await response.blob();

        // 2. Generate a unique filename
        const fileExt = localUri.split('.').pop().toLowerCase();
        const fileName = `uploads/${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt || 'jpg'}`;

        // 3. Upload to Supabase Storage bucket 'uploads'
        const { data, error } = await supabase.storage
            .from('uploads')
            .upload(fileName, blob, {
                contentType: `image/${fileExt || 'jpg'}`,
                upsert: true
            });

        if (error) throw error;

        // 4. Get the public URL for the uploaded file
        const { data: { publicUrl } } = supabase.storage
            .from('uploads')
            .getPublicUrl(fileName);

        return { url: publicUrl };
    } catch (error) {
        console.error('Upload error:', error);
        throw new Error(error.message || 'Upload failed');
    }
};
