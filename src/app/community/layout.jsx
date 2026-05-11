import React from 'react';
import PublicLayout from '@/components/layout/public/PublicLayout';

export default function CommunityLayout({ children }) {
    return (
        <PublicLayout>
            {children}
        </PublicLayout>
    );
}