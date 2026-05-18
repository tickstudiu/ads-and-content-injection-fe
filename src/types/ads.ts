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
