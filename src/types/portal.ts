// Portal do Cliente - Types

export interface MagicLink {
    id: string;
    customer_id: string;
    code: string;
    expires_at: string;
    used: boolean;
    used_at?: string;
    created_at: string;
}

export interface PortalSession {
    customer_id: string;
    expires_at: number; // timestamp
    created_at: number; // timestamp
}

export interface PortalCodeResponse {
    code: string;
    customer: {
        id: string;
        name: string;
        phone: string;
        email?: string;
        company_id: string;
    };
    company: {
        id: string;
        name: string;
        phone: string;
        logo_url?: string;
    };
    expires_at: string;
}

export interface PortalData {
    customer: {
        id: string;
        name: string;
        phone: string;
        email?: string;
        customer_type: 'individual' | 'corporate';
        created_at: string;
    };
    company: {
        id: string;
        name: string;
        phone: string;
        logo_url?: string;
    };
    work_orders: WorkOrderPortal[];
    stats: {
        total_spent: number;
        total_services: number;
    };
}

export interface WorkOrderPortal {
    id: string;
    status: string;
    entry_date: string;
    completed_at?: string;
    total: number;
    notes?: string;
    vehicle_model: string;
    license_plate: string;
    vehicle_color?: string;
    services: ServicePortal[];
    photos: PhotoPortal[];
}

export interface ServicePortal {
    name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
}

export interface PhotoPortal {
    id: string;
    file_path: string;
    category: 'before' | 'after' | 'damage';
    created_at: string;
}
