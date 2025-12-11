import { supabase } from '@/lib/supabase';
import { BirthdayNotificationSettings } from '@/types/database';

export interface BirthdayCustomer {
    id: string;
    name: string;
    phone: string | null;
    birth_date: string; // MM-DD format
    is_today: boolean;
    days_until: number;
    age_turning?: number; // Optional if we don't have year
}

class BirthdayNotificationService {
    /**
     * Get company settings or create default if not exists
     */
    async getSettings(companyId: string): Promise<BirthdayNotificationSettings> {
        try {
            const { data, error } = await supabase
                .from('birthday_notification_settings')
                .select('*')
                .eq('company_id', companyId)
                .single();

            if (error && error.code === 'PGRST116') {
                // Not found, create default
                const { data: newData, error: createError } = await supabase
                    .from('birthday_notification_settings')
                    .insert([{ company_id: companyId }])
                    .select()
                    .single();

                if (createError) throw createError;
                return newData;
            }

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching birthday settings:', error);
            throw error;
        }
    }

    /**
     * Update settings
     */
    async updateSettings(settings: Partial<BirthdayNotificationSettings>, companyId: string): Promise<void> {
        const { error } = await supabase
            .from('birthday_notification_settings')
            .update(settings)
            .eq('company_id', companyId);

        if (error) throw error;
    }

    /**
     * Get upcoming birthdays based on company settings
     */
    async getUpcomingBirthdays(companyId: string): Promise<BirthdayCustomer[]> {
        const settings = await this.getSettings(companyId);
        if (!settings.enabled) return [];

        // Fetch all customers with birth_date
        const { data: customers, error } = await supabase
            .from('customers')
            .select('id, name, phone, birth_date')
            .eq('company_id', companyId)
            .not('birth_date', 'is', null);

        if (error) throw error;

        const today = new Date();
        const currentYear = today.getFullYear();
        const upcoming: BirthdayCustomer[] = [];

        customers.forEach(customer => {
            if (!customer.birth_date || customer.birth_date.length !== 5) return; // Expect MM-DD

            const [month, day] = customer.birth_date.split('-').map(Number);

            // Create date object for this year's birthday
            let birthdayDate = new Date(currentYear, month - 1, day);

            // If birthday already passed this year, look at next year
            // But for "upcoming" logic, strictly we look at next X days.
            // If passed, it's not upcoming.

            // Reset hours for comparison
            today.setHours(0, 0, 0, 0);
            birthdayDate.setHours(0, 0, 0, 0);

            // Calculate difference in days
            const diffTime = birthdayDate.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            // Logic:
            // 1. If diffDays < 0, check next year if needed (but currently we want UPCOMING)
            // 2. If diffDays == 0, it's TODAY
            // 3. If diffDays > 0 and <= settings.lead_time_days

            // Check for year wrapping (e.g. today is Dec 31, birthday Jan 1)
            let isUpcoming = false;
            let daysUntil = diffDays;

            if (diffDays >= 0 && diffDays <= settings.lead_time_days) {
                isUpcoming = true;
            } else if (diffDays < 0) {
                // Already passed this year
                // Check if it matches "next year" logic if lead time crosses year boundary
                // e.g. Today Dec 30, lead time 7 days, Birthday Jan 2
                const nextYearBirthday = new Date(currentYear + 1, month - 1, day);
                const nextDiff = Math.ceil((nextYearBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                if (nextDiff <= settings.lead_time_days) {
                    isUpcoming = true;
                    daysUntil = nextDiff;
                }
            }

            if (isUpcoming) {
                upcoming.push({
                    id: customer.id,
                    name: customer.name,
                    phone: customer.phone,
                    birth_date: customer.birth_date,
                    is_today: daysUntil === 0,
                    days_until: daysUntil
                });
            }
        });

        // Sort by days until (closest first)
        return upcoming.sort((a, b) => a.days_until - b.days_until);
    }

    /**
     * Check if notification was already sent for this year
     */
    async wasNotificationSent(customerId: string, companyId: string): Promise<boolean> {
        const year = new Date().getFullYear();
        // Since we store exact date 'YYYY-MM-DD' in history, we need to check if any entry exists for this year
        // Actually our table has `notification_date` which is the birthday date.
        // We should construct expected notification date.

        // Simpler: Check query for sent_at within this year for this customer
        const startOfYear = `${year}-01-01T00:00:00.000Z`;
        const endOfYear = `${year}-12-31T23:59:59.999Z`;

        const { count, error } = await supabase
            .from('birthday_notifications_sent')
            .select('*', { count: 'exact', head: true })
            .eq('company_id', companyId)
            .eq('customer_id', customerId)
            .gte('sent_at', startOfYear)
            .lte('sent_at', endOfYear);

        if (error) throw error;

        return (count || 0) > 0;
    }

    /**
     * Mark notification as sent
     */
    async markAsSent(customerId: string, companyId: string, birthdayDate: string): Promise<void> {
        const year = new Date().getFullYear();
        // birthdayDate is MM-DD. Construct full date YYYY-MM-DD
        const fullDate = `${year}-${birthdayDate}`;

        const { error } = await supabase
            .from('birthday_notifications_sent')
            .insert({
                company_id: companyId,
                customer_id: customerId,
                notification_date: fullDate,
                channel: 'whatsapp'
            });

        if (error) throw error;
    }
}

export const birthdayService = new BirthdayNotificationService();
