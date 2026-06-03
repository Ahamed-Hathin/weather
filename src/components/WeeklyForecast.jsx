import React, { useState } from 'react';
import WeatherIcon from './WeatherIcon';
import { parseWeather, getUvIndexBadge } from '../utils/weatherHelper';

/**
 * WeeklyForecast Component
 * 
 * Renders the vertical 7-day outlook list.
 * Supports clicking cards to expand detailed statistics (accordion style).
 * 
 * Props:
 * - dailyData: object containing daily forecast arrays from Open-Meteo
 * - loading: boolean
 */
export default function WeeklyForecast({ dailyData, loading }) {
  const [expandedIndex, setExpandedIndex] = useState(null);

  if (loading) {
    return (
      <div className="glass-card section-card">
        <div className="section-card-header">
          <h3>7-Day Outlook</h3>
          <span className="header-hint">Weekly Projection</span>
        </div>
        <div className="weekly-forecast-list">
          <div className="weekly-loading">
            <div className="spinner"></div>
            <p>Loading weekly outlook...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!dailyData) {
    return (
      <div className="glass-card section-card">
        <div className="section-card-header">
          <h3>7-Day Outlook</h3>
          <span className="header-hint">Weekly Projection</span>
        </div>
        <div className="weekly-forecast-list">
          <p className="sidebar-placeholder">Failed to load weekly outlook projections.</p>
        </div>
      </div>
    );
  }

  const {
    temperature_2m_max,
    temperature_2m_min,
    apparent_temperature_max,
    apparent_temperature_min,
    precipitation_probability_max,
    uv_index_max,
    weather_code
  } = dailyData;

  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const currentDayOfWeek = new Date().getDay();

  const handleToggleExpand = (index) => {
    setExpandedIndex(prev => (prev === index ? null : index));
  };

  return (
    <div className="glass-card section-card">
      <div className="section-card-header">
        <h3>7-Day Outlook</h3>
        <span className="header-hint">Weekly Projection</span>
      </div>
      <div className="weekly-forecast-list">
        {weather_code.map((code, index) => {
          const maxTemp = Math.round(temperature_2m_max[index]);
          const minTemp = Math.round(temperature_2m_min[index]);
          const maxApp = Math.round(apparent_temperature_max[index]);
          const minApp = Math.round(apparent_temperature_min[index]);
          const precipProb = precipitation_probability_max[index];
          const uvMax = uv_index_max[index];
          
          const weatherInfo = parseWeather(code, true);
          const dayName = index === 0 ? "Today" : daysOfWeek[(currentDayOfWeek + index) % 7];

          // Visual bar positioning calculations (bounds limits for visually balanced representation)
          const leftPercent = Math.max(0, Math.min(80, (minTemp + 10) * 2));
          const barWidth = Math.max(20, Math.min(80, (maxTemp - minTemp) * 3));

          const isExpanded = expandedIndex === index;

          return (
            <div key={index} className="weekly-card-wrapper">
              {/* Primary Card item */}
              <div
                className={`weekly-card ${isExpanded ? 'expanded' : ''}`}
                onClick={() => handleToggleExpand(index)}
              >
                <span className="weekly-day">{dayName}</span>
                <div className="weekly-status-group">
                  <div className="weekly-status-icon">
                    <WeatherIcon name={weatherInfo.icon} width={30} animated={false} />
                  </div>
                  <span className="weekly-desc">{weatherInfo.desc}</span>
                </div>
                <div className="weekly-temp-bar-container">
                  <span className="weekly-temp-low">{minTemp}°</span>
                  <div className="weekly-bar">
                    <div
                      className="weekly-bar-fill"
                      style={{ left: `${leftPercent}%`, width: `${barWidth}px` }}
                    ></div>
                  </div>
                  <span className="weekly-temp-high">{maxTemp}°</span>
                </div>
              </div>

              {/* Accordion expansion panel */}
              {isExpanded && (
                <div className="weekly-card-expanded" style={{ display: 'grid' }}>
                  <div className="weekly-expanded-item">
                    <span className="weekly-expanded-label">Apparent limits</span>
                    <span className="weekly-expanded-value">{minApp}°C to {maxApp}°C</span>
                  </div>
                  <div className="weekly-expanded-item">
                    <span className="weekly-expanded-label">Precip. Prob.</span>
                    <span className="weekly-expanded-value">{precipProb}%</span>
                  </div>
                  <div className="weekly-expanded-item">
                    <span className="weekly-expanded-label">UV Projection</span>
                    <span className="weekly-expanded-value">{Math.round(uvMax)} ({getUvIndexBadge(uvMax)})</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
