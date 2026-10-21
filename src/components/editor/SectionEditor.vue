<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  ChevronDown,
  Eye,
  EyeOff,
  GripVertical,
  Plus,
  ArrowUp,
  ArrowDown,
  X,
  GraduationCap,
  Briefcase,
  FolderGit2,
  Wrench,
  Sparkles,
  Ellipsis,
} from 'lucide-vue-next'
import type { Item, Resume, Section, SectionType } from '@/models/types'
import { SECTION_META } from '@/models/defaults'
import { uid } from '@/models/uid'
import IconBtn from '@/components/ui/IconBtn.vue'
import AppMenu from '@/components/ui/AppMenu.vue'
import AppSegmented from '@/components/ui/AppSegmented.vue'

const props = defineProps<{ section: Section; resume: Resume }>()

const collapsed = ref(false)

/* ---------- 分区拖拽 ---------- */
const secDropPos = ref<'' | 'before' | 'after'>('')

const SECTION_DND = 'application/x-pdfgo-section'

function onSectionDragStart(e: DragEvent) {
  e.dataTransfer?.setData(SECTION_DND, props.section.id)
  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move'
}

function onSectionDragOver(e: DragEvent) {
  if (!e.dataTransfer?.types.includes(SECTION_DND)) return
  e.preventDefault()
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  secDropPos.value = e.clientY < rect.top + rect.height / 2 ? 'before' : 'after'
}

function onSectionDragLeave() {
  secDropPos.value = ''
}

function onSectionDrop(e: DragEvent) {
  const wasAfter = secDropPos.value === 'after'
  const srcId = e.dataTransfer?.getData(SECTION_DND)
  secDropPos.value = ''
  if (!srcId || srcId === props.section.id) return
  const list = props.resume.sections
  const from = list.findIndex((s) => s.id === srcId)
  if (from < 0) return
  const [moved] = list.splice(from, 1)
  let to = list.findIndex((s) => s.id === props.section.id)
  if (wasAfter) to += 1
  list.splice(to, 0, moved)
}

/* ---------- 条目拖拽（同分区内排序） ---------- */
const ITEM_DND = 'application/x-pdfgo-item'
const itemDropIdx = ref(-1) // 插入到该索引条目之前；= items.length 表示末尾

const typeIcon = computed(() => {
  const map: Record<SectionType, unknown> = {
    education: GraduationCap,
    work: Briefcase,
    project: FolderGit2,
    skill: Wrench,
    custom: Sparkles,
  }
  return map[props.section.type]
})

function onItemDragStart(e: DragEvent, idx: number) {
  e.dataTransfer?.setData(ITEM_DND, String(idx))
  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move'
}

function onItemDragOver(e: DragEvent, idx: number) {
  if (!e.dataTransfer?.types.includes(ITEM_DND)) return
  e.preventDefault()
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const after = e.clientY > rect.top + rect.height / 2
  itemDropIdx.value = after ? idx + 1 : idx
}

function onItemDragLeave(e: DragEvent) {
  const to = e.relatedTarget as Node | null
  if (to && (e.currentTarget as HTMLElement).contains(to)) return
  itemDropIdx.value = -1
}

function onItemDrop(e: DragEvent) {
  e.preventDefault()
  const raw = e.dataTransfer?.getData(ITEM_DND)
  const target = itemDropIdx.value
  itemDropIdx.value = -1
  if (raw === null || raw === '' || target < 0) return
  const from = Number(raw)
  const list = props.section.items
  if (Number.isNaN(from) || from === target || from === target - 1) return
  const [moved] = list.splice(from, 1)
  list.splice(from < target ? target - 1 : target, 0, moved)
}

/* ---------- 常规编辑操作 ---------- */
function addItem() {
  props.section.items.push({
    id: uid(),
    title: '',
    subtitle: '',
    dateText: '',
    location: '',
    bullets: [''],
  })
}

function removeItem(id: string) {
  props.section.items = props.section.items.filter((i) => i.id !== id)
}

function move(arr: unknown[], from: number, to: number) {
  if (to < 0 || to >= arr.length) return
  const [x] = arr.splice(from, 1)
  arr.splice(to, 0, x)
}

function moveItem(i: number, delta: number) {
  move(props.section.items, i, i + delta)
}

function moveSection(delta: number) {
  const list = props.resume.sections
  const from = list.indexOf(props.section)
  move(list, from, from + delta)
}

function addBullet(it: Item) {
  it.bullets.push('')
}

function removeBullet(it: Item, bi: number) {
  it.bullets.splice(bi, 1)
  if (it.bullets.length === 0) it.bullets.push('')
}

function moveBullet(it: Item, bi: number, delta: number) {
  move(it.bullets, bi, bi + delta)
}

const isTwo = computed(() => props.resume.style.template === 'twocolumn')
</script>

