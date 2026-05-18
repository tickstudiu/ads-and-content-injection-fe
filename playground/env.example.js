/**
 * Playground Config — env.example.js
 * ══════════════════════════════════════════════════════════════
 * 1. Copy ไฟล์นี้เป็น  playground/env.js
 * 2. แก้ค่าตาม environment ของตัวเอง
 * 3. ไฟล์ env.js ถูก gitignore แล้ว — ห้าม commit ค่าจริง
 *
 * ไฟล์นี้จะถูกโหลดก่อน GTM และ widget scripts ทุกตัวใน mock.html
 * ══════════════════════════════════════════════════════════════
 */
window.PLAYGROUND_CONFIG = {
    /**
     * Base URL ของ Backend Ads API (ไม่มี trailing slash)
     * - ใช้ 'https://api-mock.local'  → XHR interceptor รับแทน (ไม่ต้องมี backend)
     * - เปลี่ยนเป็น URL จริง          → ยิง API จริง (ต้องมี CORS)
     */
    baseUrl: 'https://api-mock.local',

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
     * true  → ใช้ XHR interceptor แทน API จริง
     * false → ยิง VITE_PLAYGROUND_BASE_URL จริง (ต้อง backend พร้อม)
     */
    useMockApi: true,
}
