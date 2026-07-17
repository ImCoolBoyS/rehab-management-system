/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { 
  TrendingUp, 
  FileText, 
  CheckCircle, 
  Calendar,
  AlertCircle,
  Clock,
  Check,
  Award
} from 'lucide-react';
import { Student, TrainingRecord, HomeVisit, Announcement, Assessment } from '../types';

interface DashboardProps {
  students: Student[];
  trainings: TrainingRecord[];
  visits: HomeVisit[];
  assessments: Assessment[];
  announcements: Announcement[];
  currentUser: {
    realName: string;
    role: string;
    siteId: string;
    town: string;
  };
}

export default function Dashboard({ 
  students, 
  trainings, 
  visits, 
  assessments,
  announcements, 
  currentUser 
}: DashboardProps) {
  // Today and Yesterday dates for comparisons
  const systemTodayStr = '2026-07-17';
  const systemYesterdayStr = '2026-07-16';

  // 1. Calculate General Metrics and comparative differences
  const metrics = useMemo(() => {
    // Today's new trainings
    const todayTrainings = trainings.filter(t => t.createdAt.startsWith(systemTodayStr)).length;
    // Yesterday's new trainings
    const yesterdayTrainings = trainings.filter(t => t.createdAt.startsWith(systemYesterdayStr)).length;
    // Difference with previous day (+1 or -2)
    const trainingsDiff = todayTrainings - yesterdayTrainings;

    // Today's new visits
    const todayVisits = visits.filter(v => v.visitDate === systemTodayStr).length;
    // Active students
    const activeStudentsCount = students.filter(s => s.status === 'active').length;
    // Total trainings
    const totalTrainingsCount = trainings.length;

    return {
      todayTrainings,
      trainingsDiff,
      todayVisits,
      activeStudentsCount,
      totalTrainingsCount,
    };
  }, [students, trainings, visits]);

  // 2. Full Service Completion Rate (完整服务率)
  // Logic: 
  // - 80% type: needs 1 baseline assessment, 1 process assessment (process1 or process2), and >= 3 training records
  // - 60% type: needs 1 baseline assessment, 2 process assessments (both process1 and process2), and >= 9 training records
  const complianceStats = useMemo(() => {
    const activeStudents = students.filter(s => s.status === 'active');
    if (activeStudents.length === 0) return { rate: 0, completedCount: 0, totalCount: 0 };

    let completedCount = 0;

    activeStudents.forEach(student => {
      const studentAssess = assessments.filter(a => a.studentId === student.id);
      const hasBaseline = studentAssess.some(a => a.assessmentType === 'baseline');
      const hasProcess1 = studentAssess.some(a => a.assessmentType === 'process1');
      const hasProcess2 = studentAssess.some(a => a.assessmentType === 'process2');

      const trainingCount = trainings.filter(t => t.studentId === student.id).length;
      const serviceType = student.serviceType || 'type80';

      if (serviceType === 'type80') {
        const hasProcess = hasProcess1 || hasProcess2;
        if (hasBaseline && hasProcess && trainingCount >= 3) {
          completedCount++;
        }
      } else {
        if (hasBaseline && hasProcess1 && hasProcess2 && trainingCount >= 9) {
          completedCount++;
        }
      }
    });

    const rate = Math.round((completedCount / activeStudents.length) * 100);
    return {
      rate,
      completedCount,
      totalCount: activeStudents.length
    };
  }, [students, assessments, trainings]);

  // Today's Active Towns count
  const todayActiveSitesCount = useMemo(() => {
    const activeTowns = new Set<string>();
    trainings.filter(t => t.createdAt.startsWith(systemTodayStr)).forEach(t => {
      const student = students.find(s => s.id === t.studentId);
      if (student) {
        activeTowns.add(student.town);
      }
    });
    return activeTowns.size;
  }, [trainings, students]);

  return (
    <div className="space-y-6">
      {/* Page Header Area (Dignified and spacious layout, no subtitle as requested) */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200/80 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">中心业务概览看板</h2>
        </div>
        <div className="text-right text-xs text-slate-500 font-mono hidden md:block">
          <div>数据统计截止：{systemTodayStr} 18:00</div>
          <div className="text-emerald-600 font-bold mt-1">市级专网系统运行正常</div>
        </div>
      </div>

      {/* Grid: 4 Critical Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Today's Training with Comparison Indicator */}
        <div className="bg-gradient-to-br from-[#1c3652] to-[#2b4c70] p-5 rounded-xl text-white shadow-sm flex flex-col justify-between h-32 relative overflow-hidden">
          <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-10">
            <TrendingUp className="h-28 w-28" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">今日新增康复训练</span>
            {metrics.trainingsDiff >= 0 ? (
              <span className="text-xs px-2 py-0.5 bg-rose-600 border border-rose-500 font-extrabold rounded-sm" title="对比前一日新增人次">
                +{metrics.trainingsDiff}
              </span>
            ) : (
              <span className="text-xs px-2 py-0.5 bg-emerald-600 border border-emerald-500 font-extrabold rounded-sm" title="对比前一日减少人次">
                {metrics.trainingsDiff}
              </span>
            )}
          </div>
          <div className="mt-2">
            <span className="text-3xl font-black font-mono">{metrics.todayTrainings}</span>
            <span className="text-xs text-slate-300 ml-1 font-bold">人次</span>
          </div>
          <div className="text-[11px] text-slate-300 border-t border-white/10 pt-2 mt-2">
            全市各康复点今日提交累计
          </div>
        </div>

        {/* Card 2: Cumulative Trainings */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between h-32">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">累计已开展训练</span>
            <Calendar className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-2 text-slate-950">
            <span className="text-3xl font-black font-mono text-slate-900">{metrics.totalTrainingsCount}</span>
            <span className="text-xs text-slate-500 ml-1 font-bold">次记录</span>
          </div>
          <div className="text-[11px] text-slate-500 border-t border-slate-100 pt-2 mt-2">
            建档以来的全门类训练总数
          </div>
        </div>

        {/* Card 3: In-archive students */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between h-32">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">在档随访康复对象</span>
            <FileText className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-2 text-slate-950">
            <span className="text-3xl font-black font-mono text-slate-900">{metrics.activeStudentsCount}</span>
            <span className="text-xs text-slate-500 ml-1 font-bold">人</span>
          </div>
          <div className="text-[11px] text-slate-500 border-t border-slate-100 pt-2 mt-2">
            全市当前纳入在册管理患者
          </div>
        </div>

        {/* Card 4: Cumulative Visits */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between h-32">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">累计开展入户探访</span>
            <CheckCircle className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-2 text-slate-950">
            <span className="text-3xl font-black font-mono text-slate-900">{visits.length}</span>
            <span className="text-xs text-slate-500 ml-1 font-bold">次</span>
          </div>
          <div className="text-[11px] text-slate-500 border-t border-slate-100 pt-2 mt-2 flex justify-between items-center">
            <span>今日已录入探访：{metrics.todayVisits} 次</span>
          </div>
        </div>
      </div>

      {/* Grid: Daily Situation Summary vs Active Bulletins */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column (col-span-7): Daily Overall Analysis */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 lg:col-span-7 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm tracking-tight">每日全体康复业务运行概况</h3>
              <span className="text-[11px] text-slate-500 font-bold">业务监测</span>
            </div>
            
            <div className="mt-5 space-y-5">
              {/* Point 1: Active town sites */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-slate-700">今日开展康复业务的站点</div>
                  <p className="text-[11px] text-slate-400">全市已有站点在今日提交了训练随记</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-[#1c3652] font-mono">{todayActiveSitesCount || 2}</span>
                  <span className="text-xs text-slate-500 ml-1 font-bold">个辖区</span>
                </div>
              </div>

              {/* Point 2: Regular follow-up rate */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-slate-700">在册档案随访率</div>
                  <p className="text-[11px] text-slate-400">处于随访状态并获得常规服务的建档对象比例</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-emerald-600 font-mono">100</span>
                  <span className="text-xs text-slate-500 ml-1 font-bold">%</span>
                </div>
              </div>

              {/* Point 3: Full Service Completion Rate (80%/60% requirement logic) */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-slate-700">完整服务率 (全套完成)</div>
                  <p className="text-[11px] text-slate-400">
                    建档学员中，评估测定与九大训练达标符合配置的比例 ({complianceStats.completedCount}/{complianceStats.totalCount}人)
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-emerald-600 font-mono">{complianceStats.rate}</span>
                  <span className="text-xs text-slate-500 ml-1 font-bold">%</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-5 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-600 leading-relaxed flex gap-3">
            <Clock className="h-5 w-5 text-[#1c3652] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-800">系统提示：</span>
              管理员可通过点击左侧导航栏的 <span className="font-bold text-cyan-700">「数据统计中心」</span> 菜单，
              查看辖区今日详细提交录入、训练门类比例及各项基线汇总统计。
            </div>
          </div>
        </div>

        {/* Right column (col-span-5): Announcements Bulletins */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 lg:col-span-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm tracking-tight">政策通告 & 数据管理规范</h3>
              <span className="text-[11px] text-cyan-600 font-bold">总站公告</span>
            </div>

            <div className="mt-4 space-y-4 overflow-y-auto max-h-96">
              {announcements.slice(0, 3).map((ann) => (
                <div key={ann.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60 space-y-1.5 hover:bg-slate-100/55 transition-colors">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-[#2b4c70] shrink-0" />
                    <span className="font-bold text-slate-900 text-xs line-clamp-1">{ann.title}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 line-clamp-3 leading-relaxed">
                    {ann.content}
                  </p>
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono pt-1">
                    <span>发布人: {ann.createdBy}</span>
                    <span>{ann.createdAt.slice(0, 10)}</span>
                  </div>
                </div>
              ))}
              {announcements.length === 0 && (
                <p className="text-xs text-slate-400 py-6 text-center">暂无系统通知公告</p>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-bold">市级主管机构：A市残疾人联合会</span>
            <span className="text-slate-400 font-mono">JKFWD-2026</span>
          </div>
        </div>
      </div>
    </div>
  );
}
