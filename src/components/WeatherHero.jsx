import React from 'react';
import WeatherIcon from './WeatherIcon';

/**
 * WeatherHero Component
 * 
 * Displays the main current weather conditions card, including city names,
 * pinning options, clock displays, large animated SVG weather icon,
 * temperatures, and range limits.
 * 
 * Props:
 * - cityName: string (e.g. "Berlin")
 * - localTime: string (e.g. "Local Time: 21:50")
 * - currentDate: string (e.g. "Tuesday, June 2, 2026")
 * - currentTemp: number
 * - weatherDesc: string (e.g. "Clear Sky")
 * - iconName: string ('sunny', 'clear-night', etc.)
 * - tempMax: number
 * - tempMin: number
 * - isPinned: boolean (whether this city is bookmarked)
 * - onPinToggle: function() called to pin/unpin city
 */
export default function WeatherHero({
  cityName,
  localTime,
  currentDate,
  currentTemp,
  weatherDesc,
  iconName,
  tempMax,
  tempMin,
  isPinned,
  onPinToggle
}) {
  return (
    <div className="glass-card hero-card">
      <div className="hero-top">
        <div className="location-details">
          {/* Location Title and Bookmark Toggle pin */}
          <div className="location-name-container">
            <h2>{cityName}</h2>
            <button
              className={`btn-pin ${isPinned ? 'pinned' : ''}`}
              onClick={onPinToggle}
              title={isPinned ? "Remove city from favorites" : "Pin city to favorites"}
            >
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
              </svg>
            </button>
          </div>
          <p className="current-date">{currentDate}</p>
          <p className="local-time">{localTime}</p>
        </div>
        
        {/* Large Dynamic Weather SVG Icon */}
        <div className="weather-icon-large">
          <WeatherIcon name={iconName} width={128} animated={true} />
        </div>
      </div>

      <div className="hero-bottom">
        {/* Current temperature rendering */}
        <div className="temperature-main">
          <span className="temp-val">{currentTemp}</span>
          <span className="temp-unit">°C</span>
        </div>
        
        {/* Condition text description and max/min boundaries */}
        <div className="weather-condition-meta">
          <h3>{weatherDesc}</h3>
          <p className="temp-range">
            <span className="temp-high">H: <span>{tempMax}</span>°C</span>
            <span className="temp-divider">|</span>
            <span className="temp-low">L: <span>{tempMin}</span>°C</span>
          </p>
        </div>
      </div>
    </div>
  );
}
