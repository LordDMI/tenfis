import { supabase } from '@/utils/supabaseClient';
import * as FileSystem from 'expo-file-system/legacy';

export async function uploadCertificate(
    imageUri: string | null,
    type: string | null,
    name: string | null,
    userId: string
): Promise<string | null> {
    if (!imageUri || !type || !name) {
        console.error('Missing required parameters for certificate upload:', { imageUri, type, name });
        return null;
    }

    try {
        console.log('Starting certificate upload for user:', userId);
        console.log('Certificate URI:', imageUri);
        console.log('File type:', type);
        console.log('File name:', name);

        // Validate URI format
        if (!imageUri || typeof imageUri !== 'string') {
            console.error('Invalid URI provided:', imageUri);
            return null;
        }

        // Check if file exists first
        try {
            const fileInfo = await FileSystem.getInfoAsync(imageUri);
            console.log('File info:', fileInfo);
            
            if (!fileInfo.exists) {
                console.error('File does not exist at URI:', imageUri);
                console.error('File info:', JSON.stringify(fileInfo, null, 2));
                return null;
            }
            
            if (fileInfo.size === 0) {
                console.error('File exists but is empty (size: 0)');
                return null;
            }
            
            console.log('File exists, size:', fileInfo.size, 'bytes');
        } catch (infoError: any) {
            console.error('Error checking file info:', infoError);
            console.error('Error message:', infoError?.message);
            console.error('Error code:', infoError?.code);
            console.error('URI that failed:', imageUri);
            return null;
        }

        // Read the file as base64
        let base64: string | undefined;
        try {
            const result = await FileSystem.readAsStringAsync(imageUri, {
                encoding: FileSystem.EncodingType.Base64,
            });
            
            console.log('File read result type:', typeof result);
            console.log('File read result length:', result?.length);
            
            if (result && typeof result === 'string' && result.length > 0) {
                // Validate base64 string format
                const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
                if (!base64Regex.test(result)) {
                    console.error('Invalid base64 format detected');
                    return null;
                }
                base64 = result;
                console.log('Successfully read file as base64, length:', base64.length);
            } else {
                console.error('base64 result is empty or invalid');
                return null;
            }
        } catch (readError: any) {
            console.error('Error reading file as base64:', readError);
            console.error('Error message:', readError?.message);
            console.error('Error code:', readError?.code);
            console.error('Error stack:', readError?.stack);
            console.error('This might mean:', {
                invalidUri: 'File URI is invalid or expired',
                noPermission: 'App does not have permission to access files',
                fileDeleted: 'File was deleted after selection',
                unsupportedFormat: 'File format is not supported',
                fileTooLarge: 'File is too large to read'
            });
            return null;
        }

        if (!base64 || base64.length === 0) {
            console.error('base64 conversion resulted in empty string');
            return null;
        }

        // Create unique filename
        const fileExt = name.split('.').pop() || 'pdf';
        const fileName = `certificate-${userId}-${Date.now()}.${fileExt}`;
        const filePath = `${userId}/${fileName}`;

        console.log('Uploading to path:', filePath);

        // Convert base64 to ArrayBuffer for React Native
        let byteArray: Uint8Array;
        try {
            // Clean base64 string (remove any whitespace or invalid characters)
            const base64String = base64.replace(/[^A-Za-z0-9+/=]/g, '');
            
            // Check if atob is available, if not use a polyfill
            let decodedString: string;
            if (typeof atob !== 'undefined') {
                decodedString = atob(base64String);
            } else {
                // Fallback base64 decode implementation
                const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
                let str = '';
                let i = 0;
                while (i < base64String.length) {
                    const encoded1 = chars.indexOf(base64String.charAt(i++));
                    const encoded2 = chars.indexOf(base64String.charAt(i++));
                    const encoded3 = chars.indexOf(base64String.charAt(i++));
                    const encoded4 = chars.indexOf(base64String.charAt(i++));
                    const bitmap = (encoded1 << 18) | (encoded2 << 12) | (encoded3 << 6) | encoded4;
                    str += String.fromCharCode((bitmap >> 16) & 255);
                    if (encoded3 !== 64) str += String.fromCharCode((bitmap >> 8) & 255);
                    if (encoded4 !== 64) str += String.fromCharCode(bitmap & 255);
                }
                decodedString = str;
            }
            
            const byteNumbers = new Array(decodedString.length);
            for (let i = 0; i < decodedString.length; i++) {
                byteNumbers[i] = decodedString.charCodeAt(i);
            }
            byteArray = new Uint8Array(byteNumbers);
            console.log('Successfully converted base64 to byte array, size:', byteArray.length);
        } catch (conversionError: any) {
            console.error('Error converting base64 to byte array:', conversionError);
            console.error('Conversion error message:', conversionError?.message);
            console.error('Conversion error stack:', conversionError?.stack);
            console.error('This might mean the base64 string is corrupted or invalid');
            return null;
        }

        if (!byteArray || byteArray.length === 0) {
            console.error('Byte array is empty after conversion');
            return null;
        }

        console.log('Byte array size:', byteArray.length);

        // Upload to Supabase storage using ArrayBuffer
        const { data, error } = await supabase.storage
            .from('certificates')
            .upload(filePath, byteArray, {
                contentType: type,
                upsert: false,
            });

        if (error) {
            console.error('Supabase upload error:', error);
            console.error('Troubleshooting:', {
                bucketExists: 'Check if "certificates" bucket exists in Supabase Storage',
                bucketPublic: 'Check if "certificates" bucket is set to Public',
                policies: 'Check if storage policies allow INSERT for authenticated users',
                credentials: 'Check if EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are correct'
            });
            return null;
        }

        console.log('Upload successful:', data);

        // Get public URL
        const { data: urlData } = supabase.storage
            .from('certificates')
            .getPublicUrl(filePath);

        console.log('Public URL:', urlData.publicUrl);
        return urlData.publicUrl;
    } catch (error: any) {
        console.error('Unexpected upload error:', error);
        return null;
    }
}

