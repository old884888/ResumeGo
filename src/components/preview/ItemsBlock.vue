<script setup lang="ts">
import { computed, inject, ref, type Ref } from 'vue'
import type { Item, Resume, Section } from '@/models/types'
import { EDITABLE_KEY } from '@/injectKeys'
import EditableText from './EditableText.vue'

const props = defineProps<{ section: Section; resume: Resume }>()

const editable = inject<Ref<boolean>>(EDITABLE_KEY, ref(false))

/* 条目可见性：任一字段非空即渲染 */
const items = computed(() =>
  props.section.items.filter(
    (it: Item) =>
      it.title.trim() ||
      (it.subtitle ?? '').trim() ||
      (it.dateText ?? '').trim() ||
      it.bullets.some((b) => b.trim()),
  ),
)

/* 要点：编辑模式显示全部（空项带占位可点击填写）；打印/缩略图过滤空项 */
function bulletsOf(it: Item) {
  if (editable.value) return it.bullets
  return it.bullets.filter((b) => b.trim())
}
</script>

<template>
  <div>
    <div v-for="it in items" :key="it.id" class="p-item">
      <div class="p-item-head">
        <div class="p-item-title">
          <EditableText :model-value="it.title" tag="div" @update:model-value="it.title = $event" />
        </div>
        <div v-if="it.dateText" class="p-item-date">
          <EditableText :model-value="it.dateText ?? ''" tag="span" @update:model-value="it.dateText = $event" />
        </div>
      </div>
      <div v-if="it.subtitle || it.location" class="p-item-sub">
        <span v-if="it.subtitle">
          <EditableText :model-value="it.subtitle ?? ''" tag="span" @update:model-value="it.subtitle = $event" />
        </span>
        <span v-if="it.location">
          <EditableText :model-value="it.location ?? ''" tag="span" @update:model-value="it.location = $event" />
        </span>
      </div>
      <a v-if="it.link?.url" class="p-link" :href="it.link.url" target="_blank" rel="noreferrer">
        {{ it.link.label || it.link.url }}
      </a>
      <ul v-if="bulletsOf(it).length" class="p-bullets">
        <li v-for="(b, i) in bulletsOf(it)" :key="i">
          <EditableText :model-value="b" tag="span" placeholder="要点" @update:model-value="it.bullets[i] = $event" />
        </li>
      </ul>
    </div>
  </div>
</template>