<template>
  <div
    class="sec"
    :class="{
      'drop-before': secDropPos === 'before',
      'drop-after': secDropPos === 'after',
    }"
    @dragover="onSectionDragOver"
    @dragleave="onSectionDragLeave"
    @drop="onSectionDrop"
  >
    <header class="sec-head" @click="collapsed = !collapsed">
      <component :is="typeIcon" class="sec-icon" />
      <input v-model="section.title" class="ti-bare sec-title" placeholder="分区标题" @click.stop />
      <div class="sec-tools" @click.stop>
        <IconBtn v-if="section.visible" title="隐藏分区" @click="section.visible = false">
          <Eye />
        </IconBtn>
        <IconBtn v-else title="显示分区" @click="section.visible = true">
          <EyeOff />
        </IconBtn>
        <AppMenu align="right">
          <template #trigger>
            <IconBtn title="更多"><Ellipsis /></IconBtn>
          </template>
          <button class="am-item" @click="moveSection(-1)"><ArrowUp /> 上移分区</button>
          <button class="am-item" @click="moveSection(1)"><ArrowDown /> 下移分区</button>
          <div class="am-sep"></div>
          <button
            class="am-item danger"
            @click="resume.sections = resume.sections.filter((s) => s.id !== section.id)"
          >
            <X /> 删除分区
          </button>
        </AppMenu>
        <IconBtn :title="collapsed ? '展开' : '折叠'" @click.stop="collapsed = !collapsed">
          <ChevronDown :class="{ flip: collapsed }" />
        </IconBtn>
        <span class="drag-handle" title="拖拽调整分区顺序" draggable="true" @dragstart="onSectionDragStart" @dragend="secDropPos = ''">
          <GripVertical />
        </span>
      </div>
    </header>

    <div v-show="!collapsed" class="sec-body">
      <div v-if="!section.visible" class="hidden-tip">该分区已隐藏，不显示在简历中</div>

      <div v-if="isTwo" class="col-row">
        <span class="col-label">落位</span>
        <AppSegmented
          :options="[
            { value: 'main', label: '主栏' },
            { value: 'side', label: '侧栏' },
          ]"
          :model-value="section.column"
          @update:model-value="(v: string) => (section.column = v as 'main' | 'side')"
        />
      </div>

      <div
        v-for="(it, idx) in section.items"
        :key="it.id"
        class="item-card"
        :class="{
          'drop-before': itemDropIdx === idx,
          'drop-after': idx === section.items.length - 1 && itemDropIdx === section.items.length,
        }"
        @dragover="onItemDragOver($event, idx)"
        @dragleave="onItemDragLeave"
        @drop="onItemDrop"
      >
        <div class="item-top">
          <input v-model="it.title" class="ti" placeholder="公司 / 学校 / 项目名称" />
          <div class="item-tools">
            <span
              class="drag-handle"
              title="拖拽调整条目顺序"
              draggable="true"
              @dragstart="onItemDragStart($event, idx)"
              @dragend="itemDropIdx = -1"
            >
              <GripVertical />
            </span>
            <AppMenu align="right">
              <template #trigger>
                <IconBtn title="条目操作"><Ellipsis /></IconBtn>
              </template>
              <button class="am-item" :disabled="idx === 0" @click="moveItem(idx, -1)"><ArrowUp /> 上移</button>
              <button
                class="am-item"
                :disabled="idx === section.items.length - 1"
                @click="moveItem(idx, 1)"
              >
                <ArrowDown /> 下移
              </button>
              <div class="am-sep"></div>
              <button class="am-item danger" @click="removeItem(it.id)"><X /> 删除条目</button>
            </AppMenu>
          </div>
        </div>
        <div class="grid2">
          <input v-model="it.subtitle" class="ti" placeholder="职位 / 专业·学历 / 角色" />
          <input v-model="it.dateText" class="ti" placeholder="时间，如 2024.07 – 2025.07" />
        </div>
        <input v-model="it.location" class="ti" placeholder="地点（可选）" />

        <div class="bullets">
          <div v-for="(b, bi) in it.bullets" :key="bi" class="bullet-row">
            <textarea v-model="it.bullets[bi]" class="ti" rows="1" placeholder="要点：选中文字可加粗" />
            <div class="row-tools">
              <AppMenu align="right">
                <template #trigger>
                  <IconBtn title="要点操作"><Ellipsis /></IconBtn>
                </template>
                <button class="am-item" @click="moveBullet(it, bi, -1)"><ArrowUp /> 上移</button>
                <button class="am-item" @click="moveBullet(it, bi, 1)"><ArrowDown /> 下移</button>
                <div class="am-sep"></div>
                <button class="am-item danger" @click="removeBullet(it, bi)"><X /> 删除要点</button>
              </AppMenu>
            </div>
          </div>
          <button class="add-line" @click="addBullet(it)"><Plus /> 添加要点</button>
        </div>
      </div>

      <button class="add-item" @click="addItem"><Plus /> 添加条目</button>
    </div>
  </div>
