# Agent Skills: CDN Content & Ads Injection Widget

## Overview

คู่มือนี้ใช้สำหรับสร้าง **CDN Widget สำหรับ inject Ads / Content ลงในเว็บไซต์** โดยใช้โครงสร้างและแนวทางเดียวกับ `ai-chat-widget-fe` (Vue 3 + Vite + IIFE CDN build) ที่รองรับทั้ง Vue 2 และ Vue 3 รวมถึง plain HTML

---

## Project Architecture

```
ads-inject-widget-fe/
├── src/
│   ├── entry.js                    # CDN entry point — exports inject() function
│   ├── AdsInjector.vue             # Root Vue 3 component
│   ├── assets/
│   │   ├── main.css                # Global styles + CSS variables
│   │   └── fonts/                  # Custom fonts (ถ้ามี)
│   ├── components/
│   │   ├── AdBanner.vue            # Banner แนวนอน (Leaderboard / Rectangle)
│   │   ├── AdPopup.vue             # Popup / Interstitial
│   │   ├── AdInline.vue            # Inline content แทรกในเนื้อหา
│   │   ├── AdStickyBar.vue         # Sticky bar ด้านบน/ล่าง
│   │   └── AdFloating.vue          # Floating widget มุมจอ
│   ├── composibles/
│   │   ├── useAdsApi.ts            # API calls (fetch ads config, track events)
│   │   ├── useAdsScheduler.ts      # ควบคุม timing, frequency cap, delay
│   │   ├── useAdsTarget.ts         # DOM selector targeting logic
│   │   └── useAdsEvents.ts         # Impression / Click / Close tracking
│   ├── types/
│   │   ├── index.ts
│   │   └── ads.ts                  # IAdsConfig, IAdsSlot, IAdsEvent types
│   ├── auto-imports.d.ts
│   └── components.d.ts
├── playground/
│   ├── index.html                  # Plain HTML demo
│   ├── vue2-cdn.html               # Vue 2 site demo
│   ├── vue3-cdn.html               # Vue 3 CDN demo
│   └── vue3-module.html            # Vue 3 module demo
├── vite.config.js
├── package.json
├── tsconfig.json
├── bitbucket-pipelines.yml
└── agentskills.md                  # ไฟล์นี้
```

---

## Tech Stack

| เรื่อง        | เหมือน chatbot project                          |
| ------------- | ----------------------------------------------- |
| Framework     | Vue 3 (Composition API)                         |
| Build tool    | Vite + Bun                                      |
| Output format | IIFE (single JS file + CSS file)                |
| Versioning    | ใช้ `version` จาก `package.json` ใส่ใน filename |
| CSS           | SCSS scoped + CSS variables สำหรับ theming      |
| Type safety   | TypeScript                                      |
| HTTP client   | Axios                                           |
| Deploy        | AWS S3 + CloudFront + Bitbucket Pipelines       |

---

## 1. package.json

```json
{
    "name": "com7-ads-inject-widget",
    "version": "1.0.0",
    "module": "index.ts",
    "type": "module",
    "scripts": {
        "build": "vite build",
        "start": "vite"
    },
    "devDependencies": {
        "@types/bun": "latest",
        "@vitejs/plugin-vue": "^6.0.1",
        "autoprefixer": "^10.4.21",
        "postcss": "^8.5.6",
        "sass": "^1.92.1",
        "unplugin-auto-import": "^20.1.0",
        "unplugin-vue-components": "^29.0.0",
        "vite-plugin-node-polyfills": "^0.24.0"
    },
    "dependencies": {
        "axios": "^1.11.0",
        "uuid": "^13.0.0",
        "vite": "^7.1.3",
        "vue": "3"
    }
}
```

---

## 2. vite.config.js

