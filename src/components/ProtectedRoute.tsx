import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { SubscriptionGuard } from './SubscriptionGuard';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const { user, loading, signOut } = useAuth();
    const location = useLocation();
    const [showExit, setShowExit] = useState(false);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (loading) {
            timer = setTimeout(() => setShowExit(true), 5000); // Show exit button after 5s
        } else {
            setShowExit(false);
        }
        return () => clearTimeout(timer);
    }, [loading]);

    const handleForceLogout = async () => {
        try {
            await signOut();
        } catch (error) {
            console.error('Force logout error:', error);
        } finally {
            window.location.href = '/signin'; // Hard reload to clear state
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-secondary-50 gap-4">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
                    <p className="text-secondary-600">Carregando...</p>
                </div>

                {showExit && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <p className="text-sm text-secondary-500 mb-2">Está demorando muito?</p>
                        <button
                            onClick={handleForceLogout}
                            className="text-sm text-red-600 hover:text-red-700 font-medium underline underline-offset-4"
                        >
                            Sair e tentar novamente
                        </button>
                    </div>
                )}
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/signin" replace />;
    }

    return <SubscriptionGuard>{children}</SubscriptionGuard>;
};
