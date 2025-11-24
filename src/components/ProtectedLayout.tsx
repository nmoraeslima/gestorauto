import React from 'react';
import { Outlet } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { Layout } from './Layout';

export const ProtectedLayout: React.FC = () => {
    return (
        <ProtectedRoute>
            <Layout>
                <Outlet />
            </Layout>
        </ProtectedRoute>
    );
};
