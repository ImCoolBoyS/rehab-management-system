/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Site, User, Student, Assessment, TrainingRecord, HomeVisit, Announcement } from './types';

// 20 Generic townships for A City with statistical distributions
export const TOWNS = [
  { name: '测试1镇', patientsCount: 132 },
  { name: '测试2镇', patientsCount: 98 },
  { name: '测试3镇', patientsCount: 95 },
  { name: '测试4镇', patientsCount: 83 },
  { name: '测试5镇', patientsCount: 82 },
  { name: '测试6镇', patientsCount: 78 },
  { name: '测试7镇', patientsCount: 52 },
  { name: '测试8镇', patientsCount: 52 },
  { name: '测试9镇', patientsCount: 49 },
  { name: '测试10镇', patientsCount: 49 },
  { name: '测试11镇', patientsCount: 46 },
  { name: '测试12乡', patientsCount: 36 },
  { name: '测试13乡', patientsCount: 36 },
  { name: '测试14街道', patientsCount: 36 },
  { name: '测试15镇', patientsCount: 31 },
  { name: '测试16镇', patientsCount: 29 },
  { name: '测试17镇', patientsCount: 29 },
  { name: '测试18镇', patientsCount: 26 },
  { name: '测试19乡', patientsCount: 23 },
  { name: '测试20镇', patientsCount: 19 },
];

// Initialize A City Service Points (Sites)
export const INITIAL_SITES: Site[] = TOWNS.map((town, idx) => ({
  id: `site-a-${idx + 1}`,
  name: `A市精神障碍社区康复${town.name}服务点`,
  town: town.name,
  siteType: '乡镇站点',
  isActive: true,
}));

// Mock Users
export const INITIAL_USERS: User[] = [
  {
    id: 'user-001',
    username: 'admin',
    realName: '张主任',
    gender: '男',
    role: 'admin',
    siteId: 'site-a-1', // 测试1镇
    phone: '13905931234',
    password: 'admin', // default admin password
    isActive: true,
  },
  {
    id: 'user-002',
    username: 'kljygt',
    realName: '陈蕾',
    gender: '女',
    role: 'worker',
    siteId: 'site-a-9', // 测试9镇服务点
    phone: '13859325678',
    password: '123',
    isActive: true,
  },
  {
    id: 'user-003',
    username: 'sq_sg1',
    realName: '李国强',
    gender: '男',
    role: 'supervisor',
    siteId: 'site-a-1', // 测试1镇
    phone: '13509539876',
    password: '123',
    isActive: true,
  },
  {
    id: 'user-004',
    username: 'cy_sg',
    realName: '王丽华',
    gender: '女',
    role: 'worker',
    siteId: 'site-a-2', // 测试2镇
    phone: '13609538844',
    password: '123',
    isActive: true,
  }
];

