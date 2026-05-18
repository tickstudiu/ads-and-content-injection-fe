import { onUnmounted } from 'vue'
import type { IAdsSlot, IFrequencyCap } from '@/types/ads'

export interface UseAdsSchedulerOptions {
    /** ถ้า false → ข้าม localStorage ทั้งหมด (ad_storage: denied) */
    canUseStorage?: () => boolean
}

export function useAdsScheduler({ canUseStorage = () => true }: UseAdsSchedulerOptions = {}) {
    const timers: ReturnType<typeof setTimeout>[] = []
    const scrollHandlers: (() => void)[] = []

    function schedule(slot: IAdsSlot, callback: () => void) {
        if (slot.trigger === 'immediate') {
            callback()
        } else if (slot.trigger === 'time_delay') {
            const t = setTimeout(callback, slot.triggerDelay ?? 3000)
            timers.push(t)
        } else if (slot.trigger === 'scroll') {
            const pct = slot.triggerScrollPct ?? 50
            const handler = () => {
                const scrolled =
                    (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
                if (scrolled >= pct) {
                    callback()
                    window.removeEventListener('scroll', handler)
                }
            }
            window.addEventListener('scroll', handler, { passive: true })
            scrollHandlers.push(handler)
        } else if (slot.trigger === 'exit_intent') {
            const handler = (e: MouseEvent) => {
                if (e.clientY <= 0) {
                    callback()
                    document.removeEventListener('mouseleave', handler)
                }
            }
            document.addEventListener('mouseleave', handler)
        }
    }

    function checkFrequencyCap(slotId: string, cap: IFrequencyCap): boolean {
        // ถ้า ad_storage denied → ข้าม frequency cap (แสดงได้เสมอ แต่ไม่จำ)
        if (!canUseStorage()) return true

        const key = `ads_fc_${slotId}`
        const raw = localStorage.getItem(key)
        const record = raw ? JSON.parse(raw) : { count: 0, resetAt: Date.now() + cap.periodMs }

        if (Date.now() > record.resetAt) {
            localStorage.setItem(
                key,
                JSON.stringify({ count: 1, resetAt: Date.now() + cap.periodMs })
            )
            return true // อนุญาตให้แสดง
        }

        if (record.count >= cap.maxShows) return false // ถึง cap แล้ว

        record.count++
        localStorage.setItem(key, JSON.stringify(record))
        return true
    }

    onUnmounted(() => {
        timers.forEach(clearTimeout)
        scrollHandlers.forEach((h) => window.removeEventListener('scroll', h))
    })

    return { schedule, checkFrequencyCap }
}
