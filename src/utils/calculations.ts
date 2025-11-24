/**
 * Financial Calculation Utilities
 * Handles currency formatting, discounts, and work order calculations
 */

/**
 * Format number as Brazilian Real (BRL)
 */
export const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value);
};

/**
 * Parse currency string to number
 */
export const parseCurrency = (value: string): number => {
    // Remove R$, spaces, and dots, replace comma with dot
    const cleaned = value
        .replace(/R\$\s?/g, '')
        .replace(/\./g, '')
        .replace(',', '.');
    return parseFloat(cleaned) || 0;
};

/**
 * Calculate percentage discount
 */
export const calculatePercentageDiscount = (
    amount: number,
    percentage: number
): number => {
    return (amount * percentage) / 100;
};

/**
 * Apply discount to amount
 */
export const applyDiscount = (
    amount: number,
    discount: number,
    isPercentage: boolean = true
): number => {
    if (isPercentage) {
        return amount - calculatePercentageDiscount(amount, discount);
    }
    return amount - discount;
};

/**
 * Calculate work order total from services and products
 */
export interface WorkOrderItem {
    price: number;
    quantity: number;
}

export const calculateWorkOrderTotal = (
    services: WorkOrderItem[],
    products: WorkOrderItem[],
    discount: number = 0,
    isPercentageDiscount: boolean = true
): {
    servicesSubtotal: number;
    productsSubtotal: number;
    subtotal: number;
    discountAmount: number;
    total: number;
} => {
    // Calculate services subtotal
    const servicesSubtotal = services.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
    );

    // Calculate products subtotal
    const productsSubtotal = products.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
    );

    // Calculate subtotal
    const subtotal = servicesSubtotal + productsSubtotal;

    // Calculate discount amount
    const discountAmount = isPercentageDiscount
        ? calculatePercentageDiscount(subtotal, discount)
        : discount;

    // Calculate total
    const total = Math.max(0, subtotal - discountAmount);

    return {
        servicesSubtotal,
        productsSubtotal,
        subtotal,
        discountAmount,
        total,
    };
};

/**
 * Calculate tax (if applicable)
 */
export const calculateTax = (amount: number, taxRate: number): number => {
    return (amount * taxRate) / 100;
};

/**
 * Calculate change for cash payment
 */
export const calculateChange = (total: number, paid: number): number => {
    return Math.max(0, paid - total);
};

/**
 * Format percentage
 */
export const formatPercentage = (value: number): string => {
    return `${value.toFixed(2)}%`;
};

/**
 * Calculate profit margin
 */
export const calculateProfitMargin = (
    revenue: number,
    cost: number
): number => {
    if (revenue === 0) return 0;
    return ((revenue - cost) / revenue) * 100;
};

/**
 * Round to 2 decimal places
 */
export const roundToTwo = (num: number): number => {
    return Math.round((num + Number.EPSILON) * 100) / 100;
};

/**
 * Calculate installment value
 */
export const calculateInstallment = (
    total: number,
    installments: number,
    interestRate: number = 0
): number => {
    if (interestRate === 0) {
        return total / installments;
    }

    // Calculate with compound interest
    const monthlyRate = interestRate / 100;
    const installmentValue =
        (total * monthlyRate * Math.pow(1 + monthlyRate, installments)) /
        (Math.pow(1 + monthlyRate, installments) - 1);

    return roundToTwo(installmentValue);
};

/**
 * Validate if amount is positive
 */
export const isValidAmount = (amount: number): boolean => {
    return amount > 0 && !isNaN(amount) && isFinite(amount);
};

/**
 * Calculate average
 */
export const calculateAverage = (values: number[]): number => {
    if (values.length === 0) return 0;
    const sum = values.reduce((acc, val) => acc + val, 0);
    return sum / values.length;
};

/**
 * Calculate percentage of total
 */
export const calculatePercentageOfTotal = (
    value: number,
    total: number
): number => {
    if (total === 0) return 0;
    return (value / total) * 100;
};
