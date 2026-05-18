import type { IAdsEventMeta } from '@/types/ads'

/** จับเวลา page load ครั้งแรกที่ module ถูก import */
const PAGE_LOAD_TIME = Date.now()

/**
 * sessionId — UUID ต่อ browser session
 * ใช้ sessionStorage เพื่อให้ reset ทุกครั้งที่เปิด tab ใหม่
 * ถ้า ad_storage denied → sessionStorage ยังใช้ได้ เพราะไม่ persistent ข้าม session
 */
function getSessionId(): string {
    const KEY = 'ads_session_id'
    let id = sessionStorage.getItem(KEY)
    if (!id) {
        id = crypto.randomUUID()
        sessionStorage.setItem(KEY, id)
    }
    return id
}

function getScrollDepthPct(): number {
    const scrollable = document.body.scrollHeight - window.innerHeight
    if (scrollable <= 0) return 100
    return Math.min(100, Math.round((window.scrollY / scrollable) * 100))
}

/**
 * useAdsContext
 *
 * สร้าง meta context ที่จะแนบไปกับทุก event อัตโนมัติ
 *
 * Usage:
 *   const { buildMeta } = useAdsContext()
 *   emitEvent('impression', slotId, buildMeta({ trigger: slot.trigger, adType: slot.type }))
 */
export function useAdsContext() {
    /**
     * สร้าง base meta จาก browser context ณ เวลาที่เรียก
     * merge กับ overrides ที่ส่งเข้ามา (campaign, trigger, adType ฯลฯ)
     */
    function buildMeta(overrides: Partial<IAdsEventMeta> = {}): IAdsEventMeta {
        return {
            pageUrl: window.location.href,
            sessionId: getSessionId(),
            scrollDepthPct: getScrollDepthPct(),
            viewportWidth: window.innerWidth,
            timeOnPageMs: Date.now() - PAGE_LOAD_TIME,
            ...overrides,
        }
    }

    return { buildMeta }
}
