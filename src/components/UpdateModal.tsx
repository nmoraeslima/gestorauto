import React from 'react';
import { Sparkles, Rocket, X, DownloadCloud } from 'lucide-react';

interface ReleaseNote {
    version: string;
    title: string;
    description: string;
    notes: string[];
    date: string;
}

interface UpdateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpdate: () => void;
    releaseNote: ReleaseNote | null;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({ isOpen, onClose, onUpdate, releaseNote }) => {
    if (!isOpen || !releaseNote) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-gradient-to-r from-primary-600 to-primary-500 p-6 text-white relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-primary-100 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-white/20 p-2 rounded-lg">
                            <Rocket className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">{releaseNote.title}</h2>
                            <p className="text-primary-100 text-sm">Versão {releaseNote.version}</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    <p className="text-gray-600 mb-4 text-sm">
                        {releaseNote.description}
                    </p>

                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 mb-6">
                        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-yellow-500" />
                            Novidades
                        </h3>
                        <ul className="space-y-2.5">
                            {releaseNote.notes.map((note, index) => (
                                <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                                    <span className="block w-1.5 h-1.5 rounded-full bg-primary-400 mt-1.5 shrink-0" />
                                    {note}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                        >
                            Depois
                        </button>
                        <button
                            onClick={onUpdate}
                            className="flex-1 px-4 py-2.5 text-white bg-primary-600 hover:bg-primary-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            <DownloadCloud className="w-4 h-4" />
                            Atualizar Agora
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
