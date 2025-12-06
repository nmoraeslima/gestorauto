import React, { useEffect } from 'react';
import { ShieldCheck, Check, Star, X } from 'lucide-react';

interface UpgradePromptProps {
    title?: string;
    description?: string;
    feature?: string;
    isOpen?: boolean;
    onClose?: () => void;
}

export const UpgradePrompt: React.FC<UpgradePromptProps> = ({
    title = "Funcionalidade Exclusiva",
    description = "Esta funcionalidade não está disponível no seu plano atual.",
    feature,
    isOpen,
    onClose
}) => {
    // Escape key handler for modal
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (isOpen && onClose && e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    const Content = (
        <div className={`flex flex-col items-center justify-center p-8 bg-neutral-50 rounded-lg border border-neutral-200 text-center relative ${isOpen ? 'shadow-2xl max-w-md w-full bg-white border-0' : ''}`}>
            {isOpen && onClose && (
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>
            )}

            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-6">
                <Star className="w-8 h-8 text-primary-600" />
            </div>

            <h3 className="text-xl font-bold text-secondary-900 mb-2">{title}</h3>
            <p className="text-neutral-600 mb-8 max-w-md">
                {description}
                {feature && <span className="block mt-2 font-medium text-secondary-800">Recurso: {feature}</span>}
            </p>

            <div className="bg-white p-6 rounded-lg shadow-sm w-full max-w-sm border border-neutral-200 text-left">
                <h4 className="font-semibold text-lg text-secondary-900 mb-4">Atualize para desbloquear:</h4>
                <ul className="space-y-3 mb-6">
                    <li className="flex items-center text-sm text-neutral-600">
                        <Check className="w-4 h-4 text-green-500 mr-2" />
                        Acesso ao Painel Financeiro
                    </li>
                    <li className="flex items-center text-sm text-neutral-600">
                        <Check className="w-4 h-4 text-green-500 mr-2" />
                        Lembretes de Retorno (CRM)
                    </li>
                    <li className="flex items-center text-sm text-neutral-600">
                        <Check className="w-4 h-4 text-green-500 mr-2" />
                        Painel de TV e Links Públicos (Premium)
                    </li>
                </ul>
                <button
                    onClick={() => window.location.href = '/subscription/plans'}
                    className="w-full btn btn-primary"
                >
                    Ver Planos de Assinatura
                </button>
            </div>
        </div>
    );

    if (isOpen) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="animate-in zoom-in-95 duration-200 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                    {Content}
                </div>
            </div>
        );
    }

    return Content;
};
