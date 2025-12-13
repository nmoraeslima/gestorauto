import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export default function PortalTest() {
    const [searchParams] = useSearchParams();
    const [results, setResults] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const testRPC = async () => {
        setLoading(true);
        const customerId = searchParams.get('customer_id');

        if (!customerId) {
            setResults({ error: 'Adicione ?customer_id=UUID na URL' });
            setLoading(false);
            return;
        }

        console.log('Testing with customer_id:', customerId);

        // Test 1: Check if customer exists
        const { data: customer, error: customerError } = await supabase
            .from('customers')
            .select('*')
            .eq('id', customerId)
            .single();

        console.log('Customer:', customer, customerError);

        // Test 2: Call RPC
        const { data: portalData, error: rpcError } = await supabase
            .rpc('get_customer_portal_data', {
                p_customer_id: customerId
            });

        console.log('RPC Result:', portalData, rpcError);

        setResults({
            customer,
            customerError: customerError?.message,
            portalData,
            rpcError: rpcError?.message
        });
        setLoading(false);
    };

    useEffect(() => {
        if (searchParams.get('customer_id')) {
            testRPC();
        }
    }, [searchParams]);

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-2xl font-bold mb-4">Portal RPC Test</h1>

                <div className="bg-white rounded-lg p-6 shadow mb-4">
                    <h2 className="font-bold mb-2">Instructions:</h2>
                    <p className="text-sm text-gray-600">
                        Add ?customer_id=YOUR_CUSTOMER_ID to the URL
                    </p>
                </div>

                {loading && <p>Loading...</p>}

                {results && (
                    <div className="space-y-4">
                        <div className="bg-white rounded-lg p-6 shadow">
                            <h3 className="font-bold mb-2">Customer Data:</h3>
                            <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto">
                                {JSON.stringify(results.customer, null, 2)}
                            </pre>
                            {results.customerError && (
                                <p className="text-red-600 mt-2">Error: {results.customerError}</p>
                            )}
                        </div>

                        <div className="bg-white rounded-lg p-6 shadow">
                            <h3 className="font-bold mb-2">Portal RPC Data:</h3>
                            <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto max-h-96">
                                {JSON.stringify(results.portalData, null, 2)}
                            </pre>
                            {results.rpcError && (
                                <p className="text-red-600 mt-2">Error: {results.rpcError}</p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
