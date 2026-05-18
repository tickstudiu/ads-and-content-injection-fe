import type { IAdsEvent } from '@/types/ads'

export function useAdsEvents(zoneId: string, trackFn: (e: IAdsEvent) => void) {
    function emit(type: IAdsEvent['type'], slotId: string, meta?: Record<string, any>) {
        const event: IAdsEvent = {
            type,
            slotId,
            zoneId,
            timestamp: Date.now(),
            meta,
        }
        trackFn(event)
    }

    return { emit }
}
