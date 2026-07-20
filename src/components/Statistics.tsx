import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  MapPin, 
  Search, 
  PieChart, 
  BarChart4, 
  Info,
  Calendar,
  Building2,
  Users
} from 'lucide-react';
import { Student, TrainingRecord, HomeVisit, Assessment, Site } from '../types';

interface StatisticsProps {
  students: Student[];
  trainings: TrainingRecord[];
  visits: HomeVisit[];
  assessments: Assessment[];
  sites: Site[];
  currentUser: {
    role: string;
    siteId: string;
    town: string;
  };
}

export default function Statistics({ 
  students, 
  trainings, 
  visits, 
  assessments, 
  sites,
  currentUser 
}: StatisticsProps) {
  const [townSearch, setTownSearch] = useState('');
  const [selectedStatTab, setSelectedStatTab] = useState<'townships' | 'categories'>('townships');

  const today = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const todayStr = today.getFullYear() + '-' + pad(today.getMonth()+1) + '-' + pad(today.getDate());

  // 1. Summary Metrics
  const summaryMetrics = useMemo(() => {
    const totalStudents = students.length;
    const activeStudents = students.filter(s => s.status === 'active').length;
    const closedStudents = students.filter(s => s.status === 'closed').length;
    const totalTrainings = trainings.length;
    const totalVisits = visits.length;
    const lowRisk = students.filter(s => s.riskLevel === 'low').length;
    const medRisk = students.filter(s => s.riskLevel === 'medium').length;
    const highRisk = students.filter(s => s.riskLevel === 'high').length;
    return { totalStudents, activeStudents, closedStudents, totalTrainings, totalVisits, risk: { lowRisk, medRisk, highRisk } };
  }, [students, trainings, visits]);

  // 2. Category statistics
  const categoryStats = useMemo(() => {
    const counts: Record<string, number> = {};
    trainings.forEach(t => { counts[t.trainingType] = (counts[t.trainingType] || 0) + 1; });
    const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(counts).map(([type, count]) => ({ type, count, proportion: parseFloat(((count / total) * 100).toFixed(1)) })).sort((a, b) => b.count - a.count);
  }, [trainings]);

  // 3. Township Stats from REAL sites data
  const townshipStats = useMemo(() => {
    return sites.map(site => {
      const townStudents = students.filter(s => s.town === site.town);
      const activeInTown = townStudents.filter(s => s.status === 'active').length;
      const townIds = townStudents.map(s => s.id);
      const townTrainings = trainings.filter(t => townIds.includes(t.studentId));
      const todayTrainings = townTrainings.filter(t => (t.createdAt || '').startsWith(todayStr)).length;
      const townVisits = visits.filter(v => townIds.includes(v.studentId));
      const withBaseline = townStudents.filter(s => assessments.some(a => a.studentId === s.id && a.assessmentType === 'baseline')).length;
      return { name: site.name, town: site.town, registeredPatients: townStudents.length, activeManaged: activeInTown, totalTrainings: townTrainings.length, todayTrainings, totalVisits: townVisits.length, withBaseline };
    });
  }, [sites, students, trainings, visits, assessments]);

  // Search filter
  const filtered = useMemo(() => {
    if (!townSearch.trim()) return townshipStats;
    return townshipStats.filter(t => t.town.includes(townSearch.trim()) || t.name.includes(townSearch.trim()));
  }, [townshipStats, townSearch]);

  // 4. Week selector state
  const [weekOffset, setWeekOffset] = useState(0);
  const weekDays = useMemo(() => {
    const mon = new Date(today);
    const day = mon.getDay();
    const diff = mon.getDate() - day + (day === 0 ? -6 : 1) + weekOffset * 7;
    mon.setDate(diff);
    const dates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(mon);
      d.setDate(mon.getDate() + i);
      dates.push(d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate()));
    }
    return dates;
  }, [weekOffset]);

  const weekLabel = useMemo(() => {
    if (weekDays.length < 7) return '';
    return weekDays[0].slice(5) + ' ~ ' + weekDays[6].slice(5);
  }, [weekDays]);

  // 5. Trend Data for multi-line chart (selected week)
  const multiTrendData = useMemo(() => {
    return weekDays.map(date => ({
      date: date.slice(5),
      fullDate: date,
      trainings: trainings.filter(t => (t.createdAt || '').startsWith(date)).length,
      newStudents: students.filter(s => (s.createdAt || '').startsWith(date)).length,
      baseline: assessments.filter(a => a.assessmentType === 'baseline' && (a.assessDate || '').startsWith(date)).length,
      process: assessments.filter(a => (a.assessmentType === 'process1' || a.assessmentType === 'process2') && (a.assessDate || '').startsWith(date)).length,
    }));
  }, [weekDays, trainings, students, assessments]);

  const maxTrendVal = useMemo(() => {
    const vals = multiTrendData.flatMap(d => [d.trainings, d.newStudents, d.baseline, d.process]);
    return Math.max(...vals, 10) || 35;
  }, [multiTrendData]);

  const getSvgPath = (key: 'trainings' | 'newStudents' | 'baseline' | 'process') => {
    const len = multiTrendData.length;
    const pts = multiTrendData.map((dd, ddx) => ({
      x: (ddx / (len - 1)) * 100,
      y: 100 - (dd[key] / maxTrendVal) * 80,
    }));
    if (pts.length < 2) return '';
    if (pts.length === 2) return 'M ' + pts[0].x.toFixed(1) + ',' + pts[0].y.toFixed(1) + ' L ' + pts[1].x.toFixed(1) + ',' + pts[1].y.toFixed(1);
    let d = 'M ' + pts[0].x.toFixed(1) + ',' + pts[0].y.toFixed(1);
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[Math.min(pts.length - 1, i + 2)];
      const t = 0.2;
      d += ' C ' + (p1.x + (p2.x - p0.x) * t).toFixed(1) + ',' + (p1.y + (p2.y - p0.y) * t).toFixed(1)
         + ' ' + (p2.x - (p3.x - p1.x) * t).toFixed(1) + ',' + (p2.y - (p3.y - p1.y) * t).toFixed(1)
         + ' ' + p2.x.toFixed(1) + ',' + p2.y.toFixed(1);
    }
    return d;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200/80">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">全市社区康复数据统计中心</h2>
        <p className="text-sm text-slate-500 mt-1">
          汇聚各辖区站点录入汇总，实现全类别精神障碍康复进程、量表评估基线、以及社会功能恢复等级的精细分析。
        </p>
      </div>

      {/* Grid: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend line chart */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[#1c3652]" />
                <span>全市多维康复动态趋势</span>
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setWeekOffset(w => w - 1)}
                  className="text-[10px] px-2 py-1 rounded border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors font-bold"
                >◀ 上周</button>
                <span className="text-[10px] text-slate-500 font-mono font-bold min-w-[16ch] text-center">{weekLabel}</span>
                <button
                  onClick={() => setWeekOffset(w => w + 1)}
                  className="text-[10px] px-2 py-1 rounded border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors font-bold"
                >下周 ▶</button>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 px-2">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600">
                <span className="w-3 h-0.5 bg-[#1c3652] inline-block" /><span>康复训练次数</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600">
                <span className="w-3 h-0.5 bg-[#10b981] inline-block" /><span>新增基础档案</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600">
                <span className="w-3 h-0.5 bg-[#f59e0b] inline-block" /><span>基线评估</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600">
                <span className="w-3 h-0.5 bg-[#8b5cf6] inline-block" /><span>过程评估</span>
              </div>
            </div>
          </div>
          <div className="mt-4 h-56 flex items-end justify-between relative px-4">
            <div className="absolute inset-x-0 top-0 h-px bg-slate-100" />
            <div className="absolute inset-x-0 top-1/3 h-px bg-slate-100" />
            <div className="absolute inset-x-0 top-2/3 h-px bg-slate-100" />
            <svg className="absolute inset-0 h-44 w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d={getSvgPath('trainings')} fill="none" stroke="#1c3652" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d={getSvgPath('newStudents')} fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d={getSvgPath('baseline')} fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d={getSvgPath('process')} fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {multiTrendData.map((d, i) => (
              <div key={d.date} className="flex flex-col items-center flex-1 z-10 relative group">
                <div className="absolute bottom-28 bg-slate-900 text-white text-[9px] px-2.5 py-1.5 rounded-lg shadow-xl font-bold w-32 z-30 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <p className="text-cyan-400 border-b border-slate-700 pb-0.5 mb-1 font-mono text-center">{d.date}</p>
                  <div className="space-y-0.5 text-left font-mono">
                    <p className="flex justify-between"><span>训练:</span> <span className="text-white">{d.trainings}次</span></p>
                    <p className="flex justify-between"><span>新增:</span> <span className="text-emerald-400">{d.newStudents}人</span></p>
                    <p className="flex justify-between"><span>基线:</span> <span className="text-amber-400">{d.baseline}人</span></p>
                    <p className="flex justify-between"><span>过程:</span> <span className="text-purple-400">{d.process}人</span></p>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 font-mono mt-1 cursor-pointer hover:text-slate-700 hover:font-bold transition-colors">{d.date}</span>
              </div>
            ))}
          </div>
        </div>        {/* Risk distribution donut */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <PieChart className="h-4 w-4 text-[#4c8a8a]" />
              <span>当前在册管理对象风险评定比例</span>
            </h3>
            <span className="text-[10px] text-slate-400">分级管控</span>
          </div>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-around gap-6">
            <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                {summaryMetrics.totalStudents > 0 && (
                  <>
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#10b981" strokeWidth="4"
                      strokeDasharray={(summaryMetrics.risk.lowRisk / summaryMetrics.totalStudents) * 100 + ' ' + (100 - (summaryMetrics.risk.lowRisk / summaryMetrics.totalStudents) * 100)}
                      strokeDashoffset="0" />
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f59e0b" strokeWidth="4"
                      strokeDasharray={(summaryMetrics.risk.medRisk / summaryMetrics.totalStudents) * 100 + ' ' + (100 - (summaryMetrics.risk.medRisk / summaryMetrics.totalStudents) * 100)}
                      strokeDashoffset={'-' + (summaryMetrics.risk.lowRisk / summaryMetrics.totalStudents) * 100} />
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#ef4444" strokeWidth="4"
                      strokeDasharray={(summaryMetrics.risk.highRisk / summaryMetrics.totalStudents) * 100 + ' ' + (100 - (summaryMetrics.risk.highRisk / summaryMetrics.totalStudents) * 100)}
                      strokeDashoffset={'-' + ((summaryMetrics.risk.lowRisk + summaryMetrics.risk.medRisk) / summaryMetrics.totalStudents) * 100} />
                  </>
                )}
              </svg>
              <div className="absolute text-center">
                <span className="text-2xl font-black text-slate-900 block font-mono">{summaryMetrics.totalStudents}</span>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">总人数</span>
              </div>
            </div>
            <div className="space-y-3 flex-1 text-xs font-semibold">
              <div className="flex items-center justify-between p-2 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-lg">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                  <span>低风险(普通)</span>
                </span>
                <span className="font-mono">{summaryMetrics.risk.lowRisk}人({Math.round((summaryMetrics.risk.lowRisk / (summaryMetrics.totalStudents || 1)) * 100)}%)</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-amber-50 text-amber-800 border border-amber-100 rounded-lg">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                  <span>中风险(预警)</span>
                </span>
                <span className="font-mono">{summaryMetrics.risk.medRisk}人({Math.round((summaryMetrics.risk.medRisk / (summaryMetrics.totalStudents || 1)) * 100)}%)</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-rose-50 text-rose-800 border border-rose-100 rounded-lg">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                  <span>高风险(管控)</span>
                </span>
                <span className="font-mono">{summaryMetrics.risk.highRisk}人({Math.round((summaryMetrics.risk.highRisk / (summaryMetrics.totalStudents || 1)) * 100)}%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bar Chart: Training Categories */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 lg:col-span-2">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <BarChart4 className="h-4 w-4 text-cyan-600" />
              <span>九大社区康复训练类别开展成效分析</span>
            </h3>
            <span className="text-[10px] text-slate-400">训练总次数 / 全辖区覆盖</span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-3 mt-6">
            {categoryStats.slice(0, 9).map((item, idx) => {
              const maxCount = Math.max(...categoryStats.map(c => c.count)) || 1;
              const heightPct = Math.max(12, Math.min(100, (item.count / maxCount) * 100));
              const colorClasses = ['bg-blue-600', 'bg-emerald-600', 'bg-indigo-600', 'bg-purple-600', 'bg-pink-600', 'bg-amber-600', 'bg-orange-600', 'bg-teal-600', 'bg-cyan-600'];
              return (
                <div key={item.type} className="flex flex-col items-center justify-end h-36 text-center group cursor-pointer p-1.5 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-100">
                  <span className="text-[10px] font-bold font-mono text-slate-600 group-hover:text-slate-900 transition-colors mb-1">{item.count}次</span>
                  <div className="w-5 bg-slate-100 rounded-t-md overflow-hidden flex items-end h-20">
                    <div className={'w-full rounded-t-md transition-all duration-700 ' + colorClasses[idx % colorClasses.length]} style={{ height: heightPct + '%' }} />
                  </div>
                  <span className="text-[9px] font-bold text-slate-500 mt-2 truncate w-full" title={item.type}>{item.type.replace('训练', '')}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* High Risk Student Monitoring List */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 lg:col-span-2">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Users className="h-4 w-4 text-rose-500" />
              <span>社区康复重点关注人员风险评估监控名册</span>
            </h3>
            <span className="text-[10px] text-rose-500 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">高/中风险跟控</span>
          </div>
          <div className="mt-4 overflow-y-auto max-h-56 divide-y divide-slate-100">
            {students.filter(s => s.status === 'active' && (s.riskLevel === 'high' || s.riskLevel === 'medium')).length > 0 ? (
              students.filter(s => s.status === 'active' && (s.riskLevel === 'high' || s.riskLevel === 'medium')).map(s => (
                <div key={s.id} className="py-2.5 flex items-center justify-between gap-2 hover:bg-slate-50/50 px-2 rounded-lg transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800">{s.name}</span>
                      <span className="text-[9px] font-bold text-slate-400 font-mono bg-slate-100 px-1.5 py-0.5 rounded">{s.town}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">{s.idCard.slice(0,6)}********{s.idCard.slice(14)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={'inline-flex px-2 py-0.5 rounded text-[9px] font-black border ' + (
                      s.riskLevel === 'high' ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse' : 'bg-amber-50 text-amber-700 border-amber-200'
                    )}>
                      {s.riskLevel === 'high' ? '高风险' : '中风险'}
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold">{s.phone || '无电话'}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-[11px] text-slate-400 font-semibold">
                当前全辖区无高、中风险受控学员，全员均处于低风险状态。
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tab Selector */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setSelectedStatTab('townships')}
          className={'px-5 py-2.5 text-xs font-bold transition-colors relative ' + (
            selectedStatTab === 'townships'
              ? 'text-[#1c3652] border-b-2 border-[#1c3652]'
              : 'text-slate-400 hover:text-slate-600'
          )}
        >
          辖区核算表
        </button>
        <button
          onClick={() => setSelectedStatTab('categories')}
          className={'px-5 py-2.5 text-xs font-bold transition-colors relative ' + (
            selectedStatTab === 'categories'
              ? 'text-[#1c3652] border-b-2 border-[#1c3652]'
              : 'text-slate-400 hover:text-slate-600'
          )}
        >
          类别比例分析
        </button>
      </div>

      {/* Township Table */}
      {selectedStatTab === 'townships' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Search */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">数据统计中心 · 辖区核算表</h3>
            <div className="relative w-56">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="搜索辖区乡镇..."
                value={townSearch}
                onChange={e => setTownSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4c8a8a]/30 focus:border-[#4c8a8a] bg-slate-50"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-5 text-left">辖区服务站点</th>
                  <th className="py-3 px-5 text-center">在册精神障碍患者</th>
                  <th className="py-3 px-5 text-center">在管在册</th>
                  <th className="py-3 px-5 text-center">康复训练</th>
                  <th className="py-3 px-5 text-center">入户探访</th>
                  <th className="py-3 px-5 text-center">今日训练动态</th>
                  <th className="py-3 px-5 text-right">建档率</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(item => {
                  const enrollmentPercentage = item.registeredPatients > 0 ? Math.round((item.withBaseline / item.registeredPatients) * 100) : 0;
                  return (
                    <tr key={item.town} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-2.5">
                          <MapPin className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                          <span>{item.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-5 text-center font-mono text-slate-700">{item.registeredPatients}</td>
                      <td className="py-3 px-5 text-center font-mono text-slate-700">{item.activeManaged}</td>
                      <td className="py-3 px-5 text-center font-mono text-slate-700">{item.totalTrainings}</td>
                      <td className="py-3 px-5 text-center font-mono text-slate-700">{item.totalVisits}</td>
                      <td className="py-3 px-5 text-center">
                        {item.todayTrainings > 0 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 text-cyan-800 font-mono">
                            +{item.todayTrainings} 新增
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono">—</span>
                        )}
                      </td>
                      <td className="py-3 px-5 text-right font-mono">
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-slate-700">{enrollmentPercentage}%</span>
                          <div className="w-12 bg-slate-100 h-1.5 rounded-full overflow-hidden inline-block">
                            <div className="bg-[#4c8a8a] h-full rounded-full" style={{ width: enrollmentPercentage + '%' }} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-8 text-slate-400">无匹配的辖区乡镇</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Categories Analysis */}
      {selectedStatTab === 'categories' && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="pb-3 border-b border-slate-100 mb-4">
            <h3 className="font-bold text-slate-900 text-xs uppercase">九大门类及手工、认知训练结构比例分析</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">统计历次录入的康复练习类型分布，指导阶段性康复活动的科学比重。</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="space-y-4">
              {categoryStats.map((item, idx) => (
                <div key={item.type} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-800">{item.type}</span>
                    <span className="text-slate-500 font-mono">{item.count}次 <span className="text-slate-400">({item.proportion}%)</span></span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div className={'h-full rounded-full transition-all duration-500 ' + (
                      idx === 0 ? 'bg-[#1c3652]' : idx === 1 ? 'bg-[#2b4c70]' : idx === 2 ? 'bg-[#4c8a8a]' : idx === 3 ? 'bg-[#c9a96e]' : 'bg-slate-400'
                    )} style={{ width: item.proportion + '%' }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
              <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <Info className="h-4 w-4 text-[#2b4c70]" />
                <span>精康数据科学分析研判意见</span>
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                1. <strong>服药依从性</strong>是康复的核心基线。从当前比例来看，
                <span className="font-semibold text-slate-800">【{categoryStats[0]?.type || '服药训练'}】</span>仍然占主导地位，
                这是实现精神稳定最关键的基础抓手。
              </p>
              <p className="text-xs text-slate-600 leading-relaxed">
                2. 随着患者状态转归趋于平稳，建议在未来的训练比重中，适当上调
                <span className="font-semibold text-slate-800">【生活技能训练】</span>与
                <span className="font-semibold text-slate-800">【社会交往适应能力训练】</span>的权重，进一步促进障碍患者早日重归社区生活与正常就业。
              </p>
              <div className="pt-3 border-t border-slate-200 text-[10px] text-slate-400 flex justify-between">
                <span>汇算人：张主任</span>
                <span>算力更新：2026-07-17 18:00</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}







