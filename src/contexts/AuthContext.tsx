import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Profile, Company, SignUpData, SignInData, AuthUser } from '@/types/database';
import { notificationService } from '@/services/notificationService';
import toast from 'react-hot-toast';

interface AuthContextType {
    user: AuthUser | null;
    session: Session | null;
    loading: boolean; // Session loading
    dataLoading: boolean; // Profile/Company loading
    signUp: (data: SignUpData) => Promise<{ error: AuthError | null }>;
    signIn: (data: SignInData) => Promise<{ error: AuthError | null }>;
    signOut: () => Promise<void>;
    resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
    refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true); // Inicialmente true para verificar sessão
    const [dataLoading, setDataLoading] = useState(false); // Loading específico de dados

    // Carregar dados do perfil e empresa
    const loadUserData = async (authUser: User) => {
        // Se já estiver carregando, não inicia outro request
        if (dataLoading) return;

        setDataLoading(true);
        try {


            // Buscar perfil
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', authUser.id)
                .single();

            if (profileError) throw profileError;
            if (!profile) throw new Error('Profile not found');

            // Buscar empresa
            const { data: company, error: companyError } = await supabase
                .from('companies')
                .select('*')
                .eq('id', profile.company_id)
                .single();

            if (companyError) throw companyError;
            if (!company) throw new Error('Company not found');

            setUser({
                id: authUser.id,
                email: authUser.email!,
                profile: profile as Profile,
                company: company as Company,
            });

            // Initialize notifications after successful login
            await notificationService.registerServiceWorker();
            const hasPermission = await notificationService.requestPermission();
            if (hasPermission && company.id) {
                notificationService.startPeriodicChecks(company.id);
            }
        } catch (error) {
            console.error('Error in loadUserData:', error);
            // Não fazemos logout automático aqui para permitir retry manual na UI
            toast.error('Erro ao carregar dados. Tente atualizar a página.');
        } finally {
            setDataLoading(false);
        }
    };

    // Atualizar dados do usuário
    const refreshUserData = async () => {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
            await loadUserData(authUser);
        }
    };

    useEffect(() => {
        let mounted = true;

        const initialize = async () => {
            try {
                // 1. Verificar sessão (rápido)
                const { data: { session: initialSession } } = await supabase.auth.getSession();

                if (mounted) {
                    setSession(initialSession);
                    setLoading(false); // Sessão verificada, libera UI

                    // 2. Se tem sessão, busca dados (assíncrono)
                    if (initialSession?.user) {
                        loadUserData(initialSession.user);
                    }
                }
            } catch (error) {
                console.error('Error initializing auth:', error);
                if (mounted) setLoading(false);
            }
        };

        initialize();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
            if (!mounted) return;


            setSession(currentSession);

            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                if (currentSession?.user) {
                    // Se o usuário mudou ou ainda não temos dados, carrega
                    if (!user || user.id !== currentSession.user.id) {
                        loadUserData(currentSession.user);
                    }
                }
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
                setSession(null);
                setDataLoading(false);
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    // Cadastro
    const signUp = async (data: SignUpData) => {
        try {
            // 1. Criar a empresa primeiro (via RPC que bypassa RLS)
            const { data: companyId, error: companyError } = await supabase
                .rpc('create_company_for_signup', {
                    p_name: data.company_name,
                    p_slug: data.company_slug,
                    p_email: data.email,
                    p_phone: data.phone || null,
                });

            if (companyError) throw companyError;
            if (!companyId) throw new Error('Erro ao criar empresa: ID não retornado');

            // 2. Criar o usuário no Auth (com metadados para o trigger criar o profile)
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: data.email,
                password: data.password,
                options: {
                    data: {
                        full_name: data.full_name,
                        company_id: companyId,
                        role: 'owner',
                    },
                },
            });

            if (authError) {
                // Rollback: Deletar a empresa criada pois o usuário falhou
                console.error('Auth failed, performing rollback for company:', companyId);
                try {
                    await supabase.rpc('rollback_company_signup', { p_company_id: companyId });
                } catch (rollbackError) {
                    console.error('Failed to rollback company:', rollbackError);
                    // Não podemos fazer muito mais aqui, mas o erro original será lançado
                }

                throw authError;
            }

            if (authData.user) {
                toast.success('Conta criada com sucesso! Você tem 7 dias de trial gratuito.');

                // Forçar recarregamento dos dados do usuário
                await loadUserData(authData.user);
                return { error: null };
            } else {
                throw new Error('Usuário não criado');
            }

        } catch (error: any) {
            console.error('Sign up error:', error);

            // Tratamento de erro específico para chave duplicada (slug)
            if (error?.message?.includes('duplicate key')) {
                toast.error('Esta URL de empresa já está em uso. Tente outra.');
            } else {
                toast.error('Erro ao criar conta: ' + (error.message || 'Erro desconhecido'));
            }

            return { error };
        }
    };

    // Login
    const signIn = async (data: SignInData) => {
        const { error } = await supabase.auth.signInWithPassword({
            email: data.email,
            password: data.password,
        });

        if (error) {
            toast.error('Erro ao fazer login: ' + error.message);
            return { error };
        }

        return { error: null };
    };

    // Logout
    const signOut = async () => {
        // Stop notifications
        notificationService.stopPeriodicChecks();

        // Optimistic logout: Clear state immediately
        setUser(null);
        setSession(null);

        // Fire and forget (or await if needed, but state is already cleared)
        try {
            await supabase.auth.signOut();
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    // Reset Password
    const resetPassword = async (email: string) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        });

        if (error) {
            toast.error('Erro ao enviar email: ' + error.message);
            return { error };
        }

        toast.success('Email de recuperação enviado!');
        return { error: null };
    };

    const value = {
        user,
        session,
        loading,
        dataLoading,
        signUp,
        signIn,
        signOut,
        resetPassword,
        refreshUserData,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
