<script setup lang="ts">
const { solarData, updateSolarMetrics, setTheme, currentTheme } = useSolarEngine()

// Initialize with current time in minutes
const getCurrentMinutes = () => {
  const now = new Date()
  return now.getHours() * 60 + now.getMinutes()
}

const sliderMinutes = ref(getCurrentMinutes())
const isManual = ref(false)

const simulatedDate = computed(() => {
  const d = new Date()
  d.setHours(0, 0, 0, 0) // Start at midnight today
  d.setMinutes(sliderMinutes.value)
  return d
})

// Watch for slider changes
watch(sliderMinutes, () => {
  isManual.value = true
  updateSolarMetrics(simulatedDate.value)
})

// Watch for theme changes to trigger re-calc
watch(currentTheme, () => {
  updateSolarMetrics(simulatedDate.value)
})

// Update loop
onMounted(() => {
  updateSolarMetrics(simulatedDate.value)

  setInterval(() => {
    if (!isManual.value) {
      sliderMinutes.value = getCurrentMinutes()
      updateSolarMetrics(simulatedDate.value)
    }
  }, 60000)
})

const resetToNow = () => {
  isManual.value = false
  sliderMinutes.value = getCurrentMinutes()
  updateSolarMetrics(simulatedDate.value)
}

const formattedTime = computed(() => {
  return simulatedDate.value.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
})
</script>

<template>
  <div class="p-8 flex flex-col items-center justify-center min-h-screen relative overflow-hidden transition-all duration-500">
    <div id="solar-bg" />

    <UCard class="w-full max-w-md backdrop-blur-md bg-white/10 border-white/20 shadow-2xl">
      <template #header>
        <div class="flex justify-between items-start">
          <div>
            <h1 class="text-3xl font-bold">
              Solar Theme
            </h1>
            <p class="opacity-70 text-sm">
              Drammen (59.74, 10.20)
            </p>
          </div>
          <UBadge
            :color="currentTheme === 'minimal' ? 'neutral' : 'primary'"
            variant="solid"
          >
            {{ solarData.phase }}
          </UBadge>
        </div>
      </template>

      <div class="space-y-6">
        <!-- Theme Switcher -->
        <div class="grid grid-cols-4 gap-2">
          <UButton
            v-for="theme in ['slate', 'sand', 'minimal', 'forest']" 
            :key="theme"
            :variant="currentTheme === theme ? 'solid' : 'ghost'"
            color="neutral"
            size="xs"
            block
            class="capitalize"
            @click="setTheme(theme as 'slate' | 'sand' | 'minimal' | 'forest')"
          >
            {{ theme }}
          </UButton>
        </div>

        <!-- Metrics Grid -->
        <div class="grid grid-cols-2 gap-4 text-sm bg-black/5 p-4 rounded-lg">
          <div>
            <p class="opacity-60 text-xs uppercase tracking-wider">
              Altitude
            </p>
            <p class="text-xl font-mono font-bold">
              {{ solarData.altitude.toFixed(1) }}°
            </p>
          </div>
          <div>
            <p class="opacity-60 text-xs uppercase tracking-wider">
              Lightness
            </p>
            <p class="text-xl font-mono font-bold">
              {{ solarData.lightness.toFixed(0) }}%
            </p>
          </div>
          <div>
            <p class="opacity-60 text-xs uppercase tracking-wider">
              Hue
            </p>
            <p class="text-xl font-mono font-bold">
              {{ solarData.hue.toFixed(0) }}°
            </p>
          </div>
          <div>
            <p class="opacity-60 text-xs uppercase tracking-wider">
              Sat
            </p>
            <p class="text-xl font-mono font-bold">
              {{ solarData.saturation.toFixed(0) }}%
            </p>
          </div>
        </div>

        <!-- Time Control -->
        <div class="space-y-4">
          <div class="flex justify-between items-end">
            <span class="text-3xl font-thin font-mono">
              {{ formattedTime }}
            </span>
            <span class="text-xs opacity-50 uppercase tracking-widest mb-1">
              {{ isManual ? 'Manual Control' : 'Live Sync' }}
            </span>
          </div>

          <USlider
            v-model="sliderMinutes"
            :min="0"
            :max="1439"
            :step="1"
          />
          
          <div class="flex justify-between text-[10px] opacity-40 font-mono uppercase">
            <span>00:00</span>
            <span>12:00</span>
            <span>23:59</span>
          </div>
        </div>

        <div v-if="isManual" class="pt-2 flex justify-center">
           <UButton variant="link" color="white" @click="resetToNow">
             Return to Now
           </UButton>
        </div>
      </div>
    </UCard>

    <div class="mt-8 text-center text-xs opacity-40 max-w-xs leading-relaxed">
      Merkurial Studio PoC v1.1 <br>
      Dynamic Saturation & Golden Hour Overrides Active.
    </div>
  </div>
</template>
