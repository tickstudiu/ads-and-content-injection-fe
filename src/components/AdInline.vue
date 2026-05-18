<script setup lang="ts">
const props = defineProps<{
    imageUrl?: string
    linkUrl?: string
    linkTarget?: string
    html?: string
    altText?: string
    slotId: string
}>()
const emit = defineEmits(['click', 'close'])
</script>

<template>
    <div class="com7-ads-inline">
        <a
            v-if="props.imageUrl"
            :href="props.linkUrl"
            :target="props.linkTarget || '_blank'"
            @click="emit('click')"
        >
            <img :src="props.imageUrl" :alt="props.altText || 'Advertisement'" />
        </a>
        <div v-else-if="props.html" v-html="props.html" @click="emit('click')"></div>
    </div>
</template>
