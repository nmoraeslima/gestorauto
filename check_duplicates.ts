
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCustomers() {
    // Get the first company found (or we could try to find the specific user's company if we had their ID, but let's just look at all for now or a sample)
    // Since I don't have the user's company ID easily, I'll just list all customers and group by name to see duplicates.

    const { data: customers, error } = await supabase
        .from('customers')
        .select('id, name, is_active, deleted_at, company_id');

    if (error) {
        console.error('Error fetching customers:', error);
        return;
    }

    console.log(`Total customers found: ${customers.length}`);

    const nameCounts = {};
    customers.forEach(c => {
        if (!nameCounts[c.name]) {
            nameCounts[c.name] = [];
        }
        nameCounts[c.name].push(c);
    });

    Object.keys(nameCounts).forEach(name => {
        const list = nameCounts[name];
        if (list.length > 1) {
            console.log(`\nDuplicate Name: "${name}" - Count: ${list.length}`);
            list.forEach(c => {
                console.log(`  - ID: ${c.id}, Active: ${c.is_active}, Deleted: ${c.deleted_at}, Company: ${c.company_id}`);
            });
        }
    });
}

checkCustomers();
