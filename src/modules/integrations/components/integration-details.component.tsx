import React, { useState, useEffect } from 'react';
import { Button } from 'shyftlabs-dsl';
import { ArrowLeft, RefreshCw, Settings, Power, Trash2 } from 'lucide-react';
import { useRouter } from 'next/router';
import styles from '../styles/integrations.module.scss';
import { integrationsService } from '@/services/integrations/integrations.service';
import { Integration, IntegrationConfiguration, SyncFrequency } from '@/types/integrations';
import IntegrationConfigForm from './integration-config-form.component';
import WeatherPreviewCard from './weather-preview-card.component';
import NewsPreviewCard from './news-preview-card.component';
import useAlert from '@/contexts/alert/alert.hook';
import { AlertVariant } from '@/contexts/alert/alert.provider';

interface IntegrationDetailsProps {
  integrationId: number;
}

const IntegrationDetails: React.FC<IntegrationDetailsProps> = ({ integrationId }) => {
  const router = useRouter();
  const { showAlert } = useAlert();
  const [integration, setIntegration] = useState<Integration | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfigForm, setShowConfigForm] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [weatherData, setWeatherData] = useState<Record<string, unknown> | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  const [newsData, setNewsData] = useState<Record<string, unknown> | null>(null);
  const [isLoadingNews, setIsLoadingNews] = useState(false);

  useEffect(() => {
    const loadIntegration = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await integrationsService.getIntegrationById(integrationId);
        setIntegration(response.data.integration);
        
        // Load preview data if it's a supported app and has metadata
        const integration = response.data.integration;
        const category = integration.app?.category?.toLowerCase();
        if (category === 'weather' && integration.metadata) {
          setWeatherData(integration.metadata);
        } else if (category === 'news' && integration.metadata) {
          setNewsData(integration.metadata);
        }
      } catch (err) {
        console.error('Error loading integration:', err);
        setError('Failed to load integration details');
      } finally {
        setIsLoading(false);
      }
    };
    loadIntegration();
  }, [integrationId]);

  // Load weather data when sync is triggered
  const loadWeatherData = async () => {
    if (!integration || integration.app?.category?.toLowerCase() !== 'weather') return;
    
    try {
      setIsLoadingWeather(true);
      const response = await integrationsService.triggerSync(integration.id);
      if (response.data.sync_result) {
        setWeatherData(response.data.sync_result as Record<string, unknown>);
      }
    } catch (err) {
      console.error('Error loading weather data:', err);
    } finally {
      setIsLoadingWeather(false);
    }
  };

  const handleUpdateConfigurations = async (configurations: IntegrationConfiguration[]) => {
    if (!integration) return;
    try {
      setIsUpdating(true);
      setError(null);
      await integrationsService.updateIntegrationConfigurations(integration.id, { configurations });
      showAlert('Configuration updated successfully', AlertVariant.SUCCESS);
      setShowConfigForm(false);
      // Reload integration
      const response = await integrationsService.getIntegrationById(integrationId);
      setIntegration(response.data.integration);
    } catch (err: unknown) {
      console.error('Error updating configurations:', err);
      const errorMessage =
        err && typeof err === 'object' && 'response' in err && err.response
          ? (err.response as { data?: { message?: string } })?.data?.message || 'Failed to update configuration'
          : 'Failed to update configuration';
      setError(errorMessage);
      showAlert(errorMessage, AlertVariant.ERROR);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleEnabled = async () => {
    if (!integration) return;
    try {
      await integrationsService.updateIntegration(integration.id, {
        enabled: !integration.enabled,
      });
      setIntegration({ ...integration, enabled: !integration.enabled });
      showAlert(
        `Integration ${!integration.enabled ? 'enabled' : 'disabled'} successfully`,
        AlertVariant.SUCCESS,
      );
    } catch (err) {
      console.error('Error toggling integration:', err);
      showAlert('Failed to update integration', AlertVariant.ERROR);
    }
  };

  const handleSync = async () => {
    if (!integration) return;
    try {
      const response = await integrationsService.triggerSync(integration.id);
      showAlert('Sync completed successfully', AlertVariant.SUCCESS);
      setTestResult(`Synced ${response.data.records_synced} record(s)`);
      
      // Update preview data based on app category
      const category = integration.app?.category?.toLowerCase();
      if (category === 'weather' && response.data.sync_result) {
        setWeatherData(response.data.sync_result as Record<string, unknown>);
      } else if (category === 'news' && response.data.sync_result) {
        setNewsData(response.data.sync_result as Record<string, unknown>);
      }
      
      // Reload integration
      const integrationResponse = await integrationsService.getIntegrationById(integrationId);
      setIntegration(integrationResponse.data.integration);
    } catch (err) {
      console.error('Error syncing integration:', err);
      showAlert('Failed to sync integration', AlertVariant.ERROR);
    }
  };

  const handleTestConnection = async () => {
    if (!integration) return;
    try {
      const response = await integrationsService.testIntegration(integration.id);
      if (response.data.connection_status === 'success') {
        showAlert('Connection test successful', AlertVariant.SUCCESS);
        setTestResult(response.data.message);
      } else {
        showAlert(`Connection test failed: ${response.data.message}`, AlertVariant.ERROR);
        setTestResult(`Failed: ${response.data.message}`);
      }
    } catch (err) {
      console.error('Error testing connection:', err);
      showAlert('Failed to test connection', AlertVariant.ERROR);
    }
  };

  const handleDelete = async () => {
    if (!integration) return;
    if (!confirm('Are you sure you want to disconnect this integration?')) return;
    try {
      await integrationsService.deleteIntegration(integration.id);
      showAlert('Integration deleted successfully', AlertVariant.SUCCESS);
      router.push('/integrations');
    } catch (err) {
      console.error('Error deleting integration:', err);
      showAlert('Failed to delete integration', AlertVariant.ERROR);
    }
  };

  const handleUpdateSyncFrequency = async (frequency: SyncFrequency) => {
    if (!integration) return;
    try {
      await integrationsService.updateIntegration(integration.id, {
        sync_frequency: frequency,
      });
      setIntegration({ ...integration, sync_frequency: frequency });
      showAlert('Sync frequency updated successfully', AlertVariant.SUCCESS);
    } catch (err) {
      console.error('Error updating sync frequency:', err);
      showAlert('Failed to update sync frequency', AlertVariant.ERROR);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.integrationDetailsContainer}>
        <div>Loading integration details...</div>
      </div>
    );
  }

  if (error && !integration) {
    return (
      <div className={styles.integrationDetailsContainer}>
        <div className={styles.errorMessage}>{error}</div>
        <Button label="Go Back" onClick={() => router.push('/integrations')} />
      </div>
    );
  }

  if (!integration) {
    return (
      <div className={styles.integrationDetailsContainer}>
        <div>Integration not found</div>
      </div>
    );
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'connected':
        return styles.statusConnected;
      case 'error':
        return styles.statusError;
      case 'disconnected':
        return styles.statusDisconnected;
      case 'pending':
        return styles.statusPending;
      default:
        return '';
    }
  };

  // Build initial values from existing configurations (including auth fields)
  const initialConfigValues: Record<string, string | number | boolean> = {};
  if (integration.configurations) {
    integration.configurations.forEach((config) => {
      // Convert value to proper type based on config schema
      const field = integration.app?.config_schema?.fields?.find(f => f.key === config.key);
      if (field) {
        if (field.type === 'checkbox') {
          initialConfigValues[config.key] = config.value === true || config.value === 'true' || config.value === '1' || config.value === 1;
        } else if (field.type === 'number') {
          initialConfigValues[config.key] = typeof config.value === 'number' ? config.value : Number(config.value) || 0;
        } else {
          initialConfigValues[config.key] = String(config.value);
        }
      } else {
        // Fallback: use value as-is
        initialConfigValues[config.key] = config.value;
      }
    });
  }
  
  console.log('Initial config values:', initialConfigValues);
  console.log('Integration configurations:', integration.configurations);

  // Get config schema from app
  const configFields = integration.app?.config_schema?.fields || [];

  return (
    <div className={styles.integrationDetailsContainer}>
      <div className={styles.integrationHeader}>
        <div className={styles.integrationInfo}>
          <Button
            label=""
            icon={<ArrowLeft />}
            onClick={() => router.push('/integrations')}
            variant="tertiary"
            size="small"
            style={{ marginBottom: '16px' }}
          />
          <h1>
            {integration.app?.name || 'Unknown App'} Integration
          </h1>
          <div className={styles.metaInfo}>
            <div>
              <strong>Status:</strong>{' '}
              <span className={`${styles.statusBadge} ${getStatusBadgeClass(integration.status)}`}>
                {integration.status}
              </span>
            </div>
            <div>
              <strong>Enabled:</strong> {integration.enabled ? 'Yes' : 'No'}
            </div>
            <div>
              <strong>Sync Frequency:</strong> {integration.sync_frequency}
            </div>
            {integration.last_synced_at && (
              <div>
                <strong>Last Synced:</strong> {new Date(integration.last_synced_at).toLocaleString()}
              </div>
            )}
            {integration.error_message && (
              <div style={{ color: '#c62828' }}>
                <strong>Error:</strong> {integration.error_message}
              </div>
            )}
          </div>
        </div>
        <div className={styles.integrationActions}>
          <Button
            label="Test Connection"
            onClick={handleTestConnection}
            variant="tertiary"
            size="small"
            icon={<RefreshCw size={16} />}
          />
          <Button
            label="Sync Now"
            onClick={handleSync}
            variant="tertiary"
            size="small"
            icon={<RefreshCw size={16} />}
          />
          <Button
            label={integration.enabled ? 'Disable' : 'Enable'}
            onClick={handleToggleEnabled}
            variant="tertiary"
            size="small"
            icon={<Power size={16} />}
          />
          <Button
            label="Delete"
            onClick={handleDelete}
            variant="danger"
            size="small"
            icon={<Trash2 size={16} />}
          />
        </div>
      </div>

      {testResult && (
        <div className={testResult.includes('Failed') ? styles.errorMessage : styles.successMessage}>
          {testResult}
        </div>
      )}

      {error && <div className={styles.errorMessage}>{error}</div>}

      {/* Weather Preview Card - Only show for weather apps */}
      {integration.app?.category?.toLowerCase() === 'weather' && (
        <div className={styles.section}>
          <h2>Weather Preview</h2>
          {isLoadingWeather ? (
            <div style={{ padding: '24px', textAlign: 'center' }}>Loading weather data...</div>
          ) : weatherData ? (
            <WeatherPreviewCard
              weatherData={weatherData}
              city={
                integration.configurations?.find((c) => c.key === 'city')?.value as string | undefined
              }
            />
          ) : (
            <div style={{ padding: '24px', textAlign: 'center', color: '#666' }}>
              No weather data available. Click "Sync Now" to fetch current weather.
            </div>
          )}
        </div>
      )}

      {/* News Preview Card - Only show for news apps */}
      {integration.app?.category?.toLowerCase() === 'news' && (
        <div className={styles.section}>
          <h2>News Preview</h2>
          {isLoadingNews ? (
            <div style={{ padding: '24px', textAlign: 'center' }}>Loading news articles...</div>
          ) : newsData ? (
            <NewsPreviewCard newsData={newsData} />
          ) : (
            <div style={{ padding: '24px', textAlign: 'center', color: '#666' }}>
              No news articles available. Click "Sync Now" to fetch latest news.
            </div>
          )}
        </div>
      )}

      <div className={styles.section}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2>Configuration</h2>
          {!showConfigForm && (
            <Button
              label="Edit Configuration"
              onClick={() => setShowConfigForm(true)}
              variant="secondary"
              size="small"
              icon={<Settings size={16} />}
            />
          )}
        </div>

        {showConfigForm ? (
          configFields.length > 0 ? (
            <IntegrationConfigForm
              fields={configFields} // Show all fields including auth fields for editing
              initialValues={initialConfigValues}
              onSubmit={handleUpdateConfigurations}
              onCancel={() => setShowConfigForm(false)}
              isLoading={isUpdating}
            />
          ) : (
            <div className={styles.errorMessage}>No configuration schema available.</div>
          )
        ) : (
          <div className={styles.configurationsList}>
            {integration.configurations && integration.configurations.length > 0 ? (
              integration.configurations.map((config) => (
                <div key={config.key} className={styles.configItem}>
                  <span className={styles.configKey}>{config.key}</span>
                  <span className={styles.configValue}>
                    {typeof config.value === 'string' && config.value.length > 50
                      ? `${config.value.substring(0, 50)}...`
                      : String(config.value)}
                  </span>
                </div>
              ))
            ) : (
              <div>No configurations available</div>
            )}
          </div>
        )}
      </div>

      {integration.metadata && Object.keys(integration.metadata).length > 0 && (
        <div className={styles.section}>
          <h2>Metadata</h2>
          <div className={styles.configurationsList}>
            {Object.entries(integration.metadata).map(([key, value]) => (
              <div key={key} className={styles.configItem}>
                <span className={styles.configKey}>{key}</span>
                <span className={styles.configValue}>{String(value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default IntegrationDetails;

