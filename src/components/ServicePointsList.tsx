/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Building, 
  User, 
  Edit, 
  Power, 
  RefreshCw, 
  Link2Off, 
  Search, 
  Plus,
  ShieldCheck,
  ChevronRight,
  X,
  UserPlus,
  Trash2
} from 'lucide-react';
import { Site, User as SystemUser } from '../types';

interface ServicePointsListProps {
  sites: Site[];
  users: SystemUser[];
  onToggleUserStatus: (userId: string) => void;
  onResetPassword: (userId: string) => void;
  onUnbindWechat: (userId: string) => void;
  onUpdateUser: (updatedUser: SystemUser) => void;
  onAddUser?: (newUser: SystemUser) => void;
  onDeleteUser?: (userId: string) => void;
  currentUser: {
    role: string;
    siteId: string;
  };
}

export default function ServicePointsList({ 
  sites, 
  users, 
  onToggleUserStatus, 
  onResetPassword, 
  onUnbindWechat,
  onUpdateUser,
  onAddUser,
  onDeleteUser,
  currentUser
}: ServicePointsListProps) {
  // Currently selected service point (defaulting to A City 9 service point or first)
  const [selectedSiteId, setSelectedSiteId] = useState<string>(currentUser.role === 'admin' ? 'site-a-9' : currentUser.siteId);
  const [siteSearch, setSiteSearch] = useState('');
  
  // Edit User Modal state
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formValues, setFormValues] = useState({
    realName: '',
    phone: '',
    role: 'worker' as 'admin' | 'supervisor' | 'worker',
  });

  // Add User Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addFormValues, setAddFormValues] = useState({
    username: '',
    realName: '',
    gender: '男',
    phone: '',
    role: 'worker' as 'admin' | 'supervisor' | 'worker',
  });

  // Filter service points list by keyword
  const filteredSites = useMemo(() => {
    return sites.filter(s => s.name.includes(siteSearch.trim()) || s.town.includes(siteSearch.trim()));
  }, [sites, siteSearch]);

  // Selected site data
  const selectedSite = useMemo(() => {
    return sites.find(s => s.id === selectedSiteId) || sites[0];
  }, [sites, selectedSiteId]);

  // Users in the selected site
  const siteUsers = useMemo(() => {
    return users.filter(u => u.siteId === selectedSiteId);
  }, [users, selectedSiteId]);

  // Handle Edit User Click
  const handleEditClick = (user: SystemUser) => {
    setEditingUser(user);
    setFormValues({
      realName: user.realName,
      phone: user.phone,
      role: user.role,
    });
    setIsEditModalOpen(true);
  };

  // Save User Click
  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    const updated: SystemUser = {
      ...editingUser,
      realName: formValues.realName,
      phone: formValues.phone,
      role: formValues.role,
    };
    onUpdateUser(updated);
    setIsEditModalOpen(false);
  };

  // Create User submit
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addFormValues.username.trim() || !addFormValues.realName.trim()) {
      alert('请输入用户名与真实姓名！');
      return;
    }
    // Check duplication
    const isDup = users.some(u => u.username.toLowerCase() === addFormValues.username.trim().toLowerCase());
    if (isDup) {
      alert('抱歉！该登录用户名已被系统内其他操作员占用，请使用其他用户名。');
      return;
    }

    const newUser: SystemUser = {
      id: `user-${Date.now()}`,
      username: addFormValues.username.trim(),
      realName: addFormValues.realName.trim(),
      gender: addFormValues.gender,
      phone: addFormValues.phone.trim(),
      role: addFormValues.role,
      isActive: true,
      siteId: selectedSiteId,
    };

    onAddUser && onAddUser(newUser);
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Consolidated Action Toolbar (Single Horizontal Layout) */}
      <div className="flex flex-wrap items-center bg-white p-3.5 rounded-xl shadow-sm border border-slate-200/80 gap-3">
        {/* Search Input for Sites */}
        <div className="relative flex-1 min-w-[150px]">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="搜索服务点名称..."
            value={siteSearch}
            onChange={(e) => setSiteSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:bg-white text-slate-800 font-semibold"
          />
        </div>

        {/* Quick select service point */}
        <div className="shrink-0 flex items-center gap-2 text-xs">
          <span className="font-bold text-slate-500 shrink-0">快速切换服务点:</span>
          <select
            value={selectedSiteId}
            onChange={e => {
              if (currentUser.role === 'admin') {
                setSelectedSiteId(e.target.value);
              } else {
                alert('非总站管理员，仅限访问本站点。');
              }
            }}
            className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none text-slate-800 cursor-pointer"
          >
            {sites.map(s => (
              <option key={s.id} value={s.id}>{s.town}服务点</option>
            ))}
          </select>
        </div>

        {/* Action Button: Add User */}
        {currentUser.role === 'admin' && (
          <button
            onClick={() => {
              setAddFormValues({
                username: '',
                realName: '',
                gender: '男',
                phone: '',
                role: 'worker',
              });
              setIsAddModalOpen(true);
            }}
            className="ml-auto flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-[#1c3652] hover:bg-[#152741] text-white rounded-lg text-xs font-bold shadow-md cursor-pointer transition-all shrink-0 h-[32px]"
          >
            <UserPlus className="h-4 w-4" />
            <span>新增专职社工</span>
          </button>
        )}
      </div>

      {/* Main Split Pane: Left Tree List of Service points, Right Table of User accounts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Service Points (服务点列表) - col-span-4 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 lg:col-span-4 flex flex-col h-[520px] overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-slate-800 text-xs tracking-wider uppercase mb-2">乡镇康复服务点</h3>
            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="过滤服务点..."
                value={siteSearch}
                onChange={(e) => setSiteSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:border-slate-400 text-slate-800 font-medium"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1 divide-y divide-slate-100 no-scrollbar">
            {filteredSites.map((site) => {
              const isSelected = site.id === selectedSiteId;
              return (
                <button
                  key={site.id}
                  onClick={() => {
                    if (currentUser.role === 'admin') {
                      setSelectedSiteId(site.id);
                    } else {
                      alert('非总站管理员，仅限访问本站点。');
                    }
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-[#1a2d42]/10 text-[#1a2d42] border-l-4 border-[#1a2d42]' 
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <Building className={`h-4 w-4 shrink-0 ${isSelected ? 'text-[#1a2d42]' : 'text-slate-400'}`} />
                    <span className="text-xs font-semibold overflow-hidden text-ellipsis whitespace-nowrap" title={site.name}>
                      {site.town}社区康复服务点
                    </span>
                  </div>
                  <ChevronRight className="h-3 w-3 text-slate-400 shrink-0" />
                </button>
              );
            })}
            {filteredSites.length === 0 && (
              <p className="text-center py-6 text-slate-400 text-xs font-medium">无匹配的服务点</p>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Users Table of Selected Service Point (用户列表) - col-span-8 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 lg:col-span-8 flex flex-col h-[520px] overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-800 text-xs tracking-wider uppercase">
                {selectedSite ? selectedSite.town : '甘棠镇'}服务点 ── 用户账户列表
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5 font-mono">SITE CODE: {selectedSite?.id}</p>
            </div>
            
            <div className="flex items-center gap-2">
              {currentUser.role === 'admin' && (
                <div className="text-[11px] text-[#2b4c70] font-semibold flex items-center gap-1.5 bg-[#2b4c70]/10 px-2.5 py-1 rounded">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>总站管理权已授信</span>
                </div>
              )}
            </div>
          </div>

          {/* User list table */}
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-5">真实姓名</th>
                  <th className="py-3.5 px-5">用户名 (Account)</th>
                  <th className="py-3.5 px-5 text-center">性别</th>
                  <th className="py-3.5 px-5">手机号码</th>
                  <th className="py-3.5 px-5">系统角色</th>
                  <th className="py-3.5 px-5 text-center">状态</th>
                  <th className="py-3.5 px-5 text-right">账号授权操底</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 font-medium text-slate-700">
                {siteUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-5 font-bold text-slate-950 flex items-center gap-2">
                      <div className="p-1 bg-[#2b4c70]/10 rounded-lg text-[#2b4c70]">
                        <User className="h-3.5 w-3.5" />
                      </div>
                      <span>{user.realName}</span>
                    </td>
                    <td className="py-3.5 px-5 font-mono text-slate-500">{user.username}</td>
                    <td className="py-3.5 px-5 text-center">{user.gender}</td>
                    <td className="py-3.5 px-5 font-mono text-slate-500">{user.phone || '未记录'}</td>
                    <td className="py-3.5 px-5">
                      <span className="font-semibold text-slate-800">
                        {user.role === 'admin' ? '市总站管理员' : user.role === 'supervisor' ? '站点管理员' : '专职社工'}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                        user.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {user.isActive ? '在职启用' : '账户停用'}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right whitespace-nowrap space-x-1.5">
                      {currentUser.role === 'admin' && (
                        <>
                          <button
                            onClick={() => handleEditClick(user)}
                            className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded transition-colors cursor-pointer text-[10px] font-bold"
                            title="修改真实姓名及角色"
                          >
                            <Edit className="h-2.5 w-2.5" />
                            <span>编辑</span>
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`确认${user.isActive ? '停用' : '启用'}此用户账号？`)) {
                                onToggleUserStatus(user.id);
                              }
                            }}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded transition-colors cursor-pointer text-[10px] font-bold ${
                              user.isActive 
                                ? 'text-rose-600 hover:text-rose-950 bg-rose-50 hover:bg-rose-100' 
                                : 'text-emerald-600 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100'
                            }`}
                            title="停用或恢复此用户"
                          >
                            <Power className="h-2.5 w-2.5" />
                            <span>{user.isActive ? '停用' : '启用'}</span>
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('确认重置此操作员的登录密码？')) {
                                onResetPassword(user.id);
                              }
                            }}
                            className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded transition-colors cursor-pointer text-[10px] font-bold"
                            title="重置密码为默认 admin123"
                          >
                            <RefreshCw className="h-2.5 w-2.5" />
                            <span>重置</span>
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('是否解除此操作员绑定的微信号，解除后需要重新扫码配对。')) {
                                onUnbindWechat(user.id);
                              }
                            }}
                            className="inline-flex items-center gap-1 text-[#4c8a8a] hover:text-[#254545] bg-teal-50 hover:bg-teal-100 px-2 py-1 rounded transition-colors cursor-pointer text-[10px] font-bold"
                            title="微信解除配对"
                          >
                            <Link2Off className="h-2.5 w-2.5" />
                            <span>解绑</span>
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`警告！确定从精康系统中物理注销该操作员账号 [ ${user.realName} ] 吗？此操作不可逆。`)) {
                                onDeleteUser && onDeleteUser(user.id);
                              }
                            }}
                            className="inline-flex items-center gap-1 text-rose-600 hover:text-white hover:bg-rose-600 bg-rose-50 px-2 py-1 rounded transition-colors cursor-pointer text-[10px] font-bold border border-rose-200/50"
                            title="注销此操作员账号"
                          >
                            <Trash2 className="h-2.5 w-2.5" />
                            <span>删除</span>
                          </button>
                        </>
                      )}
                      {currentUser.role !== 'admin' && (
                        <span className="text-slate-400 text-[10px] font-mono">总站鉴权授权</span>
                      )}
                    </td>
                  </tr>
                ))}
                {siteUsers.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-slate-400 font-semibold bg-white">
                      该服务点暂无登记的专职社工用户
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* EDIT USER ACCOUNT MODAL (Admin action only) */}
      {isEditModalOpen && editingUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden flex flex-col border border-slate-200">
            {/* Header */}
            <div className="px-6 py-4 bg-[#1a2d42] text-white flex justify-between items-center">
              <h3 className="text-sm font-bold">编辑服务点操作员资料</h3>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 hover:bg-[#2a4563] rounded-lg transition-colors text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveUser} className="p-6 space-y-4 text-xs text-slate-800">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">真实姓名</label>
                <input
                  type="text"
                  value={formValues.realName}
                  onChange={(e) => setFormValues(prev => ({ ...prev, realName: e.target.value }))}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 font-medium"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">手机号码</label>
                <input
                  type="text"
                  value={formValues.phone}
                  onChange={(e) => setFormValues(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 font-mono font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">分配角色等级</label>
                <select
                  value={formValues.role}
                  onChange={(e) => setFormValues(prev => ({ ...prev, role: e.target.value as any }))}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 font-medium"
                >
                  <option value="worker">康复机构服务点用户 (一般业务录入)</option>
                  <option value="supervisor">站点管理员 (拥有本点档案编辑权)</option>
                  <option value="admin">市总站管理员 (全市特权)</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg cursor-pointer"
                >
                  保存用户资料
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD USER ACCOUNT MODAL (Admin action only) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden flex flex-col border border-slate-200">
            {/* Header */}
            <div className="px-6 py-4 bg-[#1a2d42] text-white flex justify-between items-center">
              <h3 className="text-sm font-bold">为 {selectedSite?.town} 分配并录入专职账号</h3>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 hover:bg-[#2a4563] rounded-lg transition-colors text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleAddSubmit} className="p-6 space-y-4 text-xs text-slate-800">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">登录用户名 (Username) *</label>
                <input
                  type="text"
                  placeholder="例如: shengli_worker (不可重复)"
                  value={addFormValues.username}
                  onChange={(e) => setAddFormValues(prev => ({ ...prev, username: e.target.value }))}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 font-mono font-bold text-slate-800"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">社工真实姓名 *</label>
                <input
                  type="text"
                  placeholder="输入操作员中文名字"
                  value={addFormValues.realName}
                  onChange={(e) => setAddFormValues(prev => ({ ...prev, realName: e.target.value }))}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">性别 *</label>
                  <select
                    value={addFormValues.gender}
                    onChange={(e) => setAddFormValues(prev => ({ ...prev, gender: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 font-medium cursor-pointer"
                  >
                    <option value="男">男</option>
                    <option value="女">女</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">手机号码</label>
                  <input
                    type="text"
                    placeholder="输入手机号码"
                    value={addFormValues.phone}
                    onChange={(e) => setAddFormValues(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 font-mono font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">分配初始系统角色 *</label>
                <select
                  value={addFormValues.role}
                  onChange={(e) => setAddFormValues(prev => ({ ...prev, role: e.target.value as any }))}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 font-medium cursor-pointer"
                >
                  <option value="worker">专职业务人员 (社工 ── 拥有业务增删录入权)</option>
                  <option value="supervisor">服务点主管 (拥有站点档案综合修正权)</option>
                  <option value="admin">市总站管理员 (拥有全市统战管理及注销权)</option>
                </select>
              </div>

              <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-[11px] text-amber-800 leading-relaxed font-semibold">
                提示: 添加后该账号将即时加入A市精康统战数据库。初始密码在模拟系统中默认为 <span className="font-mono text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-200">admin123</span>，登录后可在个人中心自主修改。
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg cursor-pointer"
                >
                  录入数据库
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
