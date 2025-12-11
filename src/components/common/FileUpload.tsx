import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface FileUploadProps {
    currentUrl?: string;
    onUpload: (file: File) => Promise<string>;
    onDelete?: () => Promise<void>;
    accept?: string;
    maxSize?: number; // in bytes
    label?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
    currentUrl,
    onUpload,
    onDelete,
    accept = 'image/*',
    maxSize = 2 * 1024 * 1024, // 2MB default
    label = 'Logo da Empresa'
}) => {
    const [preview, setPreview] = useState<string | null>(currentUrl || null);
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Sync preview with currentUrl prop changes
    useEffect(() => {
        setPreview(currentUrl || null);
    }, [currentUrl]);

    const handleFile = async (file: File) => {
        // Validate file size
        if (file.size > maxSize) {
            toast.error(`Arquivo muito grande. Tamanho máximo: ${(maxSize / 1024 / 1024).toFixed(0)}MB`);
            return;
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('Por favor, selecione uma imagem');
            return;
        }

        // Show preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);

        // Upload
        setUploading(true);
        try {
            const url = await onUpload(file);
            setPreview(url);
            toast.success('Logo atualizada com sucesso!');
        } catch (error: any) {
            toast.error(error.message || 'Erro ao fazer upload');
            setPreview(currentUrl || null);
        } finally {
            setUploading(false);
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleDelete = async () => {
        if (!onDelete) return;

        if (!confirm('Tem certeza que deseja remover a logo?')) return;

        setUploading(true);
        try {
            await onDelete();
            setPreview(null);
            toast.success('Logo removida com sucesso!');
        } catch (error: any) {
            toast.error(error.message || 'Erro ao remover logo');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
                {label}
            </label>

            {/* Upload Zone */}
            <div
                className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${dragActive
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-300 hover:border-gray-400'
                    } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept={accept}
                    onChange={handleChange}
                    className="hidden"
                    disabled={uploading}
                />

                {preview ? (
                    /* Preview */
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative">
                            <img
                                src={preview}
                                alt="Logo preview"
                                className="h-32 w-32 object-contain rounded-lg border border-gray-200 bg-white p-2"
                            />
                            {uploading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
                                </div>
                            )}
                        </div>

                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                className="btn-secondary text-sm"
                            >
                                <Upload className="h-4 w-4" />
                                Alterar
                            </button>
                            {onDelete && (
                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    disabled={uploading}
                                    className="btn-secondary text-sm text-red-600 hover:bg-red-50"
                                >
                                    <X className="h-4 w-4" />
                                    Remover
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    /* Upload Prompt */
                    <div
                        className="flex flex-col items-center gap-3 cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {uploading ? (
                            <Loader2 className="h-12 w-12 animate-spin text-gray-400" />
                        ) : (
                            <ImageIcon className="h-12 w-12 text-gray-400" />
                        )}
                        <div className="text-center">
                            <p className="text-sm font-medium text-gray-700">
                                {uploading ? 'Fazendo upload...' : 'Clique ou arraste uma imagem'}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                PNG, JPG, SVG ou WEBP (máx. {(maxSize / 1024 / 1024).toFixed(0)}MB)
                            </p>
                        </div>
                    </div>
                )}
            </div>

            <p className="text-xs text-gray-500">
                Recomendado: 512x512px, formato PNG ou SVG para melhor qualidade
            </p>
        </div>
    );
};
