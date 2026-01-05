import React, { useState, useEffect } from 'react';
import { Button } from 'shyftlabs-dsl';
import { ExternalLinkIcon, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/router';
import styles from '../styles/integrations.module.scss';
import { integrationsService } from '@/services/integrations/integrations.service';
import { App, IntegrationConfiguration, SyncFrequency } from '@/types/integrations';
import IntegrationConfigForm from './integration-config-form.component';
import useAlert from '@/contexts/alert/alert.hook';
import { AlertVariant } from '@/contexts/alert/alert.provider';

interface AppDetailsProps {
  appId: number;
}

const AppDetails: React.FC<AppDetailsProps> = ({ appId }) => {
  const router = useRouter();
  const { showAlert } = useAlert();
  const [app, setApp] = useState<App | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfigForm, setShowConfigForm] = useState(false);

  useEffect(() => {
    const loadApp = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await integrationsService.getAppById(appId);
        setApp(response.data.app);
      } catch (err) {
        console.error('Error loading app:', err);
        setError('Failed to load app details');
      } finally {
        setIsLoading(false);
      }
    };
    loadApp();
  }, [appId]);

  const handleCreateIntegration = async (configurations: IntegrationConfiguration[]) => {
    console.log('handleCreateIntegration called with:', configurations);
    if (!app) {
      console.error('App is not available');
      return;
    }
    try {
      setIsCreating(true);
      setError(null);
      const payload = {
        app_id: app.id,
        sync_frequency: 'hourly' as SyncFrequency,
        configurations,
      };
      console.log('Creating integration with payload:', payload);
      const response = await integrationsService.createIntegration(payload);
      console.log('Integration created successfully:', response);

      showAlert('Integration created successfully', AlertVariant.SUCCESS);
      router.push(`/integrations/${response.data.integration.id}`);
    } catch (err: unknown) {
      console.error('Error creating integration:', err);
      const errorMessage =
        err && typeof err === 'object' && 'response' in err && err.response
          ? (err.response as { data?: { message?: string } })?.data?.message || 'Failed to create integration'
          : 'Failed to create integration';
      setError(errorMessage);
      showAlert(errorMessage, AlertVariant.ERROR);
      setIsCreating(false);
    }
  };

  const handleOAuthConnect = async () => {
    if (!app) return;
    try {
      const redirectUri = `${window.location.origin}/integrations/oauth/callback`;
      const response = await integrationsService.initiateOAuth({
        app_id: app.id,
        redirect_uri: redirectUri,
      });
      // Redirect to OAuth provider
      window.location.href = response.data.authorization_url;
    } catch (err) {
      console.error('Error initiating OAuth:', err);
      const errorMessage =
        err && typeof err === 'object' && 'response' in err && err.response
          ? (err.response as { data?: { message?: string } })?.data?.message || 'Failed to initiate OAuth'
          : 'Failed to initiate OAuth';
      setError(errorMessage);
      showAlert(errorMessage, AlertVariant.ERROR);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.appDetailsContainer}>
        <div>Loading app details...</div>
      </div>
    );
  }

  if (error && !app) {
    return (
      <div className={styles.appDetailsContainer}>
        <div className={styles.errorMessage}>{error}</div>
        <Button label="Go Back" onClick={() => router.push('/integrations/apps')} />
      </div>
    );
  }

  if (!app) {
    return (
      <div className={styles.appDetailsContainer}>
        <div>App not found</div>
      </div>
    );
  }

  const isOAuthApp = app.auth_type === 'oauth';

  return (
    <div className={styles.appDetailsContainer}>
      <Button
          label="Go Back"
          icon={<ArrowLeft />}
          onClick={() => router.push('/integrations/apps')}
          variant="tertiary"
          size="small"
          iconPosition='left'
        />
      <div className={styles.appHeader}>
        
        <div className={styles.appInfo}>
          <h1>{app.name}</h1>
          <span className={styles.category}>{app.category}</span>
          {app.description && <div className={styles.description}>{app.description}</div>}
          <div className={styles.metaInfo}>
            <div className={styles.metaItem}>
              <strong>Auth Type:</strong> {app.auth_type?.replace('_', ' ').toUpperCase() || 'N/A'}
            </div>
            {app.documentation_url && (
              <a
                href={app.documentation_url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.docLink}
              >
                <ExternalLinkIcon size={16} />
                Documentation
              </a>
            )}
          </div>
        </div>
        {app.logo_url ? (
          <img src={app.logo_url} alt={app.name} className={styles.appLogoLarge} />
        ) : (
          <div className={styles.appLogoPlaceholderLarge}>{app.name.charAt(0)}</div>
        )}
      </div>

      {error && <div className={styles.errorMessage}>{error}</div>}

      {!showConfigForm ? (
        <div>
          <p style={{ marginBottom: '24px', color: '#666' }}>
            Connect this app to start syncing data. You'll need to provide authentication credentials and
            configuration preferences.
          </p>
          {isOAuthApp ? (
            <Button
              label="Connect with OAuth"
              onClick={handleOAuthConnect}
              variant="primary"
              disabled={isCreating}
            />
          ) : (
            <Button
              label="Configure Integration"
              onClick={() => setShowConfigForm(true)}
              variant="primary"
              disabled={isCreating}
            />
          )}
        </div>
      ) : (
        <div>
          <h2 style={{ marginBottom: '16px' }}>Configure Integration</h2>
          {app.config_schema && app.config_schema.fields.length > 0 ? (
            <IntegrationConfigForm
              fields={app.config_schema.fields}
              onSubmit={handleCreateIntegration}
              onCancel={() => setShowConfigForm(false)}
              isLoading={isCreating}
            />
          ) : (
            <div className={styles.errorMessage}>
              No configuration schema available for this app.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AppDetails;

