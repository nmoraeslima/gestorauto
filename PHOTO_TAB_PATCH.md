# PATCH: Adicionar Tab de Fotos no WorkOrderModal.tsx

## INSTRUÇÕES
Abra o arquivo `src/components/operations/WorkOrderModal.tsx` e faça as seguintes alterações:

---

## MUDANÇA 1: Adicionar Imports (Linha ~4-17)

### ENCONTRE:
```tsx
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
```

### SUBSTITUA POR:
```tsx
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
    Camera,
} from 'lucide-react';
import { ServiceSelector } from './ServiceSelector';
import { ProductSelector } from './ProductSelector';
import { PhotoManager } from '../workOrder/PhotoManager';
```

---

## MUDANÇA 2: Atualizar Type do activeTab (Linha ~82-84)

### ENCONTRE:
```tsx
    const [activeTab, setActiveTab] = useState<'basic' | 'services' | 'products' | 'financial'>(
        'basic'
    );
```

### SUBSTITUA POR:
```tsx
    const [activeTab, setActiveTab] = useState<'basic' | 'services' | 'products' | 'photos' | 'financial'>(
        'basic'
    );
```

---

## MUDANÇA 3: Adicionar Botão da Tab (Linha ~601-611)

### ENCONTRE:
```tsx
                        </button>
                        <button
                            onClick={() => setActiveTab('financial')}
                            className={`px-4 py-2 font-medium transition-colors border-b-2 whitespace-nowrap ${
                                activeTab === 'financial'
                                    ? 'border-primary-300 text-primary-300'
                                    : 'border-transparent text-neutral-500 hover:text-neutral-700'
                            }`}
                        >
                            Financeiro
                        </button>
```

### SUBSTITUA POR:
```tsx
                        </button>
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
                        <button
                            onClick={() => setActiveTab('financial')}
                            className={`px-4 py-2 font-medium transition-colors border-b-2 whitespace-nowrap ${
                                activeTab === 'financial'
                                    ? 'border-primary-300 text-primary-300'
                                    : 'border-transparent text-neutral-500 hover:text-neutral-700'
                            }`}
                        >
                            Financeiro
                        </button>
```

---

## MUDANÇA 4: Adicionar Conteúdo da Tab (Linha ~882, após seção de Products)

### ENCONTRE (procure por esta seção):
```tsx
                        {activeTab === 'products' && (
                            <div className="space-y-4 max-h-[500px] overflow-y-auto">
                                <ProductSelector
                                    selectedProducts={selectedProducts}
                                    onProductsChange={setSelectedProducts}
                                />
                            </div>
                        )}

                        {activeTab === 'financial' && (
```

### ADICIONE ENTRE ELAS:
```tsx
                        {activeTab === 'products' && (
                            <div className="space-y-4 max-h-[500px] overflow-y-auto">
                                <ProductSelector
                                    selectedProducts={selectedProducts}
                                    onProductsChange={setSelectedProducts}
                                />
                            </div>
                        )}

                        {/* Photos Tab */}
                        {activeTab === 'photos' && workOrder?.id && (
                            <div className="space-y-4 max-h-[500px] overflow-y-auto">
                                <PhotoManager
                                    workOrderId={workOrder.id}
                                    disabled={loading}
                                />
                            </div>
                        )}

                        {activeTab === 'photos' && !workOrder?.id && (
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
                        )}

                        {activeTab === 'financial' && (
```

---

## ✅ PRONTO!

Salve o arquivo e a tab de Fotos deve aparecer quando você editar uma O.S. existente.

**IMPORTANTE**: A tab só aparece em O.S. já criadas, não durante a criação de uma nova O.S.
