import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { Hero } from '@/components/landing/Hero';
import { DashboardPreview } from '@/components/landing/DashboardPreview';
import { Features } from '@/components/landing/Features';
import { Benefits } from '@/components/landing/Benefits';
import { MobileApp } from '@/components/landing/MobileApp';
import { Pricing } from '@/components/landing/Pricing';
import { Security } from '@/components/landing/Security';
import { Testimonials } from '@/components/landing/Testimonials';
import { CTAFooter } from '@/components/landing/CTAFooter';
import { LandingFooter } from '@/components/landing/LandingFooter';
import '@/styles/landing.css';

export const Landing: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    // Redirect to dashboard if already logged in
    useEffect(() => {
        if (user) {
            navigate('/dashboard');
        }
    }, [user, navigate]);

    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="landing-page">
            <LandingHeader />
            <main>
                <Hero />
                <DashboardPreview />
                <Features />
                <Benefits />
                <MobileApp />
                <Pricing />
                <Security />
                <Testimonials />
                <CTAFooter />
            </main>
            <LandingFooter />
        </div>
    );
};
