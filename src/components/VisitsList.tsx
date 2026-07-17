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
  Calendar, 
  Home, 
  PhoneCall, 
  AlertTriangle, 
  ShieldCheck,
  Check
} from 'lucide-react';
import { Student, HomeVisit } from '../types';

interface VisitsListProps {
  visits: HomeVisit[];
  students: Student[];
  onAddVisit: (newVisit: HomeVisit) => void;
  onDeleteVisit: (id: string) => void;
  currentUser: {
    realName: string;
    role: string;
    siteId: string;
    town: string;
  };
}

export default function VisitsList({ 
  visits, 
  students, 
  onAddVisit,
  onDeleteVisit,
  currentUser 
}: VisitsListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [mentalFilter, setMentalFilter] = useState('');
  const [selectedVisit, setSelectedVisit] = useState<HomeVisit | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // New Visit values
  const [formValues, setFormValues] = useState({
    studentId: '',
    visitDate: new Date().toISOString().substring(0, 10),
    visitMethod: '入户探访' as '入户探访' | '电话随访' | '社区见面',
    reason: '定期例行随访及患者精神状况评估',
    mentalStatus: '基本稳定' as '稳定' | '基本稳定' | '不稳定' | '恶化',
    medicationStatus: '规律' as '规律' | '间断' | '不服药',
    socialFunction: '一般' as '良好' | '一般' | '差',
    riskLevel: '无风险' as '无风险' | '低风险' | '中风险' | '高风险',
    familyCommunication: '',
    emotionalState: '平和',
    medicationChecked: true,
    medicationNotes: '清点处方药量，与患者弟弟核实服药正常，依从性规律。',
    nextVisitDate: '',
  });

  // Eligible students for the current login user
  const eligibleStudents = useMemo(() => {
    return students.filter(s => {
      if (s.status !== 'active') return false;
      if (currentUser.role !== 'admin' && s.town !== currentUser.town) return false;
      return true;
    });
  }, [students, currentUser]);

  // Accessible visits list
  const accessibleVisits = useMemo(() => {
    let list = visits;
    if (currentUser.role !== 'admin') {
      const townStudentIds = students.filter(s => s.town === currentUser.town).map(s => s.id);
      list = list.filter(v => townStudentIds.includes(v.studentId));
    }
    return list;
  }, [visits, students, currentUser]);

  // Filter list
  const filteredVisits = useMemo(() => {
    return accessibleVisits.filter(v => {
      const student = students.find(s => s.id === v.studentId);
      const query = searchQuery.trim().toLowerCase();
      let matchQuery = true;
      if (query) {
        const studentNameMatch = v.studentName.toLowerCase().includes(query);
        const visitorNameMatch = v.visitorName.toLowerCase().includes(query);
        const townMatch = student ? student.town.toLowerCase().includes(query) : false;
        const idCardMatch = student ? student.idCard.toLowerCase().includes(query) : false;
        matchQuery = studentNameMatch || visitorNameMatch || townMatch || idCardMatch;
      }
      const matchMental = mentalFilter ? v.mentalStatus === mentalFilter : true;
      return matchQuery && matchMental;
    });
  }, [accessibleVisits, searchQuery, mentalFilter, students]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValues.studentId) {
      alert('请选择被探访的康复对象。');
      return;
    }

    const matchedStu = students.find(s => s.id === formValues.studentId);
    if (!matchedStu) return;

    const newVisit: HomeVisit = {
      id: `visit-${Date.now()}`,
      studentId: formValues.studentId,
      studentName: matchedStu.name,
      siteId: matchedStu.siteId,
      visitDate: formValues.visitDate,
      visitMethod: formValues.visitMethod,
      visitorName: currentUser.realName,
      reason: formValues.reason,
      mentalStatus: formValues.mentalStatus,
      medicationStatus: formValues.medicationStatus,
      socialFunction: formValues.socialFunction,
      riskLevel: formValues.riskLevel,
      familyCommunication: formValues.familyCommunication,
      emotionalState: formValues.emotionalState,
      medicationChecked: formValues.medicationChecked,
      medicationNotes: formValues.medicationNotes,
      nextVisitDate: formValues.nextVisitDate || undefined,
    };

    onAddVisit(newVisit);
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
            placeholder="搜索被访学员 / 探访人员姓名..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:bg-white focus:border-slate-400 transition-all text-slate-800"
          />
        </div>

        {/* Center: Mental status filter dropdown */}
        <div className="shrink-0 flex items-center">
          <select
            value={mentalFilter}
            onChange={(e) => setMentalFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:bg-white focus:border-slate-400 transition-all text-slate-800"
          >
            <option value="">全部精神状况</option>
            <option value="稳定">精神状况稳定</option>
            <option value="基本稳定">状况基本稳定</option>
            <option value="不稳定">状况不稳定 (Doubt)</option>
            <option value="恶化">精神恶化 (Alert)</option>
          </select>
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
                visitDate: new Date().toISOString().substring(0, 10),
                visitMethod: '入户探访',
                reason: '例行随心访谈、药物核查及情绪测评',
                mentalStatus: '基本稳定',
                medicationStatus: '规律',
                socialFunction: '一般',
                riskLevel: '无风险',
                familyCommunication: '家属反馈情绪克制，白天有外出意愿，夜间睡眠稳定。',
                emotionalState: '平和且温顺',
                medicationChecked: true,
                medicationNotes: '清点包装，每日口服利培酮剂量正常。依从性判定为规律。',
                nextVisitDate: '',
              });
              setIsFormOpen(true);
            }}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-lg text-xs font-bold cursor-pointer transition-all shrink-0 h-[34px]"
          >
            <Plus className="h-4 w-4" />
            <span>记录随记</span>
          </button>
        </div>
      </div>

      {/* Visits Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-5">探访患者</th>
                <th className="py-3.5 px-5">探访日期</th>
                <th className="py-3.5 px-5">探访形式</th>
                <th className="py-3.5 px-5 text-center">精神波动状态</th>
                <th className="py-3.5 px-5 text-center">服药核对</th>
                <th className="py-3.5 px-5 text-center">危险倾向评定</th>
                <th className="py-3.5 px-5">探访专员</th>
                <th className="py-3.5 px-5 text-right">随记操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 font-medium text-slate-700">
              {filteredVisits.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-5 font-bold text-slate-900">{v.studentName}</td>
                  <td className="py-3 px-5 font-mono text-slate-500">{v.visitDate}</td>
                  <td className="py-3 px-5">
                    <span className="inline-flex items-center gap-1">
                      {v.visitMethod === '入户探访' ? (
                        <Home className="h-3 w-3 text-[#2b4c70]" />
                      ) : (
                        <PhoneCall className="h-3 w-3 text-cyan-600" />
                      )}
                      <span>{v.visitMethod}</span>
                    </span>
                  </td>
                  <td className="py-3 px-5 text-center">
                    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                      v.mentalStatus === '稳定' || v.mentalStatus === '基本稳定'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200 font-bold'
                    }`}>
                      {v.mentalStatus}
                    </span>
                  </td>
                  <td className="py-3 px-5 text-center">
                    {v.medicationChecked ? (
                      <span className="inline-flex items-center gap-0.5 text-emerald-600 font-semibold">
                        <Check className="h-3.5 w-3.5" />
                        <span>已核查</span>
                      </span>
                    ) : (
                      <span className="text-slate-400 font-mono">—</span>
                    )}
                  </td>
                  <td className="py-3 px-5 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      v.riskLevel === '无风险' ? 'bg-emerald-100 text-emerald-800' :
                      v.riskLevel === '低风险' ? 'bg-blue-100 text-blue-800' :
                      v.riskLevel === '中风险' ? 'bg-amber-100 text-amber-800 font-bold' :
                      'bg-rose-100 text-rose-800 font-bold'
                    }`}>
                      {v.riskLevel}
                    </span>
                  </td>
                  <td className="py-3 px-5 text-slate-600 font-semibold">{v.visitorName}</td>
                  <td className="py-3 px-5 text-right whitespace-nowrap space-x-1.5">
                    <button
                      onClick={() => { setSelectedVisit(v); setIsDetailOpen(true); }}
                      className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded transition-colors cursor-pointer text-[11px]"
                    >
                      <Eye className="h-3 w-3" />
                      <span>查看详情</span>
                    </button>
                    {currentUser.role !== 'worker' && (
                      <button
                        onClick={() => {
                          if (confirm(`警告：确认永久删除康复对象 [ ${v.studentName} ] 的此条随访记录吗？`)) {
                            onDeleteVisit(v.id);
                          }
                        }}
                        className="inline-flex items-center gap-1 text-red-700 hover:text-red-950 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded transition-colors cursor-pointer text-[11px]"
                        title="物理删除此记录"
                      >
                        <Trash2 className="h-3 w-3 text-red-600" />
                        <span>删除</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredVisits.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400 font-medium">
                    没有检索到任何有关被访学员的入户随记随诊记录
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: VIEW VISIT DETAIL DIARY */}
      {isDetailOpen && selectedVisit && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden flex flex-col my-8 border border-slate-200">
            {/* Header */}
            <div className="px-6 py-4 bg-[#1a2d42] text-white flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <Home className="h-5 w-5 text-cyan-400" />
                <h3 className="text-base font-bold">入户随记探记详情 ── {selectedVisit.studentName}</h3>
              </div>
              <button 
                onClick={() => setIsDetailOpen(false)}
                className="p-1 hover:bg-[#2a4563] rounded-lg transition-colors text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[65vh] space-y-4 text-xs text-slate-800">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-b border-slate-100 pb-3">
                <div><span className="text-slate-400 block mb-0.5">随记日期</span><span className="font-semibold font-mono">{selectedVisit.visitDate}</span></div>
                <div><span className="text-slate-400 block mb-0.5">探访方式</span><span className="font-semibold">{selectedVisit.visitMethod}</span></div>
                <div><span className="text-slate-400 block mb-0.5">随访社工专员</span><span className="font-semibold">{selectedVisit.visitorName}</span></div>
                <div><span className="text-slate-400 block mb-0.5">精神波动判定</span><span className="font-bold text-rose-700">{selectedVisit.mentalStatus}</span></div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 border border-slate-200 rounded-lg p-3 text-[11px]">
                <div>
                  <span className="text-slate-400 block">生活自理自理能力表现</span>
                  <span className="font-bold text-slate-800">{selectedVisit.socialFunction}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">服药核实</span>
                  <span className="font-bold text-slate-800">{selectedVisit.medicationStatus}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">异常精神危险倾向评定</span>
                  <span className="font-bold text-rose-700">{selectedVisit.riskLevel}</span>
                </div>
              </div>

              {selectedVisit.medicationChecked && (
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg space-y-1">
                  <span className="font-bold text-[#2b4c70] flex items-center gap-1">
                    <ShieldCheck className="h-4 w-4" />
                    <span>现场服药与用药处方核对意见</span>
                  </span>
                  <p className="text-slate-600 leading-relaxed text-[11px] mt-1">{selectedVisit.medicationNotes}</p>
                </div>
              )}

              <div className="space-y-1">
                <span className="text-slate-400 font-bold block">1. 探访具体事由与环境状况</span>
                <p className="bg-slate-50 border border-slate-100 p-3 rounded-lg text-slate-700 leading-relaxed font-medium">
                  {selectedVisit.reason}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 font-bold block">2. 共同居住家属护理与沟通记录</span>
                <p className="bg-blue-50/40 text-[#1a2d42] border border-blue-100 p-3 rounded-lg leading-relaxed font-medium">
                  {selectedVisit.familyCommunication || '家属今日未配合透露进一步动态。'}
                </p>
              </div>

              {selectedVisit.nextVisitDate && (
                <div className="p-3 bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-mono flex justify-between items-center text-slate-600">
                  <span>下次重点跟进排定日期建议</span>
                  <span className="font-bold text-slate-800">{selectedVisit.nextVisitDate}</span>
                </div>
              )}
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

      {/* MODAL 2: RECORD NEW DIARY */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden flex flex-col my-8 border border-slate-200">
            {/* Header */}
            <div className="px-6 py-4 bg-[#1a2d42] text-white flex justify-between items-center">
              <h3 className="text-base font-bold">录入入户随记/探记</h3>
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
                  <label className="font-bold text-slate-700 block">随访患者 *</label>
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
                  <label className="font-bold text-slate-700 block">随记探访形式 *</label>
                  <select
                    value={formValues.visitMethod}
                    onChange={(e) => setFormValues(prev => ({ ...prev, visitMethod: e.target.value as any }))}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 font-medium"
                  >
                    <option value="入户探访">入户面谈评估 (送药上门)</option>
                    <option value="电话随访">电话随访记录</option>
                    <option value="社区见面">社区康复点见面会谈</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">随访日期 *</label>
                  <input
                    type="date"
                    value={formValues.visitDate}
                    onChange={(e) => setFormValues(prev => ({ ...prev, visitDate: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 font-mono font-medium"
                    required
                  />
                </div>
              </div>

              {/* Status checklist metrics */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <span>随访临床生命状况指标排查</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-[11px]">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-600 block">精神安定状态评判</label>
                    <select
                      value={formValues.mentalStatus}
                      onChange={(e) => setFormValues(prev => ({ ...prev, mentalStatus: e.target.value as any }))}
                      className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg font-medium text-xs"
                    >
                      <option value="稳定">完全稳定</option>
                      <option value="基本稳定">状况基本稳定</option>
                      <option value="不稳定">状况不稳定 (Doubt)</option>
                      <option value="恶化">精神明显衰退恶化</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-600 block">服药规律级别</label>
                    <select
                      value={formValues.medicationStatus}
                      onChange={(e) => setFormValues(prev => ({ ...prev, medicationStatus: e.target.value as any }))}
                      className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg font-medium text-xs"
                    >
                      <option value="规律">正常规律遵医嘱服药</option>
                      <option value="间断">漏药/自行少服/藏药</option>
                      <option value="不服药">完全抗拒抗药</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-600 block">社会自理能力</label>
                    <select
                      value={formValues.socialFunction}
                      onChange={(e) => setFormValues(prev => ({ ...prev, socialFunction: e.target.value as any }))}
                      className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg font-medium text-xs"
                    >
                      <option value="良好">良好自理</option>
                      <option value="一般">部分协助自理</option>
                      <option value="差">丧失独立自理缺陷</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-600 block">当前危险倾向级别</label>
                    <select
                      value={formValues.riskLevel}
                      onChange={(e) => setFormValues(prev => ({ ...prev, riskLevel: e.target.value as any }))}
                      className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg font-medium text-xs"
                    >
                      <option value="无风险">无任何攻击性倾向</option>
                      <option value="低风险">低危风险倾向</option>
                      <option value="中风险">存在危害他人安全的风险</option>
                      <option value="高风险">存在极高自杀自伤风险</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60">
                  <input
                    type="checkbox"
                    id="medicationChecked"
                    checked={formValues.medicationChecked}
                    onChange={(e) => setFormValues(prev => ({ ...prev, medicationChecked: e.target.checked }))}
                    className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                  />
                  <label htmlFor="medicationChecked" className="font-bold text-slate-700 cursor-pointer">现场开展了患者服药储备实查及用药核对</label>
                </div>

                {formValues.medicationChecked && (
                  <div className="space-y-1 pt-1">
                    <label className="text-[10px] font-semibold text-slate-500 block">药物核查情况备忘记录</label>
                    <input
                      type="text"
                      value={formValues.medicationNotes}
                      onChange={(e) => setFormValues(prev => ({ ...prev, medicationNotes: e.target.value }))}
                      placeholder="例：现场清点奥氮平药量、检查了药盒分装、嘱咐家属继续配合监督"
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-medium text-xs"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">探访事由与居所基本环境描述 *</label>
                <textarea
                  rows={2}
                  value={formValues.reason}
                  onChange={(e) => setFormValues(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 font-medium text-xs leading-relaxed"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">共同居住家属督导访谈沟通日记 *</label>
                <textarea
                  rows={2}
                  value={formValues.familyCommunication}
                  onChange={(e) => setFormValues(prev => ({ ...prev, familyCommunication: e.target.value }))}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 font-medium text-xs leading-relaxed"
                  placeholder="请输入对家属的心理安抚、居家监督职责叮嘱、家庭日常生活支持状态细节描述..."
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">患者面谈情绪评定描述</label>
                  <input
                    type="text"
                    value={formValues.emotionalState}
                    onChange={(e) => setFormValues(prev => ({ ...prev, emotionalState: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 font-medium"
                    placeholder="如：平和、焦虑不语、情感反应淡漠、多疑等"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">计划下次重点探访日期 (提醒)</label>
                  <input
                    type="date"
                    value={formValues.nextVisitDate}
                    onChange={(e) => setFormValues(prev => ({ ...prev, nextVisitDate: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 font-mono font-medium"
                  />
                </div>
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
                确认保存随记
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