```js
import { defineConfig } from 'vite'
import { readFileSync } from 'fs'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import Components from 'unplugin-vue-components/vite'
import AutoImport from 'unplugin-auto-import/vite'

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url)))

export default defineConfig({
    plugins: [
        vue(),
        nodePolyfills({ include: ['process', 'buffer'] }),
        Components({
            dirs: ['src/components'],
            extensions: ['vue'],
            deep: true,
            dts: 'src/components.d.ts',
        }),
        AutoImport({
            imports: ['vue'],
            dirs: ['src/composibles'],
            dts: 'src/auto-imports.d.ts',
        }),
    ],
    resolve: {
        alias: { '@': path.resolve(__dirname, 'src') },
    },
    build: {
        target: 'baseline-widely-available',
        outDir: 'dist',
        lib: {
            entry: path.resolve(__dirname, 'src/entry.js'),
            name: 'AdsInjector',
            fileName: () => `com7-ads-inject-widget-v${pkg.version}.js`,
            formats: ['iife'],
        },
        rollupOptions: {
            output: {
                exports: 'named',
                assetFileNames: (assetInfo) => {
                    if (assetInfo.name?.endsWith('.css')) {
                        return `com7-ads-inject-widget-v${pkg.version}.css`
                    }
                    return assetInfo.name
                },
            },
        },
    },
})
```

---

## 3. src/entry.js — CDN Entry Point

```js
import AdsInjectorComponent from './AdsInjector.vue'
import { createApp, h } from 'vue'
import './assets/main.css'

/**
 * inject(el, options)
 *
 * @param {string|HTMLElement} el  - CSS selector หรือ DOM element ที่จะ mount widget
 * @param {object} options         - config options
 * @param {string} options.baseUrl - API base URL
 * @param {string} options.clientId
 * @param {string} options.zoneId  - Ads zone identifier (ระบุตำแหน่ง)
 * @param {Function} options.onEvent - callback รับ event (impression, click, close)
 */
function inject(el, options = {}) {
    const target = typeof el === 'string' ? document.querySelector(el) : el
    if (!target) {
        console.warn('[AdsInjector] mount target not found:', el)
        return
    }
    const app = createApp({ render: () => h(AdsInjectorComponent, { ...options }) })
    app.mount(target)
}

const AdsInjector = { inject }

export default AdsInjector
export { AdsInjector }
AdsInjector.default = AdsInjector
```

**หลักการ**: เหมือน `Chatbot.mount()` แต่เปลี่ยนชื่อเป็น `AdsInjector.inject()` และรับ `zoneId` แทน `clientId` เป็น primary identifier

---

## 4. Types — src/types/ads.ts

```ts
export type AdType = 'banner' | 'popup' | 'inline' | 'sticky_bar' | 'floating'
export type AdPosition = 'top' | 'bottom' | 'before' | 'after' | 'replace'
export type AdTrigger = 'immediate' | 'scroll' | 'exit_intent' | 'time_delay'

export interface IAdsConfig {
    zoneId: string
    slots: IAdsSlot[]
}

export interface IAdsSlot {
    slotId: string
    type: AdType
    position: AdPosition
    trigger: AdTrigger
    triggerDelay?: number // ms — ใช้กับ time_delay
    triggerScrollPct?: number // 0-100 — ใช้กับ scroll
    targetSelector?: string // CSS selector ของ element ที่ inject before/after/replace
    content: IAdsContent
    frequencyCap?: IFrequencyCap
}

export interface IAdsContent {
    imageUrl?: string
    linkUrl?: string
    linkTarget?: '_blank' | '_self'
    html?: string // custom HTML content
    altText?: string
}

export interface IFrequencyCap {
    maxShows: number
    periodMs: number // reset period in ms
}

export interface IAdsEvent {
    type: 'impression' | 'click' | 'close' | 'error'
    slotId: string
    zoneId: string
    timestamp: number
    meta?: Record<string, any>
}
```

---

## 5. Composables

### useAdsApi.ts

```ts
import { ref } from 'vue'
import axios from 'axios'
import type { IAdsConfig, IAdsEvent } from '@/types/ads'

export interface UseAdsApiOptions {
    baseUrl?: string
    clientId?: string
    zoneId?: string
}

export function useAdsApi({ baseUrl = '', clientId = '', zoneId = '' }: UseAdsApiOptions = {}) {
    const config = ref<IAdsConfig | null>(null)

    async function fetchConfig(): Promise<IAdsConfig> {
        const res = await axios.get(`${baseUrl}/ads/v1/zones/${zoneId}/config`, {
            params: { client_id: clientId },
        })
        config.value = res.data
        return res.data
    }

    async function trackEvent(event: IAdsEvent) {
        await axios.post(`${baseUrl}/ads/v1/events`, event)
    }

    return { config, fetchConfig, trackEvent }
}
```

