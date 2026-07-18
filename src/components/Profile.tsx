/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { User, Award, Smartphone, Building } from 'lucide-react';

interface ProfileProps {
  currentUser: {
    realName: string;
    username: string;
    role: string;
    siteName: string;
    phone: string;
  };
}

export default function Profile({ currentUser }: ProfileProps) {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Consolidated Action Toolbar (Single Horizontal Layout) */}
      <div className="flex flex-wrap items-center bg-white p-3.5 rounded-xl shadow-sm border border-slate-200/80 gap-3">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-[#1c3652]" />
          <span className="text-xs font-bold text-slate-700">操作员个人中心 ── 账户信息与安全审计</span>
        </div>
      </div>

      {/* Account Parameters Details */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden divide-y divide-slate-100">
        <div className="p-5 flex items-center gap-4">
          <div className="p-3 bg-slate-900 text-white rounded-2xl">
            <User className="h-8 w-8" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">{currentUser.realName}</h3>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">系统账号名: {currentUser.username}</p>
          </div>
        </div>

        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-800 font-medium">
          <div className="space-y-1">
            <span className="text-slate-400 block font-normal">系统角色级别</span>
            <span className="inline-flex items-center gap-1 text-[#2b4c70] font-bold">
              <Award className="h-4 w-4" />
              <span>{currentUser.role === 'admin' ? '市级总站管理员 (Admin)' : currentUser.role === 'supervisor' ? '站点管理员 (Supervisor)' : '站点社工用户 (Worker)'}</span>
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 block font-normal">联系电话</span>
            <span className="flex items-center gap-1 font-mono text-slate-800">
              <Smartphone className="h-4 w-4 text-slate-400" />
              <span>{currentUser.phone || '未录入联系手机'}</span>
            </span>
          </div>

          <div className="space-y-1 sm:col-span-2">
            <span className="text-slate-400 block font-normal">所属康复机构及服务点</span>
            <span className="flex items-center gap-1.5 text-slate-800">
              <Building className="h-4 w-4 text-slate-400" />
              <span className="font-bold">{currentUser.siteName}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
