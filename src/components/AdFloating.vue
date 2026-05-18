<script setup lang="ts">
import { ref } from 'vue'
const props = defineProps<{
    imageUrl?: string
    linkUrl?: string
    linkTarget?: string
    html?: string
    altText?: string
    slotId: string
}>()
const emit = defineEmits(['click', 'close'])
const visible = ref(true)

function close() {
    visible.value = false
    emit('close')
}
</script>

<template>
    <transition name="ads-fade">
        <div v-if="visible" class="com7-ads-floating">
            <a
                v-if="props.imageUrl"
                :href="props.linkUrl"
                :target="props.linkTarget || '_blank'"
                @click="emit('click')"
            >
                <img :src="props.imageUrl" :alt="props.altText || 'Advertisement'" />
            </a>
            <div v-else-if="props.html" v-html="props.html" @click="emit('click')"></div>
            <button class="com7-ads-floating__close" aria-label="Close ad" @click="close">×</button>
        </div>
    </transition>
</template>
