<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { Pencil, Copy, Download, Trash2, MoreHorizontal } from 'lucide-vue-next'
import type { Resume } from '@/models/types'
import Paper from '@/components/preview/Paper.vue'
import AppMenu from '@/components/ui/AppMenu.vue'
import IconBtn from '@/components/ui/IconBtn.vue'

const props = defineProps<{ resume: Resume; index: number }>()

const emit = defineEmits<{
  (e: 'open'): void
  (e: 'rename'): void
  (e: 'duplicate'): void
  (e: 'export'): void
  (e: 'delete'): void
}>()

const thumbEl = ref<HTMLElement>()
const scale = ref(0.25)
let ro: ResizeObserver | undefined

onMounted(() => {
  const measure = () => {
    if (thumbEl.value) scale.value = thumbEl.value.clientWidth / 794
  }
  measure()
  ro = new ResizeObserver(measure)
  if (thumbEl.value) ro.observe(thumbEl.value)
})
onBeforeUnmount(() => ro?.disconnect())

function fmtDate(ts: number) {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
</script>

<template>
  <article class="rcard" :style="{ '--i': index }" @click="emit('open')">
    <div ref="thumbEl" class="rcard-thumb">
      <div class="rcard-scale" :style="{ transform: `scale(${scale})` }">
        <Paper :resume="resume" />
      </div>
    </div>
    <footer>
      <div class="rcard-meta">
        <div class="rcard-name" :title="resume.name">{{ resume.name || '未命名简历' }}</div>
        <div class="rcard-time">{{ fmtDate(resume.updatedAt) }}</div>
      </div>
      <AppMenu align="right" @click.stop>
        <template #trigger>
          <IconBtn title="更多操作"><MoreHorizontal /></IconBtn>
        </template>
        <button class="am-item" @click="emit('rename')"><Pencil /> 重命名</button>
        <button class="am-item" @click="emit('duplicate')"><Copy /> 创建副本</button>
        <button class="am-item" @click="emit('export')"><Download /> 导出 JSON</button>
        <div class="am-sep"></div>
        <button class="am-item danger" @click="emit('delete')"><Trash2 /> 删除</button>
      </AppMenu>
    </footer>
  </article>
</template>

<style scoped>
.rcard {
  background: var(--surface);
  border: 1px solid var(--hairline);
  border-radius: var(--radius-3);
  overflow: hidden;
  cursor: pointer;
  box-shadow: var(--shadow-1);
  transition: transform 0.25s var(--ease), box-shadow 0.25s var(--ease),
    border-color 0.25s var(--ease);
  animation: card-rise 0.4s var(--ease) backwards;
  animation-delay: calc(var(--i) * 45ms);
}
@keyframes card-rise {
  from {
    opacity: 0;
    transform: translateY(14px) scale(0.98);
  }
}
.rcard:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-2);
  border-color: var(--ui-accent);
}

.rcard-thumb {
  position: relative;
  aspect-ratio: 794 / 1123;
  overflow: hidden;
  background: #fff;
  border-radius: var(--radius-3) var(--radius-3) 0 0;
}
.rcard-scale {
  position: absolute;
  top: 0;
  left: 0;
  width: 794px;
  transform-origin: 0 0;
  pointer-events: none;
}

footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 10px 10px 14px;
  border-top: 1px solid var(--hairline);
}
.rcard-meta {
  min-width: 0;
}
.rcard-name {
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.rcard-time {
  font-size: 11px;
  color: var(--text-3);
  margin-top: 2px;
  font-variant-numeric: tabular-nums;
}
</style>
