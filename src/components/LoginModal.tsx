import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Building2,
  Lock,
  User,
  Key,
  Plus,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
  ShieldAlert,
  Users,
  X
} from 'lucide-react';
import { OrganizationTenant, TenantUserAccount, DepartmentRole } from '../types';
import { StorageService } from '../lib/storage';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: TenantUserAccount | null;
  activeTenant: OrganizationTenant;
  onLoginSuccess: (user: TenantUserAccount, tenant: OrganizationTenant) => void;
  onOpenCreateTenant?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  activeTenant,
  onLoginSuccess
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register_tenant' | 'quick_select'>('login');
  
  // Login Form State
  const [selectedTenantId, setSelectedTenantId] = useState<string>(activeTenant.id);
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string>('');
  const [loginSuccess, setLoginSuccess] = useState<string>('');

  // Register Tenant + Super Admin Form State
  const [tenantName, setTenantName] = useState('');
  const [tenantCode, setTenantCode] = useState('');
  const [tenantCategory, setTenantCategory] = useState<'عسكري' | 'أمني' | 'حكومي' | 'طبي' | 'إداري'>('عسكري');
  const [tenantBadge, setTenantBadge] = useState('🛡️');
  const [tenantDescription, setTenantDescription] = useState('');
  const [tenantAccessKey, setTenantAccessKey] = useState('');

  // Super Admin Details for New Tenant
  const [adminName, setAdminName] = useState('');
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPhone, setAdminPhone] = useState('');

  const [registerError, setRegisterError] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState('');

  const [tenants, setTenants] = useState<OrganizationTenant[]>([]);

  useEffect(() => {
    if (isOpen) {
      const list = StorageService.getTenants();
      setTenants(list);
      setSelectedTenantId(StorageService.getActiveTenantId());
      setLoginError('');
      setLoginSuccess('');
      setRegisterError('');
      setRegisterSuccess('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginSuccess('');

    if (!username.trim()) {
      setLoginError('يرجى إدخال اسم المستخدم الحساب');
      return;
    }

    const result = StorageService.authenticateTenantUser(
      username.trim(),
      password.trim() || undefined,
      selectedTenantId
    );

    if (result.success && result.user && result.tenant) {
      setLoginSuccess(`تم تسجيل الدخول بنجاح! مرحباً بك (${result.user.fullName})`);
      setTimeout(() => {
        onLoginSuccess(result.user!, result.tenant!);
        onClose();
      }, 800);
    } else {
      setLoginError(result.message || 'فشل تسجيل الدخول. يرجى التأكد من البيانات.');
    }
  };

  const handleRegisterTenantSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError('');
    setRegisterSuccess('');

    if (!tenantName.trim()) {
      setRegisterError('يرجى كتابة اسم المؤسسة / المنظمة الجديدة');
      return;
    }
    if (!adminName.trim() || !adminUsername.trim() || !adminPassword.trim()) {
      setRegisterError('يرجى استكمال كافة بيانات حساب المسؤول الرئيسي (Super Admin)');
      return;
    }

    const newTenantId = `tenant-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newTenantObj: OrganizationTenant = {
      id: newTenantId,
      name: tenantName.trim(),
      code: tenantCode.trim() || `ORG-${Math.floor(100 + Math.random() * 900)}`,
      category: tenantCategory,
      badge: tenantBadge,
      description: tenantDescription.trim() || 'مؤسسة عسكرية جديدة ببيئة مستقلة وحساب مسؤول رئيسي',
      accessKey: tenantAccessKey.trim() || undefined,
      status: 'نشط',
      createdAt: new Date().toISOString().split('T')[0],
      isDefaultMain: false,
      superAdminName: adminName.trim(),
      superAdminUsername: adminUsername.trim(),
      superAdminEmail: adminEmail.trim() || undefined
    };

    // Save New Tenant
    StorageService.addTenant(newTenantObj);

    // Create Super Admin Account
    const superAdminUser: TenantUserAccount = {
      id: `user-superadmin-${newTenantId}`,
      tenantId: newTenantId,
      username: adminUsername.trim(),
      password: adminPassword.trim(),
      fullName: adminName.trim(),
      rank: 'مسؤول رئيسي Super Admin',
      email: adminEmail.trim() || undefined,
      phone: adminPhone.trim() || undefined,
      isSuperAdmin: true,
      roleTitle: 'مسؤول المنظومة الرئيسي (Super Admin)',
      status: 'نشط',
      createdAt: new Date().toISOString().split('T')[0],
      permissions: {
        role: 'القيادة الرئيسية',
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

    StorageService.addTenantUser(newTenantId, superAdminUser);
    StorageService.setActiveTenant(newTenantObj);
    StorageService.setCurrentUser(superAdminUser);

    setRegisterSuccess(`تم تأسيس المؤسسة (${newTenantObj.name}) وإنشاء حساب المسؤول الرئيسي بنجاح!`);

    setTimeout(() => {
      onLoginSuccess(superAdminUser, newTenantObj);
      onClose();
    }, 1200);
  };

  const handleQuickTenantLogin = (tenant: OrganizationTenant) => {
    const users = StorageService.getTenantUsers(tenant.id);
    const superAdmin = users.find((u) => u.isSuperAdmin) || users[0];

    if (superAdmin) {
      StorageService.setActiveTenant(tenant);
      StorageService.setCurrentUser(superAdmin);
      onLoginSuccess(superAdmin, tenant);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 overflow-y-auto animate-fadeIn dir-rtl">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden my-8 space-y-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 text-white p-6 relative flex items-center justify-between border-b border-amber-900/40">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border-2 border-amber-400/50 text-amber-300 flex items-center justify-center text-2xl shadow-lg">
              🔑
            </div>
            <div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <h2 className="font-black text-lg font-['Tajawal'] text-amber-400">
                  بوابة تسجيل الدخول وإدارة حسابات المؤسسات
                </h2>
                <span className="bg-amber-500/20 text-amber-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-amber-500/40">
                  Super Admin Auth
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium">
                تسجيل الدخول، تبديل المستخدمين، أو إنشاء مؤسسة وحساب مسؤول رئيسي جديد
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
        <div className="flex border-b border-slate-200 bg-slate-50 p-1.5 gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('login')}
            className={`flex-1 py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center space-x-1.5 space-x-reverse cursor-pointer ${
              activeTab === 'login'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>تسجيل الدخول لحساب مستخدم 🔑</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('register_tenant')}
            className={`flex-1 py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center space-x-1.5 space-x-reverse cursor-pointer ${
              activeTab === 'register_tenant'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>تأسيس مؤسسة جديدة (New Tenant) 🏢</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('quick_select')}
            className={`flex-1 py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center space-x-1.5 space-x-reverse cursor-pointer ${
              activeTab === 'quick_select'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>الدخول السريع بحساب المؤسسة ⚡</span>
          </button>
        </div>

        {/* Tab 1: Standard Login */}
        {activeTab === 'login' && (
          <form onSubmit={handleLoginSubmit} className="p-6 space-y-4">
            {loginError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold p-3.5 rounded-2xl flex items-center space-x-2 space-x-reverse animate-headShake">
                <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            {loginSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold p-3.5 rounded-2xl flex items-center space-x-2 space-x-reverse">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{loginSuccess}</span>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  المؤسسة / المنظمة التابع لها الحساب:
                </label>
                <select
                  value={selectedTenantId}
                  onChange={(e) => setSelectedTenantId(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-bold bg-white focus:ring-2 focus:ring-amber-500"
                >
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.badge} {t.name} [{t.code}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  اسم المستخدم (Username):
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="أدخل اسم المستخدم (مثال: admin_hq أو admin_b1)..."
                    required
                    className="w-full pr-9 pl-3 py-2.5 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  كلمة المرور (Password):
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="كلمة المرور الإفتراضية: Admin@123456"
                    className="w-full pr-9 pl-10 py-2.5 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-[11px] text-amber-900 leading-relaxed">
              💡 <strong>بيانات الدخول التجريبية للمسؤولين (Super Admin):</strong>
              <div className="grid grid-cols-2 gap-1 mt-1 font-mono text-[10px]">
                <div>• قيادة الفرقة: admin_hq</div>
                <div>• اللواء الأول: admin_b1</div>
                <div>• اللواء الثاني: admin_b2</div>
                <div>• الإدارة الطبية: admin_med</div>
              </div>
              <div className="text-[10px] text-amber-800 font-bold mt-1">
                كلمة المرور لجميع المسؤولين: <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-amber-300">Admin@123456</span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs py-3 rounded-2xl transition-all shadow-lg flex items-center justify-center space-x-2 space-x-reverse cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>تسجيل الدخول والتأكيد 🔑</span>
            </button>
          </form>
        )}

        {/* Tab 2: Register New Tenant + Super Admin */}
        {activeTab === 'register_tenant' && (
          <form onSubmit={handleRegisterTenantSubmit} className="p-6 space-y-4 max-h-[520px] overflow-y-auto">
            {registerError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold p-3 rounded-xl flex items-center space-x-2 space-x-reverse">
                <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{registerError}</span>
              </div>
            )}

            {registerSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold p-3 rounded-xl flex items-center space-x-2 space-x-reverse">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{registerSuccess}</span>
              </div>
            )}

            {/* Section 1: Tenant Information */}
            <div className="border border-slate-200 p-4 rounded-2xl space-y-3 bg-slate-50">
              <div className="flex items-center space-x-2 space-x-reverse font-extrabold text-xs text-slate-800 border-b border-slate-200 pb-2">
                <Building2 className="w-4 h-4 text-amber-600" />
                <span>1. بيانات المؤسسة / المنظمة العسكرية الجديدة</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  اسم المؤسسة / اللواء / القطاع العسكري <span className="text-rose-500">*</span>:
                </label>
                <input
                  type="text"
                  value={tenantName}
                  onChange={(e) => setTenantName(e.target.value)}
                  placeholder="مثال: مؤسسة اللواء الخامس - حرس الحدود"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    كود المؤسسة الموحد:
                  </label>
                  <input
                    type="text"
                    value={tenantCode}
                    onChange={(e) => setTenantCode(e.target.value)}
                    placeholder="ORG-BRIG-05"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    التصنيف المؤسسي:
                  </label>
                  <select
                    value={tenantCategory}
                    onChange={(e) => setTenantCategory(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold bg-white"
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
                <label className="block text-xs font-bold text-slate-700 mb-1">وصف المؤسسة:</label>
                <input
                  type="text"
                  value={tenantDescription}
                  onChange={(e) => setTenantDescription(e.target.value)}
                  placeholder="وصف طبيعة وقواعد المؤسسة..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white"
                />
              </div>
            </div>

            {/* Section 2: Super Admin Account Setup */}
            <div className="border border-amber-300 bg-amber-50/50 p-4 rounded-2xl space-y-3">
              <div className="flex items-center space-x-2 space-x-reverse font-extrabold text-xs text-amber-900 border-b border-amber-200 pb-2">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span>2. إنشاء حساب المسؤول الرئيسي للمؤسسة (Super Admin)</span>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-800 mb-1">
                  الاسم الكامل للمسؤول الرئيسي <span className="text-rose-500">*</span>:
                </label>
                <input
                  type="text"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  placeholder="مثال: العميد / أحمد علي ناصر (قائد المؤسسة)"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-slate-800 mb-1">
                    اسم المستخدم للدخول (Username) <span className="text-rose-500">*</span>:
                  </label>
                  <input
                    type="text"
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    placeholder="مثال: admin_b5"
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-bold bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-800 mb-1">
                    كلمة المرور (Password) <span className="text-rose-500">*</span>:
                  </label>
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="أدخل كلمة مرور قوية"
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">البريد الإلكتروني:</label>
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="admin@brigade5.gov"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رقم التواصل:</label>
                  <input
                    type="text"
                    value={adminPhone}
                    onChange={(e) => setAdminPhone(e.target.value)}
                    placeholder="+967 770 000 000"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono bg-white"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs py-3 rounded-2xl transition-all shadow-lg flex items-center justify-center space-x-2 space-x-reverse cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>تأسيس المؤسسة والدخول كـ Super Admin ➕</span>
            </button>
          </form>
        )}

        {/* Tab 3: Quick Tenant Switch & Login */}
        {activeTab === 'quick_select' && (
          <div className="p-6 space-y-3 max-h-[460px] overflow-y-auto">
            <p className="text-xs text-slate-600 font-medium">
              اختر إحدى المؤسسات المسجلة في المنظومة للدخول المباشر بحساب المسؤول الرئيسي الخاص بها:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {tenants.map((t) => {
                const isActive = activeTenant.id === t.id;

                return (
                  <div
                    key={t.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 cursor-pointer ${
                      isActive
                        ? 'border-2 border-amber-500 bg-amber-50/30 ring-2 ring-amber-500/20'
                        : 'border-slate-200 hover:border-amber-400 bg-white'
                    }`}
                    onClick={() => handleQuickTenantLogin(t)}
                  >
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <span className="text-3xl p-2 bg-slate-100 rounded-2xl border border-slate-200">
                        {t.badge}
                      </span>
                      <div>
                        <div className="flex items-center space-x-1.5 space-x-reverse">
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono">
                            {t.code}
                          </span>
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                            {t.category}
                          </span>
                        </div>
                        <h4 className="font-extrabold text-slate-900 text-xs mt-0.5">{t.name}</h4>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-mono">
                        Super Admin: {t.superAdminUsername || 'admin_hq'}
                      </span>
                      <span className="text-amber-600 font-bold flex items-center space-x-1 space-x-reverse">
                        <span>دخول سريع</span>
                        <ArrowRight className="w-3 h-3 rotate-180" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
