<script setup lang="ts">
import { ref } from 'vue'
import { Camera, X, Plus } from 'lucide-vue-next'
import type { Resume } from '@/models/types'
import { uid } from '@/models/uid'
import { compressImage } from '@/models/download'
import IconBtn from '@/components/ui/IconBtn.vue'

const props = defineProps<{ resume: Resume }>()

const fileEl = ref<HTMLInputElement>()
const photoBusy = ref(false)

async function onPhotoChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  ;(e.target as HTMLInputElement).value = ''
  if (!file) return
  photoBusy.value = true
  const data = await compressImage(file, 480, 0.85)
  photoBusy.value = false
  if (data) props.resume.basics.photo = data
}

function addField() {
  props.resume.basics.fields.push({ id: uid(), label: '', value: '' })
}
</script>

<template>
  <div class="basics">
    <div class="row photo-row">
      <button
        class="photo-box"
        :class="{ busy: photoBusy }"
        title="上传照片"
        @click="fileEl?.click()"
      >
        <img v-if="resume.basics.photo" :src="resume.basics.photo" alt="" />
        <Camera v-else />
        <button
          v-if="resume.basics.photo"
          class="photo-remove"
          title="移除照片"
          @click.stop="resume.basics.photo = undefined"
        >
          <X />
        </button>
      </button>
      <input ref="fileEl" type="file" accept="image/*" hidden @change="onPhotoChange" />

      <div class="row-stack">
        <input v-model="resume.basics.name" class="ti" placeholder="姓名" />
        <input v-model="resume.basics.headline" class="ti" placeholder="求职意向，如：Java 后端开发工程师" />
      </div>
    </div>

    <div class="fields">
      <div v-for="f in resume.basics.fields" :key="f.id" class="field-row">
        <input v-model="f.label" class="ti fi-label" placeholder="标签" />
        <input v-model="f.value" class="ti" placeholder="内容" />
        <IconBtn danger title="删除" @click="resume.basics.fields = resume.basics.fields.filter((x) => x.id !== f.id)">
          <X />
        </IconBtn>
      </div>
      <button class="add-line" @click="addField"><Plus /> 添加联系方式</button>
    </div>
  </div>
</template>

<style scoped>
.photo-row {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}
.row-stack {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.photo-box {
  width: 56px;
  height: 74px;
  border-radius: 8px;
  border: 1.5px dashed var(--hairline-strong);
  background: var(--bg);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-3);
  position: relative;
  overflow: hidden;
  flex: none;
  transition: border-color 0.15s var(--ease), color 0.15s var(--ease);
}
.photo-box:hover {
  border-color: var(--ui-accent);
  color: var(--ui-accent);
}
.photo-box.busy {
  opacity: 0.5;
  pointer-events: none;
}
.photo-box img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.photo-box svg {
  width: 18px;
  height: 18px;
}
.photo-remove {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
}
.photo-remove svg {
  width: 11px;
  height: 11px;
}

.fields {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.field-row {
  display: flex;
  gap: 6px;
  align-items: center;
}
.fi-label {
  width: 76px;
  flex: none;
}

.add-line {
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
.add-line:hover {
  background: var(--ui-accent-soft);
}
.add-line svg {
  width: 13px;
  height: 13px;
}
</style>
