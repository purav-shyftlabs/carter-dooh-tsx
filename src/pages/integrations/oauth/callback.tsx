import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import useAlert from '@/contexts/alert/alert.hook';
import { AlertVariant } from '@/contexts/alert/alert.provider';

const OAuthCallback: React.FC = () => {
  const router = useRouter();
  const { showAlert } = useAlert();

  useEffect(() => {
    const { success, integration_id, app_id, error } = router.query;

    if (success === 'true' && integration_id) {
      showAlert('Integration connected successfully', AlertVariant.SUCCESS);
      router.push(`/integrations/${integration_id}`);
    } else if (error) {
      showAlert(`OAuth error: ${error}`, AlertVariant.ERROR);
      router.push('/integrations/apps');
    } else {
      // No query params yet, wait for them
      if (Object.keys(router.query).length === 0) {
        return;
      }
      // If we have query params but no success/error, something went wrong
      showAlert('OAuth callback received invalid response', AlertVariant.ERROR);
      router.push('/integrations/apps');
    }
  }, [router.query, router, showAlert]);

  return (
    <div style={{ padding: '24px', textAlign: 'center' }}>
      <div>Processing OAuth callback...</div>
    </div>
  );
};

export default OAuthCallback;

