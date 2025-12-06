import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PLAN_LIMITS, PlanFeatures } from '@/types/database';
import { UpgradePrompt } from './UpgradePrompt';

interface FeatureGateProps {
    feature: keyof PlanFeatures;
    children: React.ReactNode;
    fallback?: React.ReactNode;
    showPrompt?: boolean;
}

export const FeatureGate: React.FC<FeatureGateProps> = ({
    feature,
    children,
    fallback = null,
    showPrompt = true
}) => {
    const { user } = useAuth();

    if (!user?.company?.subscription_plan) {
        return null;
    }

    const plan = user.company.subscription_plan;
    const limits = PLAN_LIMITS[plan];

    // Safety check if plan definition exists
    if (!limits) {
        console.error(`Invalid plan: ${plan}`);
        return null;
    }

    const isAllowed = limits.features[feature];

    if (isAllowed) {
        return <>{children}</>;
    }

    if (showPrompt) {
        return <UpgradePrompt feature={feature} />;
    }

    return <>{fallback}</>;
};
