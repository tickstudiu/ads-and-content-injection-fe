# Ads Injection — Backend API Spec

> Version: 2.0  
> Updated: 2026-05-18  
> Status: Draft — รอ backend team review

---

## Overview

Widget ฝั่ง frontend (`com7-ads-inject-widget`) ติดต่อ backend ผ่าน 2 endpoints:

| Endpoint | Method | ใช้ทำอะไร |
|---|---|---|
| `/ads/v1/zones/:zoneId/config` | GET | โหลด slot config ก่อนแสดง ad |
| `/ads/v1/events` | POST | ส่ง tracking event จาก browser |

---

## 1. GET `/ads/v1/zones/:zoneId/config`

### Request

```
GET /ads/v1/zones/{zoneId}/config?client_id={clientId}
```

| Parameter | In | Type | Required | Description |
|---|---|---|---|---|
| `zoneId` | path | string | ✅ | ระบุตำแหน่งที่ฝัง widget เช่น `homepage-hero` |
| `client_id` | query | string | ✅ | Pseudonymous ID ของ host project เช่น `shop-001` |

### Response `200 OK`

```json
{
  "zoneId": "homepage-hero",
  "slots": [
    {
      "slotId": "slot-banner-001",
      "type": "banner",
      "position": "top",
      "trigger": "immediate",
      "triggerDelay": null,
      "triggerScrollPct": null,
      "targetSelector": null,
      "frequencyCap": {
        "maxShows": 3,
        "periodMs": 86400000
      },
      "campaignId": "camp-summer-2026",
      "variantId": "variant-a",
      "utmSource": "com7-ads",
      "content": {
        "imageUrl": "https://cdn.com7.in/ads/banner-001.jpg",
        "linkUrl": "https://www.com7.th/promotions/summer",
        "linkTarget": "_blank",
        "altText": "Summer Sale 2026",
        "html": null
      }
    }
  ]
}
```

### Field Descriptions — `IAdsSlot`

| Field | Type | Description |
|---|---|---|
| `slotId` | string | unique ID ของ slot นี้ |
| `type` | enum | `banner` \| `popup` \| `inline` \| `sticky_bar` \| `floating` |
| `position` | enum | `top` \| `bottom` \| `before` \| `after` \| `replace` |
| `trigger` | enum | `immediate` \| `scroll` \| `exit_intent` \| `time_delay` |
| `triggerDelay` | number \| null | ms — ใช้กับ `time_delay` |
| `triggerScrollPct` | number \| null | 0–100 — ใช้กับ `scroll` |
| `targetSelector` | string \| null | CSS selector สำหรับ `before` / `after` / `replace` |
| `frequencyCap.maxShows` | number | แสดงได้สูงสุดกี่ครั้งใน period |
| `frequencyCap.periodMs` | number | reset period เป็น ms (เช่น 86400000 = 1 วัน) |
| `campaignId` | string \| null | ผูก campaign ใน Marketing tools |
| `variantId` | string \| null | A/B test variant |
| `utmSource` | string \| null | UTM source สำหรับ link ออก external |
| `content.imageUrl` | string \| null | URL ของรูป ad |
| `content.linkUrl` | string \| null | URL ที่ user จะไปเมื่อคลิก |
| `content.linkTarget` | `_blank` \| `_self` \| null | เปิด link แบบไหน |
| `content.altText` | string \| null | alt text สำหรับ accessibility |
| `content.html` | string \| null | custom HTML content (ใช้แทน imageUrl ได้) |

### Error Responses

| Status | Code | Description |
|---|---|---|
| 404 | `ZONE_NOT_FOUND` | ไม่พบ zone นี้ในระบบ |
| 400 | `MISSING_CLIENT_ID` | ไม่ได้ส่ง `client_id` มา |
| 403 | `CLIENT_NOT_AUTHORIZED` | `client_id` นี้ไม่มีสิทธิ์ดู zone นี้ |

```json
{
  "error": "ZONE_NOT_FOUND",
  "message": "Zone 'homepage-hero' not found"
}
```

---

## 2. POST `/ads/v1/events`

รับ tracking event จาก widget — ทุก event type ใช้ endpoint เดียวกัน

