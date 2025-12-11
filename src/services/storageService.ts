import { supabase } from '@/lib/supabase';

interface UploadResult {
    url: string;
    path: string;
}

class StorageService {
    private readonly BUCKET_NAME = 'company-logos';

    /**
     * Upload company logo to Supabase Storage
     */
    async uploadCompanyLogo(companyId: string, file: File): Promise<UploadResult> {
        try {
            // Validate file
            this.validateFile(file);

            // Delete old logo if exists
            await this.deleteCompanyLogo(companyId);

            // Generate file path with timestamp to avoid caching
            const fileExt = file.name.split('.').pop();
            const timestamp = Date.now();
            const filePath = `${companyId}/logo-${timestamp}.${fileExt}`;

            // Upload file
            const { data, error } = await supabase.storage
                .from(this.BUCKET_NAME)
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false // Don't overwrite, always create new
                });

            if (error) throw error;

            // Get public URL with cache busting
            const url = this.getPublicUrl(data.path);

            return {
                url,
                path: data.path
            };
        } catch (error: any) {
            console.error('Error uploading logo:', error);
            throw new Error(error.message || 'Erro ao fazer upload da logo');
        }
    }

    /**
     * Delete company logo from storage
     */
    async deleteCompanyLogo(companyId: string): Promise<void> {
        try {
            // List all files in company folder
            const { data: files, error: listError } = await supabase.storage
                .from(this.BUCKET_NAME)
                .list(companyId);

            if (listError) throw listError;

            // Delete all files (should be just one logo)
            if (files && files.length > 0) {
                const filesToDelete = files.map(file => `${companyId}/${file.name}`);

                const { error: deleteError } = await supabase.storage
                    .from(this.BUCKET_NAME)
                    .remove(filesToDelete);

                if (deleteError) throw deleteError;
            }
        } catch (error: any) {
            console.error('Error deleting logo:', error);
            // Don't throw error if file doesn't exist
            if (!error.message?.includes('not found')) {
                throw error;
            }
        }
    }

    /**
     * Get public URL for a file
     */
    getPublicUrl(path: string): string {
        const { data } = supabase.storage
            .from(this.BUCKET_NAME)
            .getPublicUrl(path);

        return data.publicUrl;
    }

    /**
     * Validate file before upload
     */
    private validateFile(file: File): void {
        // Check file size (2MB max)
        const maxSize = 2 * 1024 * 1024; // 2MB
        if (file.size > maxSize) {
            throw new Error('Arquivo muito grande. Tamanho máximo: 2MB');
        }

        // Check file type
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            throw new Error('Formato não suportado. Use PNG, JPG, SVG ou WEBP');
        }
    }
}

export const storageService = new StorageService();