</template>

<style scoped>
.sec {
  border: 1px solid var(--hairline);
  border-radius: var(--radius-3);
  background: var(--surface);
  position: relative;
  overflow: visible;
  transition: box-shadow 0.2s var(--ease);
}
.sec:hover {
  box-shadow: var(--shadow-1);
}
/* 拖拽落点指示线 */
.sec.drop-before::before,
.sec.drop-after::after,
.item-card.drop-before::before,
.item-card.drop-after::after {
  content: '';
  position: absolute;
  left: 4px;
  right: 4px;
  height: 3px;
  border-radius: 2px;
  background: var(--ui-accent);
  z-index: 5;
  pointer-events: none;
}
.sec.drop-before::before,
.item-card.drop-before::before {
  top: -7px;
}
.sec.drop-after::after,
.item-card.drop-after::after {
  bottom: -7px;
}

.sec-head {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px 8px 14px;
  cursor: pointer;
  user-select: none;
}
.sec-icon {
  width: 15px;
  height: 15px;
  color: var(--ui-accent);
  flex: none;
}
.sec-title {
  flex: 1;
  font-size: 14px;
  font-weight: 600;
  min-width: 0;
}
.sec-tools {
  display: flex;
  align-items: center;
  gap: 2px;
  opacity: 0.45;
  transition: opacity 0.2s var(--ease);
}
.sec:hover .sec-tools {
  opacity: 1;
}
.sec-tools svg {
  transition: transform 0.25s var(--ease);
}
.sec-tools svg.flip {
  transform: rotate(-90deg);
}

.drag-handle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 7px;
  color: var(--text-3);
  cursor: grab;
  transition: background-color 0.15s var(--ease), color 0.15s var(--ease);
}
.drag-handle:hover {
  background: var(--ui-accent-soft);
  color: var(--text-1);
}
.drag-handle:active {
  cursor: grabbing;
}
.drag-handle svg {
  width: 15px;
  height: 15px;
}

.sec-body {
  padding: 4px 14px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.hidden-tip {
  font-size: 12px;
  color: var(--text-3);
  background: var(--bg-inset);
  border-radius: var(--radius-1);
  padding: 7px 10px;
}

.col-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.col-label {
  font-size: 12px;
  color: var(--text-3);
  flex: none;
}

.item-card {
  border: 1px solid var(--hairline);
  border-radius: var(--radius-2);
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: var(--bg);
  position: relative;
  animation: item-in 0.25s var(--ease);
}
@keyframes item-in {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
}
.item-top {
  display: flex;
  gap: 6px;
  align-items: center;
}
.item-top .ti {
  flex: 1;
}
.item-tools {
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.18s var(--ease);
}
.item-card:hover .item-tools,
.item-card:focus-within .item-tools {
  opacity: 1;
}

.grid2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.bullets {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.bullet-row {
  display: flex;
  gap: 4px;
  align-items: flex-start;
}
.bullet-row textarea {
  flex: 1;
  min-width: 0;
  min-height: 32px;
  height: 32px;
  overflow: hidden;
  field-sizing: content;
}
/* 要点行：单菜单按钮外挂在输入框右侧，hover/聚焦时浮现，平时隐形零占位 */
.bullet-row {
  position: relative;
}
.row-tools {
  position: absolute;
  top: 4px;
  left: calc(100% + 5px);
  display: flex;
  gap: 2px;
  opacity: 0;
  background: var(--surface);
  border: 1px solid var(--hairline);
  border-radius: 7px;
  padding: 1px;
  box-shadow: var(--shadow-1);
  transition: opacity 0.15s var(--ease);
  z-index: 3;
}
.bullet-row:hover .row-tools,
.bullet-row:focus-within .row-tools {
  opacity: 1;
}
.row-tools .ib {
  width: 22px;
  height: 20px;
  border-radius: 5px;
}
.row-tools .ib svg {
  width: 12px;
  height: 12px;
}

.add-line,
.add-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: var(--ui-accent);
  padding: 5px 6px;
  border-radius: 6px;
  align-self: flex-start;
  transition: background-color 0.15s var(--ease);
}
.add-line:hover,
.add-item:hover {
  background: var(--ui-accent-soft);
}
.add-line svg,
.add-item svg {
  width: 13px;
  height: 13px;
}
.add-item {
  border: 1px dashed var(--hairline-strong);
  border-radius: var(--radius-1);
  align-self: stretch;
  justify-content: center;
  padding: 7px;
  color: var(--text-2);
}
.add-item:hover {
  color: var(--ui-accent);
  border-color: var(--ui-accent);
}

.item-tools .ib:disabled {
  opacity: 0.25;
  pointer-events: none;
}
</style>
