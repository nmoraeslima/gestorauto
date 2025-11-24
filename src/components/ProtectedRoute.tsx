import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { SubscriptionGuard } from './SubscriptionGuard';
import { Loader2 } from 'lucide-react';
    }

return <SubscriptionGuard>{children}</SubscriptionGuard>;
};
