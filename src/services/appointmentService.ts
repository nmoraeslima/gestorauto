import { supabase } from '@/lib/supabase';
import { Appointment } from '@/types/database';

export interface AppointmentWithDetails extends Appointment {
    customer?: { name: string; phone: string };
    vehicle?: { brand: string; model: string; license_plate: string };
}

export interface CreateAppointmentDTO {
    company_id: string;
    customer_id: string;
    vehicle_id: string;
    title: string;
    scheduled_at: string;
    status: string;
    duration_minutes: number;
    notes?: string;
    services?: Array<{
        service_id: string;
        price: number;
        duration_minutes: number;
    }>;
}

export interface UpdateAppointmentDTO extends Partial<Omit<CreateAppointmentDTO, 'services'>> {
    id: string;
    cancellation_reason?: string;
    cancelled_by?: string;
    cancelled_at?: string;
    services?: Array<{
        service_id: string;
        price: number;
        duration_minutes: number;
    }>;
}

export interface AppointmentListOptions {
    status?: string;
    dateFilter?: 'all' | 'today' | 'upcoming' | 'past';
    searchTerm?: string;
    limit?: number;
}

export class AppointmentService {
    async list(companyId: string, options: AppointmentListOptions = {}): Promise<AppointmentWithDetails[]> {
        let query = supabase
            .from('appointments')
            .select(`
                *,
                customer:customers(name, phone),
                vehicle:vehicles(brand, model, license_plate)
            `)
            .eq('company_id', companyId);

        if (options.status && options.status !== 'all') {
            query = query.eq('status', options.status);
        }

        if (options.limit) {
            query = query.limit(options.limit);
        }

        const { data, error } = await query.order('scheduled_at', { ascending: false });

        if (error) throw error;

        let result = data as AppointmentWithDetails[];

        if (options.dateFilter && options.dateFilter !== 'all') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            result = result.filter(a => {
                const appointmentDate = new Date(a.scheduled_at);
                appointmentDate.setHours(0, 0, 0, 0);

                if (options.dateFilter === 'today') return appointmentDate.getTime() === today.getTime();
                if (options.dateFilter === 'upcoming') return appointmentDate.getTime() >= today.getTime();
                if (options.dateFilter === 'past') return appointmentDate.getTime() < today.getTime();
                return true;
            });
        }

        if (options.searchTerm) {
            const term = options.searchTerm.toLowerCase();
            result = result.filter(a =>
                a.customer?.name.toLowerCase().includes(term) ||
                a.vehicle?.license_plate.toLowerCase().includes(term)
            );
        }

        return result;
    }


    async listOpen(companyId: string): Promise<AppointmentWithDetails[]> {
        return this.list(companyId, { status: 'scheduled' });
    }

    async getById(id: string) {
        const { data, error } = await supabase
            .from('appointments')
            .select(`
                *,
                customer:customers(*),
                vehicle:vehicles(*),
                company:companies(*),
                services:appointment_services(
                    service_id,
                    price,
                    service:services(name)
                )
            `)
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    }

    async create(data: CreateAppointmentDTO) {
        const { services, ...appointmentData } = data;

        const { data: appointment, error } = await supabase
            .from('appointments')
            .insert(appointmentData)
            .select()
            .single();

        if (error) throw error;

        if (services && services.length > 0) {
            const servicesData = services.map(s => ({
                appointment_id: appointment.id,
                service_id: s.service_id,
                price: s.price,
                duration_minutes: s.duration_minutes
            }));

            const { error: servicesError } = await supabase
                .from('appointment_services')
                .insert(servicesData);

            if (servicesError) throw servicesError;
        }

        return appointment;
    }

    async update(id: string, data: Partial<UpdateAppointmentDTO>) {
        const { services, ...appointmentData } = data;

        // 1. Update appointment details
        const { data: appointment, error } = await supabase
            .from('appointments')
            .update(appointmentData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        // 2. Handle services update if provided
        if (services) {
            // Delete existing services
            const { error: deleteError } = await supabase
                .from('appointment_services')
                .delete()
                .eq('appointment_id', id);

            if (deleteError) throw deleteError;

            // Insert new services if any
            if (services.length > 0) {
                const servicesData = services.map(s => ({
                    appointment_id: id,
                    service_id: s.service_id,
                    price: s.price,
                    duration_minutes: s.duration_minutes
                }));

                const { error: insertError } = await supabase
                    .from('appointment_services')
                    .insert(servicesData);

                if (insertError) throw insertError;
            }
        }

        return appointment;
    }

    async delete(id: string): Promise<void> {
        // 1. Delete associated services first
        const { error: servicesError } = await supabase
            .from('appointment_services')
            .delete()
            .eq('appointment_id', id);

        if (servicesError) {
            console.error('Error deleting appointment services:', servicesError);
            throw servicesError;
        }

        // 2. Delete the appointment
        const { error } = await supabase
            .from('appointments')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting appointment:', error);
            throw error;
        }
    }
}

export const appointmentService = new AppointmentService();
