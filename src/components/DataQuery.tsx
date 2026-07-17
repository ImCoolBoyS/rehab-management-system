/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Search, 
  FileSpreadsheet, 
  Download, 
  AlertTriangle, 
  CheckCircle2, 
  SlidersHorizontal,
  X,
  FileCheck,
  Check,
  Activity,
  Users
} from 'lucide-react';
import { Student, Assessment, TrainingRecord, Site } from '../types';

interface DataQueryProps {
  students: Student[];
  assessments: Assessment[];
  trainings: TrainingRecord[];
  sites: Site[];
  currentUser: {
    role: string;
    siteId: string;
    town: string;
  };
  onNavigateTab?: (tabId: string) => void;
}

export default function DataQuery({ 
  students, 
  assessments, 
  trainings, 
  sites,
  currentUser,
  onNavigateTab
}: DataQueryProps) {
  // Filter search states
  const [nameQuery, setNameQuery] = useState('');
  const [idQuery, setIdQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all'); // 'all', 'type80', 'type60'
  const [selectedTown, setSelectedTown] = useState<string>('all');
  const [selectedTrainingType, setSelectedTrainingType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all'); // 'all', 'complete', 'incomplete', 'missing_material'

  // Columns export customizer states
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportColumns, setExportColumns] = useState({
    name: true,
    idCard: true,
    serviceType: true,
    town: true,
    baselineDone: true,
    process1Done: true,
    process2Done: true,
    trainingsCount: true,
    pdfUploaded: true,
    complianceStatus: true,
  });

  // Extract unique list of towns from the accessible students for dropdown filtering
  const uniqueTowns = useMemo(() => {
    const allTowns = students
      .filter(s => currentUser.role === 'admin' || s.town === currentUser.town)
      .map(s => s.town)
      .filter((v, i, a) => v && a.indexOf(v) === i);
    return allTowns;
  }, [students, currentUser]);

  const TRAINING_TYPES = [
    '服药训练',
    '预防复发训练',
    '躯体管理训练',
    '生活技能训练',
    '社交技能训练',
    '职业康复训练',
    '情绪训练',
    '同伴支持',
    '家庭支持训练'
  ];

  // Compile compliance metrics and data for all accessible students
  const compiledData = useMemo(() => {
    return students
      .filter(student => {
        // Enforce role-based data isolation
        if (currentUser.role !== 'admin' && student.town !== currentUser.town) {
          return false;
        }
        return true;
      })
      .map(student => {
        // 1. Gather all assessments for this student
        const studentAssess = assessments.filter(a => a.studentId === student.id);
        const hasBaseline = studentAssess.some(a => a.assessmentType === 'baseline');
        const hasProcess1 = studentAssess.some(a => a.assessmentType === 'process1');
        const hasProcess2 = studentAssess.some(a => a.assessmentType === 'process2');
        const hasPdf = studentAssess.some(a => !!a.pdfAttachment);

        // 2. Gather all training records count for this student
        const studentTrainings = trainings.filter(t => t.studentId === student.id);
        const uniqueTrainingsDone = studentTrainings.map(t => t.trainingType).filter((v, i, a) => a.indexOf(v) === i);

        // 3. Define requirements based on service types
        // - Standard (type80): 1 baseline, 1 process assessment, and at least 3 distinct training sessions
        // - Intensive (type60): 1 baseline, 2 process assessments, and at least 9 training sessions within 3 months
        const serviceType = student.serviceType || 'type80';
        const meetsBaseline = hasBaseline;
        const meetsProcess = serviceType === 'type60' ? (hasProcess1 && hasProcess2) : (hasProcess1 || hasProcess2);
        
        const reqTrainingCount = serviceType === 'type60' ? 9 : 3;
        const meetsTraining = studentTrainings.length >= reqTrainingCount;

        const isCompliant = meetsBaseline && meetsProcess && meetsTraining;

        // 4. Identify exact missing items or material
        const issues: string[] = [];
        if (!meetsBaseline) issues.push('缺失「基线评估」');
        if (serviceType === 'type60') {
          if (!hasProcess1) issues.push('缺失「第一次过程评估」');
          if (!hasProcess2) issues.push('缺失「第二次过程评估」');
        } else {
          if (!hasProcess1 && !hasProcess2) issues.push('缺失至少一次「过程评估」');
        }
        if (studentTrainings.length < reqTrainingCount) {
          issues.push(`训练课时不足 (已录入 ${studentTrainings.length}/${reqTrainingCount} 次)`);
        }
        if (!hasPdf) {
          issues.push('评估缺少PDF扫描原件存档');
        }

        return {
          student,
          hasBaseline,
          hasProcess1,
          hasProcess2,
          hasPdf,
          trainingsCount: studentTrainings.length,
          uniqueTrainingsDone,
          isCompliant,
          issues,
          serviceType,
        };
      });
  }, [students, assessments, trainings, currentUser]);

  // Apply filters to compiled dataset
  const filteredData = useMemo(() => {
    return compiledData.filter(item => {
      // Name Filter
      if (nameQuery.trim() && !item.student.name.includes(nameQuery.trim())) {
        return false;
      }
      // ID Card Filter
      if (idQuery.trim() && !item.student.idCard.includes(idQuery.trim())) {
        return false;
      }
      // Student Type Filter
      if (selectedType !== 'all' && item.serviceType !== selectedType) {
        return false;
      }
      // Town Filter
      if (selectedTown !== 'all' && item.student.town !== selectedTown) {
        return false;
      }
      // Done Training Filter
      if (selectedTrainingType !== 'all' && !item.uniqueTrainingsDone.includes(selectedTrainingType)) {
        return false;
      }
      // Status filter:
      if (selectedStatus === 'complete' && !item.isCompliant) return false;
      if (selectedStatus === 'incomplete' && item.isCompliant) return false;
      if (selectedStatus === 'missing_material' && item.hasPdf) return false;

      return true;
    });
  }, [compiledData, nameQuery, idQuery, selectedType, selectedTown, selectedTrainingType, selectedStatus]);

  // Execute export file generation in CSV format
  const handleExportCSV = () => {
    const headers: string[] = [];
    const keys: string[] = [];

    if (exportColumns.name) { headers.push('学员姓名'); keys.push('name'); }
    if (exportColumns.idCard) { headers.push('身份证号'); keys.push('idCard'); }
    if (exportColumns.serviceType) { headers.push('学员类型'); keys.push('serviceType'); }
    if (exportColumns.town) { headers.push('乡镇/区域'); keys.push('town'); }
    if (exportColumns.baselineDone) { headers.push('基线评估'); keys.push('baselineDone'); }
    if (exportColumns.process1Done) { headers.push('过程随访1'); keys.push('process1Done'); }
    if (exportColumns.process2Done) { headers.push('过程随访2'); keys.push('process2Done'); }
    if (exportColumns.trainingsCount) { headers.push('训练课时数'); keys.push('trainingsCount'); }
    if (exportColumns.pdfUploaded) { headers.push('物理量表扫描件'); keys.push('pdfUploaded'); }
    if (exportColumns.complianceStatus) { headers.push('建档合规状态'); keys.push('complianceStatus'); }

    // Assemble rows
    const rows = filteredData.map(item => {
      const rowData: string[] = [];
      if (exportColumns.name) rowData.push(item.student.name);
      if (exportColumns.idCard) rowData.push(item.student.idCard);
      if (exportColumns.serviceType) rowData.push(item.serviceType === 'type60' ? '60%强化型' : '80%标准型');
      if (exportColumns.town) rowData.push(item.student.town);
      if (exportColumns.baselineDone) rowData.push(item.hasBaseline ? '已评估' : '缺失');
      if (exportColumns.process1Done) rowData.push(item.hasProcess1 ? '已评估' : '缺失');
      if (exportColumns.process2Done) rowData.push(item.hasProcess2 ? '已评估' : '缺失');
      if (exportColumns.trainingsCount) rowData.push(`${item.trainingsCount}次`);
      if (exportColumns.pdfUploaded) rowData.push(item.hasPdf ? '已上传' : '未加挂');
      if (exportColumns.complianceStatus) rowData.push(item.isCompliant ? '合规达标' : `不达标 (${item.issues.join('; ')})`);
      return rowData.join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `A市精康系统_数据综合查询导出_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExportModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Consolidated Action Toolbar (Single Horizontal Layout) */}
      <div className="flex flex-wrap items-center bg-white p-3.5 rounded-xl shadow-sm border border-slate-200/80 gap-3">
        {/* Filter 1: Student Name */}
        <div className="relative flex-1 min-w-[140px]">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="搜索姓名..."
            value={nameQuery}
            onChange={e => setNameQuery(e.target.value)}
            className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:bg-white text-slate-800"
          />
        </div>

        {/* Filter 2: ID Card */}
        <div className="relative w-32 shrink-0">
          <input
            type="text"
            placeholder="身份证号..."
            value={idQuery}
            onChange={e => setIdQuery(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:bg-white text-slate-800"
          />
        </div>

        {/* Filter 3: Service Type */}
        <div className="shrink-0">
          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value)}
            className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none text-slate-800 cursor-pointer"
          >
            <option value="all">全部服务类型</option>
            <option value="type80">80%标准服务</option>
            <option value="type60">60%强化服务</option>
          </select>
        </div>

        {/* Filter 4: Town */}
        <div className="shrink-0">
          <select
            value={selectedTown}
            onChange={e => setSelectedTown(e.target.value)}
            className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none text-slate-800 cursor-pointer"
            disabled={currentUser.role !== 'admin'}
          >
            <option value="all">{currentUser.role !== 'admin' ? currentUser.town : '全部街道乡镇'}</option>
            {currentUser.role === 'admin' && uniqueTowns.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* Filter 5: Done Trainings */}
        <div className="shrink-0">
          <select
            value={selectedTrainingType}
            onChange={e => setSelectedTrainingType(e.target.value)}
            className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none text-slate-800 cursor-pointer"
          >
            <option value="all">全部训练门类</option>
            {TRAINING_TYPES.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* Filter 6: Status Filter */}
        <div className="shrink-0">
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none text-slate-800 cursor-pointer"
          >
            <option value="all">全部合规状态</option>
            <option value="complete">建档合规达标</option>
            <option value="incomplete">指标课时缺失</option>
            <option value="missing_material">缺失物理量表PDF</option>
          </select>
        </div>

        {/* Reset Filters button */}
        {(nameQuery || idQuery || selectedType !== 'all' || selectedTown !== 'all' || selectedTrainingType !== 'all' || selectedStatus !== 'all') && (
          <button
            onClick={() => {
              setNameQuery('');
              setIdQuery('');
              setSelectedType('all');
              setSelectedTown('all');
              setSelectedTrainingType('all');
              setSelectedStatus('all');
            }}
            className="text-[11px] font-bold text-rose-500 hover:text-rose-700 hover:underline cursor-pointer flex items-center gap-1 shrink-0"
          >
            <X className="h-3 w-3" />
            <span>重置</span>
          </button>
        )}

        {/* Custom Export Button */}
        <button
          onClick={() => setIsExportModalOpen(true)}
          className="ml-auto flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#1c3652] hover:bg-[#152741] text-white rounded-lg text-xs font-bold shadow-md cursor-pointer transition-all shrink-0 h-[32px]"
        >
          <FileSpreadsheet className="h-4 w-4" />
          <span>自定义字段导出</span>
        </button>
      </div>

      {/* Main Results Board */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Statistics of results */}
        <div className="bg-slate-50 px-5 py-3 border-b border-slate-100 flex justify-between items-center text-xs">
          <div className="flex items-center gap-1.5 text-slate-600 font-bold">
            <Users className="h-4 w-4 text-slate-400" />
            <span>检索到符合条件的学员: <span className="text-[#1c3652] font-mono text-sm">{filteredData.length}</span> 名</span>
          </div>
          <div className="flex gap-4 font-bold text-slate-400 text-[10px]">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500"></span>合规达标: {filteredData.filter(i => i.isCompliant).length}名</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-rose-500"></span>不合规: {filteredData.filter(i => !i.isCompliant).length}名</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-3 px-5">学员</th>
                <th className="py-3 px-5">身份证号</th>
                <th className="py-3 px-5">街道乡镇</th>
                <th className="py-3 px-5">服务型分类</th>
                <th className="py-3 px-5 text-center">评估完整度</th>
                <th className="py-3 px-5 text-center">训练总课时</th>
                <th className="py-3 px-5">备注</th>
                <th className="py-3 px-5 text-right">合规状态</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredData.map(({ student, hasBaseline, hasProcess1, hasProcess2, hasPdf, trainingsCount, isCompliant, issues, serviceType }) => (
                <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-5">
                    <div>
                      <div className="font-bold text-slate-900">{student.name}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">建档社工: {student.guardian}</div>
                    </div>
                  </td>
                  <td className="py-3 px-5 font-mono text-slate-500">{student.idCard}</td>
                  <td className="py-3 px-5">{student.town}</td>
                  <td className="py-3 px-5">
                    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border ${
                      serviceType === 'type60' 
                        ? 'bg-amber-50 text-amber-700 border-amber-200' 
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}>
                      {serviceType === 'type60' ? '强化服务(60%型)' : '标准服务(80%型)'}
                    </span>
                  </td>
                  <td className="py-3 px-5 text-center">
                    <div className="flex items-center justify-center gap-1 font-mono text-[10px]">
                      <span className={`px-1 rounded border ${hasBaseline ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-300 border-slate-100'}`} title="基线评估">基</span>
                      <span className={`px-1 rounded border ${hasProcess1 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-300 border-slate-100'}`} title="首次随访过程评估">过一</span>
                      {serviceType === 'type60' ? (
                        <span className={`px-1 rounded border ${hasProcess2 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-300 border-slate-100'}`} title="第二次随访过程评估">过二</span>
                      ) : (
                        <span className="px-1 text-slate-300 font-normal border border-dashed border-slate-200 bg-slate-50/30" title="标准服务不强求过二">免</span>
                      )}
                      <span className={`px-1 rounded border ${hasPdf ? 'bg-teal-50 text-teal-700 border-teal-200' : 'bg-rose-50 text-rose-500 border-rose-200'}`} title="盖章PDF扫描件">PDF</span>
                    </div>
                  </td>
                  <td className="py-3 px-5 text-center">
                    <span className={`font-mono font-bold ${
                      trainingsCount >= (serviceType === 'type60' ? 9 : 3) 
                        ? 'text-emerald-600' 
                        : 'text-amber-600'
                    }`}>
                      {trainingsCount} 次
                    </span>
                    <span className="text-[10px] text-slate-400 block font-normal">
                      目标: {serviceType === 'type60' ? '9' : '3'}次
                    </span>
                  </td>
                  <td className="py-3 px-5 max-w-xs">
                    {issues.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {issues.map((issue, idx) => {
                          let targetTab = '';
                          if (issue.includes('基线评估')) targetTab = 'assessments';
                          else if (issue.includes('第一次过程评估')) targetTab = 'process1';
                          else if (issue.includes('第二次过程评估')) targetTab = 'process2';
                          else if (issue.includes('训练课时不足') || issue.includes('训练')) targetTab = 'trainings';
                          else if (issue.includes('PDF')) targetTab = 'assessments';

                          if (targetTab && onNavigateTab) {
                            return (
                              <button
                                key={idx}
                                onClick={() => onNavigateTab(targetTab)}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-800 rounded text-[10px] font-bold border border-rose-200 transition-colors cursor-pointer text-left shrink-0"
                                title="点击直接前往该功能录入/补齐"
                              >
                                <AlertTriangle className="h-3 w-3 shrink-0 text-rose-500" />
                                <span>{issue} ↗</span>
                              </button>
                            );
                          }

                          return (
                            <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-slate-50 text-slate-500 rounded text-[10px] font-bold border border-slate-200">
                              <AlertTriangle className="h-3 w-3 shrink-0 text-slate-400" />
                              <span>{issue}</span>
                            </span>
                          );
                        })}
                      </div>
                    ) : (
                      <span className="text-emerald-600 flex items-center gap-1 font-bold text-xs">
                        <Check className="h-3.5 w-3.5" /> 完美齐全
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-5 text-right">
                    <button
                      onClick={() => {
                        if (isCompliant) {
                          alert(`学员「${student.name}」精康服务指标已完美达标，各项评估与九大训练已录入齐全！`);
                          return;
                        }
                        // Navigate to first missing item
                        const firstIssue = issues[0];
                        let targetTab = '';
                        if (firstIssue.includes('基线评估')) targetTab = 'assessments';
                        else if (firstIssue.includes('第一次过程评估')) targetTab = 'process1';
                        else if (firstIssue.includes('第二次过程评估')) targetTab = 'process2';
                        else if (firstIssue.includes('训练课时不足') || firstIssue.includes('训练')) targetTab = 'trainings';
                        else if (firstIssue.includes('PDF')) targetTab = 'assessments';
                        
                        if (targetTab && onNavigateTab) {
                          alert(`学员「${student.name}」存在指标缺失。系统正为您自动跨模块导航至该业务页面补齐材料！`);
                          onNavigateTab(targetTab);
                        }
                      }}
                      className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold items-center gap-1 hover:opacity-80 transition-all cursor-pointer ${
                        isCompliant 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : 'bg-rose-50 text-rose-600 border border-rose-200 animate-pulse'
                      }`}
                      title={isCompliant ? "合规完成" : "点击自动导航前往补齐缺失项"}
                    >
                      {isCompliant ? (
                        <>
                          <CheckCircle2 className="h-3 w-3" />
                          <span>合规达标</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="h-3 w-3" />
                          <span>指标缺失 ↗</span>
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400 font-semibold bg-white">
                    未检索到匹配筛查条件的精康对象记录
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CUSTOMIZE FIELD EXPORT COLUMN MODAL */}
      {isExportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 bg-[#1c3652] text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-cyan-400" />
                <h3 className="font-bold text-sm">自定义导出报表字段</h3>
              </div>
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="text-slate-300 hover:text-white p-1 hover:bg-[#253f5c] rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-[11px] text-slate-500 font-medium">请勾选您希望导出到 CSV 电子表格中的数据维度字段。打勾字段会被自动编译输出：</p>
              
              <div className="grid grid-cols-2 gap-3 text-xs">
                {Object.keys(exportColumns).map((key) => {
                  const labelMap: Record<string, string> = {
                    name: '学员姓名',
                    idCard: '身份证号码',
                    serviceType: '服务型分类',
                    town: '所属街道乡镇',
                    baselineDone: '基线评估状态',
                    process1Done: '过程评估随访1',
                    process2Done: '过程评估随访2',
                    trainingsCount: '康复训练总次数',
                    pdfUploaded: '量表原件PDF完备度',
                    complianceStatus: '综合建档合规性',
                  };
                  
                  return (
                    <label key={key} className="flex items-center gap-2 p-2 bg-slate-50 hover:bg-slate-100/80 rounded-lg border border-slate-200/50 cursor-pointer transition-all font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        checked={(exportColumns as any)[key]}
                        onChange={(e) => setExportColumns(prev => ({ ...prev, [key]: e.target.checked }))}
                        className="h-3.5 w-3.5 text-[#1c3652] border-slate-300 rounded focus:ring-slate-400"
                      />
                      <span>{labelMap[key]}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex justify-end gap-2 text-xs font-bold">
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg cursor-pointer transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleExportCSV}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-sm cursor-pointer transition-all flex items-center gap-1.5"
              >
                <Download className="h-4 w-4" />
                <span>生成并下载.csv报表</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
