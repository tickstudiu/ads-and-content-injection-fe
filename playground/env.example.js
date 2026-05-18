/**
 * Playground Config — env.example.js
 * ══════════════════════════════════════════════════════════════
 * 1. Copy ไฟล์นี้เป็น  playground/env.js
 * 2. แก้ค่าตาม environment ของตัวเอง
 * 3. ไฟล์ env.js ถูก gitignore แล้ว — ห้าม commit ค่าจริง
 *
 * ไฟล์นี้จะถูกโหลดก่อน GTM และ widget scripts ทุกตัวใน playground
 * ══════════════════════════════════════════════════════════════
 */
window.PLAYGROUND_CONFIG = {
    /**
     * Base URL ของ Backend Ads API (ไม่มี trailing slash)
     *
     * แนะนำสำหรับ local test:
     *   - ใช้ Beeceptor / mockapi.io ฯลฯ → ตั้ง rule ตอบ
     *       GET  /ads/v1/zones/{zoneId}/config  → 200 + IAdsConfig
     *       POST /ads/v1/events                 → 204
     *
     * ตัวอย่างที่ใช้อยู่:
     *   'https://ads-n-content.free.beeceptor.com'
     *
     * ดู mock data ตัวอย่างได้ใน docs/ หรือ test ด้วย zone:
     *   - homepage-hero
     *   - article-inline
     *   - product-list-bento
     */
    baseUrl: 'https://ads-n-content.free.beeceptor.com',

    /**
     * Client ID ที่ widget ส่งไปใน query string ?client_id=...
     * backend ใช้ตรวจสิทธิ์ว่า client นี้มีสิทธิ์ดู zone นั้นหรือไม่
     */
    clientId: 'demo-client',

    /**
     * GTM Container ID — ดูจาก GTM console
     * ใส่ 'GTM-XXXXXXX' เพื่อ disable GTM
     */
    gtmContainerId: 'GTM-XXXXXXX',

    /**
     * Consent default เมื่อเปิด playground ครั้งแรก
     * 'denied'  → ต้องกด Accept ก่อน tracking จะทำงาน (พฤติกรรมจริง)
     * 'granted' → bypass consent banner (สะดวกตอน dev test tracking โดยตรง)
     */
    consentDefault: 'denied',

    /**
     * CDN prefix สำหรับรูป ad ใน mock data
     * เปลี่ยนเป็น CDN จริงถ้าต้องการทดสอบรูปจริง
     */
    imageCdn: 'https://placehold.co',

    /**
     * Reserved flag — สำหรับสลับ mock vs production API ในอนาคต
     * ปัจจุบัน widget ยิง API ตาม baseUrl โดยตรง
     */
    useMockApi: false,
}
