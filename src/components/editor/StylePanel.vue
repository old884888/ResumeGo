<script setup lang="ts">
import { computed } from 'vue'
import type { Resume } from '@/models/types'
import { ACCENTS, TEMPLATE_META } from '@/models/defaults'
import AppSegmented from '@/components/ui/AppSegmented.vue'
import AppSwitch from '@/components/ui/AppSwitch.vue'
import Paper from '@/components/preview/Paper.vue'

const props = defineProps<{ resume: Resume }>()

const style = computed(() => props.resume.style)

const THUMB_SCALE = 0.145
</script>

<template>
  <aside class="panel style">
    <div class="panel-scroll">
      <div class="group">
        <h4>模板</h4>
        <div class="tpl-grid">
          <button
            v-for="t in TEMPLATE_META"
            :key="t.key"
            class="tpl-card"
            :class="{ active: style.template === t.key }"
            @click="style.template = t.key"
          >
            <div class="tpl-thumb">
              <div
                class="tpl-scale"
                :style="{ transform: `scale(${THUMB_SCALE})`, width: 794 + 'px' }"
              >
                <Paper :resume="resume" :key="t.key" />
              </div>
            </div>
            <div class="tpl-name">{{ t.label }}</div>
            <div class="tpl-desc">{{ t.desc }}</div>
          </button>
        </div>
      </div>

      <div class="group">
        <h4>主题色</h4>
        <div class="swatches">
          <button
            v-for="c in ACCENTS"
            :key="c"
            class="swatch"
            :class="{ active: style.accent === c }"
            :style="{ background: c }"
            :title="c"
            @click="style.accent = c"
          ></button>
        </div>
      </div>

      <div class="group">
        <h4>字体</h4>
        <AppSegmented
          :options="[
            { value: 'sans', label: '无衬线' },
            { value: 'serif', label: '衬线' },
          ]"
          :model-value="style.fontFamily"
          @update:model-value="(v: string) => (style.fontFamily = v as never)"
        />
      </div>

      <div class="group">
        <h4>排版密度</h4>
        <AppSegmented
          :options="[
            { value: 'compact', label: '紧凑' },
            { value: 'normal', label: '标准' },
            { value: 'relaxed', label: '宽松' },
          ]"
          :model-value="style.density"
          @update:model-value="(v: string) => (style.density = v as never)"
        />
      </div>

      <div class="group">
        <h4>页边距</h4>
        <AppSegmented
          :options="[
            { value: 'narrow', label: '窄' },
            { value: 'normal', label: '中' },
            { value: 'wide', label: '宽' },
          ]"
          :model-value="style.margin"
          @update:model-value="(v: string) => (style.margin = v as never)"
        />
      </div>

      <div class="group">
        <h4>显示</h4>
        <div class="switch-row">
          <span>显示照片</span>
          <AppSwitch v-model="style.showPhoto" />
        </div>
        <div class="switch-row">
          <span>联系方式图标</span>
          <AppSwitch v-model="style.showIcons" />
        </div>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.panel {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.panel-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.panel-scroll > * {
  flex: none;
}

.group h4 {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-3);
  letter-spacing: 0.04em;
  margin-bottom: 8px;
}

.tpl-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.tpl-card {
  border: 1.5px solid var(--hairline);
  border-radius: var(--radius-2);
  background: var(--surface);
  padding: 5px 5px 7px;
  text-align: center;
  transition: border-color 0.2s var(--ease), transform 0.2s var(--ease),
    box-shadow 0.2s var(--ease);
}
.tpl-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-1);
}
.tpl-card.active {
  border-color: var(--ui-accent);
  box-shadow: 0 0 0 3px var(--ui-accent-soft);
}
.tpl-thumb {
  position: relative;
  aspect-ratio: 794 / 1123;
  overflow: hidden;
  border-radius: 5px;
  background: #fff;
}
.tpl-scale {
  position: absolute;
  top: 0;
  left: 0;
  transform-origin: 0 0;
  pointer-events: none;
}
.tpl-name {
  font-size: 12px;
  font-weight: 600;
  margin-top: 6px;
}
.tpl-desc {
  font-size: 10px;
  color: var(--text-3);
  margin-top: 1px;
}

.swatches {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 7px;
}
.swatch {
  aspect-ratio: 1;
  border-radius: 50%;
  border: 2px solid transparent;
  box-shadow: inset 0 0 0 2px var(--surface);
  transition: transform 0.18s var(--spring), box-shadow 0.18s var(--ease);
}
.swatch:hover {
  transform: scale(1.15);
}
.swatch.active {
  box-shadow: inset 0 0 0 2px var(--surface), 0 0 0 2px var(--text-2);
  transform: scale(1.1);
}

.switch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  padding: 6px 0;
}
</style>