### Request

```
POST /ads/v1/events
Content-Type: application/json
```

```json
{
  "type": "view",
  "slotId": "slot-banner-001",
  "zoneId": "homepage-hero",
  "timestamp": 1747584000000,
  "meta": {
    "pageUrl": "https://www.com7.th/",
    "sessionId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "trigger": "immediate",
    "adType": "banner",
    "campaignId": "camp-summer-2026",
    "variantId": "variant-a",
    "utmSource": "com7-ads",
    "scrollDepthPct": 12,
    "viewportWidth": 1440,
    "timeOnPageMs": 3200
  }
}
```

### Top-level Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `type` | enum | ✅ | ดูตาราง Event Types ด้านล่าง |
| `slotId` | string | ✅ | ID ของ slot ที่ event เกิด |
| `zoneId` | string | ✅ | zone ที่ slot นี้อยู่ |
| `timestamp` | number | ✅ | Unix timestamp (ms) ที่ event เกิดฝั่ง browser |
| `meta` | object | ❌ | Context เพิ่มเติม — ดู Meta Fields |

### Event Types

| Type | เมื่อไหร่ | ใครใช้ | meta พิเศษ |
|---|---|---|---|
| `impression` | ad render ลง DOM แล้ว (อาจยังไม่เห็นใน viewport) | Analytics | — |
| `view` | user เห็น ad จริง ≥ 50% ใน viewport นาน ≥ 1 วินาที (IAB standard) | **Marketing (metric หลัก)** | — |
| `click` | user คลิก ad | **Ecom, Marketing** | — |
| `close` | user ปิด ad | Analytics | — |
| `hover` | user hover บน ad นาน ≥ 500ms | Ecom (intent signal) | — |
| `view_duration` | fire พร้อม `close` — บอกว่า ad แสดงรวมนานแค่ไหน | Marketing (engagement) | `visibleDurationMs` |
| `conversion` | host project ยิงเองตอน user ทำ action สำเร็จ | **Ecom (attribution)** | `conversionType`, `orderId`, `revenue` |
| `frequency_capped` | ad ถูก suppress เพราะถึง frequency cap แล้ว | Analytics | — |
| `error` | เกิด error ขณะโหลดหรือ render | DevOps | `errorMessage` |

> **หมายเหตุ:** `impression` และ `view` จะ fire คู่กันเสมอ แต่ `view` อาจช้ากว่า `impression` 1–5 วินาทีขึ้นไป ขึ้นอยู่กับว่า user scroll มาถึง ad เมื่อไหร่

### Meta Fields

Meta ทุก field เป็น optional ทั้งหมด — backend ควร accept และเก็บ field ที่ไม่รู้จักไว้โดยไม่ error

#### Base Context (แนบทุก event อัตโนมัติ)

| Field | Type | Description |
|---|---|---|
| `pageUrl` | string | URL เต็มของหน้าที่ event เกิด |
| `sessionId` | string (UUID) | Browser session ID — reset ทุกครั้งที่เปิด tab ใหม่, ใช้ sessionStorage |
| `trigger` | string | trigger ของ slot (`immediate` / `scroll` / `time_delay` / `exit_intent`) |
| `adType` | string | ประเภท component (`banner` / `popup` / `inline` / `sticky_bar` / `floating`) |
| `campaignId` | string | campaign ที่ slot นี้สังกัด |
| `variantId` | string | A/B test variant |
| `utmSource` | string | UTM source |
| `scrollDepthPct` | number (0–100) | scroll depth ของ user ณ เวลาที่ event เกิด |
| `viewportWidth` | number (px) | ความกว้าง viewport — ใช้แยก mobile/desktop |
| `timeOnPageMs` | number (ms) | user อยู่บนหน้านานแค่ไหนก่อน event นี้ |

#### `view_duration` specific

| Field | Type | Description |
|---|---|---|
| `visibleDurationMs` | number (ms) | ระยะเวลาตั้งแต่ `impression` จนถึง `close` |

#### `conversion` specific