// Mock Students with complete 29 fields (realistic generic data representing actual patient profiles)
export const INITIAL_STUDENTS: Student[] = [
  {
    id: 'stu-001',
    name: '测试学员一',
    idCard: '35010019850612001X',
    gender: '男',
    ethnicity: '汉族',
    birthDate: '1985-06-12',
    age: 41,
    phone: '13859311122',
    homePhone: '0593-6381122',
    address: 'A市测试1镇开发区新街路45号',
    maritalStatus: '未婚',
    livingSituation: '与亲属共同生活',
    hasDisabilityCert: true,
    disabilityType: '精神残疾',
    disabilityLevel: '二级',
    hasDibao: true,
    contactPerson: '监护人一',
    contactPhone: '13959322233',
    coResidents: ['兄弟', '父母'],
    coResidentRelation: '良好',
    livingEnvironment: '一般',
    economicStatus: '贫困',
    incomeSource: ['政府救助', '家人支持'],
    moneyManagement: '由家人管理金钱',
    pastBehavior: ['无'],
    currentRisk: '无上述行为或危险',
    medicationCompliance: '规律',
    medicationMethod: '他人给药自己服',
    medicationDetail: '阿立哌唑片 每日一次 每次10mg; 盐酸苯海索片 每日二次 每次2mg',
    town: '测试1镇',
    village: '测试社区',
    siteId: 'site-a-1',
    status: 'active',
    riskLevel: 'low',
    serviceType: 'type80',
    createdAt: '2025-06-15T09:00:00Z',
  },
  {
    id: 'stu-002',
    name: '测试学员二',
    idCard: '35010019760822002X',
    gender: '男',
    ethnicity: '汉族',
    birthDate: '1976-08-22',
    age: 49,
    phone: '13599223344',
    homePhone: '0593-6382244',
    address: 'A市测试9镇中兴路12号',
    maritalStatus: '已婚',
    livingSituation: '与亲属共同生活',
    hasDisabilityCert: true,
    disabilityType: '精神残疾',
    disabilityLevel: '三级',
    hasDibao: false,
    contactPerson: '监护人二',
    contactPhone: '13799334455',
    coResidents: ['配偶', '子女'],
    coResidentRelation: '良好',
    livingEnvironment: '良好',
    economicStatus: '一般',
    incomeSource: ['工资', '家人支持'],
    moneyManagement: '由家人协助管理金钱',
    pastBehavior: ['攻击冲动行为史'],
    currentRisk: '存在危害他人安全的危险',
    medicationCompliance: '间断',
    medicationMethod: '自行服药',
    medicationDetail: '奥氮平片 每日一次 睡前10mg',
    town: '测试9镇',
    village: '测试村',
    siteId: 'site-a-9',
    status: 'active',
    riskLevel: 'medium',
    serviceType: 'type60',
    createdAt: '2025-07-02T14:30:00Z',
  },
  {
    id: 'stu-003',
    name: '测试学员三',
    idCard: '35010019901103003X',
    gender: '女',
    ethnicity: '汉族',
    birthDate: '1990-11-03',
    age: 35,
    phone: '13699334488',
    homePhone: '',
    address: 'A市测试6镇大林路8号',
    maritalStatus: '未婚',
    livingSituation: '独自生活',
    hasDisabilityCert: true,
    disabilityType: '精神残疾',
    disabilityLevel: '二级',
    hasDibao: true,
    contactPerson: '监护人三',
    contactPhone: '13899334422',
    coResidents: [],
    coResidentRelation: '一般',
    livingEnvironment: '差',
    economicStatus: '贫困',
    incomeSource: ['政府救助'],
    moneyManagement: '自行决定支出',
    pastBehavior: ['严重自伤自杀行为史'],
    currentRisk: '存在自杀自伤的危险',
    medicationCompliance: '不服药',
    medicationMethod: '自行服药',
    medicationDetail: '富马酸喹硫平片 每日二次 每次100mg',
    town: '测试6镇',
    village: '测试新村',
    siteId: 'site-a-6',
    status: 'active',
    riskLevel: 'high',
    serviceType: 'type80',
    createdAt: '2025-07-10T11:20:00Z',
  },
  {
    id: 'stu-004',
    name: '测试学员四',
    idCard: '35010019680514004X',
    gender: '女',
    ethnicity: '汉族',
    birthDate: '1968-05-14',
    age: 58,
    phone: '13199334477',
    homePhone: '',
    address: 'A市测试10镇下沙路103号',
    maritalStatus: '丧偶',
    livingSituation: '独自生活，但家人定时探望',
    hasDisabilityCert: true,
    disabilityType: '精神残疾',
    disabilityLevel: '一级',
    hasDibao: true,
    contactPerson: '监护人四',
    contactPhone: '13999445566',
    coResidents: [],
    coResidentRelation: '一般',
    livingEnvironment: '一般',
    economicStatus: '较差',
    incomeSource: ['政府救助', '家人支持'],
    moneyManagement: '由家人协助管理金钱',
    pastBehavior: ['无'],
    currentRisk: '无上述行为或危险',
    medicationCompliance: '规律',
    medicationMethod: '他人员工给药自己服',
    medicationDetail: '利培酮片 每日一次 睡前2mg',
    town: '测试10镇',
    village: '测试下沙村',
    siteId: 'site-a-10',
    status: 'active',
    riskLevel: 'low',
    serviceType: 'type60',
    createdAt: '2025-07-12T10:00:00Z',
  }
];

