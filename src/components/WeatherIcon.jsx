import React from 'react';

/**
 * WeatherIcon Component
 * 
 * Renders beautiful inline SVGs for different weather conditions.
 * Features clean CSS class animations matching style.css definitions.
 * 
 * Props:
 * - name: 'sunny', 'clear-night', 'cloudy', 'rainy', 'snowy', 'stormy', 'foggy'
 * - width: optional number (default 64)
 * - animated: optional boolean (default true)
 */
export default function WeatherIcon({ name, width = 64, animated = true }) {
  const animClass = animated ? "is-animated" : "";

  switch (name) {
    case "sunny":
      return (
        <svg viewBox="0 0 64 64" width={width} height={width} className={`weather-svg sunny ${animClass}`}>
          <circle cx="32" cy="32" r="12" fill="url(#sun-grad)" />
          <g className="sun-rays" stroke="url(#sun-grad)" strokeWidth="3" strokeLinecap="round">
            <line x1="32" y1="8" x2="32" y2="14" />
            <line x1="32" y1="50" x2="32" y2="56" />
            <line x1="8" y1="32" x2="14" y2="32" />
            <line x1="50" y1="32" x2="56" y2="32" />
            <line x1="15" y1="15" x2="19.25" y2="19.25" />
            <line x1="44.75" y1="44.75" x2="49" y2="49" />
            <line x1="15" y1="49" x2="19.25" y2="44.75" />
            <line x1="44.75" y1="19.25" x2="49" y2="15" />
          </g>
          <defs>
            <linearGradient id="sun-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFB300" />
              <stop offset="100%" stopColor="#F57C00" />
            </linearGradient>
          </defs>
        </svg>
      );

    case "clear-night":
      return (
        <svg viewBox="0 0 64 64" width={width} height={width} className={`weather-svg night ${animClass}`}>
          <path d="M42 36.5A13.5 13.5 0 0 1 27.5 22c0-3.3 1.2-6.3 3.2-8.6A14 14 0 1 0 49.6 34.3c-2.3 1.4-4.9 2.2-7.6 2.2z" fill="url(#moon-grad)" />
          <circle cx="20" cy="18" r="1.5" fill="#FFF" opacity="0.8" className="particle-star" style={{ animationDelay: "0s" }} />
          <circle cx="45" cy="14" r="1" fill="#FFF" opacity="0.6" className="particle-star" style={{ animationDelay: "0.5s" }} />
          <circle cx="34" cy="48" r="2" fill="#FFF" opacity="0.9" className="particle-star" style={{ animationDelay: "0.9s" }} />
          <defs>
            <linearGradient id="moon-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#CBD5E1" />
              <stop offset="100%" stopColor="#475569" />
            </linearGradient>
          </defs>
        </svg>
      );

    case "cloudy":
      return (
        <svg viewBox="0 0 64 64" width={width} height={width} className={`weather-svg cloudy ${animClass}`}>
          <path className="cloud-back" d="M42 26a7 7 0 0 0-13.6-2.2 5 5 0 0 0-7.4 4.4c0 .3 0 .6.1.9A6.5 6.5 0 0 0 20 41.5h22A6.5 6.5 0 0 0 42 26z" fill="#94a3b8" opacity="0.6" />
          <path className="cloud-main" d="M46 32a9 9 0 0 0-17.5-2.8 6.5 6.5 0 0 0-9.6 5.7c0 .4 0 .8.1 1.2A8 8 0 0 0 18 52h28a8 8 0 0 0 0-16z" fill="url(#cloud-grad)" />
          <defs>
            <linearGradient id="cloud-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#E2E8F0" />
            </linearGradient>
          </defs>
        </svg>
      );

    case "rainy":
      return (
        <svg viewBox="0 0 64 64" width={width} height={width} className={`weather-svg rainy ${animClass}`}>
          <path className="cloud-main" d="M46 26a9 9 0 0 0-17.5-2.8 6.5 6.5 0 0 0-9.6 5.7c0 .4 0 .8.1 1.2A8 8 0 0 0 18 46h28a8 8 0 0 0 0-16z" fill="url(#cloud-grad-dark)" />
          <g stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round">
            <line x1="24" y1="50" x2="22" y2="56" className="drop drop-1" />
            <line x1="32" y1="50" x2="30" y2="56" className="drop drop-2" />
            <line x1="40" y1="50" x2="38" y2="56" className="drop drop-3" />
          </g>
          <defs>
            <linearGradient id="cloud-grad-dark" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#CBD5E1" />
              <stop offset="100%" stopColor="#64748b" />
            </linearGradient>
          </defs>
        </svg>
      );

    case "snowy":
      return (
        <svg viewBox="0 0 64 64" width={width} height={width} className={`weather-svg snowy ${animClass}`}>
          <path className="cloud-main" d="M46 26a9 9 0 0 0-17.5-2.8 6.5 6.5 0 0 0-9.6 5.7c0 .4 0 .8.1 1.2A8 8 0 0 0 18 46h28a8 8 0 0 0 0-16z" fill="url(#cloud-grad)" />
          <g fill="none" stroke="#FFF" strokeWidth="1.5" strokeLinecap="round">
            <g className="snowflake-svg" style={{ transform: "translate(22px, 48px) scale(0.65)" }}>
              <line x1="0" y1="-6" x2="0" y2="6" /><line x1="-6" y1="0" x2="6" y2="0" />
              <line x1="-4" y1="-4" x2="4" y2="4" /><line x1="-4" y1="4" x2="4" y2="-4" />
            </g>
            <g className="snowflake-svg" style={{ transform: "translate(32px, 51px) scale(0.65)", animationDelay: "0.5s" }}>
              <line x1="0" y1="-6" x2="0" y2="6" /><line x1="-6" y1="0" x2="6" y2="0" />
              <line x1="-4" y1="-4" x2="4" y2="4" /><line x1="-4" y1="4" x2="4" y2="-4" />
            </g>
            <g className="snowflake-svg" style={{ transform: "translate(42px, 48px) scale(0.65)", animationDelay: "0.9s" }}>
              <line x1="0" y1="-6" x2="0" y2="6" /><line x1="-6" y1="0" x2="6" y2="0" />
              <line x1="-4" y1="-4" x2="4" y2="4" /><line x1="-4" y1="4" x2="4" y2="-4" />
            </g>
          </g>
          <defs>
            <linearGradient id="cloud-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#E2E8F0" />
            </linearGradient>
          </defs>
        </svg>
      );

    case "stormy":
      return (
        <svg viewBox="0 0 64 64" width={width} height={width} className={`weather-svg stormy ${animClass}`}>
          <path className="cloud-main" d="M46 26a9 9 0 0 0-17.5-2.8 6.5 6.5 0 0 0-9.6 5.7c0 .4 0 .8.1 1.2A8 8 0 0 0 18 46h28a8 8 0 0 0 0-16z" fill="url(#cloud-storm)" />
          <path d="M30 42l-4 7h6l-3 7 8-9h-6z" fill="#FFEB3B" stroke="#F57F17" strokeWidth="1" className="lightning" />
          <defs>
            <linearGradient id="cloud-storm" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#64748b" />
              <stop offset="100%" stopColor="#334155" />
            </linearGradient>
          </defs>
        </svg>
      );

    case "foggy":
      return (
        <svg viewBox="0 0 64 64" width={width} height={width} className={`weather-svg foggy ${animClass}`}>
          <path className="cloud-main" d="M46 26a9 9 0 0 0-17.5-2.8 6.5 6.5 0 0 0-9.6 5.7c0 .4 0 .8.1 1.2A8 8 0 0 0 18 46h28a8 8 0 0 0 0-16z" fill="url(#cloud-grad)" opacity="0.6" />
          <g stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" opacity="0.8">
            <line x1="20" y1="44" x2="44" y2="44" />
            <line x1="16" y1="49" x2="48" y2="49" />
            <line x1="24" y1="54" x2="40" y2="54" />
          </g>
          <defs>
            <linearGradient id="cloud-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#E2E8F0" />
            </linearGradient>
          </defs>
        </svg>
      );

    default:
      // Fallback to cloudy icon if type is unrecognized
      return <WeatherIcon name="cloudy" width={width} animated={animated} />;
  }
}
