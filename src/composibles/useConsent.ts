import { ref, readonly } from 'vue'

export type ConsentValue = 'granted' | 'denied'

export interface ConsentState {
    ad_storage: ConsentValue
    ad_user_data: ConsentValue
    ad_personalization: ConsentValue
    analytics_storage: ConsentValue
}

const DEFAULT_CONSENT: ConsentState = {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
}

/**
 * useConsent
 *
 * อ่าน Google Consent Mode v2 จาก window.dataLayer แล้ว map ไปเป็น
 * consent signals ที่ widget ใช้ gate พฤติกรรมต่างๆ
 *
 * Consent signal → widget behavior:
 *  - analytics_storage: granted  → ส่ง tracking events ขึ้น API ได้
 *  - ad_storage: granted         → เขียน/อ่าน localStorage (frequency cap) ได้
 *  - ad_user_data: granted       → แนบ user context ใน event meta ได้
 *  - ad_personalization: granted → แสดง personalized/targeted ads ได้
 *
 * Usage:
 *   const { consent, canTrack, canUseStorage } = useConsent()
 */
export function useConsent() {
    const consent = ref<ConsentState>({ ...DEFAULT_CONSENT })

    // ── 1. Parse dataLayer ที่มีอยู่แล้ว ──────────────────────────────────
    function parseExistingDataLayer() {
        const dl: any[] = (window as any).dataLayer ?? []
        for (const entry of dl) {
            if (Array.isArray(entry) && entry[0] === 'consent') {
                applyConsentCommand(entry[1], entry[2])
            }
        }
    }

    // ── 2. Apply consent command ('default' หรือ 'update') ────────────────
    function applyConsentCommand(command: string, params: Partial<ConsentState>) {
        if (command !== 'default' && command !== 'update') return
        const next = { ...consent.value }
        for (const key of Object.keys(params) as (keyof ConsentState)[]) {
            if (key in DEFAULT_CONSENT && (params[key] === 'granted' || params[key] === 'denied')) {
                next[key] = params[key]!
            }
        }
        consent.value = next
    }

    // ── 3. Intercept dataLayer.push เพื่อรับ update แบบ real-time ─────────
    function watchDataLayer() {
        const dl = ((window as any).dataLayer = (window as any).dataLayer ?? [])
        const originalPush = dl.push.bind(dl)

        dl.push = (...args: any[]) => {
            const result = originalPush(...args)
            for (const entry of args) {
                if (Array.isArray(entry) && entry[0] === 'consent') {
                    applyConsentCommand(entry[1], entry[2])
                }
            }
            return result
        }
    }

    // ── init ──────────────────────────────────────────────────────────────
    parseExistingDataLayer()
    watchDataLayer()

    // ── Derived helpers ───────────────────────────────────────────────────

    /** ส่ง event tracking ขึ้น API ได้ไหม */
    function canTrack() {
        return consent.value.analytics_storage === 'granted'
    }

    /** เขียน/อ่าน localStorage (frequency cap) ได้ไหม */
    function canUseStorage() {
        return consent.value.ad_storage === 'granted'
    }

    /** แนบ user context ใน event meta ได้ไหม */
    function canSendUserData() {
        return consent.value.ad_user_data === 'granted'
    }

    /** แสดง personalized ad ได้ไหม */
    function canPersonalize() {
        return consent.value.ad_personalization === 'granted'
    }

    return {
        consent: readonly(consent),
        canTrack,
        canUseStorage,
        canSendUserData,
        canPersonalize,
    }
}
