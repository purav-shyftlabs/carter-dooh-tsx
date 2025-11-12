import React from 'react';
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
  const getWeatherIcon = (condition?: string) => {
    if (!condition) return <Sun size={48} color="#FFA500" />;
    const lowerCondition = condition.toLowerCase();
    if (lowerCondition.includes('rain') || lowerCondition.includes('drizzle')) {
      return <CloudRain size={48} color="#4A90E2" />;
    }
    if (lowerCondition.includes('snow')) {
      return <CloudSnow size={48} color="#87CEEB" />;
    }
    if (lowerCondition.includes('cloud') || lowerCondition.includes('overcast')) {
      return <Cloud size={48} color="#708090" />;
    }
    return <Sun size={48} color="#FFA500" />;
  };

  const temperature = weatherData.temperature ;
  const condition = weatherData.condition;
  const description = weatherData.description;
  const humidity = weatherData.humidity;
  const windSpeed = weatherData.windSpeed;
  const forecast = weatherData.forecast;
  const displayCity = city || weatherData.city;
  const temperature_unit = weatherData.temperature_unit;

  // Extract temperature value if it's a string like "22°C"
  const tempValue = typeof temperature === 'string' 
    ? temperature.replace(/[^0-9.-]/g, '') 
    : temperature;

  return (
    <div className={styles.weatherWidget}>
      <div className={styles.weatherWidgetHeader}>
        <div>
          <h3 className={styles.weatherWidgetTitle}>Current Weather</h3>
          <span className={styles.weatherWidgetLocation}>{displayCity as string}</span>
        </div>
      </div>

      <div className={styles.weatherWidgetMain}>
        <div className={styles.weatherWidgetPrimary}>
          <div className={styles.weatherWidgetIcon}>
            {getWeatherIcon(String(condition || ''))}
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
          </div>
        </div>

        {(humidity !== undefined || windSpeed !== undefined) && (
          <div className={styles.weatherWidgetMetrics}>
            {humidity !== undefined && (
              <div className={styles.weatherMetric}>
                <Droplets size={20} color="#4A90E2" />
                <div className={styles.weatherMetricContent}>
                  <span className={styles.weatherMetricLabel}>Humidity</span>
                  <span className={styles.weatherMetricValue}>{humidity as number}%</span>
                </div>
              </div>
            )}
            {windSpeed !== undefined && (
              <div className={styles.weatherMetric}>
                <Wind size={20} color="#708090" />
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

      {Array.isArray(forecast) && forecast.length > 0 && (
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
                  {getWeatherIcon(String(item.condition || ''))}
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

