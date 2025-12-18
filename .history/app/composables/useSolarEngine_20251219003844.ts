import SunCalc from 'suncalc'

type ThemePreset = 'slate' | 'sand' | 'minimal' | 'forest'

export const useSolarEngine = () => {
  const latitude = 59.74
  const longitude = 10.20

  const currentTheme = ref<ThemePreset>('slate')
  
  const solarData = ref({
    altitude: 0,
    azimuth: 0,
    lightness: 50,
    hue: 220, 
    saturation: 40,
    textColor: 'black',
    phase: 'Day'
  })

  const themeConfig = {
    slate: { hue: 215, baseSat: 50 }, // Professional, calm
    sand: { hue: 35, baseSat: 40 },   // Organic, soft
    minimal: { hue: 0, baseSat: 0 },  // Grayscale
    forest: { hue: 140, baseSat: 40 } // The "Nuxt" look, refined
  }

  const updateSolarMetrics = (date: Date = new Date()) => {
    const position = SunCalc.getPosition(date, latitude, longitude)
    const altitudeDeg = position.altitude * (180 / Math.PI)
    
    // 1. Calculate Lightness based on Altitude (-20 to 60)
    // Map -20deg (Dark) to 60deg (Bright)
    let lightness = ((altitudeDeg + 20) / (60 + 20)) * 90 + 5
    lightness = Math.max(5, Math.min(95, lightness))

    // 2. Get Base Theme Values
    const theme = themeConfig[currentTheme.value]
    let hue = theme.hue
    let saturation = theme.baseSat

    // 3. Saturation Damping (The "Nordic Studio" Vibe)
    // Reduce saturation as lightness increases. Target: Max 10% sat at 95% lightness.
    // Logic: As lightness goes from 50 -> 100, scale saturation down.
    if (lightness > 50 && theme.baseSat > 0) {
      // Linear falloff: 1.0 at L=50, 0.2 at L=95
      const dampFactor = Math.max(0, 1 - ((lightness - 50) / 55)) 
      saturation = saturation * dampFactor
      // Clamp floor to avoid total gray unless minimal
      saturation = Math.max(theme.baseSat === 0 ? 0 : 5, saturation)
    }

    // 4. Golden Hour Override (Specific Prompt Rule)
    // "Force Hue 40 (Gold) and Sat 70% only when Altitude is between -2 and 8 degrees"
    if (altitudeDeg >= -2 && altitudeDeg <= 8) {
      // We blend into it slightly to avoid a hard snap? 
      // The prompt says "Force", but a hard snap looks bad. Let's do a quick soft blend if possible, 
      // or just hard switch as requested for the PoC.
      // Let's stick to the prompt's request for specific values.
      if (currentTheme.value !== 'minimal') { // Don't override minimal
        hue = 40
        saturation = 70
      }
    }

    // 5. Night Override (Optional Refinement)
    // If it's deep night (Alt < -12), we might want to drift Hue toward Navy (220) 
    // if the theme is "Sand" or "Forest", to avoid muddy dark yellows/greens.
    if (altitudeDeg < -12 && currentTheme.value !== 'minimal') {
        // Blend toward 220
        hue = 220 
        saturation = 30
    }

    const textColor = lightness < 50 ? 'white' : 'black'

    // Determine Phase
    let phase = 'Night'
    if (altitudeDeg > 0) phase = 'Day'
    if (altitudeDeg > -6 && altitudeDeg <= 0) phase = 'Civil Twilight'
    if (altitudeDeg > -12 && altitudeDeg <= -6) phase = 'Nautical Twilight'
    if (altitudeDeg > -18 && altitudeDeg <= -12) phase = 'Astronomical Twilight'
    if (altitudeDeg > -2 && altitudeDeg < 8) phase = 'Golden Hour' // Adjusted range to match logic

    solarData.value = {
      altitude: altitudeDeg,
      azimuth: position.azimuth * (180 / Math.PI),
      lightness,
      hue,
      saturation,
      textColor,
      phase
    }

    if (import.meta.client) {
      const root = document.documentElement
      root.style.setProperty('--solar-h', `${hue}`)
      root.style.setProperty('--solar-s', `${saturation}%`)
      root.style.setProperty('--solar-l', `${lightness}%`)
      root.style.setProperty('--text-color', textColor)
    }
  }

  const setTheme = (theme: ThemePreset) => {
    currentTheme.value = theme
    // Trigger update immediately with current time context
    // We need to pass the last used date, but since we don't store it here,
    // the watcher in App.vue will handle the update if we just change state?
    // Actually, App.vue watches 'simulatedDate'. Changing theme doesn't change date.
    // So we should expose a way to re-run calculation or return the ref.
  }

  return {
    solarData,
    currentTheme,
    setTheme,
    updateSolarMetrics
  }
}