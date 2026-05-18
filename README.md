# com7-ads-inject-widget

CDN Widget สำหรับ inject Ads / Content ลงในเว็บไซต์ รองรับ Plain HTML, Vue 2, และ Vue 3
(ทั้ง CDN และ ES Module)

รองรับ ad type: **Banner**, **Inline**, **Bento Grid**

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

สร้าง mock rules ต่อไปนี้ — ดู mock data ตัวอย่างใน [Mock Data](#mock-data) ด้านล่าง

| Method | Path                                    | Status |
| ------ | --------------------------------------- | ------ |
| GET    | `/ads/v1/zones/homepage-hero/config`    | 200    |
| GET    | `/ads/v1/zones/article-inline/config`   | 200    |
| GET    | `/ads/v1/zones/homepage-bento/config`   | 200    |
| POST   | `/ads/v1/events`                        | 204    |

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

ทุกหน้ามี 3 ad zone:

| Zone ID           | ตำแหน่ง        | Ad Type     |
| ----------------- | -------------- | ----------- |
| `homepage-hero`   | Top banner     | Banner      |
| `article-inline`  | กลางเนื้อหา   | Inline      |
| `homepage-bento`  | Bento grid     | Bento Grid  |

---

## Usage (CDN)

ทุกเคสรองรับ `AdsInjector.inject(targetOrSelector, options)` โดย:

| Option     | Type              | จำเป็น | คำอธิบาย                                                       |
| ---------- | ----------------- | ------ | -------------------------------------------------------------- |
| `baseUrl`  | `string`          | ✓      | API base URL ของ ads backend                                   |
| `clientId` | `string`          | ✓      | ระบุ client/shop ส่งเป็น query string                          |
| `zoneId`   | `string`          | ✓      | Ads zone identifier (e.g. `'homepage-hero'`)                   |
| `onEvent`  | `(event) => void` | –      | callback ทุก event (impression, view, click, close, hover ฯลฯ) |

### Error Handling via `onEvent`

Widget จัดการ fetch เอง — host project react ผ่าน `onEvent` callback:

```js
AdsInjector.inject(targetEl, {
    // ...
    onEvent(e) {
        if (e.type === 'impression') {
            // ad render สำเร็จ → ซ่อน fallback
            fallbackEl.remove()
        }
        if (e.type === 'error') {
            // fetch / render ล้มเหลว → คง fallback ไว้
            // ถ้าไม่มี fallback ให้ซ่อน zone ทั้งหมด
            if (!hasFallback) container.style.display = 'none'
        }
    },
})
```

> **ไม่ต้อง** pre-fetch `/config` เองก่อนเรียก `inject` — widget ทำให้ทั้งหมด

### Plain HTML

```html
<link rel="stylesheet" href="https://cdn.com7.in/ads-widget/com7-ads-inject-widget-v1.0.0.css" />

<div id="ad-top">
    <!-- fallback แสดงระหว่างรอ / เมื่อ error -->
    <div data-fallback>
        <div class="com7-ads-banner">
            <a href="/promo" target="_blank"><img src="/fallback.jpg" alt="Ad" /></a>
            <button class="com7-ads-banner__close">×</button>
        </div>
    </div>
    <!-- inject target — widget เขียน ad ลงที่นี่ -->
    <div data-target></div>
</div>

<script src="https://cdn.com7.in/ads-widget/com7-ads-inject-widget-v1.0.0.js"></script>
<script>
    const fallbackEl = document.querySelector('#ad-top [data-fallback]')
    const targetEl   = document.querySelector('#ad-top [data-target]')

    AdsInjector.inject(targetEl, {
        baseUrl: 'https://api.com7.in',
        clientId: 'shop-001',
        zoneId: 'homepage-hero',
        onEvent(e) {
            if (e.type === 'impression') fallbackEl?.remove()
            if (e.type === 'error' && !fallbackEl?.children.length) {
                document.getElementById('ad-top').style.display = 'none'
            }
        },
    })

    // ปุ่มปิด fallback
    document.addEventListener('click', (e) => {
        if (e.target.matches('.com7-ads-banner__close')) {
            e.target.closest('[data-fallback]')?.remove()
        }
    })
</script>
```

### Vue 2 (CDN)

Playground มี 3 component พร้อมใช้:

| Component              | CSS wrapper         | มีปุ่มปิด |
| ---------------------- | ------------------- | --------- |
| `ads-banner-injector`  | `.com7-ads-banner`  | ✓         |
| `ads-inline-injector`  | `.com7-ads-inline`  | –         |
| `ads-bento-injector`   | `.ad-bento-grid`    | –         |

```html
<div id="app">
    <ads-banner-injector
        zone-id="homepage-hero"
        :client-id="clientId"
        fallback-image="/fallback-banner.jpg"
        fallback-link="/promo"
    ></ads-banner-injector>

    <ads-inline-injector
        zone-id="article-inline"
        :client-id="clientId"
        fallback-image="/fallback-inline.jpg"
        fallback-link="/promo"
    ></ads-inline-injector>

    <ads-bento-injector
        zone-id="homepage-bento"
        :client-id="clientId"
        :columns="3"
        gap="12px"
        :fallback-items="bentoDemoItems"
    ></ads-bento-injector>
</div>

<script src="https://cdn.jsdelivr.net/npm/vue@2/dist/vue.js"></script>
<script src="https://cdn.com7.in/ads-widget/com7-ads-inject-widget-v1.0.0.js"></script>
```

> ดู implementation เต็มของ component ทั้ง 3 ได้ใน `playground/vue2-cdn.html`

**Error handling ใน Vue component:**
- `impression` → `showFallback = false` (ซ่อน fallback, แสดง ad)
- `error` + มี `fallbackImage` → `showFallback` ยังเป็น `true` (fallback อยู่)
- `error` + ไม่มี `fallbackImage` → `this.$el.style.display = 'none'` (ซ่อน component ทั้งหมด)

### Vue 3 (CDN)

```html
<div id="ad-top">
    <div data-fallback>...</div>
    <div data-target></div>
</div>

<script src="https://cdn.jsdelivr.net/npm/vue@3/dist/vue.global.js"></script>
<script src="https://cdn.com7.in/ads-widget/com7-ads-inject-widget-v1.0.0.js"></script>
<script>
    const A = AdsInjector?.default || AdsInjector

    function mountAd(containerId, zoneId, label) {
        const container  = document.getElementById(containerId)
        const fallbackEl = container.querySelector('[data-fallback]')
        const targetEl   = container.querySelector('[data-target]')

        A.inject(targetEl, {
            baseUrl: 'https://api.com7.in',
            clientId: 'shop-001',
            zoneId,
            onEvent(e) {
                if (e.type === 'impression') fallbackEl?.remove()
                if (e.type === 'error' && !fallbackEl?.children.length) {
                    container.closest('.ad-zone').style.display = 'none'
                }
                console.log('[' + label + ']', e)
            },
        })
    }

    mountAd('ad-top', 'homepage-hero', 'Ad Top')
</script>
```

> ไม่ต้องใช้ `createApp` — widget inject ผ่าน vanilla DOM, Vue ไม่ได้ถูกใช้งานจริงในกรณีนี้

### Vue 3 (ES Module)

> ⚠️ dist เป็น **IIFE** ไม่ใช่ ESM — `import AdsInjector from '...'` จะ error
> ให้โหลดผ่าน `<script src>` แล้วอ่าน `window.AdsInjector` ใน module แทน

```html
<!-- โหลด IIFE ก่อน module script -->
<script src="https://cdn.com7.in/ads-widget/com7-ads-inject-widget-v1.0.0.js"></script>

<script type="module">
    const AdsInjector = window.AdsInjector?.default || window.AdsInjector

    AdsInjector.inject(document.querySelector('#ad-top [data-target]'), {
        baseUrl: 'https://api.com7.in',
        clientId: 'shop-001',
        zoneId: 'homepage-hero',
        onEvent: (e) => console.log('[Ad]', e),
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

### `GET /ads/v1/zones/homepage-bento/config`

Response เป็น array ของ `BentoItem`:

```json
{
    "items": [
        {
            "id": "bento-hero-001",
            "type": "hero",
            "title": "Summer Sale 2026",
            "description": "ลดสูงสุด 50% สินค้า IT ทุกหมวด",
            "image_url": "https://placehold.co/960x300/1a1a2e/ffffff?text=HERO",
            "cta_label": "ช้อปเลย",
            "cta_url": "https://example.com/summer-sale",
            "tags": ["hot", "sale"]
        },
        {
            "id": "bento-wide-001",
            "type": "wide",
            "title": "MacBook Pro M4",
            "description": "ผ่อน 0% นาน 10 เดือน",
            "image_url": "https://placehold.co/640x140/0d1117/ffffff?text=WIDE",
            "cta_label": "ดูโปรโมชัน",
            "cta_url": "https://example.com/macbook",
            "tags": ["new"]
        },
        {
            "id": "bento-small-001",
            "type": "small",
            "title": "AirPods Pro",
            "description": null,
            "image_url": "https://placehold.co/320x140/1a0a2e/ffffff?text=SMALL",
            "cta_label": "ดูสินค้า",
            "cta_url": "https://example.com/airpods",
            "tags": ["promo"]
        }
    ]
}
```

**BentoItem types และ grid span:**

| type    | grid-column | grid-row | ใช้เมื่อ              |
| ------- | ----------- | -------- | --------------------- |
| `hero`  | span 3      | –        | featured / main story |
| `wide`  | span 2      | –        | secondary feature     |
| `tall`  | –           | span 2   | portrait product      |
| `small` | span 1      | –        | product card          |

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

## CSS Variables

Override ได้ผ่าน `:root` ของ project ที่นำ widget ไปใช้:

```css
:root {
    /* Grid */
    --ads-bento-grid-gap: 12px;      /* gap ระหว่าง bento card */

    /* Card */
    --ads-bento-bg: #1c1c1e;
    --ads-bento-radius: 8px;

    /* Min-heights ตาม type */
    --ads-bento-height-hero: 300px;
    --ads-bento-height-tall: 280px;
    --ads-bento-height-wide: 140px;
    --ads-bento-height-small: 140px;

    /* CTA button */
    --ads-bento-cta-bg: #fff;
    --ads-bento-cta-color: #000;
    --ads-bento-cta-radius: 20px;
}
```

> ดู variable ทั้งหมดได้ใน `src/assets/main.css` → section `:root`

---

## Project Structure

```
src/
├── AdsInjector.vue        # Orchestrator — fetch config, schedule, render
├── entry.js               # CDN entry — exposes window.AdsInjector
├── components/
│   ├── AdBanner.vue       # Banner ad component
│   ├── AdBento.vue        # Bento card component (single card)
│   └── AdBentoGrid.vue    # Bento grid container (รับ BentoItem[] จาก API)
├── composibles/           # useConsent, useAdsContext, useAdsViewability, ...
├── types/ads.ts           # Type definitions (IAdsConfig, IAdsSlot, BentoItem, IAdsEvent)
└── assets/main.css        # Base styles + CSS variables (--ads-bento-*, --ads-*)

playground/                # Local test pages — ดู section Testing
├── index.html             # Plain HTML
├── vue2-cdn.html          # Vue 2 CDN (ads-banner/inline/bento-injector components)
├── vue3-cdn.html          # Vue 3 CDN (vanilla DOM + mountAd helper)
├── vue3-module.html       # Vue 3 — dist โหลดผ่าน script src (IIFE ไม่ใช่ ESM)
└── env.js                 # Local config (gitignored — copy จาก env.example.js)

docs/                      # API spec + GTM container export
dist/                      # Build output (gitignored)
```
