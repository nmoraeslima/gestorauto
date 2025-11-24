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
    const loadUserData = async (authUser: User) => {
        try {
            console.log('Loading user data for:', authUser.id);

            // Timeout para operações de banco de dados
            const dbTimeout = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Database timeout')), 8000)
            );

            const fetchData = async () => {
                // Buscar perfil
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', authUser.id)
                    .single();

                if (profileError) {
                    console.error('Profile error:', profileError);
                    throw new Error(`Erro ao carregar perfil: ${profileError.message}`);
                }

                if (!profile) {
                    console.error('Profile not found for user:', authUser.id);
                    throw new Error('Perfil não encontrado. Por favor, entre em contato com o suporte.');
                }

                console.log('Profile loaded:', profile);

                // Buscar empresa
                const { data: company, error: companyError } = await supabase
                    .from('companies')
                    .select('*')
                    .eq('id', profile.company_id)
                    .single();

                if (companyError) {
                    console.error('Company error:', companyError);
                    throw new Error(`Erro ao carregar empresa: ${companyError.message}`);
                }

                if (!company) {
                    console.error('Company not found:', profile.company_id);
                    throw new Error('Empresa não encontrada. Por favor, entre em contato com o suporte.');
                }

                console.log('Company loaded:', company);

                return { profile, company };
            };

            const { profile, company } = await Promise.race([
                fetchData(),
                dbTimeout
            ]) as { profile: any, company: any };

            setUser({
                id: authUser.id,
                email: authUser.email!,
                profile: profile as Profile,
                company: company as Company,
            });

            console.log('User data loaded successfully');
        } catch (error: any) {
            console.error('Error loading user data:', error);
            // Only show toast if it's a real error, not just a network blip during refresh
            if (loading) {
                toast.error(error.message || 'Erro ao carregar dados do usuário');
            }

            // Se der erro de timeout ou outro erro crítico, limpamos o user para evitar estado inconsistente
            // Mas apenas se não tivermos um user carregado (tentativa inicial)
            if (!user) {
                setUser(null);
                // Se for timeout, forçamos logout mas SEM esperar (fire and forget)
                // pois se o banco tá travado, o signOut também pode travar
                if (error.message === 'Database timeout') {
                    console.warn('Database timeout, forcing local cleanup');
                    void supabase.auth.signOut();
                    setSession(null);
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
}, []); // Dependency array must be empty to avoid infinite loop

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
