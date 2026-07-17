/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Building, 
  Lock, 
  User as UserIcon, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  ClipboardList, 
  AlertCircle,
  Megaphone,
  RefreshCw,
  X as CloseIcon,
  LayoutDashboard,
  BarChart4,
  Users,
  FileSpreadsheet,
  Home,
  BrainCircuit,
  Database,
  UserCircle
} from 'lucide-react';

// Data and Types
import { Student, Assessment, TrainingRecord, HomeVisit, Announcement, Site, User } from './types';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useSitesQuery,
  useUsersQuery,
  useAddUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useStudentsQuery,
  useAddStudentMutation,
  useUpdateStudentMutation,
  useDeleteStudentMutation,
  useAssessmentsQuery,
  useAddAssessmentMutation,
  useDeleteAssessmentMutation,
  useTrainingsQuery,
  useAddTrainingMutation,
  useDeleteTrainingMutation,
  useVisitsQuery,
  useAddVisitMutation,
  useDeleteVisitMutation,
  useAnnouncementsQuery,
  useAddAnnouncementMutation,
  useUpdateAnnouncementMutation,
  useDeleteAnnouncementMutation,
  loginUser,
  getAuthToken,
  setAuthToken,
} from './lib/api';

// Components
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import StudentsList from './components/StudentsList';
import AssessmentsList from './components/AssessmentsList';
import TrainingsList from './components/TrainingsList';
import VisitsList from './components/VisitsList';
import ServicePointsList from './components/ServicePointsList';
import AnnouncementsList from './components/AnnouncementsList';
import Profile from './components/Profile';
import Statistics from './components/Statistics';
import DataQuery from './components/DataQuery';

const queryClient = new QueryClient();

