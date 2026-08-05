import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Building2,
  Bell,
  Search,
  UserCheck,
  RotateCcw,
  Clock,
  ChevronDown,
  ShieldCheck,
  FileText,
  AlertTriangle,
  X,
  Trash2,
  Download,
  Scan,
  Camera,
  ExternalLink,
  Key,
  Link,
  Users,
  Building,
  Lock,
  LogOut,
  SlidersHorizontal,
  Settings,
  User,
  Database
} from 'lucide-react';
import { DepartmentRole, SystemAlert, UserAccount, OrganizationTenant, TenantUserAccount } from '../types';
import { hybridSyncEngine, HybridSyncStatus } from '../lib/hybridSync';
import { HybridSyncModal } from './HybridSyncModal';

interface NavbarHeaderProps {
  currentRole: DepartmentRole;
  onRoleChange: (role: DepartmentRole) => void;
  currentAccount: UserAccount;
  activeTenant?: OrganizationTenant;
  currentUser?: TenantUserAccount | null;
  onOpenLoginModal?: () => void;
  onOpenTenantUsersModal?: () => void;
  onOpenSuperAdminSettingsModal?: () => void;
  onLogout?: () => void;
  onOpenTenantModal?: () => void;
  onOpenAccountsModal: () => void;
  onOpenSearchModal?: () => void;
  onOpenNotificationModal?: () => void;
  onOpenRecycleBinModal?: () => void;
  onOpenDuplicateAlertsModal?: () => void;
  onOpenPwaModal?: () => void;
  onOpenFaceScanModal?: () => void;
  onOpenDailyReadinessReport?: () => void;
  alerts: SystemAlert[];
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onResetData: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const DEPARTMENT_LIST: { role: DepartmentRole; label: string; icon: string; color: string }[] = [
  { role: 'القيادة الرئيسية', label: 'القيادة الرئيسية (HQ)', icon: '⭐', color: 'bg-emerald-600' },
  { role: 'إدارة الموارد البشرية', label: 'إدارة الموارد البشرية (HR)', icon: '👥', color: 'bg-blue-600' },
  { role: 'إدارة التسليح', label: 'إدارة التسليح والذخيرة', icon: '🔫', color: 'bg-amber-600' },
  { role: 'إدارة التدريب', label: 'إدارة التدريب والدورات', icon: '🎯', color: 'bg-purple-600' },
  { role: 'الإدارة المالية', label: 'الإدارة المالية والميزانية', icon: '💰', color: 'bg-teal-600' },
  { role: 'الاستخبارات والأمن', label: 'الاستخبارات والأمن العسكري', icon: '🕵️', color: 'bg-rose-600' },
  { role: 'الإدارة الطبية العسكرية', label: 'الإدارة الطبية العسكرية (Medical)', icon: '🏥', color: 'bg-pink-600' },
  { role: 'الإدارة الفنية', label: 'الإدارة الفنية والصيانة', icon: '🛠️', color: 'bg-cyan-600' },
  { role: 'إدارة التموين والإمداد', label: 'إدارة التموين (صرف المهمات والبدلات)', icon: '📦', color: 'bg-indigo-600' }
];

export const NavbarHeader: React.FC<NavbarHeaderProps> = ({
  currentRole,
  onRoleChange,
  currentAccount,
  activeTenant,
  currentUser,
  onOpenLoginModal,
  onOpenTenantUsersModal,
  onOpenSuperAdminSettingsModal,
  onLogout,
  onOpenTenantModal,
  onOpenAccountsModal,
  onOpenSearchModal,
  onOpenNotificationModal,
  onOpenRecycleBinModal,
  onOpenDuplicateAlertsModal,
  onOpenPwaModal,
  onOpenFaceScanModal,
  onOpenDailyReadinessReport,
  alerts,
  searchTerm,
  onSearchChange,
  onResetData,
  activeTab,
  onTabChange
}) => {
  const [showAlertsDrawer, setShowAlertsDrawer] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showHybridSyncModal, setShowHybridSyncModal] = useState(false);
  const [syncStatus, setSyncStatus] = useState<HybridSyncStatus>(() => hybridSyncEngine.getStatus());

