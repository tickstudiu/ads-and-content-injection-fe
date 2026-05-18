<script setup lang="ts">
import { ref } from 'vue'
const props = defineProps<{
    html?: string
    imageUrl?: string
    linkUrl?: string
    linkTarget?: string
    position: 'top' | 'bottom'
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
        <div v-if="visible" :class="['com7-ads-sticky', `com7-ads-sticky--${props.position}`]">
            <a
                v-if="props.imageUrl"
                :href="props.linkUrl"
                :target="props.linkTarget || '_blank'"
                @click="emit('click')"
            >
                <img :src="props.imageUrl" alt="Ad" />
            </a>
            <div v-else-if="props.html" v-html="props.html" @click="emit('click')"></div>
            <button aria-label="Close ad" @click="close">×</button>
        </div>
    </transition>
</template>
