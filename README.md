# com7-ads-inject-widget

CDN Widget สำหรับ inject Ads / Content ลงในเว็บไซต์ รองรับ Plain HTML, Vue 2, และ Vue 3
(ทั้ง CDN และ ES Module)

---

## Requirements

- [Volta](https://volta.sh) — จัดการ Node version อัตโนมัติ (pin อยู่ใน `package.json`)
- [Bun](https://bun.sh) v1.2.18 — pin อยู่ใน `.bun-version`

> **หมายเหตุ**: Volta ยังไม่รองรับการ pin Bun (`volta pin bun` จะ error) ใช้ `.bun-version` แทน — Bun อ่าน file นี้เองโดยตรง

---

## Installation

```bash
bun install
```

---

## Development

```bash
bun run start
```

Vite dev server พร้อม HMR

---

## Build

```bash
bun run build
```

Output อยู่ที่ `dist/`:

- `dist/com7-ads-inject-widget-v{version}.js` — IIFE bundle (global `AdsInjector`)
- `dist/com7-ads-inject-widget-v{version}.css` — base styles + CSS variables

---

## Testing (Local Playground)

### 1. ตั้งค่า env

```bash
cp playground/env.example.js playground/env.js
```

แก้ `playground/env.js` ตาม environment ของตัวเอง — `env.js` ถูก gitignore ไว้แล้ว ค่าหลักที่ต้องรู้:

| Key              | คำอธิบาย                                         |
| ---------------- | ------------------------------------------------ |
| `baseUrl`        | URL ของ ads backend / mock                       |
| `clientId`       | ส่งไป backend ผ่าน query string `?client_id=...` |
| `gtmContainerId` | GTM container — `'GTM-XXXXXXX'` เพื่อปิด         |
| `consentDefault` | `'denied'` (default) หรือ `'granted'`            |

### 2. Mock backend ด้วย Beeceptor (หรือ tool ที่ใช้ได้)

สร้าง mock rules 3 ตัว — ดู mock data ตัวอย่างใน [Mock Data](#mock-data) ด้านล่าง

| Method | Path                                  | Status |
| ------ | ------------------------------------- | ------ |
| GET    | `/ads/v1/zones/homepage-hero/config`  | 200    |
| GET    | `/ads/v1/zones/article-inline/config` | 200    |
| POST   | `/ads/v1/events`                      | 204    |

แล้วเอา URL ของ mock service ใส่ใน `playground/env.js` → `baseUrl`

### 3. Build แล้วรัน Preview Server

```bash
bun run build
bun run preview
```

Server รันที่ **http://localhost:4000**

### 4. เปิด Playground

| URL                                               | คำอธิบาย          |
| ------------------------------------------------- | ----------------- |
| http://localhost:4000/playground/index.html       | Plain HTML        |
| http://localhost:4000/playground/vue2-cdn.html    | Vue 2 CDN wrapper |
| http://localhost:4000/playground/vue3-cdn.html    | Vue 3 CDN         |
| http://localhost:4000/playground/vue3-module.html | Vue 3 ES Module   |

ทุกหน้ามี 2 ad zone: `homepage-hero` (top banner) + `article-inline` (กลางเนื้อหา)

---

## Usage (CDN)

ทุกเคสรองรับ `AdsInjector.inject(targetOrSelector, options)` โดย:

| Option     | Type              | จำเป็น | คำอธิบาย                                                       |
| ---------- | ----------------- | ------ | -------------------------------------------------------------- |
| `baseUrl`  | `string`          | ✓      | API base URL ของ ads backend                                   |
| `clientId` | `string`          | ✓      | ระบุ client/shop ส่งเป็น query string                          |
| `zoneId`   | `string`          | ✓      | Ads zone identifier (e.g. `'homepage-hero'`)                   |
| `onEvent`  | `(event) => void` | –      | callback ทุก event (impression, view, click, close, hover ฯลฯ) |

### Plain HTML

```html
<link rel="stylesheet" href="https://cdn.com7.in/ads-widget/com7-ads-inject-widget-v1.0.0.css" />

<div id="ads-mount"></div>

<script src="https://cdn.com7.in/ads-widget/com7-ads-inject-widget-v1.0.0.js"></script>
<script>
    AdsInjector.inject('#ads-mount', {
        baseUrl: 'https://api.com7.in',
        clientId: 'shop-001',
        zoneId: 'homepage-hero',
        onEvent: (e) => console.log('[Ad Event]', e),
    })
</script>
```

### Vue 2 (CDN)

```html
<div id="app">
    <ads-injector zone-id="homepage-hero" client-id="shop-001"></ads-injector>
</div>

<script src="https://cdn.jsdelivr.net/npm/vue@2/dist/vue.js"></script>
<script src="https://cdn.com7.in/ads-widget/com7-ads-inject-widget-v1.0.0.js"></script>
<script>
    Vue.component('ads-injector', {
        props: ['zoneId', 'clientId'],
        template: '<div ref="ads"></div>',
        mounted() {
            const A = AdsInjector?.default || AdsInjector
            A.inject(this.$refs.ads, {
                baseUrl: 'https://api.com7.in',
                clientId: this.clientId,
                zoneId: this.zoneId,
                onEvent: (e) => console.log('[Ad]', e),
            })
        },
    })
    new Vue({ el: '#app' })
</script>
```

### Vue 3 (CDN)

```html
<div id="app">
    <div id="ads-mount"></div>
</div>

<script src="https://cdn.jsdelivr.net/npm/vue@3/dist/vue.global.js"></script>
<script src="https://cdn.com7.in/ads-widget/com7-ads-inject-widget-v1.0.0.js"></script>
<script>
    const { createApp } = Vue
    createApp({
        mounted() {
            const A = AdsInjector?.default || AdsInjector
            A.inject('#ads-mount', {
                baseUrl: 'https://api.com7.in',
                clientId: 'shop-001',
                zoneId: 'homepage-hero',
            })
        },
    }).mount('#app')
</script>
```

### Vue 3 (ES Module)

```html
<div id="ads-mount"></div>

<script type="module">
    import AdsInjector from 'https://cdn.com7.in/ads-widget/com7-ads-inject-widget-v1.0.0.js'

    AdsInjector.inject('#ads-mount', {
        baseUrl: 'https://api.com7.in',
        clientId: 'shop-001',
        zoneId: 'homepage-hero',
    })
</script>
```

---

## API Contract

Backend ต้อง implement 2 endpoints ตามนี้

### `GET /ads/v1/zones/{zoneId}/config?client_id={clientId}` → 200

Response:

```ts
interface IAdsConfig {
    zoneId: string
    slots: IAdsSlot[]
}

interface IAdsSlot {
    slotId: string
    type: 'banner' // ขณะนี้ widget render เฉพาะ banner
    position: 'top' | 'bottom' | 'before' | 'after' | 'replace'
    trigger: 'immediate' | 'scroll' | 'exit_intent' | 'time_delay'
    triggerDelay?: number // ms — สำหรับ time_delay
    triggerScrollPct?: number // 0-100 — สำหรับ scroll
    targetSelector?: string // CSS selector ของ element ที่ inject before/after/replace
    content: {
        imageUrl?: string
        linkUrl?: string
        linkTarget?: '_blank' | '_self'
        altText?: string
        html?: string // reserved
    }
    frequencyCap?: { maxShows: number; periodMs: number }
    // campaign attribution
    campaignId?: string
    variantId?: string
    utmSource?: string
}
```

### `POST /ads/v1/events` → 204

Body — fire ทุก ad event (widget POST ให้อัตโนมัติเมื่อ consent ผ่าน):

```ts
interface IAdsEvent {
    type:
        | 'impression' // ad render ลง DOM
        | 'view' // ≥ 50% visible ≥ 1s (IAB standard)
        | 'click'
        | 'close'
        | 'hover' // hover ≥ 500ms
        | 'view_duration' // total visible time ตอน close
        | 'conversion' // host project ยิงเอง
        | 'frequency_capped'
        | 'error'
    slotId: string
    zoneId: string
    timestamp: number
    meta?: {
        pageUrl?: string
        sessionId?: string
        adType?: string
        trigger?: string
        campaignId?: string
        variantId?: string
        utmSource?: string
        scrollDepthPct?: number
        viewportWidth?: number
        timeOnPageMs?: number
        visibleDurationMs?: number
        errorMessage?: string
        [key: string]: any
    }
}
```

> Spec เต็มอยู่ใน `docs/ads-backend-api-spec.md`

---

## Mock Data

ตัวอย่าง response สำหรับ Beeceptor / mock tool — เอามาใส่ได้ตรงๆ ตอนเทสต์ playground

### `GET /ads/v1/zones/homepage-hero/config`

```json
{
    "zoneId": "homepage-hero",
    "slots": [
        {
            "slotId": "top-banner-001",
            "type": "banner",
            "position": "bottom",
            "trigger": "immediate",
            "targetSelector": "#ad-top",
            "content": {
                "imageUrl": "https://placehold.co/970x120/10b981/ffffff?text=TOP+BANNER",
                "linkUrl": "https://example.com/promo-top",
                "linkTarget": "_blank",
                "altText": "Top Advertisement"
            },
            "campaignId": "summer-sale-2026",
            "variantId": "A",
            "utmSource": "homepage"
        }
    ]
}
```

### `GET /ads/v1/zones/article-inline/config`

```json
{
    "zoneId": "article-inline",
    "slots": [
        {
            "slotId": "inline-banner-001",
            "type": "banner",
            "position": "bottom",
            "trigger": "immediate",
            "targetSelector": "#ad-inline",
            "content": {
                "imageUrl": "https://placehold.co/728x150/f59e0b/ffffff?text=INLINE+BANNER",
                "linkUrl": "https://example.com/promo-inline",
                "linkTarget": "_blank",
                "altText": "Inline Advertisement"
            },
            "campaignId": "article-promo-2026",
            "variantId": "B",
            "utmSource": "article"
        }
    ]
}
```

### `POST /ads/v1/events`

Response: `204 No Content` (empty body)

---

## Consent & Tracking

Widget เช็ค Google Consent Mode v2 ก่อนยิง tracking:

- `consentDefault: 'denied'` → ต้องกด accept ใน CMP ก่อน `trackEvent` ถึงจะทำงาน
- `consentDefault: 'granted'` → bypass (dev/test เท่านั้น)

`onEvent` callback ทำงานเสมอ ไม่ขึ้นกับ consent — ใช้สำหรับ host project hook logic เพิ่มเติม

---

## Deploy

Branch → Environment mapping:

| Branch    | Environment | Trigger     |
| --------- | ----------- | ----------- |
| `develop` | STG         | Auto (push) |
| `main`    | PROD        | Manual      |

Pipeline: **Bitbucket Pipelines** → Build → S3 → Purge CloudFront + Cloudflare cache

---

## Project Structure

```
src/
├── AdsInjector.vue        # Orchestrator — fetch config, schedule, render
├── entry.js               # CDN entry — exposes window.AdsInjector
├── components/
│   └── AdBanner.vue       # Banner ad component
├── composibles/           # useConsent, useAdsContext, useAdsViewability, ...
├── types/ads.ts           # Type definitions (IAdsConfig, IAdsSlot, IAdsEvent)
└── assets/main.css

playground/                # Local test pages — ดู section Testing
docs/                      # API spec + GTM container export
dist/                      # Build output (git-ignored)
```
