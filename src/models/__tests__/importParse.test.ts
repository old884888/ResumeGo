import { describe, expect, it } from 'vitest'
import { parseResumeText } from '../importParse'

describe('parseResumeText · 完整典型简历', () => {
  const SAMPLE = `张三
求职意向：后端开发工程师
电话：13812345678
邮箱：zhangsan@example.com
GitHub：github.com/zhangsan

教育背景
2019.09 - 2023.06  华中科技大学  计算机科学与技术（本科）
- GPA 3.8/4.0，专业排名前 5%
- 获国家励志奖学金两次

工作经历
2023.07 - 至今  字节跳动  后端开发工程师
• 负责抖音评论服务的高并发架构优化，QPS 提升 40%
• 主导缓存层重构，平均响应时间从 200ms 降至 80ms

2020.06 - 2020.09  腾讯  后端实习生
- 参与微信支付对账系统的开发与测试

项目经历
开源项目 Redis-Shake | 个人维护者 | 2022.01 - 至今
1. 一款 Redis 数据同步工具，GitHub 2k star
2. 支持 1000 万级 key 的增量同步

专业技能
熟悉 Go、Java，掌握 MySQL、Redis、Kafka
了解 Kubernetes、Docker 容器化部署

自我评价
对技术有热情，喜欢钻研底层原理
抗压能力强，具备良好的团队协作精神`

  const r = parseResumeText(SAMPLE)

  it('提取头部信息', () => {
    expect(r.name).toBe('张三')
    expect(r.headline).toBe('后端开发工程师')
    expect(r.phone).toBe('13812345678')
    expect(r.email).toBe('zhangsan@example.com')
    expect(r.extraContacts).toEqual([{ label: 'GitHub', value: 'github.com/zhangsan' }])
  })

  it('分区识别与顺序', () => {
    const titles = r.sections.map((s) => s.title)
    expect(titles).toEqual(['教育背景', '工作经历', '项目经历', '专业技能', '自我评价'])
    const types = r.sections.map((s) => s.type)
    expect(types).toEqual(['education', 'work', 'project', 'skill', 'custom'])
  })

  it('教育条目结构', () => {
    const edu = r.sections[0]
    expect(edu.items).toHaveLength(1)
    const it_ = edu.items[0]
    expect(it_.title).toBe('华中科技大学')
    expect(it_.subtitle).toBe('计算机科学与技术（本科）')
    expect(it_.dateText).toBe('2019.09 - 2023.06')
    expect(it_.bullets).toHaveLength(2)
  })

  it('工作经历两条独立条目', () => {
    const work = r.sections[1]
    expect(work.items).toHaveLength(2)
    expect(work.items[0].title).toBe('字节跳动')
    expect(work.items[0].subtitle).toBe('后端开发工程师')
    expect(work.items[0].dateText).toBe('2023.07 - 至今')
    expect(work.items[0].bullets).toHaveLength(2)
    expect(work.items[1].title).toBe('腾讯')
    expect(work.items[1].subtitle).toBe('后端实习生')
    expect(work.items[1].bullets).toEqual(['参与微信支付对账系统的开发与测试'])
  })

  it('无日期竖线分隔的项目条目', () => {
    const proj = r.sections[2]
    expect(proj.items[0].title).toBe('开源项目 Redis-Shake')
    expect(proj.items[0].subtitle).toBe('个人维护者')
    expect(proj.items[0].dateText).toBe('2022.01 - 至今')
    expect(proj.items[0].bullets).toHaveLength(2)
  })

  it('技能与自我评价：行转 bullet', () => {
    expect(r.sections[3].items[0].bullets).toHaveLength(2)
    expect(r.sections[4].items[0].bullets).toEqual([
      '对技术有热情，喜欢钻研底层原理',
      '抗压能力强，具备良好的团队协作精神',
    ])
  })

  it('无警告（信息齐全）', () => {
    expect(r.warnings).toEqual([])
  })
})

describe('parseResumeText · 日期与分隔符变体', () => {
  it('中文日期与「至今」', () => {
    const r = parseResumeText(
      `李四\n工作经历\n2019年9月 - 至今　阿里巴巴　高级工程师\n做了一些事情`,
    )
    const item = r.sections[0].items[0]
    expect(item.dateText).toBe('2019年9月 - 至今')
    expect(item.title).toBe('阿里巴巴')
    expect(item.subtitle).toBe('高级工程师')
  })

  it('全角竖线与中点分隔', () => {
    const r = parseResumeText(`王五\n项目经历\n数据平台 ｜ 负责人 · 2021.03-2022.05\n建设数据仓库`)
    const item = r.sections[0].items[0]
    expect(item.title).toBe('数据平台')
    expect(item.dateText).toContain('2021.03')
    expect(item.dateText).toContain('2022.05')
  })

  it('斜杠日期 2020/07', () => {
    const r = parseResumeText(`赵六\n工作经历\n2020/07 - 2021/08  某某科技有限公司  开发`)
    expect(r.sections[0].items[0].dateText).toBe('2020/07 - 2021/08')
    expect(r.sections[0].items[0].title).toBe('某某科技有限公司')
  })

  it('单独一行的日期挂到下一条件目', () => {
    const r = parseResumeText(`钱七\n项目经历\n2018.01 - 2018.12\n校园二手交易平台\n独立开发`)
    const item = r.sections[0].items[0]
    expect(item.dateText).toBe('2018.01 - 2018.12')
    expect(item.title).toBe('校园二手交易平台')
  })
})

