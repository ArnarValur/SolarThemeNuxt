# PoC: Dynamic Solar Theme (Drammen Logic)

## Context
Goal: A Nuxt 4 sandbox testing "Dynamic Lightness" based on solar altitude.
Location: Drammen, Norway (59.74, 10.20)
Stack: Nuxt 4, Tailwind CSS, SunCalc, Raw CSS Variables (HSL).

## Technical Requirements
- Use `suncalc` to derive solar altitude from a Date object.
- Map Altitude (-20° to 60°) to Lightness (5% to 95%).
- Maintain CSS variables on `:root`: `--solar-h`, `--solar-s`, `--solar-l`.
- Contrast Logic: If `--solar-l` < 50, `--text-color` is white. Else, black.

## Task List
- [ ] Initialize Nuxt 4 & Tailwind.
- [ ] Install `suncalc` dependency.
- [ ] Create `composables/useSolarEngine.ts` (The Math).
- [ ] Create `assets/css/main.css` with HSL variable bindings.
- [ ] Build `app.vue` with:
    - [ ] Full-screen dynamic background using `--solar-l`.
    - [ ] "Time Travel" slider (0 to 1440 minutes of the day).
    - [ ] Status display: Sun Altitude, Current Phase (Dawn, Noon, etc.).
- [ ] Implement a "Warmth Offset": Increase `--solar-h` (Hue) toward 40° (Gold) when altitude is between -5° and 10°.