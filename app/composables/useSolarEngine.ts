import SunCalc from "suncalc";

type ThemePreset = "slate" | "sand" | "minimal" | "forest";

export const useSolarEngine = () => {
  const latitude = 59.74;
  const longitude = 10.2;

  const currentTheme = ref<ThemePreset>("slate");

  const solarData = ref({
    altitude: 0,
    azimuth: 0,
    lightness: 50,
    hue: 220,
    saturation: 40,
    textColor: "black",
    phase: "Day",
  });

  const themeConfig = {
    slate: { hue: 215, baseSat: 50 }, // Professional, calm
    sand: { hue: 35, baseSat: 40 }, // Organic, soft
    minimal: { hue: 0, baseSat: 0 }, // Grayscale
    forest: { hue: 140, baseSat: 40 }, // The "Nuxt" look, refined
  };

  const updateSolarMetrics = (date: Date = new Date()) => {
    const position = SunCalc.getPosition(date, latitude, longitude);
    const altitudeDeg = position.altitude * (180 / Math.PI);

    // 1. Calculate Lightness based on Altitude (-20 to 60)
    // Map -20deg (Dark) to 60deg (Bright)
    let lightness = ((altitudeDeg + 20) / (60 + 20)) * 90 + 5;
    lightness = Math.max(5, Math.min(95, lightness));

    // 2. Get Base Theme Values
    const theme = themeConfig[currentTheme.value];
    let hue = theme.hue;
    let saturation = theme.baseSat;

    // 3. Saturation Damping (The "Nordic Studio" Vibe)
    if (lightness > 50 && theme.baseSat > 0) {
      const dampFactor = Math.max(0, 1 - (lightness - 50) / 55);
      saturation = saturation * dampFactor;
      saturation = Math.max(theme.baseSat === 0 ? 0 : 5, saturation);
    }

    // 4. Golden Hour Override
    if (altitudeDeg >= -2 && altitudeDeg <= 8) {
      if (currentTheme.value !== "minimal") {
        hue = 40;
        saturation = 70;
      }
    }

    // 5. Star Visibility Logic
    let starOpacity = 0;
    if (altitudeDeg < -6) {
      starOpacity = Math.min(1, (Math.abs(altitudeDeg) - 6) / 12);
    }

    const textColor = lightness < 50 ? "white" : "black";

    // Determine Phase
    let phase = "Night";
    if (altitudeDeg > 0) phase = "Day";
    if (altitudeDeg > -6 && altitudeDeg <= 0) phase = "Civil Twilight";
    if (altitudeDeg > -12 && altitudeDeg <= -6) phase = "Nautical Twilight";
    if (altitudeDeg > -18 && altitudeDeg <= -12)
      phase = "Astronomical Twilight";
    if (altitudeDeg > -2 && altitudeDeg < 8) phase = "Golden Hour";

    solarData.value = {
      altitude: altitudeDeg,
      azimuth: position.azimuth * (180 / Math.PI),
      lightness,
      hue,
      saturation,
      textColor,
      phase,
    };

    if (import.meta.client) {
      const root = document.documentElement;
      root.style.setProperty("--solar-h", `${hue}`);
      root.style.setProperty("--solar-s", `${saturation}%`);
      root.style.setProperty("--solar-l", `${lightness}%`);
      root.style.setProperty("--text-color", textColor);
      root.style.setProperty("--star-opacity", `${starOpacity}`);

      // Sync with Nuxt Color Mode
      const colorMode = useColorMode();
      colorMode.preference = lightness < 40 ? "dark" : "light";
    }
  };

  const setTheme = (theme: ThemePreset) => {
    currentTheme.value = theme;
  };

  return {
    solarData,
    currentTheme,
    setTheme,
    updateSolarMetrics,
  };
};
