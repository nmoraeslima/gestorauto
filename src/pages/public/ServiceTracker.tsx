import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Timeline } from '@/components/tracker/Timeline';
import { BeforeAfterSlider } from '@/components/tracker/BeforeAfterSlider';
import { Car, MapPin, Phone, Share2, Loader2, Calendar, Shield, Printer, Camera } from 'lucide-react';
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
            const isPremium = plan === 'premium';

            if (!isPremium) {
                setAccessDenied(true);
                setLoading(false);
                return;
            }

            setData({
                workOrder: rpcData.workOrder,
                company: rpcData.company,
                customer: rpcData.customer,
                vehicle: rpcData.vehicle,
                services: rpcData.services || [],
                photos: rpcData.photos || []
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

    if (accessDenied) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-center">
                <div className="bg-white p-8 rounded-2xl shadow-sm max-w-sm">
                    <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h1 className="text-xl font-bold text-gray-900">Acesso Restrito</h1>
                    <p className="text-gray-500 mt-2">Esta empresa não possui o módulo de rastreamento online ativo.</p>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-center">
                <Car className="w-16 h-16 text-gray-300 mb-4" />
                <h1 className="text-xl font-bold text-gray-900">Serviço não encontrado</h1>
                <p className="text-gray-500 mt-2">Verifique o link e tente novamente.</p>
            </div>
        );
    }

    // Filter photos for Before/After
    const beforePhotos = data.photos.filter(p => p.type === 'before');
    const afterPhotos = data.photos.filter(p => p.type === 'after');
    const hasComparison = beforePhotos.length > 0 && afterPhotos.length > 0;

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            {/* Header / Brand */}
            <div className="bg-white shadow-sm border-b border-gray-100">
                <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="font-bold text-lg text-secondary-900">{data.company.name}</h1>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate max-w-[200px]">{data.company.address || 'Endereço não disponível'}</span>
                        </div>
                    </div>
                    <button
                        onClick={handleShare}
                        className="p-2 rounded-full bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors"
                    >
                        <Share2 className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="max-w-md mx-auto px-4 space-y-6 mt-6">
                {/* Vehicle Card */}
                <div className="bg-white rounded-2xl p-5 shadow-card border border-secondary-100">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <p className="text-xs font-bold text-primary-600 uppercase tracking-wider mb-1">Veículo</p>
                            <h2 className="text-2xl font-bold text-secondary-900">{data.vehicle.model}</h2>
                            <p className="text-secondary-600">{data.vehicle.brand} • {data.vehicle.plate}</p>
                        </div>
                        <div className="w-12 h-12 bg-secondary-50 rounded-full flex items-center justify-center text-secondary-400">
                            <Car className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                        <Calendar className="w-4 h-4" />
                        <span>Entrada: {new Date(data.workOrder.created_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                </div>

                {/* Timeline */}
                <div className="bg-white rounded-2xl p-6 shadow-card border border-secondary-100">
                    <h3 className="font-bold text-lg text-secondary-900 mb-6">Status do Serviço</h3>
                    <Timeline
                        status={data.workOrder.status}
                        createdAt={data.workOrder.created_at}
                        updatedAt={data.workOrder.updated_at}
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
                {data.workOrder.entry_checklist && (
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
                                            style={{ width: `${(data.workOrder.entry_checklist.fuel_level || 0) * 25}%` }}
                                        />
                                    </div>
                                    <span className="text-sm font-bold text-gray-700">
                                        {data.workOrder.entry_checklist.fuel_level}/4
                                    </span>
                                </div>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-xl">
                                <p className="text-xs text-gray-500 mb-1">Quilometragem</p>
                                <p className="font-bold text-gray-700">
                                    {data.workOrder.entry_checklist.mileage ? `${data.workOrder.entry_checklist.mileage} km` : 'N/A'}
                                </p>
                            </div>
                        </div>

                        {(data.workOrder.entry_checklist.notes || (data.workOrder.entry_checklist.scratches && data.workOrder.entry_checklist.scratches.length > 0)) && (
                            <div className="space-y-3">
                                {data.workOrder.entry_checklist.notes && (
                                    <div className="text-sm">
                                        <span className="font-medium text-gray-700">Observações:</span>
                                        <p className="text-gray-600 mt-1 bg-gray-50 p-3 rounded-lg">
                                            {data.workOrder.entry_checklist.notes}
                                        </p>
                                    </div>
                                )}
                                {data.workOrder.entry_checklist.scratches?.length > 0 && (
                                    <div className="text-sm">
                                        <span className="font-medium text-gray-700 block mb-2">Avarias Registradas:</span>
                                        <div className="flex flex-wrap gap-2">
                                            {data.workOrder.entry_checklist.scratches.map((item: string, idx: number) => (
                                                <span key={idx} className="px-2 py-1 bg-red-50 text-red-600 rounded text-xs border border-red-100">
                                                    {item}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

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
                                    {beforePhotos.map((photo, idx) => (
                                        <div key={idx} className="aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
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
                                    {afterPhotos.map((photo, idx) => (
                                        <div key={idx} className="aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
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

                                // Calculate actual discount amount
                                const discountAmount = discountType === 'percentage'
                                    ? (subtotal * discountValue) / 100
                                    : discountValue;

                                const total = subtotal - discountAmount;

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
        </div>
    );
};
