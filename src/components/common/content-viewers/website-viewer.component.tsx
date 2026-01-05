import { useState, useEffect } from 'react';
import styles from './content-viewers.module.scss';

export type WebsiteViewerProps = {
  url: string;
  title?: string;
  className?: string;
  style?: React.CSSProperties;
  onLoad?: () => void;
  onError?: () => void;
};

const WebsiteViewer: React.FC<WebsiteViewerProps> = ({
  url,
  title,
  className,
  style,
  onLoad,
  onError,
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setHasError(false);
    setIsLoading(true);
  }, [url]);

  if (!url) {
    return (
      <div className={`${styles.errorContainer} ${className || ''}`} style={style}>
        <div>No URL provided</div>
      </div>
    );
  }

  return (
    <div className={`${styles.websiteContainer} ${className || ''}`} style={style}>
      {isLoading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingSpinner}>Loading website...</div>
        </div>
      )}
      {hasError ? (
        <div className={styles.errorContainer}>
          <div>Failed to load website</div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>{url}</div>
        </div>
      ) : (
        <iframe
          src={url}
          title={title || 'Website'}
          className={styles.websiteIframe}
          onLoad={() => {
            setIsLoading(false);
            if (onLoad) onLoad();
          }}
          onError={() => {
            setHasError(true);
            setIsLoading(false);
            if (onError) onError();
          }}
          style={{ border: 'none', width: '100%', height: '100%', ...style }}
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
        />
      )}
    </div>
  );
};

export default WebsiteViewer;

