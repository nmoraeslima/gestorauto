import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { AlertCircle, RefreshCw, X } from 'lucide-react';
import toast from 'react-hot-toast';

export function ReloadPrompt() {
    const {
        offlineReady: [offlineReady, setOfflineReady],
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(r) {
            console.log('SW Registered: ' + r);
        },
        onRegisterError(error) {
            console.log('SW registration error', error);
        },
    });

    const close = () => {
        setOfflineReady(false);
        setNeedRefresh(false);
    };

    // Show toast when offline ready
    React.useEffect(() => {
        if (offlineReady) {
            toast.success('App pronto para uso offline!');
            setOfflineReady(false);
        }
    }, [offlineReady]);

    if (!needRefresh) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
            <div className="bg-secondary-900 text-white p-4 rounded-lg shadow-lg border border-secondary-700 max-w-sm">
                <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-primary-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                        <h3 className="font-semibold text-sm mb-1">Nova versão disponível</h3>
                        <p className="text-xs text-secondary-300 mb-3">
                            Uma atualização foi instalada. Recarregue para aplicar as mudanças.
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => updateServiceWorker(true)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white text-xs font-medium rounded transition-colors"
                            >
                                <RefreshCw className="w-3 h-3" />
                                Atualizar Agora
                            </button>
                            <button
                                onClick={close}
                                className="px-3 py-1.5 bg-secondary-800 hover:bg-secondary-700 text-secondary-300 text-xs font-medium rounded transition-colors"
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                    <button
                        onClick={close}
                        className="text-secondary-400 hover:text-white transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
