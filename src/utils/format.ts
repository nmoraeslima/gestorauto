// Formatação de moeda
export const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
};

// Formatação de data
export const formatDate = (date: string | Date): string => {
    if (typeof date === 'string') {
        // If it's an ISO string from database, parse as UTC and extract date components
        // to avoid timezone shift (e.g., "2025-12-03T00:00:00Z" should display as 03/12)
        const d = new Date(date);
        const year = d.getUTCFullYear();
        const month = String(d.getUTCMonth() + 1).padStart(2, '0');
        const day = String(d.getUTCDate()).padStart(2, '0');
        return `${day}/${month}/${year}`;
    }
    return date.toLocaleDateString('pt-BR');
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

// Formatação de quantidade de estoque (até 3 casas decimais)
export const formatQuantity = (value: number): string => {
    // Remove zeros desnecessários à direita
    return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 3
    }).format(value);
};

// Formatação de aniversário (MM-DD para DD/MM)
export const formatBirthday = (birthDate: string | null | undefined): string => {
    if (!birthDate) return '-';

    // Se for formato completo (YYYY-MM-DD), extrair apenas MM-DD
    if (birthDate.length === 10) {
        birthDate = birthDate.substring(5); // Pega apenas MM-DD
    }

    // Formato esperado: MM-DD
    const [month, day] = birthDate.split('-');
    if (!month || !day) return birthDate; // Retorna original se formato inválido

    return `${day.padStart(2, '0')}/${month.padStart(2, '0')}`;
};

