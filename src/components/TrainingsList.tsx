/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  X, 
  Eye, 
  Trash2, 
  Activity, 
  Calendar, 
  ClipboardList, 
  Award,
  Clock,
  MapPin,
  Pill,
  Frown,
  BrainCircuit,
  HeartPulse,
  Smile,
  Hammer,
  Sparkles
} from 'lucide-react';
import { Student, TrainingRecord } from '../types';
import { DRUGS_DICTIONARY, TRAINING_TYPES } from '../data';

interface TrainingsListProps {
  trainings: TrainingRecord[];
  students: Student[];
  onAddTraining: (newTraining: TrainingRecord) => void;
  onDeleteTraining: (id: string) => void;
  currentUser: {
    realName: string;
    role: string;
    siteId: string;
    town: string;
  };
  selectedSubTrainingType?: string | null;
}

export default function TrainingsList({ 
  trainings, 
  students, 
  onAddTraining, 
  onDeleteTraining,
  currentUser,
  selectedSubTrainingType
}: TrainingsListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<TrainingRecord | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // New Training Record Values
  const [formValues, setFormValues] = useState({
    studentId: '',
    title: '',
    trainingType: '服药训练',
    trainingMethod: '个案管理' as '个案管理' | '入户康复' | '社区活动',
    trainingLevel: '第一级' as '第一级' | '第二级' | '第三级' | '第四级',
    location: '患者居所' as '患者居所' | '康复机构' | '其他',
    startTime: '2026-07-17T09:00',
    endTime: '2026-07-17T09:30',
    content: '',
    summary: '',
    // Subform details
    drugName: DRUGS_DICTIONARY[0].name,
    dosage: '10mg',
    adverseReactions: '无',
    preScore: 5,
    postScore: 5,
    exerciseType: '散步',
    craftType: '折纸',
    employmentGoal: '庇护性就业',
    skillArea: '个人生活技能',
    cooperationLevel: '积极',
    cognitiveDomain: '注意力'
  });

  // Eligible students
  const eligibleStudents = useMemo(() => {
    return students.filter(s => {
      if (s.status !== 'active') return false;
      if (currentUser.role !== 'admin' && s.town !== currentUser.town) return false;
      return true;
    });
  }, [students, currentUser]);

  // Accessible training records based on town boundary
  const accessibleTrainings = useMemo(() => {
    let list = trainings;
    if (currentUser.role !== 'admin') {
      const townStudentIds = students.filter(s => s.town === currentUser.town).map(s => s.id);
      list = list.filter(t => townStudentIds.includes(t.studentId));
    }
    return list;
  }, [trainings, students, currentUser]);

  // Filter listings
  const filteredTrainings = useMemo(() => {
    return accessibleTrainings.filter(t => {
      const matchQuery = searchQuery.trim() 
        ? t.studentName.includes(searchQuery.trim()) || t.title.includes(searchQuery.trim())
        : true;
      const matchType = selectedSubTrainingType 
        ? t.trainingType === selectedSubTrainingType 
        : (typeFilter ? t.trainingType === typeFilter : true);
      return matchQuery && matchType;
    });
  }, [accessibleTrainings, searchQuery, typeFilter, selectedSubTrainingType]);

  // Submit action
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValues.studentId) {
      alert('请选择参与此康复训练项目的学员。');
      return;
    }
    if (!formValues.title) {
      alert('请输入此次训练记录的主题标题。');
      return;
    }

    const matchedStu = students.find(s => s.id === formValues.studentId);
    if (!matchedStu) return;

    // Calculate duration in minutes
    const startMs = new Date(formValues.startTime).getTime();
    const endMs = new Date(formValues.endTime).getTime();
    const diffMins = Math.max(10, Math.round((endMs - startMs) / 60000)) || 30;

    // Package dynamic fields according to type
    let details: Record<string, any> = {};
    if (formValues.trainingType === '服药训练') {
      details = {
        drugName: formValues.drugName,
        dosage: formValues.dosage,
        adverseReactions: formValues.adverseReactions,
      };
    } else if (formValues.trainingType === '情绪训练') {
      details = {
        preScore: formValues.preScore,
        postScore: formValues.postScore,
      };
    } else if (formValues.trainingType === '手工训练') {
      details = {
        craftType: formValues.craftType,
      };
    } else if (formValues.trainingType === '职业康复训练') {
      details = {
        employmentGoal: formValues.employmentGoal,
      };
    } else if (formValues.trainingType === '生活技能训练') {
      details = {
        skillArea: formValues.skillArea,
      };
    } else if (formValues.trainingType === '家庭支持训练') {
      details = {
        cooperationLevel: formValues.cooperationLevel,
      };
    } else if (formValues.trainingType === '认知训练') {
      details = {
        cognitiveDomain: formValues.cognitiveDomain,
      };
    } else {
      details = {
        exerciseType: formValues.exerciseType,
      };
    }

    const newRecord: TrainingRecord = {
      id: `train-${Date.now()}`,
      studentId: formValues.studentId,
      studentName: matchedStu.name,
      siteId: matchedStu.siteId,
      title: formValues.title,
      trainingType: formValues.trainingType,
      trainingMethod: formValues.trainingMethod,
      trainingLevel: formValues.trainingLevel,
      location: formValues.location,
      startTime: formValues.startTime + ':00Z',
      endTime: formValues.endTime + ':00Z',
      durationMinutes: diffMins,
      content: formValues.content,
      summary: formValues.summary,
      recorderName: currentUser.realName,
      createdAt: new Date().toISOString(),
      details,
    };

    onAddTraining(newRecord);
    setIsFormOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Consolidated Action Toolbar (Single Horizontal Line Layout) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-200/80 gap-3">
        {/* Left: Search input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="搜索学员姓名 / 训练标题..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:bg-white focus:border-slate-400 transition-all text-slate-800"
          />
        </div>

        {/* Center: Training type dropdown / state */}
        <div className="shrink-0 flex items-center">
          {selectedSubTrainingType ? (
            <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-[#1c3652] flex items-center gap-1">
              <span>二级菜单筛选：{selectedSubTrainingType}</span>
            </div>
          ) : (
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:bg-white focus:border-slate-400 transition-all text-slate-800"
            >
              <option value="">全部康复门类</option>
              {TRAINING_TYPES.map(t => <option key={t.code} value={t.code}>{t.name}</option>)}
            </select>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              if (eligibleStudents.length === 0) {
                alert('当前无在册活跃的康复对象。请先在「学员档案管理」中添加学员档案。');
                return;
              }
              setFormValues({
                studentId: eligibleStudents[0]?.id || '',
                title: '服药日常宣导与自我给药训练',
                trainingType: '服药训练',
                trainingMethod: '个案管理',
                trainingLevel: '第一级',
                location: '患者居所',
                startTime: '2026-07-17T09:00',
                endTime: '2026-07-17T09:30',
                content: '指导患者核准今日精神药物处方，教授早晚分装盒管理，模拟拒药时情绪应对。',
                summary: '学员在辅导下能配合服药，对阿立哌唑副作用认知有明显提升。',
                drugName: DRUGS_DICTIONARY[0].name,
                dosage: '10mg',
                adverseReactions: '无',
                preScore: 5,
                postScore: 7,
                exerciseType: '太极拳',
                craftType: '剪纸',
                employmentGoal: '辅助性安置',
                skillArea: '个人生活技能',
                cooperationLevel: '积极',
                cognitiveDomain: '记忆力训练'
              });
              setIsFormOpen(true);
            }}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-lg text-xs font-bold cursor-pointer transition-all shrink-0 h-[34px]"
          >
            <Plus className="h-4 w-4" />
            <span>登记训练随记</span>
          </button>
        </div>
      </div>

      {/* Training Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-5">参与学员</th>
                <th className="py-3.5 px-5">康复训练项目</th>
                <th className="py-3.5 px-5">康复门类</th>
                <th className="py-3.5 px-5">组织方式</th>
                <th className="py-3.5 px-5 text-center">训练时长</th>
                <th className="py-3.5 px-5">训练地点</th>
                <th className="py-3.5 px-5">记录责任人</th>
                <th className="py-3.5 px-5 text-right">业务操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 font-medium text-slate-700">
              {filteredTrainings.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-5 font-bold text-slate-900">{t.studentName}</td>
                  <td className="py-3 px-5">
                    <span className="font-semibold block text-slate-800">{t.title}</span>
                    <span className="text-[10px] text-slate-400 font-mono block mt-0.5">{t.startTime.substring(0, 16).replace('T', ' ')}</span>
                  </td>
                  <td className="py-3 px-5">
                    <span className="inline-flex px-2 py-0.5 bg-slate-100 text-slate-700 font-bold rounded text-[10px]">
                      {t.trainingType}
                    </span>
                  </td>
                  <td className="py-3 px-5">{t.trainingMethod}</td>
                  <td className="py-3 px-5 text-center font-mono font-bold text-slate-800">{t.durationMinutes} 分钟</td>
                  <td className="py-3 px-5 text-slate-600">{t.location}</td>
                  <td className="py-3 px-5 text-slate-600 font-semibold">{t.recorderName}</td>
                  <td className="py-3 px-5 text-right space-x-1.5 whitespace-nowrap">
                    <button
                      onClick={() => { setSelectedRecord(t); setIsDetailOpen(true); }}
                      className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded transition-colors cursor-pointer text-[11px]"
                    >
                      <Eye className="h-3 w-3" />
                      <span>查看小结</span>
                    </button>
                    {currentUser.role === 'admin' && (
                      <button
                        onClick={() => {
                          if (confirm('是否物理删除此单次康复演练数据？此记录会从统计看板同步剔除。')) {
                            onDeleteTraining(t.id);
                          }
                        }}
                        className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 px-2 py-1 rounded transition-colors cursor-pointer text-[11px]"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>删除</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredTrainings.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400 font-medium">
                    没有检索到符合过滤条件的学员训练项记录
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: VIEW TRAINING RECORD AND SUMMARY */}
      {isDetailOpen && selectedRecord && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden flex flex-col my-8 border border-slate-200">
            {/* Header */}
            <div className="px-6 py-4 bg-[#1a2d42] text-white flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <BrainCircuit className="h-5 w-5 text-cyan-400" />
                <h3 className="text-base font-bold">康复课训练小结 ── {selectedRecord.studentName}</h3>
              </div>
              <button 
                onClick={() => setIsDetailOpen(false)}
                className="p-1 hover:bg-[#2a4563] rounded-lg transition-colors text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[65vh] space-y-5 text-xs text-slate-800">
              <div className="grid grid-cols-2 gap-4 border-b border-slate-100 pb-3">
                <div><span className="text-slate-400 block mb-0.5">训练项目主题</span><span className="font-bold text-slate-900 text-sm">{selectedRecord.title}</span></div>
                <div><span className="text-slate-400 block mb-0.5">康复训练门类</span><span className="font-bold text-slate-800">{selectedRecord.trainingType}</span></div>
                <div><span className="text-slate-400 block mb-0.5">授课导师/社工</span><span className="font-semibold">{selectedRecord.recorderName}</span></div>
                <div>
                  <span className="text-slate-400 block mb-0.5">时间与时长</span>
                  <span className="font-semibold font-mono flex items-center gap-1">
                    <Clock className="h-3 w-3 text-slate-400" />
                    <span>{selectedRecord.startTime.substring(0, 16).replace('T', ' ')} (共计{selectedRecord.durationMinutes}分钟)</span>
                  </span>
                </div>
              </div>

              {/* Dynamic properties display based on selectedRecord.trainingType */}
              {selectedRecord.details && Object.keys(selectedRecord.details).length > 0 && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-1.5">
                  <div className="font-bold text-[#2b4c70] border-b border-slate-200/60 pb-1 flex items-center gap-1">
                    <Award className="h-4 w-4" />
                    <span>该门类特有检测指标</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-2 text-[11px]">
                    {Object.entries(selectedRecord.details).map(([key, val]) => {
                      let cnName = key;
                      if (key === 'drugName') cnName = '药品名称';
                      else if (key === 'dosage') cnName = '用药剂量';
                      else if (key === 'adverseReactions') cnName = '伴随不良反应';
                      else if (key === 'preScore') cnName = '练习前评分';
                      else if (key === 'postScore') cnName = '练习后评分';
                      else if (key === 'craftType') cnName = '手工材料类别';
                      else if (key === 'employmentGoal') cnName = '职业规划安置意向';
                      else if (key === 'skillArea') cnName = '生活自理范畴';
                      else if (key === 'cooperationLevel') cnName = '家属协同配合度';
                      else if (key === 'cognitiveDomain') cnName = '认知障碍训练领域';

                      return (
                        <div key={key}>
                          <span className="text-slate-400 block">{cnName}</span>
                          <span className="font-bold text-slate-800">{Array.isArray(val) ? val.join('，') : val}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Training process details */}
              <div className="space-y-1">
                <span className="text-slate-400 font-bold block">1. 活动过程/操作要领记录</span>
                <p className="bg-slate-50 border border-slate-100 p-3 rounded-lg text-slate-700 leading-relaxed font-medium">
                  {selectedRecord.content}
                </p>
              </div>

              {/* Patient feedback summary */}
              <div className="space-y-1">
                <span className="text-slate-400 font-bold block">2. 训练效果与自我控制小结</span>
                <p className="bg-blue-50/40 text-[#1a2d42] border border-blue-100 p-3 rounded-lg leading-relaxed font-medium">
                  {selectedRecord.summary}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setIsDetailOpen(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD TRAINING RECORD FORM */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-xl overflow-hidden flex flex-col my-8 border border-slate-200">
            {/* Header */}
            <div className="px-6 py-4 bg-[#1a2d42] text-white flex justify-between items-center">
              <h3 className="text-base font-bold">登记单次康复演练活动记录</h3>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="p-1 hover:bg-[#2a4563] rounded-lg transition-colors text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto max-h-[60vh] p-6 space-y-4 text-xs text-slate-800">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">选择受训学员 *</label>
                  <select
                    value={formValues.studentId}
                    onChange={(e) => setFormValues(prev => ({ ...prev, studentId: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 font-medium"
                    required
                  >
                    <option value="">-- 选择学员 --</option>
                    {eligibleStudents.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.town})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">康复训练门类 *</label>
                  <select
                    value={formValues.trainingType}
                    onChange={(e) => {
                      const type = e.target.value;
                      // set realistic template title based on type selection to improve user typing efficiency
                      let matchedTitle = '康复基础演练';
                      if (type === '服药训练') matchedTitle = '服药依从性提升与自我给药训练';
                      else if (type === '预防复发训练') matchedTitle = '复发先兆识别与自我干预讲座';
                      else if (type === '生活技能训练') matchedTitle = '日常生活自理技能实操演习';
                      else if (type === '社交技能训练') matchedTitle = '人际交往沟通与角色模拟小组';
                      else if (type === '情绪训练') matchedTitle = '心理支持与自我放松调控练习';
                      else if (type === '家庭支持训练') matchedTitle = '家属护理宣教与家庭支持小组';
                      else if (type === '手工训练') matchedTitle = '简易手工作品剪切拼贴精细运动';
                      else if (type === '认知训练') matchedTitle = '脑部注意力与记忆认知对抗锻炼';

                      setFormValues(prev => ({ ...prev, trainingType: type, title: matchedTitle }));
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 font-medium"
                  >
                    {TRAINING_TYPES.map(t => <option key={t.code} value={t.code}>{t.name}</option>)}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">训练项目名称主题 *</label>
                  <input
                    type="text"
                    value={formValues.title}
                    onChange={(e) => setFormValues(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 font-semibold"
                    placeholder="请输入简洁的康复主题"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">业务组织形式 *</label>
                  <select
                    value={formValues.trainingMethod}
                    onChange={(e) => setFormValues(prev => ({ ...prev, trainingMethod: e.target.value as any }))}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 font-medium"
                  >
                    <option value="个案管理">个案管理 (1对1专员)</option>
                    <option value="入户康复">入户康复 (送教上门)</option>
                    <option value="社区活动">社区活动 (集中训练)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">训练演练地点 *</label>
                  <select
                    value={formValues.location}
                    onChange={(e) => setFormValues(prev => ({ ...prev, location: e.target.value as any }))}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 font-medium"
                  >
                    <option value="患者居所">患者居所</option>
                    <option value="康复机构">社区康复中心站点</option>
                    <option value="其他">其他户外公共场合</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">训练级别 *</label>
                  <select
                    value={formValues.trainingLevel}
                    onChange={(e) => setFormValues(prev => ({ ...prev, trainingLevel: e.target.value as any }))}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 font-medium"
                  >
                    <option value="第一级">第一级 (基础普及)</option>
                    <option value="第二级">第二级 (中等恢复)</option>
                    <option value="第三级">第三级 (全面重返)</option>
                    <option value="第四级">第四级 (转介后随访)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">起始时间 *</label>
                  <input
                    type="datetime-local"
                    value={formValues.startTime}
                    onChange={(e) => setFormValues(prev => ({ ...prev, startTime: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 font-mono font-medium"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">结束时间 *</label>
                  <input
                    type="datetime-local"
                    value={formValues.endTime}
                    onChange={(e) => setFormValues(prev => ({ ...prev, endTime: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 font-mono font-medium"
                    required
                  />
                </div>
              </div>

              {/* DYNAMIC SUBFORM PORTION - HIGH PROFESSIONAL DESIGN */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Award className="h-4 w-4 text-cyan-600" />
                  <span>各门类特有校验指标填报 ─ {formValues.trainingType}</span>
                </div>

                {formValues.trainingType === '服药训练' && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-600 block">所涉治疗药物</label>
                      <select
                        value={formValues.drugName}
                        onChange={(e) => setFormValues(prev => ({ ...prev, drugName: e.target.value }))}
                        className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg font-medium text-xs"
                      >
                        {DRUGS_DICTIONARY.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-600 block">剂量</label>
                      <input
                        type="text"
                        value={formValues.dosage}
                        onChange={(e) => setFormValues(prev => ({ ...prev, dosage: e.target.value }))}
                        className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg font-medium text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-600 block">不良反应</label>
                      <select
                        value={formValues.adverseReactions}
                        onChange={(e) => setFormValues(prev => ({ ...prev, adverseReactions: e.target.value }))}
                        className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg font-medium text-xs"
                      >
                        <option value="无">无不良反应</option>
                        <option value="轻度嗜睡">轻度嗜睡</option>
                        <option value="口干便秘">口干便秘</option>
                        <option value="头晕乏力">头晕乏力</option>
                      </select>
                    </div>
                  </div>
                )}

                {formValues.trainingType === '情绪训练' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-600 block">训练前患者易激惹度 / 焦虑水平 (1-10)</label>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={formValues.preScore}
                        onChange={(e) => setFormValues(prev => ({ ...prev, preScore: parseInt(e.target.value) || 5 }))}
                        className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg font-mono text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-600 block">训练后情绪平和度 / 舒张评级 (1-10)</label>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={formValues.postScore}
                        onChange={(e) => setFormValues(prev => ({ ...prev, postScore: parseInt(e.target.value) || 5 }))}
                        className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg font-mono text-xs"
                      />
                    </div>
                  </div>
                )}

                {formValues.trainingType === '手工训练' && (
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600 block">手工及精细动作训练范畴</label>
                    <select
                      value={formValues.craftType}
                      onChange={(e) => setFormValues(prev => ({ ...prev, craftType: e.target.value }))}
                      className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg font-medium text-xs"
                    >
                      <option value="折纸">折纸剪纸工艺</option>
                      <option value="拼贴">卡纸图案粘贴</option>
                      <option value="编织">简易绳带手工编制</option>
                    </select>
                  </div>
                )}

                {formValues.trainingType === '职业康复训练' && (
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600 block">未来职业性辅助安置目标</label>
                    <select
                      value={formValues.employmentGoal}
                      onChange={(e) => setFormValues(prev => ({ ...prev, employmentGoal: e.target.value }))}
                      className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg font-medium text-xs"
                    >
                      <option value="庇护性就业">庇护性安置 (车间辅助手工)</option>
                      <option value="支持性就业">支持性就业 (公益岗位指导)</option>
                      <option value="竞争性就业">竞争性就业 (完全融入一般工作岗位)</option>
                    </select>
                  </div>
                )}

                {formValues.trainingType === '生活技能训练' && (
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600 block">自理技能实操演习范围</label>
                    <select
                      value={formValues.skillArea}
                      onChange={(e) => setFormValues(prev => ({ ...prev, skillArea: e.target.value }))}
                      className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg font-medium text-xs"
                    >
                      <option value="个人生活技能">个人生活技能 (洁面/洗漱/洗手/整理衣物)</option>
                      <option value="家庭生活技能">家庭生活技能 (打扫屋子/简易垃圾分类/简易烹饪)</option>
                    </select>
                  </div>
                )}

                {formValues.trainingType === '家庭支持训练' && (
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600 block">家属在随访中的护理及监督配合意向</label>
                    <select
                      value={formValues.cooperationLevel}
                      onChange={(e) => setFormValues(prev => ({ ...prev, cooperationLevel: e.target.value }))}
                      className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg font-medium text-xs"
                    >
                      <option value="积极">非常积极 (主动监督服药并记录情绪)</option>
                      <option value="一般">配合一般 (能按时领取药物但疏于活动辅导)</option>
                      <option value="被动">配合度低/疏于管教</option>
                    </select>
                  </div>
                )}

                {formValues.trainingType === '认知训练' && (
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600 block">认知干预训练领域</label>
                    <select
                      value={formValues.cognitiveDomain}
                      onChange={(e) => setFormValues(prev => ({ ...prev, cognitiveDomain: e.target.value }))}
                      className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg font-medium text-xs"
                    >
                      <option value="记忆力训练">记忆力训练 (数字拼图与色彩识记)</option>
                      <option value="注意力训练">注意力训练 (卡片分类与指令听从演练)</option>
                      <option value="执行能力训练">执行能力训练 (两步指令计划排序)</option>
                    </select>
                  </div>
                )}

                {formValues.trainingType !== '服药训练' && 
                 formValues.trainingType !== '情绪训练' && 
                 formValues.trainingType !== '手工训练' && 
                 formValues.trainingType !== '职业康复训练' && 
                 formValues.trainingType !== '生活技能训练' && 
                 formValues.trainingType !== '家庭支持训练' && 
                 formValues.trainingType !== '认知训练' && (
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600 block">体能运动康复方式</label>
                    <select
                      value={formValues.exerciseType}
                      onChange={(e) => setFormValues(prev => ({ ...prev, exerciseType: e.target.value }))}
                      className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg font-medium text-xs"
                    >
                      <option value="太极拳">太极拳/八段锦 (柔性全身关节运动)</option>
                      <option value="散步">慢跑散步 (有氧慢步心率调谐)</option>
                      <option value="广播操">工间广播体操练习</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">活动演练过程记录 (导师实操记录) *</label>
                <textarea
                  rows={3}
                  value={formValues.content}
                  onChange={(e) => setFormValues(prev => ({ ...prev, content: e.target.value }))}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 font-medium text-xs leading-relaxed"
                  placeholder="请输入具体的训练实操细节、使用道具、演练步骤等描述..."
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">训练小结与行为干预反馈 *</label>
                <textarea
                  rows={2}
                  value={formValues.summary}
                  onChange={(e) => setFormValues(prev => ({ ...prev, summary: e.target.value }))}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 font-medium text-xs leading-relaxed"
                  placeholder="评价本次康复对象的配合度、理解能力及成效表现小结..."
                  required
                />
              </div>
            </form>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
              >
                保存提交记录
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
