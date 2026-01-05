import React, { useEffect, useRef, useState } from 'react';
import { Cloud, Sun, CloudRain, CloudSnow, Wind, Droplets, Thermometer } from 'lucide-react';
import styles from '../styles/integrations.module.scss';

interface WeatherData {
  city?: string;
  temperature?: string | number;
  temperature_unit?: string;
  condition?: string;
  description?: string;
  humidity?: number | string;
  windSpeed?: number | string;
  forecast?: Array<{
    date?: string;
    temperature?: string | number;
    condition?: string;
  }>;
}

interface WeatherPreviewCardProps {
  weatherData: WeatherData | Record<string, unknown>;
  city?: string;
}

const WeatherPreviewCard: React.FC<WeatherPreviewCardProps> = ({ weatherData, city }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState<number>(0);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [showMetrics, setShowMetrics] = useState(true);
  const [showForecast, setShowForecast] = useState(true);
  const [showHeader, setShowHeader] = useState(true);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const height = containerRef.current.clientHeight;
        const width = containerRef.current.clientWidth;
        setContainerHeight(height);
        setContainerWidth(width);
        
        // Show header only if height > 120px
        setShowHeader(height > 120);
        
        // Show metrics only if height > 180px AND width > 200px
        setShowMetrics(height > 180 && width > 200);
        
        // Show forecast only if height > 320px AND width > 400px
        // Forecast needs more space both vertically and horizontally
        setShowForecast(height > 320 && width > 400);
      }
    };

    updateDimensions();
    const resizeObserver = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);
  const getWeatherIcon = (condition?: string, size?: number) => {
    // Make icon size responsive based on container dimensions
    let iconSize = size;
    if (!iconSize) {
      if (containerHeight < 150 || containerWidth < 200) {
        iconSize = 32; // Small icon for very small containers
      } else if (containerHeight < 250 || containerWidth < 300) {
        iconSize = 40; // Medium icon
      } else {
        iconSize = 48; // Full size icon
      }
    }
    
    if (!condition) return <Sun size={iconSize} color="#FFA500" />;
    const lowerCondition = condition.toLowerCase();
    if (lowerCondition.includes('rain') || lowerCondition.includes('drizzle')) {
      return <CloudRain size={iconSize} color="#4A90E2" />;
    }
    if (lowerCondition.includes('snow')) {
      return <CloudSnow size={iconSize} color="#87CEEB" />;
    }
    if (lowerCondition.includes('cloud') || lowerCondition.includes('overcast')) {
      return <Cloud size={iconSize} color="#708090" />;
    }
    return <Sun size={iconSize} color="#FFA500" />;
  };

  const temperature = weatherData.temperature;
  const condition = weatherData.condition;
  const description = weatherData.description;
  const humidity = weatherData.humidity;
  const windSpeed = weatherData.windSpeed;
  const forecast = weatherData.forecast;
  const displayCity = city || (weatherData.city as string | undefined);
  const temperature_unit = weatherData.temperature_unit;

  // Extract temperature value if it's a string like "22°C"
  const tempValue = typeof temperature === 'string' 
    ? temperature.replace(/[^0-9.-]/g, '') 
    : temperature;

  return (
    <div ref={containerRef} className={styles.weatherWidget}>
      {showHeader && (
        <div className={styles.weatherWidgetHeader}>
          <div>
            <h3 className={styles.weatherWidgetTitle}>Current Weather</h3>
            {displayCity && (
              <span className={styles.weatherWidgetLocation}>{String(displayCity)}</span>
            )}
          </div>
        </div>
      )}

      <div className={styles.weatherWidgetMain}>
        <div className={styles.weatherWidgetPrimary}>
          <div className={styles.weatherWidgetIcon}>
            {getWeatherIcon(String(condition || ''), undefined)}
          </div>
          <div className={styles.weatherWidgetTempContainer}>
            {tempValue ? (
              <span className={styles.weatherWidgetTemp}>
                {typeof temperature === 'string' ? temperature : `${temperature}`+ `${temperature_unit === 'celsius' ? '°C' : '°F'}`}
              </span>
            ) : (
              <span className={styles.weatherWidgetTemp}>--</span>
            )}
            <div className={styles.weatherWidgetCondition}>
              {condition as string || description as string || 'No data available'}
            </div>
            {!showHeader && displayCity && (
              <div className={styles.weatherWidgetLocationInline}>
                {String(displayCity)}
              </div>
            )}
          </div>
        </div>

        {showMetrics && (humidity !== undefined || windSpeed !== undefined) && (
          <div className={styles.weatherWidgetMetrics}>
            {humidity !== undefined && (
              <div className={styles.weatherMetric}>
                <Droplets className={styles.weatherMetricIcon} color="#4A90E2" />
                <div className={styles.weatherMetricContent}>
                  <span className={styles.weatherMetricLabel}>Humidity</span>
                  <span className={styles.weatherMetricValue}>{humidity as number}%</span>
                </div>
              </div>
            )}
            {windSpeed !== undefined && (
              <div className={styles.weatherMetric}>
                <Wind className={styles.weatherMetricIcon} color="#708090" />
                <div className={styles.weatherMetricContent}>
                  <span className={styles.weatherMetricLabel}>Wind Speed</span>
                  <span className={styles.weatherMetricValue}>
                    {windSpeed as number} {typeof windSpeed === 'number' ? 'km/h' : ''}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {showForecast && Array.isArray(forecast) && forecast.length > 0 && (
        <div className={styles.weatherWidgetForecast}>
          <h4 className={styles.forecastTitle}>5-Day Forecast</h4>
          <div className={styles.forecastGrid}>
            {forecast.slice(0, 5).map((item, index) => (
              <div key={index} className={styles.forecastDay}>
                <div className={styles.forecastDayName}>
                  {item.date
                    ? new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' })
                    : `Day ${index + 1}`}
                </div>
                <div className={styles.forecastDayIcon}>
                  {getWeatherIcon(String(item.condition || ''), containerWidth > 500 ? 36 : 24)}
                </div>
                <div className={styles.forecastDayTemp}>
                  {item.temperature || '--'}
                </div>
                <div className={styles.forecastDayCondition}>
                  {item.condition || '--'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WeatherPreviewCard;

