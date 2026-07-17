/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  UserPlus, 
  X, 
  Check, 
  AlertTriangle,
  HeartPulse,
  Coins,
  ShieldCheck,
  BriefcaseMedical,
  Users,
  MapPin,
  FileSpreadsheet
} from 'lucide-react';
import { Student } from '../types';
import { TOWNS } from '../data';

interface StudentsListProps {
  students: Student[];
  onAddStudent: (newStudent: Student) => void;
  onUpdateStudent: (updatedStudent: Student) => void;
  onDeleteStudent: (id: string) => void;
  currentUser: {
    role: string;
    siteId: string;
    town: string;
  };
}

export default function StudentsList({ 
  students, 
  onAddStudent, 
  onUpdateStudent, 
  onDeleteStudent,
  currentUser
}: StudentsListProps) {
  // Navigation & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [townFilter, setTownFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Selected Student for Detail Modal or Edit Mode
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');

  // Multi-Step Form Active Tab
  const [formActiveTab, setFormActiveTab] = useState<'basic' | 'family' | 'medical'>('basic');

  // Form Fields State
  const [formValues, setFormValues] = useState<Partial<Student>>({
    name: '',
    idCard: '',
    gender: '男',
    ethnicity: '汉族',
    birthDate: '',
    phone: '',
    homePhone: '',
    address: '',
    maritalStatus: '未婚',
    livingSituation: '与亲属共同生活',
    hasDisabilityCert: false,
    disabilityType: '精神残疾',
    disabilityLevel: '二级',
    hasDibao: false,
    contactPerson: '',
    contactPhone: '',
    coResidents: [],
    coResidentRelation: '良好',
    livingEnvironment: '一般',
    economicStatus: '一般',
    incomeSource: [],
    moneyManagement: '自行决定支出',
    pastBehavior: ['无'],
    currentRisk: '无上述行为或危险',
    medicationCompliance: '规律',
    medicationMethod: '自行服药',
    medicationDetail: '',
    town: currentUser.role !== 'admin' ? currentUser.town : '测试1镇',
    village: '',
    status: 'active',
    riskLevel: 'low',
    serviceType: 'type80',
  });

  // Filtered Students List according to user access
  const accessibleStudents = useMemo(() => {
    let list = students;
    // Data isolation rule: if not admin, can only view students belonging to their town
    if (currentUser.role !== 'admin') {
      list = list.filter(s => s.town === currentUser.town);
    }
    return list;
  }, [students, currentUser]);

  // Search and Filter Logic
  const filteredStudents = useMemo(() => {
    return accessibleStudents.filter(s => {
      const query = searchQuery.trim().toLowerCase();
      let matchesQuery = true;
      if (query) {
        const nameMatch = s.name.toLowerCase().includes(query);
        const idCardMatch = s.idCard.toLowerCase().includes(query);
        const villageMatch = s.village.toLowerCase().includes(query);
        const ageMatch = s.age.toString() === query || s.age.toString().includes(query);
        matchesQuery = nameMatch || idCardMatch || villageMatch || ageMatch;
      }

      const matchesTown = townFilter ? s.town === townFilter : true;
      const matchesRisk = riskFilter ? s.riskLevel === riskFilter : true;
      const matchesStatus = statusFilter ? s.status === statusFilter : true;

      return matchesQuery && matchesTown && matchesRisk && matchesStatus;
    });
  }, [accessibleStudents, searchQuery, townFilter, riskFilter, statusFilter]);

  // Handle Form Change Helper
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormValues(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormValues(prev => {
        const updated = { ...prev, [name]: value };
        // Auto-extract birthdate and age from ID card if ID card changes
        if (name === 'idCard' && value.length === 18) {
          const year = value.substring(6, 10);
          const month = value.substring(10, 12);
          const day = value.substring(12, 14);
          const bDate = `${year}-${month}-${day}`;
          const calculatedAge = new Date().getFullYear() - parseInt(year);
          return {
            ...updated,
            birthDate: bDate,
            age: calculatedAge,
          };
        }
        return updated;
      });
    }
  };

  // Handle Multiselect arrays (like coResidents, incomeSource, pastBehavior) with mutual exclusion logic
  const handleArrayToggle = (field: 'coResidents' | 'incomeSource' | 'pastBehavior', value: string) => {
    setFormValues(prev => {
      const currentArr = (prev[field] as string[]) || [];
      let nextArr: string[];
      
      if (field === 'pastBehavior') {
        if (value === '无') {
          // If toggling '无'
          const isSelected = currentArr.includes('无');
          if (isSelected) {
            nextArr = [];
          } else {
            nextArr = ['无'];
          }
        } else {
          // If toggling other values
          const isSelected = currentArr.includes(value);
          if (isSelected) {
            nextArr = currentArr.filter(item => item !== value && item !== '无');
          } else {
            nextArr = [...currentArr.filter(item => item !== '无'), value];
          }
          if (nextArr.length === 0) {
            nextArr = ['无'];
          }
        }
      } else {
        const index = currentArr.indexOf(value);
        if (index > -1) {
          nextArr = currentArr.filter(item => item !== value);
        } else {
          nextArr = [...currentArr, value];
        }
      }
      
      return { ...prev, [field]: nextArr };
    });
  };

  // CSV Data Export
  const handleExportCSV = () => {
    if (filteredStudents.length === 0) {
      alert('当前列表无可用数据。');
      return;
    }

    const headers = ['姓名', '身份证号', '性别', '年龄', '属地乡镇', '村居/社区', '联系电话', '随访状态', '风险评估', '服药依从性', '监护人', '监护人电话'];
    const rows = filteredStudents.map(s => [
      s.name,
      `\t${s.idCard}`, // Excel format for large number preservation
      s.gender,
      s.age,
      s.town,
      s.village || '未录入',
      s.phone || '无',
      s.status === 'active' ? '在档随访' : '已结案',
      s.riskLevel === 'low' ? '低风险' : s.riskLevel === 'medium' ? '中风险' : '高风险',
      s.medicationCompliance,
      s.contactPerson || '无',
      s.contactPhone || '无'
    ]);

    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(r => r.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `A市康复人员健康档案库_${currentUser.role === 'admin' ? '全市' : currentUser.town}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Open Form for Adding
  const handleOpenAdd = () => {
    setFormMode('add');
    setFormActiveTab('basic');
    setFormValues({
      name: '',
      idCard: '',
      gender: '男',
      ethnicity: '汉族',
      birthDate: '',
      age: 0,
      phone: '',
      homePhone: '',
      address: '',
      maritalStatus: '未婚',
      livingSituation: '与亲属共同生活',
      hasDisabilityCert: false,
      disabilityType: '精神残疾',
      disabilityLevel: '二级',
      hasDibao: false,
      contactPerson: '',
      contactPhone: '',
      coResidents: [],
      coResidentRelation: '良好',
      livingEnvironment: '一般',
      economicStatus: '一般',
      incomeSource: [],
      moneyManagement: '自行决定支出',
      pastBehavior: ['无'],
      currentRisk: '无上述行为或危险',
      medicationCompliance: '规律',
      medicationMethod: '自行服药',
      medicationDetail: '',
      town: currentUser.role !== 'admin' ? currentUser.town : '赛岐镇',
      village: '',
      status: 'active',
      riskLevel: 'low',
    });
    setIsFormOpen(true);
  };

  // Open Form for Editing
  const handleOpenEdit = (student: Student) => {
    setFormMode('edit');
    setFormActiveTab('basic');
    setFormValues(student);
    setIsFormOpen(true);
  };

  // Submit Form Action
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValues.name || !formValues.idCard) {
      alert('请确保姓名和身份证号已完整录入。');
      return;
    }

    if (formMode === 'add') {
      const newId = `stu-${Date.now()}`;
      const toSubmit: Student = {
        ...(formValues as Student),
        id: newId,
        age: formValues.age || 30,
        siteId: formValues.siteId || currentUser.siteId,
        createdAt: new Date().toISOString(),
      };
      onAddStudent(toSubmit);
    } else {
      onUpdateStudent(formValues as Student);
    }
    setIsFormOpen(false);
  };

  // Close Student modal helper
  const handleCloseCase = (student: Student) => {
    if (confirm(`确认将康复对象 [ ${student.name} ] 的档案作结案停用处理？此操作会同步软删除随访进度。`)) {
      const updated = {
        ...student,
        status: 'closed' as const,
      };
      onUpdateStudent(updated);
    }
  };

  return (
    <div className="space-y-6">
      {/* Consolidated Action Toolbar (Single Horizontal Line Layout) */}
      <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-200/80 gap-3">
        {/* Left: Search input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="搜索姓名 / 身份证 / 村居..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:bg-white focus:border-slate-400 transition-all text-slate-800"
          />
        </div>

        {/* Center: Query Condition Selectors */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1 xl:flex-none">
          {currentUser.role === 'admin' ? (
            <select
              value={townFilter}
              onChange={(e) => setTownFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:bg-white focus:border-slate-400 transition-all text-slate-800 min-w-[120px]"
            >
              <option value="">全部辖区乡镇</option>
              {TOWNS.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
            </select>
          ) : (
            <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 flex items-center min-w-[120px]">
              限本辖区：{currentUser.town}
            </div>
          )}

          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:bg-white focus:border-slate-400 transition-all text-slate-800 min-w-[120px]"
          >
            <option value="">所有危险等级</option>
            <option value="low">低风险 (Low)</option>
            <option value="medium">中风险 (Medium)</option>
            <option value="high">高风险 (High)</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:bg-white focus:border-slate-400 transition-all text-slate-800 min-w-[120px]"
          >
            <option value="">所有在册状态</option>
            <option value="active">在档随访中</option>
            <option value="closed">已结案停用</option>
          </select>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* All roles can add students */}
            <button
              onClick={handleOpenAdd}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-lg text-xs font-bold cursor-pointer transition-all shrink-0 h-[34px]"
            >
              <UserPlus className="h-4 w-4" />
              <span>建档登记</span>
            </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold cursor-pointer transition-all shrink-0 font-bold h-[34px]"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>导出人员数据 (CSV)</span>
          </button>
        </div>
      </div>

      {/* Patients grid/list */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-5">真实姓名</th>
                <th className="py-3.5 px-5">性别 / 年龄</th>
                <th className="py-3.5 px-5">归属乡镇</th>
                <th className="py-3.5 px-5">联系人 & 电话</th>
                <th className="py-3.5 px-5">服药依从性</th>
                <th className="py-3.5 px-5 text-center">风险评估</th>
                <th className="py-3.5 px-5 text-center">在册状态</th>
                <th className="py-3.5 px-5 text-right">档案操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 font-medium text-slate-700">
              {filteredStudents.map((stu) => (
                <tr key={stu.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-5">
                    <span className="font-bold text-slate-900 block text-sm">{stu.name}</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] text-slate-400 font-mono">{stu.idCard}</span>
                      <span className={`text-[9px] px-1 rounded font-bold border ${
                        stu.serviceType === 'type60'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-[#2b4c70]/10 text-[#2b4c70] border-[#2b4c70]/20'
                      }`}>
                        {stu.serviceType === 'type60' ? '强化服务(60%型)' : '标准服务(80%型)'}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-5 text-slate-600 font-medium">
                    {stu.gender} / <span className="font-mono text-slate-800">{stu.age}岁</span>
                  </td>
                  <td className="py-3 px-5">
                    <span className="text-slate-800 font-medium block">{stu.town}</span>
                    <span className="text-[10px] text-slate-400 block">{stu.village || '未录入村居'}</span>
                  </td>
                  <td className="py-3 px-5 text-slate-600 font-mono">
                    <span className="text-slate-700 font-semibold block text-[11px]">{stu.contactPerson || '无'}</span>
                    <span className="text-slate-400 block text-[10px]">{stu.contactPhone || '无'}</span>
                  </td>
                  <td className="py-3 px-5">
                    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                      stu.medicationCompliance === '规律' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      stu.medicationCompliance === '间断' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>
                      {stu.medicationCompliance}
                    </span>
                  </td>
                  <td className="py-3 px-5 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      stu.riskLevel === 'low' ? 'bg-emerald-100 text-emerald-800' :
                      stu.riskLevel === 'medium' ? 'bg-amber-100 text-amber-800 font-bold' :
                      'bg-rose-100 text-rose-800 font-bold'
                    }`}>
                      {stu.riskLevel === 'low' ? '低风险' : stu.riskLevel === 'medium' ? '中风险' : '高风险'}
                    </span>
                  </td>
                  <td className="py-3 px-5 text-center">
                    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                      stu.status === 'active' ? 'bg-cyan-50 text-cyan-700 border border-cyan-200' : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}>
                      {stu.status === 'active' ? '在册随动' : '结案停档'}
                    </span>
                  </td>
                  <td className="py-3 px-5 text-right space-x-1.5 whitespace-nowrap">
                    <button
                      onClick={() => { setSelectedStudent(stu); setIsDetailOpen(true); }}
                      className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded transition-colors cursor-pointer text-[11px]"
                      title="查看详细档案"
                    >
                      <Eye className="h-3 w-3" />
                      <span>查看</span>
                    </button>
                    {/* All roles can edit students */}
                      <>
                        <button
                          onClick={() => handleOpenEdit(stu)}
                          className="inline-flex items-center gap-1 text-[#2b4c70] hover:text-[#1a2e45] bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded transition-colors cursor-pointer text-[11px]"
                          title="编辑健康档案"
                        >
                          <Edit className="h-3 w-3" />
                          <span>编辑</span>
                        </button>
                        {stu.status === 'active' && (
                          <button
                            onClick={() => handleCloseCase(stu)}
                            className="inline-flex items-center gap-1 text-amber-600 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded transition-colors cursor-pointer text-[11px]"
                            title="结案随访处理"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span>结案</span>
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (confirm(`警告：确认要永久删除康复对象 [ ${stu.name} ] 的全部健康档案？此操作不可逆！`)) {
                              onDeleteStudent(stu.id);
                            }
                          }}
                          className="inline-flex items-center gap-1 text-red-700 hover:text-red-950 bg-red-50 hover:bg-red-100 px-2 py-1 rounded transition-colors cursor-pointer text-[11px]"
                          title="永久删除此档案"
                        >
                          <Trash2 className="h-3 w-3 text-red-600" />
                          <span>删除</span>
                        </button>
                      </>
                  </td>
                </tr>
              ))}
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400 font-medium">
                    没有检索到符合过滤条件的康复对象健康档案
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: STUDENT PROFILE DETAILED INFORMATION VIEW (29 Fields) */}
      {isDetailOpen && selectedStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-xl overflow-hidden flex flex-col my-8 border border-slate-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-[#1a2d42] text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-cyan-400" />
                <div>
                  <h3 className="text-base font-bold">{selectedStudent.name} ── 全景康复健康档案</h3>
                  <p className="text-[10px] text-slate-300 font-mono mt-0.5">档案唯一编码: {selectedStudent.id}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsDetailOpen(false)}
                className="p-1 hover:bg-[#2a4563] rounded-lg transition-colors text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content - Tabbed or Categorized */}
            <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6">
              {/* Category 1: Demographics */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-1.5">
                  <HeartPulse className="h-4 w-4 text-[#2b4c70]" />
                  <h4 className="font-bold text-slate-900 text-sm">一、 身份与基础生命体征 (9个核心指标)</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                  <div><span className="text-slate-400 block mb-0.5">性别</span><span className="font-semibold text-slate-800">{selectedStudent.gender}</span></div>
                  <div><span className="text-slate-400 block mb-0.5">民族</span><span className="font-semibold text-slate-800">{selectedStudent.ethnicity}</span></div>
                  <div><span className="text-slate-400 block mb-0.5">出生日期</span><span className="font-semibold font-mono text-slate-800">{selectedStudent.birthDate}</span></div>
                  <div><span className="text-slate-400 block mb-0.5">身份证号</span><span className="font-semibold font-mono text-slate-800">{selectedStudent.idCard}</span></div>
                  <div><span className="text-slate-400 block mb-0.5">实足年龄</span><span className="font-semibold font-mono text-slate-800">{selectedStudent.age} 岁</span></div>
                  <div><span className="text-slate-400 block mb-0.5">婚姻状况</span><span className="font-semibold text-slate-800">{selectedStudent.maritalStatus}</span></div>
                  <div><span className="text-slate-400 block mb-0.5">联系电话</span><span className="font-semibold font-mono text-slate-800">{selectedStudent.phone || '无'}</span></div>
                  <div><span className="text-slate-400 block mb-0.5">家庭备用电话</span><span className="font-semibold font-mono text-slate-800">{selectedStudent.homePhone || '无'}</span></div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">学员服务类型</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                      selectedStudent.serviceType === 'type60'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-[#2b4c70]/10 text-[#2b4c70] border-[#2b4c70]/20'
                    }`}>
                      {selectedStudent.serviceType === 'type60' ? '重点监护服务 (强化60%型)' : '一般标准服务 (标准80%型)'}
                    </span>
                  </div>
                  <div className="sm:col-span-2 md:col-span-3"><span className="text-slate-400 block mb-0.5">家庭现住址</span><span className="font-semibold text-slate-800">{selectedStudent.address}</span></div>
                </div>
              </div>

              {/* Category 2: Disability & Disability Cert details */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-1.5">
                  <ShieldCheck className="h-4 w-4 text-[#4c8a8a]" />
                  <h4 className="font-bold text-slate-900 text-sm">二、 残疾与政府保障信息</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div><span className="text-slate-400 block mb-0.5">是否办理残疾人证</span><span className="font-semibold text-slate-800">{selectedStudent.hasDisabilityCert ? '是' : '否'}</span></div>
                  <div><span className="text-slate-400 block mb-0.5">残疾类别</span><span className="font-semibold text-slate-800">{selectedStudent.disabilityType || '未登记/无证'}</span></div>
                  <div><span className="text-slate-400 block mb-0.5">残疾等级</span><span className="font-semibold text-slate-800">{selectedStudent.disabilityLevel || '未登记/无证'}</span></div>
                  <div><span className="text-slate-400 block mb-0.5">是否享受最低生活保障 (低保)</span><span className="font-semibold text-slate-800">{selectedStudent.hasDibao ? '是' : '否'}</span></div>
                </div>
              </div>

              {/* Category 3: Family & Co-residents */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-1.5">
                  <Users className="h-4 w-4 text-cyan-600" />
                  <h4 className="font-bold text-slate-900 text-sm">三、 共同居住与监护条件</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                  <div><span className="text-slate-400 block mb-0.5">居住情况类别</span><span className="font-semibold text-slate-800">{selectedStudent.livingSituation}</span></div>
                  <div><span className="text-slate-400 block mb-0.5">共同居住者人员</span><span className="font-semibold text-slate-800">{selectedStudent.coResidents.length > 0 ? selectedStudent.coResidents.join('，') : '独自居住'}</span></div>
                  <div><span className="text-slate-400 block mb-0.5">与共同居住者关系</span><span className="font-semibold text-slate-800">{selectedStudent.coResidentRelation}</span></div>
                  <div><span className="text-slate-400 block mb-0.5">监护责任联系人</span><span className="font-semibold text-slate-800">{selectedStudent.contactPerson || '未登记'}</span></div>
                  <div><span className="text-slate-400 block mb-0.5">监护人手机</span><span className="font-semibold font-mono text-slate-800">{selectedStudent.contactPhone || '未登记'}</span></div>
                  <div><span className="text-slate-400 block mb-0.5">居住环境质量</span><span className="font-semibold text-slate-800">{selectedStudent.livingEnvironment}</span></div>
                </div>
              </div>

              {/* Category 4: Economic Status */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-1.5">
                  <Coins className="h-4 w-4 text-[#c9a96e]" />
                  <h4 className="font-bold text-slate-900 text-sm">四、 家庭经济状况与自理支配能力</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                  <div><span className="text-slate-400 block mb-0.5">家庭经济状况评估</span><span className="font-semibold text-slate-800">{selectedStudent.economicStatus}</span></div>
                  <div><span className="text-slate-400 block mb-0.5">收入来源方式</span><span className="font-semibold text-slate-800">{selectedStudent.incomeSource.length > 0 ? selectedStudent.incomeSource.join('，') : '无固定来源'}</span></div>
                  <div><span className="text-slate-400 block mb-0.5">零钱管理与支配权</span><span className="font-semibold text-slate-800">{selectedStudent.moneyManagement}</span></div>
                </div>
              </div>

              {/* Category 5: Medication & Behavior Risks */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-1.5">
                  <BriefcaseMedical className="h-4 w-4 text-rose-600" />
                  <h4 className="font-bold text-slate-900 text-sm">五、 行为危险倾向与临床用药现状</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                  <div><span className="text-slate-400 block mb-0.5">既往精神行为异常史</span><span className="font-semibold text-slate-800 text-rose-700">{selectedStudent.pastBehavior.join('，') || '无'}</span></div>
                  <div><span className="text-slate-400 block mb-0.5">目前行为异常与危险评定</span><span className="font-semibold text-slate-800 text-rose-700">{selectedStudent.currentRisk}</span></div>
                  <div><span className="text-slate-400 block mb-0.5">服药依从性评估</span><span className="font-semibold text-slate-800">{selectedStudent.medicationCompliance}</span></div>
                  <div><span className="text-slate-400 block mb-0.5">给药服药服务方式</span><span className="font-semibold text-slate-800">{selectedStudent.medicationMethod || '未登记'}</span></div>
                  <div className="sm:col-span-2"><span className="text-slate-400 block mb-0.5">目前治疗处方药物及每日剂量</span><span className="font-semibold text-[#2b4c70] bg-slate-50 p-2 rounded block mt-1 border border-slate-200">{selectedStudent.medicationDetail || '未录入服药明细'}</span></div>
                </div>
              </div>

              {/* Category 6: Geographic area details */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-1.5">
                  <MapPin className="h-4 w-4 text-slate-600" />
                  <h4 className="font-bold text-slate-900 text-sm">六、 属地管理职责归属</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div><span className="text-slate-400 block mb-0.5">区县</span><span className="font-semibold text-slate-800">福建省A市</span></div>
                  <div><span className="text-slate-400 block mb-0.5">乡镇</span><span className="font-semibold text-slate-800">{selectedStudent.town}</span></div>
                  <div><span className="text-slate-400 block mb-0.5">村居/社区</span><span className="font-semibold text-slate-800">{selectedStudent.village}</span></div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
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

      {/* MODAL 2: ADD OR EDIT STUDENT MULTI-STEP FORM */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-xl overflow-hidden flex flex-col my-8 border border-slate-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-[#1a2d42] text-white flex justify-between items-center">
              <h3 className="text-base font-bold">
                {formMode === 'add' ? '新增康复对象建档登记表' : `编辑康复对象档案: ${formValues.name}`}
              </h3>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="p-1 hover:bg-[#2a4563] rounded-lg transition-colors text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Step Selection Header (No emoji, solemn) */}
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-2 flex gap-4 text-xs">
              <button
                onClick={() => setFormActiveTab('basic')}
                className={`py-2 px-3 font-semibold border-b-2 transition-all cursor-pointer ${
                  formActiveTab === 'basic' ? 'border-[#2b4c70] text-[#2b4c70]' : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                第一部分: 基本身份与联系人
              </button>
              <button
                onClick={() => setFormActiveTab('family')}
                className={`py-2 px-3 font-semibold border-b-2 transition-all cursor-pointer ${
                  formActiveTab === 'family' ? 'border-[#2b4c70] text-[#2b4c70]' : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                第二部分: 居住、经济与残疾信息
              </button>
              <button
                onClick={() => setFormActiveTab('medical')}
                className={`py-2 px-3 font-semibold border-b-2 transition-all cursor-pointer ${
                  formActiveTab === 'medical' ? 'border-[#2b4c70] text-[#2b4c70]' : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                第三部分: 药物治疗与危险行为评估
              </button>
            </div>

            {/* Form Fields Body */}
            <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto max-h-[60vh] p-6 space-y-4 text-xs text-slate-800">
              {/* Part 1: Basic Information */}
              {formActiveTab === 'basic' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">姓名 *</label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={formValues.name}
                      onChange={handleInputChange}
                      placeholder="康复对象真实姓名"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">18位身份证号 *</label>
                    <input
                      type="text"
                      name="idCard"
                      required
                      maxLength={18}
                      value={formValues.idCard}
                      onChange={handleInputChange}
                      placeholder="输入将自动提取出生日期及年龄"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 font-mono font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">性别 *</label>
                    <select
                      name="gender"
                      value={formValues.gender}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 font-medium"
                    >
                      <option value="男">男</option>
                      <option value="女">女</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">服务管理类型 *</label>
                    <select
                      name="serviceType"
                      value={formValues.serviceType}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-[#2b4c70]/5 border border-[#2b4c70]/30 rounded-lg focus:outline-none focus:border-[#2b4c70] font-bold text-[#2b4c70]"
                    >
                      <option value="type80">标准服务型 (80%指标: 1基线 + 1过程评估 + 3训练)</option>
                      <option value="type60">强化监护型 (60%指标: 1基线 + 2过程评估 + 9训练)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">民族 *</label>
                    <input
                      type="text"
                      name="ethnicity"
                      value={formValues.ethnicity}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">出生日期 (自动)</label>
                    <input
                      type="date"
                      name="birthDate"
                      readOnly
                      value={formValues.birthDate}
                      className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 font-mono font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">年龄 (自动)</label>
                    <input
                      type="number"
                      name="age"
                      readOnly
                      value={formValues.age}
                      className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 font-mono font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">联系电话</label>
                    <input
                      type="text"
                      name="phone"
                      value={formValues.phone}
                      onChange={handleInputChange}
                      placeholder="手机号码"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 font-mono font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">家庭备用电话</label>
                    <input
                      type="text"
                      name="homePhone"
                      value={formValues.homePhone}
                      onChange={handleInputChange}
                      placeholder="座机或副号"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 font-mono font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">婚姻状况</label>
                    <select
                      name="maritalStatus"
                      value={formValues.maritalStatus}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 font-medium"
                    >
                      <option value="未婚">未婚</option>
                      <option value="已婚">已婚</option>
                      <option value="离婚">离婚</option>
                      <option value="丧偶">丧偶</option>
                      <option value="其他">其他</option>
                    </select>
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="font-bold text-slate-700 block">家庭现住址详细地址 *</label>
                    <input
                      type="text"
                      name="address"
                      required
                      value={formValues.address}
                      onChange={handleInputChange}
                      placeholder="A市具体街道、小区、房号"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">监护人姓名</label>
                    <input
                      type="text"
                      name="contactPerson"
                      value={formValues.contactPerson}
                      onChange={handleInputChange}
                      placeholder="紧急联系人/监护人"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">监护人手机</label>
                    <input
                      type="text"
                      name="contactPhone"
                      value={formValues.contactPhone}
                      onChange={handleInputChange}
                      placeholder="监护人手机号"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 font-mono font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">管理乡镇 *</label>
                    {currentUser.role === 'admin' ? (
                      <select
                        name="town"
                        value={formValues.town}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 font-medium"
                      >
                        {TOWNS.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                      </select>
                    ) : (
                      <input
                        type="text"
                        name="town"
                        readOnly
                        value={formValues.town}
                        className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 font-medium"
                      />
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">所属村居 *</label>
                    <input
                      type="text"
                      name="village"
                      required
                      value={formValues.village}
                      onChange={handleInputChange}
                      placeholder="如: 甘棠村/赛岐社区"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">在册随动风险评估</label>
                    <select
                      name="riskLevel"
                      value={formValues.riskLevel}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 font-medium"
                    >
                      <option value="low">低风险 (Low)</option>
                      <option value="medium">中风险 (Medium)</option>
                      <option value="high">高风险 (High)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Part 2: Living Situation & Finance details */}
              {formActiveTab === 'family' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 block">居住情况</label>
                      <select
                        name="livingSituation"
                        value={formValues.livingSituation}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 font-medium"
                      >
                        <option value="与亲属共同生活">与亲属共同生活</option>
                        <option value="独自生活">独自生活</option>
                        <option value="与朋友共同生活">与朋友共同生活</option>
                        <option value="独自生活，但家人定时探望">独自生活，但家人定时探望</option>
                        <option value="其他">其他</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 block">与共同居住者关系</label>
                      <select
                        name="coResidentRelation"
                        value={formValues.coResidentRelation}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 font-medium"
                      >
                        <option value="好">好</option>
                        <option value="良好">良好</option>
                        <option value="一般">一般</option>
                        <option value="差">差</option>
                        <option value="很差">很差</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 block">居住环境</label>
                      <select
                        name="livingEnvironment"
                        value={formValues.livingEnvironment}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 font-medium"
                      >
                        <option value="好">好</option>
                        <option value="良好">良好</option>
                        <option value="一般">一般</option>
                        <option value="差">差</option>
                        <option value="很差">很差</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 block">家庭经济状况</label>
                      <select
                        name="economicStatus"
                        value={formValues.economicStatus}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 font-medium"
                      >
                        <option value="好">好</option>
                        <option value="一般">一般</option>
                        <option value="较差">较差</option>
                        <option value="贫困">贫困</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 block">零钱自理管理能力</label>
                      <select
                        name="moneyManagement"
                        value={formValues.moneyManagement}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 font-medium"
                      >
                        <option value="自行决定支出">自行决定支出</option>
                        <option value="由家人管理金钱">由家人管理金钱</option>
                        <option value="由家人协助管理金钱">由家人协助管理金钱</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2 pt-6">
                      <input
                        type="checkbox"
                        id="hasDisabilityCert"
                        name="hasDisabilityCert"
                        checked={formValues.hasDisabilityCert}
                        onChange={handleInputChange}
                        className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                      />
                      <label htmlFor="hasDisabilityCert" className="font-bold text-slate-700 cursor-pointer">是否办理残疾人证</label>
                    </div>

                    {formValues.hasDisabilityCert && (
                      <>
                        <div className="space-y-1">
                          <label className="font-bold text-slate-700 block">残疾类别</label>
                          <select
                            name="disabilityType"
                            value={formValues.disabilityType}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 font-medium"
                          >
                            <option value="精神残疾">精神残疾</option>
                            <option value="智力残疾">智力残疾</option>
                            <option value="多重残疾">多重残疾</option>
                            <option value="其他">其他</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="font-bold text-slate-700 block">残疾等级</label>
                          <select
                            name="disabilityLevel"
                            value={formValues.disabilityLevel}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 font-medium"
                          >
                            <option value="一级">一级 (最重)</option>
                            <option value="二级">二级</option>
                            <option value="三级">三级</option>
                            <option value="四级">四级</option>
                          </select>
                        </div>
                      </>
                    )}

                    <div className="flex items-center gap-2 pt-6">
                      <input
                        type="checkbox"
                        id="hasDibao"
                        name="hasDibao"
                        checked={formValues.hasDibao}
                        onChange={handleInputChange}
                        className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                      />
                      <label htmlFor="hasDibao" className="font-bold text-slate-700 cursor-pointer">是否享受政府最低保障 (低保)</label>
                    </div>
                  </div>

                  {/* Array select: Co-residents */}
                  <div className="space-y-2 border-t border-slate-100 pt-3">
                    <label className="font-bold text-slate-700 block">共同居住关系人员 (多选)</label>
                    <div className="flex flex-wrap gap-2">
                      {['父母', '配偶', '子女', '兄弟', '同胞', '亲戚', '朋友', '志愿者'].map(role => {
                        const isSelected = (formValues.coResidents || []).includes(role);
                        return (
                          <button
                            type="button"
                            key={role}
                            onClick={() => handleArrayToggle('coResidents', role)}
                            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
                              isSelected 
                                ? 'bg-[#2b4c70] text-white border-[#2b4c70] shadow-xs' 
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {role}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Array select: Income sources */}
                  <div className="space-y-2 border-t border-slate-100 pt-3">
                    <label className="font-bold text-slate-700 block">家庭主要经济来源 (多选)</label>
                    <div className="flex flex-wrap gap-2">
                      {['政府救助', '家人支持', '工资所得', '退休金', '社会帮扶', '农业所得'].map(source => {
                        const isSelected = (formValues.incomeSource || []).includes(source);
                        return (
                          <button
                            type="button"
                            key={source}
                            onClick={() => handleArrayToggle('incomeSource', source)}
                            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
                              isSelected 
                                ? 'bg-[#4c8a8a] text-white border-[#4c8a8a] shadow-xs' 
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {source}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Part 3: Behavior risks & medication compliance */}
              {formActiveTab === 'medical' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 block">目前精神危险等级评定</label>
                      <select
                        name="currentRisk"
                        value={formValues.currentRisk}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 font-medium"
                      >
                        <option value="无上述行为或危险">无上述行为或危险</option>
                        <option value="存在危害他人安全的危险">存在危害他人安全的危险</option>
                        <option value="存在自杀自伤的危险">存在自杀自伤的危险</option>
                        <option value="已发生危害他人安全的行为">已发生危害他人安全的行为</option>
                        <option value="已发生自杀自伤行为">已发生自杀自伤行为</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 block">服药依从性 (核心)</label>
                      <select
                        name="medicationCompliance"
                        value={formValues.medicationCompliance}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 font-medium"
                      >
                        <option value="规律">规律 (正常规律遵医嘱服药)</option>
                        <option value="间断">间断 (有漏服、抗拒服药等)</option>
                        <option value="不服药">不服药 (完全抗拒或停药)</option>
                        <option value="医嘱勿须服药">医嘱勿须服药</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 block">目前给药服务方式</label>
                      <select
                        name="medicationMethod"
                        value={formValues.medicationMethod}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 font-medium"
                      >
                        <option value="自行服药">自行服药 (患者完全自理)</option>
                        <option value="他人给药自己服">他人给药自己服 (家属监管督服)</option>
                        <option value="注射给药">注射给药</option>
                        <option value="医嘱停药">医嘱停药</option>
                        <option value="其他">其他</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1 border-t border-slate-100 pt-3">
                    <label className="font-bold text-slate-700 block">目前治疗药物处方及每日剂量 (29项必填之一)</label>
                    <textarea
                      name="medicationDetail"
                      rows={3}
                      value={formValues.medicationDetail}
                      onChange={handleInputChange}
                      placeholder="例：奥氮平片 每日一次 睡前10mg; 盐酸苯海索片 每日二次 每次2mg"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 font-medium text-xs leading-relaxed"
                    />
                  </div>

                  {/* Multiselect: Past Behaviors */}
                  <div className="space-y-2 border-t border-slate-100 pt-3">
                    <label className="font-bold text-slate-700 block">既往伴随异常行为史 (多选)</label>
                    <div className="flex flex-wrap gap-2">
                      {['无', '攻击冲动行为史', '严重自伤自杀行为史', '药物酒精滥用史', '出走流浪史', '拒药抗拒治疗史'].map(behavior => {
                        const isSelected = (formValues.pastBehavior || []).includes(behavior);
                        return (
                          <button
                            type="button"
                            key={behavior}
                            onClick={() => handleArrayToggle('pastBehavior', behavior)}
                            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
                              isSelected 
                                ? 'bg-rose-700 text-white border-rose-700 shadow-xs' 
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {behavior}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </form>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs">
              <span className="text-slate-400 font-medium">提示: 标有 * 的项目为必填内容</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleFormSubmit}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  {formMode === 'add' ? '创建建档记录' : '保存档案变更'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
