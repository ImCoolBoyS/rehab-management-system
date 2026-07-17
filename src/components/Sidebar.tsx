/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  FileSpreadsheet, 
  BrainCircuit, 
  Home, 
  Megaphone, 
  UserCircle, 
  LogOut,
  Building,
  ClipboardList,
  BarChart4,
  ChevronDown,
  ChevronRight,
  CircleDot,
  Search,
  Database
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  selectedSubTrainingType: string | null;
  onSubTrainingTypeChange: (type: string | null) => void;
  currentUser: {
    realName: string;
    role: string;
    siteName: string;
  };
  onLogout: () => void;
}

export default function Sidebar({ 
  currentTab, 
  onTabChange, 
  selectedSubTrainingType,
  onSubTrainingTypeChange,
  currentUser, 
  onLogout 
}: SidebarProps) {
  // We manage folding of submenus. Default folded.
  const [isTrainingsSubmenuOpen, setIsTrainingsSubmenuOpen] = useState(false);
  const [isProcessSubmenuOpen, setIsProcessSubmenuOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', name: '办公桌面', icon: LayoutDashboard, roles: ['admin', 'supervisor', 'worker'] },
    { id: 'statistics', name: '数据统计中心', icon: BarChart4, roles: ['admin', 'supervisor', 'worker'] },
    { id: 'students', name: '学员档案管理', icon: Users, roles: ['admin', 'supervisor', 'worker'] },
    { id: 'assessments', name: '基线评估', icon: FileSpreadsheet, roles: ['admin', 'supervisor', 'worker'] },
    { id: 'process', name: '过程评估', icon: ClipboardList, roles: ['admin', 'supervisor', 'worker'], hasProcessSubmenu: true },
    { id: 'visits', name: '入户探访随记', icon: Home, roles: ['admin', 'supervisor', 'worker'] },
    { id: 'trainings', name: '九大康复训练', icon: BrainCircuit, roles: ['admin', 'supervisor', 'worker'], hasSubmenu: true },
    { id: 'data-query', name: '数据查询中心', icon: Database, roles: ['admin', 'supervisor', 'worker'] }, // INSERTED BETWEEN TRAININGS AND SERVICE-POINTS
    { id: 'service-points', name: '服务点用户管理', icon: Building, roles: ['admin', 'supervisor'] },
    { id: 'announcements', name: '公告通告管理', icon: Megaphone, roles: ['admin', 'supervisor', 'worker'] },
    { id: 'profile', name: '个人中心', icon: UserCircle, roles: ['admin', 'supervisor', 'worker'] },
  ];

  const filteredMenuItems = menuItems.filter(item => item.roles.includes(currentUser.role));

  const TRAINING_SUB_TYPES = [
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

  const handleTabClick = (itemId: string) => {
    if (itemId === 'trainings') {
      onTabChange('trainings');
      onSubTrainingTypeChange(null); // Show all by default
      setIsTrainingsSubmenuOpen(!isTrainingsSubmenuOpen);
    } else if (itemId === 'process') {
      setIsProcessSubmenuOpen(!isProcessSubmenuOpen);
      // Auto-navigate to process1 when parent clicked
      onTabChange('process1');
    } else {
      onTabChange(itemId);
    }
  };

  return (
    <div className="w-64 bg-[#1a2d42] text-slate-100 flex flex-col h-screen shrink-0 border-r border-[#152435]">
      {/* System Logo Area */}
      <div className="p-5 border-b border-[#233a52] flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#2a435d] rounded-lg animate-pulse">
            <ClipboardList className="h-6 w-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-wide text-white leading-tight">A市精神障碍</h1>
            <p className="text-[11px] text-cyan-400 font-semibold tracking-wider uppercase">社区康复服务系统</p>
          </div>
        </div>
      </div>

      {/* User Status Bar */}
      <div className="px-5 py-4 bg-[#142334] border-b border-[#233a52] flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">当前操作员:</span>
          <span className="text-xs font-semibold px-2 py-0.5 bg-[#253f5c] text-cyan-300 rounded">
            {currentUser.role === 'admin' ? '市级总站' : currentUser.role === 'supervisor' ? '站点主管' : '社工人员'}
          </span>
        </div>
        <div className="text-sm font-semibold text-white mt-1">{currentUser.realName}</div>
        <div className="text-[11px] text-slate-400 overflow-hidden text-ellipsis whitespace-nowrap" title={currentUser.siteName}>
          {currentUser.siteName}
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto no-scrollbar py-4 px-3 space-y-1">
        {filteredMenuItems.map(item => {
          const Icon = item.icon;
          // An item is active if currentTab matches its ID or if we are inside process submenus
          const isProcessActiveTab = (item.id === 'process' && (currentTab === 'process1' || currentTab === 'process2'));
          const isActive = currentTab === item.id || isProcessActiveTab;
          
          return (
            <div key={item.id} className="space-y-1">
              <button
                onClick={() => handleTabClick(item.id)}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer ${
                  isActive 
                    ? 'bg-[#2a4563] text-white shadow-md border-l-4 border-cyan-400 pl-3' 
                    : 'text-slate-300 hover:bg-[#20364e] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-4 w-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                </div>
                {(item.hasSubmenu || item.hasProcessSubmenu) && (
                  <div>
                    {item.hasSubmenu ? (
                      isTrainingsSubmenuOpen ? <ChevronDown className="h-3.5 w-3.5 text-slate-400" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                    ) : (
                      isProcessSubmenuOpen ? <ChevronDown className="h-3.5 w-3.5 text-slate-400" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                    )}
                  </div>
                )}
              </button>

              {/* Collapsible Submenu for process evaluations */}
              {item.hasProcessSubmenu && isProcessSubmenuOpen && (
                <div className="pl-6 space-y-1 mt-1 transition-all no-scrollbar overflow-hidden">
                  <button
                    onClick={() => onTabChange('process1')}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${
                      currentTab === 'process1'
                        ? 'text-cyan-300 bg-[#253f5c]/50'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-[#20364e]/30'
                    }`}
                  >
                    <CircleDot className="h-2.5 w-2.5 shrink-0" />
                    <span>第一次过程评估</span>
                  </button>
                  <button
                    onClick={() => onTabChange('process2')}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${
                      currentTab === 'process2'
                        ? 'text-cyan-300 bg-[#253f5c]/50'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-[#20364e]/30'
                    }`}
                  >
                    <CircleDot className="h-2.5 w-2.5 shrink-0" />
                    <span>第二次过程评估</span>
                  </button>
                </div>
              )}

              {/* Collapsible Submenu for trainings */}
              {item.hasSubmenu && isTrainingsSubmenuOpen && (
                <div className="pl-6 space-y-1 mt-1 transition-all max-h-60 overflow-y-auto no-scrollbar">
                  <button
                    onClick={() => {
                      onTabChange('trainings');
                      onSubTrainingTypeChange(null);
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${
                      currentTab === 'trainings' && selectedSubTrainingType === null
                        ? 'text-cyan-300 bg-[#253f5c]/50'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-[#20364e]/30'
                    }`}
                  >
                    <CircleDot className="h-2.5 w-2.5 shrink-0" />
                    <span>全部训练记录</span>
                  </button>

                  {TRAINING_SUB_TYPES.map(type => {
                    const isSubActive = currentTab === 'trainings' && selectedSubTrainingType === type;
                    return (
                      <button
                        key={type}
                        onClick={() => {
                          onTabChange('trainings');
                          onSubTrainingTypeChange(type);
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${
                          isSubActive
                            ? 'text-cyan-300 bg-[#253f5c]/50'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-[#20364e]/30'
                        }`}
                      >
                        <CircleDot className="h-2.5 w-2.5 shrink-0 opacity-60" />
                        <span className="truncate">{type}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Sidebar Footer / Logout */}
      <div className="p-4 border-t border-[#233a52] bg-[#142334]">
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#d93838]/10 hover:bg-[#d93838]/20 text-[#ff6b6b] border border-[#d93838]/25 rounded-lg text-xs font-semibold transition-colors duration-150 cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          <span>安全退出系统</span>
        </button>
        <div className="text-center text-[10px] text-slate-500 mt-3 font-mono">
          SYSTEM VERSION v4.0.0
        </div>
      </div>
    </div>
  );
}
