/**
 * Utility functions for input masks
 */

export const maskCPF = (value: string): string => {
    const numbers = value.replace(/\D/g, '');
    return numbers
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})/, '$1-$2')
        .replace(/(-\d{2})\d+?$/, '$1');
};

export const maskPhone = (value: string): string => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 10) {
        return numbers
            .replace(/(\d{2})(\d)/, '($1) $2')
            .replace(/(\d{4})(\d)/, '$1-$2')
            .replace(/(-\d{4})\d+?$/, '$1');
    }
    return numbers
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .replace(/(-\d{4})\d+?$/, '$1');
};

export const maskLicensePlate = (value: string): string => {
    const cleaned = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();

    // Formato antigo: AAA-0000
    if (cleaned.length <= 7 && /^[A-Z]{0,3}[0-9]{0,4}$/.test(cleaned)) {
        return cleaned.replace(/^([A-Z]{3})([0-9]{1,4})/, '$1-$2');
    }

    // Formato Mercosul: AAA0A00
    if (cleaned.length <= 7) {
        return cleaned.replace(/^([A-Z]{3})([0-9])([A-Z])([0-9]{2})/, '$1$2$3$4');
    }

    return cleaned.slice(0, 7);
};

export const unmask = (value: string): string => {
    return value.replace(/\D/g, '');
};

export const validateCPF = (cpf: string): boolean => {
    const numbers = unmask(cpf);

    if (numbers.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(numbers)) return false; // Todos os dígitos iguais

    // Validação dos dígitos verificadores
    let sum = 0;
    for (let i = 0; i < 9; i++) {
        sum += parseInt(numbers.charAt(i)) * (10 - i);
    }
    let digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    if (digit !== parseInt(numbers.charAt(9))) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) {
        sum += parseInt(numbers.charAt(i)) * (11 - i);
    }
    digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    if (digit !== parseInt(numbers.charAt(10))) return false;

    return true;
};

export const validateLicensePlate = (plate: string): boolean => {
    // Remove apenas caracteres especiais (hífens, espaços), mas mantém letras e números
    const cleaned = plate.replace(/[^A-Za-z0-9]/g, '').toUpperCase();

    // Formato antigo: AAA0000 (3 letras + 4 números)
    const oldFormat = /^[A-Z]{3}[0-9]{4}$/;

    // Formato Mercosul: AAA0A00 (3 letras + 1 número + 1 letra + 2 números)
    const mercosulFormat = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/;

    return oldFormat.test(cleaned) || mercosulFormat.test(cleaned);
};
