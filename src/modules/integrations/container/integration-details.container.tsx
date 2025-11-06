import React from 'react';
import { useRouter } from 'next/router';
import InternalLayout from '@/layouts/internal-layout';
import IntegrationDetails from '../components/integration-details.component';

const IntegrationDetailsContainer: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const integrationId = typeof id === 'string' ? parseInt(id, 10) : 0;

  if (!integrationId) {
    return (
      <div style={{ padding: '24px' }}>
        <div>Invalid integration ID</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <IntegrationDetails integrationId={integrationId} />
    </div>
  );
};

IntegrationDetailsContainer.getLayout = (page: React.ReactNode) => (
  <InternalLayout head={{ title: 'Integration Details', description: 'Manage integration' }}>{page}</InternalLayout>
);

export default IntegrationDetailsContainer;

