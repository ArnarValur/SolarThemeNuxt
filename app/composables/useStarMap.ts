// A lightweight Star Engine for projecting celestial coordinates to the screen
// Location: Drammen, Norway (59.74, 10.20)

// 1. Star Catalog (Brightest Stars + Big Dipper)
// RA (Right Ascension) in degrees (0-360)
// Dec (Declination) in degrees (-90 to +90)
// Mag (Magnitude) - Lower is brighter
const STAR_CATALOG = [
  // --- The Winter Hexagon & Friends ---
  { name: "Sirius", ra: 101.28, dec: -16.71, mag: -1.46, color: '#AEC1D6' }, // Brightest
  { name: "Betelgeuse", ra: 88.79, dec: 7.40, mag: 0.50, color: '#FFDDAA' }, // Orion Red
  { name: "Rigel", ra: 78.63, dec: -8.20, mag: 0.12, color: '#C9DFFF' }, // Orion Blue
  { name: "Aldebaran", ra: 68.98, dec: 16.50, mag: 0.85, color: '#FFD2A1' }, // Taurus
  { name: "Capella", ra: 79.17, dec: 45.99, mag: 0.08, color: '#FFEebb' },
  { name: "Pollux", ra: 116.32, dec: 28.02, mag: 1.15, color: '#FFDBB8' },
  { name: "Procyon", ra: 114.82, dec: 5.22, mag: 0.38, color: '#FFF3E2' },

  // --- Summer Triangle ---
  { name: "Vega", ra: 279.23, dec: 38.78, mag: 0.03, color: '#CADFFF' },
  { name: "Altair", ra: 297.69, dec: 8.86, mag: 0.77, color: '#FFFFFF' },
  { name: "Deneb", ra: 310.35, dec: 45.28, mag: 1.25, color: '#FFFFFF' },

  // --- Ursa Major (Big Dipper) ---
  { name: "Dubhe", ra: 165.93, dec: 61.75, mag: 1.8, color: '#FFD2A1' },
  { name: "Merak", ra: 165.46, dec: 56.38, mag: 2.3, color: '#FFFFFF' },
  { name: "Phecda", ra: 178.46, dec: 53.69, mag: 2.4, color: '#FFFFFF' },
  { name: "Megrez", ra: 183.85, dec: 57.03, mag: 3.3, color: '#FFFFFF' },
  { name: "Alioth", ra: 193.50, dec: 55.95, mag: 1.7, color: '#FFFFFF' },
  { name: "Mizar", ra: 200.98, dec: 54.92, mag: 2.2, color: '#FFFFFF' },
  { name: "Alkaid", ra: 206.88, dec: 49.31, mag: 1.8, color: '#BAD1FF' },

  // --- Others ---
  { name: "Arcturus", ra: 213.91, dec: 19.18, mag: -0.04, color: '#FFD2A1' },
  { name: "Polaris", ra: 37.95, dec: 89.26, mag: 1.97, color: '#FFFFFF' } // North Star
]

interface ProjectedStar {
  name: string
  x: number // % of screen width
  y: number // % of screen height
  opacity: number
  size: number
  color: string
}

export const useStarMap = () => {
  const latitude = 59.74
  const longitude = 10.20
  
  const visibleStars = ref<ProjectedStar[]>([])

  // Math Helper: Degrees to Radians
  const rad = (deg: number) => deg * (Math.PI / 180)
  const deg = (rad: number) => rad * (180 / Math.PI)

  const updateStars = (date: Date) => {
    // 1. Calculate Local Sidereal Time (LST)
    // Simplified approx for PoC
    const d = (date.getTime() - new Date("2000-01-01T12:00:00Z").getTime()) / 86400000
    const GMST = (18.697374558 + 24.06570982441908 * d) % 24
    const LST_Hours = (GMST + longitude / 15 + 24) % 24
    const LST_Deg = LST_Hours * 15

    const latRad = rad(latitude)
    const sinLat = Math.sin(latRad)
    const cosLat = Math.cos(latRad)

    const projected: ProjectedStar[] = []

    STAR_CATALOG.forEach(star => {
      // 2. Convert Celestial (RA/Dec) to Horizontal (Alt/Az)
      const HA = (LST_Deg - star.ra + 360) % 360 // Hour Angle
      const haRad = rad(HA)
      const decRad = rad(star.dec)
      
      const sinDec = Math.sin(decRad)
      const cosDec = Math.cos(decRad)
      const cosHA = Math.cos(haRad)
      const sinHA = Math.sin(haRad)

      // Altitude (Elevation above horizon)
      const sinAlt = sinDec * sinLat + cosDec * cosLat * cosHA
      const altRad = Math.asin(sinAlt)
      const altDeg = deg(altRad)

      // Azimuth (Compass direction)
      const cosAlt = Math.cos(altRad)
      // Avoid division by zero at zenith
      const clampedCosAlt = Math.abs(cosAlt) < 1e-6 ? 1e-6 : cosAlt
      
      let cosAz = (sinDec - sinAlt * sinLat) / (clampedCosAlt * cosLat)
      // Clamp for floating point errors
      cosAz = Math.max(-1, Math.min(1, cosAz))
      const azRad = Math.acos(cosAz)
      let azDeg = deg(azRad)
      if (sinHA > 0) azDeg = 360 - azDeg

      // 3. Project to Screen (Fisheye / Dome Projection)
      // Only draw stars above horizon (Alt > -5 for some atmosphere refraction/fudge)
      if (altDeg > 0) {
        // Map Azimuth/Altitude to X/Y
        // Zenith (90 deg alt) is center of screen
        // Horizon (0 deg alt) is edge of screen circle
        
        // Let's assume the screen shows the entire sky dome looking UP
        // Center (50%, 50%) is Zenith.
        const r = (90 - altDeg) / 90 * 45 // Radius % (0 at center, 45 at edge)
        
        // Azimuth 0 (North) -> Up (Y=0)
        // Adjust Azimuth so 0 is Top. Standard math 0 is Right.
        const theta = rad(azDeg - 90) 

        const x = 50 + r * Math.cos(theta)
        const y = 50 + r * Math.sin(theta)

        // Calculate size/opacity based on magnitude
        // Mag -1 (bright) -> Size 4
        // Mag 3 (dim) -> Size 1
        const size = Math.max(1, 4 - star.mag)
        
        projected.push({
          name: star.name,
          x,
          y,
          opacity: 0.8 + Math.random() * 0.2, // Slight twinkle baked in?
          size,
          color: star.color
        })
      }
    })

    visibleStars.value = projected
  }

  return { visibleStars, updateStars }
}