### useAdsScheduler.ts

```ts
import { onUnmounted } from 'vue'
import type { IAdsSlot } from '@/types/ads'

export function useAdsScheduler() {
    const timers: ReturnType<typeof setTimeout>[] = []
    const scrollHandlers: (() => void)[] = []

    function schedule(slot: IAdsSlot, callback: () => void) {
        if (slot.trigger === 'immediate') {
            callback()
        } else if (slot.trigger === 'time_delay') {
            const t = setTimeout(callback, slot.triggerDelay ?? 3000)
            timers.push(t)
        } else if (slot.trigger === 'scroll') {
            const pct = slot.triggerScrollPct ?? 50
            const handler = () => {
                const scrolled =
                    (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
                if (scrolled >= pct) {
                    callback()
                    window.removeEventListener('scroll', handler)
                }
            }
            window.addEventListener('scroll', handler, { passive: true })
            scrollHandlers.push(handler)
        } else if (slot.trigger === 'exit_intent') {
            const handler = (e: MouseEvent) => {
                if (e.clientY <= 0) {
                    callback()
                    document.removeEventListener('mouseleave', handler)
                }
            }
            document.addEventListener('mouseleave', handler)
        }
    }

    onUnmounted(() => {
        timers.forEach(clearTimeout)
        scrollHandlers.forEach((h) => window.removeEventListener('scroll', h))
    })

    return { schedule }
}
```

### useAdsTarget.ts

```ts
export function useAdsTarget() {
    function getTargetElement(selector?: string): Element | null {
        if (!selector) return null
        return document.querySelector(selector)
    }

    function injectBefore(selector: string, node: HTMLElement) {
        const target = getTargetElement(selector)
        target?.parentElement?.insertBefore(node, target)
    }

    function injectAfter(selector: string, node: HTMLElement) {
        const target = getTargetElement(selector)
        target?.parentElement?.insertBefore(node, target.nextSibling)
    }

    function injectReplace(selector: string, node: HTMLElement) {
        const target = getTargetElement(selector)
        target?.parentElement?.replaceChild(node, target)
    }

    return { getTargetElement, injectBefore, injectAfter, injectReplace }
}
```

### useAdsEvents.ts

```ts
import type { IAdsEvent } from '@/types/ads'

export function useAdsEvents(zoneId: string, trackFn: (e: IAdsEvent) => void) {
    function emit(type: IAdsEvent['type'], slotId: string, meta?: Record<string, any>) {
        const event: IAdsEvent = {
            type,
            slotId,
            zoneId,
            timestamp: Date.now(),
            meta,
        }
        trackFn(event)
    }

    return { emit }
}
```

---

## 6. AdsInjector.vue — Root Component

```vue
<script setup lang="ts">
import { onMounted } from 'vue'
import type { IAdsSlot } from '@/types/ads'

const props = defineProps({
    baseUrl: { type: String, default: '' },
    clientId: { type: String, default: '' },
    zoneId: { type: String, default: '' },
    onEvent: { type: Function, default: null },
})

const { fetchConfig } = useAdsApi({
    baseUrl: props.baseUrl,
    clientId: props.clientId,
    zoneId: props.zoneId,
})
const { schedule } = useAdsScheduler()
const { emit } = useAdsEvents(props.zoneId, (e) => {
    props.onEvent?.(e)
})

onMounted(async () => {
    try {
        const config = await fetchConfig()
        config.slots.forEach((slot: IAdsSlot) => {
            schedule(slot, () => {
                emit('impression', slot.slotId)
                renderSlot(slot)
            })
        })
    } catch (err) {
        console.error('[AdsInjector] Failed to load ads config:', err)
    }
})

function renderSlot(slot: IAdsSlot) {
    // mount component ลงใน DOM ตาม slot.position / slot.targetSelector
    // ดู useAdsTarget สำหรับ helper functions
}
</script>

<template>
    <div class="com7-ads-injector">
        <!-- slots render ผ่าน JavaScript DOM injection, ไม่ใช่ template -->
    </div>
</template>

<style>
:root {
    --ads-z-index: 9990;
    --ads-popup-overlay: rgba(0, 0, 0, 0.5);
    --ads-sticky-height: 60px;
    --ads-floating-bottom: 80px;
    --ads-floating-right: 20px;
    --ads-border-radius: 8px;
    --ads-animation-duration: 0.3s;
}
</style>
```

