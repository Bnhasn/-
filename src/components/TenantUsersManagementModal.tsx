import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Key,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  AlertTriangle,
  Building,
  Check,
  RefreshCw,
  X,
  Eye,
  EyeOff
} from 'lucide-react';
import { OrganizationTenant, TenantUserAccount, DepartmentRole } from '../types';
import { StorageService } from '../lib/storage';

interface TenantUsersManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTenant: OrganizationTenant;
  currentUser: TenantUserAccount | null;
}

export const TenantUsersManagementModal: React.FC<TenantUsersManagementModalProps> = ({
  isOpen,
  onClose,
  activeTenant,
  currentUser
}) => {
  const [users, setUsers] = useState<TenantUserAccount[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // User Form State
  const [fullName, setFullName] = useState('');
  const [rank, setRank] = useState('نقيب');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [roleTitle, setRoleTitle] = useState('ضابط إدارة القوة البشرية');
  const [departmentRole, setDepartmentRole] = useState<DepartmentRole>('إدارة القوة البشرية');

  // Permissions State
  const [canAdd, setCanAdd] = useState(true);
  const [canEdit, setCanEdit] = useState(true);
  const [canDelete, setCanDelete] = useState(false);
  const [canExport, setCanExport] = useState(true);

  // Module Permissions
  const [modPersonnel, setModPersonnel] = useState(true);
  const [modArmament, setModArmament] = useState(false);
  const [modMedical, setModMedical] = useState(false);
  const [modSecurity, setModSecurity] = useState(false);
  const [modReports, setModReports] = useState(true);
  const [modAudit, setModAudit] = useState(false);
  const [modAccounts, setModAccounts] = useState(false);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadTenantUsers();
      setShowAddForm(false);
      setEditingUserId(null);
      setFeedback(null);
    }
  }, [isOpen, activeTenant.id]);

  const loadTenantUsers = () => {
    const list = StorageService.getTenantUsers(activeTenant.id);
    setUsers(list);
  };

  if (!isOpen) return null;

  const resetForm = () => {
    setFullName('');
    setRank('نقيب');
    setUsername('');
    setPassword('');
    setRoleTitle('ضابط القوة البشرية');
    setDepartmentRole('إدارة القوة البشرية');
    setCanAdd(true);
    setCanEdit(true);
    setCanDelete(false);
    setCanExport(true);
    setModPersonnel(true);
    setModArmament(false);
    setModMedical(false);
    setModSecurity(false);
    setModReports(true);
    setModAudit(false);
    setModAccounts(false);
    setEditingUserId(null);
  };

  const handleCreateOrUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!fullName.trim() || !username.trim()) {
      setFeedback({ type: 'error', message: 'يرجى تعبئة جميع الحقول الأساسية لاسم المستخدم والاسم الكامل' });
      return;
    }

    if (!editingUserId && !password.trim()) {
      setFeedback({ type: 'error', message: 'يرجى تحديد كلمة المرور للمستخدم الجديد' });
      return;
    }

    const permissionObj = {
      role: departmentRole,
      canAdd,
      canEdit,
      canDelete,
      canExport,
      modules: {
        personnel: modPersonnel,
        armament: modArmament,
        medical: modMedical,
        security: modSecurity,
        reports: modReports,
        audit: modAudit,
        accounts: modAccounts
      }
    };

    if (editingUserId) {
      // Edit User
      const existing = users.find((u) => u.id === editingUserId);
      if (existing) {
        const updated: TenantUserAccount = {
          ...existing,
          fullName: fullName.trim(),
          rank: rank.trim(),
          roleTitle: roleTitle.trim(),
          username: username.trim(),
          password: password.trim() ? password.trim() : existing.password,
          permissions: permissionObj
        };
        StorageService.updateTenantUser(activeTenant.id, updated);
        setFeedback({ type: 'success', message: `تم تحديث صلاحيات المستخدم (${updated.fullName}) بنجاح!` });
      }
    } else {
      // New User
      const newUser: TenantUserAccount = {
        id: `user-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        tenantId: activeTenant.id,
        username: username.trim(),
        password: password.trim(),
        fullName: fullName.trim(),
        rank: rank.trim(),
        isSuperAdmin: false,
        roleTitle: roleTitle.trim(),
        status: 'نشط',
        createdAt: new Date().toISOString().split('T')[0],
        permissions: permissionObj
      };

      StorageService.addTenantUser(activeTenant.id, newUser);
      setFeedback({ type: 'success', message: `تم إضافة المستخدم الجديد (${newUser.fullName}) وتفعيل حساب الصلاحيات!` });
    }

    loadTenantUsers();
    setShowAddForm(false);
    resetForm();
  };

  const handleEditClick = (u: TenantUserAccount) => {
    setEditingUserId(u.id);
    setFullName(u.fullName);
    setRank(u.rank || '');
    setUsername(u.username);
    setPassword('');
    setRoleTitle(u.roleTitle);
    setDepartmentRole(u.permissions.role);
    setCanAdd(u.permissions.canAdd);
    setCanEdit(u.permissions.canEdit);
    setCanDelete(u.permissions.canDelete);
    setCanExport(u.permissions.canExport);

    setModPersonnel(u.permissions.modules.personnel);
    setModArmament(u.permissions.modules.armament);
    setModMedical(u.permissions.modules.medical);
    setModSecurity(u.permissions.modules.security);
    setModReports(u.permissions.modules.reports);
    setModAudit(u.permissions.modules.audit);
    setModAccounts(u.permissions.modules.accounts);

    setShowAddForm(true);
  };

  const handleToggleStatus = (u: TenantUserAccount) => {
    if (u.isSuperAdmin) {
      alert('لا يمكن إيقاف حساب المسؤول الرئيسي للمؤسسة!');
      return;
    }
    const newStatus = u.status === 'نشط' ? 'موقوف' : 'نشط';
    const updated = { ...u, status: newStatus as 'نشط' | 'موقوف' };
    StorageService.updateTenantUser(activeTenant.id, updated);
    loadTenantUsers();
  };

  const handleDeleteUser = (userId: string, isSuper: boolean) => {
    if (isSuper) {
      alert('لا يمكن حذف حساب المسؤول الرئيسي!');
      return;
    }
    if (window.confirm('هل أنت تأكد من رغبتك في حذف هذا المستخدم نهائياً؟')) {
      StorageService.deleteTenantUser(activeTenant.id, userId);
      loadTenantUsers();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 overflow-y-auto animate-fadeIn dir-rtl">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-4xl overflow-hidden my-8 space-y-0">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 text-white p-6 flex items-center justify-between border-b border-amber-900/40">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border-2 border-amber-400/50 text-amber-300 flex items-center justify-center text-2xl shadow-lg">
              🛡️
            </div>
            <div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <h2 className="font-black text-lg font-['Tajawal'] text-amber-400">
                  إدارة مستخدمي المؤسسة وتعيين الصلاحيات
                </h2>
                <span className="bg-amber-500/20 text-amber-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-amber-500/40">
                  Super Admin Panel
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium">
                {activeTenant.badge} {activeTenant.name} [{activeTenant.code}]
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Controls & Banner */}
        <div className="p-6 space-y-4">
          {feedback && (
            <div
              className={`p-3.5 rounded-2xl text-xs font-bold flex items-center space-x-2 space-x-reverse ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">
                المستخدمين المسجلين بالمؤسسة ({users.length})
              </h3>
              <p className="text-xs text-slate-500">
                يحق للمسؤول الرئيسي إضفاء وتعديل صلاحيات الوصول لكل قسم ووحدة
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                if (showAddForm && !editingUserId) {
                  setShowAddForm(false);
                } else {
                  resetForm();
                  setShowAddForm(true);
                }
              }}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center space-x-1.5 space-x-reverse cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>{showAddForm && !editingUserId ? 'إلغاء الإضافة' : 'إضافة مستخدم جديد ➕'}</span>
            </button>
          </div>

          {/* User Add / Edit Form */}
          {showAddForm && (
            <form onSubmit={handleCreateOrUpdateUser} className="bg-slate-50 border-2 border-amber-300/80 p-5 rounded-2xl space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h4 className="font-black text-xs text-amber-900 flex items-center space-x-1.5 space-x-reverse">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <span>{editingUserId ? 'تعديل بيانات وصلاحيات المستخدم' : 'إنشاء مستخدم جديد وتعيين صلاحياته'}</span>
                </h4>
                <span className="text-[10px] font-bold text-slate-500">
                  {editingUserId ? 'وضع التعديل' : 'حساب جديد'}
                </span>
              </div>

              {/* Personal Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الاسم الكامل للمستخدم *</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="مثال: الرائد / خالد عبد الله"
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الرتبة العسكرية / الصفة</label>
                  <input
                    type="text"
                    value={rank}
                    onChange={(e) => setRank(e.target.value)}
                    placeholder="نقيب / مقدم / مدني"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">المسمى الوظيفي / الدور</label>
                  <input
                    type="text"
                    value={roleTitle}
                    onChange={(e) => setRoleTitle(e.target.value)}
                    placeholder="مسؤول التسليح / ضابط القوة البشرية"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold bg-white"
                  />
                </div>
              </div>

              {/* Account Credentials */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-white p-3 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">اسم المستخدم (Username) *</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="username_b1"
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    كلمة المرور {editingUserId && '(اتركها فارغة للإبقاء على الحالية)'}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={editingUserId ? '••••••••' : 'أدخل كلمة المرور'}
                      required={!editingUserId}
                      className="w-full pr-3 pl-8 py-2 border border-slate-300 rounded-xl text-xs font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-2.5 top-2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">القسم / النطاق الرئيسي</label>
                  <select
                    value={departmentRole}
                    onChange={(e) => setDepartmentRole(e.target.value as DepartmentRole)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold"
                  >
                    <option value="القيادة الرئيسية">القيادة الرئيسية</option>
                    <option value="إدارة القوة البشرية">إدارة القوة البشرية</option>
                    <option value="فرع التسليح والعتاد">فرع التسليح والعتاد</option>
                    <option value="الخدمات الطبية العسكرية">الخدمات الطبية العسكرية</option>
                    <option value="الاستخبارات والأمن العسكري">الاستخبارات والأمن العسكري</option>
                    <option value="عمليات اللواء">عمليات اللواء</option>
                  </select>
                </div>
              </div>

              {/* Action Operations Permissions */}
              <div>
                <label className="block text-xs font-extrabold text-slate-800 mb-1.5">
                  1. العمليات المتاحة للمستخدم (Action Permissions):
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs font-bold">
                  <label className="flex items-center space-x-2 space-x-reverse p-2 bg-white rounded-xl border border-slate-200 cursor-pointer hover:bg-amber-50">
                    <input
                      type="checkbox"
                      checked={canAdd}
                      onChange={(e) => setCanAdd(e.target.checked)}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span>إضافة بيانات جديدة ➕</span>
                  </label>

                  <label className="flex items-center space-x-2 space-x-reverse p-2 bg-white rounded-xl border border-slate-200 cursor-pointer hover:bg-amber-50">
                    <input
                      type="checkbox"
                      checked={canEdit}
                      onChange={(e) => setCanEdit(e.target.checked)}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span>تعديل البيانات ✏️</span>
                  </label>

                  <label className="flex items-center space-x-2 space-x-reverse p-2 bg-white rounded-xl border border-slate-200 cursor-pointer hover:bg-amber-50">
                    <input
                      type="checkbox"
                      checked={canDelete}
                      onChange={(e) => setCanDelete(e.target.checked)}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span>حذف سجلات 🗑️</span>
                  </label>

                  <label className="flex items-center space-x-2 space-x-reverse p-2 bg-white rounded-xl border border-slate-200 cursor-pointer hover:bg-amber-50">
                    <input
                      type="checkbox"
                      checked={canExport}
                      onChange={(e) => setCanExport(e.target.checked)}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span>تصدير وطباعة 🖨️</span>
                  </label>
                </div>
              </div>

              {/* Module Access Permissions */}
              <div>
                <label className="block text-xs font-extrabold text-slate-800 mb-1.5">
                  2. الأقسام والموديلات المتاحة للمستخدم (Module Access):
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs font-bold">
                  <label className="flex items-center space-x-2 space-x-reverse p-2 bg-white rounded-xl border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={modPersonnel}
                      onChange={(e) => setModPersonnel(e.target.checked)}
                      className="rounded text-amber-600"
                    />
                    <span>القوة البشرية 🪖</span>
                  </label>

                  <label className="flex items-center space-x-2 space-x-reverse p-2 bg-white rounded-xl border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={modArmament}
                      onChange={(e) => setModArmament(e.target.checked)}
                      className="rounded text-amber-600"
                    />
                    <span>التسليح والعتاد ⚔️</span>
                  </label>

                  <label className="flex items-center space-x-2 space-x-reverse p-2 bg-white rounded-xl border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={modMedical}
                      onChange={(e) => setModMedical(e.target.checked)}
                      className="rounded text-amber-600"
                    />
                    <span>الخدمات الطبية 🏥</span>
                  </label>

                  <label className="flex items-center space-x-2 space-x-reverse p-2 bg-white rounded-xl border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={modSecurity}
                      onChange={(e) => setModSecurity(e.target.checked)}
                      className="rounded text-amber-600"
                    />
                    <span>الأمن والاستخبارات 🔒</span>
                  </label>

                  <label className="flex items-center space-x-2 space-x-reverse p-2 bg-white rounded-xl border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={modReports}
                      onChange={(e) => setModReports(e.target.checked)}
                      className="rounded text-amber-600"
                    />
                    <span>التقارير والإحصائيات 📊</span>
                  </label>

                  <label className="flex items-center space-x-2 space-x-reverse p-2 bg-white rounded-xl border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={modAudit}
                      onChange={(e) => setModAudit(e.target.checked)}
                      className="rounded text-amber-600"
                    />
                    <span>سجل الحركات والرقابة 📜</span>
                  </label>

                  <label className="flex items-center space-x-2 space-x-reverse p-2 bg-white rounded-xl border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={modAccounts}
                      onChange={(e) => setModAccounts(e.target.checked)}
                      className="rounded text-amber-600"
                    />
                    <span>إدارة الحسابات 👥</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center space-x-2 space-x-reverse pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                >
                  {editingUserId ? 'حفظ التعديلات والتحديث' : 'حفظ وإنشاء الحساب 💾'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    resetForm();
                  }}
                  className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          )}

          {/* Registered Users Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-white shadow-sm">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-900 text-white font-extrabold text-[11px]">
                <tr>
                  <th className="p-3">المستخدم / الرتبة</th>
                  <th className="p-3">اسم الدخول (Username)</th>
                  <th className="p-3">الصفة / الدور</th>
                  <th className="p-3">الحالة</th>
                  <th className="p-3">نطاق الصلاحيات</th>
                  <th className="p-3 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => {
                  const isCurrent = currentUser?.id === u.id;

                  return (
                    <tr key={u.id} className={`hover:bg-slate-50 transition-colors ${u.isSuperAdmin ? 'bg-amber-50/20' : ''}`}>
                      <td className="p-3">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-extrabold ${u.isSuperAdmin ? 'bg-amber-500 text-white shadow' : 'bg-slate-100 text-slate-700'}`}>
                            {u.isSuperAdmin ? '⚡' : '👤'}
                          </div>
                          <div>
                            <div className="font-extrabold text-slate-900 flex items-center space-x-1 space-x-reverse">
                              <span>{u.fullName}</span>
                              {u.isSuperAdmin && (
                                <span className="bg-amber-100 text-amber-900 font-extrabold text-[9px] px-1.5 py-0.5 rounded border border-amber-300">
                                  Super Admin
                                </span>
                              )}
                              {isCurrent && (
                                <span className="bg-emerald-100 text-emerald-800 font-extrabold text-[9px] px-1.5 py-0.5 rounded">
                                  أنت الآن
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-500">{u.rank || 'غير محدد'}</div>
                          </div>
                        </div>
                      </td>

                      <td className="p-3 font-mono font-bold text-slate-800">
                        {u.username}
                      </td>

                      <td className="p-3 font-bold text-slate-700">
                        {u.roleTitle}
                      </td>

                      <td className="p-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            u.status === 'نشط'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>

                      <td className="p-3">
                        <div className="flex flex-wrap gap-1 text-[10px] font-bold">
                          {u.permissions.canAdd && <span className="bg-slate-100 px-1.5 py-0.5 rounded">إضافة</span>}
                          {u.permissions.canEdit && <span className="bg-slate-100 px-1.5 py-0.5 rounded">تعديل</span>}
                          {u.permissions.canDelete && <span className="bg-slate-100 px-1.5 py-0.5 rounded">حذف</span>}
                          {u.permissions.canExport && <span className="bg-slate-100 px-1.5 py-0.5 rounded">طباعة</span>}
                        </div>
                      </td>

                      <td className="p-3">
                        <div className="flex items-center justify-center space-x-1.5 space-x-reverse">
                          <button
                            type="button"
                            onClick={() => handleEditClick(u)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                            title="تعديل البيانات والصلاحيات"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {!u.isSuperAdmin && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleToggleStatus(u)}
                                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                                  u.status === 'نشط'
                                    ? 'bg-rose-100 hover:bg-rose-200 text-rose-700'
                                    : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-700'
                                }`}
                              >
                                {u.status === 'نشط' ? 'إيقاف' : 'تفعيل'}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteUser(u.id, u.isSuperAdmin)}
                                className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                                title="حذف الحساب"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
