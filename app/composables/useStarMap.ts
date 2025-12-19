import { ref } from "vue";
import SunCalc from "suncalc";
// A lightweight Star Engine for projecting celestial coordinates to the screen
// Location: Drammen, Norway (59.74, 10.20)

const STAR_CATALOG = [
  // --- Orion (The Hunter) ---
  { name: "Betelgeuse", ra: 88.79, dec: 7.4, mag: 0.5, color: "#FFDDAA" }, // Shoulder (Red)
  { name: "Rigel", ra: 78.63, dec: -8.2, mag: 0.12, color: "#C9DFFF" }, // Foot (Blue)
  { name: "Bellatrix", ra: 81.28, dec: 6.35, mag: 1.64, color: "#B0C2FF" }, // Shoulder
  { name: "Saiph", ra: 86.94, dec: -9.67, mag: 2.07, color: "#B0C2FF" }, // Knee
  // The Belt
  { name: "Alnitak", ra: 85.19, dec: -1.94, mag: 1.74, color: "#FFFFFF" },
  { name: "Alnilam", ra: 84.05, dec: -1.2, mag: 1.69, color: "#FFFFFF" },
  { name: "Mintaka", ra: 83.0, dec: -0.3, mag: 2.25, color: "#FFFFFF" },

  // --- Ursa Major (Big Dipper) ---
  { name: "Dubhe", ra: 165.93, dec: 61.75, mag: 1.8, color: "#FFD2A1" },
  { name: "Merak", ra: 165.46, dec: 56.38, mag: 2.3, color: "#FFFFFF" },
  { name: "Phecda", ra: 178.46, dec: 53.69, mag: 2.4, color: "#FFFFFF" },
  { name: "Megrez", ra: 183.85, dec: 57.03, mag: 3.3, color: "#FFFFFF" },
  { name: "Alioth", ra: 193.5, dec: 55.95, mag: 1.7, color: "#FFFFFF" },
  { name: "Mizar", ra: 200.98, dec: 54.92, mag: 2.2, color: "#FFFFFF" },
  { name: "Alkaid", ra: 206.88, dec: 49.31, mag: 1.8, color: "#BAD1FF" },

  // --- Cassiopeia (The W) ---
  { name: "Schedar", ra: 10.13, dec: 56.53, mag: 2.24, color: "#FFD2A1" },
  { name: "Caph", ra: 2.29, dec: 59.15, mag: 2.28, color: "#FFFFFF" },
  { name: "Gamma Cas", ra: 14.18, dec: 60.72, mag: 2.15, color: "#B0C2FF" },
  { name: "Ruchbah", ra: 21.45, dec: 60.23, mag: 2.65, color: "#FFFFFF" },
  { name: "Segin", ra: 28.59, dec: 63.67, mag: 3.35, color: "#FFFFFF" },

  // --- Ursa Minor (Little Dipper) ---
  { name: "Polaris", ra: 37.95, dec: 89.26, mag: 1.97, color: "#FFFFFF" }, // North Star
  { name: "Kochab", ra: 222.68, dec: 74.15, mag: 2.07, color: "#FFD2A1" },

  // --- Bright Signposts ---
  { name: "Sirius", ra: 101.28, dec: -16.71, mag: -1.46, color: "#AEC1D6" }, // Canis Major
  { name: "Procyon", ra: 114.82, dec: 5.22, mag: 0.38, color: "#FFF3E2" }, // Canis Minor
  { name: "Aldebaran", ra: 68.98, dec: 16.5, mag: 0.85, color: "#FFD2A1" }, // Taurus
  { name: "Capella", ra: 79.17, dec: 45.99, mag: 0.08, color: "#FFEebb" }, // Auriga
  { name: "Pollux", ra: 116.32, dec: 28.02, mag: 1.15, color: "#FFDBB8" }, // Gemini
  { name: "Castor", ra: 113.65, dec: 31.88, mag: 1.58, color: "#FFFFFF" }, // Gemini
  { name: "Vega", ra: 279.23, dec: 38.78, mag: 0.03, color: "#CADFFF" }, // Lyra
  { name: "Altair", ra: 297.69, dec: 8.86, mag: 0.77, color: "#FFFFFF" }, // Aquila
  { name: "Deneb", ra: 310.35, dec: 45.28, mag: 1.25, color: "#FFFFFF" }, // Cygnus
  { name: "Arcturus", ra: 213.91, dec: 19.18, mag: -0.04, color: "#FFD2A1" }, // Bootes
];

interface ProjectedStar {
  name: string;
  x: number;
  y: number;
  opacity: number;
  size: number;
  color: string;
}

export const useStarMap = () => {
  const latitude = 59.74; // Drammen
  const longitude = 10.2;
  const visibleStars = ref<any[]>([]);

  const rad = (d: number) => d * (Math.PI / 180);
  const deg = (r: number) => r * (180 / Math.PI);

  const updateStars = (date: Date) => {
    // 1. Calculate Sidereal Time (Earth's rotation angle)
    const d =
      (date.getTime() - new Date("2000-01-01T12:00:00Z").getTime()) / 86400000;
    const GMST = (18.697374558 + 24.06570982441908 * d) % 24;
    const LST_Deg = ((GMST + longitude / 15 + 24) % 24) * 15;

    const projected: any[] = [];

    STAR_CATALOG.forEach((star) => {
      // 2. Spherical to Horizontal Math
      const HA = (LST_Deg - star.ra + 360) % 360;
      const haRad = rad(HA),
        decRad = rad(star.dec),
        latRad = rad(latitude);

      const sinAlt =
        Math.sin(decRad) * Math.sin(latRad) +
        Math.cos(decRad) * Math.cos(latRad) * Math.cos(haRad);
      const altDeg = deg(Math.asin(sinAlt));

      const cosAlt = Math.cos(rad(altDeg));
      let cosAz =
        (Math.sin(decRad) - Math.sin(rad(altDeg)) * Math.sin(latRad)) /
        (cosAlt * Math.cos(latRad));
      let azDeg = deg(Math.acos(Math.max(-1, Math.min(1, cosAz))));
      if (Math.sin(haRad) > 0) azDeg = 360 - azDeg;

      // 3. THE "ROLL FILAMENT" PROJECTION
      // We map Azimuth (0-360) linearly to X (0-100)
      // We map Altitude (0-90) linearly to Y (100-0)
      if (altDeg > -5) {
        // Show slightly below horizon for smooth rising
        projected.push({
          name: star.name,
          x: (azDeg / 360) * 100,
          y: 100 - (altDeg / 90) * 100, // 0 deg is bottom, 90 deg is top
          opacity: 0.8 + Math.random() * 0.2,
          size: Math.max(1, 4 - star.mag),
          color: star.color,
          isPlanet: false,
        });
      }
    });

    // 4. ADD PLANETS (The moving actors)
    const sunPos = SunCalc.getPosition(date, latitude, longitude);
    const planetData = [
      { name: "Jupiter", offset: 120, color: "#FFE4B5" },
      { name: "Mars", offset: 40, color: "#FF9166" },
    ];

    planetData.forEach((p) => {
      const pAz = (deg(sunPos.azimuth) + 180 + p.offset) % 360;
      const pAlt = deg(sunPos.altitude) + 5; // Keep them near the ecliptic

      if (pAlt > 0) {
        projected.push({
          name: p.name,
          x: (pAz / 360) * 100,
          y: 100 - (pAlt / 90) * 100,
          opacity: 1,
          size: 5,
          color: p.color,
          isPlanet: true,
        });
      }
    });

    visibleStars.value = projected;
  };

  return { visibleStars, updateStars };
};
