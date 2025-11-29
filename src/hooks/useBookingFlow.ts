import { useState, useEffect, useCallback } from 'react';

export type BookingStep = 'service' | 'datetime' | 'customer' | 'confirmation';

export interface BookingData {
    // Service selection
    serviceId: string;
    serviceName: string;
    servicePrice: number;
    serviceDuration: number;

    // Date/Time selection
    selectedDate: Date | null;
    selectedTime: string | null;

    // Customer info
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    vehicleBrand: string;
    vehicleModel: string;
    vehiclePlate: string;
    notes: string;

    // Confirmation
    appointmentId?: string;
}

const INITIAL_DATA: BookingData = {
    serviceId: '',
    serviceName: '',
    servicePrice: 0,
    serviceDuration: 60,
    selectedDate: null,
    selectedTime: null,
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    vehicleBrand: '',
    vehicleModel: '',
    vehiclePlate: '',
    notes: '',
};

const STEPS: BookingStep[] = ['service', 'datetime', 'customer', 'confirmation'];
const SESSION_KEY = 'booking_flow_data';

export const useBookingFlow = (companyId: string) => {
    const [currentStep, setCurrentStep] = useState<BookingStep>('service');
    const [data, setData] = useState<BookingData>(INITIAL_DATA);

    // Load from sessionStorage on mount
    useEffect(() => {
        try {
            const stored = sessionStorage.getItem(`${SESSION_KEY}_${companyId}`);
            if (stored) {
                const parsed = JSON.parse(stored);
                // Restore Date object
                if (parsed.selectedDate) {
                    parsed.selectedDate = new Date(parsed.selectedDate);
                }
                setData(parsed);
            }
        } catch (error) {
            console.error('Error loading booking data from session:', error);
        }
    }, [companyId]);

    // Save to sessionStorage on data change
    useEffect(() => {
        try {
            sessionStorage.setItem(`${SESSION_KEY}_${companyId}`, JSON.stringify(data));
        } catch (error) {
            console.error('Error saving booking data to session:', error);
        }
    }, [data, companyId]);

    const updateData = useCallback((updates: Partial<BookingData>) => {
        setData((prev) => ({ ...prev, ...updates }));
    }, []);

    const goNext = useCallback(() => {
        const currentIndex = STEPS.indexOf(currentStep);
        if (currentIndex < STEPS.length - 1) {
            setCurrentStep(STEPS[currentIndex + 1]);
        }
    }, [currentStep]);

    const goBack = useCallback(() => {
        const currentIndex = STEPS.indexOf(currentStep);
        if (currentIndex > 0) {
            setCurrentStep(STEPS[currentIndex - 1]);
        }
    }, [currentStep]);

    const goToStep = useCallback((step: BookingStep) => {
        setCurrentStep(step);
    }, []);

    const reset = useCallback(() => {
        setData(INITIAL_DATA);
        setCurrentStep('service');
        try {
            sessionStorage.removeItem(`${SESSION_KEY}_${companyId}`);
        } catch (error) {
            console.error('Error clearing booking data from session:', error);
        }
    }, [companyId]);

    const canGoNext = useCallback(() => {
        switch (currentStep) {
            case 'service':
                return !!data.serviceId;
            case 'datetime':
                return !!data.selectedDate && !!data.selectedTime;
            case 'customer':
                return !!(
                    data.customerName &&
                    data.customerPhone &&
                    data.vehicleModel &&
                    data.vehiclePlate
                );
            case 'confirmation':
                return false; // Can't go forward from confirmation
            default:
                return false;
        }
    }, [currentStep, data]);

    return {
        currentStep,
        data,
        updateData,
        goNext,
        goBack,
        goToStep,
        reset,
        canGoNext: canGoNext(),
        stepIndex: STEPS.indexOf(currentStep),
        totalSteps: STEPS.length,
    };
};
