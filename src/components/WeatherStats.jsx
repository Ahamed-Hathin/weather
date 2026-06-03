import React from 'react';
import { getUvIndexBadge, getUvIndexDescription } from '../utils/weatherHelper';

/**
 * WeatherStats Component
 * 
 * Displays key atmospheric metrics (apparent temperature, humidity,
 * wind details, UV index, air pressure, and visibility) in a 6-card grid layout.
 * Calculates descriptive status tags for easy reading.
 * 
 * Props:
 * - currentTemp: number
 * - feelsLike: number
 * - humidity: number
 * - windSpeed: number
 * - windDirection: number (degrees)
 * - windDirectionText: string (compass text)
 * - uvIndex: number
 * - pressure: number
 * - visibility: number
 */
export default function WeatherStats({
  currentTemp,
  feelsLike,
  humidity,
  windSpeed,
  windDirectionText,
  uvIndex,
  pressure,
  visibility
}) {
  // 1. Feels Like Helper Text
  const tempDiff = Math.round(feelsLike - currentTemp);
  let feelsDesc = "Feels exactly like actual temp";
  if (tempDiff > 1) {
    feelsDesc = "Slightly warmer than real temp";
  } else if (tempDiff < -1) {
    feelsDesc = "Feels cooler due to wind chill";
  }

  // 2. Humidity Helper Text
  let humidityDesc = "Comfortable moisture levels";
  if (humidity > 70) {
    humidityDesc = "Humid, damp conditions";
  } else if (humidity < 35) {
    humidityDesc = "Dry ambient air";
  }

  // 3. UV Index details
  const uvBadge = getUvIndexBadge(uvIndex);
  const uvDesc = getUvIndexDescription(uvIndex);

  // 4. Pressure Helper Text
  let pressureDesc = "Stable sea level pressure";
  if (pressure > 1018) {
    pressureDesc = "High pressure. Calm skies";
  } else if (pressure < 1009) {
    pressureDesc = "Low pressure. Unsettled weather";
  }

  // 5. Visibility Helper Text
  let visibilityDesc = "Perfect atmospheric clarity";
  if (visibility <= 4) {
    visibilityDesc = "Reduced traffic visibility";
  } else if (visibility <= 8) {
    visibilityDesc = "Mild haze/precipitation blur";
  }

  return (
    <div className="stats-grid">
      {/* 1. Apparent Temp (Feels Like) */}
      <div className="glass-card stat-card">
        <div className="stat-icon pink">
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none">
            <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/>
          </svg>
        </div>
        <div className="stat-content">
          <span className="stat-label">Feels Like</span>
          <h4 className="stat-value">{feelsLike}°C</h4>
          <p className="stat-desc">{feelsDesc}</p>
        </div>
      </div>

      {/* 2. Humidity */}
      <div className="glass-card stat-card">
        <div className="stat-icon blue">
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none">
            <path d="M12 22a7 7 0 0 0 7-7c0-4.3-7-13-7-13S5 10.7 5 15a7 7 0 0 0 7 7z"/>
          </svg>
        </div>
        <div className="stat-content">
          <span className="stat-label">Humidity</span>
          <h4 className="stat-value">{humidity}%</h4>
          <div className="stat-progress-bar">
            <div className="progress-fill" style={{ width: `${humidity}%` }}></div>
          </div>
          <p className="stat-desc">{humidityDesc}</p>
        </div>
      </div>

      {/* 3. Wind Speed */}
      <div className="glass-card stat-card">
        <div className="stat-icon green">
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" className="wind-spinner">
            <line x1="2" y1="12" x2="22" y2="12"></line>
            <path d="M12 2L2 12l10 10"></path>
          </svg>
        </div>
        <div className="stat-content">
          <span className="stat-label">Wind Speed</span>
          <h4 className="stat-value">{windSpeed} km/h</h4>
          <p className="stat-desc">Direction: {windDirectionText}</p>
        </div>
      </div>

      {/* 4. UV Index */}
      <div className="glass-card stat-card">
        <div className="stat-icon orange">
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none">
            <circle cx="12" cy="12" r="5"></circle>
            <line x1="12" y1="1" x2="12" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="23"></line>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
            <line x1="1" y1="12" x2="3" y2="12"></line>
            <line x1="21" y1="12" x2="23" y2="12"></line>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
          </svg>
        </div>
        <div className="stat-content">
          <span className="stat-label">UV Index</span>
          <h4 className="stat-value">{uvIndex} ({uvBadge})</h4>
          <div className="stat-progress-bar">
            {/* Limit UV bar value to 100% */}
            <div className="progress-fill warning" style={{ width: `${Math.min(uvIndex * 10, 100)}%` }}></div>
          </div>
          <p className="stat-desc">{uvDesc}</p>
        </div>
      </div>

      {/* 5. Air Pressure */}
      <div className="glass-card stat-card">
        <div className="stat-icon purple">
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        </div>
        <div className="stat-content">
          <span className="stat-label">Pressure</span>
          <h4 className="stat-value">{pressure} hPa</h4>
          <p className="stat-desc">{pressureDesc}</p>
        </div>
      </div>

      {/* 6. Visibility */}
      <div className="glass-card stat-card">
        <div className="stat-icon teal">
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
        </div>
        <div className="stat-content">
          <span className="stat-label">Visibility</span>
          <h4 className="stat-value">{visibility} km</h4>
          <p className="stat-desc">{visibilityDesc}</p>
        </div>
      </div>
    </div>
  );
}
