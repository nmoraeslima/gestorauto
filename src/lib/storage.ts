import { supabase } from './supabase';

const BUCKET_NAME = 'vehicle-photos';

/**
 * Upload a photo to Supabase Storage
 */
export const uploadVehiclePhoto = async (
    companyId: string,
    vehicleId: string,
    file: File
): Promise<{ url: string | null; error: Error | null }> => {
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${companyId}/${vehicleId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false,
            });

        if (uploadError) {
            throw uploadError;
        }

        const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);

        return { url: data.publicUrl, error: null };
    } catch (error) {
        console.error('Error uploading photo:', error);
        return { url: null, error: error as Error };
    }
};

/**
 * Delete a photo from Supabase Storage
 */
export const deleteVehiclePhoto = async (photoUrl: string): Promise<{ error: Error | null }> => {
    try {
        // Extract file path from URL
        const url = new URL(photoUrl);
        const pathParts = url.pathname.split(`/${BUCKET_NAME}/`);
        if (pathParts.length < 2) {
            throw new Error('Invalid photo URL');
        }
        const filePath = pathParts[1];

        const { error } = await supabase.storage.from(BUCKET_NAME).remove([filePath]);

        if (error) {
            throw error;
        }

        return { error: null };
    } catch (error) {
        console.error('Error deleting photo:', error);
        return { error: error as Error };
    }
};

/**
 * Delete multiple photos from Supabase Storage
 */
export const deleteVehiclePhotos = async (photoUrls: string[]): Promise<{ error: Error | null }> => {
    try {
        const filePaths = photoUrls.map((url) => {
            const urlObj = new URL(url);
            const pathParts = urlObj.pathname.split(`/${BUCKET_NAME}/`);
            return pathParts[1];
        });

        const { error } = await supabase.storage.from(BUCKET_NAME).remove(filePaths);

        if (error) {
            throw error;
        }

        return { error: null };
    } catch (error) {
        console.error('Error deleting photos:', error);
        return { error: error as Error };
    }
};

/**
 * Get public URL for a photo
 */
export const getVehiclePhotoUrl = (filePath: string): string => {
    const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
    return data.publicUrl;
};
