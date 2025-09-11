import React from 'react';
import { InternalLayout, useUserData } from '@/layouts/internal-layout';
import { Typography } from 'shyftlabs-dsl';
import { carterColors } from 'shyftlabs-dsl';

const Dashboard = () => {
    const { userDisplayName, userEmail, userRole, isAdmin } = useUserData();

    return (
        <Typography fontFamily="Roboto" variant="h1-bold" color={carterColors['brand-900']}>
            Dashboard
        </Typography>
    );
};

// Set the layout for this page
Dashboard.getLayout = (page: React.ReactNode) => {
    return <InternalLayout head={{ title: 'Dashboard', description: 'User Dashboard' }}>{page}</InternalLayout>;
};

export default Dashboard;