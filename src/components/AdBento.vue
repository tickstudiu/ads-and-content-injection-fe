<script setup lang="ts">
import { computed } from 'vue'

// ── Constants ────────────────────────────────────────────────────
const GRADIENTS: string[] = [
    'linear-gradient(135deg, #1a1a2e, #16213e)',
    'linear-gradient(135deg, #0d1117, #1a472a)',
    'linear-gradient(135deg, #1a0a2e, #2d0b4e)',
    'linear-gradient(135deg, #2d1515, #4e0b0b)',
    'linear-gradient(135deg, #0a1628, #1b3a6b)',
    'linear-gradient(135deg, #1a1500, #3d3000)',
    'linear-gradient(135deg, #001a1a, #00403f)',
]

const BADGE_MAP: Record<string, string> = {
    hot: 'ad-bento__badge--hot',
    new: 'ad-bento__badge--new',
    promo: 'ad-bento__badge--promo',
    sale: 'ad-bento__badge--promo',
    exclusive: 'ad-bento__badge--exclusive',
}

// ── Types ────────────────────────────────────────────────────────
export interface BentoAdProps {
    id?: string | number
    type?: 'hero' | 'wide' | 'tall' | 'small'
    title: string
    description?: string
    imageUrl?: string
    ctaLabel?: string
    ctaUrl?: string
    url?: string
    tags?: string[]
    index?: number
}

// ── Props & Emits ────────────────────────────────────────────────
const props = defineProps<{
    /** bento item object จาก API */
    id?: string | number
    type?: 'hero' | 'wide' | 'tall' | 'small'
    title: string
    description?: string
    imageUrl?: string
    ctaLabel?: string
    ctaUrl?: string
    tags?: string[]
    /** ลำดับใน grid — ใช้เลือก fallback gradient */
    index?: number
}>()

const emit = defineEmits<{
    (e: 'cta-click', ad: BentoAdProps): void
    (e: 'card-click', ad: BentoAdProps): void
}>()

// ── Computed ─────────────────────────────────────────────────────
const adType = computed(() => props.type ?? 'small')

/** รองรับทั้ง tags (array) และ tag (string) */
const resolvedTags = computed<string[]>(() => {
    if (Array.isArray(props.tags)) return props.tags
    if (props.tag) return [props.tag]
    return []
})

/** รองรับทั้ง ctaLabel และ cta */
const resolvedCtaLabel = computed(() => props.ctaLabel)

/** รองรับทั้ง ctaUrl และ url */
const resolvedCtaUrl = computed(() => props.ctaUrl)

/** รองรับทั้ง imageUrl และ image */
const resolvedImage = computed(() => props.imageUrl)

const fallbackGradient = computed(() => GRADIENTS[(props.index ?? 0) % GRADIENTS.length])

/** แสดง body / gradient / index เมื่อมี content อย่างน้อย 1 อย่าง */
const hasContent = computed(
    () => !!(props.title || props.description || resolvedCtaLabel.value || resolvedCtaUrl.value)
)

// ── Methods ──────────────────────────────────────────────────────
function badgeModifier(tag: string): string {
    return BADGE_MAP[tag.toLowerCase()] ?? 'ad-bento__badge--default'
}

function handleCta(): void {
    emit('cta-click', { ...props })
    if (resolvedCtaUrl.value) {
        window.open(resolvedCtaUrl.value, '_blank', 'noopener noreferrer')
    }
}

function handleCardClick(): void {
    emit('card-click', { ...props })
}

function onImageError(e: Event): void {
    ;(e.target as HTMLImageElement).style.display = 'none'
}
</script>

<template>
    <div class="ad-bento" :class="'ad-bento--' + adType" @click="handleCardClick">
        <!-- Background image -->
        <img
            v-if="resolvedImage"
            class="ad-bento__img"
            :src="resolvedImage"
            :alt="title"
            @error="onImageError"
        />

        <!-- Gradient fallback background — แสดงเมื่อมี content -->
        <div
            v-if="hasContent"
            class="ad-bento__gradient"
            :style="{ background: fallbackGradient }"
        ></div>

        <!-- Index label (debug helper) — แสดงเมื่อมี content -->
        <span v-if="hasContent" class="ad-bento__index">
            #{{ String((index ?? 0) + 1).padStart(2, '0') }}
        </span>

        <!-- Card body — แสดงเมื่อมี content -->
        <div v-if="hasContent" class="ad-bento__body">
            <!-- Tags / Badges -->
            <div v-if="resolvedTags.length" class="ad-bento__tags">
                <span
                    v-for="tag in resolvedTags"
                    :key="tag"
                    class="ad-bento__badge"
                    :class="badgeModifier(tag)"
                >
                    {{ tag }}
                </span>
            </div>

            <!-- Text block -->
            <div class="ad-bento__text">
                <p class="ad-bento__title">{{ title }}</p>
                <p v-if="description" class="ad-bento__desc">{{ description }}</p>
            </div>

            <!-- CTA Button -->
            <button v-if="resolvedCtaLabel" class="ad-bento__cta" @click.stop="handleCta">
                {{ resolvedCtaLabel }}
            </button>
        </div>
    </div>
</template>

<!--
    styles อยู่ที่ src/assets/main.css (section AdBento)
    custom ได้ผ่าน CSS variables --ads-bento-* ใน :root ของ project ที่นำไปใช้
-->
