import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedLayout } from './components/ProtectedLayout';

// Auth Pages
import { SignIn } from './pages/auth/SignIn';
import { SignUp } from './pages/auth/SignUp';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { notificationService } from './services/notificationService';

// App Pages
import { Dashboard } from './pages/Dashboard';
import { SubscriptionRenew } from './pages/subscription/SubscriptionRenew';

// CRM Pages
import { Customers } from './pages/crm/Customers';
import { Vehicles } from './pages/crm/Vehicles';
import { Services } from './pages/catalog/Services';

// Operations Pages
import Appointments from './pages/operations/Appointments';
import WorkOrders from './pages/operations/WorkOrders';
import { TVDashboard } from './pages/operations/TVDashboard';

// Inventory Pages
import Products from './pages/catalog/Products';
import Inventory from './pages/inventory/Inventory';

// Financial Pages
import { FinancialDashboard } from './pages/financial/Dashboard';
import { Receivables } from './pages/financial/Receivables';
import { Payables } from './pages/financial/Payables';

// Settings Pages
import { CompanySettings } from './pages/settings/CompanySettings';
import { BookingSettings } from './pages/settings/BookingSettings';
import { ServiceTracker } from './pages/public/ServiceTracker';
import PublicBooking from './pages/public/PublicBooking';
import { Landing } from './pages/Landing';

// Legal Pages
import PrivacyPolicy from './pages/legal/PrivacyPolicy';
import TermsOfService from './pages/legal/TermsOfService';
import CookiePolicy from './pages/legal/CookiePolicy';

import { ReloadPrompt } from './components/ReloadPrompt';

// Placeholder components para páginas ainda não implementadas
const PlaceholderPage: React.FC<{ title: string }> = ({ title }) => (
    <div className="text-center py-12">
        <h1 className="text-3xl font-bold text-secondary-900 mb-4">{title}</h1>
        <p className="text-secondary-600">Esta página está em desenvolvimento.</p>
    </div>
);

function App() {
    // Service Worker is now handled by vite-plugin-pwa

    return (
        <BrowserRouter>
            <AuthProvider>
                <ReloadPrompt />
                <Toaster
                    position="top-right"
                    toastOptions={{
                        duration: 4000,
                        style: {
                            background: '#fff',
                            color: '#0f172a',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                            border: '1px solid #e2e8f0',
                            borderRadius: '0.75rem',
                            padding: '1rem',
                        },
                        success: {
                            iconTheme: {
                                primary: '#22c55e',
                                secondary: '#fff',
                            },
                        },
                        error: {
                            iconTheme: {
                                primary: '#ef4444',
                                secondary: '#fff',
                            },
                        },
                    }}
                />

                <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<Landing />} />
                    <Route path="/signin" element={<SignIn />} />
                    <Route path="/signup" element={<SignUp />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/tracker/:id" element={<ServiceTracker />} />
                    <Route path="/book/:company_slug" element={<PublicBooking />} />

                    {/* Legal Pages */}
                    <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                    <Route path="/terms-of-service" element={<TermsOfService />} />
                    <Route path="/cookie-policy" element={<CookiePolicy />} />

                    {/* Subscription Route (accessible even with expired subscription) */}
                    <Route path="/subscription/renew" element={<SubscriptionRenew />} />

                    {/* TV Dashboard - Fullscreen mode without layout */}
                    <Route path="/tv-dashboard" element={<TVDashboard />} />

                    {/* Protected Routes */}
                    <Route element={<ProtectedLayout />}>
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/customers" element={<Customers />} />
                        <Route path="/vehicles" element={<Vehicles />} />
                        <Route path="/services" element={<Services />} />
                        <Route path="/appointments" element={<Appointments />} />
                        <Route path="/work-orders" element={<WorkOrders />} />
                        <Route path="/products" element={<Products />} />
                        <Route path="/inventory" element={<Inventory />} />
                        <Route path="/financial" element={<FinancialDashboard />} />
                        <Route path="/financial/receivables" element={<Receivables />} />
                        <Route path="/financial/payables" element={<Payables />} />
                        <Route path="/settings" element={<CompanySettings />} />
                        <Route path="/settings/booking" element={<BookingSettings />} />
                    </Route>

                    {/* 404 */}
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
