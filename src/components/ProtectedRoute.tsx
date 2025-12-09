import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { SubscriptionGuard } from './SubscriptionGuard';
import { Loader2, RefreshCw } from 'lucide-react';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const { user, session, loading, dataLoading, signOut, refreshUserData } = useAuth();
    const location = useLocation();
    const [showExit, setShowExit] = useState(false);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        // Show exit/retry options if loading takes too long (either session or data)
        if (loading || dataLoading) {
            timer = setTimeout(() => setShowExit(true), 5000);
        } else {
            setShowExit(false);
        }
        return () => clearTimeout(timer);
    }, [loading, dataLoading]);

    const handleForceLogout = async () => {
        try {
            await signOut();
        } catch (error) {
            console.error('Force logout error:', error);
        } finally {
            window.location.href = '/signin';
        }
    };

    // 1. Verificando sessão (Auth Loading)
    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-secondary-50 gap-4">
                <Loader2 className="w-12 h-12 text-primary-600 animate-spin" />
                <p className="text-secondary-600">Conectando...</p>
            </div>
        );
    }

    // 2. Sem sessão -> Login
    if (!session) {
        return <Navigate to="/signin" replace />;
    }

    // 3. Com sessão, carregando dados (Data Loading)
    // 3. Com sessão, carregando dados (Data Loading)
    // Only show spinner if we don't have user data yet (initial load)
    // If we already have user data (background refresh), keep the UI visible
    if (dataLoading && !user) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-secondary-50 gap-4">
                <Loader2 className="w-12 h-12 text-primary-600 animate-spin" />
                <p className="text-secondary-600">Carregando seus dados...</p>

                {showExit && (
                    <div className="flex flex-col gap-2 items-center animate-in fade-in slide-in-from-bottom-4">
                        <p className="text-sm text-secondary-500">A conexão está lenta.</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Tentar novamente
                        </button>
                    </div>
                )}
            </div>
        );
    }

    // 4. Com sessão, mas sem dados (Erro no carregamento de perfil/empresa)
    if (!user) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-secondary-50 gap-4 p-4 text-center">
                <div className="bg-white p-6 rounded-lg shadow-sm max-w-md w-full">
                    <h2 className="text-lg font-semibold text-red-600 mb-2">Erro ao carregar dados</h2>
                    <p className="text-secondary-600 mb-4">
                        Não foi possível carregar seu perfil ou empresa. Isso pode ser um problema de conexão ou permissão.
                    </p>
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => refreshUserData()}
                            className="w-full py-2 px-4 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Tentar Novamente
                        </button>
                        <button
                            onClick={handleForceLogout}
                            className="w-full py-2 px-4 border border-secondary-200 text-secondary-600 rounded-md hover:bg-secondary-50 transition-colors"
                        >
                            Sair e tentar login novamente
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // 5. Tudo certo -> App
    return <SubscriptionGuard>{children}</SubscriptionGuard>;
};
