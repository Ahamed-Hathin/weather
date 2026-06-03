import React from 'react';

/**
 * HealthGuide Component
 * 
 * Renders AQI gauge dials and provides recommendations for outdoor activities,
 * clothing layers, and sun exposure protection based on actual temperatures,
 * UV forecasts, and rain status.
 * 
 * Props:
 * - aqiVal: number (e.g. 42)
 * - uvIndex: number (e.g. 3)
 * - temp: number (e.g. 22)
 * - weatherState: string ('rainy', 'clear-day', etc.)
 */
export default function HealthGuide({ aqiVal = 35, uvIndex = 3, temp = 20, weatherState = 'clear-day' }) {
  
  // 1. Calculate AQI Badge and visual fill
  let badgeClass = "success";
  let badgeText = "Good";
  let circleColor = "url(#aqi-gradient)";

  if (aqiVal > 150) {
    badgeClass = "danger";
    badgeText = "Hazardous";
    circleColor = "#f44336";
  } else if (aqiVal > 50) {
    badgeClass = "warning";
    badgeText = "Moderate";
    circleColor = "#ffb74d";
  }

  // Dasharray math (AQI max range is ~300, stroke max is 100)
  const strokeDash = Math.min(100, Math.round((aqiVal / 300) * 100));

  // 2. Outdoor Activities & Clothing Advice Decisions
  let activitiesAdvise = "Excellent outdoor conditions. Great for a jog or hike.";
  let clothingAdvise = "Comfortable light layers. Perfect t-shirt weather.";

  if (weatherState === "rainy" || weatherState === "stormy") {
    activitiesAdvise = "Indoor activities recommended due to precipitation.";
    clothingAdvise = "Carry an umbrella. Waterproof jacket or coat advised.";
  } else if (temp < 10) {
    activitiesAdvise = "Chilly outside. Best for brisk short walks.";
    clothingAdvise = "Heavy winter coat, scarf, and insulated gloves.";
  } else if (temp > 30) {
    activitiesAdvise = "High heat. Avoid strenuous exercise at mid-day.";
    clothingAdvise = "Extremely light clothes, stay hydrated, wear hats.";
  }

  // 3. Sun Protection Advice
  let sunAdvise = "Low UV level. Minimal sun protection required.";
  if (uvIndex > 5) {
    sunAdvise = `High UV level (${uvIndex}). Apply SPF 30+, wear shades, avoid high noon.`;
  } else if (uvIndex > 2) {
    sunAdvise = `Moderate UV (${uvIndex}). Safe, but SPF recommended for long outings.`;
  }

  return (
    <div className="glass-card section-card health-activities-card">
      <div className="section-card-header">
        <h3>AeroGuide & Health</h3>
        <span className="header-hint">Outdoor Conditions</span>
      </div>
      <div className="health-content">
        {/* AQI Circle Dial display */}
        <div className="aqi-display">
          <div className="aqi-dial">
            <svg viewBox="0 0 36 36" className="circular-chart">
              <path
                className="circle-bg"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="rgba(0, 0, 0, 0.06)"
                strokeWidth="2.5"
              />
              <path
                className="circle"
                strokeDasharray={`${strokeDash}, 100`}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke={circleColor}
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="aqi-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#4CAF50" />
                  <stop offset="100%" stopColor="#8BC34A" />
                </linearGradient>
              </defs>
            </svg>
            <div className="aqi-info">
              <span className="aqi-title">AQI</span>
              <span className="aqi-number">{aqiVal}</span>
              <span className={`aqi-badge ${badgeClass}`}>{badgeText}</span>
            </div>
          </div>
        </div>

        {/* Outdoor Health advice panels */}
        <div className="activities-panel">
          {/* Outdoor activity */}
          <div className="activity-item">
            <div className="activity-icon green-glow">
              <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
                <path d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
                <path d="M6 1v3M10 1v3M14 1v3"/>
              </svg>
            </div>
            <div className="activity-text">
              <h5>Outdoor Activities</h5>
              <p>{activitiesAdvise}</p>
            </div>
          </div>

          {/* Clothing advice */}
          <div className="activity-item">
            <div className="activity-icon blue-glow">
              <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                <line x1="7" y1="7" x2="7.01" y2="7"></line>
              </svg>
            </div>
            <div className="activity-text">
              <h5>Clothing Advice</h5>
              <p>{clothingAdvise}</p>
            </div>
          </div>

          {/* Sun protection advice */}
          <div className="activity-item">
            <div className="activity-icon orange-glow">
              <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <div className="activity-text">
              <h5>Sun Protection</h5>
              <p>{sunAdvise}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
