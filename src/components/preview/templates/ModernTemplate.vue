<script setup lang="ts">
import { computed } from 'vue'
import type { Resume } from '@/models/types'
import ItemsBlock from '../ItemsBlock.vue'
import ContactItem from '../ContactItem.vue'
import EditableText from '../EditableText.vue'

const props = defineProps<{ resume: Resume }>()

const fields = computed(() => props.resume.basics.fields.filter((f) => f.value.trim()))
const photo = computed(() =>
  props.resume.style.showPhoto ? props.resume.basics.photo : undefined,
)
const sections = computed(() =>
  props.resume.sections.filter((s) => s.visible && s.items.length > 0),
)
</script>

<template>
  <div class="tpl-modern">
    <header class="md-head" :class="{ 'has-photo': !!photo }">
      <div class="md-head-main">
        <div class="p-name">
          <EditableText :model-value="resume.basics.name" tag="div" @update:model-value="resume.basics.name = $event" />
        </div>
        <div v-if="resume.basics.headline" class="p-headline">
          <EditableText :model-value="resume.basics.headline ?? ''" tag="div" @update:model-value="resume.basics.headline = $event" />
        </div>
        <div class="p-contact">
          <ContactItem
            v-for="f in fields"
            :key="f.id"
            :label="f.label"
            :value="f.value"
            :resume="resume"
            @commit="f.value = $event"
          />
        </div>
      </div>
      <img v-if="photo" class="p-photo md-photo" :src="photo" alt="" />
    </header>

    <section v-for="s in sections" :key="s.id" class="p-sec">
      <div class="p-sec-title">
        <EditableText :model-value="s.title" tag="div" @update:model-value="s.title = $event" />
      </div>
      <ItemsBlock :section="s" :resume="resume" />
    </section>
  </div>
</template>

<style scoped>
.md-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  padding-bottom: 16px;
  border-bottom: 3px solid var(--accent);
}
.md-head-main {
  flex: 1;
  min-width: 0;
}
.md-photo {
  width: 86px;
  height: 114px;
}
</style>
