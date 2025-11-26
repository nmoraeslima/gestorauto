/**
 * Image Processing Utilities
 * Handles compression, resizing, and format conversion
 * Optimized for performance and storage efficiency
 */

export interface CompressionOptions {
    quality?: number;        // 0.0 - 1.0 (default: 0.8)
    maxWidth?: number;       // Max width in pixels (default: 1600)
    maxHeight?: number;      // Max height in pixels (default: 1600)
    format?: 'webp' | 'jpeg'; // Output format (default: 'webp')
}

export interface ImageDimensions {
    width: number;
    height: number;
}

/**
 * Compress and resize an image file
 * Converts to WebP for better compression
 */
export async function compressImage(
    file: File,
    options: CompressionOptions = {}
): Promise<Blob> {
    const {
        quality = 0.8,
        maxWidth = 1600,
        maxHeight = 1600,
        format = 'webp'
    } = options;

    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            const img = new Image();

            img.onload = () => {
                // Calculate new dimensions maintaining aspect ratio
                const dimensions = calculateDimensions(
                    img.width,
                    img.height,
                    maxWidth,
                    maxHeight
                );

                // Create canvas
                const canvas = document.createElement('canvas');
                canvas.width = dimensions.width;
                canvas.height = dimensions.height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Failed to get canvas context'));
                    return;
                }

                // Enable image smoothing for better quality
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';

                // Draw image on canvas
                ctx.drawImage(img, 0, 0, dimensions.width, dimensions.height);

                // Convert to blob
                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            resolve(blob);
                        } else {
                            reject(new Error('Failed to compress image'));
                        }
                    },
                    `image/${format}`,
                    quality
                );
            };

            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = e.target?.result as string;
        };

        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
}

/**
 * Generate a thumbnail from an image file
 */
export async function generateThumbnail(
    file: File,
    size: number = 200
): Promise<Blob> {
    return compressImage(file, {
        maxWidth: size,
        maxHeight: size,
        quality: 0.7,
        format: 'webp'
    });
}

/**
 * Calculate new dimensions maintaining aspect ratio
 */
function calculateDimensions(
    width: number,
    height: number,
    maxWidth: number,
    maxHeight: number
): ImageDimensions {
    let newWidth = width;
    let newHeight = height;

    // Check if resizing is needed
    if (width > maxWidth || height > maxHeight) {
        const aspectRatio = width / height;

        if (width > height) {
            // Landscape
            newWidth = maxWidth;
            newHeight = maxWidth / aspectRatio;
        } else {
            // Portrait
            newHeight = maxHeight;
            newWidth = maxHeight * aspectRatio;
        }
    }

    return {
        width: Math.round(newWidth),
        height: Math.round(newHeight)
    };
}

/**
 * Validate image file
 */
export function validateImageFile(file: File): string | null {
    const ALLOWED_TYPES = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'image/heic',
        'image/heif'
    ];

    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

    if (!ALLOWED_TYPES.includes(file.type)) {
        return 'Formato não suportado. Use JPEG, PNG, WebP ou HEIC.';
    }

    if (file.size > MAX_FILE_SIZE) {
        return 'Arquivo muito grande. Máximo: 10MB.';
    }

    return null;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Get image dimensions from file
 */
export async function getImageDimensions(file: File): Promise<ImageDimensions> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            const img = new Image();

            img.onload = () => {
                resolve({
                    width: img.width,
                    height: img.height
                });
            };

            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = e.target?.result as string;
        };

        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
}

/**
 * Create a preview URL for an image file
 */
export function createPreviewUrl(file: File): string {
    return URL.createObjectURL(file);
}

/**
 * Revoke a preview URL to free memory
 */
export function revokePreviewUrl(url: string): void {
    URL.revokeObjectURL(url);
}
