import React, { useEffect, useRef, useState } from 'react';
import styles from '../../styles/google-maps.module.scss';

interface Marker {
  position: { lat: number; lng: number };
  title?: string;
  description?: string;
  label?: string;
}

interface GoogleMapsProps {
  apiKey: string;
  center?: { lat: number; lng: number };
  zoom?: number;
  height?: string;
  className?: string;
  markers?: Marker[];
}

const GoogleMaps: React.FC<GoogleMapsProps> = ({
  apiKey,
  center = { lat: 40.7128, lng: -74.0060 }, // Default to New York
  zoom = 10,
  height = '400px',
  className = '',
  markers = []
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if Google Maps API is already loaded
    if (window.google && window.google.maps) {
      initializeMap();
      return;
    }

    // Load Google Maps API
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      setIsLoaded(true);
      initializeMap();
    };
    
    script.onerror = () => {
      setError('Failed to load Google Maps API');
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup script if component unmounts before loading
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, [apiKey]);

  useEffect(() => {
    if (map && center) {
      map.setCenter(center);
    }
  }, [map, center]);

  const initializeMap = () => {
    if (!mapRef.current || !window.google) return;

    try {
      const mapInstance = new window.google.maps.Map(mapRef.current, {
        center,
        zoom,
        mapTypeId: 'roadmap',
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: true,
        scaleControl: true,
        streetViewControl: true,
        rotateControl: true,
        fullscreenControl: true,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });

      setMap(mapInstance);
      
      // Add markers if provided
      if (markers && markers.length > 0) {
        markers.forEach((marker) => {
          const markerOptions: any = {
            position: marker.position,
            map: mapInstance,
            title: marker.title || 'Marker'
          };
          
          if (marker.label) {
            markerOptions.label = marker.label;
          }
          
          const mapMarker = new window.google.maps.Marker(markerOptions);
          
          // Add info window if description is provided
          if (marker.description) {
            const infoWindow = new window.google.maps.InfoWindow({
              content: `
                <div style="padding: 8px;">
                  <h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600;">${marker.title || 'Location'}</h4>
                  <p style="margin: 0; font-size: 12px; color: #666;">${marker.description}</p>
                </div>
              `
            });
            
            (mapMarker as any).addListener('click', () => {
              infoWindow.open(mapInstance, mapMarker);
            });
          }
        });
      }
    } catch (err) {
      setError('Failed to initialize Google Maps');
      console.error('Google Maps initialization error:', err);
    }
  };

  const addMarker = (position: { lat: number; lng: number }, title?: string) => {
    if (!map) return;

    new window.google.maps.Marker({
      position,
      map,
      title: title || 'Marker'
    });
  };

  const setMapCenter = (position: { lat: number; lng: number }) => {
    if (map) {
      map.setCenter(position);
    }
  };

  const setMapZoom = (zoomLevel: number) => {
    if (map) {
      map.setZoom(zoomLevel);
    }
  };

  // Map methods are available but not exposed via ref
  // You can access them through the component instance if needed

  if (error) {
    return (
      <div className={`${styles.errorContainer} ${className}`} style={{ height }}>
        <div className={styles.errorMessage}>
          <h3>Unable to load Google Maps</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.mapContainer} ${className}`} style={{ height }}>
      {!isLoaded && (
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading Google Maps...</p>
        </div>
      )}
      <div 
        ref={mapRef} 
        className={styles.map}
        style={{ 
          height: '100%', 
          width: '100%',
          opacity: isLoaded ? 1 : 0,
          transition: 'opacity 0.3s ease'
        }}
      />
    </div>
  );
};

export default GoogleMaps;
