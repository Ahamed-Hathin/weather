import React from 'react';

/**
 * Sidebar Component
 * 
 * Displays the pinned weather locations saved in LocalStorage.
 * Clicking a location loads its weather, and clicking the trash/delete icon removes it.
 * 
 * Props:
 * - isOpen: boolean indicating if sidebar is visible
 * - onClose: function to close the sidebar
 * - savedLocations: array of saved cities { name, country, temp, lat, lon }
 * - onSelectCity: function to load weather for a saved city
 * - onDeleteCity: function to remove a city from saved locations
 */
export default function Sidebar({ isOpen, onClose, savedLocations, onSelectCity, onDeleteCity }) {
  return (
    <aside className={`sidebar ${isOpen ? 'active' : ''}`}>
      <div className="sidebar-header">
        <h3>Saved Locations</h3>
        <button className="btn-icon" onClick={onClose} aria-label="Close sidebar">
          <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div className="saved-locations-list">
        {savedLocations.length === 0 ? (
          // Empty State Placeholder
          <div className="sidebar-placeholder">
            <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round" className="bounce">
              <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            <p>No saved locations yet. Search a city and click the pin icon to save.</p>
          </div>
        ) : (
          // List of saved location cards
          savedLocations.map((loc) => (
            <div
              key={loc.name}
              className="saved-city-card"
              onClick={() => onSelectCity(loc)}
            >
              <div className="saved-city-info">
                <span className="saved-city-name">{loc.name}</span>
                <span className="saved-city-meta">{loc.country}</span>
              </div>
              <div className="saved-city-weather">
                <span className="saved-city-temp">{loc.temp}°</span>
                <button
                  className="btn-delete-saved"
                  title="Delete bookmark"
                  onClick={(e) => {
                    e.stopPropagation(); // prevent loading the city when clicking delete
                    onDeleteCity(loc.name);
                  }}
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
