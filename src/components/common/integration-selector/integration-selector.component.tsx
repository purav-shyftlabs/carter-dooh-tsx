import React, { useState, useEffect } from 'react';
import { integrationsService } from '@/services/integrations/integrations.service';
import { Integration } from '@/types/integrations';
import useAlert from '@/contexts/alert/alert.hook';
import { AlertVariant } from '@/contexts/alert/alert.provider';
import styles from '@/components/common/media-library/media-library.module.scss';

export type IntegrationSelectorProps = {
  onIntegrationSelect: (integration: Integration) => void;
};

const IntegrationSelector: React.FC<IntegrationSelectorProps> = ({
  onIntegrationSelect,
}) => {
  const { showAlert } = useAlert();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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

  const handleIntegrationClick = (integration: Integration) => {
    onIntegrationSelect(integration);
  };

  if (isLoading) {
    return (
      <div className={styles.emptyLibrary} style={{ padding: '48px 24px' }}>
        Loading integrations...
      </div>
    );
  }

  if (integrations.length === 0) {
    return (
      <div className={styles.emptyLibrary} style={{ padding: '48px 24px' }}>
        <p>No connected integrations available.</p>
        <p style={{ marginTop: '8px', fontSize: '14px' }}>
          <a href="/integrations/apps" style={{ color: '#2563eb', textDecoration: 'none' }}>
            Connect an integration
          </a>{' '}
          to add it to your playlist.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.integrationSelector}>
      <div className={styles.integrationList}>
        {integrations.map((integration) => (
          <div
            key={integration.id}
            className={styles.integrationOption}
            onClick={() => handleIntegrationClick(integration)}
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
    </div>
  );
};

export default IntegrationSelector;

