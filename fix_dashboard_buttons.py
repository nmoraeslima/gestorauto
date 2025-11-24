import re

# Ler o arquivo
with open(r'c:\Natan\Antigravity\gestorauto\src\pages\financial\Dashboard.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Substituir os Links por botões que abrem modais
# 1. Adicionar imports
content = content.replace(
    "import { Link } from 'react-router-dom';",
    ""
)

content = content.replace(
    "import { FinancialTransaction, TransactionType, TransactionStatus } from '@/types/database';",
    "import { FinancialTransaction, TransactionType, TransactionStatus } from '@/types/database';\nimport { TransactionModal } from '@/components/financial/TransactionModal';"
)

# 2. Adicionar estados dos modais
content = content.replace(
    "const [loading, setLoading] = useState(true);",
    "const [loading, setLoading] = useState(true);\n    const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);\n    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);"
)

# 3. Substituir Links por botões
old_buttons = '''                <div className="flex gap-3">
                    <Link to="/financial/receivables" className="btn-primary">
                        <TrendingUp className="h-5 w-5" />
                        <span className="hidden sm:inline">Contas a Receber</span>
                    </Link>
                    <Link to="/financial/payables" className="btn-secondary">
                        <TrendingDown className="h-5 w-5" />
                        <span className="hidden sm:inline">Contas a Pagar</span>
                    </Link>
                </div>'''

new_buttons = '''                <div className="flex gap-3">
                    <button onClick={() => setIsIncomeModalOpen(true)} className="btn-primary">
                        <TrendingUp className="h-5 w-5" />
                        <span className="hidden sm:inline">Contas a Receber</span>
                    </button>
                    <button onClick={() => setIsExpenseModalOpen(true)} className="btn-secondary">
                        <TrendingDown className="h-5 w-5" />
                        <span className="hidden sm:inline">Contas a Pagar</span>
                    </button>
                </div>'''

content = content.replace(old_buttons, new_buttons)

# 4. Adicionar modais antes do fechamento final
old_end = '''            </div>
        </div>
    );
};'''

new_end = '''            </div>

            {/* Modals */}
            <TransactionModal
                isOpen={isIncomeModalOpen}
                onClose={() => setIsIncomeModalOpen(false)}
                transaction={null}
                type={TransactionType.INCOME}
                onSuccess={loadFinancialData}
            />
            <TransactionModal
                isOpen={isExpenseModalOpen}
                onClose={() => setIsExpenseModalOpen(false)}
                transaction={null}
                type={TransactionType.EXPENSE}
                onSuccess={loadFinancialData}
            />
        </div>
    );
};'''

content = content.replace(old_end, new_end)

# Salvar
with open(r'c:\Natan\Antigravity\gestorauto\src\pages\financial\Dashboard.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Arquivo atualizado com sucesso!")
print("Mudanças:")
print("1. Removido import de Link")
print("2. Adicionado import de TransactionModal")
print("3. Adicionados estados para modais")
print("4. Substituídos Links por botões")
print("5. Adicionados modais no final")
