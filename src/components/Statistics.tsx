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
import { Student, TrainingRecord, HomeVisit, Site } from '../types';

interface StatisticsProps {
  students: Student[];
  trainings: TrainingRecord[];
  visits: HomeVisit[];
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
  sites,
  currentUser 
}: StatisticsProps) {
  const [townSearch, setTownSearch] = useState('');
  const [selectedStatTab, setSelectedStatTab] = useState<"townships" | "categories">("townships");

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;

  // Summary Metrics
  const summaryMetrics = useMemo(() => ({
    totalStudents: students.length,
    activeStudents: students.filter(s => s.status === "active").length,
    closedStudents: students.filter(s => s.status === "closed").length,
    totalTrainings: trainings.length,
    totalVisits: visits.length,
    risk: {
      lowRisk: students.filter(s => s.riskLevel === "low").length,
      medRisk: students.filter(s => s.riskLevel === "medium").length,
      highRisk: students.filter(s => s.riskLevel === "high").length,
    }
  }), [students, trainings, visits]);

  // Township Stats from REAL data
  const townshipStats = useMemo(() => {
    return sites.map(site => {
      const townStudents = students.filter(s => s.town === site.town);
      const activeInTown = townStudents.filter(s => s.status === "active").length;
      const townIds = townStudents.map(s => s.id);
      const townTrainings = trainings.filter(t => townIds.includes(t.studentId));
      const todayTrainings = townTrainings.filter(t => (t.createdAt || "").startsWith(todayStr)).length;
      const townVisits = visits.filter(v => townIds.includes(v.studentId));

      return {
        name: site.name,
        town: site.town,
        registeredPatients: townStudents.length,
        activeManaged: activeInTown,
        totalTrainings: townTrainings.length,
        todayTrainings,
        totalVisits: townVisits.length,
      };
    });
  }, [sites, students, trainings, visits]);

  // Search
  const filtered = useMemo(() => {
    if (!townSearch.trim()) return townshipStats;
    return townshipStats.filter(t => t.town.includes(townSearch.trim()) || t.name.includes(townSearch.trim()));
  }, [townshipStats, townSearch]);

  // Category stats (same as before)
  const categoryStats = useMemo(() => {
    const counts: Record<string, number> = {};
    trainings.forEach(t => { counts[t.trainingType] = (counts[t.trainingType] || 0) + 1; });
    const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(counts).map(([type, count]) => ({ type, count, proportion: parseFloat(((count / total) * 100).toFixed(1)) }))
      .sort((a, b) => b.count - a.count);
  }, [trainings]);

  // Trend data
  const multiTrendData = useMemo(() => {
    const dates: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      dates.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`);
    }
    return dates.map(date => ({
      date: date.slice(5),
      trainings: trainings.filter(t => (t.createdAt || "").startsWith(date)).length,
      newStudents: students.filter(s => (s.createdAt || "").startsWith(date)).length,
      baseline: 0, // not tracking separately yet
      process: 0,
    }));
  }, [trainings, students]);

  const maxTrendVal = Math.max(...multiTrendData.flatMap(d => [d.trainings, d.newStudents, 10]), 10);

  const getSvgPath = (dataKey: "trainings" | "newStudents", color: string) => {
    const values = multiTrendData.map(d => d[dataKey]);
    const max = maxTrendVal;
    const w = 100, h = 40;
    const pts = values.map((v, i) => `${(i / (values.length - 1)) * w},${h - (v / max) * h * 0.85 - 2}`).join(" ");
    return { path: pts, color };
  };

  const trend1 = getSvgPath("trainings", "#1c3652");
  const trend2 = getSvgPath("newStudents", "#4c8a8a");

  return (
    <div className="space-y-6">
      {/* === SUMMARY CARDS === */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">名单在册总人数</div>
          <div className="text-2xl font-black text-[#1c3652] mt-1 font-mono">{summaryMetrics.totalStudents}</div>
          <div className="text-[10px] text-slate-400 mt-1">活跃: {summaryMetrics.activeStudents} / 结案: {summaryMetrics.closedStudents}</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">累计训练总数</div>
          <div className="text-2xl font-black text-[#2b4c70] mt-1 font-mono">{summaryMetrics.totalTrainings}</div>
          <div className="text-[10px] text-slate-400 mt-1">覆盖 {new Set(trainings.map(t => t.studentId)).size} 名学员</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">累计入户探访</div>
          <div className="text-2xl font-black text-[#4c8a8a] mt-1 font-mono">{summaryMetrics.totalVisits}</div>
          <div className="text-[10px] text-slate-400 mt-1">覆盖 {new Set(visits.map(v => v.studentId)).size} 名学员</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">低/中/高风险</div>
          <div className="text-2xl font-black text-slate-800 mt-1 font-mono flex gap-2">
            <span className="text-emerald-600">{summaryMetrics.risk.lowRisk}</span>
            <span className="text-amber-500">{summaryMetrics.risk.medRisk}</span>
            <span className="text-rose-600">{summaryMetrics.risk.highRisk}</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">低 / 中 / 高风险学员</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">今日录入新增</div>
          <div className="text-2xl font-black text-cyan-700 mt-1 font-mono">
            {trainings.filter(t => (t.createdAt || "").startsWith(todayStr)).length + 
             visits.filter(v => (v.visitDate || "").startsWith(todayStr)).length}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">训练 + 探访</div>
        </div>
      </div>

      {/* === TAB SWITCH === */}
      <div className="flex gap-3">
        <button onClick={() => setSelectedStatTab("townships")} 
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${selectedStatTab === "townships" ? "bg-[#1c3652] text-white shadow-sm" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}>
          <MapPin className="h-3.5 w-3.5 inline mr-1" />辖区各服务点统计核算表
        </button>
        <button onClick={() => setSelectedStatTab("categories")}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${selectedStatTab === "categories" ? "bg-[#1c3652] text-white shadow-sm" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}>
          <BarChart4 className="h-3.5 w-3.5 inline mr-1" />九大门类结构比例分析
        </button>
      </div>

      {/* === TOWNSHIP TABLE === */}
      {selectedStatTab === "townships" && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input type="text" value={townSearch} onChange={e => setTownSearch(e.target.value)}
                  placeholder="搜索辖区乡镇..." 
                  className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs w-56 focus:outline-none focus:border-slate-400" />
              </div>
              <span className="text-[10px] text-slate-400 font-mono">{filtered.length} / {townshipStats.length} 个站点</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">数据截止: {todayStr} 18:00</div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold text-[11px]">
                  <th className="py-3 px-5 text-left">服务站点管辖区（乡镇）</th>
                  <th className="py-3 px-5 text-center">名单在册</th>
                  <th className="py-3 px-5 text-center">当前册子所在档</th>
                  <th className="py-3 px-5 text-center">累计进行训练数</th>
                  <th className="py-3 px-5 text-center">累计入户探访数</th>
                  <th className="py-3 px-5 text-center">今日录入新增</th>
                  <th className="py-3 px-5 text-right">信息建档率</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => {
                  const enrollmentPercentage = item.registeredPatients > 0 
                    ? Math.round((item.activeManaged / item.registeredPatients) * 100) 
                    : 0;
                  return (
                    <tr key={item.town} className="border-t border-slate-100 hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-5 font-semibold text-slate-800">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-slate-400 shrink-0" />
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
                            <div className="bg-[#4c8a8a] h-full rounded-full" style={{ width: `${enrollmentPercentage}%` }} />
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

      {/* === CATEGORIES (unchanged from original) === */}
      {selectedStatTab === "categories" && (
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
                    <div className={`h-full rounded-full transition-all duration-500 ${idx === 0 ? "bg-[#1c3652]" : idx === 1 ? "bg-[#2b4c70]" : idx === 2 ? "bg-[#4c8a8a]" : idx === 3 ? "bg-[#c9a96e]" : "bg-slate-400"}`} style={{ width: `${item.proportion}%` }} />
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
                <span className="font-semibold text-slate-800">【{categoryStats[0]?.type || "服药训练"}】</span>仍然占主导地位，
                这是实现精神稳定最关键的基础抓手。
              </p>
              <p className="text-xs text-slate-600 leading-relaxed">
                2. 随着患者状态转归趋于平稳，建议在未来的训练比重中，适当上调
                <span className="font-semibold text-slate-800">【生活技能训练】</span>与
                <span className="font-semibold text-slate-800">【社会交往适应能力训练】</span>的权重。
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
