import React from 'react';
import { Rocket, X, Gift, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ReleaseNote {
    version: string;
    title: string;
    description: string;
    date: string;
}

interface UpdateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpdate: () => void; // Kept for interface compatibility but main action is now redirect
    releaseNote: ReleaseNote | null;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({ isOpen, onClose, releaseNote }) => {
    const navigate = useNavigate();

    if (!isOpen || !releaseNote) return null;

    const handleSeeNews = () => {
        onClose();
        navigate('/settings/releases');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-gradient-to-r from-primary-600 to-purple-600 p-6 text-white relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-3 mb-1">
                        <Gift className="w-6 h-6 text-yellow-300" />
                        <Rocket className="w-5 h-5 text-white" />
                        <h2 className="text-xl font-bold">Novidades Chegaram!</h2>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 bg-gradient-to-b from-primary-50 to-white">
                    <p className="text-secondary-600 mb-6 text-base leading-relaxed">
                        Temos atualizações incríveis para você! Descubra todas as melhorias e novidades que preparamos para tornar seu trabalho ainda mais eficiente.
                    </p>

                    <div className="flex gap-3">
                        <button
                            onClick={handleSeeNews}
                            className="flex-1 px-4 py-3 text-secondary-900 bg-yellow-400 hover:bg-yellow-300 rounded-lg font-bold transition-colors flex items-center justify-center gap-2 shadow-sm"
                        >
                            <Gift className="w-4 h-4" />
                            Ver Novidades
                        </button>
                        <button
                            onClick={onClose}
                            className="px-6 py-3 text-secondary-600 bg-white border border-secondary-200 hover:bg-secondary-50 rounded-lg font-medium transition-colors"
                        >
                            Depois
                        </button>
                    </div>

                    <p className="text-center text-xs text-secondary-400 mt-4">
                        Versão {releaseNote.version} disponível
                    </p>
                </div>
            </div>
        </div>
    );
};
