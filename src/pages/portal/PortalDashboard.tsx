import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Car, Calendar, Camera, Loader2, X, Award, Star, Sparkles } from 'lucide-react';
import { portalService } from '@/services/portalService';
import type { PortalData, WorkOrderPortal } from '@/types/portal';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import toast from 'react-hot-toast';

export default function PortalDashboard() {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<PortalData | null>(null);
    const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
    const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number>(0);
    const [allPhotos, setAllPhotos] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        // Verificar sessão
        const session = portalService.getSession();
        if (!session) {
            navigate('/portal/login');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            console.log('Loading portal data for customer:', session.customer_id);
            const portalData = await portalService.getPortalData(session.customer_id);
            console.log('Portal data loaded:', portalData);
            setData(portalData);
        } catch (error: any) {
            console.error('Error loading portal data:', error);
            const errorMessage = error.message || 'Erro ao carregar dados';
            setError(errorMessage);
            toast.error(errorMessage);

            // Não fazer logout automático, deixar usuário ver o erro
            // handleLogout();
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        portalService.clearSession();
        navigate('/portal/login');
    };

    const getStatusBadge = (status: string) => {
        const statusMap: Record<string, { label: string; className: string }> = {
            completed: { label: 'Concluído', className: 'bg-green-100 text-green-800' },
            in_progress: { label: 'Em Andamento', className: 'bg-blue-100 text-blue-800' },
            pending: { label: 'Pendente', className: 'bg-yellow-100 text-yellow-800' }
        };

        const config = statusMap[status] || { label: status, className: 'bg-gray-100 text-gray-800' };

        return (
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.className}`}>
                {config.label}
            </span>
        );
    };

    const openPhotoGallery = (photoUrl: string, photos: string[]) => {
        setAllPhotos(photos);
        const index = photos.indexOf(photoUrl);
        setSelectedPhotoIndex(index >= 0 ? index : 0);
        setSelectedPhoto(photoUrl);
    };

    const closePhotoGallery = () => {
        setSelectedPhoto(null);
        setAllPhotos([]);
        setSelectedPhotoIndex(0);
    };

    const goToNextPhoto = () => {
        if (allPhotos.length === 0) return;
        const nextIndex = (selectedPhotoIndex + 1) % allPhotos.length;
        setSelectedPhotoIndex(nextIndex);
        setSelectedPhoto(allPhotos[nextIndex]);
    };

    const goToPreviousPhoto = () => {
        if (allPhotos.length === 0) return;
        const prevIndex = selectedPhotoIndex === 0 ? allPhotos.length - 1 : selectedPhotoIndex - 1;
        setSelectedPhotoIndex(prevIndex);
        setSelectedPhoto(allPhotos[prevIndex]);
    };

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!selectedPhoto) return;

            if (e.key === 'ArrowRight') {
                goToNextPhoto();
            } else if (e.key === 'ArrowLeft') {
                goToPreviousPhoto();
            } else if (e.key === 'Escape') {
                closePhotoGallery();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedPhoto, selectedPhotoIndex, allPhotos]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-4" />
                    <p className="text-gray-600">Carregando seus dados...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <X className="w-8 h-8 text-red-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Erro ao Carregar Dados</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <div className="space-y-3">
                        <button
                            onClick={loadData}
                            className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                        >
                            Tentar Novamente
                        </button>
                        <button
                            onClick={handleLogout}
                            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-medium transition-colors"
                        >
                            Voltar ao Login
                        </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-4">
                        Se o problema persistir, entre em contato com a empresa.
                    </p>
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
                    <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Car className="w-8 h-8 text-yellow-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Dados Não Encontrados</h2>
                    <p className="text-gray-600 mb-6">
                        Não foi possível carregar seus dados. Isso pode acontecer se:
                    </p>
                    <ul className="text-left text-sm text-gray-600 mb-6 space-y-2">
                        <li>• O sistema ainda não foi configurado</li>
                        <li>• Seu cadastro está incompleto</li>
                        <li>• Houve um erro temporário</li>
                    </ul>
                    <button
                        onClick={handleLogout}
                        className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                    >
                        Voltar ao Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            {/* Logo da Empresa */}
                            {data.company?.logo_url ? (
                                <img
                                    src={data.company.logo_url}
                                    alt={data.company.name}
                                    className="h-12 w-12 object-contain rounded-lg"
                                />
                            ) : (
                                <div className="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center">
                                    <Car className="w-6 h-6 text-primary-600" />
                                </div>
                            )}
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">
                                    Olá, {data.customer.name.split(' ')[0]}!
                                </h1>
                                <p className="text-sm text-gray-500">
                                    {data.company?.name || 'Portal do Cliente'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                            title="Sair"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Stats & Badges */}
            <div className="max-w-4xl mx-auto px-4 py-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Total de Serviços */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary-100 rounded-lg">
                                <Car className="w-5 h-5 text-primary-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Serviços Realizados</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {data.stats.total_services}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Badge de Conquista */}
                    {data.stats.total_services >= 10 && (
                        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-xl shadow-sm border border-yellow-200">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-yellow-200 rounded-lg">
                                    <Award className="w-6 h-6 text-yellow-700" />
                                </div>
                                <div>
                                    <p className="text-sm text-yellow-800 font-medium">Cliente VIP</p>
                                    <p className="text-xs text-yellow-600">10+ serviços realizados</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {data.stats.total_services >= 5 && data.stats.total_services < 10 && (
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl shadow-sm border border-blue-200">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-200 rounded-lg">
                                    <Star className="w-6 h-6 text-blue-700" />
                                </div>
                                <div>
                                    <p className="text-sm text-blue-800 font-medium">Cliente Fiel</p>
                                    <p className="text-xs text-blue-600">5+ serviços realizados</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Próximo Serviço Recomendado */}
                    {data.work_orders.length > 0 && (() => {
                        const lastOrder = data.work_orders[0];
                        const lastDate = new Date(lastOrder.completed_at || lastOrder.entry_date);
                        const monthsSince = Math.floor((Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24 * 30));

                        if (monthsSince >= 2) {
                            return (
                                <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl shadow-sm border border-green-200">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-green-200 rounded-lg">
                                            <Calendar className="w-5 h-5 text-green-700" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-green-800 font-medium">Hora de Renovar!</p>
                                            <p className="text-xs text-green-600">Último serviço há {monthsSince} meses</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        }
                        return null;
                    })()}
                </div>
            </div>

            {/* CTA Banner - Agendar Serviço */}
            <div className="max-w-4xl mx-auto px-4 pb-6">
                <div className="relative bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 rounded-2xl p-8 shadow-xl overflow-hidden">
                    {/* Decorative elements */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24"></div>

                    <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="text-white text-center md:text-left flex-1">
                            <h3 className="text-2xl font-bold mb-3 flex items-center justify-center md:justify-start gap-3">
                                <Sparkles className="w-7 h-7 text-white" />
                                <span className="text-white">Gostou dos resultados?</span>
                            </h3>
                            <p className="text-primary-50 text-lg leading-relaxed">
                                Agende agora seu próximo serviço e mantenha seu veículo sempre impecável!
                            </p>
                        </div>
                        <a
                            href={`https://wa.me/${data.company?.phone?.replace(/\D/g, '') || ''}?text=${encodeURIComponent(
                                `Olá! Gostaria de agendar um serviço. Vi meu histórico no portal e fiquei muito satisfeito! 🚗✨`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 bg-white text-primary-600 px-8 py-4 rounded-xl font-bold hover:bg-primary-50 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl whitespace-nowrap"
                        >
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                            </svg>
                            Agendar via WhatsApp
                        </a>
                    </div>
                </div>
            </div>

            {/* Histórico */}
            <div className="max-w-4xl mx-auto px-4 pb-8">
                <h2 className="text-lg font-bold text-gray-900 mb-4">
                    Histórico de Serviços
                </h2>

                {data.work_orders.length === 0 ? (
                    <div className="bg-white rounded-xl p-8 text-center">
                        <Car className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">Nenhum serviço encontrado</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {data.work_orders.map((wo) => (
                            <div
                                key={wo.id}
                                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
                            >
                                {/* Header do Card */}
                                <div className="p-4 border-b border-gray-100">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <p className="font-semibold text-gray-900">
                                                {wo.vehicle_model}
                                            </p>
                                            <p className="text-sm text-gray-500">{wo.license_plate}</p>
                                        </div>
                                        {getStatusBadge(wo.status)}
                                    </div>

                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <Calendar className="w-4 h-4" />
                                        <span>
                                            {format(new Date(wo.entry_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                                        </span>
                                    </div>
                                </div>

                                {/* Serviços */}
                                {wo.services && wo.services.length > 0 && (
                                    <div className="p-4 border-b border-gray-100">
                                        <p className="text-sm font-medium text-gray-700 mb-2">
                                            Serviços realizados:
                                        </p>
                                        <ul className="space-y-1">
                                            {wo.services.map((service, idx) => (
                                                <li key={idx} className="text-sm text-gray-600 flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 bg-primary-500 rounded-full"></span>
                                                    <span>{service.name}</span>
                                                    {service.quantity > 1 && (
                                                        <span className="text-xs text-gray-400">x{service.quantity}</span>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Fotos - Destaque */}
                                {wo.photos && wo.photos.length > 0 && (
                                    <div className="p-4 border-b border-gray-100 bg-gray-50">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <Camera className="w-4 h-4 text-primary-600" />
                                                <p className="text-sm font-medium text-gray-900">
                                                    Veja a Transformação! 🎨
                                                </p>
                                            </div>
                                            <span className="text-xs text-gray-500">{wo.photos.length} fotos</span>
                                        </div>
                                        <div className="grid grid-cols-4 gap-2">
                                            {wo.photos.slice(0, 8).map((photo) => {
                                                const allPhotoUrls = wo.photos.map(p => portalService.getPhotoUrl(p.file_path));
                                                return (
                                                    <div
                                                        key={photo.id}
                                                        className="aspect-square rounded-lg overflow-hidden bg-gray-100 cursor-pointer hover:opacity-75 transition-opacity ring-2 ring-primary-200 hover:ring-primary-400"
                                                        onClick={() => openPhotoGallery(portalService.getPhotoUrl(photo.file_path), allPhotoUrls)}
                                                    >
                                                        <img
                                                            src={portalService.getPhotoUrl(photo.file_path)}
                                                            alt="Foto do serviço"
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        {wo.photos.length > 8 && (
                                            <p className="text-xs text-center text-gray-500 mt-2">
                                                +{wo.photos.length - 8} fotos
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Footer - CTA Agendamento */}
                                <div className="p-4 bg-gray-50">
                                    <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                                        <span className="text-sm text-gray-500">
                                            {wo.completed_at
                                                ? `Concluído em ${format(new Date(wo.completed_at), 'dd/MM/yyyy')}`
                                                : 'Em andamento'
                                            }
                                        </span>
                                        {wo.completed_at && (
                                            <a
                                                href={`https://wa.me/${data.company?.phone?.replace(/\D/g, '') || ''}?text=${encodeURIComponent(
                                                    `Olá! Gostaria de agendar novamente o serviço de ${wo.services?.map(s => s.name).join(', ')} para meu ${wo.vehicle_model}. Adorei o resultado anterior! 🚗✨`
                                                )}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all transform hover:scale-105"
                                            >
                                                <Calendar className="w-4 h-4" />
                                                Repetir Serviço
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Floating WhatsApp Button */}
            {data.company?.phone && (
                <a
                    href={`https://wa.me/${data.company.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                        'Olá! Vim pelo Portal do Cliente e gostaria de agendar um serviço. 🚗'
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="fixed bottom-6 right-6 bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-2xl transition-all transform hover:scale-110 z-40 flex items-center gap-2 group"
                    title="Agendar via WhatsApp"
                >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                    </svg>
                    <span className="hidden group-hover:inline-block text-sm font-medium whitespace-nowrap">
                        Agendar Serviço
                    </span>
                </a>
            )}

            {/* Photo Lightbox with Navigation */}
            {selectedPhoto && (
                <div
                    className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm"
                    onClick={closePhotoGallery}
                >
                    {/* Close Button */}
                    <button
                        className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-10"
                        onClick={closePhotoGallery}
                        title="Fechar (ESC)"
                    >
                        <X className="w-6 h-6" />
                    </button>

                    {/* Photo Counter */}
                    {allPhotos.length > 1 && (
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/50 rounded-full text-white text-sm font-medium">
                            {selectedPhotoIndex + 1} / {allPhotos.length}
                        </div>
                    )}

                    {/* Previous Button */}
                    {allPhotos.length > 1 && (
                        <button
                            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all hover:scale-110"
                            onClick={(e) => {
                                e.stopPropagation();
                                goToPreviousPhoto();
                            }}
                            title="Anterior (←)"
                        >
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                    )}

                    {/* Photo */}
                    <img
                        src={selectedPhoto}
                        alt="Foto ampliada"
                        className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    />

                    {/* Next Button */}
                    {allPhotos.length > 1 && (
                        <button
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all hover:scale-110"
                            onClick={(e) => {
                                e.stopPropagation();
                                goToNextPhoto();
                            }}
                            title="Próxima (→)"
                        >
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
