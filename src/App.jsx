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
  const [currentCoords, setCurrentCoords] = useState({ lat: 52.52, lon: 13.41 }); // Berlin
  const [currentCityName, setCurrentCityName] = useState("Berlin");
  const [currentCountry, setCurrentCountry] = useState("Germany");
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
          console.warn("Geolocation permission denied or timed out. Loading default Berlin.", error);
          loadWeatherData(52.52, 13.41, "Berlin", "Germany");
        },
        { timeout: 6000, enableHighAccuracy: true }
      );
    } else {
      loadWeatherData(52.52, 13.41, "Berlin", "Germany");
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
    <header className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3 py-2">
      {/* Title Brand Logo */}
      <div className="d-flex align-items-center gap-2">
        <div className="brand-logo text-info">
          <svg viewBox="0 0 24 24" width="32" height="32" stroke="currentColor" strokeWidth="2.5" fill="none">
            <path d="M17.5 19A3.5 3.5 0 0 0 21 15.5c0-2.79-3.5-6.5-3.5-6.5s-3.5 3.71-3.5 6.5a3.5 3.5 0 0 0 3.5 3.5z"/>
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
          </svg>
        </div>
        <h1 className="h3 mb-0 text-white font-display">AeroSky</h1>
      </div>

      {/* Autocomplete Input and buttons */}
      <div className="d-flex align-items-center gap-2 w-100 w-md-auto" ref={searchContainerRef} style={{ position: 'relative', zIndex: 70 }}>
        <div className="search-wrapper flex-grow-1" style={{ maxWidth: '320px' }}>
          <span className="text-secondary">
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </span>
          <input
            type="text"
            className="border-0 bg-transparent text-white px-2 py-1 w-100"
            placeholder="Search cities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
          />
          {searchQuery && (
            <button className="btn p-0 text-secondary" onClick={() => { setSearchQuery(''); setSuggestions([]); }}>
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          )}

          {/* Autocomplete Suggestions Popup List */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="autocomplete-list shadow-lg rounded-3 border border-secondary border-opacity-25" style={{ zIndex: 100 }}>
              {suggestions.map((city, idx) => {
                const admin = city.admin1 ? `, ${city.admin1}` : "";
                const flag = getFlagEmoji(city.country_code);
                return (
                  <div
                    key={`${city.id}-${idx}`}
                    className="autocomplete-item p-2 text-white border-bottom border-secondary border-opacity-10 d-flex justify-content-between align-items-center"
                    onClick={() => {
                      loadWeatherData(city.latitude, city.longitude, city.name, city.country);
                      setSearchQuery(`${city.name}, ${city.country}`);
                      setShowSuggestions(false);
                    }}
                  >
                    <div>
                      <span className="fw-semibold text-white">{city.name}{admin}</span>
                      <small className="d-block text-secondary">{city.country} {flag}</small>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Action Controls */}
        <button
          className="btn btn-outline-secondary border-secondary border-opacity-25 text-white d-flex align-items-center justify-content-center"
          style={{ height: '50px', width: '50px', borderRadius: '12px' }}
          onClick={handleGpsTrigger}
          title="Use location"
          disabled={gpsLoading}
        >
          {gpsLoading ? (
            <span className="spinner-border spinner-border-sm text-info" role="status"></span>
          ) : (
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" className="gps-svg">
              <circle cx="12" cy="12" r="10"></circle>
              <circle cx="12" cy="12" r="3"></circle>
              <line x1="12" y1="1" x2="12" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="23"></line>
              <line x1="1" y1="12" x2="3" y2="12"></line>
              <line x1="21" y1="12" x2="23" y2="12"></line>
            </svg>
          )}
        </button>

        <button
          className="btn btn-outline-secondary border-secondary border-opacity-25 text-white d-flex align-items-center justify-content-center"
          style={{ height: '50px', width: '50px', borderRadius: '12px' }}
          onClick={() => setSidebarOpen(true)}
          title="View Saved Favorites"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
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
      <div className="card text-white backdrop-blur border border-secondary border-opacity-25 bg-dark bg-opacity-25 p-4 rounded-4 shadow-lg mb-4">
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <div className="d-flex align-items-center gap-2">
              <h2 className="h1 mb-0 fw-extrabold">{currentCityName}</h2>
              <button
                className="btn p-0 border-0"
                onClick={handleTogglePinBookmark}
                style={{ color: isPinned ? '#ffc107' : '#94a3b8' }}
              >
                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill={isPinned ? '#ffc107' : 'none'}>
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                </svg>
              </button>
            </div>
            <p className="text-secondary mb-0 mt-1" style={{ fontSize: '14px' }}>{currentDate}</p>
            <small className="text-muted text-uppercase tracking-wider fw-semibold" style={{ fontSize: '11px' }}>{localTime}</small>
          </div>

          <div className="weather-icon-large">
            <WeatherIcon name={currentParsedWeather.icon} width={100} animated={true} />
          </div>
        </div>

        <div className="d-flex justify-content-between align-items-end mt-4">
          <div className="d-flex align-items-start">
            <span className="font-display fw-bold display-3 lh-1">{curTemp}</span>
            <span className="h4 text-info fw-semibold mt-1">°C</span>
          </div>

          <div className="text-end">
            <h4 className="h5 fw-bold mb-1">{currentParsedWeather.desc}</h4>
            <span className="text-secondary fw-semibold" style={{ fontSize: '13px' }}>
              H: {maxTemp}° <span className="text-muted px-1">|</span> L: {minTemp}°
            </span>
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

    // Feels like advice
    const tempDiff = Math.round(feels - cur.temperature_2m);
    let feelsDesc = "Feels like actual temp";
    if (tempDiff > 1) feelsDesc = "Slightly warmer";
    else if (tempDiff < -1) feelsDesc = "Feels cooler";

    // Humidity advice
    let humDesc = "Comfortable";
    if (humidity > 70) humDesc = "Humid, damp";
    else if (humidity < 35) humDesc = "Dry ambient air";

    // wind
    const compassDir = getWindDirectionText(cur.wind_direction_10m);

    // metrics data mapping
    const metrics = [
      { id: 1, name: "Feels Like", value: `${feels}°C`, desc: feelsDesc, color: 'text-danger', svg: <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/> },
      { id: 2, name: "Humidity", value: `${humidity}%`, desc: humDesc, color: 'text-primary', progress: humidity, svg: <path d="M12 22a7 7 0 0 0 7-7c0-4.3-7-13-7-13S5 10.7 5 15a7 7 0 0 0 7 7z"/> },
      { id: 3, name: "Wind Speed", value: `${windSpeed} km/h`, desc: `Direction: ${compassDir}`, color: 'text-success', svg: <><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2L2 12l10 10"></path></> },
      { id: 4, name: "UV Index", value: `${uvVal} (${getUvIndexBadge(uvVal)})`, desc: getUvIndexDescription(uvVal), color: 'text-warning', progress: Math.min(uvVal * 10, 100), svg: <><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></> },
      { id: 5, name: "Pressure", value: `${pressure} hPa`, desc: pressure > 1018 ? "High pressure" : pressure < 1009 ? "Low pressure" : "Stable pressure", color: 'text-info', svg: <><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></> },
      { id: 6, name: "Visibility", value: `${visibilityEstimate} km`, desc: visibilityEstimate > 8 ? "Perfect clarity" : "Reduced visibility", color: 'text-teal', svg: <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/> }
    ];

    return (
      <div className="row g-3">
        {metrics.map(m => (
          <div key={m.id} className="col-md-6">
            <div className="card h-100 text-white backdrop-blur border border-secondary border-opacity-25 bg-dark bg-opacity-25 p-3 rounded-4">
              <div className="d-flex align-items-center gap-3">
                <div className={`p-2 rounded bg-white bg-opacity-5 ${m.color}`} style={{ width: '42px', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" className={m.id === 3 ? "wind-spinner" : ""}>
                    {m.svg}
                  </svg>
                </div>
                <div className="min-w-0 flex-grow-1">
                  <small className="text-secondary text-uppercase tracking-wider fw-bold d-block" style={{ fontSize: '10.5px' }}>{m.name}</small>
                  <span className="fw-bold fs-5 font-display d-block my-1">{m.value}</span>
                  {m.progress !== undefined && (
                    <div className="progress mb-1" style={{ height: '4px', background: 'rgba(255,255,255,0.06)' }}>
                      <div className="progress-bar bg-info" style={{ width: `${m.progress}%` }}></div>
                    </div>
                  )}
                  <small className="text-muted text-truncate d-block" style={{ fontSize: '11px' }}>{m.desc}</small>
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
      <div className="card text-white backdrop-blur border border-secondary border-opacity-25 bg-dark bg-opacity-25 p-4 rounded-4 shadow-lg mb-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h3 className="h5 fw-bold mb-0">Hourly Forecast</h3>
          <span className="badge bg-secondary bg-opacity-25 border border-secondary border-opacity-25 text-secondary px-2 py-1">Next 24 Hours</span>
        </div>

        <div className="hourly-scroll">
          {hourlyEntries.map(entry => (
            <div
              key={entry.id}
              className={`hourly-item text-center rounded-3 p-3 bg-white bg-opacity-5 border border-secondary border-opacity-10 ${entry.id === 0 ? 'bg-opacity-10 border-opacity-25' : ''}`}
            >
              <small className="text-secondary fw-semibold d-block mb-2" style={{ fontSize: '11.5px' }}>{entry.label}</small>
              <div className="d-flex align-items-center justify-content-center mb-2" style={{ height: '36px' }}>
                <WeatherIcon name={entry.icon} width={36} animated={false} />
              </div>
              <span className="fw-bold font-display">{entry.temp}°</span>
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
      <div className="card text-white backdrop-blur border border-secondary border-opacity-25 bg-dark bg-opacity-25 p-4 rounded-4 shadow-lg mb-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h3 className="h5 fw-bold mb-0">7-Day Outlook</h3>
          <span className="badge bg-secondary bg-opacity-25 border border-secondary border-opacity-25 text-secondary px-2 py-1">Weekly Projection</span>
        </div>

        <div className="d-flex flex-column gap-2">
          {daily.weather_code.map((code, idx) => {
            const maxTemp = Math.round(daily.temperature_2m_max[idx]);
            const minTemp = Math.round(daily.temperature_2m_min[idx]);
            const maxApp = Math.round(daily.apparent_temperature_max[idx]);
            const minApp = Math.round(daily.apparent_temperature_min[idx]);
            const precip = daily.precipitation_probability_max[idx];
            const uv = Math.round(daily.uv_index_max[idx]);

            const weatherInfo = parseWeather(code, true);
            const dayName = idx === 0 ? "Today" : days[(currentDay + idx) % 7];

            // Sliding range bar calculations
            const leftPercent = Math.max(0, Math.min(80, (minTemp + 10) * 2));
            const barWidth = Math.max(20, Math.min(80, (maxTemp - minTemp) * 3));

            const isExpanded = expandedWeekIndex === idx;

            return (
              <div key={idx} className="border border-secondary border-opacity-10 rounded-3 overflow-hidden">
                {/* Header Clickable strip */}
                <div
                  className="weekly-hover-card p-3 bg-white bg-opacity-5 d-flex align-items-center justify-content-between"
                  onClick={() => setExpandedWeekIndex(isExpanded ? null : idx)}
                >
                  <span className="weekly-day text-white fw-semibold">{dayName}</span>
                  
                  <div className="weekly-status-group text-secondary">
                    <div className="weekly-status-icon d-inline-block align-middle me-2">
                      <WeatherIcon name={weatherInfo.icon} width={28} animated={false} />
                    </div>
                    <span className="small weekly-desc align-middle d-inline-block">{weatherInfo.desc}</span>
                  </div>

                  <div className="weekly-temp-bar-container">
                    <span className="weekly-temp-low small text-muted">{minTemp}°</span>
                    <div className="weekly-bar d-none d-sm-block">
                      <div className="weekly-bar-fill" style={{ left: `${leftPercent}%`, width: `${barWidth}px` }}></div>
                    </div>
                    <span className="weekly-temp-high small fw-bold">{maxTemp}°</span>
                  </div>
                </div>

                {/* Expanded Accordion parameters */}
                {isExpanded && (
                  <div className="p-3 bg-black bg-opacity-25 border-top border-secondary border-opacity-10 row g-2 text-center text-sm-start">
                    <div className="col-4">
                      <small className="text-muted text-uppercase d-block" style={{ fontSize: '9.5px', fontWeight: 700 }}>Apparent Limit</small>
                      <span className="fw-semibold small text-white">{minApp}°C to {maxApp}°C</span>
                    </div>
                    <div className="col-4">
                      <small className="text-muted text-uppercase d-block" style={{ fontSize: '9.5px', fontWeight: 700 }}>Precip. Prob.</small>
                      <span className="fw-semibold small text-white">{precip}%</span>
                    </div>
                    <div className="col-4">
                      <small className="text-muted text-uppercase d-block" style={{ fontSize: '9.5px', fontWeight: 700 }}>UV Max</small>
                      <span className="fw-semibold small text-white">{uv} ({getUvIndexBadge(uv)})</span>
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
      <div className="card text-white backdrop-blur border border-secondary border-opacity-25 bg-dark bg-opacity-25 p-4 rounded-4 shadow-lg mb-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h3 className="h5 fw-bold mb-0">AeroGuide & Health</h3>
          <span className="badge bg-secondary bg-opacity-25 border border-secondary border-opacity-25 text-secondary px-2 py-1">Outdoor Conditions</span>
        </div>

        <div className="row g-4 align-items-center">
          {/* AQI circular chart dial gauge */}
          <div className="col-sm-5 d-flex justify-content-center">
            <div className="aqi-dial position-relative" style={{ width: '110px', height: '110px' }}>
              <svg viewBox="0 0 36 36" className="circular-chart">
                <path
                  className="circle-bg"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  strokeWidth="2.5"
                />
                <path
                  className="circle"
                  strokeDasharray={`${strokeDash}, 100`}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke={circleColor}
                  strokeWidth="2.5"
                />
              </svg>
              <div className="aqi-info text-center position-absolute top-50 start-50 translate-middle d-flex flex-column align-items-center">
                <span className="text-secondary text-uppercase tracking-wider fw-bold" style={{ fontSize: '9px' }}>AQI</span>
                <span className="fw-extrabold h3 mb-0 font-display">{aqiData}</span>
                <span className={`badge bg-opacity-10 text-${badgeClass} mt-1`} style={{ fontSize: '9px', textTransform: 'uppercase' }}>{badgeText}</span>
              </div>
            </div>
          </div>

          {/* Details suggestions items */}
          <div className="col-sm-7">
            <div className="d-flex flex-column gap-3">
              <div className="d-flex align-items-start gap-2">
                <div className="text-success pt-1">
                  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none">
                    <path d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
                  </svg>
                </div>
                <div>
                  <h6 className="fw-bold mb-1" style={{ fontSize: '13.5px' }}>Outdoor Activities</h6>
                  <p className="text-secondary small mb-0">{activities}</p>
                </div>
              </div>

              <div className="d-flex align-items-start gap-2">
                <div className="text-info pt-1">
                  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none">
                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                  </svg>
                </div>
                <div>
                  <h6 className="fw-bold mb-1" style={{ fontSize: '13.5px' }}>Clothing Advice</h6>
                  <p className="text-secondary small mb-0">{clothing}</p>
                </div>
              </div>

              <div className="d-flex align-items-start gap-2">
                <div className="text-warning pt-1">
                  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                </div>
                <div>
                  <h6 className="fw-bold mb-1" style={{ fontSize: '13.5px' }}>Sun Protection</h6>
                  <p className="text-secondary small mb-0">{sunProtect}</p>
                </div>
              </div>
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
        className={`offcanvas offcanvas-end bg-dark text-white backdrop-blur border-start border-secondary border-opacity-25 ${sidebarOpen ? 'show' : ''}`}
        style={{
          visibility: sidebarOpen ? 'visible' : 'hidden',
          transition: 'transform 0.35s ease-in-out',
          zIndex: 1050
        }}
        tabIndex="-1"
      >
        <div className="offcanvas-header border-bottom border-secondary border-opacity-10 py-4 px-3 d-flex justify-content-between align-items-center">
          <h5 className="offcanvas-title fw-bold">Saved Locations</h5>
          <button className="btn p-0 text-white" onClick={() => setSidebarOpen(false)} aria-label="Close">
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="offcanvas-body p-3">
          <div className="d-flex flex-column gap-3">
            {savedLocations.length === 0 ? (
              <div className="text-center py-5 text-secondary">
                <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" strokeWidth="1" fill="none" className="mb-3 opacity-25">
                  <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"></path>
                </svg>
                <p className="small mb-0">No saved locations yet. Search a city and click the pin icon to bookmark.</p>
              </div>
            ) : (
              savedLocations.map(loc => (
                <div
                  key={loc.name}
                  className="saved-city-card p-3 rounded-3 bg-white bg-opacity-5 border border-secondary border-opacity-10 d-flex justify-content-between align-items-center"
                  onClick={() => handleSelectBookmark(loc)}
                  style={{ cursor: 'pointer' }}
                >
                  <div>
                    <span className="fw-bold d-block text-white" style={{ fontSize: '15px' }}>{loc.name}</span>
                    <small className="text-secondary" style={{ fontSize: '12px' }}>{loc.country}</small>
                  </div>
                  <div className="d-flex align-items-center gap-3">
                    <span className="fw-extrabold font-display fs-4 text-white">{loc.temp}°</span>
                    <button
                      className="btn btn-sm btn-outline-danger border-0 p-1 rounded-circle"
                      onClick={(e) => { e.stopPropagation(); handleDeleteBookmark(loc.name); }}
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      {/* offcanvas overlay dark backdrop */}
      {sidebarOpen && <div className="offcanvas-backdrop fade show" style={{ zIndex: 1040 }} onClick={() => setSidebarOpen(false)}></div>}
    </>
  );

  return (
    <>
      {/* Background weather particle physics */}
      <Particles weatherState={currentParsedWeather.state} />

      {/* Ambient glowing radial layers */}
      <div className="ambient-glow glow-1"></div>
      <div className="ambient-glow glow-2"></div>

      <div className="container py-4" style={{ position: 'relative', zIndex: 10 }}>
        {/* Bookmarked lists drawer */}
        {renderSidebar()}

        <div className="dashboard">
          {/* Header controls (Navbar inputs / GPS actions) */}
          {renderHeader()}

          {weatherData ? (
            <div className="row g-4">
              {/* LEFT SIDEBAR PANEL: Main weather card & metrics */}
              <div className="col-lg-7">
                {renderHeroCard()}
                {renderStats()}
              </div>

              {/* RIGHT CONTAINER: Projections scroll and health guides */}
              <div className="col-lg-5">
                {renderHourly()}
                {renderWeekly()}
                {renderHealth()}
              </div>
            </div>
          ) : (
            // Full screen loader spinner
            <div className="d-flex flex-column align-items-center justify-content-center" style={{ height: '60vh' }}>
              <div className="spinner-border text-info mb-3" style={{ width: '3rem', height: '3rem' }} role="status"></div>
              <span className="text-secondary fw-semibold">Initialising atmospheric forecast dashboard...</span>
            </div>
          )}

          {/* Footer credentials */}
          <footer className="app-footer mt-5 text-center py-4 border-top border-secondary border-opacity-10">
            <p className="small mb-0 text-muted">
              &copy; 2026 AeroSky. Powered by keyless <a href="https://open-meteo.com" target="_blank" rel="noopener noreferrer">Open-Meteo Weather APIs</a>. Designed with premium glassmorphism.
            </p>
          </footer>
        </div>
      </div>

      {/* Floating Alerts Toasts Stack */}
      <div className="toast-container-custom">
        {toasts.map(t => (
          <div
            key={t.id}
            onClick={() => removeToast(t.id)}
            className={`toast-custom d-flex align-items-center p-3 rounded-3 text-white border-start border-4 border-top-0 border-end-0 border-bottom-0 shadow-lg bg-dark bg-opacity-95 border-${t.type === 'success' ? 'success' : t.type === 'danger' ? 'danger' : 'info'}`}
            style={{ cursor: 'pointer' }}
          >
            <div className="me-2 text-white">
              {t.type === 'success' ? (
                <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.5" fill="none"><polyline points="20 6 9 17 4 12"></polyline></svg>
              ) : t.type === 'danger' ? (
                <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.5" fill="none"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              ) : (
                <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="8"></line></svg>
              )}
            </div>
            <span className="fw-semibold small">{t.message}</span>
          </div>
        ))}
      </div>
    </>
  );
}
