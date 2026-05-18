import { ref } from 'vue'
import axios from 'axios'
import type { IAdsConfig, IAdsEvent } from '@/types/ads'

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
        config.value = res.data
        return res.data
    }

    async function trackEvent(event: IAdsEvent) {
        await axios.post(`${baseUrl}/ads/v1/events`, event)
    }

    return { config, fetchConfig, trackEvent }
}
