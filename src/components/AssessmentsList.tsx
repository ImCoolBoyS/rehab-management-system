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
  ClipboardList, 
  Scale, 
  FileCheck,
  TrendingDown,
  Info,
  CheckCircle2,
  AlertTriangle,
  User,
  Activity,
  Award
} from 'lucide-react';
import { Student, Assessment } from '../types';
import { uploadPdf, getPdfUrl } from '../lib/api';

interface AssessmentsListProps {
  assessments: Assessment[];
  students: Student[];
  onAddAssessment: (newAssessment: Assessment) => void;
  onDeleteAssessment: (id: string) => void;
  initialMainTab?: 'baseline' | 'process';
  initialProcessSubTab?: 'process1' | 'process2';
  currentUser: {
    role: string;
    siteId: string;
    town: string;
    realName: string;
  };
}

export default function AssessmentsList({ 
  assessments, 
  students, 
  onAddAssessment, 
  onDeleteAssessment,
  initialMainTab = 'baseline',
  initialProcessSubTab = 'process1',
  currentUser
}: AssessmentsListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [pdfFile, setPdfFile] = useState<{name: string, size: string, file?: File} | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Split tabs state: mainTab can be 'baseline' or 'process'
  const [activeMainTab, setActiveMainTab] = useState<'baseline' | 'process'>(initialMainTab);
  // Process sub-tab can be 'process1' (1st followup) or 'process2' (2nd followup)
  const [activeProcessSubTab, setActiveProcessSubTab] = useState<'process1' | 'process2'>(initialProcessSubTab);

  React.useEffect(() => {
    setActiveMainTab(initialMainTab);
  }, [initialMainTab]);

  React.useEffect(() => {
    setActiveProcessSubTab(initialProcessSubTab);
  }, [initialProcessSubTab]);

  // New assessment form state
  const [formValues, setFormValues] = useState({
    studentId: '',
    assessmentType: 'baseline' as 'baseline' | 'process1' | 'process2',
    assessDate: new Date().toISOString().substring(0, 10),
    assessor: currentUser.realName,
    overallImpression: '',
    psychoSocial: 50,
    mentalStatus: '仪容整洁。情绪正常，意志减退，自知力部分丧失。',
    sdss: 8,
    socialAdapt: 20,
    adl: 20,
    iadl: 12,
  });

  // Filter students accessible by current user for selection dropdown and completion board
  const eligibleStudents = useMemo(() => {
    return students.filter(s => {
      if (s.status !== 'active') return false;
      if (currentUser.role !== 'admin' && s.town !== currentUser.town) return false;
      return true;
    });
  }, [students, currentUser]);

  // Student assessments compliance status board (Colored cards based on Student Type)
  const studentComplianceData = useMemo(() => {
    return eligibleStudents.map(student => {
      // Find assessments for this student
      const studentAssess = assessments.filter(a => a.studentId === student.id);
      const hasBaseline = studentAssess.some(a => a.assessmentType === 'baseline');
      const hasProcess1 = studentAssess.some(a => a.assessmentType === 'process1');
      const hasProcess2 = studentAssess.some(a => a.assessmentType === 'process2');

      const serviceType = student.serviceType || 'type80';
      let isCompliant = false;

      if (serviceType === 'type80') {
        // Standard 80%: Needs 1 baseline and at least 1 process (process1 or process2)
        isCompliant = hasBaseline && (hasProcess1 || hasProcess2);
      } else {
        // Intensive 60%: Needs 1 baseline and BOTH process1 AND process2
        isCompliant = hasBaseline && hasProcess1 && hasProcess2;
      }

      return {
        student,
        hasBaseline,
        hasProcess1,
        hasProcess2,
        serviceType,
        isCompliant
      };
    });
  }, [eligibleStudents, assessments]);

  // Accessible assessments according to user town location (if not admin)
  const accessibleAssessments = useMemo(() => {
    let list = assessments;
    if (currentUser.role !== 'admin') {
      const townStudentIds = students.filter(s => s.town === currentUser.town).map(s => s.id);
      list = list.filter(a => townStudentIds.includes(a.studentId));
    }
    return list;
  }, [assessments, students, currentUser]);

  // Filter assessments list based on active tab state + search query
  const filteredAssessments = useMemo(() => {
    const targetType = activeMainTab === 'baseline' ? 'baseline' : activeProcessSubTab;
    return accessibleAssessments.filter(a => {
      const matchQuery = searchQuery.trim() 
        ? a.studentName.includes(searchQuery.trim()) || a.assessor.includes(searchQuery.trim())
        : true;
      const matchType = a.assessmentType === targetType;
      return matchQuery && matchType;
    });
  }, [accessibleAssessments, searchQuery, activeMainTab, activeProcessSubTab]);

  // Handle scoring submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValues.studentId) {
      alert('\u8bf7\u5148\u9009\u62e9\u9700\u8981\u8fdb\u884c\u8bc4\u4f30\u7684\u5eb7\u590d\u5bf9\u8c61\u3002');
      return;
    }

    const matchedStu = students.find(s => s.id === formValues.studentId);
    if (!matchedStu) return;

    // Strict Rule: One student only has one baseline, one process1, and one process2
    const hasAlreadyType = assessments.some(
      a => a.studentId === formValues.studentId && a.assessmentType === formValues.assessmentType
    );
    if (hasAlreadyType) {
      const labelMap: Record<string, string> = {
        baseline: '\u57fa\u7ebf\u8bc4\u4f30',
        process1: '\u7b2c\u4e00\u6b21\u8fc7\u7a0b\u8bc4\u4f30',
        process2: '\u7b2c\u4e8c\u6b21\u8fc7\u7a0b\u8bc4\u4f30'
      };
      alert(`\u62b1\u6b49\uff01\u8be5\u5b66\u5458\u5df2\u7ecf\u5f55\u5165\u8fc7 [ ${labelMap[formValues.assessmentType]} ] \u6863\u6848\uff0c\u8bf7\u52ff\u91cd\u590d\u6dfb\u52a0\u3002`);
      return;
    }

    // Upload PDF first if selected
    let pdfAttachment = undefined;
    if (pdfFile?.file) {
      setIsUploading(true);
      try {
        const uploadResult = await uploadPdf(pdfFile.file);
        pdfAttachment = {
          name: uploadResult.filename,
          size: uploadResult.size,
          filepath: uploadResult.filepath,
          uploadedAt: new Date().toISOString()
        };
      } catch (err) {
        alert('\u4e0a\u4f20 PDF \u5931\u8d25\uff0c\u8bf7\u91cd\u8bd5');
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    const newAssess: Assessment = {
      id: `assess-${Date.now()}`,
      studentId: formValues.studentId,
      studentName: matchedStu.name,
      siteId: matchedStu.siteId,
      assessmentType: formValues.assessmentType,
      assessDate: formValues.assessDate,
      assessor: formValues.assessor,
      overallImpression: formValues.overallImpression,
      scores: {
        psychoSocial: formValues.psychoSocial,
        mentalStatus: formValues.mentalStatus,
        sdss: formValues.sdss,
        socialAdapt: formValues.socialAdapt,
        adl: formValues.adl,
        iadl: formValues.iadl,
      },
      pdfAttachment
    };

    onAddAssessment(newAssess);
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
            placeholder="在当前分类下搜索评估患者姓名 / 责任社工..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:bg-white focus:border-slate-400 transition-all text-slate-800"
          />
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
                assessmentType: activeMainTab === 'baseline' ? 'baseline' : activeProcessSubTab,
                assessDate: new Date().toISOString().substring(0, 10),
                assessor: currentUser.realName,
                overallImpression: '',
                psychoSocial: 60,
                mentalStatus: '仪容整洁。情绪正常，自知力部分丧失。',
                sdss: 6,
                socialAdapt: 25,
                adl: 16,
                iadl: 10,
              });
              setPdfFile(null);
              setIsFormOpen(true);
            }}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-lg text-xs font-bold cursor-pointer transition-all shrink-0 h-[34px]"
          >
            <Plus className="h-4 w-4" />
            <span>录入量表测评</span>
          </button>
        </div>
      </div>

      {/* Evaluations Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-5">评估患者</th>
                <th className="py-3.5 px-5">评估类型</th>
                <th className="py-3.5 px-5">评估日期</th>
                <th className="py-3.5 px-5 text-center">心理社交功能 (0-100)</th>
                <th className="py-3.5 px-5 text-center">社会功能缺陷 (SDSS)</th>
                <th className="py-3.5 px-5 text-center">ADL / IADL评分</th>
                <th className="py-3.5 px-5">评估责任人</th>
                <th className="py-3.5 px-5 text-right">量表操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 font-medium text-slate-700">
              {filteredAssessments.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-5 font-bold text-slate-900">{a.studentName}</td>
                  <td className="py-3 px-5">
                    <span className={`inline-flex px-2.5 py-0.5 rounded text-[10px] font-bold border ${
                      a.assessmentType === 'baseline' 
                        ? 'bg-blue-50 text-blue-700 border-blue-200' 
                        : a.assessmentType === 'process1'
                        ? 'bg-teal-50 text-teal-700 border-teal-200'
                        : 'bg-purple-50 text-purple-700 border-purple-200'
                    }`}>
                      {a.assessmentType === 'baseline' 
                        ? '基线评估' 
                        : a.assessmentType === 'process1'
                        ? '第一次过程评估'
                        : '第二次过程评估'}
                    </span>
                  </td>
                  <td className="py-3 px-5 font-mono text-slate-500">{a.assessDate}</td>
                  <td className="py-3 px-5 text-center font-mono font-bold text-slate-800">{a.scores.psychoSocial} 分</td>
                  <td className="py-3 px-5 text-center font-mono text-slate-800">{a.scores.sdss} 分</td>
                  <td className="py-3 px-5 text-center font-mono text-slate-600">
                    {a.scores.adl} / {a.scores.iadl}
                  </td>
                  <td className="py-3 px-5 text-slate-600 font-semibold">{a.assessor}</td>
                  <td className="py-3 px-5 text-right space-x-1.5 whitespace-nowrap">
                    {a.pdfAttachment && (
                      <button
                        onClick={() => {
                          alert(`正在打开评估PDF原件档案：${a.pdfAttachment?.name}\n(大小: ${a.pdfAttachment?.size})`);
                        }}
                        className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded transition-colors text-[11px] cursor-pointer"
                        title="查看PDF扫描原件"
                      >
                        <FileCheck className="h-3 w-3" />
                        <span>PDF原件</span>
                      </button>
                    )}
                    <button
                      onClick={() => { setSelectedAssessment(a); setIsDetailOpen(true); }}
                      className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded transition-colors cursor-pointer text-[11px] font-bold"
                    >
                      <Eye className="h-3 w-3" />
                      <span>查看明细</span>
                    </button>
                    {currentUser.role === 'admin' && (
                      <button
                        onClick={() => {
                          if (confirm('确认永久作废并物理删除此量表评估记录？此操作不可恢复。')) {
                            onDeleteAssessment(a.id);
                          }
                        }}
                        className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 px-2 py-1 rounded transition-colors cursor-pointer text-[11px] font-bold"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>删除</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredAssessments.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400 font-medium">
                    当前列表分类下暂无已登记的评估测评档案
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: ASSESSMENT DETAIL MODAL */}
      {isDetailOpen && selectedAssessment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-xl overflow-hidden flex flex-col my-8 border border-slate-200">
            {/* Header */}
            <div className="px-6 py-4 bg-[#1a2d42] text-white flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <Scale className="h-5 w-5 text-cyan-400" />
                <h3 className="text-base font-bold">量表测评明细 ── {selectedAssessment.studentName}</h3>
              </div>
              <button 
                onClick={() => setIsDetailOpen(false)}
                className="p-1 hover:bg-[#2a4563] rounded-lg transition-colors text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content body */}
            <div className="p-6 overflow-y-auto max-h-[65vh] space-y-6 text-xs text-slate-800">
              <div className="grid grid-cols-3 gap-4 border-b border-slate-100 pb-3">
                <div>
                  <span className="text-slate-400 block mb-0.5">量表评估分类</span>
                  <span className="font-bold text-[#2b4c70]">
                    {selectedAssessment.assessmentType === 'baseline' 
                      ? '基线入户评估' 
                      : selectedAssessment.assessmentType === 'process1'
                      ? '第一次过程随访评估'
                      : '第二次过程随访评估'}
                  </span>
                </div>
                <div><span className="text-slate-400 block mb-0.5">评估责任人</span><span className="font-semibold">{selectedAssessment.assessor}</span></div>
                <div><span className="text-slate-400 block mb-0.5">评估日期</span><span className="font-semibold font-mono">{selectedAssessment.assessDate}</span></div>
              </div>

              {/* Six Scales Scores presentation */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                  <FileCheck className="h-4 w-4 text-[#4c8a8a]" />
                  <span>六大临床量表评分表现</span>
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                    <div className="flex justify-between font-semibold">
                      <span>1. 心理社交功能评估</span>
                      <span className="text-[#2b4c70] font-bold">{selectedAssessment.scores.psychoSocial} / 100 分</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-[#2b4c70] h-full" style={{ width: `${selectedAssessment.scores.psychoSocial}%` }} />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">分为社交技巧(25)、人际关系(35)、社区适应(40)三大维度。</p>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                    <div className="flex justify-between font-semibold">
                      <span>2. 社会功能缺陷筛选量表 (SDSS)</span>
                      <span className="text-amber-700 font-bold">{selectedAssessment.scores.sdss} / 20 分</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full" style={{ width: `${(selectedAssessment.scores.sdss / 20) * 100}%` }} />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">评估职业、婚姻、社会、家庭等方面受损缺陷状况。</p>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                    <div className="flex justify-between font-semibold">
                      <span>3. 社会适应能力评估</span>
                      <span className="text-[#4c8a8a] font-bold">{selectedAssessment.scores.socialAdapt} / 40 分</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-[#4c8a8a] h-full" style={{ width: `${(selectedAssessment.scores.socialAdapt / 40) * 100}%` }} />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">反映康复学员日常生活和社会情境的顺应融合度。</p>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                    <div className="flex justify-between font-semibold">
                      <span>4. 日常自理能力评估 (ADL/IADL)</span>
                      <span className="text-rose-700 font-bold">ADL: {selectedAssessment.scores.adl} / IADL: {selectedAssessment.scores.iadl}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">
                      ADL缺陷分界值为 &gt;22 分，IADL缺陷分界值为 &gt;=16 分。
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                  <div className="font-bold text-slate-800">5. 精神状况综合描述</div>
                  <p className="text-slate-600 leading-relaxed mt-1 text-[11px]">{selectedAssessment.scores.mentalStatus}</p>
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 text-xs">整体印象与跟进康复建议</h4>
                <div className="p-3 bg-blue-50/60 text-[#1a2d42] border border-blue-100 rounded-lg leading-relaxed font-medium">
                  {selectedAssessment.overallImpression || '未录入跟进建议'}
                </div>
              </div>

              {selectedAssessment.pdfAttachment && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center justify-between text-xs text-emerald-800 font-medium">
                  <div className="flex items-center gap-2">
                    <FileCheck className="h-5 w-5 text-emerald-600" />
                    <div>
                      <div className="font-bold">已绑定原始评估扫描件 (PDF)</div>
                      <div className="text-[10px] text-emerald-600 font-mono mt-0.5">文件名: {selectedAssessment.pdfAttachment.name} ({selectedAssessment.pdfAttachment.size})</div>
                    </div>
                  </div>
                  <button
                    onClick={() => { const url = getPdfUrl(selectedAssessment.pdfAttachment?.filepath || ''); if (url) window.open(url, '_blank'); else alert('找不到PDF文件'); }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold cursor-pointer"
                  >
                    下载原件
                  </button>
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

      {/* MODAL 2: ADD QUANTITATIVE EVALUATION FORM */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-xl overflow-hidden flex flex-col my-8 border border-slate-200">
            {/* Header */}
            <div className="px-6 py-4 bg-[#1a2d42] text-white flex justify-between items-center">
              <h3 className="text-base font-bold">录入新量表测评结果</h3>
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
                <div className="space-y-1 col-span-1">
                  <label className="font-bold text-slate-700 block">评估患者 *</label>
                  <select
                    value={formValues.studentId}
                    onChange={(e) => {
                      const id = e.target.value;
                      const matchedStu = eligibleStudents.find(s => s.id === id);
                      setFormValues(prev => ({ 
                        ...prev, 
                        studentId: id,
                        // Pre-select recommended type based on what they already have
                        assessmentType: prev.assessmentType 
                      }));
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 font-medium"
                    required
                  >
                    <option value="">-- 选择在档患者 --</option>
                    {eligibleStudents.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.town} - {s.serviceType === 'type60' ? '60%强化型' : '80%标准型'})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">测定类型标签 *</label>
                  <select
                    value={formValues.assessmentType}
                    onChange={(e) => setFormValues(prev => ({ ...prev, assessmentType: e.target.value as any }))}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 font-bold text-slate-800"
                  >
                    <option value="baseline">基线首次入户评估</option>
                    <option value="process1">第一次过程监测评估</option>
                    <option value="process2">第二次过程监测评估</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">测评完成日期 *</label>
                  <input
                    type="date"
                    value={formValues.assessDate}
                    onChange={(e) => setFormValues(prev => ({ ...prev, assessDate: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 font-mono font-medium"
                    required
                  />
                </div>
              </div>

              {/* Scoring Inputs */}
              <div className="space-y-3 border-t border-slate-100 pt-3">
                <div className="text-xs font-bold text-slate-700 tracking-wider uppercase flex items-center gap-1.5 mb-1">
                  <Scale className="h-4 w-4 text-[#4c8a8a]" />
                  <span>标准化临床量表客观评分</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-600 block">心理社交分值 (0-100)</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={formValues.psychoSocial}
                      onChange={(e) => setFormValues(prev => ({ ...prev, psychoSocial: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 font-mono font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-600 block">SDSS缺陷筛选分值 (0-20)</label>
                    <input
                      type="number"
                      min={0}
                      max={20}
                      value={formValues.sdss}
                      onChange={(e) => setFormValues(prev => ({ ...prev, sdss: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 font-mono font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-600 block">社会适应能力 (0-40)</label>
                    <input
                      type="number"
                      min={0}
                      max={40}
                      value={formValues.socialAdapt}
                      onChange={(e) => setFormValues(prev => ({ ...prev, socialAdapt: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 font-mono font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-600 block">ADL生活自理评估 (14-56)</label>
                    <input
                      type="number"
                      min={14}
                      max={56}
                      value={formValues.adl}
                      onChange={(e) => setFormValues(prev => ({ ...prev, adl: parseInt(e.target.value) || 14 }))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 font-mono font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-600 block">IADL自理评估 (8-32)</label>
                    <input
                      type="number"
                      min={8}
                      max={32}
                      value={formValues.iadl}
                      onChange={(e) => setFormValues(prev => ({ ...prev, iadl: parseInt(e.target.value) || 8 }))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 font-mono font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-600 block">评估责任社工</label>
                    <input
                      type="text"
                      value={formValues.assessor}
                      onChange={(e) => setFormValues(prev => ({ ...prev, assessor: e.target.value }))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 font-medium"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block mt-2">精神障碍症状综合陈述 *</label>
                  <input
                    type="text"
                    value={formValues.mentalStatus}
                    onChange={(e) => setFormValues(prev => ({ ...prev, mentalStatus: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 font-medium"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">整体印象跟进指导意见 *</label>
                  <textarea
                    rows={3}
                    value={formValues.overallImpression}
                    onChange={(e) => setFormValues(prev => ({ ...prev, overallImpression: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 font-medium"
                    placeholder="请输入对该精神障碍患者的整体评语及未来的康复建议方案。"
                    required
                  />
                </div>

                {/* PDF Drag & Drop */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">上传物理量表签名/盖章扫描原件 (PDF格式)</label>
                  <div 
                    className="border-2 border-dashed border-slate-300 hover:border-slate-400 bg-slate-50 p-4 rounded-xl text-center cursor-pointer transition-colors"
                    onClick={() => {
                      const fileInput = document.createElement('input');
                      fileInput.type = 'file';
                      fileInput.accept = '.pdf';
                      fileInput.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) {
                          setPdfFile({
                            name: file.name,
                            size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
                            file: file
                          });
                        }
                      };
                      fileInput.click();
                    }}
                  >
                    {pdfFile ? (
                      <div className="flex items-center justify-center gap-2 text-emerald-600 font-bold">
                        <FileCheck className="h-5 w-5" />
                        <span>已加挂 PDF: {pdfFile.name} ({pdfFile.size})</span>
                        <button 
                          type="button" 
                          onClick={(e) => { e.stopPropagation(); setPdfFile(null); }}
                          className="text-rose-500 hover:text-rose-700 font-bold ml-2 underline text-[10px] cursor-pointer"
                        >
                          清除
                        </button>
                      </div>
                    ) : (
                      <div className="text-slate-500 text-xs">
                        <p className="font-bold">点击选择 或 拖拽测评盖章PDF至此</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">支持标准化测评盖章/监护人签名扫描件，仅限 PDF 格式</p>
                      </div>
                    )}
                  </div>
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
                提交测评结果
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


