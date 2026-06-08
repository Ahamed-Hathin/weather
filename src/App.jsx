import React, { useState, useEffect, useRef } from 'react';
import Particles from './components/Particles';
import WeatherIcon from './components/WeatherIcon';
import {
  parseWeather,
  getWindDirectionText,
  getUvIndexBadge,
  getUvIndexDescription,
  getFlagEmoji
} from './utils/weatherHelper';

export default function App() {
  // ==========================================
  // 1. APPLICATION STATES
  // ==========================================
  const [currentCoords, setCurrentCoords] = useState({ lat: 13.0827, lon: 80.2707 }); // Chennai
  const [currentCityName, setCurrentCityName] = useState("Chennai");
  const [currentCountry, setCurrentCountry] = useState("India");
  const [weatherData, setWeatherData] = useState(null);
  const [aqiData, setAqiData] = useState(35); // AQI
  const [loading, setLoading] = useState(true);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  
  // Localized clock displays
  const [currentDate, setCurrentDate] = useState("");
  const [localTime, setLocalTime] = useState("");
  
  // Bookmark saves
  const [savedLocations, setSavedLocations] = useState([]);

  // Autocomplete search inputs
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef(null);

  // Weekly forecast accordion toggle indices
  const [expandedWeekIndex, setExpandedWeekIndex] = useState(null);

  // ==========================================
  // 2. TOAST NOTIFICATIONS ALERTS
  // ==========================================
  const showToast = (message, type = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // ==========================================
  // 3. INITIALIZATION & AUTO-GPS LOCATION DETECT
  // ==========================================
  useEffect(() => {
    // A. Load bookmarked list
    const raw = localStorage.getItem('aerosky_pinned');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setSavedLocations(parsed);
        backgroundSavedLocsUpdate(parsed);
      } catch (e) {
        setSavedLocations([]);
      }
    } else {
      const defaults = [
        { name: "Tokyo", lat: 35.6762, lon: 139.6503, country: "Japan", temp: 24 },
        { name: "New York", lat: 40.7128, lon: -74.0060, country: "United States", temp: 19 },
        { name: "Paris", lat: 48.8566, lon: 2.3522, country: "France", temp: 17 }
      ];
      setSavedLocations(defaults);
      localStorage.setItem('aerosky_pinned', JSON.stringify(defaults));
      backgroundSavedLocsUpdate(defaults);
    }

    // B. Attempt to auto-acquire user current GPS location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          let cityName = "Current Location";
          let countryName = "";

          try {
            const lookupUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=en`;
            const response = await fetch(lookupUrl, {
              headers: { 'User-Agent': 'AeroSkyWeatherDashboardApp' }
            });
            if (response.ok) {
              const data = await response.json();
              cityName = data.address.city || data.address.town || data.address.village || data.address.suburb || "My Location";
              countryName = data.address.country || "";
            }
          } catch (e) {
            console.warn("Reverse lookup failed on launch.", e);
          }
          await loadWeatherData(lat, lon, cityName, countryName);
          showToast("Local location loaded!", "success");
        },
        (error) => {
          console.warn("Geolocation permission denied or timed out. Loading default Chennai.", error);
          loadWeatherData(13.0827, 80.2707, "Chennai", "India");
        },
        { timeout: 6000, enableHighAccuracy: true }
      );
    } else {
      loadWeatherData(13.0827, 80.2707, "Chennai", "India");
    }

    // C. Click outside suggestions popup listener to close dropdown
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ==========================================
  // 4. DEBOUNCED SEARCH AUTOCOMPLETE EFFECT
  // ==========================================
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(() => {
      fetchSuggestions(searchQuery);
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchSuggestions = async (query) => {
    try {
      const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      setSuggestions(data.results || []);
      setShowSuggestions(true);
    } catch (err) {
      console.error(err);
      setSuggestions([]);
    }
  };

  // ==========================================
  // 5. BODY WEATHER CONDITIONS THEME SWITCHER
  // ==========================================
  useEffect(() => {
    if (weatherData) {
      const isDay = weatherData.current.is_day === 1;
      const weatherInfo = parseWeather(weatherData.current.weather_code, isDay);
      document.body.className = `theme-${weatherInfo.state}`;
    }
  }, [weatherData]);

  // ==========================================
  // 6. TIMEZONE RECALCULATED TICKING CLOCK
  // ==========================================
  useEffect(() => {
    if (!weatherData) return;
    const offsetSeconds = weatherData.utc_offset_seconds;

    const clockTick = () => {
      const localDate = new Date(
        new Date().getTime() + (offsetSeconds * 1000) + (new Date().getTimezoneOffset() * 60 * 1000)
      );
      const hours = String(localDate.getHours()).padStart(2, '0');
      const minutes = String(localDate.getMinutes()).padStart(2, '0');
      setLocalTime(`Local Time: ${hours}:${minutes}`);

      const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      setCurrentDate(localDate.toLocaleDateString('en-US', options));
    };

    clockTick();
    const interval = setInterval(clockTick, 15000);
    return () => clearInterval(interval);
  }, [weatherData]);

  // ==========================================
  // 7. CORE WEATHER FETCH SERVICE
  // ==========================================
  const loadWeatherData = async (lat, lon, cityName, countryName) => {
    try {
      setLoading(true);
      
      const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,pressure_msl,wind_speed_10m,wind_direction_10m&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,uv_index_max,precipitation_probability_max&timezone=auto`;
      const forecastRes = await fetch(forecastUrl);
      if (!forecastRes.ok) throw new Error("Forecast fetch failed");
      const forecastJson = await forecastRes.json();

      let aqiVal = 35;
      try {
        const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi`;
        const aqiRes = await fetch(aqiUrl);
        if (aqiRes.ok) {
          const aqiJson = await aqiRes.json();
          if (aqiJson.current) aqiVal = aqiJson.current.us_aqi;
        }
      } catch (e) {
        console.warn("AQI API failed quietly, fallback to 35.", e);
      }

      setWeatherData(forecastJson);
      setAqiData(aqiVal);
      if (cityName) setCurrentCityName(cityName);
      if (countryName) setCurrentCountry(countryName);
      setCurrentCoords({ lat, lon });
      setLoading(false);
      setExpandedWeekIndex(null); // Close accordion on new load
    } catch (err) {
      console.error(err);
      showToast("Error retrieving weather forecast.", "danger");
      setLoading(false);
    }
  };

  // ==========================================
  // 8. SIDEBAR SAVED LOCATIONS MANAGER
  // ==========================================
  const backgroundSavedLocsUpdate = async (locationsList) => {
    const updated = [...locationsList];
    let changed = false;
    for (let loc of updated) {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}&current=temperature_2m&timezone=auto`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          const newTemp = Math.round(data.current.temperature_2m);
          if (loc.temp !== newTemp) {
            loc.temp = newTemp;
            changed = true;
          }
        }
      } catch (e) {
        console.warn(e);
      }
    }
    if (changed) {
      setSavedLocations(updated);
      localStorage.setItem('aerosky_pinned', JSON.stringify(updated));
    }
  };

  const handleSelectBookmark = (loc) => {
    loadWeatherData(loc.lat, loc.lon, loc.name, loc.country);
    setSearchQuery(`${loc.name}, ${loc.country}`);
    setSidebarOpen(false);
  };

  const handleDeleteBookmark = (name) => {
    const updated = savedLocations.filter(loc => loc.name !== name);
    setSavedLocations(updated);
    localStorage.setItem('aerosky_pinned', JSON.stringify(updated));
    showToast(`${name} removed bookmarks.`, "info");
  };

  const handleTogglePinBookmark = () => {
    const isPinned = savedLocations.some(
      loc => loc.name.toLowerCase() === currentCityName.toLowerCase()
    );

    let updated = [];
    if (isPinned) {
      updated = savedLocations.filter(
        loc => loc.name.toLowerCase() !== currentCityName.toLowerCase()
      );
      showToast(`${currentCityName} removed from Favorites.`, "info");
    } else {
      const curTemp = weatherData ? Math.round(weatherData.current.temperature_2m) : 20;
      updated = [
        ...savedLocations,
        {
          name: currentCityName,
          lat: currentCoords.lat,
          lon: currentCoords.lon,
          country: currentCountry,
          temp: curTemp
        }
      ];
      showToast(`${currentCityName} added to Favorites!`, "success");
    }

    setSavedLocations(updated);
    localStorage.setItem('aerosky_pinned', JSON.stringify(updated));
  };

  // ==========================================
  // 9. GPS MANUAL CONNECTIONS
  // ==========================================
  const handleGpsTrigger = () => {
    if (!navigator.geolocation) {
      showToast("Geolocation not supported.", "warning");
      return;
    }

    setGpsLoading(true);
    showToast("Finding coordinates...", "info");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        let cityName = "Current Location";
        let countryName = "";

        try {
          const lookupUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=en`;
          const res = await fetch(lookupUrl, { headers: { 'User-Agent': 'AeroSkyWeatherDashboardApp' } });
          if (res.ok) {
            const data = await res.json();
            cityName = data.address.city || data.address.town || data.address.village || data.address.suburb || "My Location";
            countryName = data.address.country || "";
          }
        } catch (e) {
          console.warn("Reverse lookup failed.", e);
        }

        await loadWeatherData(lat, lon, cityName, countryName);
        setSearchQuery(`${cityName}, ${countryName}`);
        setGpsLoading(false);
        showToast("Location updated successfully!", "success");
      },
      (error) => {
        console.error(error);
        setGpsLoading(false);
        showToast("Failed to retrieve GPS location.", "danger");
      },
      { timeout: 7000, enableHighAccuracy: true }
    );
  };

  // ==========================================
  // 10. EXTRACTION DETAILS HELPERS
  // ==========================================
  const isPinned = savedLocations.some(
    loc => loc.name.toLowerCase() === currentCityName.toLowerCase()
  );

  let currentParsedWeather = { state: 'clear-day', icon: 'sunny', desc: 'Clear Sky' };
  let localHour = 12;

  if (weatherData) {
    const isDay = weatherData.current.is_day === 1;
    currentParsedWeather = parseWeather(weatherData.current.weather_code, isDay);

    const offsetSeconds = weatherData.utc_offset_seconds;
    const localDate = new Date(
      new Date().getTime() + (offsetSeconds * 1000) + (new Date().getTimezoneOffset() * 60 * 1000)
    );
    localHour = localDate.getHours();
  }

  // Estimate Visibility
  let visibilityEstimate = 10;
  if (weatherData) {
    const humidity = weatherData.current.relative_humidity_2m;
    if (currentParsedWeather.state === "foggy") {
      visibilityEstimate = 1.5;
    } else if (humidity > 90 && currentParsedWeather.state === "rainy") {
      visibilityEstimate = 6;
    } else if (humidity > 80) {
      visibilityEstimate = 8;
    }
  }

  // ==========================================
  // 11. SUB-RENDER LAYOUT FUNCTIONS
  // ==========================================
  
  // A. Header rendering
  const renderHeader = () => (
    <header className="app-header">
      {/* Brand Logo */}
      <div className="brand-mark">
        <div className="brand-icon">
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2.2" fill="none">
            <path d="M17.5 19A3.5 3.5 0 0 0 21 15.5c0-2.79-3.5-6.5-3.5-6.5s-3.5 3.71-3.5 6.5a3.5 3.5 0 0 0 3.5 3.5z"/>
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
          </svg>
        </div>
        <h1 className="brand-name mb-0">AeroSky</h1>
      </div>

      {/* Search + Controls */}
      <div className="d-flex align-items-center gap-2 flex-grow-1" ref={searchContainerRef}
           style={{ position: 'relative', zIndex: 70, maxWidth: '440px' }}>
        <div className="search-wrapper flex-grow-1">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" style={{ flexShrink: 0, color: 'var(--text-muted)' }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder="Search a city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
            style={{ outline: 'none', fontSize: '0.875rem' }}
          />
          {searchQuery && (
            <button
              style={{ background: 'none', border: 'none', padding: '2px', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', flexShrink: 0 }}
              onClick={() => { setSearchQuery(''); setSuggestions([]); }}
            >
              <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" strokeWidth="2.5" fill="none">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}

          {/* Autocomplete Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="autocomplete-list">
              {suggestions.map((city, idx) => {
                const admin = city.admin1 ? `, ${city.admin1}` : "";
                const flag = getFlagEmoji(city.country_code);
                return (
                  <div
                    key={`${city.id}-${idx}`}
                    className="autocomplete-item"
                    onClick={() => {
                      loadWeatherData(city.latitude, city.longitude, city.name, city.country);
                      setSearchQuery(`${city.name}, ${city.country}`);
                      setShowSuggestions(false);
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                      {city.name}{admin}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1px' }}>
                      {city.country} {flag}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* GPS Button */}
        <button className="icon-btn" onClick={handleGpsTrigger} title="Use my location" disabled={gpsLoading}>
          {gpsLoading ? (
            <div className="loader-ring" style={{ width: '18px', height: '18px', borderWidth: '2px' }}/>
          ) : (
            <svg viewBox="0 0 24 24" width="17" height="17" stroke="currentColor" strokeWidth="2" fill="none" className="gps-svg">
              <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/>
              <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
            </svg>
          )}
        </button>

        {/* Bookmarks Button */}
        <button className="icon-btn" onClick={() => setSidebarOpen(true)} title="Saved locations">
          <svg viewBox="0 0 24 24" width="17" height="17" stroke="currentColor" strokeWidth="2" fill="none">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
          </svg>
        </button>
      </div>
    </header>
  );

  // B. Hero Weather card rendering
  const renderHeroCard = () => {
    const curTemp = Math.round(weatherData.current.temperature_2m);
    const maxTemp = Math.round(weatherData.daily.temperature_2m_max[0]);
    const minTemp = Math.round(weatherData.daily.temperature_2m_min[0]);

    return (
      <div className="card hero-card p-4 mb-4">
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <div className="d-flex align-items-center gap-2">
              <h2 className="city-name mb-0">{currentCityName}</h2>
              <button
                className={`pin-btn ${isPinned ? 'pinned' : ''}`}
                onClick={handleTogglePinBookmark}
                title={isPinned ? 'Remove from favorites' : 'Save to favorites'}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.2" fill={isPinned ? 'currentColor' : 'none'}>
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                </svg>
              </button>
            </div>
            <p className="hero-meta mt-2 mb-0">{currentDate}</p>
            <p className="hero-meta mb-0" style={{ marginTop: '2px' }}>{localTime}</p>
          </div>

          <div>
            <WeatherIcon name={currentParsedWeather.icon} width={96} animated={true} />
          </div>
        </div>

        <div className="d-flex justify-content-between align-items-end mt-4">
          <div className="d-flex align-items-start">
            <span className="hero-temp">{curTemp}</span>
            <span className="hero-temp-unit">°C</span>
          </div>

          <div className="text-end">
            <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>{currentParsedWeather.desc}</div>
            <div className="badge-pill">
              H: {maxTemp}°&nbsp;&nbsp;·&nbsp;&nbsp;L: {minTemp}°
            </div>
          </div>
        </div>
      </div>
    );
  };

  // C. Weather Stats rendering
  const renderStats = () => {
    const cur = weatherData.current;
    const daily = weatherData.daily;

    const feels = Math.round(cur.apparent_temperature);
    const humidity = cur.relative_humidity_2m;
    const windSpeed = cur.wind_speed_10m;
    const uvVal = Math.round(daily.uv_index_max[0]);
    const pressure = Math.round(cur.pressure_msl);

    const tempDiff = Math.round(feels - cur.temperature_2m);
    let feelsDesc = "Matches actual temperature";
    if (tempDiff > 1) feelsDesc = "Feels slightly warmer";
    else if (tempDiff < -1) feelsDesc = "Feels slightly cooler";

    let humDesc = "Comfortable humidity";
    if (humidity > 70) humDesc = "Humid & damp air";
    else if (humidity < 35) humDesc = "Dry ambient air";

    const compassDir = getWindDirectionText(cur.wind_direction_10m);

    const metrics = [
      { id: 1, name: "Feels Like", value: `${feels}°C`, desc: feelsDesc, accent: 'pink',
        svg: <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/> },
      { id: 2, name: "Humidity", value: `${humidity}%`, desc: humDesc, accent: 'blue', progress: humidity,
        svg: <path d="M12 22a7 7 0 0 0 7-7c0-4.3-7-13-7-13S5 10.7 5 15a7 7 0 0 0 7 7z"/> },
      { id: 3, name: "Wind Speed", value: `${windSpeed} km/h`, desc: `Direction: ${compassDir}`, accent: 'green', isWind: true,
        svg: <><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2L2 12l10 10"/></> },
      { id: 4, name: "UV Index", value: `${uvVal} — ${getUvIndexBadge(uvVal)}`, desc: getUvIndexDescription(uvVal), accent: 'orange', progress: Math.min(uvVal * 10, 100),
        svg: <><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></> },
      { id: 5, name: "Pressure", value: `${pressure} hPa`, desc: pressure > 1018 ? "High pressure system" : pressure < 1009 ? "Low pressure system" : "Stable pressure", accent: 'purple',
        svg: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></> },
      { id: 6, name: "Visibility", value: `${visibilityEstimate} km`, desc: visibilityEstimate > 8 ? "Crystal clear conditions" : "Reduced visibility", accent: 'teal',
        svg: <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/> }
    ];

    return (
      <div className="row g-3">
        {metrics.map(m => (
          <div key={m.id} className="col-6">
            <div className="card h-100">
              <div className="stat-card">
                <div className={`stat-icon-wrap ${m.accent}`}>
                  <svg viewBox="0 0 24 24" width="19" height="19" stroke="currentColor" strokeWidth="2" fill="none"
                       className={m.isWind ? 'wind-rotate' : ''}>
                    {m.svg}
                  </svg>
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="stat-label">{m.name}</div>
                  <div className="stat-value">{m.value}</div>
                  {m.progress !== undefined && (
                    <div className="stat-progress">
                      <div className="stat-progress-fill" style={{ width: `${m.progress}%` }}/>
                    </div>
                  )}
                  <div className="stat-desc">{m.desc}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // D. Hourly forecast slider rendering
  const renderHourly = () => {
    const hourly = weatherData.hourly;
    const hourlyEntries = [];

    for (let i = 0; i < 24; i++) {
      const idx = localHour + i;
      if (idx >= hourly.temperature_2m.length) break;

      const temp = Math.round(hourly.temperature_2m[idx]);
      const code = hourly.weather_code[idx];

      const hourVal = (localHour + i) % 24;
      const isDayTime = hourVal >= 6 && hourVal <= 19;
      const weatherInfo = parseWeather(code, isDayTime);

      let hourString = "";
      if (i === 0) {
        hourString = "Now";
      } else {
        const displayHour = hourVal % 12 === 0 ? 12 : hourVal % 12;
        const ampm = hourVal >= 12 ? "PM" : "AM";
        hourString = `${displayHour} ${ampm}`;
      }

      hourlyEntries.push({ id: i, label: hourString, temp, icon: weatherInfo.icon });
    }

    return (
      <div className="card p-4 mb-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h3 className="section-title mb-0">Hourly Forecast</h3>
          <span className="section-badge">Next 24h</span>
        </div>
        <div className="hourly-scroll">
          {hourlyEntries.map(entry => (
            <div key={entry.id} className={`hourly-item ${entry.id === 0 ? 'current' : ''}`}>
              <div className="hourly-time">{entry.label}</div>
              <div style={{ height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <WeatherIcon name={entry.icon} width={32} animated={false} />
              </div>
              <div className="hourly-temp">{entry.temp}°</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // E. Weekly list accordion rendering
  const renderWeekly = () => {
    const daily = weatherData.daily;
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const currentDay = new Date().getDay();

    return (
      <div className="card p-4 mb-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h3 className="section-title mb-0">7-Day Outlook</h3>
          <span className="section-badge">Weekly</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {daily.weather_code.map((code, idx) => {
            const maxTemp = Math.round(daily.temperature_2m_max[idx]);
            const minTemp = Math.round(daily.temperature_2m_min[idx]);
            const maxApp = Math.round(daily.apparent_temperature_max[idx]);
            const minApp = Math.round(daily.apparent_temperature_min[idx]);
            const precip = daily.precipitation_probability_max[idx];
            const uv = Math.round(daily.uv_index_max[idx]);
            const weatherInfo = parseWeather(code, true);
            const dayName = idx === 0 ? 'Today' : days[(currentDay + idx) % 7];
            const leftPct = Math.max(0, Math.min(72, (minTemp + 10) * 2));
            const barW   = Math.max(16, Math.min(72, (maxTemp - minTemp) * 3));
            const isExpanded = expandedWeekIndex === idx;
            return (
              <div key={idx} style={{ borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
                <div className="weekly-row" onClick={() => setExpandedWeekIndex(isExpanded ? null : idx)}>
                  <span className="weekly-day">{dayName}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, justifyContent: 'center' }}>
                    <WeatherIcon name={weatherInfo.icon} width={26} animated={false} />
                    <span className="weekly-desc">{weatherInfo.desc}</span>
                  </div>
                  <div className="temp-range">
                    <span className="temp-range-low">{minTemp}°</span>
                    <div className="temp-range-bar">
                      <div className="temp-range-fill" style={{ left: `${leftPct}%`, width: `${barW}px` }}/>
                    </div>
                    <span className="temp-range-high">{maxTemp}°</span>
                  </div>
                </div>
                {isExpanded && (
                  <div className="weekly-expand">
                    <div className="row g-2 text-center">
                      <div className="col-4">
                        <div className="expand-label">Feels like</div>
                        <div className="expand-value">{minApp}° – {maxApp}°</div>
                      </div>
                      <div className="col-4">
                        <div className="expand-label">Rain chance</div>
                        <div className="expand-value">{precip}%</div>
                      </div>
                      <div className="col-4">
                        <div className="expand-label">UV peak</div>
                        <div className="expand-value">{uv} · {getUvIndexBadge(uv)}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // F. Health Guideline widget rendering
  const renderHealth = () => {
    const uvVal = Math.round(weatherData.daily.uv_index_max[0]);
    const tempVal = weatherData.current.temperature_2m;
    
    let badgeClass = "success";
    let badgeText = "Good";
    let circleColor = "#34d399";
    if (aqiData > 150) {
      badgeClass = "danger";
      badgeText = "Hazardous";
      circleColor = "#ef4444";
    } else if (aqiData > 50) {
      badgeClass = "warning";
      badgeText = "Moderate";
      circleColor = "#fb923c";
    }

    const strokeDash = Math.min(100, Math.round((aqiData / 300) * 100));

    // Suggestions decisions
    let activities = "Excellent outdoor conditions. Great for a jog or walk.";
    let clothing = "Comfortable light layers. Perfect t-shirt weather.";
    if (currentParsedWeather.state === "rainy" || currentParsedWeather.state === "stormy") {
      activities = "Indoor activities recommended due to precipitation.";
      clothing = "Carry an umbrella. Waterproof jacket or coat advised.";
    } else if (tempVal < 10) {
      activities = "Chilly outside. Best for brisk short walks.";
      clothing = "Heavy winter coat, scarf, and insulated gloves.";
    } else if (tempVal > 30) {
      activities = "High heat. Avoid strenuous exercise at mid-day.";
      clothing = "Extremely light clothes, stay hydrated, wear hats.";
    }

    let sunProtect = "Low UV level. Minimal sun protection required.";
    if (uvVal > 5) {
      sunProtect = `High UV (${uvVal}). Apply SPF 30+, wear shades, avoid high noon.`;
    } else if (uvVal > 2) {
      sunProtect = `Moderate UV (${uvVal}). Safe, but SPF recommended for long outings.`;
    }

    return (
      <div className="card p-4 mb-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3 className="section-title mb-0">Health Guide</h3>
          <span className="section-badge">Outdoors</span>
        </div>
        <div className="row g-4 align-items-center">
          {/* AQI Dial */}
          <div className="col-sm-4 d-flex justify-content-center">
            <div style={{ position: 'relative', width: '100px', height: '100px' }}>
              <svg viewBox="0 0 36 36" width="100" height="100">
                <path className="aqi-ring-bg"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none" strokeWidth="2.8" stroke="rgba(255,255,255,0.06)"
                />
                <path className="aqi-ring"
                  strokeDasharray={`${strokeDash}, 100`}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none" stroke={circleColor} strokeWidth="2.8" strokeLinecap="round"
                />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>AQI</span>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.5rem', lineHeight: 1, color: 'var(--text-primary)' }}>{aqiData}</span>
                <span style={{ fontSize: '0.6rem', fontWeight: 700, color: circleColor, textTransform: 'uppercase', marginTop: '2px' }}>{badgeText}</span>
              </div>
            </div>
          </div>
          {/* Health Items */}
          <div className="col-sm-8">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { icon: <path d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>, color: 'var(--color-green)', label: 'Outdoor Activity', text: activities },
                { icon: <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>, color: 'var(--color-blue)', label: 'Clothing', text: clothing },
                { icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>, color: 'var(--color-amber)', label: 'Sun Protection', text: sunProtect },
              ].map((item, i) => (
                <div key={i} className="health-item">
                  <div className="health-icon" style={{ background: `${item.color}18`, color: item.color }}>
                    <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" strokeWidth="2.5" fill="none">{item.icon}</svg>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '2px' }}>{item.label}</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{item.text}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // G. Sidebar drawer bookmarks panel rendering
  const renderSidebar = () => (
    <>
      <div
        className={`offcanvas offcanvas-end ${sidebarOpen ? 'show' : ''}`}
        style={{ visibility: sidebarOpen ? 'visible' : 'hidden', zIndex: 1050 }}
        tabIndex="-1"
      >
        {/* Sidebar Header */}
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h5 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', margin: 0, color: 'var(--text-primary)' }}>Saved Locations</h5>
          <button
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '4px', display: 'flex', borderRadius: 'var(--r-sm)' }}
            onClick={() => setSidebarOpen(false)} aria-label="Close"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        {/* Sidebar Body */}
        <div style={{ padding: '16px', overflowY: 'auto', flex: 1 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {savedLocations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--text-muted)' }}>
                <svg viewBox="0 0 24 24" width="40" height="40" stroke="currentColor" strokeWidth="1" fill="none" style={{ opacity: 0.25, marginBottom: '12px' }}>
                  <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"/>
                </svg>
                <p style={{ fontSize: '0.82rem', margin: 0 }}>Search a city and tap the bookmark icon to save it here.</p>
              </div>
            ) : (
              savedLocations.map(loc => (
                <div
                  key={loc.name}
                  className="saved-city-card"
                  onClick={() => handleSelectBookmark(loc)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{loc.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{loc.country}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.25rem', color: 'var(--text-primary)' }}>{loc.temp}°</span>
                      <button
                        style={{ background: 'rgba(240,98,146,0.1)', border: 'none', padding: '6px', borderRadius: 'var(--r-sm)', cursor: 'pointer', color: 'var(--color-pink)', display: 'flex' }}
                        onClick={(e) => { e.stopPropagation(); handleDeleteBookmark(loc.name); }}
                      >
                        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      {sidebarOpen && <div className="offcanvas-backdrop fade show" style={{ zIndex: 1040 }} onClick={() => setSidebarOpen(false)}/>}
    </>
  );

  return (
    <>
      {/* Weather ambient particles */}
      <Particles weatherState={currentParsedWeather.state} />

      <div className="container py-4" style={{ position: 'relative', zIndex: 10 }}>
        {renderSidebar()}

        <div>
          {renderHeader()}

          {weatherData ? (
            <div className="row g-4 mt-0">
              {/* Left: Hero + Stats */}
              <div className="col-lg-7">
                {renderHeroCard()}
                {renderStats()}
              </div>
              {/* Right: Hourly + Weekly + Health */}
              <div className="col-lg-5">
                {renderHourly()}
                {renderWeekly()}
                {renderHealth()}
              </div>
            </div>
          ) : (
            <div className="loader-wrap">
              <div className="loader-ring"/>
              <span className="loader-text">Loading atmospheric data...</span>
            </div>
          )}

          <footer className="app-footer">
            &copy; 2026 AeroSky &mdash; Powered by{' '}
            <a href="https://open-meteo.com" target="_blank" rel="noopener noreferrer">Open-Meteo</a>
            <br />
            developed by ahamed
          </footer>
        </div>
      </div>

      {/* Toast Notifications */}
      <div className="toast-stack">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`toast-item ${t.type}`}
            onClick={() => removeToast(t.id)}
          >
            <div style={{ color: t.type === 'success' ? 'var(--color-green)' : t.type === 'danger' ? 'var(--color-pink)' : t.type === 'warning' ? 'var(--color-amber)' : 'var(--color-blue)', flexShrink: 0 }}>
              {t.type === 'success' ? (
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none"><polyline points="20 6 9 17 4 12"/></svg>
              ) : t.type === 'danger' ? (
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              ) : (
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="8"/></svg>
              )}
            </div>
            <span className="toast-text">{t.message}</span>
          </div>
        ))}
      </div>
    </>
  );
}
