import re

# Ler o arquivo
with open(r'c:\Natan\Antigravity\gestorauto\src\pages\financial\Dashboard.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Atualizar interface FinancialStats
old_interface = '''interface FinancialStats {
    totalIncome: number;
    totalExpense: number;
    balance: number;
    pendingIncome: number;
    pendingExpense: number;
    overdueCount: number;
}'''

new_interface = '''interface FinancialStats {
    totalIncome: number;
    totalExpense: number;
    balance: number;
    pendingIncome: number;
    pendingExpense: number;
    overdueReceivables: number;
    overduePayables: number;
}'''

content = content.replace(old_interface, new_interface)

# 2. Atualizar inicialização do estado
old_init = '''    const [stats, setStats] = useState<FinancialStats>({
        totalIncome: 0,
        totalExpense: 0,
        balance: 0,
        pendingIncome: 0,
        pendingExpense: 0,
        overdueCount: 0
    });'''

new_init = '''    const [stats, setStats] = useState<FinancialStats>({
        totalIncome: 0,
        totalExpense: 0,
        balance: 0,
        pendingIncome: 0,
        pendingExpense: 0,
        overdueReceivables: 0,
        overduePayables: 0
    });'''

content = content.replace(old_init, new_init)

# 3. Atualizar cálculo de vencidas
old_calc = '''            const today = new Date().toISOString().split('T')[0];
            const overdueCount = transactions?.filter(t => 
                t.status === 'pending' && t.due_date < today
            ).length || 0;

            setStats({
                totalIncome: income,
                totalExpense: expense,
                balance: income - expense,
                pendingIncome,
                pendingExpense,
                overdueCount
            });'''

new_calc = '''            const today = new Date().toISOString().split('T')[0];
            const overdueReceivables = transactions?.filter(t => 
                t.type === 'income' && t.status === 'pending' && t.due_date < today
            ).length || 0;
            
            const overduePayables = transactions?.filter(t => 
                t.type === 'expense' && t.status === 'pending' && t.due_date < today
            ).length || 0;

            setStats({
                totalIncome: income,
                totalExpense: expense,
                balance: income - expense,
                pendingIncome,
                pendingExpense,
                overdueReceivables,
                overduePayables
            });'''

content = content.replace(old_calc, new_calc)

# 4. Atualizar alerta
old_alert = '''            {/* Alertas */}
            {stats.overdueCount > 0 && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="h-5 w-5 text-red-600" />
                        <div>
                            <p className="text-sm font-medium text-red-800">
                                Você tem {stats.overdueCount} conta(s) vencida(s)
                            </p>
                            <p className="text-xs text-red-600 mt-1">
                                Regularize os pagamentos para manter o fluxo de caixa saudável
                            </p>
                        </div>
                    </div>
                </div>
            )}'''

new_alert = '''            {/* Alertas */}
            {(stats.overdueReceivables > 0 || stats.overduePayables > 0) && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="h-5 w-5 text-red-600" />
                        <div className="flex-1">
                            <p className="text-sm font-medium text-red-800">
                                Atenção: Você tem contas vencidas
                            </p>
                            <div className="mt-2 space-y-1">
                                {stats.overdueReceivables > 0 && (
                                    <p className="text-xs text-red-600">
                                        • {stats.overdueReceivables} conta(s) a receber vencida(s)
                                    </p>
                                )}
                                {stats.overduePayables > 0 && (
                                    <p className="text-xs text-red-600">
                                        • {stats.overduePayables} conta(s) a pagar vencida(s)
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}'''

content = content.replace(old_alert, new_alert)

# 5. Substituir o card único de "Contas Vencidas" por dois cards separados
old_card = '''                {/* Contas Vencidas */}
                <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Contas Vencidas</p>
                            <p className="mt-2 text-2xl font-bold text-orange-600">
                                {stats.overdueCount}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                                Requer atenção
                            </p>
                        </div>
                        <div className="rounded-full bg-orange-100 p-3">
                            <AlertCircle className="h-6 w-6 text-orange-600" />
                        </div>
                    </div>
                </div>'''

new_card = '''                {/* Vencidas a Receber */}
                <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Vencidas a Receber</p>
                            <p className="mt-2 text-2xl font-bold text-orange-600">
                                {stats.overdueReceivables}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                                Cobrar clientes
                            </p>
                        </div>
                        <div className="rounded-full bg-orange-100 p-3">
                            <TrendingUp className="h-6 w-6 text-orange-600" />
                        </div>
                    </div>
                </div>

                {/* Vencidas a Pagar */}
                <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Vencidas a Pagar</p>
                            <p className="mt-2 text-2xl font-bold text-red-600">
                                {stats.overduePayables}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                                Regularizar urgente
                            </p>
                        </div>
                        <div className="rounded-full bg-red-100 p-3">
                            <TrendingDown className="h-6 w-6 text-red-600" />
                        </div>
                    </div>
                </div>'''

content = content.replace(old_card, new_card)

# 6. Atualizar o grid para 5 colunas no desktop
content = content.replace(
    '<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">',
    '<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">'
)

# Salvar
with open(r'c:\Natan\Antigravity\gestorauto\src\pages\financial\Dashboard.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Arquivo atualizado com sucesso!")
print("Mudanças:")
print("1. Separadas contas vencidas em 'A Receber' e 'A Pagar'")
print("2. Alerta mais claro especificando tipo de conta vencida")
print("3. Dois cards separados com cores distintas")
print("4. Grid ajustado para 5 colunas em telas grandes")
