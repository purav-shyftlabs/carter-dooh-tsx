import React from 'react';
import { useRouter } from 'next/router';
import InternalLayout from '@/layouts/internal-layout/internal-layout';
import ScreenDetails from '../components/screen-details.component';
import { NextPageWithLayout } from '@/types/common';

const ScreenDetailsContainer: NextPageWithLayout = () => {
  const router = useRouter();
  const { id } = router.query;
  const screenId = typeof id === 'string' ? id : null;

  if (!screenId) {
    return (
      <div style={{ padding: '24px' }}>
        <div>Invalid screen ID</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <ScreenDetails screenId={screenId} />
    </div>
  );
};

ScreenDetailsContainer.getLayout = (page: React.ReactNode) => (
  <InternalLayout head={{ title: 'Screen Details', description: 'View and manage screen details' }}>
    {page}
  </InternalLayout>
);

export default ScreenDetailsContainer;

