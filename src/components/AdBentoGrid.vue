<script setup lang="ts">
import type { BentoItem } from '@/types/ads'
import AdBento from './AdBento.vue'

// ── Props & Emits ────────────────────────────────────────────────
const props = defineProps<{
    items: BentoItem[]
    slotId: string
    position?: string
}>()

const emit = defineEmits<{
    /** fire ทุกครั้งที่ user คลิก card หรือกด CTA — ส่ง BentoItem เพื่อ card-level tracking */
    (e: 'click', item: BentoItem): void
    (e: 'close'): void
}>()

// ── Handlers ─────────────────────────────────────────────────────
function onCardClick(item: BentoItem): void {
    emit('click', item)
}

function onCtaClick(item: BentoItem): void {
    emit('click', item)
}
</script>

<template>
    <div class="ad-bento-grid">
        <AdBento
            v-for="(item, i) in items"
            :key="item.id"
            :class="'ad-bento-grid__item--' + item.type"
            :type="item.type"
            :title="item.title ?? ''"
            :description="item.description ?? undefined"
            :image-url="item.image_url ?? undefined"
            :cta-label="item.cta_label ?? undefined"
            :cta-url="item.cta_url ?? undefined"
            :tags="item.tags"
            :index="i"
            @card-click="onCardClick(item)"
            @cta-click="onCtaClick(item)"
        />
    </div>
</template>
