import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Timeline } from '@/components/tracker/Timeline';
import { BeforeAfterSlider } from '@/components/tracker/BeforeAfterSlider';
import { Car, MapPin, Phone, Share2, Loader2, Calendar } from 'lucide-react';
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

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        try {
            if (!id) return;

            // 1. Fetch Work Order
            const { data: wo, error: woError } = await supabase
                .from('work_orders')
                .select('*')
                .eq('id', id)
                .single();

            if (woError || !wo) throw woError;

            // 2. Fetch Related Data (Parallel)
            const [companyRes, customerRes, vehicleRes, servicesRes, photosRes] = await Promise.all([
                supabase.from('companies').select('*').eq('id', wo.company_id).single(),
                supabase.from('customers').select('*').eq('id', wo.customer_id).single(),
                supabase.from('vehicles').select('*').eq('id', wo.vehicle_id).single(),
                supabase.from('work_order_services').select('*').eq('work_order_id', id),
                supabase.from('work_order_photos').select('*').eq('work_order_id', id)
            ]);

            setData({
                workOrder: wo,
                company: companyRes.data,
                customer: customerRes.data,
                vehicle: vehicleRes.data,
                services: servicesRes.data || [],
                photos: photosRes.data || []
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
                    <div className="space-y-3">
                        <h3 className="font-bold text-lg text-secondary-900 px-1">Resultado</h3>
                        <BeforeAfterSlider
                            beforeImage={beforePhotos[0].url}
                            afterImage={afterPhotos[0].url}
                        />
                        <p className="text-center text-xs text-gray-400">Arraste para comparar</p>
                    </div>
                )}

                {/* Services List */}
                <div className="bg-white rounded-2xl overflow-hidden shadow-card border border-secondary-100">
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

                {/* Footer */}
                <div className="text-center py-8 text-gray-400 text-sm">
                    <p>Acompanhamento em tempo real via</p>
                    <p className="font-bold text-gray-500 mt-1">GestorAuto</p>
                </div>
            </div>
        </div>
    );
};
