import React, { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Download, Loader2, ZoomIn, ZoomOut } from 'lucide-react';
import { getPhotoUrl } from '@/services/photoService';
import type { PhotoMetadata } from '@/services/photoService';

interface PhotoViewerProps {
    photos: PhotoMetadata[];
    initialIndex: number;
    isOpen: boolean;
    onClose: () => void;
}

export const PhotoViewer: React.FC<PhotoViewerProps> = ({
    photos,
    initialIndex,
    isOpen,
    onClose
}) => {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [isLoading, setIsLoading] = useState(true);
    const [zoom, setZoom] = useState(1);

    const currentPhoto = photos[currentIndex];

    useEffect(() => {
        setCurrentIndex(initialIndex);
        setZoom(1);
    }, [initialIndex, isOpen]);

    useEffect(() => {
        setIsLoading(true);
    }, [currentIndex]);

    const handlePrevious = useCallback(() => {
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
    }, [photos.length]);

    const handleNext = useCallback(() => {
        setCurrentIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
    }, [photos.length]);

    const handleDownload = useCallback(() => {
        const url = getPhotoUrl(currentPhoto.file_path);
        const link = document.createElement('a');
        link.href = url;
        link.download = currentPhoto.file_name;
        link.click();
    }, [currentPhoto]);

    const handleZoomIn = () => {
        setZoom(prev => Math.min(prev + 0.5, 3));
    };

    const handleZoomOut = () => {
        setZoom(prev => Math.max(prev - 0.5, 1));
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;

            switch (e.key) {
                case 'Escape':
                    onClose();
                    break;
                case 'ArrowLeft':
                    handlePrevious();
                    break;
                case 'ArrowRight':
                    handleNext();
                    break;
                case '+':
                case '=':
                    handleZoomIn();
                    break;
                case '-':
                case '_':
                    handleZoomOut();
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose, handlePrevious, handleNext]);

    if (!isOpen || !currentPhoto) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-95 flex items-center justify-center">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/50 to-transparent z-10">
                <div className="flex items-center justify-between max-w-7xl mx-auto">
                    <div className="text-white">
                        <p className="font-medium">{currentPhoto.file_name}</p>
                        <p className="text-sm text-neutral-300">
                            {currentIndex + 1} de {photos.length}
                            {currentPhoto.category === 'before' ? ' • Antes' : ' • Depois'}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Zoom Controls */}
                        <button
                            onClick={handleZoomOut}
                            disabled={zoom <= 1}
                            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Diminuir zoom (-)">
                            <ZoomOut className="w-5 h-5" />
                        </button>

                        <span className="text-white text-sm font-medium min-w-[3rem] text-center">
                            {Math.round(zoom * 100)}%
                        </span>

                        <button
                            onClick={handleZoomIn}
                            disabled={zoom >= 3}
                            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Aumentar zoom (+)"
                        >
                            <ZoomIn className="w-5 h-5" />
                        </button>

                        {/* Download */}
                        <button
                            onClick={handleDownload}
                            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                            title="Baixar foto"
                        >
                            <Download className="w-5 h-5" />
                        </button>

                        {/* Close */}
                        <button
                            onClick={onClose}
                            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                            title="Fechar (ESC)"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Navigation - Previous */}
            {photos.length > 1 && (
                <button
                    onClick={handlePrevious}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all z-10 backdrop-blur-sm"
                    title="Anterior (←)"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
            )}

            {/* Image Container */}
            <div className="relative w-full h-full flex items-center justify-center p-20 overflow-auto">
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="w-12 h-12 text-white animate-spin" />
                    </div>
                )}

                <img
                    src={getPhotoUrl(currentPhoto.file_path)}
                    alt={currentPhoto.description || 'Foto do veículo'}
                    onLoad={() => setIsLoading(false)}
                    className={`
            max-w-full max-h-full object-contain transition-all duration-300
            ${isLoading ? 'opacity-0' : 'opacity-100'}
          `}
                    style={{
                        transform: `scale(${zoom})`,
                        cursor: zoom > 1 ? 'move' : 'default'
                    }}
                />
            </div>

            {/* Navigation - Next */}
            {photos.length > 1 && (
                <button
                    onClick={handleNext}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all z-10 backdrop-blur-sm"
                    title="Próxima (→)"
                >
                    <ChevronRight className="w-6 h-6" />
                </button>
            )}

            {/* Description */}
            {currentPhoto.description && (
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent">
                    <div className="max-w-7xl mx-auto">
                        <p className="text-white text-center">{currentPhoto.description}</p>
                    </div>
                </div>
            )}

            {/* Backdrop Click to Close */}
            <div
                className="absolute inset-0 -z-10"
                onClick={onClose}
            />
        </div>
    );
};
