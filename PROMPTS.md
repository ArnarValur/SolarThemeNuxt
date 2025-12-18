# Gemini CLI Sequence

## Step 1: Scaffolding
> gemini "Initialize a Nuxt 4 project in the current directory. Install tailwindcss and suncalc. Create a basic Tailwind config and a global CSS file that defines --solar-h: 220; --solar-s: 50%; and --solar-l: 50% on the :root."

## Step 2: The Core Logic
> gemini "Create a Nuxt composable 'useSolarEngine.ts'. It should:
1. Use SunCalc with coordinates 59.74, 10.20.
2. Accept a 'virtualDate' ref.
3. Return computed properties for Altitude, Lightness (mapped 5-95%), and a 'isDark' boolean.
4. Export a function to sync these values to CSS variables on document.documentElement."

## Step 3: The UI Interface
> gemini "Update app.vue to create a 'Solar Dashboard'. 
1. The background color of the body should be 'hsl(var(--solar-h), var(--solar-s), var(--solar-l))'.
2. Add a range slider at the bottom to control the minutes of the day (0-1440).
3. Connect the slider to the virtualDate in useSolarEngine.
4. Display the current Sun Altitude and whether it is 'Solar Day' or 'Solar Night' in a clean, centered card."

## Step 4: Refinement (The Vibe Check)
> gemini "Add a CSS transition to the background-color of 0.5s ease-in-out. Ensure the text color flips instantly between white and black based on the 50% lightness threshold to maintain readability. Debug any HSL syntax issues in the global CSS."