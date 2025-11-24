// Formatação de moeda
export const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
};

// Formatação de data
export const formatDate = (date: string | Date): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('pt-BR');
};

// Formatação de data e hora
export const formatDateTime = (date: string | Date): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString('pt-BR');
};

// Formatação de número
export const formatNumber = (value: number, decimals: number = 2): string => {
    return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(value);
};

// Formatação de porcentagem
export const formatPercent = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'percent',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
    }).format(value / 100);
};
