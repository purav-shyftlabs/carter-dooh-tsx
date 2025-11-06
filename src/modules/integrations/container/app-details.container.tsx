import React from 'react';
import { useRouter } from 'next/router';
import InternalLayout from '@/layouts/internal-layout';
import AppDetails from '../components/app-details.component';

const AppDetailsContainer: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const appId = typeof id === 'string' ? parseInt(id, 10) : 0;

  if (!appId) {
    return (
      <div style={{ padding: '24px' }}>
        <div>Invalid app ID</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <AppDetails appId={appId} />
    </div>
  );
};

AppDetailsContainer.getLayout = (page: React.ReactNode) => (
  <InternalLayout head={{ title: 'App Details', description: 'Configure app integration' }}>{page}</InternalLayout>
);

export default AppDetailsContainer;

