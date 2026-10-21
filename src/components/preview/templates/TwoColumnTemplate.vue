<script setup lang="ts">
import { computed } from 'vue'
import type { Resume, Section } from '@/models/types'
import ItemsBlock from '../ItemsBlock.vue'
import ContactItem from '../ContactItem.vue'
import EditableText from '../EditableText.vue'

const props = defineProps<{ resume: Resume }>()

const fields = computed(() => props.resume.basics.fields.filter((f) => f.value.trim()))
const photo = computed(() =>
  props.resume.style.showPhoto ? props.resume.basics.photo : undefined,
)

const sideSections = computed(() =>
  props.resume.sections.filter(
    (s: Section) => s.visible && s.items.length > 0 && s.column === 'side',
  ),
)
const mainSections = computed(() =>
  props.resume.sections.filter(
    (s: Section) => s.visible && s.items.length > 0 && s.column !== 'side',
  ),
)
</script>

<template>
  <div class="tpl-two">
    <aside class="two-side">
      <img v-if="photo" class="two-photo" :src="photo" alt="" />
      <div class="side-name">
        <EditableText :model-value="resume.basics.name" tag="div" @update:model-value="resume.basics.name = $event" />
      </div>
      <div v-if="resume.basics.headline" class="side-headline">
        <EditableText :model-value="resume.basics.headline ?? ''" tag="div" @update:model-value="resume.basics.headline = $event" />
      </div>

      <div v-if="fields.length" class="side-contact">
        <ContactItem
          v-for="f in fields"
          :key="f.id"
          :label="f.label"
          :value="f.value"
          :resume="resume"
          @commit="f.value = $event"
        />
      </div>

      <section v-for="s in sideSections" :key="s.id" class="p-sec">
        <div class="p-sec-title">
          <EditableText :model-value="s.title" tag="div" @update:model-value="s.title = $event" />
        </div>
        <ItemsBlock :section="s" :resume="resume" />
      </section>
    </aside>

    <main class="two-main">
      <section
        v-for="s in mainSections"
        :key="s.id"
        class="p-sec"
        :class="{ first: s === mainSections[0] }"
      >
        <div class="p-sec-title">
          <EditableText :model-value="s.title" tag="div" @update:model-value="s.title = $event" />
        </div>
        <ItemsBlock :section="s" :resume="resume" />
      </section>
    </main>
  </div>
</template>

<style scoped>
.two-main .p-sec.first {
  margin-top: 0;
}
.two-main .p-sec.first .p-sec-title {
  color: var(--accent);
  font-size: 16px;
  border-bottom: 2px solid var(--accent);
}
.two-main .p-sec.first .p-sec-title::after {
  display: none;
}
</style>
