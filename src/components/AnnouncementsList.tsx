/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Megaphone, Plus, X, AlertCircle, FileText, Trash2, Calendar, Edit3, Clock } from 'lucide-react';
import { Announcement } from '../types';

interface AnnouncementsListProps {
  announcements: Announcement[];
  onAddAnnouncement: (newAnn: Announcement) => void;
  onUpdateAnnouncement: (updatedAnn: Announcement) => void;
  onDeleteAnnouncement: (id: string) => void;
  currentUser: {
    realName: string;
    role: string;
  };
}

export default function AnnouncementsList({ 
  announcements, 
  onAddAnnouncement, 
  onUpdateAnnouncement,
  onDeleteAnnouncement,
  currentUser 
}: AnnouncementsListProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  
  const [formValues, setFormValues] = useState({
    title: '',
    content: '',
    startDate: '2026-07-17',
    endDate: '2026-07-24'
  });

  const canManage = currentUser.role === 'admin' || currentUser.role === 'supervisor';

  const handleOpenAdd = () => {
    setEditingAnnouncement(null);
    setFormValues({
      title: '',
      content: '',
      startDate: '2026-07-17',
      endDate: '2026-07-24'
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (ann: Announcement) => {
    setEditingAnnouncement(ann);
    setFormValues({
      title: ann.title,
      content: ann.content,
      startDate: ann.startDate || '2026-07-17',
      endDate: ann.endDate || '2026-07-24'
    });
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValues.title || !formValues.content) {
      alert('请确保标题和内容均填写完整。');
      return;
    }

    if (editingAnnouncement) {
      const updatedAnn: Announcement = {
        ...editingAnnouncement,
        title: formValues.title,
        content: formValues.content,
        startDate: formValues.startDate,
        endDate: formValues.endDate,
      };
      onUpdateAnnouncement(updatedAnn);
      alert('公告修改成功！');
    } else {
      const newAnn: Announcement = {
        id: `ann-${Date.now()}`,
        title: formValues.title,
        content: formValues.content,
        createdAt: new Date().toISOString(),
        createdBy: currentUser.realName,
        startDate: formValues.startDate,
        endDate: formValues.endDate,
      };
      onAddAnnouncement(newAnn);
      alert('新公告发布成功！');
    }

    setIsFormOpen(false);
    setEditingAnnouncement(null);
  };

  return (
    <div className="space-y-6">
      {/* Consolidated Action Toolbar (Single Horizontal Layout) */}
      <div className="flex flex-wrap items-center bg-white p-3.5 rounded-xl shadow-sm border border-slate-200/80 gap-3">
        <div className="flex items-center gap-2">
          <Megaphone className="h-4 w-4 text-[#1c3652]" />
          <span className="text-xs font-bold text-slate-700">系统公告与运营指令发布中心</span>
        </div>
        {canManage && (
          <button
            onClick={handleOpenAdd}
            className="ml-auto flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-[#1c3652] hover:bg-[#152741] text-white rounded-lg text-xs font-bold shadow-md cursor-pointer transition-all shrink-0 h-[32px]"
          >
            <Plus className="h-4 w-4" />
            <span>发布新公告</span>
          </button>
        )}
      </div>

      {/* Bulletins List */}
      <div className="space-y-4">
        {announcements.map((ann) => (
          <div key={ann.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col justify-between relative overflow-hidden">
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-[#2b4c70] shrink-0" />
                  <h3 className="font-bold text-slate-900 text-sm">{ann.title}</h3>
                </div>
                {canManage && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEdit(ann)}
                      className="p-1 text-slate-400 hover:text-cyan-600 rounded hover:bg-cyan-50 transition-colors cursor-pointer shrink-0"
                      title="编辑公告"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('确认物理撤回并删除此公告通告？')) {
                          onDeleteAnnouncement(ann.id);
                        }
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                      title="撤回公告"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-medium whitespace-pre-wrap pl-7">
                {ann.content}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[10px] text-slate-400 font-mono pl-7 mt-4 border-t border-slate-100 pt-3 gap-2">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>发布日期: {ann.createdAt.replace('T', ' ').substring(0, 16)}</span>
                </span>
                {ann.startDate && ann.endDate && (
                  <span className="flex items-center gap-1 text-[#2b4c70] font-bold">
                    <Clock className="h-3 w-3" />
                    <span>自动弹窗期: {ann.startDate} 至 {ann.endDate}</span>
                  </span>
                )}
              </div>
              <span>发布单位/人: {ann.createdBy}</span>
            </div>
          </div>
        ))}

        {announcements.length === 0 && (
          <p className="text-center py-12 text-slate-400 font-medium bg-white rounded-xl border border-slate-200 text-xs">
            暂无发布的政策指导公告文件
          </p>
        )}
      </div>

      {/* NEW/EDIT BULLETIN DIALOG */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden flex flex-col border border-slate-200">
            <div className="px-6 py-4 bg-[#1a2d42] text-white flex justify-between items-center">
              <h3 className="text-sm font-bold">{editingAnnouncement ? '修改公告通告文件' : '下发全网工作通知文件'}</h3>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="p-1 hover:bg-[#2a4563] rounded-lg transition-colors text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs text-slate-800">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">通告标题 *</label>
                <input
                  type="text"
                  value={formValues.title}
                  onChange={(e) => setFormValues(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 font-bold"
                  placeholder="例：关于系统升级或合规操作指引"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">通告正文内容 *</label>
                <textarea
                  rows={6}
                  value={formValues.content}
                  onChange={(e) => setFormValues(prev => ({ ...prev, content: e.target.value }))}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 font-medium text-xs leading-relaxed"
                  placeholder="请输入公告核心正文..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">弹窗生效日期 (从) *</label>
                  <input
                    type="date"
                    value={formValues.startDate}
                    onChange={(e) => setFormValues(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 font-mono"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">弹窗截止日期 (至) *</label>
                  <input
                    type="date"
                    value={formValues.endDate}
                    onChange={(e) => setFormValues(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 font-mono"
                    required
                  />
                </div>
              </div>

              <p className="text-[10px] text-slate-400 leading-relaxed bg-slate-50 p-2.5 rounded-lg">
                提示：在设置的弹窗生效时间范围内，当下级社工登录系统时，本公告将作为高优先级弹窗自动显示在右侧，需要其阅读满 10 秒后才可进行手动关闭。
              </p>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg cursor-pointer font-bold"
                >
                  {editingAnnouncement ? '确认修改公告' : '立即下发通告'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
