/**
 * AeroSky - Weather Utilities and Constants
 * 
 * This file contains static data mappings and helper functions.
 * Keeping them here makes our React components much cleaner,
 * easier to read, and beginner-friendly!
 */

// WMO Weather interpretation codes
// For documentation, see: https://open-meteo.com/en/docs
export const wmoWeatherMap = {
    0: { desc: "Clear Sky", state: "clear-day", icon: "sunny" },
    1: { desc: "Mainly Clear", state: "clear-day", icon: "sunny" },
    2: { desc: "Partly Cloudy", state: "cloudy", icon: "cloudy" },
    3: { desc: "Overcast", state: "cloudy", icon: "cloudy" },
    45: { desc: "Foggy", state: "foggy", icon: "foggy" },
    48: { desc: "Depositing Rime Fog", state: "foggy", icon: "foggy" },
    51: { desc: "Light Drizzle", state: "rainy", icon: "rainy" },
    53: { desc: "Moderate Drizzle", state: "rainy", icon: "rainy" },
    55: { desc: "Dense Drizzle", state: "rainy", icon: "rainy" },
    56: { desc: "Light Freezing Drizzle", state: "snowy", icon: "snowy" },
    57: { desc: "Dense Freezing Drizzle", state: "snowy", icon: "snowy" },
    61: { desc: "Slight Rain", state: "rainy", icon: "rainy" },
    63: { desc: "Moderate Rain", state: "rainy", icon: "rainy" },
    65: { desc: "Heavy Rain", state: "rainy", icon: "rainy" },
    66: { desc: "Light Freezing Rain", state: "snowy", icon: "snowy" },
    67: { desc: "Heavy Freezing Rain", state: "snowy", icon: "snowy" },
    71: { desc: "Slight Snowfall", state: "snowy", icon: "snowy" },
    73: { desc: "Moderate Snowfall", state: "snowy", icon: "snowy" },
    75: { desc: "Heavy Snowfall", state: "snowy", icon: "snowy" },
    77: { desc: "Snow grains", state: "snowy", icon: "snowy" },
    80: { desc: "Slight Rain Showers", state: "rainy", icon: "rainy" },
    81: { desc: "Moderate Rain Showers", state: "rainy", icon: "rainy" },
    82: { desc: "Violent Rain Showers", state: "rainy", icon: "rainy" },
    85: { desc: "Slight Snow Showers", state: "snowy", icon: "snowy" },
    86: { desc: "Heavy Snow Showers", state: "snowy", icon: "snowy" },
    95: { desc: "Thunderstorm", state: "stormy", icon: "stormy" },
    96: { desc: "Thunderstorm with Slight Hail", state: "stormy", icon: "stormy" },
    99: { desc: "Thunderstorm with Heavy Hail", state: "stormy", icon: "stormy" }
};

/**
 * Parses WMO Weather Code into description, theme state, and icon type.
 * Handles switching day themes (e.g. clear-day) to night themes (e.g. clear-night).
 */
export function parseWeather(code, isDay = true) {
    const config = wmoWeatherMap[code] || { desc: "Unknown Weather", state: "cloudy", icon: "cloudy" };
    
    let finalState = config.state;
    let finalIcon = config.icon;
    
    // If it's night-time and state is clear-day, change to clear-night
    if (config.state === "clear-day" && !isDay) {
        finalState = "clear-night";
        finalIcon = "clear-night";
    }
    
    return {
        desc: config.desc,
        state: finalState,
        icon: finalIcon
    };
}

/**
 * Converts wind direction in degrees to compass text (e.g., North, South-East).
 */
export function getWindDirectionText(deg) {
    const directions = ['North', 'North-East', 'East', 'South-East', 'South', 'South-West', 'West', 'North-West'];
    const idx = Math.round(deg / 45) % 8;
    return directions[idx];
}

/**
 * Returns a simple string category based on the UV Index value.
 */
export function getUvIndexBadge(uv) {
    if (uv <= 2) return "Low";
    if (uv <= 5) return "Moderate";
    if (uv <= 7) return "High";
    if (uv <= 10) return "Very High";
    return "Extreme";
}

/**
 * Returns safety advice text based on the UV Index.
 */
export function getUvIndexDescription(uv) {
    if (uv <= 2) return "Safe levels. Minimal protection needed";
    if (uv <= 5) return "Apply sunscreen. Seek shade at noon";
    if (uv <= 7) return "Protection required. Avoid mid-day sun";
    return "Dangerous exposure. Peak protection crucial";
}

/**
 * Converts a two-letter country code (e.g. "US", "JP") into its emoji flag.
 */
export function getFlagEmoji(countryCode) {
    if (!countryCode) return "";
    const codePoints = countryCode
        .toUpperCase()
        .split('')
        .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
}
