import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Profile, Company, SignUpData, SignInData, AuthUser } from '@/types/database';
import toast from 'react-hot-toast';

interface AuthContextType {
    user: AuthUser | null;
    session: Session | null;
    loading: boolean;
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
    const [loading, setLoading] = useState(true);
    const userRef = React.useRef<AuthUser | null>(null);

    // Keep ref in sync with state
    useEffect(() => {
        userRef.current = user;
    }, [user]);

    // Carregar dados do perfil e empresa
    const loadUserData = async (authUser: User, retryCount = 0) => {
        try {
            console.log(`Loading user data for: ${authUser.id} (Attempt ${retryCount + 1})`);

            const fetchData = async () => {
                // Buscar perfil
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', authUser.id)
                    .single();

                if (profileError) {
                    console.error('Profile error details:', profileError);
                    // Se for erro de conexão, lança erro para tentar novamente
                    if (profileError.message?.includes('fetch') || profileError.message?.includes('network') || profileError.message?.includes('Failed to fetch')) {
                        throw new Error('Network error: Failed to connect to database');
                    }
                    throw new Error(`Erro ao carregar perfil: ${profileError.message}`);
                }

                if (!profile) {
                    console.error('Profile not found for user:', authUser.id);
                    throw new Error('Perfil não encontrado. Por favor, entre em contato com o suporte.');
                }

                // Buscar empresa
                const { data: company, error: companyError } = await supabase
                    .from('companies')
                    .select('*')
                    .eq('id', profile.company_id)
                    .single();

                if (companyError) {
                    console.error('Company error details:', companyError);
                    if (companyError.message?.includes('fetch') || companyError.message?.includes('network') || companyError.message?.includes('Failed to fetch')) {
                        throw new Error('Network error: Failed to connect to database');
                    }
                    throw new Error(`Erro ao carregar empresa: ${companyError.message}`);
                }

                if (!company) {
                    console.error('Company not found:', profile.company_id);
                    throw new Error('Empresa não encontrada. Por favor, entre em contato com o suporte.');
                }

                return { profile, company };
            };

            // Removido timeout artificial para evitar cancelamento prematuro em conexões lentas
            const { profile, company } = await fetchData();

            setUser({
                id: authUser.id,
                email: authUser.email!,
                profile: profile as Profile,
                company: company as Company,
            });

            console.log('User data loaded successfully');
        } catch (error: any) {
            console.error(`Error loading user data (Attempt ${retryCount + 1}):`, error);

            // Retry logic (max 3 attempts)
            if (retryCount < 2 && (error.message === 'Database timeout' || error.message === 'Network error' || error.message?.includes('fetch'))) {
                console.log(`Retrying loadUserData in 2 seconds...`);
                await new Promise(resolve => setTimeout(resolve, 2000));
                return loadUserData(authUser, retryCount + 1);
            }

            // Only show toast if it's a real error, not just a network blip during refresh
            if (loading) {
                toast.error(error.message || 'Erro ao carregar dados do usuário');
            }

            // Se falhar após retries, forçar logout para limpar estado corrompido
            if (!user) {
                console.warn('Critical error loading user data, forcing logout to clear state');
                setUser(null);
                setSession(null);
                await supabase.auth.signOut();
                // Redirecionar para login via window.location para garantir limpeza
                if (window.location.pathname !== '/signin') {
                    window.location.href = '/signin';
                }
            }
        }
    };

    // Atualizar dados do usuário
    const refreshUserData = async () => {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
            await loadUserData(authUser);
        }
    };

    // Inicialização da autenticação
    useEffect(() => {
        let mounted = true;

        const initializeAuth = async () => {
            try {
                // 1. Tentar obter a sessão inicial com timeout
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Auth timeout')), 20000)
                );

                const sessionPromise = supabase.auth.getSession();

                const { data: { session } } = await Promise.race([
                    sessionPromise,
                    timeoutPromise
                ]) as any;

                if (mounted) {
                    setSession(session);
                    if (session?.user) {
                        await loadUserData(session.user);
                    }
                }
            } catch (error) {
                console.error('Error initializing auth:', error);
                // REMOVIDO: Não força mais logout por timeout na inicialização
                // if (error instanceof Error && error.message === 'Auth timeout') {
                //     console.warn('Auth initialization timed out, forcing local cleanup');
                //     void supabase.auth.signOut();
                //     if (mounted) {
                //         setSession(null);
                //         setUser(null);
                //     }
                // }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        initializeAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (!mounted) return;

            console.log('Auth state changed:', event);

            try {
                setSession(session);

                if (event === 'SIGNED_IN') {
                    if (session?.user) {
                        await loadUserData(session.user);
                    }
                } else if (event === 'SIGNED_OUT') {
                    setUser(null);
                    setSession(null);
                }
            } catch (error) {
                console.error('Error in auth state change:', error);
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    // Cadastro (cria empresa + usuário + perfil)
    const signUp = async (data: SignUpData) => {
        try {
            // 1. Criar empresa usando função PostgreSQL (bypassa RLS)
            const { data: companyId, error: companyError } = await supabase
                .rpc('create_company_for_signup', {
                    p_name: data.company_name,
                    p_slug: data.company_slug,
                    p_email: data.email,
                    p_phone: data.phone || null,
                });

            if (companyError) {
                console.error('Company creation error:', companyError);
                toast.error('Erro ao criar empresa: ' + companyError.message);
                return { error: companyError as unknown as AuthError };
            }

            toast.success('Conta criada com sucesso! Você tem 7 dias de trial gratuito.');
            return { error: null };
        } catch (error) {
            console.error('Sign up error:', error);
            toast.error('Erro inesperado ao criar conta');
            return { error: error as AuthError };
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

        toast.success('Login realizado com sucesso!');
        return { error: null };
    };

    // Logout
    const signOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            toast.error('Erro ao fazer logout: ' + error.message);
        } else {
            setUser(null);
            setSession(null);
            toast.success('Logout realizado com sucesso!');
        }
    };

    // Recuperação de senha
    const resetPassword = async (email: string) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        });

        if (error) {
            toast.error('Erro ao enviar email de recuperação: ' + error.message);
            return { error };
        }

        toast.success('Email de recuperação enviado!');
        return { error: null };
    };

    const value = {
        user,
        session,
        loading,
        signUp,
        signIn,
        signOut,
        resetPassword,
        refreshUserData,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
