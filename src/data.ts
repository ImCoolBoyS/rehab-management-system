// 下拉选项常量（从原 data.ts 提取，移除已废弃的 mock 数据）
export type Town = { name: string; patientsCount: number }

export const TOWNS: Town[] = [
  { name: "A街道", patientsCount: 0 },
  { name: "B街道", patientsCount: 0 },
  { name: "C镇", patientsCount: 0 },
  { name: "D镇", patientsCount: 0 },
  { name: "E镇", patientsCount: 0 },
  { name: "F镇", patientsCount: 0 },
  { name: "G镇", patientsCount: 0 },
  { name: "H乡", patientsCount: 0 },
  { name: "I乡", patientsCount: 0 },
  { name: "J镇", patientsCount: 0 },
  { name: "K镇", patientsCount: 0 },
  { name: "L镇", patientsCount: 0 },
  { name: "M街道", patientsCount: 0 },
]

export const DRUGS_DICTIONARY = [
  { name: "阿立哌唑片", category: "抗精神病药" },
  { name: "奥氮平片", category: "抗精神病药" },
  { name: "利培酮片", category: "抗精神病药" },
  { name: "富马酸喹硫平片", category: "抗精神病药" },
  { name: "盐酸苯海索片", category: "抗精神病药(副作用控制)" },
  { name: "碳酸锂缓释片", category: "心境稳定剂" },
  { name: "丙戊酸钠缓释片", category: "心境稳定剂" },
  { name: "盐酸舍曲林片", category: "抗抑郁药" },
  { name: "盐酸帕罗西汀片", category: "抗抑郁药" },
  { name: "草酸艾司西酞普兰片", category: "抗抑郁药" },
]

export const TRAINING_TYPES = [
  { code: "服药训练", name: "服药训练" },
  { code: "预防复发训练", name: "预防复发训练" },
  { code: "躯体管理训练", name: "躯体管理/体能训练" },
  { code: "生活技能训练", name: "生活技能训练" },
  { code: "社交技能训练", name: "社交技能训练" },
  { code: "职业康复训练", name: "职业康复训练" },
  { code: "情绪训练", name: "情绪训练(心理治疗)" },
  { code: "同伴支持", name: "同伴支持" },
  { code: "家庭支持训练", name: "家庭支持训练" },
  { code: "手工训练", name: "手工训练" },
]
