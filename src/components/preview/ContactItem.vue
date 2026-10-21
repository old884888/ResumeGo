<script setup lang="ts">
import { computed } from 'vue'
import type { Resume } from '@/models/types'
import ContactIcon from './ContactIcon.vue'
import EditableText from './EditableText.vue'

const props = withDefaults(
  defineProps<{
    label?: string
    value?: string
    resume: Resume
    showIcon?: boolean
  }>(),
  { label: '', value: '', showIcon: undefined },
)

const emit = defineEmits<{ (e: 'commit', v: string): void }>()

const iconsOn = computed(() =>
  props.showIcon === undefined ? props.resume.style.showIcons : props.showIcon,
)
</script>

<template>
  <span class="c-item">
    <ContactIcon v-if="iconsOn" :label="label" />
    <EditableText
      v-if="value"
      :model-value="value"
      tag="span"
      @update:model-value="emit('commit', $event)"
    />
    <span v-else>{{ label }}</span>
  </span>
</template>
