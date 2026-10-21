<script setup lang="ts">
import { computed, inject, ref, type Ref } from 'vue'
import type { Resume, Section, TemplateKey } from '@/models/types'
import { EDITABLE_KEY } from '@/injectKeys'
import ClassicTemplate from './templates/ClassicTemplate.vue'
import ModernTemplate from './templates/ModernTemplate.vue'
import TwoColumnTemplate from './templates/TwoColumnTemplate.vue'

const props = withDefaults(defineProps<{ resume: Resume; printMode?: boolean }>(), {
  printMode: false,
})

const TPL: Record<TemplateKey, unknown> = {
  classic: ClassicTemplate,
  modern: ModernTemplate,
  twocolumn: TwoColumnTemplate,
}

const tpl = computed(() => TPL[props.resume.style.template] ?? ClassicTemplate)

const editable = inject<Ref<boolean>>(EDITABLE_KEY, ref(false))
const editMode = computed(() => editable.value && !props.printMode)

const visibleSections = computed(() =>
  props.resume.sections.filter((s: Section) => s.visible && s.items.length > 0),
)
void visibleSections
</script>

<template>
  <div
    class="paper"
    :class="[
      resume.style.fontFamily,
      'd-' + resume.style.density,
      'm-' + resume.style.margin,
      't-' + resume.style.template,
    ]"
    :style="{ '--accent': resume.style.accent }"
    :data-edit="editMode ? 'on' : 'off'"
  >
    <component :is="tpl" :resume="resume" />
  </div>
</template>
