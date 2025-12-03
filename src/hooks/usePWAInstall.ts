import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const usePWAInstall = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isInstallable, setIsInstallable] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [isAndroid, setIsAndroid] = useState(false);
    const [showManualInstructions, setShowManualInstructions] = useState(false);

    useEffect(() => {
        // Check if already installed
        const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as any).standalone ||
            document.referrer.includes('android-app://');

        setIsInstalled(isStandaloneMode);

        // Check device type
        const isIOSDevice = /iPhone|iPad|iPod/.test(navigator.userAgent);
        const isAndroidDevice = /Android/.test(navigator.userAgent);
        setIsIOS(isIOSDevice);
        setIsAndroid(isAndroidDevice);

        // Handle install prompt
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            setIsInstallable(true);
            setShowManualInstructions(false);
        };

        const handleAppInstalled = () => {
            setDeferredPrompt(null);
            setIsInstallable(false);
            setIsInstalled(true);
            setShowManualInstructions(false);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        // If Android and not installed, but no prompt available, DO NOT show manual instructions automatically
        // Just let the user click the button if they want to install

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const install = async () => {
        if (!deferredPrompt) {
            // If no prompt available, show manual instructions
            setShowManualInstructions(true);
            return false;
        }

        try {
            await deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;

            if (outcome === 'accepted') {
                setDeferredPrompt(null);
                setIsInstallable(false);
                setIsInstalled(true);
                setShowManualInstructions(false);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error installing PWA:', error);
            // If prompt fails, show manual instructions
            setShowManualInstructions(true);
            return false;
        }
    };

    const getManualInstructions = () => {
        if (isIOS) {
            return {
                title: 'Instalar no iOS',
                steps: [
                    'Toque no botão de compartilhar (ícone com seta para cima)',
                    'Role para baixo e toque em "Adicionar à Tela de Início"',
                    'Toque em "Adicionar" no canto superior direito'
                ]
            };
        }

        if (isAndroid) {
            return {
                title: 'Instalar no Android',
                steps: [
                    'Toque no menu (⋮) no canto superior direito do navegador',
                    'Selecione "Instalar app" ou "Adicionar à tela inicial"',
                    'Confirme tocando em "Instalar"'
                ]
            };
        }

        return {
            title: 'Instalar Aplicativo',
            steps: [
                'Use o menu do seu navegador',
                'Procure pela opção "Instalar" ou "Adicionar à tela inicial"'
            ]
        };
    };

    return {
        isInstallable: isInstallable || isIOS || isAndroid, // Always allow install attempt on mobile
        isInstalled,
        isIOS,
        isAndroid,
        showManualInstructions,
        install,
        getManualInstructions,
    };
};
