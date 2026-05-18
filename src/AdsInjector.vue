<script setup lang="ts">
import { onMounted, createApp, h } from 'vue'
import type { IAdsSlot } from '@/types/ads'
import AdBanner from '@/components/AdBanner.vue'
import AdPopup from '@/components/AdPopup.vue'
import AdInline from '@/components/AdInline.vue'
import AdStickyBar from '@/components/AdStickyBar.vue'
import AdFloating from '@/components/AdFloating.vue'

const props = defineProps({
    baseUrl: { type: String, default: '' },
    clientId: { type: String, default: '' },
    zoneId: { type: String, default: '' },
    onEvent: { type: Function, default: null },
})

const { fetchConfig, trackEvent } = useAdsApi({
    baseUrl: props.baseUrl,
    clientId: props.clientId,
    zoneId: props.zoneId,
})
const { schedule, checkFrequencyCap } = useAdsScheduler()
const { emit: emitEvent } = useAdsEvents(props.zoneId, (e) => {
    trackEvent(e)
    props.onEvent?.(e)
})
const { injectBefore, injectAfter, injectReplace, injectTop, injectBottom } = useAdsTarget()

const componentMap: Record<string, any> = {
    banner: AdBanner,
    popup: AdPopup,
    inline: AdInline,
    sticky_bar: AdStickyBar,
    floating: AdFloating,
}

onMounted(async () => {
    try {
        const config = await fetchConfig()
        config.slots.forEach((slot: IAdsSlot) => {
            schedule(slot, () => {
                // ตรวจสอบ frequency cap ก่อนแสดง
                if (slot.frequencyCap && !checkFrequencyCap(slot.slotId, slot.frequencyCap)) {
                    return
                }
                emitEvent('impression', slot.slotId)
                renderSlot(slot)
            })
        })
    } catch (err) {
        console.error('[AdsInjector] Failed to load ads config:', err)
    }
})

function renderSlot(slot: IAdsSlot) {
    const Component = componentMap[slot.type]
    if (!Component) {
        console.warn('[AdsInjector] Unknown ad type:', slot.type)
        return
    }

    const container = document.createElement('div')
    container.setAttribute('data-ads-slot', slot.slotId)

    const app = createApp({
        render: () =>
            h(Component, {
                ...slot.content,
                slotId: slot.slotId,
                position: slot.position,
                onClick: () => emitEvent('click', slot.slotId),
                onClose: () => {
                    emitEvent('close', slot.slotId)
                    app.unmount()
                    container.remove()
                },
            }),
    })
    app.mount(container)

    // Inject ลง DOM ตาม position
    switch (slot.position) {
        case 'before':
            if (slot.targetSelector) injectBefore(slot.targetSelector, container)
            break
        case 'after':
            if (slot.targetSelector) injectAfter(slot.targetSelector, container)
            break
        case 'replace':
            if (slot.targetSelector) injectReplace(slot.targetSelector, container)
            break
        case 'top':
            injectTop(slot.targetSelector ?? 'body', container)
            break
        case 'bottom':
        default:
            injectBottom(slot.targetSelector ?? 'body', container)
            break
    }
}
</script>

<template>
    <div class="com7-ads-injector">
        <!-- slots render ผ่าน JavaScript DOM injection, ไม่ใช่ template -->
    </div>
</template>

<style>
:root {
    --ads-z-index: 9990;
    --ads-popup-overlay: rgba(0, 0, 0, 0.5);
    --ads-sticky-height: 60px;
    --ads-floating-bottom: 80px;
    --ads-floating-right: 20px;
    --ads-border-radius: 8px;
    --ads-animation-duration: 0.3s;
}
</style>
