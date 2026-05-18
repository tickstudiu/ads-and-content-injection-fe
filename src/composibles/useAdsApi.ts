import { ref } from 'vue'
import axios from 'axios'
import type { IAdsConfig, IAdsEvent, BentoItem } from '@/types/ads'

export interface UseAdsApiOptions {
    baseUrl?: string
    clientId?: string
    zoneId?: string
}

export function useAdsApi({ baseUrl = '', clientId = '', zoneId = '' }: UseAdsApiOptions = {}) {
    const config = ref<IAdsConfig | null>(null)

    async function fetchConfig(): Promise<IAdsConfig> {
        const res = await axios.get(`${baseUrl}/ads/v1/zones/${zoneId}/config`, {
            params: { client_id: clientId },
        })
        const data = res.data

        // bento zone ส่ง BentoItem[] มาโดยตรง — normalize ให้เข้ากับ slots format
        if (Array.isArray(data)) {
            return {
                zoneId,
                slots: [
                    {
                        slotId: `${zoneId}-grid`,
                        type: 'bento',
                        position: 'bottom',
                        trigger: 'immediate',
                        content: { items: data as BentoItem[] },
                    },
                ],
            } as IAdsConfig
        }

        config.value = data
        return data
    }

    async function trackEvent(event: IAdsEvent) {
        await axios.post(`${baseUrl}/ads/v1/events`, event)
    }

    return { config, fetchConfig, trackEvent }
}