  useEffect(() => {
    const unsub = hybridSyncEngine.subscribe((status) => {
      setSyncStatus(status);
    });
    return () => unsub();
  }, []);

  const urgentCount = alerts.filter((a) => a.level === 'urgent').length;
  const duplicateAlertsCount = alerts.filter(a => a.isDuplicateAlert || a.title.includes('إدخال متكرر') || a.title.includes('تكرار')).length;

  const availableDepartments = DEPARTMENT_LIST.filter((dept) => {
    if (dept.role === 'القيادة الرئيسية' && !currentAccount.isMainCommand) {
      return false;
    }
    return true;
  });

  const activeDeptObj = availableDepartments.find((d) => d.role === currentRole) || availableDepartments[0];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm print:hidden no-print">
      {/* Top Banner */}
      <div className="bg-slate-950 border-b border-slate-800 px-3 sm:px-6 py-2.5 text-white">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          
          {/* Logo, Title & Tenant Badge */}
          <div className="flex items-center space-x-3 space-x-reverse shrink-0">
            <div 
              className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-700 to-emerald-500 p-0.5 shadow-md flex items-center justify-center shrink-0 cursor-pointer hover:scale-105 transition-transform"
              onClick={() => onTabChange('dashboard')}
            >
              <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
              </div>
            </div>

            <div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <h1 
                  onClick={() => onTabChange('dashboard')}
                  className="text-base sm:text-lg font-black tracking-tight text-white font-['Tajawal'] cursor-pointer hover:text-emerald-300 transition-colors"
                >
                  نظام إدارة القوة البشرية العسكري
                </h1>

                {/* Tenant Badge */}
                {onOpenTenantModal && activeTenant && (
                  <button
                    type="button"
                    onClick={onOpenTenantModal}
                    className="flex items-center space-x-1 space-x-reverse px-2 py-0.5 rounded-full bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-300 text-[10px] font-black transition-all cursor-pointer"
                    title="تغيير المؤسسة العسكرية (Multi-Tenant)"
                  >
                    <span>{activeTenant.badge || '🏢'}</span>
                    <span className="truncate max-w-[120px]">{activeTenant.name}</span>
                  </button>
                )}
              </div>

              <div className="text-[11px] text-slate-400 flex items-center space-x-2 space-x-reverse">
                <span className="text-emerald-400 font-bold">{activeTenant ? activeTenant.code : 'HQ'}</span>
                <span>•</span>
                <span 
                  onClick={() => currentAccount.isMainCommand && onOpenAccountsModal()}
                  className={`font-semibold ${currentAccount.isMainCommand ? 'text-amber-400 hover:underline cursor-pointer' : 'text-slate-300'}`}
                >
                  {currentAccount.badge} {currentAccount.name}
                </span>
              </div>
            </div>
          </div>

