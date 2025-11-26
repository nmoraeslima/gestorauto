/**
 * Photo Upload Service
 * Handles uploading photos to Supabase Storage and saving metadata
 */

import { supabase } from '@/lib/supabase';
import { compressImage, validateImageFile } from '@/utils/imageProcessing';

export interface PhotoUploadOptions {
    workOrderId: string;
    category: 'before' | 'after';
    description?: string;
    companyId: string;
    userId: string;
}

export interface PhotoMetadata {
    id: string;
    file_path: string;
    file_name: string;
    file_size: number;
    mime_type: string;
    category: 'before' | 'after';
    description?: string;
    created_at: string;
}

const STORAGE_BUCKET = 'work-order-photos';

/**
 * Upload a photo to Supabase Storage and save metadata
 */
export async function uploadPhoto(
    file: File,
    options: PhotoUploadOptions,
    onProgress?: (progress: number) => void
): Promise<PhotoMetadata> {
    // Validate file
    const validationError = validateImageFile(file);
    if (validationError) {
        throw new Error(validationError);
    }

    // Compress image
    if (onProgress) onProgress(10);
    const compressedBlob = await compressImage(file, {
        quality: 0.8,
        maxWidth: 1600,
        maxHeight: 1600,
        format: 'webp'
    });

    if (onProgress) onProgress(40);

    // Generate file path
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    const fileName = `${timestamp}-${randomId}.webp`;
    const filePath = `${options.companyId}/${options.workOrderId}/${options.category}/${fileName}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, compressedBlob, {
            contentType: 'image/webp',
            cacheControl: '3600',
            upsert: false
        });

    if (uploadError) {
        throw new Error(`Erro ao fazer upload: ${uploadError.message}`);
    }

    if (onProgress) onProgress(70);

    // Save metadata to database
    const { data, error: dbError } = await supabase
        .from('work_order_photos')
        .insert({
            company_id: options.companyId,
            work_order_id: options.workOrderId,
            file_path: filePath,
            file_name: file.name,
            file_size: compressedBlob.size,
            mime_type: 'image/webp',
            category: options.category,
            description: options.description || null,
            created_by: options.userId
        })
        .select()
        .single();

    if (dbError) {
        // Rollback: delete uploaded file
        await supabase.storage.from(STORAGE_BUCKET).remove([filePath]);
        throw new Error(`Erro ao salvar metadados: ${dbError.message}`);
    }

    if (onProgress) onProgress(100);

    return data as PhotoMetadata;
}

/**
 * Get public URL for a photo
 */
export function getPhotoUrl(filePath: string): string {
    const { data } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(filePath);

    return data.publicUrl;
}

/**
 * Get thumbnail URL with transformation
 */
export function getThumbnailUrl(filePath: string, size: number = 200): string {
    const { data } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(filePath, {
            transform: {
                width: size,
                height: size,
                resize: 'cover'
            }
        });

    return data.publicUrl;
}

/**
 * Delete a photo from storage and database
 */
export async function deletePhoto(photoId: string): Promise<void> {
    // Get photo metadata
    const { data: photo, error: fetchError } = await supabase
        .from('work_order_photos')
        .select('file_path')
        .eq('id', photoId)
        .single();

    if (fetchError || !photo) {
        throw new Error('Foto não encontrada');
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([photo.file_path]);

    if (storageError) {
        console.error('Erro ao deletar do storage:', storageError);
        // Continue anyway to delete from database
    }

    // Delete from database
    const { error: dbError } = await supabase
        .from('work_order_photos')
        .delete()
        .eq('id', photoId);

    if (dbError) {
        throw new Error(`Erro ao deletar foto: ${dbError.message}`);
    }
}

/**
 * Load photos for a work order
 */
export async function loadWorkOrderPhotos(
    workOrderId: string
): Promise<PhotoMetadata[]> {
    const { data, error } = await supabase
        .from('work_order_photos')
        .select('*')
        .eq('work_order_id', workOrderId)
        .order('category', { ascending: true })
        .order('created_at', { ascending: true });

    if (error) {
        throw new Error(`Erro ao carregar fotos: ${error.message}`);
    }

    return data as PhotoMetadata[];
}

/**
 * Get storage usage statistics
 */
export async function getStorageStats(companyId: string): Promise<{
    totalPhotos: number;
    totalSize: number;
    totalSizeGB: number;
}> {
    const { data, error } = await supabase
        .from('work_order_photos')
        .select('file_size')
        .eq('company_id', companyId);

    if (error) {
        throw new Error(`Erro ao obter estatísticas: ${error.message}`);
    }

    const totalSize = data.reduce((sum, photo) => sum + photo.file_size, 0);

    return {
        totalPhotos: data.length,
        totalSize,
        totalSizeGB: totalSize / (1024 * 1024 * 1024)
    };
}

/**
 * Cleanup old photos (called by cron job or manually)
 */
export async function cleanupOldPhotos(): Promise<number> {
    const { data, error } = await supabase.rpc('cleanup_old_work_order_photos');

    if (error) {
        throw new Error(`Erro ao limpar fotos antigas: ${error.message}`);
    }

    return data as number;
}
