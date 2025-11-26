import React, { useCallback, useState } from 'react';
import { Upload, Camera, Image as ImageIcon, Loader2 } from 'lucide-react';
import { validateImageFile, formatFileSize } from '@/utils/imageProcessing';
import toast from 'react-hot-toast';

interface PhotoUploadZoneProps {
    category: 'before' | 'after';
    onFilesSelected: (files: File[]) => void;
    maxFiles?: number;
    disabled?: boolean;
}

export const PhotoUploadZone: React.FC<PhotoUploadZoneProps> = ({
    category,
    onFilesSelected,
    maxFiles = 20,
    disabled = false
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleFiles = useCallback(async (fileList: FileList) => {
        setIsProcessing(true);
        const files = Array.from(fileList);
        const validFiles: File[] = [];

        // Validate each file
        for (const file of files) {
            const error = validateImageFile(file);
            if (error) {
                toast.error(`${file.name}: ${error}`);
            } else {
                validFiles.push(file);
            }
        }

        if (validFiles.length > maxFiles) {
            toast.error(`Máximo de ${maxFiles} fotos por vez`);
            setIsProcessing(false);
            return;
        }

        if (validFiles.length > 0) {
            onFilesSelected(validFiles);
        }

        setIsProcessing(false);
    }, [onFilesSelected, maxFiles]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        if (disabled) return;

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFiles(files);
        }
    }, [disabled, handleFiles]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        if (!disabled) {
            setIsDragging(true);
        }
    }, [disabled]);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleFiles(files);
        }
        // Reset input
        e.target.value = '';
    }, [handleFiles]);

    const handleCameraCapture = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleFiles(files);
        }
        // Reset input
        e.target.value = '';
    }, [handleFiles]);

    const categoryLabel = category === 'before' ? 'Antes do Serviço' : 'Depois do Serviço';

    return (
        <div className="space-y-3">
            <h4 className="font-medium text-secondary-700 text-sm uppercase tracking-wide">
                {categoryLabel}
            </h4>

            {/* Upload Zone */}
            <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`
          relative border-2 border-dashed rounded-lg p-6 transition-all duration-200
          ${isDragging
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-neutral-300 bg-neutral-50 hover:border-primary-400 hover:bg-primary-50/50'
                    }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
            >
                {isProcessing ? (
                    <div className="flex flex-col items-center justify-center py-4">
                        <Loader2 className="w-8 h-8 text-primary-600 animate-spin mb-2" />
                        <p className="text-sm text-neutral-600">Processando...</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center text-center">
                        <div className="flex gap-2 mb-3">
                            <div className="p-3 bg-primary-100 rounded-full">
                                <Upload className="w-6 h-6 text-primary-600" />
                            </div>
                            <div className="p-3 bg-primary-100 rounded-full md:hidden">
                                <Camera className="w-6 h-6 text-primary-600" />
                            </div>
                        </div>

                        <p className="text-sm font-medium text-secondary-700 mb-1">
                            Arraste fotos aqui ou clique para selecionar
                        </p>
                        <p className="text-xs text-neutral-500 mb-4">
                            JPEG, PNG, WebP • Máx 10MB • Até {maxFiles} fotos
                        </p>

                        {/* Buttons */}
                        <div className="flex gap-2 flex-wrap justify-center">
                            {/* File Input */}
                            <label className="btn btn-secondary btn-sm cursor-pointer">
                                <ImageIcon className="w-4 h-4 mr-2" />
                                Escolher Arquivos
                                <input
                                    type="file"
                                    accept="image/jpeg,image/jpg,image/png,image/webp,image/heic"
                                    multiple
                                    onChange={handleFileInput}
                                    disabled={disabled}
                                    className="hidden"
                                />
                            </label>

                            {/* Camera Input (Mobile) */}
                            <label className="btn btn-primary btn-sm cursor-pointer md:hidden">
                                <Camera className="w-4 h-4 mr-2" />
                                Tirar Foto
                                <input
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    onChange={handleCameraCapture}
                                    disabled={disabled}
                                    className="hidden"
                                />
                            </label>
                        </div>
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="flex items-start gap-2 text-xs text-neutral-500 bg-blue-50 p-3 rounded-lg border border-blue-100">
                <ImageIcon className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                    <p className="font-medium text-blue-900 mb-1">Dica:</p>
                    <p className="text-blue-700">
                        As fotos serão automaticamente comprimidas para economizar espaço e melhorar o carregamento.
                    </p>
                </div>
            </div>
        </div>
    );
};
