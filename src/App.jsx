import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import WeatherHero from './components/WeatherHero';
import WeatherStats from './components/WeatherStats';
import HourlyForecast from './components/HourlyForecast';
import WeeklyForecast from './components/WeeklyForecast';
import HealthGuide from './components/HealthGuide';
import Particles from './components/Particles';
import NotificationCenter from './components/NotificationCenter';
import { parseWeather, getWindDirectionText } from './utils/weatherHelper';

export default function App() {
  // ==========================================
  // 1. APPLICATION STATE
  // ==========================================
  const [currentCoords, setCurrentCoords] = useState({ lat: 52.52, lon: 13.41 }); // Default: Berlin
  const [currentCityName, setCurrentCityName] = useState("Berlin");
  const [currentCountry, setCurrentCountry] = useState("Germany");
  const [weatherData, setWeatherData] = useState(null);
  const [aqiData, setAqiData] = useState(35); // US AQI value
  const [loading, setLoading] = useState(true);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  
  // Localized date & time clocks
  const [currentDate, setCurrentDate] = useState("");
  const [localTime, setLocalTime] = useState("");
  
  // Pinned locations loaded from LocalStorage
  const [savedLocations, setSavedLocations] = useState([]);

  // ==========================================
  // 2. TOAST ALERTS HELPER
  // ==========================================
  const showToast = (message, type = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Automatically fade out after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // ==========================================
  // 3. LOAD SAVED LOCATIONS ON INITIAL MOUNT
  // ==========================================
  useEffect(() => {
    const raw = localStorage.getItem('aerosky_pinned');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setSavedLocations(parsed);
        // quiet background update for temperatures
        backgroundSavedLocsUpdate(parsed);
      } catch (e) {
        setSavedLocations([]);
      }
    } else {
      // Default locations list on first open
      const defaults = [
        { name: "Tokyo", lat: 35.6762, lon: 139.6503, country: "Japan", temp: 24 },
        { name: "New York", lat: 40.7128, lon: -74.0060, country: "United States", temp: 19 },
        { name: "Paris", lat: 48.8566, lon: 2.3522, country: "France", temp: 17 }
      ];
      setSavedLocations(defaults);
      localStorage.setItem('aerosky_pinned', JSON.stringify(defaults));
      backgroundSavedLocsUpdate(defaults);
    }

    // Auto-detect user location on launch
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
          showToast("Location loaded successfully!", "success");
        },
        (error) => {
          console.warn("Location permission denied or timed out on start. Loading default Berlin.", error);
          loadWeatherData(52.52, 13.41, "Berlin", "Germany");
        },
        { timeout: 8000, enableHighAccuracy: true }
      );
    } else {
      loadWeatherData(52.52, 13.41, "Berlin", "Germany");
    }
  }, []);

  // ==========================================
  // 4. THEME CONTROLLER & BACKGROUND GLOWS
  // ==========================================
  // Sets body class matching current weather theme state so CSS transitions execute smoothly.
  useEffect(() => {
    if (weatherData) {
      const isDay = weatherData.current.is_day === 1;
      const weatherInfo = parseWeather(weatherData.current.weather_code, isDay);
      document.body.className = `theme-${weatherInfo.state}`;
    }
  }, [weatherData]);

  // ==========================================
  // 5. LOCAL TIME ZONE TICKING CLOCK
  // ==========================================
  useEffect(() => {
    if (!weatherData) return;

    const offsetSeconds = weatherData.utc_offset_seconds;

    const updateClock = () => {
      // Calculate dynamic local time of target timezone using UTC time and offset
      const localDate = new Date(
        new Date().getTime() + (offsetSeconds * 1000) + (new Date().getTimezoneOffset() * 60 * 1000)
      );

      // Render Time string (Hours:Minutes)
      const hours = String(localDate.getHours()).padStart(2, '0');
      const minutes = String(localDate.getMinutes()).padStart(2, '0');
      setLocalTime(`Local Time: ${hours}:${minutes}`);

      // Render Date string
      const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      setCurrentDate(localDate.toLocaleDateString('en-US', options));
    };

    updateClock();
    const interval = setInterval(updateClock, 15000); // refresh every 15 seconds

    return () => clearInterval(interval);
  }, [weatherData]);

  // ==========================================
  // 6. CORE WEATHER FETCH SERVICE
  // ==========================================
  const loadWeatherData = async (lat, lon, cityName, countryName) => {
    try {
      setLoading(true);

      // 1. Fetch Forecast Details
      const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,pressure_msl,wind_speed_10m,wind_direction_10m&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,uv_index_max,precipitation_probability_max&timezone=auto`;
      const forecastRes = await fetch(forecastUrl);
      if (!forecastRes.ok) throw new Error("Forecast API failed");
      const forecastJson = await forecastRes.json();

      // 2. Fetch Air Quality Index
      let aqiVal = 35; // graceful fallback
      try {
        const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi`;
        const aqiRes = await fetch(aqiUrl);
        if (aqiRes.ok) {
          const aqiJson = await aqiRes.json();
          if (aqiJson && aqiJson.current) {
            aqiVal = aqiJson.current.us_aqi;
          }
        }
      } catch (err) {
        console.warn("AQI fetch failed quietly. Using default fallback US AQI 35.", err);
      }

      // Bind states
      setWeatherData(forecastJson);
      setAqiData(aqiVal);
      
      if (cityName) setCurrentCityName(cityName);
      if (countryName) setCurrentCountry(countryName);
      
      setCurrentCoords({ lat, lon });
      setLoading(false);
    } catch (err) {
      console.error(err);
      showToast("Error retrieving weather forecast.", "error");
      setLoading(false);
    }
  };

  // ==========================================
  // 7. BOOKMARKS SIDEBAR & TEMPERATURE SYNCS
  // ==========================================
  const backgroundSavedLocsUpdate = async (locationsList) => {
    const updatedList = [...locationsList];
    let changed = false;
    
    for (let loc of updatedList) {
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
        console.warn(`Quiet background temp update failed for ${loc.name}`, e);
      }
    }
    
    if (changed) {
      setSavedLocations(updatedList);
      localStorage.setItem('aerosky_pinned', JSON.stringify(updatedList));
    }
  };

  const handleSelectSavedLocation = (loc) => {
    loadWeatherData(loc.lat, loc.lon, loc.name, loc.country);
    setSidebarOpen(false);
  };

  const handleDeleteSavedLocation = (name) => {
    const updated = savedLocations.filter(loc => loc.name !== name);
    setSavedLocations(updated);
    localStorage.setItem('aerosky_pinned', JSON.stringify(updated));
    showToast(`${name} removed.`, "info");
  };

  const handlePinCityToggle = () => {
    const isPinned = savedLocations.some(
      loc => loc.name.toLowerCase() === currentCityName.toLowerCase()
    );

    let updated = [];
    if (isPinned) {
      // Unpin
      updated = savedLocations.filter(
        loc => loc.name.toLowerCase() !== currentCityName.toLowerCase()
      );
      showToast(`${currentCityName} removed from Favorites.`, "info");
    } else {
      // Pin
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
      showToast(`${currentCityName} pinned to Favorites!`, "success");
    }

    setSavedLocations(updated);
    localStorage.setItem('aerosky_pinned', JSON.stringify(updated));
  };

  // ==========================================
  // 8. GPS GEOLOCATION CONNECTIONS
  // ==========================================
  const handleGpsTrigger = () => {
    if (!navigator.geolocation) {
      showToast("Geolocation is not supported by your browser.", "warning");
      return;
    }

    setGpsLoading(true);
    showToast("Retrieving your current location...", "info");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        let cityName = "Current Location";
        let countryName = "";

        // Reverse lookup City Name using Nominatim OSM free Geocoding api
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
          console.warn("Reverse lookup failed, using fallback.", e);
        }

        await loadWeatherData(lat, lon, cityName, countryName);
        setGpsLoading(false);
        showToast("Location updated successfully!", "success");
      },
      (error) => {
        console.error(error);
        setGpsLoading(false);
        showToast("Failed to acquire GPS location. Using default Berlin.", "warning");
        loadWeatherData(52.52, 13.41, "Berlin", "Germany");
      },
      { timeout: 7000, enableHighAccuracy: true }
    );
  };

  // ==========================================
  // 9. METRICS EXTRACTION HELPERS
  // ==========================================
  const isPinned = savedLocations.some(
    loc => loc.name.toLowerCase() === currentCityName.toLowerCase()
  );

  let currentParsedWeather = { state: 'clear-day', icon: 'sunny', desc: 'Clear Sky' };
  let localHour = 12;

  if (weatherData) {
    const isDay = weatherData.current.is_day === 1;
    currentParsedWeather = parseWeather(weatherData.current.weather_code, isDay);

    // Calculate local timezone hour for matching the starting hourly forecast slot
    const offsetSeconds = weatherData.utc_offset_seconds;
    const localDate = new Date(
      new Date().getTime() + (offsetSeconds * 1000) + (new Date().getTimezoneOffset() * 60 * 1000)
    );
    localHour = localDate.getHours();
  }

  // Estimate Visibility gracefully based on weather & humidity (meteorology standard fallback)
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

  return (
    <>
      {/* Background weather atmospheric particles effect */}
      <Particles weatherState={currentParsedWeather.state} />

      {/* Ambient glass light background glow elements */}
      <div className="ambient-glow glow-1"></div>
      <div className="ambient-glow glow-2"></div>

      <div className="app-container">
        {/* Saved locations menu sidebar */}
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          savedLocations={savedLocations}
          onSelectCity={handleSelectSavedLocation}
          onDeleteCity={handleDeleteSavedLocation}
        />

        {/* Main Dashboard Panel */}
        <main className="dashboard">
          {/* Header controls: Search inputs, GPS locator, Favorites toggle */}
          <Header
            onSearchSelect={(city) => loadWeatherData(city.lat, city.lon, city.name, city.country)}
            onGpsTrigger={handleGpsTrigger}
            onToggleSidebar={() => setSidebarOpen(true)}
            gpsLoading={gpsLoading}
          />

          {weatherData ? (
            <div className="dashboard-grid">
              {/* LEFT COLUMN: Main current weather conditions card & key statistics */}
              <section className="grid-left">
                <WeatherHero
                  cityName={currentCityName}
                  localTime={localTime}
                  currentDate={currentDate}
                  currentTemp={Math.round(weatherData.current.temperature_2m)}
                  weatherDesc={currentParsedWeather.desc}
                  iconName={currentParsedWeather.icon}
                  tempMax={Math.round(weatherData.daily.temperature_2m_max[0])}
                  tempMin={Math.round(weatherData.daily.temperature_2m_min[0])}
                  isPinned={isPinned}
                  onPinToggle={handlePinCityToggle}
                />

                <WeatherStats
                  currentTemp={Math.round(weatherData.current.temperature_2m)}
                  feelsLike={Math.round(weatherData.current.apparent_temperature)}
                  humidity={weatherData.current.relative_humidity_2m}
                  windSpeed={weatherData.current.wind_speed_10m}
                  windDirectionText={getWindDirectionText(weatherData.current.wind_direction_10m)}
                  uvIndex={Math.round(weatherData.daily.uv_index_max[0])}
                  pressure={Math.round(weatherData.current.pressure_msl)}
                  visibility={visibilityEstimate}
                />
              </section>

              {/* RIGHT COLUMN: Hourly slider forecast, Weekly outlook projection lists, Outdoor guidelines */}
              <section className="grid-right">
                <HourlyForecast
                  hourlyData={weatherData.hourly}
                  localHour={localHour}
                  loading={loading}
                />

                <WeeklyForecast
                  dailyData={weatherData.daily}
                  loading={loading}
                />

                <HealthGuide
                  aqiVal={aqiData}
                  uvIndex={Math.round(weatherData.daily.uv_index_max[0])}
                  temp={weatherData.current.temperature_2m}
                  weatherState={currentParsedWeather.state}
                />
              </section>
            </div>
          ) : (
            // Full screen loader while initial loading
            <div className="dashboard-grid" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
              <div className="weekly-loading" style={{ textAlign: 'center' }}>
                <div className="spinner" style={{ margin: '0 auto 15px auto' }}></div>
                <p style={{ color: '#fff', fontSize: '1.1rem' }}>Initialising atmospheric forecast dashboard...</p>
              </div>
            </div>
          )}

          {/* Footer details */}
          <footer className="app-footer">
            <p>&copy; 2026 AeroSky. Powered by keyless <a href="https://open-meteo.com" target="_blank" rel="noopener noreferrer">Open-Meteo Weather APIs</a>. Designed with premium glassmorphism.</p>
          </footer>
        </main>
      </div>

      {/* Overlay toast alert alerts */}
      <NotificationCenter toasts={toasts} removeToast={removeToast} />
    </>
  );
}
