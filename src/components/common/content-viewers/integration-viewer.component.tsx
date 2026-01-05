import { useEffect, useState, useRef } from 'react';
import { integrationsService } from '@/services/integrations/integrations.service';
import WeatherPreviewCard from '@/modules/integrations/components/weather-preview-card.component';
import NewsPreviewCard from '@/modules/integrations/components/news-preview-card.component';
import styles from './content-viewers.module.scss';

export type IntegrationViewerProps = {
  integrationId: number;
  integrationName?: string;
  appName?: string;
  className?: string;
  style?: React.CSSProperties;
  onLoad?: () => void;
  onError?: () => void;
};

const IntegrationViewer: React.FC<IntegrationViewerProps> = ({
  integrationId,
  integrationName,
  appName,
  className,
  style,
  onLoad,
  onError,
}) => {
  const [integrationData, setIntegrationData] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentAppName, setCurrentAppName] = useState<string | undefined>(appName);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!integrationId) return;

    const loadIntegrationData = async () => {
      try {
        setIsLoading(true);
        setHasError(false);
        
        // Get integration details
        const integrationResponse = await integrationsService.getIntegrationById(integrationId);
        const integration = integrationResponse.data?.integration;
        
        // Update app name if available
        if (integration?.app?.name && !currentAppName) {
          setCurrentAppName(integration.app.name);
        }
        
        let data: Record<string, unknown> | null = null;
        
        if (integration?.metadata) {
          data = integration.metadata as Record<string, unknown>;
        }
        
        // Try to trigger sync to get fresh data (like in playlist preview)
        try {
          const syncResponse = await integrationsService.triggerSync(integrationId);
          const syncResult = syncResponse.data?.sync_result;
          if (syncResult) {
            // The actual data is in sync_result.sync_result
            const actualData = (syncResult as any)?.sync_result || syncResult;
            data = actualData as Record<string, unknown>;
          } else {
            // Fallback to sync status
            const syncStatus = await integrationsService.getSyncStatus(integrationId);
            if (syncStatus.data?.sync_data) {
              data = syncStatus.data.sync_data as Record<string, unknown>;
            }
          }
        } catch (syncError) {
          console.warn('Could not sync integration data:', syncError);
          // Use metadata as fallback
          if (!data && integration?.metadata) {
            data = integration.metadata as Record<string, unknown>;
          }
        }
        
        setIntegrationData(data);
        if (onLoad) onLoad();
      } catch (error) {
        console.error('Error loading integration data:', error);
        setHasError(true);
        if (onError) onError();
      } finally {
        setIsLoading(false);
      }
    };

    // Load immediately
    loadIntegrationData();
    
    // Then sync every 30 seconds to keep data fresh (live updates)
    intervalRef.current = setInterval(() => {
      loadIntegrationData();
    }, 30000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [integrationId, currentAppName, onLoad, onError]);

  if (isLoading) {
    return (
      <div className={`${styles.loadingContainer} ${className || ''}`} style={style}>
        <div className={styles.loadingSpinner}>Loading integration...</div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className={`${styles.errorContainer} ${className || ''}`} style={style}>
        <div>Failed to load integration</div>
        <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
          {appName || integrationName || 'Integration'}
        </div>
      </div>
    );
  }

  const appNameLower = (currentAppName || appName || '').toLowerCase();
  const isWeather = appNameLower.includes('weather') || appNameLower.includes('openweather');
  const isNews = appNameLower.includes('news') || appNameLower.includes('google news');

  // Display preview cards with proper styling (like in playlist preview)
  if (isWeather && integrationData) {
    return (
      <div 
        className={className} 
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'stretch',
          justifyContent: 'stretch',
          overflow: 'hidden',
          ...style
        }}
      >
        <WeatherPreviewCard 
          weatherData={integrationData} 
          city={integrationName}
        />
      </div>
    );
  }

  if (isNews && integrationData) {
    return (
      <div 
        className={className} 
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'stretch',
          justifyContent: 'stretch',
          overflow: 'hidden',
          ...style
        }}
      >
        <NewsPreviewCard newsData={integrationData} />
      </div>
    );
  }

  return (
    <div 
      className={`${styles.integrationContainer} ${className || ''}`} 
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        padding: '12px',
        boxSizing: 'border-box',
        ...style
      }}
    >
      <div style={{
        width: '100%',
        height: '100%',
        textAlign: 'center',
        backgroundColor: '#f9fafb',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        padding: '16px',
        overflow: 'auto',
        boxSizing: 'border-box'
      }}>
        <div style={{ fontSize: '36px', marginBottom: '12px' }}>🔌</div>
        <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '6px' }}>
          {currentAppName || appName || integrationName || 'Integration'}
        </div>
        {integrationName && (
          <div style={{ fontSize: '12px', color: '#6b7280' }}>
            {integrationName}
          </div>
        )}
        {integrationData && (
          <div style={{ 
            marginTop: '16px', 
            padding: '12px', 
            backgroundColor: '#fff', 
            borderRadius: '8px',
            textAlign: 'left',
            fontSize: '11px',
            fontFamily: 'monospace',
            maxHeight: '250px',
            overflow: 'auto'
          }}>
            <pre>{JSON.stringify(integrationData, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default IntegrationViewer;

