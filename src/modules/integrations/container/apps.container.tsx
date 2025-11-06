import React from 'react';
import InternalLayout from '@/layouts/internal-layout';
import PageHeader from '@/components/page-header/page-header.component';
import AppListing from '../components/app-listing.component';

const Apps: React.FC = () => {
  return (
    <>
      <PageHeader title="Available Apps" />
      <div style={{ padding: '24px' }}>
        <AppListing />
      </div>
    </>
  );
};

Apps.getLayout = (page: React.ReactNode) => (
  <InternalLayout head={{ title: 'Available Apps', description: 'Browse and connect third-party apps' }}>
    {page}
  </InternalLayout>
);

export default Apps;