// Initial Assessment records with detailed scores (for the 6 scales)
export const INITIAL_ASSESSMENTS: Assessment[] = [
  {
    id: 'assess-001',
    studentId: 'stu-001',
    studentName: '测试学员一',
    siteId: 'site-a-1',
    assessmentType: 'baseline',
    assessDate: '2025-06-16',
    assessor: '李国强',
    overallImpression: '患者处于中度衰退期，社交技巧欠缺，意志减退，日常生活基本能自理但质量不高。建议重点进行生活技能与社交技能训练。',
    scores: {
      psychoSocial: 45, // 0-100
      mentalStatus: '存在情感淡漠，幻听，自知力部分丧失。',
      sdss: 12, // 0-20
      socialAdapt: 18, // 0-40
      adl: 28, // 14-56 (high is worse)
      iadl: 19, // 8-32 (high is worse)
    }
  },
  {
    id: 'assess-002',
    studentId: 'stu-002',
    studentName: '测试学员二',
    siteId: 'site-a-9',
    assessmentType: 'baseline',
    assessDate: '2025-07-03',
    assessor: '陈蕾',
    overallImpression: '患者情绪易激惹，不服药时存在一定的冲动意向。生活自理能力较好，认知能力中等，建议重点做预防复发以及情绪管理训练。',
    scores: {
      psychoSocial: 62,
      mentalStatus: '仪容整洁。情绪较焦虑，存在多疑想法，自知力完整。',
      sdss: 8,
      socialAdapt: 25,
      adl: 18,
      iadl: 12,
    }
  }
];

// Initial Training Records with realistic details
export const INITIAL_TRAININGS: TrainingRecord[] = [
  {
    id: 'train-001',
    studentId: 'stu-001',
    studentName: '测试学员一',
    siteId: 'site-a-1',
    title: '服药依从性提升与自我管理训练',
    trainingType: '服药训练',
    trainingMethod: '个案管理',
    trainingLevel: '第二级',
    location: '患者居所',
    startTime: '2026-07-16T10:00:00Z',
    endTime: '2026-07-16T10:30:00Z',
    durationMinutes: 30,
    content: '核对药物名称与剂量，向患者宣讲规律服药的重要性，教授药盒的使用方法和定时闹钟设置。',
    summary: '患者能配合清点药量，并在社工言语指导下将一周的药物分类装入药盒，表现良好，依从性高。',
    recorderName: '李国强',
    createdAt: '2026-07-16T10:35:00Z',
    details: {
      drugName: '阿立哌唑片',
      dosage: '10mg',
      administrationMethod: '他人给药自己服',
      administrationTime: ['早'],
      adverseReactions: ['轻微嗜睡'],
      complianceAssessment: '规律',
    }
  },
  {
    id: 'train-002',
    studentId: 'stu-002',
    studentName: '测试学员二',
    siteId: 'site-a-9',
    title: '家庭情境下的情绪认知与解压练习',
    trainingType: '情绪训练',
    trainingMethod: '个案管理',
    trainingLevel: '第一级',
    location: '患者居所',
    startTime: '2026-07-17T09:00:00Z',
    endTime: '2026-07-17T09:45:00Z',
    durationMinutes: 45,
    content: '通过情绪日志法帮助学员识别易引起激惹的家庭情境，讲授深呼吸和10秒情绪冷却缓释技巧。',
    summary: '参与态度认真，在社工的引导下进行了3轮深呼吸练习，表示在感到烦躁时会尝试深呼吸。',
    recorderName: '陈蕾',
    createdAt: '2026-07-17T09:50:00Z',
    details: {
      therapyType: '认知治疗',
      emotionTopics: ['焦虑', '愤怒'],
      regulationSkills: ['深呼吸', '正念'],
      preScore: 7,
      postScore: 4,
      triggerNotes: '家庭日常开支产生分歧时易产生烦躁感。',
    }
  },
  {
    id: 'train-003',
    studentId: 'stu-001',
    studentName: '测试学员一',
    siteId: 'site-a-1',
    title: '简易手工贴画精细动作锻炼',
    trainingType: '手工训练',
    trainingMethod: '社区活动',
    trainingLevel: '第一级',
    location: '康复机构',
    startTime: '2026-07-17T14:00:00Z',
    endTime: '2026-07-17T15:00:00Z',
    durationMinutes: 60,
    content: '引导患者用简易卡纸、彩带和胶水制作夏季迎新贴画，鼓励与其他康复人员协作互动。',
    summary: '能够集中注意力40分钟，并在志愿者的协助下独立完成了向日葵图案的粘贴。精细动作良好。',
    recorderName: '李国强',
    createdAt: '2026-07-17T15:10:00Z',
    details: {
      craftType: '拼贴',
      materials: '彩色卡纸、环保白乳胶、不干胶、毛线',
      completionLevel: '全部完成',
      fineMotor: '一般',
      creativityScore: '良',
    }
  }
];

