/**
 * INSTRUÇÕES DE INTEGRAÇÃO - PhotoManager no WorkOrderModal
 * 
 * Siga estes passos para integrar o sistema de fotos no WorkOrderModal.tsx
 */

// ============================================================================
// PASSO 1: Adicionar Imports (Linha ~15)
// ============================================================================

// ANTES:
import {
    X,
    User,
    Car as CarIcon,
    FileText,
    DollarSign,
    Save,
    AlertTriangle,
    Calendar,
    PlusCircle,
    Link as LinkIcon,
} from 'lucide-react';
import { ServiceSelector } from './ServiceSelector';
import { ProductSelector } from './ProductSelector';

// DEPOIS:
import {
    X,
    User,
    Car as CarIcon,
    FileText,
    DollarSign,
    Save,
    AlertTriangle,
    Calendar,
    PlusCircle,
    Link as LinkIcon,
    Camera,  // ← ADICIONAR
} from 'lucide-react';
import { ServiceSelector } from './ServiceSelector';
import { ProductSelector } from './ProductSelector';
import { PhotoManager } from '../workOrder/PhotoManager';  // ← ADICIONAR

// ============================================================================
// PASSO 2: Atualizar Type do activeTab (Linha ~82)
// ============================================================================

// ANTES:
const [activeTab, setActiveTab] = useState<'basic' | 'services' | 'products' | 'financial'>(
    'basic'
);

// DEPOIS:
const [activeTab, setActiveTab] = useState<'basic' | 'services' | 'products' | 'photos' | 'financial'>(
    'basic'
);

// ============================================================================
// PASSO 3: Adicionar Tab Button (Linha ~601, após botão "Produtos")
// ============================================================================

// ADICIONAR APÓS:
                        </button >
                        <button
                            onClick={() => setActiveTab('products')}
                            className={`px-4 py-2 font-medium transition-colors border-b-2 whitespace-nowrap ${
                                activeTab === 'products'
                                    ? 'border-primary-300 text-primary-300'
                                    : 'border-transparent text-neutral-500 hover:text-neutral-700'
                            }`}
                        >
                            Produtos ({selectedProducts.length})
                        </button>

// INSERIR ESTE CÓDIGO:
                        <button
                            onClick={() => setActiveTab('photos')}
                            className={`px-4 py-2 font-medium transition-colors border-b-2 whitespace-nowrap ${
                                activeTab === 'photos'
                                    ? 'border-primary-300 text-primary-300'
                                    : 'border-transparent text-neutral-500 hover:text-neutral-700'
                            }`}
                        >
                            <Camera className="w-4 h-4 inline-block mr-1" />
                            Fotos
                        </button>

// ============================================================================
// PASSO 4: Adicionar Tab Content (Linha ~882, após seção de Products)
// ============================================================================

// ADICIONAR APÓS:
{
    activeTab === 'products' && (
        <div className="space-y-4 max-h-[500px] overflow-y-auto">
            <ProductSelector
                selectedProducts={selectedProducts}
                onProductsChange={setSelectedProducts}
            />
        </div>
    )
}

// INSERIR ESTE CÓDIGO:
{
    activeTab === 'photos' && workOrder?.id && (
        <div className="space-y-4 max-h-[500px] overflow-y-auto">
            <PhotoManager
                workOrderId={workOrder.id}
                disabled={loading}
            />
        </div>
    )
}

{/* Mensagem se tentar acessar fotos em O.S. nova */ }
{
    activeTab === 'photos' && !workOrder?.id && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
            <Camera className="w-16 h-16 text-neutral-400 mb-4" />
            <h4 className="text-lg font-medium text-secondary-700 mb-2">
                Salve a O.S. primeiro
            </h4>
            <p className="text-neutral-600 max-w-md">
                As fotos só podem ser adicionadas após a Ordem de Serviço ser criada.
                Preencha as informações básicas e clique em "Salvar" para continuar.
            </p>
        </div>
    )
}

// ============================================================================
// PRONTO!
// ============================================================================

/**
 * NOTAS IMPORTANTES:
 * 
 * 1. A tab "Fotos" só aparece quando há um workOrder.id (O.S. já criada)
 * 2. Fotos não podem ser adicionadas durante a criação da O.S.
 * 3. O PhotoManager gerencia automaticamente upload, visualização e exclusão
 * 4. As fotos são organizadas em "Antes" e "Depois" automaticamente
 * 5. Lazy loading está implementado para performance
 */
