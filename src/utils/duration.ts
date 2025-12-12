/**
 * Duration Utilities
 * Handles conversion between different time units and minutes
 */

export type DurationUnit = 'minutes' | 'hours' | 'days';

export interface DurationValue {
    value: number;
    unit: DurationUnit;
}

/**
 * Convert minutes to the most appropriate unit for display
 * @param minutes - Total minutes
 * @returns Object with value and unit
 */
export function minutesToBestUnit(minutes: number): DurationValue {
    // Days (if >= 1 day and divisible by 1440)
    if (minutes >= 1440 && minutes % 1440 === 0) {
        return { value: minutes / 1440, unit: 'days' };
    }

    // Hours (if >= 1 hour and divisible by 60)
    if (minutes >= 60 && minutes % 60 === 0) {
        return { value: minutes / 60, unit: 'hours' };
    }

    // Minutes (default)
    return { value: minutes, unit: 'minutes' };
}

/**
 * Convert any duration to minutes
 * @param value - Numeric value
 * @param unit - Time unit
 * @returns Total minutes
 */
export function toMinutes(value: number, unit: DurationUnit): number {
    switch (unit) {
        case 'days':
            return value * 1440; // 24 * 60
        case 'hours':
            return value * 60;
        case 'minutes':
        default:
            return value;
    }
}

/**
 * Format duration for display
 * @param minutes - Total minutes
 * @returns Formatted string (e.g., "2 dias", "4 horas", "30 minutos")
 */
export function formatDuration(minutes: number): string {
    const { value, unit } = minutesToBestUnit(minutes);

    const labels: Record<DurationUnit, { singular: string; plural: string }> = {
        days: { singular: 'dia', plural: 'dias' },
        hours: { singular: 'hora', plural: 'horas' },
        minutes: { singular: 'minuto', plural: 'minutos' },
    };

    const label = value === 1 ? labels[unit].singular : labels[unit].plural;
    return `${value} ${label}`;
}

/**
 * Get unit label for display
 * @param unit - Duration unit
 * @returns Localized label
 */
export function getUnitLabel(unit: DurationUnit): string {
    const labels: Record<DurationUnit, string> = {
        minutes: 'Minutos',
        hours: 'Horas',
        days: 'Dias',
    };
    return labels[unit];
}

/**
 * Get step value for input based on unit
 * @param unit - Duration unit
 * @returns Step value for number input
 */
export function getStepForUnit(unit: DurationUnit): number {
    switch (unit) {
        case 'days':
            return 0.5; // Allow half days
        case 'hours':
            return 0.5; // Allow 30-minute increments
        case 'minutes':
        default:
            return 5; // 5-minute increments
    }
}

/**
 * Get minimum value for input based on unit
 * @param unit - Duration unit
 * @returns Minimum value
 */
export function getMinForUnit(unit: DurationUnit): number {
    switch (unit) {
        case 'days':
            return 0.5; // Minimum 12 hours
        case 'hours':
            return 0.25; // Minimum 15 minutes
        case 'minutes':
        default:
            return 5; // Minimum 5 minutes
    }
}
