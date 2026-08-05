import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Shield,
  Key,
  Database,
  CheckCircle2,
  AlertTriangle,
  ArrowRightLeft,
  Trash2,
  Download,
  Upload,
  Lock,
  ExternalLink,
  Users,
  Crosshair,
  X,
  FileCheck,
  Search,
  Sparkles
} from 'lucide-react';
import { OrganizationTenant, DepartmentRole } from '../types';
import { StorageService } from '../lib/storage';

interface TenantManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole: DepartmentRole;
  onTenantSwitched: (tenant: OrganizationTenant) => void;
}

export const TenantManagementModal: React.FC<TenantManagementModalProps> = ({
  isOpen,
  onClose,
  currentRole,
  onTenantSwitched
}) => {
  const [tenants, setTenants] = useState<OrganizationTenant[]>([]);
  const [activeTenant, setActiveTenant] = useState<OrganizationTenant | null>(null);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [keyPromptTarget, setKeyPromptTarget] = useState<OrganizationTenant | null>(null);
  const [enteredKey, setEnteredKey] = useState<string>('');
  const [keyError, setKeyError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('الكل');

  // New Tenant Form State
  const [newName, setNewName] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newCategory, setNewCategory] = useState<'عسكري' | 'أمني' | 'حكومي' | 'طبي' | 'إداري'>('عسكري');
  const [newBadge, setNewBadge] = useState('🛡️');
  const [newDescription, setNewDescription] = useState('');
  const [newAccessKey, setNewAccessKey] = useState('');

  // Super Admin Credentials for New Tenant
  const [superAdminName, setSuperAdminName] = useState('');
  const [superAdminUsername, setSuperAdminUsername] = useState('');
  const [superAdminPassword, setSuperAdminPassword] = useState('');

  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Active Tenant Metrics
  const [personnelCount, setPersonnelCount] = useState<number>(0);
  const [weaponsCount, setWeaponsCount] = useState<number>(0);

  const loadTenantsData = () => {
    const list = StorageService.getTenants();
    setTenants(list);
    const active = StorageService.getActiveTenant();
    setActiveTenant(active);

    // Get stats for active tenant
    const p = StorageService.getPersonnel();
    const w = StorageService.getArmoryWeapons();
    setPersonnelCount(p.length);
    setWeaponsCount(w.length);
  };

  useEffect(() => {
    if (isOpen) {
      loadTenantsData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectTenant = (tenant: OrganizationTenant) => {
    // If tenant is already active, close
    if (activeTenant?.id === tenant.id) {
      onClose();
      return;
    }

    // Check if tenant is protected with an access key
    if (tenant.accessKey && tenant.accessKey.trim() !== '') {
      setKeyPromptTarget(tenant);
      setEnteredKey('');
      setKeyError('');
      return;
    }

    // Direct switch
    executeSwitchTenant(tenant);
  };

  const executeSwitchTenant = (tenant: OrganizationTenant) => {
    StorageService.setActiveTenant(tenant);
    setActiveTenant(tenant);
    onTenantSwitched(tenant);
    setKeyPromptTarget(null);
    onClose();
  };

  const handleVerifyAndSwitch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyPromptTarget) return;

    if (enteredKey.trim() === keyPromptTarget.accessKey?.trim()) {
      executeSwitchTenant(keyPromptTarget);
    } else {
      setKeyError('مفتاح الدخول غير صحيح! يرجى التأكد من الرمز الخاص بالمؤسسة.');
    }
  };

  const handleCreateTenant = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!newName.trim()) {
      setFormError('يرجى إدخال اسم المؤسسة/المنظمة');
      return;
    }

    const generatedId = `tenant-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const createdTenant: OrganizationTenant = {
      id: generatedId,
      name: newName.trim(),
      code: newCode.trim() || `ORG-${Math.floor(100 + Math.random() * 900)}`,
      category: newCategory,
      badge: newBadge || '🛡️',
      description: newDescription.trim() || 'مؤسسة جديدة معزولة البيانات في المنصة',
      accessKey: newAccessKey.trim() || undefined,
      status: 'نشط',
      createdAt: new Date().toISOString().split('T')[0],
      isDefaultMain: false,
      superAdminName: superAdminName.trim() || undefined,
      superAdminUsername: superAdminUsername.trim() || undefined
    };

    StorageService.addTenant(createdTenant);

    if (superAdminName.trim() && superAdminUsername.trim()) {
      const customSuperAdmin = {
        id: `user-superadmin-${generatedId}`,
        tenantId: generatedId,
        username: superAdminUsername.trim(),
        password: superAdminPassword.trim() || 'Admin@123456',
        fullName: superAdminName.trim(),
        rank: 'مسؤول رئيسي Super Admin',
        isSuperAdmin: true,
        roleTitle: 'مسؤول المنظومة الرئيسي (Super Admin)',
        status: 'نشط' as const,
        createdAt: new Date().toISOString().split('T')[0],
        permissions: {
          role: 'القيادة الرئيسية' as DepartmentRole,
          canAdd: true,
          canEdit: true,
          canDelete: true,
          canExport: true,
          modules: {
            personnel: true,
            armament: true,
            medical: true,
            security: true,
            reports: true,
            audit: true,
            accounts: true
          }
        }
      };
      StorageService.addTenantUser(generatedId, customSuperAdmin);
    }
    StorageService.logAction(
      currentRole,
      'القيادة الرئيسية',
      'إنشاء مؤسسة جديدة Multi-Tenant',
      createdTenant.id,
      createdTenant.name,
      `تم إنشاء وتأسيس حساب مؤسسة جديدة (${createdTenant.name} - ${createdTenant.code}) بنجاح بقاعدة بيانات معزولة.`
    );

    setFormSuccess(`تم إضافة المؤسسة (${createdTenant.name}) بنجاح! جاري تحويلك...`);
    loadTenantsData();

    setTimeout(() => {
      setShowCreateModal(false);
      handleSelectTenant(createdTenant);
      // Reset form
      setNewName('');
      setNewCode('');
      setNewDescription('');
      setNewAccessKey('');
      setFormSuccess('');
    }, 1200);
  };

  const handleDeleteCustomTenant = (tenant: OrganizationTenant) => {
    if (tenant.isDefaultMain) {
      alert('لا يمكن حذف المؤسسة القيادية الرئيسية للنظام!');
      return;
    }
    if (confirm(`هل أنت أؤكد حذف المؤسسة (${tenant.name})؟ سيتم إزالة ملف المؤسسة من القائمة.`)) {
      const updated = tenants.filter((t) => t.id !== tenant.id);
      StorageService.saveTenants(updated);
      StorageService.logAction(
        currentRole,
        'القيادة الرئيسية',
        'إزالة مؤسسة Multi-Tenant',
        tenant.id,
        tenant.name,
        `تم حذف ملف المؤسسة (${tenant.name}) من منصة المؤسسات المتعددة.`
      );
      loadTenantsData();
    }
  };

  const handleExportTenantDatabase = () => {
    if (!activeTenant) return;
    const dbDump = {
      tenant: activeTenant,
      exportedAt: new Date().toISOString(),
      personnel: StorageService.getPersonnel(),
      armoryInventory: StorageService.getArmoryInventory(),
      armoryWeapons: StorageService.getArmoryWeapons(),
      armoryIntakes: StorageService.getArmoryIntakes(),
      armoryIssues: StorageService.getArmoryIssues(),
      auditLogs: StorageService.getAuditLogs(),
      alerts: StorageService.getAlerts()
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(dbDump, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `tenant_db_${activeTenant.code}_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const filteredTenants = tenants.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'الكل' || t.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 overflow-y-auto animate-fadeIn dir-rtl">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-5xl overflow-hidden my-8 space-y-0">
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 relative flex flex-wrap items-center justify-between gap-4 border-b border-slate-800">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-amber-500/30">
              🏢
            </div>
            <div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <h2 className="font-extrabold text-xl font-['Tajawal'] text-amber-400">
                  منصة إدارة المؤسسات المتعددة (Multi-Tenant Platform)
                </h2>
                <span className="bg-amber-500/20 text-amber-300 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-amber-500/40">
                  عزل كامل لقواعد البيانات
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium mt-0.5">
                تصفح والانتقال بين المؤسسات العسكرية والأمنية وإدارة حسابات المؤسسات المعزولة
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 space-x-reverse">
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all shadow-lg flex items-center space-x-1.5 space-x-reverse cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة مؤسسة جديدة ➕</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Active Tenant Banner */}
        {activeTenant && (
          <div className="bg-gradient-to-r from-amber-900 via-slate-900 to-slate-950 text-white p-6 border-b border-amber-800/40">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center space-x-4 space-x-reverse">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border-2 border-amber-400/50 flex items-center justify-center text-3xl shadow-inner">
                  {activeTenant.badge}
                </div>
                <div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <span className="bg-emerald-500/20 text-emerald-300 text-[11px] font-extrabold px-2.5 py-0.5 rounded-md border border-emerald-500/40">
                      المؤسسة النشطة حالياً ✅
                    </span>
                    <span className="text-xs text-amber-300 font-mono font-bold">
                      [{activeTenant.code}]
                    </span>
                  </div>
                  <h3 className="font-black text-xl text-white font-['Tajawal'] mt-1">
                    {activeTenant.name}
                  </h3>
                  <p className="text-xs text-slate-300 font-medium">
                    {activeTenant.description}
                  </p>
                </div>
              </div>

              {/* Quick Metrics & Export */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="bg-slate-800/80 border border-slate-700 rounded-2xl px-4 py-2 text-center">
                  <div className="text-[10px] text-slate-400 font-bold">قوة الكادر بالمؤسسة</div>
                  <div className="font-black text-amber-400 text-base">{personnelCount} فرد</div>
                </div>
                <div className="bg-slate-800/80 border border-slate-700 rounded-2xl px-4 py-2 text-center">
                  <div className="text-[10px] text-slate-400 font-bold">قطع التسليح والعتاد</div>
                  <div className="font-black text-emerald-400 text-base">{weaponsCount} قطعة</div>
                </div>
                <button
                  type="button"
                  onClick={handleExportTenantDatabase}
                  className="bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 hover:border-amber-400 text-xs font-bold px-3.5 py-2.5 rounded-xl transition-all flex items-center space-x-1.5 space-x-reverse cursor-pointer"
                  title="تحميل نسخة احتياطية معزولة لقاعدة بيانات هذه المؤسسة"
                >
                  <Download className="w-4 h-4 text-amber-400" />
                  <span>تصدير قاعدة بيانات المؤسسة</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Search & Filter Toolbar */}
        <div className="p-6 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="البحث عن مؤسسة بالاسم، الكود، أو الوصف..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-3 pr-9 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500 bg-white font-medium"
            />
          </div>

          <div className="flex items-center space-x-2 space-x-reverse">
            <span className="text-xs font-bold text-slate-600">التصنيف:</span>
            {['الكل', 'عسكري', 'أمني', 'طبي', 'حكومي', 'إداري'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Tenants Cards Grid */}
        <div className="p-6 max-h-[460px] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTenants.map((t) => {
              const isActive = activeTenant?.id === t.id;

              return (
                <div
                  key={t.id}
                  className={`bg-white rounded-2xl border transition-all p-5 flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md ${
                    isActive
                      ? 'border-2 border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/20'
                      : 'border-slate-200 hover:border-amber-400'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5 space-x-reverse">
                        <span className="text-3xl p-2 bg-slate-100 rounded-2xl border border-slate-200">
                          {t.badge}
                        </span>
                        <div>
                          <div className="flex items-center space-x-1.5 space-x-reverse">
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono">
                              {t.code}
                            </span>
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200">
                              {t.category}
                            </span>
                          </div>
                          <h4 className="font-black text-slate-900 text-sm font-['Tajawal'] mt-0.5">
                            {t.name}
                          </h4>
                        </div>
                      </div>

                      {t.accessKey && (
                        <span
                          className="text-amber-600 p-1 bg-amber-50 rounded-lg border border-amber-200"
                          title="مؤسسة محمية بكلمة مرور"
                        >
                          <Lock className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {t.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    {isActive ? (
                      <span className="w-full text-center bg-emerald-600 text-white font-extrabold text-xs py-2 rounded-xl flex items-center justify-center space-x-1.5 space-x-reverse shadow-sm">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>المؤسسة الحالية (قيد التشغيل)</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSelectTenant(t)}
                        className="w-full bg-slate-900 hover:bg-amber-600 text-white font-extrabold text-xs py-2 rounded-xl transition-all shadow-sm flex items-center justify-center space-x-1.5 space-x-reverse cursor-pointer"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5" />
                        <span>الدخول والانتقال للمؤسسة</span>
                      </button>
                    )}

                    {!t.isDefaultMain && !isActive && (
                      <button
                        type="button"
                        onClick={() => handleDeleteCustomTenant(t)}
                        className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-800 border border-rose-200 transition-all cursor-pointer"
                        title="حذف المؤسسة"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Key Prompt Modal */}
        {keyPromptTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xl max-w-md w-full space-y-4 animate-scaleUp dir-rtl">
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center text-2xl font-bold">
                  🔒
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base font-['Tajawal']">
                    رمز الوصول المحمي للمؤسسة
                  </h3>
                  <p className="text-xs text-slate-500">
                    أدخل مفتاح الدخول المعتمد للانتقال إلى ({keyPromptTarget.name})
                  </p>
                </div>
              </div>

              <form onSubmit={handleVerifyAndSwitch} className="space-y-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    مفتاح/رمز الدخول السرّي للمؤسسة:
                  </label>
                  <input
                    type="password"
                    value={enteredKey}
                    onChange={(e) => setEnteredKey(e.target.value)}
                    placeholder="أدخل مفتاح الدخول..."
                    required
                    autoFocus
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 font-mono text-center"
                  />
                  {keyError && (
                    <p className="text-xs text-rose-600 font-bold mt-1.5 flex items-center space-x-1 space-x-reverse">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>{keyError}</span>
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-2 space-x-reverse">
                  <button
                    type="submit"
                    className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs py-2.5 rounded-xl shadow-md cursor-pointer transition-all"
                  >
                    تأكيد والدخول للمؤسسة
                  </button>
                  <button
                    type="button"
                    onClick={() => setKeyPromptTarget(null)}
                    className="px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs py-2.5 rounded-xl cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Create New Tenant Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xl max-w-lg w-full space-y-4 animate-scaleUp dir-rtl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2.5 space-x-reverse">
                  <span className="text-2xl p-2 bg-amber-100 rounded-2xl text-amber-800">
                    🏢
                  </span>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base font-['Tajawal']">
                      إضافة وتأسيس مؤسسة جديدة (New Tenant)
                    </h3>
                    <p className="text-xs text-slate-500">
                      إنشاء بيئة عمل وقاعدة بيانات معزولة كلياً لمؤسسة جديدة
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {formError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold p-3 rounded-xl flex items-center space-x-2 space-x-reverse">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>{formError}</span>
                </div>
              )}

              {formSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold p-3 rounded-xl flex items-center space-x-2 space-x-reverse">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{formSuccess}</span>
                </div>
              )}

              <form onSubmit={handleCreateTenant} className="space-y-3 text-xs font-medium">
                <div>
                  <label className="block text-slate-700 font-extrabold mb-1">
                    اسم المؤسسة / المنظمة الجديدة <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="مثال: مؤسسة اللواء الرابع - دفاع جوي"
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-extrabold mb-1">
                      رمز/كود المؤسسة الموحد:
                    </label>
                    <input
                      type="text"
                      value={newCode}
                      onChange={(e) => setNewCode(e.target.value)}
                      placeholder="ORG-AIR-04"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-extrabold mb-1">
                      التصنيف الوظيفي:
                    </label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value as any)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold bg-white"
                    >
                      <option value="عسكري">عسكري</option>
                      <option value="أمني">أمني</option>
                      <option value="طبي">طبي</option>
                      <option value="حكومي">حكومي</option>
                      <option value="إداري">إداري</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-extrabold mb-1">
                    شعار / رمز المؤسسة:
                  </label>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    {['🛡️', '⚔️', '🏛️', '🏥', '🔒', '⚓', '✈️', '🦅', '🎯'].map((badge) => (
                      <button
                        key={badge}
                        type="button"
                        onClick={() => setNewBadge(badge)}
                        className={`w-9 h-9 text-lg rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                          newBadge === badge
                            ? 'bg-amber-500 text-white ring-2 ring-amber-500/40'
                            : 'bg-slate-100 border border-slate-200'
                        }`}
                      >
                        {badge}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-extrabold mb-1">
                    مفتاح/كلمة مرور الدخول السري (اختياري للحماية):
                  </label>
                  <input
                    type="password"
                    value={newAccessKey}
                    onChange={(e) => setNewAccessKey(e.target.value)}
                    placeholder="اتركه فارغاً إذا كانت المؤسسة متاحة مباشرة"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                  />
                </div>

                {/* Super Admin Credentials Section */}
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-2xl space-y-2">
                  <span className="font-extrabold text-amber-900 text-[11px] block">
                    👑 حساب المسؤول الرئيسي المباشر (Super Admin):
                  </span>
                  <div>
                    <label className="block text-slate-700 font-bold mb-0.5 text-[11px]">اسم المسؤول الرئيسي:</label>
                    <input
                      type="text"
                      value={superAdminName}
                      onChange={(e) => setSuperAdminName(e.target.value)}
                      placeholder="مثال: العميد / قائد المؤسسة"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-700 font-bold mb-0.5 text-[11px]">اسم المستخدم (Username):</label>
                      <input
                        type="text"
                        value={superAdminUsername}
                        onChange={(e) => setSuperAdminUsername(e.target.value)}
                        placeholder="admin_code"
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-0.5 text-[11px]">كلمة المرور (Password):</label>
                      <input
                        type="password"
                        value={superAdminPassword}
                        onChange={(e) => setSuperAdminPassword(e.target.value)}
                        placeholder="Admin@123456"
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-extrabold mb-1">
                    وصف وقواعد المؤسسة:
                  </label>
                  <textarea
                    rows={2}
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="أدخل وصف مختصر ونطاق عمل المؤسسة..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>

                <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-[11px] text-amber-900">
                  🔒 <strong>ملاحظة هامة:</strong> بمجرد إنشاء المؤسسة، سيتوفر لها بيئة قاعدة بيانات مستقلا تماماً ومحفوظة بالسحابة معزولة عن بقية المؤسسات.
                </div>

                <div className="flex items-center space-x-2 space-x-reverse pt-2">
                  <button
                    type="submit"
                    className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs py-2.5 rounded-xl shadow-md cursor-pointer transition-all"
                  >
                    حفظ وتأسيس المؤسسة ➕
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs py-2.5 rounded-xl cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
