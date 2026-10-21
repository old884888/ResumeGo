import type { Resume } from './types'
import { newSection, newItem } from './defaults'
import { uid } from './uid'

/**
 * 内置示例简历 —— 纯虚构演示数据
 * （人名、学校、公司、项目均为虚构，仅用于展示工具效果）
 */
export function sampleResume(): Resume {
  const edu = newSection('education')
  edu.items = [
    {
      ...newItem(),
      title: '临江理工大学',
      subtitle: '软件工程 · 本科',
      dateText: '2019.09 – 2023.06',
      bullets: [
        '连续两年获**校级二等奖学金**',
        '参与校**程序设计竞赛**获团体三等奖',
      ],
    },
  ]

  const work = newSection('work')
  work.items = [
    {
      ...newItem(),
      title: '星野网络科技有限公司',
      subtitle: '前端开发工程师',
      dateText: '2023.07 – 至今',
      bullets: [
        '负责协作办公产品线的**Web 端开发**，主导核心编辑器模块的性能优化',
        '搭建团队**组件文档与调试工具**，前端需求平均交付周期缩短约 30%',
      ],
    },
    {
      ...newItem(),
      title: '蓝湾信息技术有限公司',
      subtitle: '前端开发实习生',
      dateText: '2022.12 – 2023.05',
      bullets: [
        '参与企业官网与运营活动页开发，完成 **10+ 个页面**的还原与上线',
        '配合后端完成接口联调，编写公共请求封装与**错误码提示规范**',
      ],
    },
  ]

  const project = newSection('project')
  project.items = [
    {
      ...newItem(),
      title: '云雀协同编辑器',
      subtitle: '核心开发',
      dateText: '2024.02 – 2024.09',
      bullets: [
        '基于 Vue3 实现多人**实时协同**文档，支持光标同步与冲突合并',
        '通过**虚拟滚动 + 分片渲染**，万行长文档滚动帧率稳定在 60fps',
      ],
    },
  ]

  const skill = newSection('skill')
  skill.items = [
    {
      ...newItem(),
      title: '前端基础',
      bullets: [
        '熟悉 **HTML / CSS / JavaScript**，掌握 TypeScript 并在项目中落地',
        '熟悉浏览器渲染原理与常见**性能优化**手段',
      ],
    },
    {
      ...newItem(),
      title: '框架与工程化',
      bullets: [
        '熟练使用 **Vue3 / Pinia / Vue Router**，了解 React 基本用法',
        '熟悉 **Vite** 构建体系与组件库二次封装',
      ],
    },
    {
      ...newItem(),
      title: '跨端与其他',
      bullets: [
        '有**微信小程序**与 uni-app 跨端开发经验',
        '熟悉 Git 协作流程，了解 Node.js 常用工具链',
      ],
    },
  ]

  const honor = newSection('custom')
  honor.title = '更多'
  honor.items = [
    {
      ...newItem(),
      title: '关于我',
      bullets: ['热爱折腾工具与效率应用', '羽毛球业余爱好者'],
    },
  ]

  const now = Date.now()
  return {
    id: uid(),
    schemaVersion: 1,
    name: '示例 · 前端开发简历',
    createdAt: now,
    updatedAt: now,
    basics: {
      name: '陈晓',
      headline: '求职意向：前端开发工程师',
      fields: [
        { id: uid(), label: '电话', value: '100-0000-0000' },
        { id: uid(), label: '邮箱', value: 'hello@example.com' },
        { id: uid(), label: '城市', value: '杭州' },
      ],
    },
    sections: [edu, work, project, skill, honor],
    style: {
      template: 'classic',
      accent: '#1D4ED8',
      fontFamily: 'sans',
      density: 'normal',
      margin: 'normal',
      showPhoto: false,
      showIcons: true,
    },
  }
}
