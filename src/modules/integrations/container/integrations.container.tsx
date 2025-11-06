import React from 'react';
import InternalLayout from '@/layouts/internal-layout';
import PageHeader from '@/components/page-header/page-header.component';
import { Button } from 'shyftlabs-dsl';
import { PlusIcon } from '@/lib/icons';
import { useRouter } from 'next/router';
import IntegrationListing from '../components/integration-listing.component';
import ROUTES from '@/common/routes';

const Integrations: React.FC = () => {
  const router = useRouter();

  return (
    <>
      <PageHeader
        title="Integrations"
        ActionComponent={() => (
          <Button
            label="Browse Apps"
            iconPosition="left"
            size="small"
            icon={<PlusIcon />}
            onClick={() => {
              router.push(ROUTES.INTEGRATIONS.APPS);
            }}
          />
        )}
      />
      <div style={{ padding: '24px' }}>
        <IntegrationListing />
      </div>
    </>
  );
};

Integrations.getLayout = (page: React.ReactNode) => (
  <InternalLayout head={{ title: 'Integrations', description: 'Manage third-party app integrations' }}>
    {page}
  </InternalLayout>
);

export default Integrations;

