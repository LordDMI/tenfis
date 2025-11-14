import { supabase } from '@/utils/supabaseClient';
import * as FileSystem from 'expo-file-system/legacy';

export async function uploadProfilePicture(
    imageUri: string | null,
    type: string | null,
    name: string | null,
    userId: string
): Promise<string | null> {
    if (!imageUri || !type || !name) {
        console.error('Missing required parameters for avatar upload:', { imageUri, type, name });
        return null;
    }

    try {
        console.log('Starting avatar upload for user:', userId);
        console.log('Image URI:', imageUri);
        console.log('File type:', type);
        console.log('File name:', name);

        // Check if file exists first
        try {
            const fileInfo = await FileSystem.getInfoAsync(imageUri);
            if (!fileInfo.exists) {
                console.error('File does not exist at URI:', imageUri);
                return null;
            }
            console.log('File exists, size:', fileInfo.size);
        } catch (infoError: any) {
            console.error('Error checking file info:', infoError.message);
            return null;
        }

        // Read the file as base64
        let base64: string | undefined;
        try {
            const result = await FileSystem.readAsStringAsync(imageUri, {
                encoding: FileSystem.EncodingType.Base64,
            });
            if (result && typeof result === 'string' && result.length > 0) {
                base64 = result;
                console.log('Successfully read file as base64, length:', base64.length);
            } else {
                console.error('base64 result is empty or invalid');
                return null;
            }
        } catch (readError: any) {
            console.error('Error reading file as base64:', readError.message);
            console.error('Error details:', {
                code: readError.code,
                message: readError.message,
                stack: readError.stack
            });
            console.error('This might mean:', {
                invalidUri: 'File URI is invalid or expired',
                noPermission: 'App does not have permission to access files',
                fileDeleted: 'File was deleted after selection',
                unsupportedFormat: 'File format is not supported'
            });
            return null;
        }

        if (!base64 || base64.length === 0) {
            console.error('base64 conversion resulted in empty string');
            return null;
        }

        // Create unique filename
        const fileExt = name.split('.').pop() || 'jpg';
        const fileName = `${userId}-${Date.now()}.${fileExt}`;
        const filePath = `${userId}/${fileName}`;

        console.log('Uploading to path:', filePath);

        // Convert base64 to ArrayBuffer for React Native
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);

        console.log('Byte array size:', byteArray.length);

        // Upload to Supabase storage using ArrayBuffer
        const { data, error } = await supabase.storage
            .from('avatars')
            .upload(filePath, byteArray, {
                contentType: type,
                upsert: false,
            });

        if (error) {
            console.error('Supabase upload error:', error);
            console.error('Troubleshooting:', {
                bucketExists: 'Check if "avatars" bucket exists in Supabase Storage',
                bucketPublic: 'Check if "avatars" bucket is set to Public',
                policies: 'Check if storage policies allow INSERT for authenticated users',
                credentials: 'Check if EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are correct'
            });
            return null;
        }

        console.log('Upload successful:', data);

        // Get public URL
        const { data: urlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);

        console.log('Public URL:', urlData.publicUrl);
        return urlData.publicUrl;
    } catch (error: any) {
        console.error('Unexpected upload error:', error);
        return null;
    }
}
