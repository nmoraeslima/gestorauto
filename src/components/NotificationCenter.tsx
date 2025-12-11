import React, { useRef, useState, useEffect } from 'react';
import { Bell, Check, Info, AlertTriangle, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';
import { usePWAContext } from '@/contexts/PWAContext';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const NotificationCenter: React.FC = () => {
    const { notifications, unreadCount: apiUnreadCount, markAsRead, markAllAsRead } = useNotifications();
    const { updateAvailable, handleUpdate } = usePWAContext();
    const unreadCount = apiUnreadCount + (updateAvailable ? 1 : 0);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleNotificationClick = async (notification: any) => {
        if (!notification.read) {
            await markAsRead(notification.id);
        }
        if (notification.link) {
            navigate(notification.link);
            setIsOpen(false);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'warning':
                return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
            case 'error':
                return <AlertCircle className="w-5 h-5 text-red-600" />;
            case 'success':
                return <CheckCircle className="w-5 h-5 text-green-600" />;
            default:
                return <Info className="w-5 h-5 text-blue-600" />;
        }
    };

    const getNotificationStyle = (type: string, read: boolean) => {
        const baseStyle = 'p-4 hover:bg-secondary-50 cursor-pointer transition-colors';

        if (type === 'error') {
            return `${baseStyle} ${!read ? 'bg-red-50 border-l-4 border-red-500' : 'bg-red-50/50 border-l-4 border-red-300'}`;
        }

        if (type === 'warning') {
            return `${baseStyle} ${!read ? 'bg-yellow-50 border-l-4 border-yellow-500' : 'bg-yellow-50/50 border-l-4 border-yellow-300'}`;
        }

        return `${baseStyle} ${!read ? 'bg-primary-50/30' : ''}`;
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 text-secondary-600 hover:text-primary-600 hover:bg-secondary-50 rounded-full transition-colors relative"
                title="Notificações"
            >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white animate-pulse"></span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-xl border border-secondary-200 z-50 overflow-hidden">
                    <div className="p-4 border-b border-secondary-100 flex justify-between items-center bg-secondary-50">
                        <h3 className="font-semibold text-secondary-900">Notificações</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={() => markAllAsRead()}
                                className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                            >
                                <Check className="w-3 h-3" />
                                Marcar todas como lidas
                            </button>
                        )}
                    </div>

                    <div className="max-h-[400px] overflow-y-auto">
                        {notifications.length === 0 && !updateAvailable ? (
                            <div className="p-8 text-center text-secondary-500">
                                <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                <p className="text-sm">Nenhuma notificação no momento</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-secondary-100">
                                {updateAvailable && (
                                    <div
                                        onClick={handleUpdate}
                                        className="p-4 hover:bg-primary-50 cursor-pointer transition-colors bg-white border-l-4 border-primary-500"
                                    >
                                        <div className="flex gap-3">
                                            <div className="flex-shrink-0 mt-1">
                                                <RefreshCw className="w-5 h-5 text-primary-600 animate-spin-slow" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-secondary-900">
                                                    Nova versão disponível! 🎉
                                                </p>
                                                <p className="text-sm text-secondary-600 mt-0.5">
                                                    Uma nova versão do app está pronta.
                                                </p>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleUpdate();
                                                    }}
                                                    className="mt-2 text-xs font-medium text-white bg-primary-600 hover:bg-primary-700 px-3 py-1.5 rounded-md transition-colors"
                                                >
                                                    Atualizar agora
                                                </button>
                                            </div>
                                            <div className="flex-shrink-0 self-center">
                                                <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className={getNotificationStyle(notification.type, notification.read)}
                                    >
                                        <div className="flex gap-3">
                                            <div className="flex-shrink-0 mt-1">
                                                {getIcon(notification.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm font-medium ${!notification.read ? 'text-secondary-900' : 'text-secondary-700'
                                                    }`}>
                                                    {notification.title}
                                                </p>
                                                <p className="text-sm text-secondary-600 mt-0.5 line-clamp-2">
                                                    {notification.message}
                                                </p>
                                                <p className="text-xs text-secondary-400 mt-2">
                                                    {formatDistanceToNow(new Date(notification.created_at), {
                                                        addSuffix: true,
                                                        locale: ptBR,
                                                    })}
                                                </p>
                                            </div>
                                            {!notification.read && (
                                                <div className="flex-shrink-0 self-center">
                                                    <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