---

## 7. Component Templates

### AdBanner.vue (Leaderboard / Rectangle)

```vue
<script setup lang="ts">
const props = defineProps<{
    imageUrl: string
    linkUrl: string
    linkTarget?: string
    altText?: string
    slotId: string
}>()
const emit = defineEmits(['click', 'close'])
</script>

<template>
    <div class="com7-ads-banner">
        <a :href="props.linkUrl" :target="props.linkTarget || '_blank'" @click="emit('click')">
            <img :src="props.imageUrl" :alt="props.altText || 'Advertisement'" />
        </a>
        <button class="com7-ads-banner__close" @click="emit('close')">×</button>
    </div>
</template>
```

### AdPopup.vue (Interstitial / Modal)

```vue
<script setup lang="ts">
import { ref } from 'vue'
const props = defineProps<{ imageUrl: string; linkUrl: string; slotId: string }>()
const emit = defineEmits(['click', 'close'])
const visible = ref(true)

function close() {
    visible.value = false
    emit('close')
}
</script>

<template>
    <transition name="ads-fade">
        <div v-if="visible" class="com7-ads-popup__overlay" @click.self="close">
            <div class="com7-ads-popup">
                <button class="com7-ads-popup__close" @click="close">×</button>
                <a :href="props.linkUrl" target="_blank" @click="emit('click')">
                    <img :src="props.imageUrl" alt="Advertisement" />
                </a>
            </div>
        </div>
    </transition>
</template>
```

### AdStickyBar.vue

```vue
<script setup lang="ts">
const props = defineProps<{
    html?: string
    imageUrl?: string
    linkUrl?: string
    position: 'top' | 'bottom'
    slotId: string
}>()
const emit = defineEmits(['click', 'close'])
</script>

<template>
    <div :class="['com7-ads-sticky', `com7-ads-sticky--${props.position}`]">
        <a v-if="props.imageUrl" :href="props.linkUrl" target="_blank" @click="emit('click')">
            <img :src="props.imageUrl" alt="Ad" />
        </a>
        <div v-else-if="props.html" v-html="props.html" @click="emit('click')"></div>
        <button @click="emit('close')">×</button>
    </div>
</template>
```

---

## 8. CSS Variables (main.css)

```css
/* com7-ads-injector CSS variables */
:root {
    --ads-z-index: 9990;
    --ads-popup-overlay: rgba(0, 0, 0, 0.5);
    --ads-sticky-height: 60px;
    --ads-floating-bottom: 80px;
    --ads-floating-right: 20px;
    --ads-border-radius: 8px;
    --ads-animation-duration: 0.3s;
    --ads-close-btn-size: 28px;
    --ads-close-btn-color: #fff;
    --ads-close-btn-bg: rgba(0, 0, 0, 0.5);
}
```

---

## 9. Playground — การทดสอบ

### Plain HTML (index.html)

```html
<link rel="stylesheet" href="/dist/com7-ads-inject-widget-v1.0.0.css" />

<div id="ads-mount"></div>

<script src="/dist/com7-ads-inject-widget-v1.0.0.js"></script>
<script>
    AdsInjector.inject('#ads-mount', {
        baseUrl: 'https://api-dev.com7.in',
        clientId: 'shop-001',
        zoneId: 'homepage-hero',
        onEvent: (e) => console.log('[Ad Event]', e),
    })
</script>
```

### Vue 2 (vue2-cdn.html)

```html
<script src="https://cdn.jsdelivr.net/npm/vue@2/dist/vue.js"></script>
<script src="/dist/com7-ads-inject-widget-v1.0.0.js"></script>
<script>
    Vue.component('ads-injector', {
        props: ['zoneId', 'clientId'],
        template: '<div ref="ads"></div>',
        mounted() {
            const A = AdsInjector?.default || AdsInjector
            A.inject(this.$refs.ads, {
                baseUrl: 'https://api-dev.com7.in',
                clientId: this.clientId,
                zoneId: this.zoneId,
                onEvent: (e) => console.log('Ad event:', e),
            })
        },
    })

    new Vue({
        el: '#app',
        data: { zoneId: 'homepage-hero', clientId: 'shop-001' },
    })
</script>
```

