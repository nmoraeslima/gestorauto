import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Car, Loader2, Copy, Check } from 'lucide-react';
import { portalService } from '@/services/portalService';
import toast from 'react-hot-toast';

export default function PortalLogin() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [codeGenerated, setCodeGenerated] = useState(false);
    const [code, setCode] = useState('');
    const [inputCode, setInputCode] = useState('');
    const [customerId, setCustomerId] = useState('');
    const [customerData, setCustomerData] = useState<any>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        // Verificar se já tem sessão ativa
        if (portalService.isSessionValid()) {
            navigate('/portal/dashboard');
            return;
        }

        // Descriptografar customer_id do link
        const encryptedId = searchParams.get('c');
        if (!encryptedId) {
            toast.error('Link inválido');
            return;
        }

        try {
            const decryptedId = portalService.decryptCustomerId(encryptedId);
            setCustomerId(decryptedId);
        } catch {
            toast.error('Link inválido');
        }
    }, [searchParams, navigate]);

    const handleGenerateCode = async () => {
        if (!customerId) return;

        setLoading(true);
        try {
            const response = await portalService.generateCode(customerId);
            setCode(response.code);
            setCustomerData(response);
            setCodeGenerated(true);
            toast.success('Código gerado com sucesso!');
        } catch (error: any) {
            toast.error(error.message || 'Erro ao gerar código');
        } finally {
            setLoading(false);
        }
    };

    const handleCopyCode = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        toast.success('Código copiado!');
        setTimeout(() => setCopied(false), 2000);
    };

    const handleVerifyCode = async () => {
        if (!inputCode || inputCode.length !== 6) {
            toast.error('Digite o código de 6 dígitos');
            return;
        }

        setLoading(true);
        try {
            const isValid = await portalService.validateCode(customerId, inputCode);

            if (isValid) {
                toast.success('Acesso autorizado!');
                navigate('/portal/dashboard');
            } else {
                toast.error('Código inválido ou expirado');
                setInputCode('');
            }
        } catch (error) {
            toast.error('Erro ao validar código');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
                        <Car className="w-8 h-8 text-primary-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Portal do Cliente</h1>
                    <p className="text-gray-500 mt-2">Acesse seu histórico de serviços</p>
                </div>

                {!codeGenerated ? (
                    /* Etapa 1: Gerar Código */
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600 text-center">
                            Clique no botão abaixo para gerar seu código de acesso
                        </p>
                        <button
                            onClick={handleGenerateCode}
                            disabled={loading || !customerId}
                            className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Gerando...
                                </>
                            ) : (
                                'Gerar Código de Acesso'
                            )}
                        </button>
                    </div>
                ) : (
                    /* Etapa 2: Mostrar Código e Validar */
                    <div className="space-y-6">
                        {/* Código Gerado */}
                        <div className="bg-primary-50 border-2 border-primary-200 rounded-xl p-6">
                            <p className="text-sm text-gray-600 text-center mb-2">
                                Seu código de acesso:
                            </p>
                            <div className="flex items-center justify-center gap-2">
                                <p className="text-4xl font-bold text-primary-600 tracking-[0.5em] text-center">
                                    {code}
                                </p>
                                <button
                                    onClick={handleCopyCode}
                                    className="p-2 hover:bg-primary-100 rounded-lg transition-colors"
                                    title="Copiar código"
                                >
                                    {copied ? (
                                        <Check className="w-5 h-5 text-green-600" />
                                    ) : (
                                        <Copy className="w-5 h-5 text-primary-600" />
                                    )}
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 text-center mt-2">
                                Válido por 15 minutos
                            </p>
                        </div>

                        {/* Input de Validação */}
                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-gray-700">
                                Digite o código para acessar:
                            </label>
                            <input
                                type="text"
                                value={inputCode}
                                onChange={(e) => setInputCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                placeholder="000000"
                                maxLength={6}
                                autoFocus
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-2xl font-bold tracking-[0.3em] focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                            <button
                                onClick={handleVerifyCode}
                                disabled={loading || inputCode.length !== 6}
                                className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Validando...
                                    </>
                                ) : (
                                    'Acessar Portal'
                                )}
                            </button>
                        </div>

                        {/* Link para gerar novo código */}
                        <button
                            onClick={() => {
                                setCodeGenerated(false);
                                setCode('');
                                setInputCode('');
                            }}
                            className="w-full text-sm text-gray-500 hover:text-gray-700 transition-colors"
                        >
                            Gerar novo código
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