// Initial Home Visits
export const INITIAL_VISITS: HomeVisit[] = [
  {
    id: 'visit-001',
    studentId: 'stu-001',
    studentName: '测试学员一',
    siteId: 'site-a-1',
    visitDate: '2026-07-10',
    visitMethod: '入户探访',
    visitorName: '李国强',
    reason: '例行入户随访及药物核对',
    mentalStatus: '基本稳定',
    medicationStatus: '规律',
    socialFunction: '一般',
    riskLevel: '无风险',
    familyCommunication: '与其弟弟沟通融洽，家属反映近期睡眠尚可，白天无大声自语现象。',
    emotionalState: '平和',
    medicationChecked: true,
    medicationNotes: '清点药片，与处方量完全吻合。叮嘱家属继续督导服药。',
    nextVisitDate: '2026-07-24',
  }
];

// System Announcements
export const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann-1',
    title: '关于开展2026年夏季防暑降温与精康学员入户心理关爱专项行动的通知',
    content: '各乡镇服务点：近期气温持续走高，精神障碍患者易发生情绪波动及药物不良反应。请各点社工在入户康复时重点检查患者的用药储存环境，宣传防暑常识，并做好应急干预准备。遇到异常精神状况务必第一时间上报中心。',
    createdAt: '2026-07-15T08:00:00Z',
    createdBy: '张主任',
  },
  {
    id: 'ann-2',
    title: '系统数据安全管理与权限规范化核查',
    content: '为贯彻国家数据安全和个人隐私保护规范，严禁任何社工跨站点导出、拍照、传播学员档案数据。本系统已升级三级数据隔离机制与全量写操作同步审计。所有检索及下载日志将被记录备查。',
    createdAt: '2026-07-10T09:00:00Z',
    createdBy: '总站管理员',
  }
];

// Initial Drugs Dictionary
export const DRUGS_DICTIONARY = [
  { name: '阿立哌唑片', category: '抗精神病药' },
  { name: '奥氮平片', category: '抗精神病药' },
  { name: '利培酮片', category: '抗精神病药' },
  { name: '富马酸喹硫平片', category: '抗精神病药' },
  { name: '盐酸苯海索片', category: '抗精神病药（副作用控制）' },
  { name: '碳酸锂缓释片', category: '心境稳定剂' },
  { name: '丙戊酸钠缓释片', category: '心境稳定剂' },
  { name: '盐酸舍曲林片', category: '抗抑郁药' },
  { name: '盐酸帕罗西汀片', category: '抗抑郁药' },
  { name: '草酸艾司西酞普兰片', category: '抗抑郁药' },
  { name: '劳拉西泮片', category: '抗焦虑药' },
  { name: '艾司唑仑片', category: '镇静催眠药' }
];

// Definition of 9 Training Types
export const TRAINING_TYPES = [
  { code: '服药训练', name: '服药训练' },
  { code: '预防复发训练', name: '预防复发训练' },
  { code: '躯体管理训练', name: '躯体管理/体能训练' },
  { code: '生活技能训练', name: '生活技能训练' },
  { code: '社交技能训练', name: '社交技能训练' },
  { code: '职业康复训练', name: '职业康复训练' },
  { code: '情绪训练', name: '情绪训练(心理治疗)' },
  { code: '同伴支持', name: '同伴支持' },
  { code: '家庭支持训练', name: '家庭支持训练' },
  { code: '手工训练', name: '手工训练' },
  { code: '认知训练', name: '认知训练' }
];
