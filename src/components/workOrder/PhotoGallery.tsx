import React, { useState } from 'react';
import { X, Trash2, ZoomIn, Loader2 } from 'lucide-react';
import { getThumbnailUrl, getPhotoUrl } from '@/services/photoService';
import type { PhotoMetadata } from '@/services/photoService';

interface PhotoGalleryProps {
    photos: PhotoMetadata[];
    onDelete?: (photoId: string) => void;
    onPhotoClick?: (photo: PhotoMetadata) => void;
    loading?: boolean;
}

export const PhotoGallery: React.FC<PhotoGalleryProps> = ({
    photos,
    onDelete,
    onPhotoClick,
    loading = false
}) => {
    const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleImageLoad = (photoId: string) => {
        setLoadedImages(prev => new Set(prev).add(photoId));
    };

    const handleDelete = async (photoId: string, e: React.MouseEvent) => {
        e.stopPropagation();

        if (!onDelete) return;

        const confirmed = window.confirm('Deseja realmente excluir esta foto?');
        if (!confirmed) return;

        setDeletingId(photoId);
        try {
            await onDelete(photoId);
        } finally {
            setDeletingId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
            </div>
        );
    }

    if (photos.length === 0) {
        return (
            <div className="text-center py-12 bg-neutral-50 rounded-lg border border-dashed border-neutral-300">
                <ZoomIn className="w-12 h-12 mx-auto text-neutral-400 mb-3" />
                <p className="text-neutral-600 font-medium">Nenhuma foto adicionada</p>
                <p className="text-sm text-neutral-500 mt-1">
                    Use o botão acima para adicionar fotos
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((photo) => (
                <div
                    key={photo.id}
                    className="group relative aspect-square bg-neutral-100 rounded-lg overflow-hidden border border-neutral-200 hover:border-primary-400 transition-all duration-200 cursor-pointer hover:shadow-lg"
                    onClick={() => onPhotoClick?.(photo)}
                >
                    {/* Loading Skeleton */}
                    {!loadedImages.has(photo.id) && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Loader2 className="w-6 h-6 text-neutral-400 animate-spin" />
                        </div>
                    )}

                    {/* Thumbnail Image - Lazy Loaded */}
                    <img
                        src={getThumbnailUrl(photo.file_path, 300)}
                        alt={photo.description || 'Foto do veículo'}
                        loading="lazy"
                        onLoad={() => handleImageLoad(photo.id)}
                        className={`
              w-full h-full object-cover transition-opacity duration-300
              ${loadedImages.has(photo.id) ? 'opacity-100' : 'opacity-0'}
            `}
                    />

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center">
                        <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    </div>

                    {/* Delete Button */}
                    {onDelete && (
                        <button
                            onClick={(e) => handleDelete(photo.id, e)}
                            disabled={deletingId === photo.id}
                            className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all duration-200 shadow-lg disabled:opacity-50"
                            title="Excluir foto"
                        >
                            {deletingId === photo.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Trash2 className="w-4 h-4" />
                            )}
                        </button>
                    )}

                    {/* Description Badge */}
                    {photo.description && (
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <p className="text-white text-xs line-clamp-2">
                                {photo.description}
                            </p>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};
