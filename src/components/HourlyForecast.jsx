import React from 'react';
import WeatherIcon from './WeatherIcon';
import { parseWeather } from '../utils/weatherHelper';

/**
 * HourlyForecast Component
 * 
 * Renders a horizontal scroll container of hourly weather projections for the next 24 hours.
 * 
 * Props:
 * - hourlyData: object containing { temperature_2m, weather_code } arrays from Open-Meteo
 * - localHour: number (0-23 representing current local hour of the forecast city)
 * - loading: boolean
 */
export default function HourlyForecast({ hourlyData, localHour, loading }) {
  if (loading) {
    return (
      <div className="glass-card section-card">
        <div className="section-card-header">
          <h3>Hourly Forecast</h3>
          <span className="header-hint">Next 24 Hours</span>
        </div>
        <div className="hourly-forecast-container">
          <div className="hourly-loading">
            <div className="spinner"></div>
            <p>Loading hourly forecast data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!hourlyData || !hourlyData.temperature_2m || !hourlyData.weather_code) {
    return (
      <div className="glass-card section-card">
        <div className="section-card-header">
          <h3>Hourly Forecast</h3>
          <span className="header-hint">Next 24 Hours</span>
        </div>
        <div className="hourly-forecast-container">
          <p className="sidebar-placeholder">Failed to load hourly forecasts.</p>
        </div>
      </div>
    );
  }

  const { temperature_2m, weather_code } = hourlyData;

  // Generate 24 hourly entries starting from localHour
  const hourlyEntries = [];
  for (let i = 0; i < 24; i++) {
    // Index in the hourly arrays (which start from midnight today)
    const idx = localHour + i;
    
    // Safety check in case we exceed array length (which should be 168 items for a week)
    if (idx >= temperature_2m.length) break;

    const temp = Math.round(temperature_2m[idx]);
    const code = weather_code[idx];
    
    // Estimate if it is day time (6 AM to 7 PM)
    const hourVal = (localHour + i) % 24;
    const isDayTime = hourVal >= 6 && hourVal <= 19;
    const weatherInfo = parseWeather(code, isDayTime);

    // Format hour display string (e.g. "Now", "12 AM", "1 PM")
    let hourString = "";
    if (i === 0) {
      hourString = "Now";
    } else {
      const displayHour = hourVal % 12 === 0 ? 12 : hourVal % 12;
      const ampm = hourVal >= 12 ? "PM" : "AM";
      hourString = `${displayHour} ${ampm}`;
    }

    hourlyEntries.push({
      id: i,
      timeLabel: hourString,
      temp,
      iconName: weatherInfo.icon,
      isActive: i === 0
    });
  }

  return (
    <div className="glass-card section-card">
      <div className="section-card-header">
        <h3>Hourly Forecast</h3>
        <span className="header-hint">Next 24 Hours</span>
      </div>
      <div className="hourly-forecast-container">
        {hourlyEntries.map((entry) => (
          <div
            key={entry.id}
            className={`hourly-entry ${entry.isActive ? 'active-hour' : ''}`}
          >
            <span className="hourly-time">{entry.timeLabel}</span>
            <div className="hourly-icon">
              <WeatherIcon name={entry.iconName} width={36} animated={false} />
            </div>
            <span className="hourly-temp">{entry.temp}°C</span>
          </div>
        ))}
      </div>
    </div>
  );
}
