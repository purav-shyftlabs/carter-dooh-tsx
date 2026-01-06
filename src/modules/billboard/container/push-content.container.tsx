import React from 'react';
import InternalLayout from '@/layouts/internal-layout/internal-layout';
import PushContent from '../components/push-content.component';
import { NextPageWithLayout } from '@/types/common';

const PushContentContainer: NextPageWithLayout = () => {
  return <PushContent />;
};

PushContentContainer.getLayout = (page: React.ReactNode) => (
  <InternalLayout head={{ title: 'Push Content', description: 'Push content to screens in real-time' }}>
    {page}
  </InternalLayout>
);

export default PushContentContainer;

