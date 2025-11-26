import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { PhotoUploadZone } from './PhotoUploadZone';
import { PhotoGallery } from './PhotoGallery';
import { PhotoViewer } from './PhotoViewer';
import {
    uploadPhoto,
    deletePhoto,
    loadWorkOrderPhotos,
    type PhotoMetadata
} from '@/services/photoService';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

interface PhotoManagerProps {
    workOrderId: string;
    disabled?: boolean;
}

export const PhotoManager: React.FC<PhotoManagerProps> = ({
    workOrderId,
    disabled = false
}) => {
    const { user } = useAuth();
    const [photos, setPhotos] = useState<PhotoMetadata[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
    const [viewerOpen, setViewerOpen] = useState(false);
    const [viewerIndex, setViewerIndex] = useState(0);

    // Load photos on mount
    useEffect(() => {
        if (workOrderId) {
            loadPhotos();
        }
    }, [workOrderId]);

    const loadPhotos = async () => {
        try {
            setLoading(true);
            const data = await loadWorkOrderPhotos(workOrderId);
            setPhotos(data);
        } catch (error) {
            console.error('Error loading photos:', error);
            toast.error('Erro ao carregar fotos');
        } finally {
            setLoading(false);
        }
    };

    const handleFilesSelected = async (files: File[], category: 'before' | 'after') => {
        if (!user?.company?.id || !user?.id) {
            toast.error('Usuário não autenticado');
            return;
        }

        setUploading(true);

        const uploadPromises = files.map(async (file) => {
            const fileId = `${Date.now()}-${Math.random()}`;

            try {
                const photo = await uploadPhoto(
                    file,
                    {
                        workOrderId,
                        category,
                        companyId: user.company!.id,
                        userId: user.id
                    },
                    (progress) => {
                        setUploadProgress(prev => ({ ...prev, [fileId]: progress }));
                    }
                );

                // Add to photos list
                setPhotos(prev => [...prev, photo]);
                toast.success(`${file.name} enviada com sucesso`);
            } catch (error: any) {
                console.error('Upload error:', error);
                toast.error(`Erro ao enviar ${file.name}: ${error.message}`);
            } finally {
                // Remove progress
                setUploadProgress(prev => {
                    const newProgress = { ...prev };
                    delete newProgress[fileId];
                    return newProgress;
                });
            }
        });

        await Promise.all(uploadPromises);
        setUploading(false);
    };

    const handleDelete = async (photoId: string) => {
        try {
            await deletePhoto(photoId);
            setPhotos(prev => prev.filter(p => p.id !== photoId));
            toast.success('Foto excluída');
        } catch (error: any) {
            console.error('Delete error:', error);
            toast.error(`Erro ao excluir: ${error.message}`);
        }
    };

    const handlePhotoClick = (photo: PhotoMetadata) => {
        const index = photos.findIndex(p => p.id === photo.id);
        setViewerIndex(index);
        setViewerOpen(true);
    };

    const beforePhotos = photos.filter(p => p.category === 'before');
    const afterPhotos = photos.filter(p => p.category === 'after');

    const isUploadingAny = uploading || Object.keys(uploadProgress).length > 0;

    return (
        <div className="space-y-8">
            {/* Before Photos */}
            <div className="space-y-4">
                <PhotoUploadZone
                    category="before"
                    onFilesSelected={(files) => handleFilesSelected(files, 'before')}
                    disabled={disabled || isUploadingAny}
                />

                {isUploadingAny && (
                    <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <Loader2 className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0" />
                        <div className="flex-1">
                            <p className="text-sm font-medium text-blue-900">
                                Enviando fotos...
                            </p>
                            <p className="text-xs text-blue-700 mt-1">
                                Comprimindo e fazendo upload. Isso pode levar alguns segundos.
                            </p>
                        </div>
                    </div>
                )}

                <PhotoGallery
                    photos={beforePhotos}
                    onDelete={disabled ? undefined : handleDelete}
                    onPhotoClick={handlePhotoClick}
                    loading={loading}
                />
            </div>

            {/* After Photos */}
            <div className="space-y-4">
                <PhotoUploadZone
                    category="after"
                    onFilesSelected={(files) => handleFilesSelected(files, 'after')}
                    disabled={disabled || isUploadingAny}
                />

                <PhotoGallery
                    photos={afterPhotos}
                    onDelete={disabled ? undefined : handleDelete}
                    onPhotoClick={handlePhotoClick}
                    loading={loading}
                />
            </div>

            {/* Storage Warning */}
            {photos.length > 30 && (
                <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-amber-900">
                            Muitas fotos nesta O.S.
                        </p>
                        <p className="text-xs text-amber-700 mt-1">
                            Considere manter apenas as fotos mais importantes para economizar espaço de armazenamento.
                        </p>
                    </div>
                </div>
            )}

            {/* Photo Viewer Modal */}
            <PhotoViewer
                photos={photos}
                initialIndex={viewerIndex}
                isOpen={viewerOpen}
                onClose={() => setViewerOpen(false)}
            />
        </div>
    );
};
