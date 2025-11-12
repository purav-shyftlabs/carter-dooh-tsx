import React, { useState, useEffect } from 'react';
import { integrationsService } from '@/services/integrations/integrations.service';
import { Integration } from '@/types/integrations';
import { Button } from 'shyftlabs-dsl';
import { PlusIcon } from '@/lib/icons';
import styles from '../styles/playlist-builder.module.scss';
import { usePlaylistStore } from '@/contexts/playlist/playlist.store';
import useAlert from '@/contexts/alert/alert.hook';
import { AlertVariant } from '@/contexts/alert/alert.provider';

const IntegrationSelector: React.FC = () => {
  const { addItem } = usePlaylistStore();
  const { showAlert } = useAlert();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [duration, setDuration] = useState(30);

  useEffect(() => {
    const loadIntegrations = async () => {
      try {
        setIsLoading(true);
        const response = await integrationsService.getIntegrations({
          status: 'connected',
          enabled: true,
        });
        setIntegrations(response.data.items || []);
      } catch (error) {
        console.error('Error loading integrations:', error);
        showAlert('Failed to load integrations', AlertVariant.ERROR);
      } finally {
        setIsLoading(false);
      }
    };
    loadIntegrations();
  }, [showAlert]);

  const handleAddIntegration = () => {
    if (!selectedIntegration) {
      showAlert('Please select an integration', AlertVariant.ERROR);
      return;
    }

    const integrationName = selectedIntegration.app?.name || 'Integration';
    const cityConfig = selectedIntegration.configurations?.find((c) => c.key === 'city');
    const cityName = cityConfig ? ` - ${cityConfig.value}` : '';
    const name = `${integrationName}${cityName}`;

    addItem({
      type: 'integration',
      integrationId: selectedIntegration.id,
      name,
      duration,
      integration: {
        id: selectedIntegration.id,
        app_id: selectedIntegration.app_id,
        app_name: selectedIntegration.app?.name || 'Unknown App',
        app_logo: selectedIntegration.app?.logo_url,
        status: selectedIntegration.status,
      },
    });

    showAlert('Integration added to playlist', AlertVariant.SUCCESS);
    setSelectedIntegration(null);
  };

  if (isLoading) {
    return <div style={{ padding: '24px', textAlign: 'center' }}>Loading integrations...</div>;
  }

  if (integrations.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: '#666' }}>
        <p>No connected integrations available.</p>
        <p style={{ marginTop: '8px', fontSize: '14px' }}>
          <a href="/integrations/apps" style={{ color: '#1976d2', textDecoration: 'none' }}>
            Connect an integration
          </a>{' '}
          to add it to your playlist.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.integrationSelector}>
      <div className={styles.integrationSelectorHeader}>
        <h3>Select Integration</h3>
        <p style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
          Choose an integration to add to your playlist
        </p>
      </div>

      <div className={styles.integrationList}>
        {integrations.map((integration) => (
          <div
            key={integration.id}
            className={`${styles.integrationOption} ${
              selectedIntegration?.id === integration.id ? styles.integrationOptionSelected : ''
            }`}
            onClick={() => setSelectedIntegration(integration)}
          >
            <div className={styles.integrationOptionIcon}>
              {integration.app?.logo_url ? (
                <img
                  src={integration.app.logo_url}
                  alt={integration.app.name}
                  style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }}
                />
              ) : (
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    background: '#f0f0f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    fontWeight: 'bold',
                    color: '#666',
                  }}
                >
                  {integration.app?.name?.charAt(0) || '?'}
                </div>
              )}
            </div>
            <div className={styles.integrationOptionInfo}>
              <div className={styles.integrationOptionName}>
                {integration.app?.name || 'Unknown App'}
              </div>
              <div className={styles.integrationOptionCategory}>{integration.app?.category}</div>
              {integration.configurations?.length > 0 && (
                <div className={styles.integrationOptionConfig}>
                  {integration.configurations
                    .filter((c) => c.category !== 'auth')
                    .slice(0, 2)
                    .map((config) => (
                      <span key={config.key} className={styles.configBadge}>
                        {config.key}: {String(config.value).substring(0, 20)}
                      </span>
                    ))}
                </div>
              )}
            </div>
            <div className={styles.integrationOptionStatus}>
              <span
                className={
                  integration.status === 'connected'
                    ? styles.statusConnected
                    : styles.statusError
                }
              >
                {integration.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      {selectedIntegration && (
        <div className={styles.integrationSelectorForm}>
          <div className={styles.integrationFormField}>
            <label>Duration (seconds)</label>
            <input
              type="number"
              min="1"
              value={duration}
              onChange={(e) => setDuration(Math.max(1, parseInt(e.target.value) || 30))}
              style={{
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                width: '100px',
              }}
            />
          </div>
          <Button
            label="Add to Playlist"
            icon={<PlusIcon />}
            iconPosition="left"
            onClick={handleAddIntegration}
            variant="primary"
            size="small"
          />
        </div>
      )}
    </div>
  );
};

export default IntegrationSelector;

