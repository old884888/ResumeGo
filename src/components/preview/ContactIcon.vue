<script setup lang="ts">
import { computed } from 'vue'
import {
  Phone,
  Mail,
  MapPin,
  Globe,
  Github,
  MessageCircle,
  MessageSquare,
  Cake,
  Tag,
  Building2,
} from 'lucide-vue-next'

const props = defineProps<{ label: string }>()

const comp = computed(() => {
  const l = (props.label || '').toLowerCase()
  if (/电话|手机|tel|phone/.test(l)) return Phone
  if (/邮箱|邮件|mail|email/.test(l)) return Mail
  if (/地址|城市|地点|location/.test(l)) return MapPin
  if (/博客|主页|网站|site|blog|主页/.test(l)) return Globe
  if (/github|gitee|git/.test(l)) return Github
  if (/微信|wechat|vx/.test(l)) return MessageCircle
  if (/qq/.test(l)) return MessageSquare
  if (/年龄|岁|出生|birth|age/.test(l)) return Cake
  if (/学校|大学|学院/.test(l)) return Building2
  return Tag
})
</script>

<template>
  <component :is="comp" />
</template>
