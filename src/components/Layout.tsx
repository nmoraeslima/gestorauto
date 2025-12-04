import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { NotificationCenter } from '@/components/NotificationCenter';
import {
    LayoutDashboard,
    Users,
    Car,
    ClipboardList,
    Calendar,
    Package,
    DollarSign,
    Settings,
    LogOut,
    Menu,
    X,
    ChevronDown,
    Building2,
    Tag,
    Download,
} from 'lucide-react';
import { PWAInstallPrompt } from './PWAInstallPrompt';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import toast from 'react-hot-toast';


interface LayoutProps {
    children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
    const { user, signOut } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('sidebarCollapsed');
            // If collapsed is true, sidebarOpen is false
            if (saved === 'true') return false;
        }
        return true;
    });
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const { isInstallable, isInstalled, isIOS, install, showManualInstructions, getManualInstructions } = usePWAInstall();

    const navigation = [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Clientes', href: '/customers', icon: Users },
        { name: 'Veículos', href: '/vehicles', icon: Car },
        { name: 'Serviços', href: '/services', icon: Tag },
        { name: 'Produtos', href: '/products', icon: Package },
        { name: 'Estoque', href: '/inventory', icon: ClipboardList },
        { name: 'Agendamentos', href: '/appointments', icon: Calendar },
        { name: 'Ordens de Serviço', href: '/work-orders', icon: ClipboardList },
        { name: 'Financeiro', href: '/financial', icon: DollarSign },
        { name: 'Configurações', href: '/settings', icon: Settings },
    ];

    const handleSignOut = async () => {
        await signOut();
        navigate('/signin');
    };

    const handleInstallApp = async () => {
        if (isIOS) {
            // Reset dismissed state to show the prompt again
            localStorage.removeItem('pwa_prompt_dismissed');
            // Force reload to trigger the PWA prompt component
            window.location.reload();
        } else {
            await install();
            setUserMenuOpen(false);
        }
    };

    const manualInstructions = getManualInstructions();

    return (
        <NotificationProvider>
            <div className="min-h-screen bg-secondary-50">
                {/* Sidebar Desktop */}
                <div
                    className={`hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col transition-all duration-300 ease-in-out ${sidebarOpen ? 'w-64' : 'w-20'
                        }`}
                >
                    <div className="flex flex-col flex-grow bg-white border-r border-secondary-200 pt-5 pb-4 overflow-y-auto overflow-x-hidden">
                        {/* Header (Logo + Toggle) */}
                        <div className={`flex items-center flex-shrink-0 mb-6 ${sidebarOpen ? 'px-6 justify-between' : 'flex-col gap-4 px-2'}`}>
                            {sidebarOpen ? (
                                <>
                                    <img
                                        src="/assets/logo-horizontal-dark.png"
                                        alt="GestorAuto"
                                        className="h-8 w-auto"
                                    />
                                    <button
                                        onClick={() => {
                                            const newState = !sidebarOpen;
                                            setSidebarOpen(newState);
                                            localStorage.setItem('sidebarCollapsed', String(!newState));
                                        }}
                                        className="p-1 text-secondary-400 hover:text-secondary-600 rounded-lg hover:bg-secondary-100 transition-colors"
                                        title="Recolher Menu"
                                    >
                                        <Menu className="w-5 h-5" />
                                    </button>
                                </>
                            ) : (
                                <>
                                    <img
                                        src="/logo.png"
                                        alt="GA"
                                        className="h-8 w-8 object-contain"
                                    />
                                    <button
                                        onClick={() => {
                                            const newState = !sidebarOpen;
                                            setSidebarOpen(newState);
                                            localStorage.setItem('sidebarCollapsed', String(!newState));
                                        }}
                                        className="p-1 text-secondary-400 hover:text-secondary-600 rounded-lg hover:bg-secondary-100 transition-colors"
                                        title="Expandir Menu"
                                    >
                                        <Menu className="w-5 h-5" />
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Company Info */}
                        <div className={`mb-6 ${sidebarOpen ? 'px-6' : 'px-3'}`}>
                            {sidebarOpen ? (
                                <div className="bg-secondary-50 rounded-lg border border-secondary-200 p-3">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Building2 className="w-4 h-4 text-secondary-600" />
                                        <p className="text-sm font-semibold text-secondary-900 truncate">
                                            {user?.company?.name}
                                        </p>
                                    </div>
                                    <p className="text-xs text-secondary-600">
                                        Plano: {user?.company?.subscription_plan}
                                    </p>
                                </div>
                            ) : (
                                <div
                                    className="flex justify-center px-3 py-2 bg-secondary-50 border border-secondary-200 rounded-lg cursor-default"
                                    title={user?.company?.name}
                                >
                                    <Building2 className="w-5 h-5 text-secondary-600" />
                                </div>
                            )}
                        </div>

                        {/* Navigation */}
                        <nav className="flex-1 px-3 space-y-1">
                            {navigation.map((item) => {
                                const Icon = item.icon;
                                const isActive = location.pathname === item.href;
                                return (
                                    <Link
                                        key={item.name}
                                        to={item.href}
                                        title={!sidebarOpen ? item.name : ''}
                                        className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-150 ${isActive
                                            ? 'bg-primary-50 text-primary-700'
                                            : 'text-secondary-700 hover:bg-secondary-50'
                                            } ${!sidebarOpen ? 'justify-center' : ''}`}
                                    >
                                        <Icon className="w-5 h-5 flex-shrink-0" />
                                        {sidebarOpen && <span className="truncate">{item.name}</span>}
                                    </Link>
                                );
                            })}
                        </nav>

                        {/* User Menu */}
                        <div className="flex-shrink-0 px-3 pb-2 pt-2 mt-auto border-t border-secondary-200">
                            {!isInstalled && sidebarOpen && (
                                <button
                                    onClick={handleInstallApp}
                                    className="w-full flex items-center gap-3 px-3 py-2 mb-2 text-sm font-medium text-white bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 rounded-lg shadow-sm transition-all duration-150"
                                >
                                    <Download className="w-5 h-5" />
                                    Instalar App
                                </button>
                            )}
                            <div className="relative">
                                <button
                                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-secondary-700 hover:bg-secondary-50 rounded-lg transition-colors duration-150 ${!sidebarOpen ? 'justify-center' : ''}`}
                                >
                                    <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                                        {user?.profile?.full_name?.charAt(0).toUpperCase()}
                                    </div>
                                    {sidebarOpen && (
                                        <>
                                            <div className="flex-1 text-left overflow-hidden">
                                                <p className="text-sm font-semibold text-secondary-900 truncate">
                                                    {user?.profile?.full_name}
                                                </p>
                                                <p className="text-xs text-secondary-600 truncate">
                                                    {user?.profile?.role}
                                                </p>
                                            </div>
                                            <ChevronDown className="w-4 h-4 flex-shrink-0" />
                                        </>
                                    )}
                                </button>

                                {userMenuOpen && (
                                    <div className={`absolute bottom-full mb-2 bg-white rounded-lg shadow-lg border border-secondary-200 py-1 z-50 ${sidebarOpen ? 'left-0 right-0' : 'left-14 w-48'}`}>
                                        <button
                                            onClick={handleSignOut}
                                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-danger-600 hover:bg-danger-50 transition-colors duration-150"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            Sair
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile Sidebar */}
                {mobileSidebarOpen && (
                    <div className="fixed inset-0 z-40 lg:hidden">
                        <div
                            className="fixed inset-0 bg-secondary-900 bg-opacity-75"
                            onClick={() => setMobileSidebarOpen(false)}
                        />
                        <div className="fixed inset-y-0 left-0 flex flex-col w-64 bg-white">
                            <div className="flex items-center justify-between px-6 pt-5 pb-4">
                                <img
                                    src="/assets/logo-horizontal-dark.png"
                                    alt="GestorAuto"
                                    className="h-8 w-auto"
                                />
                                <button
                                    onClick={() => setMobileSidebarOpen(false)}
                                    className="text-secondary-600 hover:text-secondary-900"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Company Info Mobile */}
                            <div className="px-6 mb-6">
                                <div className="bg-secondary-50 rounded-lg p-3 border border-secondary-200">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Building2 className="w-4 h-4 text-secondary-600" />
                                        <p className="text-sm font-semibold text-secondary-900 truncate">
                                            {user?.company?.name}
                                        </p>
                                    </div>
                                    <p className="text-xs text-secondary-600">
                                        Plano: {user?.company?.subscription_plan}
                                    </p>
                                </div>
                            </div>

                            <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
                                {navigation.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = location.pathname === item.href;
                                    return (
                                        <Link
                                            key={item.name}
                                            to={item.href}
                                            onClick={() => setMobileSidebarOpen(false)}
                                            className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-150 ${isActive
                                                ? 'bg-primary-50 text-primary-700'
                                                : 'text-secondary-700 hover:bg-secondary-50'
                                                }`}
                                        >
                                            <Icon className="w-5 h-5" />
                                            {item.name}
                                        </Link>
                                    );
                                })}
                            </nav>

                            {/* User Menu Mobile */}
                            <div className="flex-shrink-0 px-3 pb-4 border-t border-secondary-200 pt-4">
                                {!isInstalled && (
                                    <button
                                        onClick={handleInstallApp}
                                        className="w-full flex items-center gap-3 px-3 py-2 mb-2 text-sm font-medium text-white bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 rounded-lg shadow-sm transition-all duration-150"
                                    >
                                        <Download className="w-5 h-5" />
                                        Instalar App
                                    </button>
                                )}
                                <div className="relative">
                                    <button
                                        onClick={() => setUserMenuOpen(!userMenuOpen)}
                                        className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-secondary-700 hover:bg-secondary-50 rounded-lg transition-colors duration-150"
                                    >
                                        <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
                                            {user?.profile?.full_name?.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 text-left">
                                            <p className="text-sm font-semibold text-secondary-900 truncate">
                                                {user?.profile?.full_name}
                                            </p>
                                            <p className="text-xs text-secondary-600 truncate">
                                                {user?.profile?.role}
                                            </p>
                                        </div>
                                        <ChevronDown className="w-4 h-4" />
                                    </button>

                                    {userMenuOpen && (
                                        <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-lg shadow-lg border border-secondary-200 py-1">

                                            <button
                                                onClick={handleSignOut}
                                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-danger-600 hover:bg-danger-50 transition-colors duration-150"
                                            >
                                                <LogOut className="w-4 h-4" />
                                                Sair
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Content */}
                <div className={`flex flex-col flex-1 transition-all duration-300 ease-in-out ${sidebarOpen ? 'lg:pl-64' : 'lg:pl-20'}`}>
                    {/* Top Bar (Mobile & Desktop) */}
                    <div className="sticky top-0 z-10 bg-white border-b border-secondary-200 px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setMobileSidebarOpen(true)}
                                className="text-secondary-600 hover:text-secondary-900 lg:hidden"
                            >
                                <Menu className="w-6 h-6" />
                            </button>
                            <img
                                src="/assets/logo-horizontal-dark.png"
                                alt="GestorAuto"
                                className="h-7 w-auto lg:hidden"
                            />
                            {/* Global Greeting */}
                            <div className="hidden lg:block">
                                <h1 className="text-2xl font-bold text-secondary-900">
                                    Olá, {user?.profile?.full_name?.split(' ')[0]}!
                                </h1>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <NotificationCenter />
                        </div>
                    </div>

                    {/* Page Content */}
                    <main className="flex-1">
                        <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                            {children}
                        </div>
                    </main>
                </div>

            </div>
            <PWAInstallPrompt />

            {/* Manual Install Instructions Modal */}
            {showManualInstructions && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="bg-primary-100 p-2 rounded-lg">
                                    <Download className="w-6 h-6 text-primary-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-secondary-900">
                                    {manualInstructions.title}
                                </h3>
                            </div>
                            <button
                                onClick={() => window.location.reload()}
                                className="text-secondary-400 hover:text-secondary-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <p className="text-secondary-600">
                                Para instalar o aplicativo, siga os passos abaixo:
                            </p>
                            <div className="bg-secondary-50 rounded-lg p-4 space-y-3">
                                {manualInstructions.steps.map((step, index) => (
                                    <div key={index} className="flex items-start gap-3">
                                        <div className="flex-shrink-0 w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                            {index + 1}
                                        </div>
                                        <p className="text-sm text-secondary-700 pt-0.5">{step}</p>
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={() => window.location.reload()}
                                className="btn btn-primary w-full"
                            >
                                Entendi
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </NotificationProvider >
    );
};