| Field | Type | Description |
|---|---|---|
| `conversionType` | string | เช่น `purchase`, `signup`, `add_to_cart` |
| `orderId` | string | Order ID ถ้ามี |
| `revenue` | number | มูลค่า conversion (THB) |
| `currency` | string | default `THB` |

#### `error` specific

| Field | Type | Description |
|---|---|---|
| `errorMessage` | string | error message |

### Response

```
202 Accepted
```

```json
{
  "received": true
}
```

> ใช้ `202 Accepted` แทน `200 OK` เพราะ backend อาจ queue event ไว้ process ทีหลัง ไม่ได้ save synchronous

### Error Responses

| Status | Code | Description |
|---|---|---|
| 400 | `INVALID_EVENT_TYPE` | `type` ที่ส่งมาไม่อยู่ใน enum ที่รองรับ |
| 400 | `MISSING_REQUIRED_FIELD` | ขาด `type`, `slotId`, `zoneId`, หรือ `timestamp` |
| 429 | `RATE_LIMITED` | ส่ง event เร็วเกินไป — ควร implement rate limit ต่อ IP |

```json
{
  "error": "INVALID_EVENT_TYPE",
  "message": "Event type 'unknown' is not supported"
}
```

---

## 3. Data Retention & PDPA

| ข้อมูล | Retention แนะนำ | เหตุผล |
|---|---|---|
| `sessionId` | 13 เดือน | ตาม GA standard (ปรับได้ตาม Privacy Notice) |
| `pageUrl` | 13 เดือน | behavioral data |
| `scrollDepthPct`, `viewportWidth`, `timeOnPageMs` | 13 เดือน | behavioral profiling |
| `conversion` events | ตลอดไป (anonymized) | financial reporting |
| `errorMessage` | 90 วัน | debugging เท่านั้น |

**ข้อสำคัญ:**
- `sessionId` เป็น pseudonymous — ไม่ใช่ user ID จริง, ไม่ควร join กับ PII ใน database เดียวกันโดยตรง
- ถ้า `client_id` เป็น user account ID → ถือเป็น Personal Data, ต้องระบุใน Privacy Notice ของ host project
- Event ที่ส่งมาขณะ consent denied จะถูก widget block ก่อนส่ง — backend ไม่ควรรับ event เหล่านี้ได้ตั้งแต่แรก แต่ควร validate ฝั่ง server ด้วยเพื่อ defense-in-depth

---

## 4. Batch Events (แนะนำ — future improvement)

ปัจจุบัน widget ส่ง event ทีละ 1 ครั้งต่อ HTTP request ถ้า traffic สูงอาจกระทบ performance — แนะนำให้เพิ่ม batch endpoint ในอนาคต:

```
POST /ads/v1/events/batch
Content-Type: application/json

{
  "events": [ { ...event1 }, { ...event2 } ]
}
```

Widget ฝั่ง frontend จะ buffer events และส่ง batch ตาม `visibilitychange` หรือ `beforeunload`

---

## 5. Event Flow ภาพรวม

```
user เปิดหน้า
    │
    ├── GET /config → โหลด slots
    │
    ├── [trigger fired]
    │       ├── frequency cap check (localStorage)
    │       │       └── cap เต็ม → POST impression=frequency_capped → จบ
    │       │
    │       └── POST impression  ← ad render ลง DOM
    │
    ├── [user scroll มาถึง ad, อยู่ใน viewport ≥ 1 วินาที]
    │       └── POST view  ← user เห็นจริง (IAB standard)
    │
    ├── [user hover ≥ 500ms]
    │       └── POST hover  ← intent signal
    │
    ├── [user คลิก]
    │       └── POST click
    │
    └── [user ปิด ad]
            ├── POST close
            └── POST view_duration  ← พร้อมกัน, มี visibleDurationMs
```

---

## Changelog

| Version | Date | เปลี่ยนอะไร |
|---|---|---|
| 2.0 | 2026-05-18 | เพิ่ม event types ใหม่ (`view`, `hover`, `view_duration`, `conversion`, `frequency_capped`), เพิ่ม `IAdsEventMeta` structured schema, เพิ่ม campaign fields ใน slot config |
| 1.0 | — | Initial spec (`impression`, `click`, `close`, `error` เท่านั้น) |
