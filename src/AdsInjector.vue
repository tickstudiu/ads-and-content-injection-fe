<script setup lang="ts">
import { onMounted, onUnmounted, createApp, h } from 'vue'
import type { IAdsSlot } from '@/types/ads'
import AdBanner from '@/components/AdBanner.vue'
import { useConsent } from '@/composibles/useConsent'
import { useAdsContext } from '@/composibles/useAdsContext'
import { useAdsViewability } from '@/composibles/useAdsViewability'

const props = defineProps({
    baseUrl: { type: String, default: '' },
    clientId: { type: String, default: '' },
    zoneId: { type: String, default: '' },
    onEvent: { type: Function, default: null },
})

// ── Consent (Google Consent Mode v2) ─────────────────────────────────────────
const { canTrack, canUseStorage } = useConsent()

// ── Context builder — แนบ meta ทุก event อัตโนมัติ ──────────────────────────
const { buildMeta } = useAdsContext()

// ── API ───────────────────────────────────────────────────────────────────────
const { fetchConfig, trackEvent } = useAdsApi({
    baseUrl: props.baseUrl,
    clientId: props.clientId,
    zoneId: props.zoneId,
})

// ── Scheduler & Frequency Cap ─────────────────────────────────────────────────
const { schedule, checkFrequencyCap } = useAdsScheduler({ canUseStorage })

// ── Events ────────────────────────────────────────────────────────────────────
const { emit: emitEvent } = useAdsEvents(props.zoneId, (e) => {
    if (canTrack()) trackEvent(e)
    props.onEvent?.(e)
})

// ── Viewability (IAB standard: ≥ 50% visible ≥ 1 วินาที) ────────────────────
const {
    observe: observeViewability,
    unobserve: unobserveViewability,
    disconnectAll,
} = useAdsViewability((slotId) => {
    // หา slot จาก slotId เพื่อแนบ campaign meta
    const slot = slotRegistry.get(slotId)
    emitEvent(
        'view',
        slotId,
        buildMeta({
            adType: slot?.type,
            trigger: slot?.trigger,
            campaignId: slot?.campaignId,
            variantId: slot?.variantId,
            utmSource: slot?.utmSource,
        })
    )
})

// registry เก็บ slot config ไว้ lookup ใน viewability callback
const slotRegistry = new Map<string, IAdsSlot>()

const componentMap: Record<string, any> = {
    banner: AdBanner,
}

onMounted(async () => {
    try {
        const config = await fetchConfig()
        config.slots.forEach((slot: IAdsSlot) => {
            slotRegistry.set(slot.slotId, slot)
            schedule(slot, () => {
                // ── Frequency Cap ─────────────────────────────────────────────
                if (slot.frequencyCap && !checkFrequencyCap(slot.slotId, slot.frequencyCap)) {
                    emitEvent(
                        'frequency_capped',
                        slot.slotId,
                        buildMeta({
                            adType: slot.type,
                            trigger: slot.trigger,
                            campaignId: slot.campaignId,
                            variantId: slot.variantId,
                        })
                    )
                    return
                }

                // ── Impression ────────────────────────────────────────────────
                emitEvent(
                    'impression',
                    slot.slotId,
                    buildMeta({
                        adType: slot.type,
                        trigger: slot.trigger,
                        campaignId: slot.campaignId,
                        variantId: slot.variantId,
                        utmSource: slot.utmSource,
                    })
                )

                renderSlot(slot)
            })
        })
    } catch (err) {
        console.error('[AdsInjector] Failed to load ads config:', err)
    }
})

onUnmounted(() => {
    disconnectAll()
    slotRegistry.clear()
})

function renderSlot(slot: IAdsSlot) {
    const Component = componentMap[slot.type]
    if (!Component) {
        console.warn('[AdsInjector] Unknown ad type:', slot.type)
        return
    }

    const container = document.createElement('div')
    container.setAttribute('data-ads-slot', slot.slotId)

    // ── Campaign meta ที่แนบทุก event ของ slot นี้ ────────────────────────────
    const slotMeta = () =>
        buildMeta({
            adType: slot.type,
            trigger: slot.trigger,
            campaignId: slot.campaignId,
            variantId: slot.variantId,
            utmSource: slot.utmSource,
        })

    // ── Impression timestamp สำหรับ view_duration ─────────────────────────────
    const impressionAt = Date.now()

    const app = createApp({
        render: () =>
            h(Component, {
                ...slot.content,
                slotId: slot.slotId,
                position: slot.position,
                onClick: () => emitEvent('click', slot.slotId, slotMeta()),
                onClose: () => {
                    // ── view_duration: บอกว่า ad แสดงรวมนานแค่ไหน ──────────
                    emitEvent('close', slot.slotId, slotMeta())
                    emitEvent('view_duration', slot.slotId, {
                        ...slotMeta(),
                        visibleDurationMs: Date.now() - impressionAt,
                    })
                    unobserveViewability(slot.slotId)
                    app.unmount()
                    container.remove()
                },
            }),
    })
    app.mount(container)

    // ── Inject ลง DOM ตาม position ───────────────────────────────────────────
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

    // ── Hover tracking: fire เมื่อ hover ≥ 500ms ──────────────────────────────
    let hoverTimer: ReturnType<typeof setTimeout> | null = null
    let hoverFired = false

    container.addEventListener('mouseenter', () => {
        if (hoverFired) return
        hoverTimer = setTimeout(() => {
            hoverFired = true
            emitEvent('hover', slot.slotId, slotMeta())
        }, 500)
    })
    container.addEventListener('mouseleave', () => {
        if (hoverTimer) {
            clearTimeout(hoverTimer)
            hoverTimer = null
        }
    })

    // ── Viewability: เริ่ม observe หลัง inject เข้า DOM แล้ว ─────────────────
    // requestAnimationFrame เพื่อให้ browser paint ก่อน ค่อย observe
    requestAnimationFrame(() => {
        observeViewability(slot.slotId, container)
    })
}

const { injectBefore, injectAfter, injectReplace, injectTop, injectBottom } = useAdsTarget()
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
