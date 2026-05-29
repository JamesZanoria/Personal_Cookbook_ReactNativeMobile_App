import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { uploadImage } from '../api/uploads';

export function useUpload() {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);

    const pickAndUpload = async () => {
        setError(null);

        // Request permission
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if(status != 'granted'){
            setError('Camera roll permission is required');
            return null;
        }

        // Open picker
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.85,
        });

        if(result.canceled) return null;

        try{
            setUploading(true);
            const { url } = await uploadImage(result.assets[0].uri);
            return url;
        } catch(err){
            setError(err.message);
            throw err;
        } finally{
            setUploading(false);
        }
    };

    // Open the camera
    const takeAndUpload = async () => {
        setError(null);

        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if(status !== 'granted'){
            setError('Camera permission is required');
            return null;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.85,
        });

        if(result.canceled) return null;

        try{
            setUploading(true);
            const { url } = await uploadImage(result.assets[0].uri);
            return url;
        } catch(err){
            setError(err.message);
            throw err;
        } finally{
            setUploading(false);
        }
    };

    return { pickAndUpload, takeAndUpload, uploading, error };
}