describe('parseResumeText · 装饰与符号变体', () => {
  it('【】与 # 装饰的分区标题', () => {
    const r = parseResumeText(`孙八\n【教育背景】\n2017-2021 南京大学 物理系\n# 工作经历\n2021-至今 华为 软件工程师`)
    expect(r.sections.map((s) => s.title)).toEqual(['教育背景', '工作经历'])
  })

  it('冒号结尾的分区标题', () => {
    const r = parseResumeText(`周九\n教育背景：\n2016-2020 复旦大学\n专业技能：\n熟悉 Python`)
    expect(r.sections.map((s) => s.title)).toContain('教育背景')
    expect(r.sections.map((s) => s.title)).toContain('专业技能')
  })

  it('bullet 符号变体全部剥除', () => {
    const r = parseResumeText(
      `吴十\n工作经历\n2020-2021 甲公司\n- 用了 A\n• 用了 B\n1. 用了 C\n① 用了 D`,
    )
    expect(r.sections[0].items[0].bullets).toEqual(['用了 A', '用了 B', '用了 C', '用了 D'])
  })

  it('「公司 职位」单空格结构（无日期）', () => {
    const r = parseResumeText(`郑一\n工作经历\n字节跳动 开发工程师\n负责服务端开发`)
    const item = r.sections[0].items[0]
    expect(item.title).toBe('字节跳动')
    expect(item.subtitle).toBe('开发工程师')
    expect(item.bullets).toEqual(['负责服务端开发'])
  })
})

describe('parseResumeText · 姓名与联系方式', () => {
  it('「姓名：」label 形式', () => {
    const r = parseResumeText(`姓名：王大力\n电话：13800000000\n教育背景\n2015-2019 某大学`)
    expect(r.name).toBe('王大力')
    expect(r.phone).toBe('13800000000')
  })

  it('「XX的个人简历」文件名行', () => {
    const r = parseResumeText(`王小明的个人简历\n13812341234\na@b.com\n教育背景\n2015-2019 某大学`)
    expect(r.name).toBe('王小明')
  })

  it('裸手机号 + 裸邮箱', () => {
    const r = parseResumeText(`刘二\n13800138000\nliu@example.com\n教育背景\n2015-2019 某大学`)
    expect(r.phone).toBe('13800138000')
    expect(r.email).toBe('liu@example.com')
  })

  it('+86 前缀手机号', () => {
    const r = parseResumeText(`陈三\n+86 13912345678\n教育背景\n2015-2019 某大学`)
    expect(r.phone).toBe('13912345678')
  })
})

describe('parseResumeText · 降级场景', () => {
  it('无分区标题：内容进「待整理」且不丢字', () => {
    const text = `这是一段没有结构的文字\n第二行内容\n第三行内容`
    const r = parseResumeText(text)
    expect(r.sections).toHaveLength(1)
    expect(r.sections[0].title).toBe('待整理')
    const allBullets = r.sections[0].items.flatMap((i) => i.bullets)
    const all = allBullets.join('\n')
    for (const line of ['这是一段没有结构的文字', '第二行内容', '第三行内容']) {
      expect(all).toContain(line)
    }
    expect(r.warnings.some((w) => w.includes('待整理'))).toBe(true)
  })

  it('基本信息碎片行不捏造「待整理」', () => {
    const r = parseResumeText(`马大\n男 | 25岁 | 本科\n电话：13800000000\n教育背景\n2018-2022 某大学`)
    expect(r.sections.map((s) => s.title)).toEqual(['教育背景'])
    expect(r.warnings.some((w) => w.includes('待整理'))).toBe(false)
  })

  it('「个人简历」大标题被忽略', () => {
    const r = parseResumeText(`个人简历\n林三\n教育背景\n2015-2019 某大学`)
    expect(r.name).toBe('林三')
    expect(r.sections.map((s) => s.title)).toEqual(['教育背景'])
  })

  it('空文本不炸', () => {
    const r = parseResumeText('')
    expect(r.sections).toHaveLength(0)
    expect(r.warnings.length).toBeGreaterThan(0)
  })

  it('分隔线被剔除', () => {
    const r = parseResumeText(`林四\n----------\n教育背景\n2015-2019 某大学\n==========`)
    expect(r.sections.map((s) => s.title)).toEqual(['教育背景'])
  })

  it('缺联系方式给出 warnings', () => {
    const r = parseResumeText(`无名氏\n教育背景\n2015-2019 某大学`)
    const joined = r.warnings.join('\n')
    expect(joined).toContain('电话')
    expect(joined).toContain('邮箱')
  })
})
