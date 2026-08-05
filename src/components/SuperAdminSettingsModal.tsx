import React, { useState, useEffect } from 'react';
import {
  Settings,
  Users,
  HardDrive,
  Database,
  Download,
  Upload,
  RefreshCw,
  X,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Lock,
  UserPlus,
  Server,
  Cpu,
  BarChart2,
  FileCheck,
  ArrowUpRight,
  Info
} from 'lucide-react';
import { OrganizationTenant, TenantUserAccount, DepartmentRole } from '../types';
import { StorageService } from '../lib/storage';

interface SuperAdminSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTenant: OrganizationTenant;
  currentUser: TenantUserAccount | null;
  onRefreshData?: () => void;
}

export const SuperAdminSettingsModal: React.FC<SuperAdminSettingsModalProps> = ({
  isOpen,
  onClose,
  activeTenant,
  currentUser,
  onRefreshData
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'storage' | 'backup'>('users');

  // --- Users & Permissions State ---
  const [users, setUsers] = useState<TenantUserAccount[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  const [fullName, setFullName] = useState('');
  const [rank, setRank] = useState('نقيب');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [roleTitle, setRoleTitle] = useState('ضابط إدارة القوة البشرية');
  const [departmentRole, setDepartmentRole] = useState<DepartmentRole>('إدارة القوة البشرية');

  // Action Permissions
  const [canAdd, setCanAdd] = useState(true);
  const [canEdit, setCanEdit] = useState(true);
  const [canDelete, setCanDelete] = useState(false);
  const [canExport, setCanExport] = useState(true);

  // Module Access
  const [modPersonnel, setModPersonnel] = useState(true);
  const [modArmament, setModArmament] = useState(false);
  const [modMedical, setModMedical] = useState(false);
  const [modSecurity, setModSecurity] = useState(false);
  const [modReports, setModReports] = useState(true);
  const [modAudit, setModAudit] = useState(false);
  const [modAccounts, setModAccounts] = useState(false);

  // --- Storage Metrics State ---
  const [storageMetrics, setStorageMetrics] = useState<ReturnType<typeof StorageService.getStorageMetrics> | null>(null);

  // --- Backup & Restore State ---
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [parsedBackupPreview, setParsedBackupPreview] = useState<any | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadData();
      setFeedback(null);
      setRestoreFile(null);
      setParsedBackupPreview(null);
    }
  }, [isOpen, activeTenant.id]);

  const loadData = () => {
    // Load Users
    const uList = StorageService.getTenantUsers(activeTenant.id);
    setUsers(uList);

    // Load Storage Metrics
    const metrics = StorageService.getStorageMetrics();
    setStorageMetrics(metrics);
  };

  if (!isOpen) return null;

  const resetUserForm = () => {
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
      setFeedback({ type: 'error', message: 'يرجى تعبئة جميع الحقول الأساسية' });
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
        setFeedback({ type: 'success', message: `تم تحديث حساب المستخدم (${updated.fullName}) بنجاح!` });
      }
    } else {
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
      setFeedback({ type: 'success', message: `تم إضافة المستخدم الجديد (${newUser.fullName}) بنجاح!` });
    }

    loadData();
    setShowAddForm(false);
    resetUserForm();
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

  const handleToggleUserStatus = (u: TenantUserAccount) => {
    if (u.isSuperAdmin) {
      alert('لا يمكن إيقاف حساب المسؤول الرئيسي!');
      return;
    }
    const newStatus = u.status === 'نشط' ? 'موقوف' : 'نشط';
    StorageService.updateTenantUser(activeTenant.id, { ...u, status: newStatus as 'نشط' | 'موقوف' });
    loadData();
  };

  const handleDeleteUser = (u: TenantUserAccount) => {
    if (u.isSuperAdmin) {
      alert('لا يمكن حذف حساب المسؤول الرئيسي!');
      return;
    }
    if (window.confirm(`هل أنت تأكد من حذف المستخدم (${u.fullName}) نهائياً؟`)) {
      StorageService.deleteTenantUser(activeTenant.id, u.id);
      loadData();
    }
  };

  // --- Export Full Backup JSON ---
  const handleExportBackup = () => {
    const backupData = StorageService.exportFullSystemBackup();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `military_hq_backup_${activeTenant.code}_${dateStr}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setFeedback({ type: 'success', message: 'تم تحميل ملف النسخة الاحتياطية بنجاح!' });
  };

  // --- File Select for Restore ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFeedback(null);
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setRestoreFile(file);

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          setParsedBackupPreview(parsed);
        } catch (err) {
          setFeedback({ type: 'error', message: 'ملف غير صالح! يرجى اختيار ملف JSON صحيح للنسخة الاحتياطية.' });
          setParsedBackupPreview(null);
        }
      };
      reader.readAsText(file);
    }
  };

  // --- Execute Restore ---
  const handleExecuteRestore = () => {
    if (!parsedBackupPreview) return;

    if (window.confirm('⚠️ تحذير مهم: استعادة النسخة الاحتياطية ستستبدل وتدمج السجلات الحالية. هل ترغب بالتأكيد في المتابعة؟')) {
      const res = StorageService.restoreFullSystemBackup(parsedBackupPreview);
      if (res.success) {
        setFeedback({ type: 'success', message: `${res.message} ${res.restoredStats || ''}` });
        setRestoreFile(null);
        setParsedBackupPreview(null);
        loadData();
        if (onRefreshData) onRefreshData();
      } else {
        setFeedback({ type: 'error', message: res.message });
      }
    }
  };

  const handlePurgeCategory = (key: string, name: string) => {
    if (window.confirm(`هل أنت تأكد من رغبتك في تفريغ وتفريغ قسم (${name}) نهائياً لتوفير مساحة التخزين؟`)) {
      StorageService.purgeStorageCategory(key);
      loadData();
      setFeedback({ type: 'success', message: `تم تفريغ (${name}) وتفريغ السعة بنجاح.` });
    }
  };

  const formatKB = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 overflow-y-auto animate-fadeIn dir-rtl">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-5xl overflow-hidden my-6 space-y-0">
        
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 text-white p-6 flex items-center justify-between border-b border-amber-900/40">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border-2 border-amber-400/50 text-amber-300 flex items-center justify-center shadow-lg">
              <Settings className="w-6 h-6 text-amber-400 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <h2 className="font-black text-lg font-['Tajawal'] text-amber-400">
                  إعدادات المسؤول الرئيسي (Super Admin Panel)
                </h2>
                <span className="bg-amber-500/20 text-amber-300 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-amber-500/40">
                  لوحة التحكم المركزية
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium">
                المؤسسة الحالية: {activeTenant.badge} {activeTenant.name} [{activeTenant.code}]
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

        {/* Navigation Tabs */}
        <div className="bg-slate-100 border-b border-slate-200 px-6 py-2.5 flex items-center space-x-2 space-x-reverse">
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center space-x-2 space-x-reverse cursor-pointer ${
              activeTab === 'users'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>1. إدارة المستخدمين والصلاحيات 👥</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('storage')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center space-x-2 space-x-reverse cursor-pointer ${
              activeTab === 'storage'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-700 hover:bg-slate-200'
            }`}
          >
            <HardDrive className="w-4 h-4" />
            <span>2. إدارة التخزين والمساحة 💾</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('backup')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center space-x-2 space-x-reverse cursor-pointer ${
              activeTab === 'backup'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>3. النسخ الاحتياطي والاستعادة 🔄</span>
          </button>
        </div>

        {/* Global Feedback Banner */}
        {feedback && (
          <div className="px-6 pt-4">
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
          </div>
        )}

        {/* Modal Main Content Area */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">

          {/* TAB 1: USERS & PERMISSIONS MANAGEMENT */}
          {activeTab === 'users' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 flex items-center space-x-2 space-x-reverse">
                    <Users className="w-4 h-4 text-amber-600" />
                    <span>مستخدمو المؤسسة المسجلون ({users.length})</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    تعيين وتحديد صلاحيات العمليات والأقسام الحصرية لكل مستخدم
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (showAddForm && !editingUserId) {
                      setShowAddForm(false);
                    } else {
                      resetUserForm();
                      setShowAddForm(true);
                    }
                  }}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center space-x-1.5 space-x-reverse cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{showAddForm && !editingUserId ? 'إلغاء الإضافة' : 'إضافة مستخدم جديد ➕'}</span>
                </button>
              </div>

              {/* User Add/Edit Form */}
              {showAddForm && (
                <form onSubmit={handleCreateOrUpdateUser} className="bg-slate-50 border-2 border-amber-300 p-5 rounded-2xl space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <h4 className="font-black text-xs text-amber-900 flex items-center space-x-1.5 space-x-reverse">
                      <ShieldCheck className="w-4 h-4 text-amber-600" />
                      <span>{editingUserId ? 'تعديل بيانات وصلاحيات المستخدم' : 'إنشاء حساب جديد وتخصيص صلاحياته'}</span>
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">اسم المستخدم الكامل *</label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="مثال: النقيب / خالد عبد الله"
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

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-white p-3 rounded-xl border border-slate-200">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">اسم الدخول (Username) *</label>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="username_code"
                        required
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        كلمة المرور {editingUserId && '(اتركها فارغة للإبقاء على الحالية)'}
                      </label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={editingUserId ? '••••••••' : 'كلمة المرور'}
                        required={!editingUserId}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">القسم / الفرع المباشر</label>
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

                  {/* Operation Permissions */}
                  <div>
                    <label className="block text-xs font-extrabold text-slate-800 mb-1.5">
                      1. صلاحيات العمليات الإجرائية (Action Permissions):
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs font-bold">
                      <label className="flex items-center space-x-2 space-x-reverse p-2 bg-white rounded-xl border border-slate-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={canAdd}
                          onChange={(e) => setCanAdd(e.target.checked)}
                          className="rounded text-amber-600"
                        />
                        <span>إضافة سجلات ➕</span>
                      </label>

                      <label className="flex items-center space-x-2 space-x-reverse p-2 bg-white rounded-xl border border-slate-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={canEdit}
                          onChange={(e) => setCanEdit(e.target.checked)}
                          className="rounded text-amber-600"
                        />
                        <span>تعديل البيانات ✏️</span>
                      </label>

                      <label className="flex items-center space-x-2 space-x-reverse p-2 bg-white rounded-xl border border-slate-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={canDelete}
                          onChange={(e) => setCanDelete(e.target.checked)}
                          className="rounded text-amber-600"
                        />
                        <span>حذف السجلات 🗑️</span>
                      </label>

                      <label className="flex items-center space-x-2 space-x-reverse p-2 bg-white rounded-xl border border-slate-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={canExport}
                          onChange={(e) => setCanExport(e.target.checked)}
                          className="rounded text-amber-600"
                        />
                        <span>التصدير والطباعة 🖨️</span>
                      </label>
                    </div>
                  </div>

                  {/* Module Access */}
                  <div>
                    <label className="block text-xs font-extrabold text-slate-800 mb-1.5">
                      2. وصول الموديلات والأقسام (Module Access):
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs font-bold">
                      <label className="flex items-center space-x-2 space-x-reverse p-2 bg-white rounded-xl border border-slate-200 cursor-pointer">
                        <input type="checkbox" checked={modPersonnel} onChange={(e) => setModPersonnel(e.target.checked)} className="rounded text-amber-600" />
                        <span>القوة البشرية 🪖</span>
                      </label>
                      <label className="flex items-center space-x-2 space-x-reverse p-2 bg-white rounded-xl border border-slate-200 cursor-pointer">
                        <input type="checkbox" checked={modArmament} onChange={(e) => setModArmament(e.target.checked)} className="rounded text-amber-600" />
                        <span>التسليح والعتاد ⚔️</span>
                      </label>
                      <label className="flex items-center space-x-2 space-x-reverse p-2 bg-white rounded-xl border border-slate-200 cursor-pointer">
                        <input type="checkbox" checked={modMedical} onChange={(e) => setModMedical(e.target.checked)} className="rounded text-amber-600" />
                        <span>الخدمات الطبية 🏥</span>
                      </label>
                      <label className="flex items-center space-x-2 space-x-reverse p-2 bg-white rounded-xl border border-slate-200 cursor-pointer">
                        <input type="checkbox" checked={modSecurity} onChange={(e) => setModSecurity(e.target.checked)} className="rounded text-amber-600" />
                        <span>الأمن العسكري 🔒</span>
                      </label>
                      <label className="flex items-center space-x-2 space-x-reverse p-2 bg-white rounded-xl border border-slate-200 cursor-pointer">
                        <input type="checkbox" checked={modReports} onChange={(e) => setModReports(e.target.checked)} className="rounded text-amber-600" />
                        <span>التقارير والإحصائيات 📊</span>
                      </label>
                      <label className="flex items-center space-x-2 space-x-reverse p-2 bg-white rounded-xl border border-slate-200 cursor-pointer">
                        <input type="checkbox" checked={modAudit} onChange={(e) => setModAudit(e.target.checked)} className="rounded text-amber-600" />
                        <span>سجل الحركات والرقابة 📜</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 space-x-reverse pt-2">
                    <button
                      type="submit"
                      className="px-6 py-2 bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer"
                    >
                      {editingUserId ? 'حفظ التعديلات' : 'حفظ وإنشاء الحساب 💾'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddForm(false);
                        resetUserForm();
                      }}
                      className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                    >
                      إلغاء
                    </button>
                  </div>
                </form>
              )}

              {/* Users Table */}
              <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-white shadow-xs">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-900 text-white font-extrabold text-[11px]">
                    <tr>
                      <th className="p-3">المستخدم / الرتبة</th>
                      <th className="p-3">اسم الدخول (Username)</th>
                      <th className="p-3">الدور والصفة</th>
                      <th className="p-3">الحالة</th>
                      <th className="p-3 text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {users.map((u) => (
                      <tr key={u.id} className={`hover:bg-slate-50 transition-colors ${u.isSuperAdmin ? 'bg-amber-50/20' : ''}`}>
                        <td className="p-3">
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-extrabold ${u.isSuperAdmin ? 'bg-amber-500 text-white shadow' : 'bg-slate-100 text-slate-700'}`}>
                              {u.isSuperAdmin ? '⚡' : '👤'}
                            </div>
                            <div>
                              <div className="font-extrabold text-slate-900 flex items-center space-x-1.5 space-x-reverse">
                                <span>{u.fullName}</span>
                                {u.isSuperAdmin && (
                                  <span className="bg-amber-100 text-amber-900 text-[9px] font-black px-1.5 py-0.5 rounded border border-amber-300">
                                    Super Admin
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
                          <div className="flex items-center justify-center space-x-1.5 space-x-reverse">
                            <button
                              type="button"
                              onClick={() => handleEditClick(u)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer"
                            >
                              تعديل
                            </button>

                            {!u.isSuperAdmin && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleToggleUserStatus(u)}
                                  className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer ${
                                    u.status === 'نشط'
                                      ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                                      : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                  }`}
                                >
                                  {u.status === 'نشط' ? 'إيقاف' : 'تفعيل'}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteUser(u)}
                                  className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: STORAGE METRICS & CAPACITY METERS */}
          {activeTab === 'storage' && storageMetrics && (
            <div className="space-y-6">
              
              {/* Storage Summary Gauge Banner */}
              <div className="bg-gradient-to-r from-slate-900 to-slate-950 p-6 rounded-3xl text-white border border-slate-800 shadow-lg space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-300 flex items-center justify-center">
                      <HardDrive className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-white">إجمالي مساحة التخزين المخصصة للنظام</h3>
                      <p className="text-xs text-slate-400">سعة القواعد المحلية والربط مع Firestore Cloud Sync</p>
                    </div>
                  </div>

                  <div className="text-left font-mono">
                    <span className="text-2xl font-black text-amber-400">{storageMetrics.usedPercentage}%</span>
                    <span className="text-xs text-slate-400 block">مستخدم من السعة</span>
                  </div>
                </div>

                {/* Progress Bar Meter */}
                <div className="space-y-1.5">
                  <div className="w-full bg-slate-800 h-4 rounded-full overflow-hidden p-0.5 border border-slate-700">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        storageMetrics.usedPercentage > 80
                          ? 'bg-rose-500'
                          : storageMetrics.usedPercentage > 50
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.max(3, storageMetrics.usedPercentage)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs font-bold font-mono text-slate-300">
                    <span>المساحة المستهلكة: {formatKB(storageMetrics.totalUsedBytes)}</span>
                    <span>المساحة المتبقية المتاحة: {formatKB(storageMetrics.totalQuotaBytes - storageMetrics.totalUsedBytes)}</span>
                    <span>السعة الكلية: 10.0 MB</span>
                  </div>
                </div>
              </div>

              {/* Storage Category Cards Breakdown */}
              <div className="space-y-3">
                <h4 className="font-extrabold text-xs text-slate-900 flex items-center space-x-2 space-x-reverse">
                  <BarChart2 className="w-4 h-4 text-amber-600" />
                  <span>توزيع استهلاك المساحة حسب الجداول والأقسام العسكرية:</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {storageMetrics.categories.map((cat) => (
                    <div key={cat.key} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <span className="text-2xl">{cat.icon}</span>
                        <div>
                          <div className="font-extrabold text-xs text-slate-900">{cat.name}</div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            عدد السجلات: {cat.itemCount} • الحجم: {formatKB(cat.bytes)}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 space-x-reverse">
                        <span className="font-mono font-black text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200">
                          {cat.percentage}%
                        </span>

                        {(cat.key.includes('audit') || cat.key.includes('alerts') || cat.key.includes('recycle')) && cat.bytes > 0 && (
                          <button
                            type="button"
                            onClick={() => handlePurgeCategory(cat.key, cat.name)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-bold cursor-pointer"
                            title="تفريغ هذا الجدول لتوفير مساحة"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BACKUP & RESTORE */}
          {activeTab === 'backup' && (
            <div className="space-y-6">
              
              {/* Export Backup Section */}
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center space-x-2.5 space-x-reverse text-amber-900 font-black text-sm">
                  <Download className="w-5 h-5 text-amber-600" />
                  <span>تصدير نسخة احتياطية كاملة للسيستم (Export Full Backup)</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  يتيح لك هذا الخيار حفظ وتنزيل ملف JSON شامل يحتوي على كل بيانات القوة البشرية، الأسلحة، العتاد، حسابات المستخدمين، وسجلات الحركات للقيادة.
                </p>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleExportBackup}
                    className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center space-x-2 space-x-reverse cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>تنزيل النسخة الاحتياطية الآن (.JSON) 💾</span>
                  </button>
                </div>
              </div>

              {/* Restore Backup Section */}
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                <div className="flex items-center space-x-2.5 space-x-reverse text-emerald-900 font-black text-sm">
                  <Upload className="w-5 h-5 text-emerald-600" />
                  <span>استعادة نسخة احتياطية مسبقة (Restore System Backup)</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  قم برفع واستيراد ملف JSON نسخة احتياطية سابقة لاستعادة البيانات.
                </p>

                {/* File Upload Box */}
                <div className="border-2 border-dashed border-slate-300 hover:border-amber-400 bg-white p-6 rounded-2xl text-center cursor-pointer transition-colors">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileChange}
                    className="hidden"
                    id="backup-file-input"
                  />
                  <label htmlFor="backup-file-input" className="cursor-pointer block space-y-2">
                    <Database className="w-8 h-8 text-amber-500 mx-auto" />
                    <span className="block font-extrabold text-xs text-slate-800">
                      {restoreFile ? `الملف المحدد: ${restoreFile.name}` : 'انقر هنا لاختيار ملف النسخة الاحتياطية JSON'}
                    </span>
                    <span className="block text-[11px] text-slate-400">
                      يدعم ملفات النسخ الاحتياطية الصادرة من نظام القيادة المركزية
                    </span>
                  </label>
                </div>

                {/* Backup Preview Details */}
                {parsedBackupPreview && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-3 animate-fadeIn">
                    <div className="font-extrabold text-xs text-emerald-900 flex items-center space-x-2 space-x-reverse">
                      <FileCheck className="w-4 h-4 text-emerald-600" />
                      <span>تفاصيل ومعاينة ملف النسخة الاحتياطية قبل الاستعادة:</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-bold text-slate-700 font-mono">
                      <div className="bg-white p-2 rounded-xl border border-emerald-200">
                        <span className="text-[10px] text-slate-400 block font-sans">عدد الأفراد:</span>
                        <span>{parsedBackupPreview.data?.personnel?.length || 0} فرد</span>
                      </div>

                      <div className="bg-white p-2 rounded-xl border border-emerald-200">
                        <span className="text-[10px] text-slate-400 block font-sans">المؤسسات العسكرية:</span>
                        <span>{parsedBackupPreview.data?.tenants?.length || 0} مؤسسة</span>
                      </div>

                      <div className="bg-white p-2 rounded-xl border border-emerald-200">
                        <span className="text-[10px] text-slate-400 block font-sans">قطع الأسلحة:</span>
                        <span>{parsedBackupPreview.data?.armoryWeapons?.length || 0} قطعة</span>
                      </div>

                      <div className="bg-white p-2 rounded-xl border border-emerald-200">
                        <span className="text-[10px] text-slate-400 block font-sans">تاريخ التصدير:</span>
                        <span className="text-[10px]">
                          {parsedBackupPreview.exportTimestamp ? parsedBackupPreview.exportTimestamp.split('T')[0] : 'غير محدد'}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center space-x-2 space-x-reverse">
                      <button
                        type="button"
                        onClick={handleExecuteRestore}
                        className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer flex items-center space-x-1.5 space-x-reverse"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span>تأكيد واستعادة كافة البيانات الآن 🔄</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setRestoreFile(null);
                          setParsedBackupPreview(null);
                        }}
                        className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                      >
                        إلغاء
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 border-t border-slate-200 p-4 flex items-center justify-between text-xs font-bold text-slate-600">
          <div className="flex items-center space-x-2 space-x-reverse">
            <Info className="w-4 h-4 text-amber-600" />
            <span>نظام إدارة المسؤول الرئيسي v3.0 • القيادة العسكرية العليا</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-extrabold cursor-pointer"
          >
            إغلاق النافذة
          </button>
        </div>

      </div>
    </div>
  );
};
