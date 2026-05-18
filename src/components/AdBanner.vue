<script setup lang="ts">
const props = defineProps<{
    imageUrl: string
    linkUrl: string
    linkTarget?: string
    altText?: string
    slotId: string
}>()
const emit = defineEmits(['click', 'close'])
</script>

<template>
    <div class="com7-ads-banner">
        <a :href="props.linkUrl" :target="props.linkTarget || '_blank'" @click="emit('click')">
            <img :src="props.imageUrl" :alt="props.altText || 'Advertisement'" />
        </a>
        <button class="com7-ads-banner__close" aria-label="Close ad" @click="emit('close')">
            ×
        </button>
    </div>
</template>
