/**
 * Date and Time Utility Functions
 * Handles date formatting, parsing, and business logic for appointments
 */

/**
 * Format date to Brazilian format (DD/MM/YYYY)
 */
export const formatDate = (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
};

/**
 * Format time to HH:MM
 */
export const formatTime = (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
};

/**
 * Format date and time to Brazilian format
 */
export const formatDateTime = (date: Date | string): string => {
    return `${formatDate(date)} ${formatTime(date)}`;
};

/**
 * Parse ISO date string to Date object
 */
export const parseISODate = (isoString: string): Date => {
    return new Date(isoString);
};

/**
 * Get start of day (00:00:00)
 */
export const startOfDay = (date: Date): Date => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
};

/**
 * Get end of day (23:59:59)
 */
export const endOfDay = (date: Date): Date => {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
};

/**
 * Check if two date ranges overlap
 */
export const doTimeRangesOverlap = (
    start1: Date,
    end1: Date,
    start2: Date,
    end2: Date
): boolean => {
    return start1 < end2 && end1 > start2;
};

/**
 * Calculate duration in minutes between two dates
 */
export const getDurationInMinutes = (start: Date, end: Date): number => {
    return Math.floor((end.getTime() - start.getTime()) / (1000 * 60));
};

/**
 * Add minutes to a date
 */
export const addMinutes = (date: Date, minutes: number): Date => {
    return new Date(date.getTime() + minutes * 60000);
};

/**
 * Check if date is within business hours (8:00 - 18:00)
 */
export const isWithinBusinessHours = (date: Date): boolean => {
    const hours = date.getHours();
    return hours >= 8 && hours < 18;
};

/**
 * Check if date is a weekend (Saturday or Sunday)
 */
export const isWeekend = (date: Date): boolean => {
    const day = date.getDay();
    return day === 0 || day === 6;
};

/**
 * Get next business day (skip weekends)
 */
export const getNextBusinessDay = (date: Date): Date => {
    const next = new Date(date);
    next.setDate(next.getDate() + 1);

    while (isWeekend(next)) {
        next.setDate(next.getDate() + 1);
    }

    return next;
};

/**
 * Format relative time (e.g., "2 hours ago", "in 3 days")
 */
export const formatRelativeTime = (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = d.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 0) {
        // Past
        if (Math.abs(diffMins) < 60) {
            return `${Math.abs(diffMins)} minuto(s) atrás`;
        } else if (Math.abs(diffHours) < 24) {
            return `${Math.abs(diffHours)} hora(s) atrás`;
        } else {
            return `${Math.abs(diffDays)} dia(s) atrás`;
        }
    } else {
        // Future
        if (diffMins < 60) {
            return `em ${diffMins} minuto(s)`;
        } else if (diffHours < 24) {
            return `em ${diffHours} hora(s)`;
        } else {
            return `em ${diffDays} dia(s)`;
        }
    }
};

/**
 * Get date range for current week (Monday to Sunday)
 */
export const getCurrentWeekRange = (): { start: Date; end: Date } => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust for Sunday

    const start = new Date(now);
    start.setDate(now.getDate() + diff);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    return { start, end };
};

/**
 * Get date range for current month
 */
export const getCurrentMonthRange = (): { start: Date; end: Date } => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    return { start, end };
};

/**
 * Convert time string (HH:MM) to Date object for today
 */
export const timeStringToDate = (timeString: string, baseDate?: Date): Date => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = baseDate ? new Date(baseDate) : new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
};

/**
 * Check if a date is today
 */
export const isToday = (date: Date | string): boolean => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const today = new Date();
    return d.getDate() === today.getDate() &&
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear();
};

/**
 * Check if a date is in the past
 */
export const isPast = (date: Date | string): boolean => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d < new Date();
};

/**
 * Convert a date string (YYYY-MM-DD) to ISO string preserving local date
 * Prevents timezone issues where new Date("2025-12-03") becomes 2025-12-02 in UTC-3
 * 
 * @param dateString - Date string in YYYY-MM-DD format or ISO format
 * @returns ISO string with local date preserved
 */
export const toISOLocal = (dateString: string | Date): string => {
    if (!dateString) return new Date().toISOString();

    // If it's already a Date object, convert to ISO
    if (dateString instanceof Date) {
        return dateString.toISOString();
    }

    // Extract just the date part if it's a full ISO string
    const datePart = dateString.split('T')[0];

    // Parse the date components
    const [year, month, day] = datePart.split('-').map(Number);

    // Validate parsed values
    if (!year || !month || !day) {
        console.error('Invalid date string:', dateString);
        return new Date().toISOString();
    }

    // Create date in local timezone
    const date = new Date(year, month - 1, day, 0, 0, 0, 0);

    return date.toISOString();
};
