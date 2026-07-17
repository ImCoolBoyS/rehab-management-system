/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Site {
  id: string;
  name: string;
  town: string;
  siteType: '总站' | '乡镇站点';
  isActive: boolean;
}

export interface User {
  id: string;
  username: string;
  realName: string;
  gender: '男' | '女';
  role: 'admin' | 'supervisor' | 'worker';
  siteId: string;
  phone: string;
  password?: string; // Add password for custom login
  isActive: boolean;
  wechatOpenid?: string;
}

export interface Student {
  id: string;
  name: string;
  idCard: string;
  gender: '男' | '女';
  ethnicity: string;
  birthDate: string;
  age: number;
  phone: string;
  homePhone: string;
  address: string;
  maritalStatus: '已婚' | '未婚' | '离婚' | '丧偶' | '其他';
  livingSituation: string; // 居住情况
  hasDisabilityCert: boolean;
  disabilityType?: string;
  disabilityLevel?: string;
  hasDibao: boolean;
  contactPerson: string;
  contactPhone: string;
  coResidents: string[]; // 共同居住者
  coResidentRelation: '好' | '良好' | '一般' | '差' | '很差';
  livingEnvironment: '好' | '良好' | '一般' | '差' | '很差';
  economicStatus: '好' | '一般' | '较差' | '贫困';
  incomeSource: string[];
  moneyManagement: string;
  pastBehavior: string[];
  currentRisk: string;
  medicationCompliance: '规律' | '间断' | '不服药' | '医嘱勿须服药';
  medicationMethod?: string;
  medicationDetail?: string;
  town: string;
  village: string;
  siteId: string;
  status: 'active' | 'closed' | 'transferred';
  riskLevel: 'low' | 'medium' | 'high';
  serviceType: 'type80' | 'type60'; // 'type80': 1 baseline + 1 process + 3 trainings; 'type60': 1 baseline + 2 process + 9 trainings
  createdAt: string;
}

export interface Assessment {
  id: string;
  studentId: string;
  studentName: string;
  siteId: string;
  assessmentType: 'baseline' | 'process1' | 'process2';
  assessDate: string;
  assessor: string;
  roundNumber?: number; // for process
  overallImpression: string;
  scores: {
    psychoSocial: number; // 0-100
    mentalStatus: string; // Qualitative
    sdss: number; // 0-20
    socialAdapt: number; // 0-40
    adl: number; // 14-56
    iadl: number; // 8-32
  };
  pdfAttachment?: {
    name: string;
    size: string;
    uploadedAt: string;
  };
}

export interface TrainingRecord {
  id: string;
  studentId: string;
  studentName: string;
  siteId: string;
  title: string;
  trainingType: string; // 9大类
  trainingMethod: '个案管理' | '入户康复' | '社区活动';
  trainingLevel?: '第一级' | '第二级' | '第三级' | '第四级';
  location: '患者居所' | '康复机构' | '其他';
  startTime: string;
  endTime: string;
  durationMinutes: number;
  content: string;
  summary: string;
  recorderName: string;
  createdAt: string;
  // Dynamic fields based on trainingType
  details?: Record<string, any>;
}

export interface HomeVisit {
  id: string;
  studentId: string;
  studentName: string;
  siteId: string;
  visitDate: string;
  visitMethod: '入户探访' | '电话随访' | '社区见面';
  visitorName: string;
  reason: string;
  mentalStatus: '稳定' | '基本稳定' | '不稳定' | '恶化';
  medicationStatus: '规律' | '间断' | '不服药';
  socialFunction: '良好' | '一般' | '差';
  riskLevel: '无风险' | '低风险' | '中风险' | '高风险';
  familyCommunication: string;
  emotionalState: string;
  medicationChecked: boolean;
  medicationNotes: string;
  nextVisitDate?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  targetSiteIds?: string[]; // Empty for all
  createdBy: string;
  startDate?: string;
  endDate?: string;
}