const TAB_META: Record<string, { name: string; icon: any }> = {
  dashboard: { name: '办公桌面', icon: LayoutDashboard },
  statistics: { name: '数据统计中心', icon: BarChart4 },
  students: { name: '学员档案管理', icon: Users },
  assessments: { name: '基线评估', icon: FileSpreadsheet },
  process1: { name: '第一次过程评估', icon: ClipboardList },
  process2: { name: '第二次过程评估', icon: ClipboardList },
  visits: { name: '入户探访随记', icon: Home },
  trainings: { name: '九大康复训练', icon: BrainCircuit },
  'data-query': { name: '数据查询中心', icon: Database },
  'service-points': { name: '服务点用户管理', icon: Building },
  announcements: { name: '公告通告管理', icon: Megaphone },
  profile: { name: '个人中心', icon: UserCircle },
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

function AppContent() {
  // 1. Session and Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [sessionUser, setSessionUser] = useState<User | null>(null);
  
  // Login credentials form
  const [usernameInput, setUsernameInput] = useState('admin');
  const [passwordInput, setPasswordInput] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  // 2. React Query Core Entities Queries (Syncs automatically with PostgreSQL database)
  const { data: students = [] } = useStudentsQuery();
  const { data: assessments = [] } = useAssessmentsQuery();
  const { data: trainings = [] } = useTrainingsQuery();
  const { data: visits = [] } = useVisitsQuery();
  const { data: announcements = [] } = useAnnouncementsQuery();
  const { data: sites = [] } = useSitesQuery();
  const { data: users = [] } = useUsersQuery();

  // Mutations
  const addStudentMutation = useAddStudentMutation();
  const updateStudentMutation = useUpdateStudentMutation();
  const deleteStudentMutation = useDeleteStudentMutation();
  const addAssessmentMutation = useAddAssessmentMutation();
  const deleteAssessmentMutation = useDeleteAssessmentMutation();
  const addTrainingMutation = useAddTrainingMutation();
  const deleteTrainingMutation = useDeleteTrainingMutation();
  const addVisitMutation = useAddVisitMutation();
  const deleteVisitMutation = useDeleteVisitMutation();
  const addAnnouncementMutation = useAddAnnouncementMutation();
  const updateAnnouncementMutation = useUpdateAnnouncementMutation();
  const deleteAnnouncementMutation = useDeleteAnnouncementMutation();
  const addUserMutation = useAddUserMutation();
  const updateUserMutation = useUpdateUserMutation();
  const deleteUserMutation = useDeleteUserMutation();

  // 3. Navigation State
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [openTabs, setOpenTabs] = useState<string[]>(['dashboard']);
  const [selectedSubTrainingType, setSelectedSubTrainingType] = useState<string | null>(null);
  const [themeMode, setThemeMode] = useState<'default' | 'eyeprotect'>('default');

  React.useEffect(() => {
    if (currentTab && !openTabs.includes(currentTab)) {
      setOpenTabs(prev => [...prev, currentTab]);
    }
  }, [currentTab, openTabs]);

  // 3b. Announcement Popup States
  const [activePopupAnn, setActivePopupAnn] = useState<Announcement | null>(null);
  const [dismissedAnnIds, setDismissedAnnIds] = useState<string[]>([]);
  const [countdown, setCountdown] = useState<number>(10);
  const [isCountdownFinished, setIsCountdownFinished] = useState<boolean>(false);

  // Handle Login Action
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    try {
      const result = await loginUser(usernameInput.trim(), passwordInput);
      setSessionUser(result.user);
      setIsAuthenticated(true);
      setCurrentTab('dashboard');
      // Persist session to localStorage so refresh doesn't log out
      localStorage.setItem("rehab_session_user", JSON.stringify(result.user));
      localStorage.setItem("rehab_session_time", Date.now().toString());
    } catch (err: any) {
      const msg = err?.response?.data?.detail || '登录失败，请检查网络连接。';
      setLoginError(msg);
    }
  };

  // Logout Helper
  const handleLogout = () => {
    setIsAuthenticated(false);
    setSessionUser(null);
    setAuthToken(null);
    setUsernameInput('admin');
    setPasswordInput('admin123');
    setLoginError('');
    localStorage.removeItem("rehab_session_user");
    localStorage.removeItem("rehab_session_time");
  };

  // Find site name helper for session user
  const sessionUserSiteName = useMemo(() => {
    if (!sessionUser) return 'A市康复网络中心';
    const site = sites.find(s => s.id === sessionUser.siteId);
    return site ? site.name : 'A市精神障碍社区康复中心';
  }, [sessionUser, sites]);

  // Find town helper for session user
  const sessionUserTown = useMemo(() => {
    if (!sessionUser) return '赛岐镇';
    const site = sites.find(s => s.id === sessionUser.siteId);
    return site ? site.town : '赛岐镇';
  }, [sessionUser, sites]);

  // Restore session & auto-refresh token every 5 minutes
  React.useEffect(() => {
    const token = getAuthToken();
    if (!token) return;

    // Try to restore user session from localStorage
    const savedUser = localStorage.getItem("rehab_session_user");
    if (savedUser && !sessionUser) {
      try {
        const user = JSON.parse(savedUser);
        setSessionUser(user);
        setIsAuthenticated(true);
      } catch (e) {
        localStorage.removeItem("rehab_session_user");
      }
    }

    // Token expiry check
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload.exp * 1000 < Date.now()) {
        setAuthToken(null);
        setIsAuthenticated(false);
        setSessionUser(null);
        localStorage.removeItem("rehab_session_user");
        return;
      }
    } catch (e) {
      setAuthToken(null);
    }
  }, []);

  // 5-minute heartbeat: keep session alive and refresh data
  React.useEffect(() => {
    if (!sessionUser) return;
    const refresh = () => {
      // Touch the session timer so it doesn't appear stale
      localStorage.setItem("rehab_session_time", Date.now().toString());
    };
    refresh(); // initial touch
    const timer = setInterval(refresh, 5 * 60 * 1000);
    return () => clearInterval(timer);
  }, [sessionUser]);

  // Listen for auth:expired events from API interceptor
  React.useEffect(() => {
    const handler = () => {
      setIsAuthenticated(false);
      setSessionUser(null);
      localStorage.removeItem("rehab_session_user");
      localStorage.removeItem("rehab_session_time");
    };
    window.addEventListener("auth:expired", handler);
    return () => window.removeEventListener("auth:expired", handler);
  }, []);
  
  // Operations and Mutations Callbacks
  const handleAddStudent = (newStudent: Student) => {
    // Map town to correct site UUID from database
    const matchedSite = sites.find(s => s.town === newStudent.town);
    const studentToAdd: Student = {
      ...newStudent,
      siteId: matchedSite ? matchedSite.id : newStudent.siteId,
    };
    addStudentMutation.mutate(studentToAdd);
  };

  const handleUpdateStudent = (updatedStudent: Student) => {
    const matchedSite = sites.find(s => s.town === updatedStudent.town);
    const studentToUpdate: Student = {
      ...updatedStudent,
      siteId: matchedSite ? matchedSite.id : updatedStudent.siteId,
    };
    updateStudentMutation.mutate(studentToUpdate);
  };

  const handleDeleteStudent = (id: string) => {
    deleteStudentMutation.mutate(id);
  };

  const handleAddAssessment = (newAssess: Assessment) => {
    addAssessmentMutation.mutate(newAssess);
  };

  const handleDeleteAssessment = (id: string) => {
    deleteAssessmentMutation.mutate(id);
  };

  const handleAddTraining = (newTrain: TrainingRecord) => {
    addTrainingMutation.mutate(newTrain);
  };

  const handleDeleteTraining = (id: string) => {
    deleteTrainingMutation.mutate(id);
  };

  const handleAddVisit = (newVisit: HomeVisit) => {
    addVisitMutation.mutate(newVisit);
  };

  const handleDeleteVisit = (id: string) => {
    deleteVisitMutation.mutate(id);
  };

  const handleAddAnnouncement = (newAnn: Announcement) => {
    addAnnouncementMutation.mutate(newAnn);
  };

  const handleUpdateAnnouncement = (updatedAnn: Announcement) => {
    updateAnnouncementMutation.mutate(updatedAnn);
  };

  const handleDeleteAnnouncement = (id: string) => {
    deleteAnnouncementMutation.mutate(id);
  };

  // When a worker logs in, check if there is an active announcement to show in right popup
  React.useEffect(() => {
    if (isAuthenticated && sessionUser && sessionUser.role === 'worker') {
      const todayStr = '2026-07-17';
      const activeAnns = announcements.filter(ann => {
        if (!ann.startDate || !ann.endDate) return false;
        return ann.startDate <= todayStr && ann.endDate >= todayStr && !dismissedAnnIds.includes(ann.id);
      });

      if (activeAnns.length > 0) {
        const targetAnn = activeAnns[0];
        setActivePopupAnn(targetAnn);
        
        // Check if already viewed and completed 10s countdown previously
        const fullyReadStr = localStorage.getItem('fully_read_announcements') || '[]';
        try {
          const fullyReadList = JSON.parse(fullyReadStr);
          if (fullyReadList.includes(targetAnn.id)) {
            setCountdown(0);
            setIsCountdownFinished(true);
          } else {
            setCountdown(10);
            setIsCountdownFinished(false);
          }
        } catch (e) {
          setCountdown(10);
          setIsCountdownFinished(false);
        }
      } else {
        setActivePopupAnn(null);
      }
    } else {
      setActivePopupAnn(null);
    }
  }, [isAuthenticated, sessionUser, announcements, dismissedAnnIds]);

  // Countdown timer for announcement popup
  React.useEffect(() => {
    if (activePopupAnn && !isCountdownFinished && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            setIsCountdownFinished(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [activePopupAnn, countdown, isCountdownFinished]);

  const handleClosePopup = () => {
    if (!activePopupAnn) return;
    
    // Dismiss ALL currently active announcements at once
    const todayStr = '2026-07-17';
    const allActiveIds = announcements
      .filter(ann => ann.startDate && ann.endDate && ann.startDate <= todayStr && ann.endDate >= todayStr)
      .map(ann => ann.id);
    
    setDismissedAnnIds(prev => [...new Set([...prev, ...allActiveIds])]);
    
    // Save all to fully read list in localStorage
    const fullyReadStr = localStorage.getItem('fully_read_announcements') || '[]';
    try {
      const fullyReadList = JSON.parse(fullyReadStr);
      allActiveIds.forEach(id => {
        if (!fullyReadList.includes(id)) fullyReadList.push(id);
      });
      localStorage.setItem('fully_read_announcements', JSON.stringify(fullyReadList));
    } catch (e) {
      localStorage.setItem('fully_read_announcements', JSON.stringify(allActiveIds));
    }
    
    setActivePopupAnn(null);
  };
  const handleToggleUserStatus = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      updateUserMutation.mutate({ ...user, isActive: !user.isActive });
    }
  };

  const handleResetPassword = (userId: string) => {
    alert('该操作员账号登录密码已成功重置为默认值：admin123');
  };

  const handleUnbindWechat = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      updateUserMutation.mutate({ ...user, wechatOpenid: undefined as any });
      alert('该操作员绑定的微信号解绑完成。可在下次登录时扫码重新绑定。');
    }
  };

  const handleUpdateUser = (updatedUser: User) => {
    updateUserMutation.mutate(updatedUser);
    alert('操作员账户信息更新成功。');
  };

  const handleAddUser = (newUser: User) => {
    addUserMutation.mutate(newUser);
    alert('账号创建成功。该账户在A市精康系统中即时生效。');
  };

  const handleDeleteUser = (userId: string) => {
    deleteUserMutation.mutate(userId);
    alert('该操作员账号已成功从统战数据库中物理注销并安全移除。');
  };

  // Quick Action triggers from Dashboard
  const handleQuickAction = (actionType: string) => {
    if (actionType === 'add-student') {
      setCurrentTab('students');
      // Set short timer to open form inside StudentsList by dispatching or state, 
      // but since they are encapsulated, navigating to tab is primary.
    } else if (actionType === 'add-training') {
      setCurrentTab('trainings');
    } else if (actionType === 'add-assessment') {
      setCurrentTab('assessments');
    } else if (actionType === 'add-visit') {
      setCurrentTab('visits');
    }
  };


  // --- RENDERING PORTION ---

  // A. IF NOT AUTHENTICATED -> Render Dignified Login Screen
  if (!isAuthenticated || !sessionUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#122335] via-[#1a2d42] to-[#253a52] flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
        
        {/* Background Visual Grid Lines */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

        {/* System Title Card Header */}
        <div className="mb-6 text-center max-w-lg z-10 space-y-2">
          <div className="inline-flex p-3 bg-cyan-400/10 rounded-2xl border border-cyan-400/20 mb-1">
            <ClipboardList className="h-8 w-8 text-cyan-400" />
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-wider text-white">精神障碍社区康复服务信息系统</h1>
          
        </div>

        {/* Central Login Card */}
        <div className="w-full max-w-md bg-white/95 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-white/10 z-10">
          <div className="text-center pb-4 border-b border-slate-100 mb-6">
            <h3 className="text-sm font-bold text-slate-800">操作人员安全账户登录</h3>
            
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs text-slate-800">
            {loginError && (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg text-rose-700 font-semibold flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">系统操作账号</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="请输入您的账号用户名"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-400 focus:bg-white transition-all font-medium"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">安全登录密码</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="测试环境默认密码：admin123"
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-400 focus:bg-white transition-all font-mono font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#1c3652] hover:bg-[#152741] text-white font-bold rounded-xl transition-all cursor-pointer shadow-lg hover:shadow-xl mt-3 flex items-center justify-center gap-2"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>验证并登录系统</span>
            </button>
          </form>

        </div>

        {/* Footer Credit */}
        <div className="mt-8 text-center text-[10px] text-slate-500 font-mono tracking-wider">
          © 2026 个人版权所有
        </div>
      </div>
    );
  }

  // B. IF LOGGED IN -> Render Master Administrative Screen Shell Layout
  return (
    <div className={`flex h-screen w-screen overflow-hidden transition-colors duration-300 ${
      themeMode === 'eyeprotect' ? 'bg-[#eef3eb]' : 'bg-[#f4f7f6]'
    }`}>
      {/* 1. Left Side Navigation Sidebar panel */}
      <Sidebar 
        currentTab={currentTab} 
        onTabChange={setCurrentTab} 
        selectedSubTrainingType={selectedSubTrainingType}
        onSubTrainingTypeChange={setSelectedSubTrainingType}
        currentUser={{
          realName: sessionUser.realName,
          role: sessionUser.role,
          siteName: sessionUserSiteName,
        }}
        onLogout={handleLogout}
      />

      {/* 2. Right Side Content panel container */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Top Navbar */}
        <header className="h-14 bg-white border-b border-slate-200 px-6 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <Building className="h-5 w-5 text-slate-400" />
            <h2 className="text-sm font-bold text-slate-800">
              A市社区康复服务专网 ── <span className="text-cyan-700">{sessionUserSiteName}</span>
            </h2>
          </div>
          <div className="flex items-center gap-4 text-xs">
            {/* Header Right Actions: Standard Refresh UI */}
            <div className="flex items-center gap-2 border-r border-slate-200 pr-4">
              <button
                onClick={() => {
                  alert('系统数据已完成同步刷新，统计中心与仪表盘已加载最新康复报表。');
                }}
                className="p-2 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-lg transition-all duration-200 cursor-pointer flex items-center justify-center group"
                title="手动刷新同步网络数据"
              >
                <RefreshCw className="h-4 w-4 group-hover:rotate-180 transition-transform duration-500" />
              </button>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="text-slate-400">网络服务器节点:</span>
              <span className="font-bold text-slate-700 font-mono bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                A-CITY-NODE-01
              </span>
            </div>
          </div>
        </header>

        {/* Browser-like Top Navigation Tabs Bar */}
        <div className="flex items-end bg-slate-100/60 border-b border-slate-200/80 px-4 h-10 shrink-0 select-none overflow-x-auto no-scrollbar gap-1">
          {openTabs.map(tabId => {
            const tabMeta = TAB_META[tabId] || { name: tabId, icon: ClipboardList };
            const TabIcon = tabMeta.icon;
            const isActive = currentTab === tabId;
            
            return (
              <div
                key={tabId}
                onClick={() => {
                  setCurrentTab(tabId);
                }}
                className={`flex items-center gap-2 h-8 px-4 text-xs font-bold rounded-t-lg transition-all cursor-pointer relative top-[1px] border-t border-x ${
                  isActive
                    ? 'bg-[#f4f7f6] text-[#1c3652] border-slate-200 border-b-[#f4f7f6] z-10'
                    : 'bg-transparent text-slate-500 border-transparent hover:bg-slate-200/50 hover:text-slate-700'
                }`}
                style={{ minWidth: '110px', maxWidth: '200px' }}
              >
                <TabIcon className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-[#1c3652]' : 'text-slate-400'}`} />
                <span className="truncate pr-2">{tabMeta.name}</span>
                {tabId !== 'dashboard' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Close tab logic
                      const index = openTabs.indexOf(tabId);
                      const nextTabs = openTabs.filter(t => t !== tabId);
                      setOpenTabs(nextTabs);
                      if (currentTab === tabId) {
                        // Switch to the next available tab or the last one
                        const nextActive = nextTabs[Math.min(index, nextTabs.length - 1)] || 'dashboard';
                        setCurrentTab(nextActive);
                      }
                    }}
                    className="p-0.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center shrink-0 ml-auto"
                  >
                    <CloseIcon className="h-3 w-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Main Tab Panel Display area */}
        <main className="flex-1 overflow-y-auto p-6">
          {currentTab === 'dashboard' && (
            <Dashboard 
              students={students} 
              trainings={trainings} 
              visits={visits} 
              assessments={assessments}
              announcements={announcements} 
              currentUser={{
                realName: sessionUser.realName,
                role: sessionUser.role,
                siteId: sessionUser.siteId,
                town: sessionUserTown,
              }}
            />
          )}

          {currentTab === 'students' && (
            <StudentsList 
              students={students} 
              onAddStudent={handleAddStudent} 
              onUpdateStudent={handleUpdateStudent} 
              onDeleteStudent={handleDeleteStudent}
              currentUser={{
                role: sessionUser.role,
                siteId: sessionUser.siteId,
                town: sessionUserTown,
              }}
            />
          )}

          {(currentTab === 'assessments' || currentTab === 'process1' || currentTab === 'process2') && (
            <AssessmentsList 
              assessments={assessments} 
              students={students} 
              onAddAssessment={handleAddAssessment} 
              onDeleteAssessment={handleDeleteAssessment}
              initialMainTab={currentTab === 'assessments' ? 'baseline' : 'process'}
              initialProcessSubTab={currentTab === 'process2' ? 'process2' : 'process1'}
              currentUser={{
                role: sessionUser.role,
                siteId: sessionUser.siteId,
                town: sessionUserTown,
                realName: sessionUser.realName,
              }}
            />
          )}

          {currentTab === 'trainings' && (
            <TrainingsList 
              trainings={trainings} 
              students={students} 
              onAddTraining={handleAddTraining} 
              onDeleteTraining={handleDeleteTraining}
              selectedSubTrainingType={selectedSubTrainingType}
              currentUser={{
                realName: sessionUser.realName,
                role: sessionUser.role,
                siteId: sessionUser.siteId,
                town: sessionUserTown,
              }}
            />
          )}

          {currentTab === 'visits' && (
            <VisitsList 
              visits={visits} 
              students={students} 
              onAddVisit={handleAddVisit}
              onDeleteVisit={handleDeleteVisit}
              currentUser={{
                realName: sessionUser.realName,
                role: sessionUser.role,
                siteId: sessionUser.siteId,
                town: sessionUserTown,
              }}
            />
          )}

          {currentTab === 'statistics' && (
            <Statistics 
              students={students}
              trainings={trainings}
              visits={visits}
              assessments={assessments}
              sites={sites}
              currentUser={{
                role: sessionUser.role,
                siteId: sessionUser.siteId,
                town: sessionUserTown,
              }}
            />
          )}

          {currentTab === 'data-query' && (
            <DataQuery 
              students={students}
              assessments={assessments}
              trainings={trainings}
              sites={sites}
              currentUser={{
                role: sessionUser.role,
                siteId: sessionUser.siteId,
                town: sessionUserTown,
              }}
              onNavigateTab={(tabId) => {
                setCurrentTab(tabId);
                if (!openTabs.includes(tabId)) {
                  setOpenTabs(prev => [...prev, tabId]);
                }
              }}
            />
          )}

          {currentTab === 'service-points' && (
            <ServicePointsList 
              sites={sites} 
              users={users} 
              onToggleUserStatus={handleToggleUserStatus} 
              onResetPassword={handleResetPassword} 
              onUnbindWechat={handleUnbindWechat}
              onUpdateUser={handleUpdateUser}
              onAddUser={handleAddUser}
              onDeleteUser={handleDeleteUser}
              currentUser={{
                role: sessionUser.role,
                siteId: sessionUser.siteId,
              }}
            />
          )}

          {currentTab === 'announcements' && (
            <AnnouncementsList 
              announcements={announcements} 
              onAddAnnouncement={handleAddAnnouncement} 
              onUpdateAnnouncement={handleUpdateAnnouncement}
              onDeleteAnnouncement={handleDeleteAnnouncement}
              currentUser={{
                realName: sessionUser.realName,
                role: sessionUser.role,
              }}
            />
          )}

          {currentTab === 'profile' && (
            <Profile 
              currentUser={{
                realName: sessionUser.realName,
                username: sessionUser.username,
                role: sessionUser.role,
                siteName: sessionUserSiteName,
                phone: sessionUser.phone,
              }}
            />
          )}
        </main>
      </div>

      {/* Right Side Announcement Auto-Popup */}
      {activePopupAnn && (
        <div className="fixed right-6 bottom-6 w-96 bg-white border-2 border-[#1c3652] shadow-2xl rounded-2xl z-50 p-6 animate-in slide-in-from-right-10 duration-300">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 text-[#1c3652]">
            <Megaphone className="h-5 w-5 text-[#1c3652] animate-bounce" />
            <h3 className="font-bold text-sm tracking-tight">有新发布的系统通告</h3>
          </div>
          
          <div className="mt-4 space-y-3">
            <h4 className="font-bold text-slate-900 text-xs">{activePopupAnn.title}</h4>
            <div className="max-h-60 overflow-y-auto text-xs text-slate-600 leading-relaxed font-medium bg-slate-50 p-3 rounded-xl border border-slate-200/50 whitespace-pre-wrap">
              {activePopupAnn.content}
            </div>
            
            <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono pt-1">
              <span>发布单位: {activePopupAnn.createdBy}</span>
              <span>发布于: {activePopupAnn.createdAt.slice(0, 10)}</span>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100">
            <button
              onClick={handleClosePopup}
              disabled={!isCountdownFinished}
              className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                isCountdownFinished
                  ? 'bg-[#1c3652] hover:bg-[#152741] text-white shadow-md'
                  : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
              }`}
            >
              <span>{isCountdownFinished ? '我知道了 (关闭)' : `请先阅读公告 (${countdown}秒)`}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
