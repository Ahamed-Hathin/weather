import React, { useState, useEffect, useRef } from 'react';
import { getFlagEmoji } from '../utils/weatherHelper';

/**
 * Header Component
 * 
 * Manages search inputs, geocoding autocomplete, GPS current location lookup,
 * and toggling the saved bookmarks sidebar.
 * 
 * Props:
 * - onSearchSelect: function(cityObj) called when a city is chosen from search/suggestions
 * - onGpsTrigger: function() called to retrieve browser geolocation
 * - onToggleSidebar: function() called to open/toggle saved locations sidebar
 * - gpsLoading: boolean showing if GPS location lookup is active
 */
export default function Header({ onSearchSelect, onGpsTrigger, onToggleSidebar, gpsLoading }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef(null);

  // Debounced geocoding search
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const delayDebounceTimer = setTimeout(() => {
      fetchCitiesAutocomplete(searchQuery);
    }, 350);

    // Clean up timer if searchQuery changes before 350ms
    return () => clearTimeout(delayDebounceTimer);
  }, [searchQuery]);

  // Click outside listener to hide suggestions list
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch auto-complete suggestions from Open-Meteo Geocoding API
  const fetchCitiesAutocomplete = async (query) => {
    try {
      const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Autocomplete lookup failed");
      
      const data = await res.json();
      
      if (!data.results || data.results.length === 0) {
        setSuggestions([{ id: 'none', label: 'No locations found', isPlaceholder: true }]);
      } else {
        setSuggestions(data.results);
      }
      setShowSuggestions(true);
    } catch (err) {
      console.error(err);
      setSuggestions([{ id: 'error', label: 'Failed to search cities', isPlaceholder: true }]);
      setShowSuggestions(true);
    }
  };

  const handleClear = () => {
    setSearchQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleSelectSuggestion = (city) => {
    if (city.isPlaceholder) return;
    
    // Pass coordinate info and metadata back to parent
    onSearchSelect({
      name: city.name,
      country: city.country,
      lat: city.latitude,
      lon: city.longitude
    });

    // Populate search bar with selection and hide popup
    setSearchQuery(`${city.name}, ${city.country}`);
    setShowSuggestions(false);
  };

  return (
    <header className="app-header">
      {/* Brand logo details */}
      <div className="brand">
        <div className="brand-logo">
          <svg viewBox="0 0 24 24" width="32" height="32" stroke="currentColor" strokeWidth="2.5" fill="none" className="logo-svg">
            <path d="M17.5 19A3.5 3.5 0 0 0 21 15.5c0-2.79-3.5-6.5-3.5-6.5s-3.5 3.71-3.5 6.5a3.5 3.5 0 0 0 3.5 3.5z"/>
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
          </svg>
        </div>
        <h1>AeroSky</h1>
      </div>

      {/* Search Input and Suggestions panel */}
      <div className="search-controls" ref={containerRef}>
        <div className="search-wrapper">
          <button className="search-btn" aria-label="Submit Search">
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </button>
          
          <input
            type="text"
            placeholder="Search cities (e.g., London, Tokyo)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => {
              if (suggestions.length > 0) setShowSuggestions(true);
            }}
            autoComplete="off"
          />

          {searchQuery && (
            <button className="clear-btn visible" onClick={handleClear} aria-label="Clear text">
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          )}

          {/* Autocomplete suggestions popup */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="autocomplete-list">
              {suggestions.map((city, index) => {
                if (city.isPlaceholder) {
                  return (
                    <div key={city.id} className="autocomplete-item">
                      <span className="autocomplete-item-main">{city.label}</span>
                    </div>
                  );
                }

                const stateAdmin = city.admin1 ? `, ${city.admin1}` : "";
                const flag = getFlagEmoji(city.country_code);

                return (
                  <div
                    key={`${city.id}-${index}`}
                    className="autocomplete-item"
                    onClick={() => handleSelectSuggestion(city)}
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" className="stat-desc">
                      <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    <span className="autocomplete-item-main">{city.name}{stateAdmin}</span>
                    <span className="autocomplete-item-sub">{city.country} {flag}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* GPS location finder button */}
        <button
          className={`btn-action ${gpsLoading ? 'loading' : ''}`}
          onClick={onGpsTrigger}
          title="Use current location"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="gps-svg">
            <circle cx="12" cy="12" r="10"></circle>
            <circle cx="12" cy="12" r="3"></circle>
            <line x1="12" y1="1" x2="12" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="23"></line>
            <line x1="1" y1="12" x2="3" y2="12"></line>
            <line x1="21" y1="12" x2="23" y2="12"></line>
          </svg>
          <span>Current Location</span>
        </button>

        {/* Saved locations menu trigger */}
        <button className="btn-action" onClick={onToggleSidebar} title="View saved locations">
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
          </svg>
          <span>Favorites</span>
        </button>
      </div>
    </header>
  );
}
