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

    // Carregar dados do perfil e empresa
    const loadUserData = async (authUser: User) => {
        try {
            console.log('Loading user data for:', authUser.id);

            // Buscar perfil
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', authUser.id)
                .single();

            if (profileError) {
                console.error('Error loading profile:', profileError);
                throw profileError;
            }

            if (!profile) {
                throw new Error('Profile not found');
            }

            // Buscar empresa
            const { data: company, error: companyError } = await supabase
                .from('companies')
                .select('*')
                .eq('id', profile.company_id)
                .single();

            if (companyError) {
                console.error('Error loading company:', companyError);
                throw companyError;
            }

            if (!company) {
                throw new Error('Company not found');
            }

            setUser({
                id: authUser.id,
                email: authUser.email!,
                profile: profile as Profile,
                company: company as Company,
            });
        } catch (error) {
            console.error('Error in loadUserData:', error);
            // Se falhar ao carregar dados críticos, infelizmente não podemos logar o usuário
            // Mas não vamos forçar logout aqui para evitar loops. 
            // O ProtectedRoute vai lidar com user === null
            setUser(null);
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

        // Função principal de inicialização
        const initialize = async () => {
            try {
                // 1. Verificar sessão atual
                const { data: { session: initialSession } } = await supabase.auth.getSession();

                if (mounted) {
                    setSession(initialSession);
                    if (initialSession?.user) {
                        await loadUserData(initialSession.user);
                    }
                }
            } catch (error) {
                console.error('Error initializing auth:', error);
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        initialize();

        // 2. Configurar listener de mudanças de estado
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
            if (!mounted) return;

            console.log('Auth state changed:', event);
            setSession(currentSession);

            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                if (currentSession?.user) {
                    // Se não tivermos user carregado (ex: refresh de página), carrega.
                    // Se já tiver user, assume que está ok (otimização), a menos que seja SIGNED_IN explícito
                    if (!user || event === 'SIGNED_IN') {
                        await loadUserData(currentSession.user);
                    }
                }
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
                setSession(null);
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []); // Dependência vazia intencional

    // Cadastro
    const signUp = async (data: SignUpData) => {
        try {
            const { data: companyId, error: companyError } = await supabase
                .rpc('create_company_for_signup', {
                    p_name: data.company_name,
                    p_slug: data.company_slug,
                    p_email: data.email,
                    p_phone: data.phone || null,
                });

            if (companyError) throw companyError;

            toast.success('Conta criada com sucesso! Você tem 7 dias de trial gratuito.');
            return { error: null };
        } catch (error: any) {
            console.error('Sign up error:', error);
            toast.error('Erro ao criar conta: ' + error.message);
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

        // O listener onAuthStateChange vai lidar com o resto
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
            // toast.success('Logout realizado com sucesso!'); // Opcional, as vezes é chato
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
        signUp,
        signIn,
        signOut,
        resetPassword,
        refreshUserData,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
