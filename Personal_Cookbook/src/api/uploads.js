import { supabase } from '../../supabase';

const uriToBlob = (uri) => {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = function () {
            resolve(xhr.response);
        };
        xhr.onerror = function (e) {
            reject(new TypeError('Network request failed'));
        };
        xhr.responseType = 'blob';
        xhr.open('GET', uri, true);
        xhr.send(null);
    });
};

export const uploadImage = async (localUri) => {
    try {
        // 1. Handle Android content:// URIs by ensuring we have a proper extension
        let fileExt = localUri.split('.').pop().toLowerCase();
        if (!fileExt || fileExt.length > 4) {
            // Fallback for content:// URIs or paths without extensions
            fileExt = 'jpg';
        }

        // 2. Convert local image URI to blob using XMLHttpRequest (more stable on Android)
        const blob = await uriToBlob(localUri);

        // 3. Generate a unique filename in the 'uploads' bucket
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;

        // 4. Upload to Supabase Storage bucket 'uploads'
        const { data, error } = await supabase.storage
            .from('uploads')
            .upload(fileName, blob, {
                contentType: `image/${fileExt === 'png' ? 'png' : 'jpeg'}`,
                upsert: true
            });

        if (error) throw error;

        // 5. Get the public URL for the uploaded file
        const { data: { publicUrl } } = supabase.storage
            .from('uploads')
            .getPublicUrl(fileName);

        return { url: publicUrl };
    } catch (error) {
        console.error('Upload error detailed:', error);
        throw new Error(error.message || 'Upload failed');
    }
};
