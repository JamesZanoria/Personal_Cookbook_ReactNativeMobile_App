import { Storage } from '../utils/storage';
import { Platform } from 'react-native';

const FALLBACK_API_BASE_URL = Platform.select({
    ios: 'http://localhost:3001/api',
    android: 'http://10.0.2.2:3001/api',
    default: 'http://localhost:3001/api',
});

const API_BASE_URL =
    process.env.EXPO_PUBLIC_API_BASE_URL?.trim() || FALLBACK_API_BASE_URL;

// Upload a local image URI to the server
export const uploadImage = async (localUri) => {
    const token = await Storage.getToken();
    const filename = localUri.split('/').pop();
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    const formData = new FormData();
    formData.append('image', { uri: localUri, name: filename, type });

    const response = await fetch(`${API_BASE_URL}/uploads/image`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
        },
        body: formData,
    });

    if(!response.ok){
        const err = await response.json();
        throw new Error(err.error || 'Upload failed');
    }

    return response.json();
};
