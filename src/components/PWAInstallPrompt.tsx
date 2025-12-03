import React, { useState, useEffect } from 'react';
import { Download, Share, PlusSquare, X, Smartphone } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';

export const PWAInstallPrompt: React.FC = () => {
    const { isInstallable, isInstalled, install, showManualInstructions, getManualInstructions } = usePWAInstall();
    const [isIOS, setIsIOS] = useState(false);
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        // Check if iOS
        const isIOSDevice = /iPhone|iPad|iPod/.test(navigator.userAgent);
        setIsIOS(isIOSDevice);

        // Show prompt if installable and not dismissed recently
        if ((isInstallable || isIOSDevice) && !isInstalled) {
            const dismissedAt = localStorage.getItem('pwa_prompt_dismissed');
            if (!dismissedAt || Date.now() - Number(dismissedAt) > 24 * 60 * 60 * 1000) {
                setShowPrompt(true);
            }
        }
    }, [isInstallable, isInstalled]);

    const handleInstallClick = async () => {
        const success = await install();
        if (success) {
            setShowPrompt(false);
        }
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        localStorage.setItem('pwa_prompt_dismissed', Date.now().toString());
    };

    if (isInstalled || !showPrompt) return null;

    const manualInstructions = getManualInstructions();

    return (
        <>
            <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white rounded-xl shadow-2xl border border-primary-100 p-4 z-40 animate-in slide-in-from-bottom duration-500">
                <button
                    onClick={handleDismiss}
                    className="absolute top-2 right-2 text-secondary-400 hover:text-secondary-600"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="flex items-start gap-4">
                    <div className="bg-primary-50 p-3 rounded-lg shrink-0">
                        <Smartphone className="w-6 h-6 text-primary-600" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-semibold text-secondary-900 mb-1">
                            ⚡ Acesso Instantâneo ao seu Negócio
                        </h3>
                        <p className="text-sm text-secondary-600 mb-3">
                            Instale na tela inicial e tenha <strong>acesso com 1 toque</strong>, <strong>tela cheia sem distrações</strong> e <strong>experiência de app nativo</strong>. Mais rápido e prático! 📱✨
                        </p>

                        {isIOS ? (
                            <div className="space-y-2 text-sm text-secondary-700 bg-secondary-50 p-3 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <Share className="w-4 h-4 text-primary-600" />
                                    <span>1. Toque em <strong>Compartilhar</strong></span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <PlusSquare className="w-4 h-4 text-primary-600" />
                                    <span>2. Selecione <strong>Adicionar à Tela de Início</strong></span>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={handleInstallClick}
                                className="btn btn-primary w-full flex items-center justify-center gap-2"
                            >
                                <Download className="w-4 h-4" />
                                Instalar Agora
                            </button>
                        )}
                    </div>
                </div>
            </div>

        </>
    );
};