          {/* Search bar & Department selector */}
          <div className="flex items-center space-x-2 space-x-reverse flex-1 max-w-xl w-full">
            {/* Search Box */}
            <div
              className="relative flex-1 cursor-pointer min-w-[130px]"
              onClick={() => onOpenSearchModal && onOpenSearchModal()}
            >
              <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                onClick={(e) => {
                  if (onOpenSearchModal) {
                    e.stopPropagation();
                    onOpenSearchModal();
                  }
                }}
                placeholder="البحث الشامل..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pr-9 pl-24 py-1.5 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all cursor-pointer"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onOpenSearchModal) onOpenSearchModal();
                }}
                className="absolute left-1.5 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-emerald-600/30 hover:bg-emerald-600 text-emerald-200 hover:text-white rounded-lg text-[10px] font-extrabold flex items-center space-x-1 space-x-reverse transition-all border border-emerald-500/40"
              >
                <Camera className="w-3 h-3 text-emerald-300" />
                <span className="hidden sm:inline">بحث بالصورة</span>
              </button>
            </div>

            {/* Quick System Tools & Permissions Dropdown Button - CENTER POSITION */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowToolsMenu(!showToolsMenu);
                  setShowRoleMenu(false);
                  setShowAlertsDrawer(false);
                  setShowUserMenu(false);
                }}
                className="flex items-center space-x-1.5 space-x-reverse px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border-2 border-emerald-500 text-emerald-300 hover:text-white font-black text-xs transition-all cursor-pointer shadow-md shrink-0 ring-1 ring-emerald-500/30"
                title="مركز الأذونات والصلاحيات والتقارير"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-['Tajawal'] font-bold text-xs whitespace-nowrap">الأذونات والتقارير 🛡️</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              </button>

              {showToolsMenu && (
                <>
                  <div className="fixed inset-0 z-40 bg-slate-950/20" onClick={() => setShowToolsMenu(false)} />
                  <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-80 max-w-[calc(100vw-1.5rem)] bg-white text-slate-900 border border-slate-200 rounded-2xl shadow-2xl p-2.5 z-50 space-y-1.5">
                    <div className="px-3 py-2 text-xs font-black text-slate-500 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center space-x-1.5 space-x-reverse text-slate-800 font-bold">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span>مركز الأذونات والتقارير والعمليات</span>
                      </div>
                      <button type="button" onClick={() => setShowToolsMenu(false)} className="text-slate-400 hover:text-slate-600">
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Local Storage Center Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowHybridSyncModal(true);
                        setShowToolsMenu(false);
                      }}
                      className="w-full flex items-center space-x-2.5 space-x-reverse px-3 py-2.5 text-xs font-bold text-cyan-950 bg-cyan-50 hover:bg-cyan-100 rounded-xl transition-all text-right border border-cyan-300/80 shadow-2xs"
                    >
                      <Database className="w-4 h-4 text-cyan-600 shrink-0" />
                      <div className="flex-1">
                        <div className="font-extrabold text-cyan-900 flex items-center justify-between">
                          <span>مركز التخزين المحلي الآمن 💾</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-800">
                            تخزين محلي 100%
                          </span>
                        </div>
                        <div className="text-[10px] text-cyan-700 font-normal mt-0.5">حفظ وتخزين محلي مباشر وآمن على الجهاز بدون الحاجة للسحابة</div>
                      </div>
                    </button>

                    {/* Permissions & User Accounts */}
                    {onOpenTenantUsersModal && (
                      <button
                        type="button"
                        onClick={() => {
                          onOpenTenantUsersModal();
                          setShowToolsMenu(false);
                        }}
                        className="w-full flex items-center space-x-2.5 space-x-reverse px-3 py-2.5 text-xs font-bold text-emerald-950 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-all text-right border border-emerald-300/80 shadow-2xs"
                      >
                        <Users className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div className="flex-1">
                          <div className="font-extrabold text-emerald-900">إدارة أذونات المستخدمين والصلاحيات 👥</div>
                          <div className="text-[10px] text-emerald-700 font-normal">تعيين وتعديل أذونات الضباط وإدارة الحسابات الفرعية</div>
                        </div>
                      </button>
                    )}

                    {/* Super Admin System Settings & Storage */}
                    {onOpenSuperAdminSettingsModal && (
                      <button
                        type="button"
                        onClick={() => {
                          onOpenSuperAdminSettingsModal();
                          setShowToolsMenu(false);
                        }}
                        className="w-full flex items-center space-x-2.5 space-x-reverse px-3 py-2.5 text-xs font-bold text-amber-950 bg-amber-50 hover:bg-amber-100 rounded-xl transition-all text-right border border-amber-300/80 shadow-2xs"
                      >
                        <Settings className="w-4 h-4 text-amber-600 shrink-0" />
                        <div className="flex-1">
                          <div className="font-extrabold text-amber-900">إعدادات المسؤول (التخزين والنسخ والأذونات) ⚙️</div>
                          <div className="text-[10px] text-amber-700 font-normal">فحص قاعدة البيانات والنسخ الاحتياطي وإدارة المساحة</div>
                        </div>
                      </button>
                    )}

                    {/* Daily Readiness Report */}
                    {onOpenDailyReadinessReport && (
                      <button
                        type="button"
                        onClick={() => {
                          onOpenDailyReadinessReport();
                          setShowToolsMenu(false);
                        }}
                        className="w-full flex items-center space-x-2.5 space-x-reverse px-3 py-2 text-xs font-bold text-slate-800 hover:bg-emerald-50 hover:text-emerald-900 rounded-xl transition-colors text-right"
                      >
                        <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>تقرير الجاهزية اليومي الموحد 📄</span>
                      </button>
                    )}

                    {/* Military Notifications Center */}
                    {onOpenNotificationModal && (
                      <button
                        type="button"
                        onClick={() => {
                          onOpenNotificationModal();
                          setShowToolsMenu(false);
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-slate-800 hover:bg-slate-100 rounded-xl transition-colors text-right"
                      >
                        <div className="flex items-center space-x-2.5 space-x-reverse">
                          <Bell className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>مركز التنبيهات والتقارير العسكرية 🔔</span>
                        </div>
                        {urgentCount > 0 && (
                          <span className="bg-rose-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                            {urgentCount}
                          </span>
                        )}
                      </button>
                    )}

                    {/* Face Scan ID */}
                    {onOpenFaceScanModal && (
                      <button
                        type="button"
                        onClick={() => {
                          onOpenFaceScanModal();
                          setShowToolsMenu(false);
                        }}
                        className="w-full flex items-center space-x-2.5 space-x-reverse px-3 py-2 text-xs font-bold text-slate-800 hover:bg-slate-100 rounded-xl transition-colors text-right"
                      >
                        <Scan className="w-4 h-4 text-teal-600 shrink-0" />
                        <span>فحص ومسح الوجه الحيوي (Face ID) 📸</span>
                      </button>
                    )}

                    {/* Duplicate Alerts */}
                    {currentAccount.isMainCommand && onOpenDuplicateAlertsModal && (
                      <button
                        type="button"
                        onClick={() => {
                          onOpenDuplicateAlertsModal();
                          setShowToolsMenu(false);
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-rose-800 hover:bg-rose-50 rounded-xl transition-colors text-right"
                      >
                        <div className="flex items-center space-x-2.5 space-x-reverse">
                          <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>إنذارات التكرار بين الحسابات 🚨</span>
                        </div>
                        {duplicateAlertsCount > 0 && (
                          <span className="bg-rose-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                            {duplicateAlertsCount}
                          </span>
                        )}
                      </button>
                    )}

                    {/* Recycle Bin */}
                    {onOpenRecycleBinModal && (
                      <button
                        type="button"
                        onClick={() => {
                          onOpenRecycleBinModal();
                          setShowToolsMenu(false);
                        }}
                        className="w-full flex items-center space-x-2.5 space-x-reverse px-3 py-2 text-xs font-bold text-slate-800 hover:bg-slate-100 rounded-xl transition-colors text-right"
                      >
                        <Trash2 className="w-4 h-4 text-rose-500 shrink-0" />
                        <span>سلة المحذوفات والمستردات 🗑️</span>
                      </button>
                    )}

                    {/* Brigade Accounts & Links */}
                    {currentAccount.isMainCommand && (
                      <button
                        type="button"
                        onClick={() => {
                          onOpenAccountsModal();
                          setShowToolsMenu(false);
                        }}
                        className="w-full flex items-center space-x-2.5 space-x-reverse px-3 py-2 text-xs font-bold text-amber-800 hover:bg-amber-50 rounded-xl transition-colors text-right"
                      >
                        <Key className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>إدارة حسابات الألوية والروابط 🔑</span>
                      </button>
                    )}

                    <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          window.open(window.location.href, '_blank', 'noopener,noreferrer');
                          setShowToolsMenu(false);
                        }}
                        className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded-lg flex items-center justify-center space-x-1 space-x-reverse"
                        title="فتح في نافذة جديدة"
                      >
                        <ExternalLink className="w-3 h-3 text-slate-500" />
                        <span>نافذة منفصلة</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onResetData();
                          setShowToolsMenu(false);
                        }}
                        className="p-1.5 bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-700 rounded-lg"
                        title="إعادة ضبط النظام"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Department Role Dropdown */}
            <div className="relative shrink-0">
              <button
                onClick={() => {
                  setShowRoleMenu(!showRoleMenu);
                  setShowToolsMenu(false);
                  setShowAlertsDrawer(false);
                  setShowUserMenu(false);
                }}
                className="flex items-center space-x-1.5 space-x-reverse px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-slate-200 transition-all shadow-xs cursor-pointer"
              >
                <span>{activeDeptObj.icon}</span>
                <span className="truncate max-w-[110px] text-emerald-400">{activeDeptObj.role}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showRoleMenu && (
                <>
                  <div className="fixed inset-0 z-40 bg-slate-950/20" onClick={() => setShowRoleMenu(false)} />
                  <div className="absolute left-0 top-full mt-2 w-64 bg-white text-slate-900 border border-slate-200 rounded-2xl shadow-2xl py-2 z-50 divide-y divide-slate-100 max-h-[80vh] overflow-y-auto">
                    <div className="px-3 py-2 text-[11px] font-extrabold text-slate-500 flex items-center justify-between">
                      <span>تبديل القسم والفرع المختص</span>
                      <button onClick={() => setShowRoleMenu(false)} className="text-slate-400 hover:text-slate-600">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="py-1">
                      {availableDepartments.map((dept) => (
                        <button
                          key={dept.role}
                          onClick={() => {
                            onRoleChange(dept.role);
                            onTabChange('workspace');
                            setShowRoleMenu(false);
                          }}
                          className={`w-full flex items-center space-x-2.5 space-x-reverse px-3 py-2 text-xs font-bold text-right hover:bg-slate-50 transition-colors ${
                            currentRole === dept.role ? 'bg-emerald-50 text-emerald-800' : 'text-slate-700'
                          }`}
                        >
                          <span className="text-sm">{dept.icon}</span>
                          <span className="flex-1">{dept.label}</span>
                          {currentRole === dept.role && <span className="w-2 h-2 rounded-full bg-emerald-600"></span>}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Clean Right Actions Group */}
          <div className="flex items-center space-x-2 space-x-reverse shrink-0">
            
            {/* Notifications Bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  if (onOpenNotificationModal) {
                    onOpenNotificationModal();
                  } else {
                    setShowAlertsDrawer(!showAlertsDrawer);
                  }
                  setShowRoleMenu(false);
                  setShowToolsMenu(false);
                  setShowUserMenu(false);
                }}
                className="relative p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 transition-all cursor-pointer"
                title="التنبيهات اللحظية"
              >
                <Bell className="w-4 h-4 text-amber-400" />
                {urgentCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                    {urgentCount}
                  </span>
                )}
              </button>

              {/* Alerts Dropdown Drawer */}
              {showAlertsDrawer && (
                <>
                  <div className="fixed inset-0 bg-slate-950/20 z-40" onClick={() => setShowAlertsDrawer(false)} />
                  <div className="absolute left-0 top-full mt-2 w-80 bg-white text-slate-900 border border-slate-200 rounded-2xl shadow-2xl p-3 z-50 max-h-[80vh] flex flex-col">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
                      <div className="flex items-center space-x-1.5 space-x-reverse text-xs font-bold">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        <span>التنبيهات العسكرية</span>
                      </div>
                      <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-bold">
                        {alerts.length}
                      </span>
                    </div>

                    <div className="space-y-2 overflow-y-auto pr-1 flex-1 max-h-72">
                      {alerts.map((alt) => (
                        <div
                          key={alt.id}
                          className={`p-2.5 rounded-xl border text-xs ${
                            alt.level === 'urgent'
                              ? 'bg-rose-50 border-rose-200 text-rose-900'
                              : alt.level === 'warning'
                              ? 'bg-amber-50 border-amber-200 text-amber-900'
                              : 'bg-slate-50 border-slate-200 text-slate-800'
                          }`}
                        >
                          <div className="font-bold flex items-center justify-between mb-1">
                            <span>{alt.title}</span>
                            <span className="text-[10px] opacity-75 font-mono">{alt.date}</span>
                          </div>
                          <p className="text-[11px] opacity-90">{alt.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* User Account & Login Menu */}
            <div className="relative">
              {currentUser ? (
                <button
                  type="button"
                  onClick={() => {
                    setShowUserMenu(!showUserMenu);
                    setShowRoleMenu(false);
                    setShowToolsMenu(false);
                    setShowAlertsDrawer(false);
                  }}
                  className="flex items-center space-x-2 space-x-reverse px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-amber-500/40 text-amber-300 font-extrabold text-xs transition-all cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span className="max-w-[100px] truncate">{currentUser.fullName.split(' ')[0]}</span>
                  {currentUser.isSuperAdmin && (
                    <span className="bg-amber-500 text-slate-950 text-[9px] font-black px-1 rounded">Super</span>
                  )}
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onOpenLoginModal}
                  className="flex items-center space-x-1.5 space-x-reverse px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-extrabold text-xs transition-all shadow-sm cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>دخول النظام 🔑</span>
                </button>
              )}

              {/* Logged User Dropdown Menu */}
              {showUserMenu && currentUser && (
                <>
                  <div className="fixed inset-0 z-40 bg-slate-950/20" onClick={() => setShowUserMenu(false)} />
                  <div className="absolute left-0 top-full mt-2 w-64 bg-white text-slate-900 border border-slate-200 rounded-2xl shadow-2xl p-3 z-50 space-y-2">
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="font-extrabold text-xs text-slate-900">{currentUser.fullName}</div>
                      <div className="text-[10px] text-slate-500">{currentUser.roleTitle} ({currentUser.rank || 'ضابط'})</div>
                      <div className="mt-1 text-[10px] font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-block">
                        @{currentUser.username}
                      </div>
                    </div>

                    {currentUser.isSuperAdmin && onOpenSuperAdminSettingsModal && (
                      <button
                        type="button"
                        onClick={() => {
                          onOpenSuperAdminSettingsModal();
                          setShowUserMenu(false);
                        }}
                        className="w-full flex items-center space-x-2 space-x-reverse p-2 text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 rounded-xl transition-colors text-right border border-amber-300"
                      >
                        <Settings className="w-4 h-4 text-amber-600" />
                        <span>إعدادات المسؤول (المساحة والنسخ والصلاحيات)</span>
                      </button>
                    )}

                    {currentUser.isSuperAdmin && onOpenTenantUsersModal && (
                      <button
                        type="button"
                        onClick={() => {
                          onOpenTenantUsersModal();
                          setShowUserMenu(false);
                        }}
                        className="w-full flex items-center space-x-2 space-x-reverse p-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors text-right border border-emerald-200"
                      >
                        <Users className="w-4 h-4 text-emerald-600" />
                        <span>إدارة المستخدمين والصلاحيات (Super Admin)</span>
                      </button>
                    )}

                    <div className="pt-1 border-t border-slate-100">
                      {onLogout && (
                        <button
                          type="button"
                          onClick={() => {
                            onLogout();
                            setShowUserMenu(false);
                          }}
                          className="w-full flex items-center space-x-2 space-x-reverse p-2 text-xs font-bold text-rose-700 hover:bg-rose-50 rounded-xl transition-colors text-right"
                        >
                          <LogOut className="w-4 h-4 text-rose-600" />
                          <span>تسجيل الخروج من الحساب</span>
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

          </div>

        </div>
      </div>

      {/* Segmented Navigation Tabs Bar */}
      <div className="bg-slate-100/80 border-t border-slate-200/80 px-4 py-1.5 overflow-x-auto">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 text-xs font-bold whitespace-nowrap">
          
          <div className="flex items-center space-x-1.5 space-x-reverse bg-slate-200/60 p-1 rounded-2xl border border-slate-300/60">
            <button
              onClick={() => onTabChange('dashboard')}
              className={`px-4 py-1.5 rounded-xl transition-all flex items-center space-x-1.5 space-x-reverse ${
                activeTab === 'dashboard'
                  ? 'bg-emerald-800 text-white font-extrabold shadow-sm'
                  : 'text-slate-700 hover:bg-white/60 hover:text-slate-900'
              }`}
            >
              <span>🛡️</span>
              <span>لوحة الجاهزية القتالية</span>
            </button>

            <button
              onClick={() => onTabChange('personnel')}
              className={`px-4 py-1.5 rounded-xl transition-all flex items-center space-x-1.5 space-x-reverse ${
                activeTab === 'personnel'
                  ? 'bg-emerald-800 text-white font-extrabold shadow-sm'
                  : 'text-slate-700 hover:bg-white/60 hover:text-slate-900'
              }`}
            >
              <span>👥</span>
              <span>سجل القوة البشرية</span>
            </button>

            <button
              onClick={() => onTabChange('workspace')}
              className={`px-4 py-1.5 rounded-xl transition-all flex items-center space-x-1.5 space-x-reverse ${
                activeTab === 'workspace'
                  ? 'bg-emerald-800 text-white font-extrabold shadow-sm'
                  : 'text-slate-700 hover:bg-white/60 hover:text-slate-900'
              }`}
            >
              <span>🏢</span>
              <span>مساحة الفرع ({currentRole})</span>
            </button>

            <button
              onClick={() => onTabChange('reports')}
              className={`px-4 py-1.5 rounded-xl transition-all flex items-center space-x-1.5 space-x-reverse ${
                activeTab === 'reports'
                  ? 'bg-emerald-800 text-white font-extrabold shadow-sm'
                  : 'text-slate-700 hover:bg-white/60 hover:text-slate-900'
              }`}
            >
              <span>📊</span>
              <span>التقارير الذكية والمستندات</span>
            </button>

            <button
              onClick={() => onTabChange('audit')}
              className={`px-4 py-1.5 rounded-xl transition-all flex items-center space-x-1.5 space-x-reverse ${
                activeTab === 'audit'
                  ? 'bg-emerald-800 text-white font-extrabold shadow-sm'
                  : 'text-slate-700 hover:bg-white/60 hover:text-slate-900'
              }`}
            >
              <span>📋</span>
              <span>سجل التدقيق</span>
            </button>
          </div>

          {/* Account/Brigade Quick Switch Indicator */}
          <div className="hidden md:flex items-center space-x-2 space-x-reverse text-slate-600 text-[11px] font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>الحساب المباشر:</span>
            <span className="px-2 py-0.5 rounded-lg bg-white border border-slate-300 text-slate-800 font-mono">
              {currentAccount.shortCode}
            </span>
          </div>

        </div>
      </div>

      {/* Hybrid Storage & Firebase Sync Modal */}
      <HybridSyncModal
        isOpen={showHybridSyncModal}
        onClose={() => setShowHybridSyncModal(false)}
      />
    </header>
  );
};

