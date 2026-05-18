export type AdType = 'banner' | 'inline' | 'bento'
export type AdPosition = 'top' | 'bottom' | 'before' | 'after' | 'replace'

// ── Bento ─────────────────────────────────────────────────────────────────────
export type BentoItemType = 'hero' | 'wide' | 'tall' | 'small'

/** Item แต่ละชิ้นที่ API /zones/bento/config ส่งมาเป็น array */
export interface BentoItem {
    id: string
    type: BentoItemType
    title: string | null
    description: string | null
    image_url: string | null
    cta_label: string | null
    cta_url: string | null
    tags: string[]
}
export type AdTrigger = 'immediate' | 'scroll' | 'exit_intent' | 'time_delay'

/**
 * Event types ทั้งหมดที่ widget จะ emit
 *
 * impression       — ad render ลง DOM แล้ว (อาจยังไม่เห็นใน viewport)
 * view             — user เห็น ad จริงใน viewport ≥ 50% นาน ≥ 1 วินาที (IAB standard)
 * click            — user คลิก ad
 * close            — user ปิด ad
 * hover            — user hover บน ad นาน ≥ 500ms (intent signal)
 * view_duration    — fire ตอน close/unmount บอกว่า ad แสดงรวมนานแค่ไหน
 * conversion       — host project ยิงเองเมื่อ user ทำ action สำเร็จ (ซื้อ, สมัคร ฯลฯ)
 * frequency_capped — ad ถูก suppress เพราะถึง frequency cap แล้ว
 * error            — เกิด error ขณะโหลดหรือ render
 */
export type AdEventType =
    | 'impression'
    | 'view'
    | 'click'
    | 'close'
    | 'hover'
    | 'view_duration'
    | 'conversion'
    | 'frequency_capped'
    | 'error'

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
    // ── Campaign attribution ─────────────────────────────────────────────────
    campaignId?: string // ผูก campaign ใน Marketing tools
    variantId?: string // A/B test variant
    utmSource?: string // ถ้า ad link ออก external
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

/** Structured meta ที่ widget แนบอัตโนมัติทุก event */
export interface IAdsEventMeta {
    // ── Page context ──────────────────────────────────────────────────────────
    pageUrl?: string // window.location.href ตอน event เกิด
    sessionId?: string // random UUID ต่อ browser session (sessionStorage)
    // ── Ad context ───────────────────────────────────────────────────────────
    trigger?: AdTrigger // trigger ที่ทำให้ ad แสดง
    adType?: AdType // ประเภท ad component
    campaignId?: string
    variantId?: string
    utmSource?: string
    // ── Behavioral ───────────────────────────────────────────────────────────
    scrollDepthPct?: number // 0-100 — scroll depth ตอน event เกิด
    viewportWidth?: number // px — ใช้แยก mobile/desktop behavior
    timeOnPageMs?: number // ms — อยู่บนหน้านานแค่ไหนก่อน event นี้
    // ── view_duration specific ────────────────────────────────────────────────
    visibleDurationMs?: number // ms — ad แสดงอยู่นานแค่ไหนก่อน close/unmount
    // ── error specific ────────────────────────────────────────────────────────
    errorMessage?: string
    // ── freeform ─────────────────────────────────────────────────────────────
    [key: string]: any
}

export interface IAdsEvent {
    type: AdEventType
    slotId: string
    zoneId: string
    timestamp: number
    meta?: IAdsEventMeta
}
