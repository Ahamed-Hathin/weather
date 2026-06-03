import React, { useState, useEffect } from 'react';

/**
 * Particles Component
 * 
 * Dynamically generates floating background particles (rain, snow, stars, or clouds)
 * depending on the current weather condition theme.
 * 
 * Props:
 * - weatherState: 'clear-day', 'clear-night', 'cloudy', 'rainy', 'snowy', 'stormy', 'foggy'
 */
export default function Particles({ weatherState }) {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    let count = 0;
    let type = "";

    // Set particle counts and classes based on weatherState
    if (weatherState === "rainy") {
      count = 70;
      type = "particle-rain";
    } else if (weatherState === "stormy") {
      count = 90;
      type = "particle-rain"; // Stormy uses rain particles as well
    } else if (weatherState === "snowy") {
      count = 45;
      type = "particle-snow";
    } else if (weatherState === "clear-night") {
      count = 60;
      type = "particle-star";
    } else if (weatherState === "cloudy" || weatherState === "foggy") {
      count = 5;
      type = "particle-cloud";
    }

    // Generate random layout values for each particle
    const list = Array.from({ length: count }).map((_, index) => {
      const left = Math.random() * 100; // random percentage width
      const top = Math.random() * 100;  // random percentage height
      const delay = Math.random() * 5;  // random starting delay in seconds
      const duration = Math.random() * 3 + (type === "particle-rain" ? 0.8 : 3);
      
      let size = 0;
      let opacity = 1;
      let cloudTop = 0;
      let cloudDuration = 0;

      if (type === "particle-snow") {
        size = Math.random() * 3 + 2;
        opacity = Math.random() * 0.7 + 0.3;
      } else if (type === "particle-star") {
        size = Math.random() * 2 + 1;
        opacity = Math.random() * 0.9 + 0.1;
      } else if (type === "particle-cloud") {
        size = Math.random() * 200 + 100;
        cloudTop = Math.random() * 60; // place clouds in top 60% of screen
        cloudDuration = Math.random() * 60 + 60; // slow drift (60s to 120s)
        opacity = Math.random() * 0.12 + 0.03;
      }

      return {
        id: index,
        left,
        top,
        delay,
        duration,
        size,
        opacity,
        type,
        cloudTop,
        cloudDuration
      };
    });

    setParticles(list);
  }, [weatherState]);

  return (
    <div id="particle-container" className="particle-container">
      {particles.map((p) => {
        // Base styling for all particles
        const style = {
          left: `${p.left}vw`,
          animationDelay: `${p.delay}s`,
          animationDuration: `${p.duration}s`,
          opacity: p.opacity,
        };

        // Specific modifications based on particle type
        if (p.type === "particle-star") {
          style.top = `${p.top}vh`;
          style.width = `${p.size}px`;
          style.height = `${p.size}px`;
        } else if (p.type === "particle-snow") {
          style.width = `${p.size}px`;
          style.height = `${p.size}px`;
        } else if (p.type === "particle-cloud") {
          style.top = `${p.cloudTop}%`;
          style.width = `${p.size}px`;
          style.height = `${p.size * 0.6}px`;
          style.animationDelay = `-${p.delay * 10}s`; // start immediately at a random phase
          style.animationDuration = `${p.cloudDuration}s`;
        }

        return (
          <div
            key={p.id}
            className={p.type}
            style={style}
          />
        );
      })}
    </div>
  );
}
