<script setup lang="ts">
import { ref } from 'vue'
const props = defineProps<{ imageUrl: string; linkUrl: string; slotId: string }>()
const emit = defineEmits(['click', 'close'])
const visible = ref(true)

function close() {
    visible.value = false
    emit('close')
}
</script>

<template>
    <transition name="ads-fade">
        <div v-if="visible" class="com7-ads-popup__overlay" @click.self="close">
            <div class="com7-ads-popup">
                <button class="com7-ads-popup__close" aria-label="Close ad" @click="close">
                    ×
                </button>
                <a :href="props.linkUrl" target="_blank" @click="emit('click')">
                    <img :src="props.imageUrl" alt="Advertisement" />
                </a>
            </div>
        </div>
    </transition>
</template>
