import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Timeline } from '@/components/tracker/Timeline';
import { BeforeAfterSlider } from '@/components/tracker/BeforeAfterSlider';
import { Car, MapPin, Phone, Share2, Loader2, Calendar, Shield, Printer, Camera, AlertTriangle, X } from 'lucide-react';
import { formatCurrency } from '@/utils/format';

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
            const isPremium = plan === 'premium'; // Only Premium can verify

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
            alert('Link copiado para a área de transferência!');
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
                        Este recurso é exclusivo para clientes de oficinas parceiras Premium.
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
                    <div className="font-bold text-lg text-secondary-900 truncate">
                        {data.company.name}
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

                {/* Before / After Slider (Wow Factor) */}
                {hasComparison && (
                    <div className="space-y-3 print:break-inside-avoid">
                        <h3 className="font-bold text-lg text-secondary-900 px-1">Resultado</h3>
                        <BeforeAfterSlider
                            beforeImage={beforePhotos[0].url}
                            afterImage={afterPhotos[0].url}
                        />
                        <p className="text-center text-xs text-gray-400 print:hidden">Arraste para comparar</p>
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

                {/* Photos Gallery */}
                {data.photos.length > 0 && (
                    <div className="bg-white rounded-2xl p-6 shadow-card border border-secondary-100 print:break-before-page">
                        <h3 className="font-bold text-lg text-secondary-900 mb-4 flex items-center gap-2">
                            <Camera className="w-5 h-5 text-primary-600" />
                            Galeria de Fotos
                        </h3>

                        {/* Before Photos */}
                        {beforePhotos.length > 0 && (
                            <div className="mb-6">
                                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Antes do Serviço</h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {beforePhotos.map((photo: any, idx: number) => (
                                        <div
                                            key={idx}
                                            className="aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200 cursor-pointer"
                                            onClick={() => setSelectedPhoto(photo.url)}
                                        >
                                            <img
                                                src={photo.url}
                                                alt="Antes"
                                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* After Photos */}
                        {afterPhotos.length > 0 && (
                            <div>
                                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Depois do Serviço</h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {afterPhotos.map((photo: any, idx: number) => (
                                        <div
                                            key={idx}
                                            className="aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200 cursor-pointer"
                                            onClick={() => setSelectedPhoto(photo.url)}
                                        >
                                            <img
                                                src={photo.url}
                                                alt="Depois"
                                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

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
                <div className="text-center py-8 text-gray-400 text-sm print:hidden">
                    <p>Acompanhamento em tempo real via</p>
                    <p className="font-bold text-gray-500 mt-1">GestorAuto</p>
                </div>
            </div>
            {/* Photo Lightbox */}
            {selectedPhoto && (
                <div
                    className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm transition-opacity"
                    onClick={() => setSelectedPhoto(null)}
                >
                    <button
                        className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                        onClick={() => setSelectedPhoto(null)}
                    >
                        <X className="w-6 h-6" />
                    </button>
                    <img
                        src={selectedPhoto}
                        alt="Visualização ampliada"
                        className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking image
                    />
                </div>
            )}
        </div>
    );
};
