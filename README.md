# com7-ads-inject-widget

CDN Widget สำหรับ inject Ads / Content ลงในเว็บไซต์ รองรับทั้ง Vue 2, Vue 3 และ Plain HTML

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

---

## Build

```bash
bun run build
```

Output จะอยู่ที่ `dist/` ประกอบด้วย:
- `dist/com7-ads-inject-widget-v{version}.js`
- `dist/com7-ads-inject-widget-v{version}.css`

---

## Testing (Local Playground)

### 1. Build ก่อน (ถ้ายังไม่ได้ build)

```bash
bun run build
```

### 2. รัน Preview Server

```bash
bun run preview
```

Server จะรันที่ **http://localhost:4000**

### 3. เปิด Playground

| URL | คำอธิบาย |
|---|---|
| http://localhost:4000/playground/mock.html | ✅ **แนะนำ** — ทดสอบได้เลย ไม่ต้องพึ่ง API จริง |
| http://localhost:4000/playground/index.html | Plain HTML + API จริง |
| http://localhost:4000/playground/vue2-cdn.html | Vue 2 CDN wrapper |
| http://localhost:4000/playground/vue3-cdn.html | Vue 3 CDN |
| http://localhost:4000/playground/vue3-module.html | Vue 3 ES Module |

### Mock Playground (`mock.html`)

หน้านี้ใช้ XHR interceptor แทน API จริง แสดง Ad ทุก type พร้อมกัน:

| เวลา | Ad ที่แสดง |
|---|---|
| ทันที | Sticky Bar ด้านบน + Banner หลัง element เป้าหมาย |
| 2 วินาที | Popup interstitial |
| 3 วินาที | Floating widget มุมขวาล่าง |
| Scroll 30% | Inline ad |

ด้านล่างของหน้ามี **Event Log** แสดง `impression / click / close` แบบ real-time

**ปุ่มที่มีให้กด:**
- 🔄 **Reload Page** — เริ่มทดสอบใหม่
- 🗑 **Clear Frequency Cap** — ล้าง localStorage เพื่อให้ Popup แสดงซ้ำได้
- 🧹 **Clear Log** — ล้าง event log

---

## Usage (CDN)

### Plain HTML

```html
<link rel="stylesheet" href="https://cdn.com7.in/ads-widget/com7-ads-inject-widget-v1.0.0.css" />

<div id="ads-mount"></div>

<script src="https://cdn.com7.in/ads-widget/com7-ads-inject-widget-v1.0.0.js"></script>
<script>
  AdsInjector.inject('#ads-mount', {
    baseUrl:  'https://api.com7.in',
    clientId: 'shop-001',
    zoneId:   'homepage-hero',
    onEvent:  (e) => console.log('[Ad Event]', e),
  })
</script>
```

### Vue 2

```js
Vue.component('ads-injector', {
  props: ['zoneId', 'clientId'],
  template: '<div ref="ads"></div>',
  mounted() {
    const A = AdsInjector?.default || AdsInjector
    A.inject(this.$refs.ads, {
      baseUrl:  'https://api.com7.in',
      clientId: this.clientId,
      zoneId:   this.zoneId,
    })
  },
})
```

### Vue 3

```js
import AdsInjector from 'https://cdn.com7.in/ads-widget/com7-ads-inject-widget-v1.0.0.js'

AdsInjector.inject('#ads-mount', {
  baseUrl:  'https://api.com7.in',
  clientId: 'shop-001',
  zoneId:   'homepage-hero',
})
```

---

## Deploy

Branch → Environment mapping:

| Branch | Environment | Trigger |
|---|---|---|
| `develop` | STG | Auto (push) |
| `main` | PROD | Manual |

Pipeline: **Bitbucket Pipelines** → Build → S3 → Purge CloudFront + Cloudflare cache
