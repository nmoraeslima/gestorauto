import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Timeline } from '@/components/tracker/Timeline';
import { BeforeAfterSlider } from '@/components/tracker/BeforeAfterSlider';
import { Car, MapPin, Phone, Share2, Loader2, Calendar, Shield, Printer, Camera, AlertTriangle, X } from 'lucide-react';
import { formatCurrency } from '@/utils/format';
import toast from 'react-hot-toast';

interface TrackerData {
    workOrder: any;
    company: any;
    customer: any;
    vehicle: any;
    services: any[];
    photos: any[];
}

export const ServiceTracker: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [data, setData] = useState<TrackerData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [accessDenied, setAccessDenied] = useState(false);
    const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        try {
            if (!id) return;

            // Secure Fetch via RPC
            const { data: rpcData, error: rpcError } = await supabase.rpc('get_public_work_order', {
                p_work_order_id: id
            });

            if (rpcError) {
                console.error('RPC Error:', rpcError);
                throw rpcError;
            }

            if (!rpcData) {
                // If RPC returns null, it means ID wasn't found or error occurred
                throw new Error('Work Order not found');
            }

            // Safe access from JSON response
            const company = rpcData.company;

            // Check Plan Permission
            const plan = company?.subscription_plan || 'basic';
            const isPremium = plan === 'premium'; // Only Elite plan can access public links

            if (!isPremium) {
                setAccessDenied(true);
                setLoading(false);
                return;
            }

            // Transform Photos with Public URL
            const photosWithUrl = (rpcData.photos || []).map((photo: any) => {
                // Check if it already has a full URL (legacy) or needs generation
                if (photo.file_path && !photo.url) {
                    const { data } = supabase.storage
                        .from('work-order-photos')
                        .getPublicUrl(photo.file_path);
                    return { ...photo, url: data.publicUrl };
                }
                return photo;
            });

            setData({
                workOrder: rpcData.workOrder,
                company: rpcData.company,
                customer: rpcData.customer,
                vehicle: rpcData.vehicle,
                services: rpcData.services || [],
                photos: photosWithUrl
            });

        } catch (err) {
            console.error('Error loading tracker data:', err);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Acompanhe meu carro na ${data?.company?.name}`,
                    text: `Veja o status do serviço no meu ${data?.vehicle?.model}`,
                    url: window.location.href,
                });
            } catch (err) {
                console.log('Error sharing', err);
            }
        } else {
            // Fallback: Copy to clipboard
            navigator.clipboard.writeText(window.location.href);
            toast.success('Link copiado para a área de transferência!');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <Shield className="w-12 h-12 text-gray-400 mb-4" />
                <h1 className="text-xl font-bold text-gray-900 mb-2">Não encontrado</h1>
                <p className="text-gray-500 text-center">
                    Não foi possível encontrar as informações deste serviço.
                    Verifique se o link está correto.
                </p>
                {accessDenied && (
                    <p className="text-red-500 text-sm mt-4 text-center max-w-md bg-red-50 p-4 rounded-lg">
                        ⚠️ Este recurso está disponível apenas para empresas com plano <strong>Elite</strong>.
                        Entre em contato para fazer upgrade.
                    </p>
                )}
            </div>
        );
    }

    // Helper to get photos by category
    const beforePhotos = data.photos.filter((p: any) => p.category === 'before') || [];
    const afterPhotos = data.photos.filter((p: any) => p.category === 'after') || [];
    const hasComparison = beforePhotos.length > 0 && afterPhotos.length > 0;

    return (
        <div className="min-h-screen bg-gray-50 pb-12 print:bg-white print:pb-0">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10 print:hidden">
                <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-primary-100 rounded flex items-center justify-center">
                            <Car className="h-6 w-6 text-primary-600" />
                        </div>
                        <div className="font-bold text-lg text-secondary-900 truncate">
                            {data.company.name}
                        </div>
                    </div>
                    <button
                        onClick={handleShare}
                        className="p-2 text-primary-600 hover:bg-primary-50 rounded-full transition-colors"
                    >
                        <Share2 className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="max-w-md mx-auto px-4 py-6 space-y-6">
                {/* Status Card */}
                <div className="bg-white rounded-2xl p-6 shadow-card border border-secondary-100 print:shadow-none print:border">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h2 className="text-2xl font-bold text-secondary-900">
                                {data.vehicle.model}
                            </h2>
                            <p className="text-secondary-500 font-medium">{data.vehicle.license_plate}</p>
                        </div>
                        <div className={`
                            px-4 py-1.5 rounded-full text-sm font-bold capitalize
                            ${data.workOrder.status === 'completed' ? 'bg-green-100 text-green-700' :
                                data.workOrder.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                    'bg-yellow-100 text-yellow-700'}
                        `}>
                            {data.workOrder.status === 'completed' ? 'Pronto' :
                                data.workOrder.status === 'in_progress' ? 'Em Andamento' :
                                    'Pendente'}
                        </div>
                    </div>

                    {/* Timeline */}
                    <Timeline
                        status={data.workOrder.status}
                        entryDate={data.workOrder.entry_date}
                        completionDate={data.workOrder.completed_at || data.workOrder.expected_completion_date}
                    />
                </div>

                {/* Photo Gallery - Before & After */}
                {hasComparison && (
                    <div className="space-y-3 print:break-inside-avoid">
                        <h3 className="font-bold text-lg text-secondary-900 px-1">Resultado</h3>

                        {/* Before Photos Gallery */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between px-1">
                                <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Antes</span>
                                <span className="text-xs text-gray-500">{beforePhotos.length} {beforePhotos.length === 1 ? 'foto' : 'fotos'}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {beforePhotos.map((photo: any, index: number) => (
                                    <div
                                        key={photo.id || index}
                                        onClick={() => setSelectedPhoto(photo.url)}
                                        className="relative aspect-square rounded-xl overflow-hidden cursor-pointer group"
                                    >
                                        <img
                                            src={photo.url}
                                            alt={`Antes ${index + 1}`}
                                            className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                            <Camera className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* After Photos Gallery */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between px-1">
                                <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Depois</span>
                                <span className="text-xs text-gray-500">{afterPhotos.length} {afterPhotos.length === 1 ? 'foto' : 'fotos'}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {afterPhotos.map((photo: any, index: number) => (
                                    <div
                                        key={photo.id || index}
                                        onClick={() => setSelectedPhoto(photo.url)}
                                        className="relative aspect-square rounded-xl overflow-hidden cursor-pointer group"
                                    >
                                        <img
                                            src={photo.url}
                                            alt={`Depois ${index + 1}`}
                                            className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                            <Camera className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Checklist Section */}
                <div className="bg-white rounded-2xl p-6 shadow-card border border-secondary-100 print:shadow-none print:border">
                    <h3 className="font-bold text-lg text-secondary-900 mb-4 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-primary-600" />
                        Checklist de Entrada
                    </h3>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="p-3 bg-gray-50 rounded-xl">
                            <p className="text-xs text-gray-500 mb-1">Combustível</p>
                            <div className="flex items-center gap-2">
                                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-primary-500 rounded-full"
                                        style={{ width: `${(data.workOrder.fuel_level || 0)}%` }}
                                    />
                                </div>
                                <span className="text-sm font-bold text-gray-700">
                                    {data.workOrder.fuel_level || 0}%
                                </span>
                            </div>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-xl">
                            <p className="text-xs text-gray-500 mb-1">Quilometragem</p>
                            <p className="font-bold text-gray-700">
                                {data.workOrder.odometer ? `${data.workOrder.odometer} km` : 'N/A'}
                            </p>
                        </div>
                    </div>

                    {(data.workOrder.damage_notes || data.workOrder.customer_belongings) && (
                        <div className="space-y-4">
                            {data.workOrder.damage_notes && (
                                <div className="text-sm">
                                    <span className="font-medium text-gray-700 flex items-center gap-1 mb-1">
                                        <AlertTriangle className="w-3 h-3 text-amber-500" />
                                        Danos / Avarias:
                                    </span>
                                    <p className="text-gray-600 bg-amber-50 p-3 rounded-lg border border-amber-100">
                                        {data.workOrder.damage_notes}
                                    </p>
                                </div>
                            )}

                            {/* Damage Photos - Inline in Checklist */}
                            {data.photos.filter((p: any) => p.category === 'damage').length > 0 && (
                                <div className="mt-2">
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 pl-1">
                                        Fotos de Avarias:
                                    </p>
                                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                                        {data.photos.filter((p: any) => p.category === 'damage').map((photo: any, idx: number) => (
                                            <div
                                                key={idx}
                                                className="aspect-square rounded-md overflow-hidden bg-gray-100 border border-gray-200 cursor-pointer group"
                                                onClick={() => setSelectedPhoto(photo.url)}
                                            >
                                                <img
                                                    src={photo.url}
                                                    alt="Avaria"
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {data.workOrder.customer_belongings && (
                                <div className="text-sm">
                                    <span className="font-medium text-gray-700 block mb-1">Pertences do Cliente:</span>
                                    <p className="text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                        {data.workOrder.customer_belongings}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Services List */}
                <div className="bg-white rounded-2xl overflow-hidden shadow-card border border-secondary-100 print:break-inside-avoid">
                    <div className="p-4 border-b border-gray-100 bg-secondary-50/50">
                        <h3 className="font-bold text-secondary-900">Serviços Contratados</h3>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {data.services.map((service: any) => (
                            <div key={service.id} className="p-4 flex justify-between items-center">
                                <div>
                                    <span className="text-secondary-700 font-medium block">{service.service_name}</span>
                                    {service.quantity > 1 && (
                                        <span className="text-xs text-secondary-400">
                                            {service.quantity}x {formatCurrency(service.unit_price)}
                                        </span>
                                    )}
                                </div>
                                <span className="text-secondary-500 text-sm">{formatCurrency(service.total_price)}</span>
                            </div>
                        ))}

                        {/* Financial Summary */}
                        <div className="bg-gray-50 p-4 space-y-2">
                            {/* Calculate discount amount based on type */}
                            {(() => {
                                const discountType = data.workOrder.discount_type || 'fixed';
                                const discountValue = data.workOrder.discount || 0;
                                const subtotal = data.workOrder.subtotal || 0;

                                // Calculate actual discount amount (just for display logic)
                                const discountAmount = discountType === 'percentage'
                                    ? (subtotal * discountValue) / 100
                                    : discountValue;

                                // Use pre-calculated total from BE
                                const total = data.workOrder.total;

                                return (
                                    <>
                                        {/* Show Subtotal and Discount only if there is a discount */}
                                        {discountValue > 0 && (
                                            <>
                                                <div className="flex justify-between items-center text-secondary-600 text-sm">
                                                    <span>Subtotal</span>
                                                    <span>{formatCurrency(subtotal)}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-green-600 text-sm">
                                                    <span>
                                                        Desconto
                                                        {discountType === 'percentage' && (
                                                            <span className="ml-1">({discountValue}%)</span>
                                                        )}
                                                    </span>
                                                    <span>- {formatCurrency(discountAmount)}</span>
                                                </div>
                                                <div className="border-t border-gray-200 my-2"></div>
                                            </>
                                        )}

                                        <div className="flex justify-between items-center font-bold text-secondary-900 text-lg">
                                            <span>Total</span>
                                            <span>{formatCurrency(total)}</span>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                </div>

                {/* Print Action */}
                <div className="flex justify-center pt-4 pb-8 print:hidden">
                    <button
                        onClick={() => window.print()}
                        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-100"
                    >
                        <Printer className="w-4 h-4" />
                        Imprimir / Salvar PDF
                    </button>
                </div>

                {/* Footer */}
                <div className="text-center py-8 px-4 border-t border-gray-100 print:hidden">
                    <div className="max-w-md mx-auto space-y-4">
                        {/* GestorAuto Branding */}
                        <div>
                            <p className="text-gray-400 text-sm">Acompanhamento em tempo real via</p>
                            <a
                                href="https://meugestorauto.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-bold text-primary-600 hover:text-primary-700 transition-colors text-lg inline-block mt-1"
                            >
                                GestorAuto
                            </a>
                            <p className="text-xs text-gray-400 mt-1">Sistema de Gestão para Estéticas Automotivas</p>
                        </div>

                        {/* Divider */}
                        <div className="flex items-center gap-3">
                            <div className="flex-1 h-px bg-gray-200"></div>
                            <span className="text-xs text-gray-400">•</span>
                            <div className="flex-1 h-px bg-gray-200"></div>
                        </div>

                        {/* Development Credits */}
                        <div className="text-xs text-gray-400 space-y-1">
                            <p>Desenvolvimento de Aplicativos e Sistemas</p>
                            <a
                                href="https://wa.me/5544997375327"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary-500 hover:text-primary-600 transition-colors font-medium inline-flex items-center gap-1"
                            >
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                </svg>
                                (44) 99737-5327
                            </a>
                        </div>
                    </div>
                </div>
            </div>
            {/* Photo Lightbox with Navigation */}
            {selectedPhoto && (() => {
                // Get all photos (before + after)
                const allPhotos = [...beforePhotos, ...afterPhotos];
                const currentIndex = allPhotos.findIndex(p => p.url === selectedPhoto);
                const hasPrevious = currentIndex > 0;
                const hasNext = currentIndex < allPhotos.length - 1;

                const goToPrevious = () => {
                    if (hasPrevious) {
                        setSelectedPhoto(allPhotos[currentIndex - 1].url);
                    }
                };

                const goToNext = () => {
                    if (hasNext) {
                        setSelectedPhoto(allPhotos[currentIndex + 1].url);
                    }
                };

                // Keyboard navigation
                const handleKeyDown = (e: React.KeyboardEvent) => {
                    if (e.key === 'ArrowLeft') goToPrevious();
                    if (e.key === 'ArrowRight') goToNext();
                    if (e.key === 'Escape') setSelectedPhoto(null);
                };

                return (
                    <div
                        className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm"
                        onClick={() => setSelectedPhoto(null)}
                        onKeyDown={handleKeyDown}
                        tabIndex={0}
                    >
                        {/* Close Button */}
                        <button
                            className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-10"
                            onClick={() => setSelectedPhoto(null)}
                        >
                            <X className="w-6 h-6" />
                        </button>

                        {/* Photo Counter */}
                        <div className="absolute top-4 left-4 bg-black/50 text-white px-4 py-2 rounded-full text-sm font-medium">
                            {currentIndex + 1} / {allPhotos.length}
                        </div>

                        {/* Previous Arrow */}
                        {hasPrevious && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    goToPrevious();
                                }}
                                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all hover:scale-110 z-10"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                        )}

                        {/* Photo */}
                        <img
                            src={selectedPhoto}
                            alt={`Foto ${currentIndex + 1}`}
                            className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        />

                        {/* Next Arrow */}
                        {hasNext && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    goToNext();
                                }}
                                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all hover:scale-110 z-10"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        )}

                        {/* Swipe hint for mobile */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full text-xs">
                            ← Deslize ou use as setas →
                        </div>
                    </div>
                );
            })()}
        </div>
    );
};