### Vue 3 Module (vue3-module.html)

```html
<script type="module">
    import { createApp } from 'https://cdn.jsdelivr.net/npm/vue@3/dist/vue.esm-browser.js'
    import AdsInjector from '/dist/com7-ads-inject-widget-v1.0.0.js'

    AdsInjector.inject('#ads-mount', {
        baseUrl: 'https://api-dev.com7.in',
        clientId: 'shop-001',
        zoneId: 'homepage-hero',
    })
</script>
```

---

## 10. Build & Deploy

### Build

```bash
bun install
bun run build
# output:
#   dist/com7-ads-inject-widget-v1.0.0.js
#   dist/com7-ads-inject-widget-v1.0.0.css
```

### Versioning

- เพิ่ม version ใน `package.json` → filename เปลี่ยนอัตโนมัติ
- ป้องกัน CDN cache เก่า

### bitbucket-pipelines.yml

ใช้โครงสร้างเดียวกับ chatbot project:

1. **Build** step: `bun install && bun run build`
2. **Deploy** step: อัป `dist/` ขึ้น S3 bucket (STG/PROD ตาม branch)
3. **Purge cache** step: Purge Cloudflare + CloudFront cache

Branch mapping:

- `develop` → STG bucket + DEV CDN host
- `main` → PROD bucket + PROD CDN host

---

## 11. Frequency Cap (localStorage)

```ts
// ใน useAdsScheduler.ts หรือ useAdsEvents.ts
function checkFrequencyCap(slotId: string, cap: IFrequencyCap): boolean {
    const key = `ads_fc_${slotId}`
    const raw = localStorage.getItem(key)
    const record = raw ? JSON.parse(raw) : { count: 0, resetAt: Date.now() + cap.periodMs }

    if (Date.now() > record.resetAt) {
        localStorage.setItem(key, JSON.stringify({ count: 1, resetAt: Date.now() + cap.periodMs }))
        return true // อนุญาตให้แสดง
    }

    if (record.count >= cap.maxShows) return false // ถึง cap แล้ว

    record.count++
    localStorage.setItem(key, JSON.stringify(record))
    return true
}
```

---

## 12. Key Differences vs Chatbot Widget

| Feature        | Chatbot Widget                             | Ads Inject Widget                          |
| -------------- | ------------------------------------------ | ------------------------------------------ |
| Entry function | `Chatbot.mount(el, opts)`                  | `AdsInjector.inject(el, opts)`             |
| Main component | `Chatbot.vue` (chat UI)                    | `AdsInjector.vue` (invisible orchestrator) |
| API pattern    | SSE stream + REST                          | REST only (fetch config + track events)    |
| Rendering      | Vue template                               | Dynamic Vue app mount ลง DOM positions     |
| State          | Messages array                             | Slot visibility + frequency cap            |
| CSS namespace  | `.com7-ai-chatbot`                         | `.com7-ads`                                |
| Primary config | Props (title, placeholder)                 | API-driven `IAdsConfig` per zoneId         |
| Event system   | SSE `response.delta`, `ui.suggest_actions` | `impression`, `click`, `close`             |

---

## 13. Checklist สร้าง Project ใหม่

- [ ] `bun create` + copy `vite.config.js` เปลี่ยน `name`, `entry`, `fileName`
- [ ] สร้าง `src/entry.js` — export `inject()` function
- [ ] สร้าง `src/types/ads.ts` — define types
- [ ] สร้าง composables: `useAdsApi`, `useAdsScheduler`, `useAdsTarget`, `useAdsEvents`
- [ ] สร้าง components: `AdBanner`, `AdPopup`, `AdInline`, `AdStickyBar`, `AdFloating`
- [ ] ตั้ง CSS variables ใน `main.css`
- [ ] สร้าง playground HTML files (plain, vue2, vue3)
- [ ] ตั้ง `bitbucket-pipelines.yml` ตาม chatbot project
- [ ] ทดสอบ build → verify IIFE export ทำงานถูก
- [ ] ทดสอบ Vue 2 wrapper ผ่าน `Vue.component()`
- [ ] ทดสอบ frequency cap ด้วย localStorage
