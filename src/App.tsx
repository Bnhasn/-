import React, { useState, useEffect } from 'react';
import { NavbarHeader } from './components/NavbarHeader';
import { ReadinessDashboard } from './components/ReadinessDashboard';
import { PersonnelList } from './components/PersonnelList';
import { PersonnelProfileView } from './components/PersonnelProfileView';
import { DepartmentWorkspaces } from './components/DepartmentWorkspaces';
import { ReportsManager } from './components/ReportsManager';
import { AuditLogView } from './components/AuditLogView';
import { PersonnelFormModal } from './components/PersonnelFormModal';
import { PrintProfileModal } from './components/PrintProfileModal';
import { AccountsManagementModal } from './components/AccountsManagementModal';
import { HQPinModal } from './components/HQPinModal';
import { UnifiedSearchModal } from './components/UnifiedSearchModal';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { RecycleBinModal } from './components/RecycleBinModal';
import { DuplicateAlertsModal } from './components/DuplicateAlertsModal';
import { PWAInstallModal } from './components/PWAInstallModal';
import { OfflineSyncBanner } from './components/OfflineSyncBanner';
import { ExcelImportModal } from './components/ExcelImportModal';
import { PersonnelReplacementModal } from './components/PersonnelReplacementModal';
import { FaceVerificationModal, FaceVerificationResult } from './components/FaceVerificationModal';
import { DailyReadinessReportModal } from './components/DailyReadinessReportModal';
import { TenantManagementModal } from './components/TenantManagementModal';
import { LoginModal } from './components/LoginModal';
import { TenantUsersManagementModal } from './components/TenantUsersManagementModal';
import { SuperAdminSettingsModal } from './components/SuperAdminSettingsModal';

import { PersonnelRecord, DepartmentRole, PersonnelStatus, AuditLogEntry, SystemAlert, UserAccount, OrganizationTenant, TenantUserAccount } from './types';
import { StorageService } from './lib/storage';
import { BRIGADE_ACCOUNTS, getAccountByCode, isPersonnelInAccount, parseAccountFromUrl } from './data/accountsData';
import { ShieldCheck, Lock, ExternalLink, Key, AlertTriangle, Trash2, Ban, ShieldAlert } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [currentRole, setCurrentRole] = useState<DepartmentRole>('القيادة الرئيسية');
  
  // Account State (Default to HQ unless specified in URL search param)
  const [currentAccount, setCurrentAccount] = useState<UserAccount>(() => {
    const urlAccount = parseAccountFromUrl();
    if (urlAccount) return urlAccount;

    if (typeof window !== 'undefined') {
      const savedCode = localStorage.getItem('military_active_account_v1');
      if (savedCode) {
        return getAccountByCode(savedCode);
      }
    }
    return BRIGADE_ACCOUNTS[0]; // HQ Command
  });

  const [showAccountsModal, setShowAccountsModal] = useState<boolean>(false);
  const [showHQPinModal, setShowHQPinModal] = useState<boolean>(false);
  const [pendingAccount, setPendingAccount] = useState<UserAccount | null>(null);

  // Multi-Tenant Platform State
  const [showTenantModal, setShowTenantModal] = useState<boolean>(false);
  const [activeTenant, setActiveTenant] = useState<OrganizationTenant>(() => StorageService.getActiveTenant());

  // User Authentication & Permissions State
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [showTenantUsersModal, setShowTenantUsersModal] = useState<boolean>(false);
  const [showSuperAdminSettingsModal, setShowSuperAdminSettingsModal] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<TenantUserAccount | null>(() => StorageService.getCurrentUser());

  const [showSearchModal, setShowSearchModal] = useState<boolean>(false);
  const [showNotificationModal, setShowNotificationModal] = useState<boolean>(false);
  const [showRecycleBinModal, setShowRecycleBinModal] = useState<boolean>(false);
  const [showDuplicateAlertsModal, setShowDuplicateAlertsModal] = useState<boolean>(false);
  const [showPwaModal, setShowPwaModal] = useState<boolean>(false);
  const [deviceAccessDenied, setDeviceAccessDenied] = useState<{ isDenied: boolean; reason?: string }>({ isDenied: false });

  const [personnel, setPersonnel] = useState<PersonnelRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [globalSearchTerm, setGlobalSearchTerm] = useState<string>('');

  // Delete Personnel Modal state
  const [deleteTarget, setDeleteTarget] = useState<{ militaryId: string; name: string } | null>(null);
  const [deleteReasonInput, setDeleteReasonInput] = useState<string>('نقل إلى سلة المحذوفات الإدارية');

  // Selected personnel for profile view or print
  const [selectedMilitaryId, setSelectedMilitaryId] = useState<string | null>(null);
  const [editingPersonnel, setEditingPersonnel] = useState<PersonnelRecord | null>(null);
  
  // Modals
  const [showFormModal, setShowFormModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [showReplacementModal, setShowReplacementModal] = useState(false);
  const [preSelectedReplacementId, setPreSelectedReplacementId] = useState<string | null>(null);
  const [showGlobalFaceModal, setShowGlobalFaceModal] = useState(false);
  const [showDailyReadinessReportModal, setShowDailyReadinessReportModal] = useState<boolean>(false);

  const handleGlobalFaceVerified = (result: FaceVerificationResult) => {
    const person = result.verifiedPerson;
    if (person) {
      StorageService.logAction(
        currentRole,
        'الاستخبارات والأمن',
        'فحص واختبار مسح الوجه المباشر',
        person.militaryId,
        person.fullName,
        `تم إجراء فحص مسح الوجه المباشر للفرد (${person.rank} / ${person.fullName}) بنسبة مطابقة حيومية ${result.matchScore}% وتوقيع رقمي معتمد (${result.digitalSignature}).`,
        person.militaryId,
        person.fullName
      );
      loadData();
    }
  };
  const [excelImportType, setExcelImportType] = useState<'personnel' | 'readiness' | 'armament'>('personnel');
  const [printReportTitle, setPrintReportTitle] = useState<string>('');
  const [printReportData, setPrintReportData] = useState<PersonnelRecord[]>([]);

  // Load state from local storage on mount and refresh
  const loadData = () => {
    const pList = StorageService.getPersonnel();
    const aLogs = StorageService.getAuditLogs();
    const altList = StorageService.getAlerts();

    setPersonnel((prev) => (JSON.stringify(prev) === JSON.stringify(pList) ? prev : pList));
    setAuditLogs((prev) => (JSON.stringify(prev) === JSON.stringify(aLogs) ? prev : aLogs));
    setAlerts((prev) => (JSON.stringify(prev) === JSON.stringify(altList) ? prev : altList));

    // Refresh current account from storage to pick up block / custom key changes
    const urlAcc = parseAccountFromUrl();
    const activeAcc = urlAcc || currentAccount;

    if (activeAcc) {
      const bindingCheck = StorageService.checkAndBindAccountDevice(activeAcc);
      if (!bindingCheck.allowed) {
        setDeviceAccessDenied({ isDenied: true, reason: bindingCheck.reason });
      } else {
        setDeviceAccessDenied({ isDenied: false });
        if (bindingCheck.updatedAccount) {
          setCurrentAccount((prev) => {
            if (
              prev.id !== bindingCheck.updatedAccount.id ||
              prev.isBlocked !== bindingCheck.updatedAccount.isBlocked ||
              prev.status !== bindingCheck.updatedAccount.status ||
              prev.boundDeviceId !== bindingCheck.updatedAccount.boundDeviceId
            ) {
              return bindingCheck.updatedAccount;
            }
            return prev;
          });
        } else if (urlAcc) {
          setCurrentAccount((prev) => (prev.id === urlAcc.id ? prev : urlAcc));
        }
      }
    } else {
      const storedAccounts = StorageService.getAccounts();
      setCurrentAccount((prev) => {
        const found = storedAccounts.find((a) => a.id === prev.id);
        if (found && (found.isBlocked !== prev.isBlocked || found.status !== prev.status)) {
          return found;
        }
        return prev;
      });
    }
  };

  useEffect(() => {
    loadData();

    // Register active presence ping immediately for current account / URL account
    const urlAcc = parseAccountFromUrl();
    const activeAccId = urlAcc ? urlAcc.id : currentAccount.id;
    StorageService.registerAccountActivity(activeAccId);

    // Heartbeat presence ping every 20 seconds while page is active
    const pingInterval = setInterval(() => {
      StorageService.registerAccountActivity(currentAccount.id);
    }, 20000);

    // Subscribe to real-time changes across tabs & windows
    const unsubscribe = StorageService.subscribeToChanges(() => {
      loadData();
    });

    const syncAccountFromUrl = () => {
      const urlAccount = parseAccountFromUrl();
      if (urlAccount) {
        setCurrentAccount(urlAccount);
        StorageService.registerAccountActivity(urlAccount.id);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('popstate', syncAccountFromUrl);
      window.addEventListener('hashchange', syncAccountFromUrl);
    }

    return () => {
      clearInterval(pingInterval);
      unsubscribe();
      if (typeof window !== 'undefined') {
        window.removeEventListener('popstate', syncAccountFromUrl);
        window.removeEventListener('hashchange', syncAccountFromUrl);
      }
    };
  }, [currentAccount.id]);

  // Enforce role restrictions for non-main command accounts
  useEffect(() => {
    if (!currentAccount.isMainCommand && currentRole === 'القيادة الرئيسية') {
      setCurrentRole('إدارة الموارد البشرية');
    }
  }, [currentAccount, currentRole]);

  // Update URL search query whenever account changes & load fresh personnel data
  const handleSelectAccount = (account: UserAccount) => {
    setCurrentAccount(account);
    StorageService.registerAccountActivity(account.id);
    if (typeof window !== 'undefined') {
      localStorage.setItem('military_active_account_v1', account.shortCode);
      const url = new URL(window.location.href);
      url.searchParams.set('account', account.shortCode);
      window.history.replaceState({}, '', url.toString());
    }
    // Refresh dataset from storage immediately upon account selection
    setTimeout(() => {
      loadData();
    }, 50);
  };

  // Protected Account Switcher: Requires PIN when entering Main Command from a sub-account
  const handleRequestAccountSwitch = (account: UserAccount) => {
    if (account.isMainCommand) {
      const isAuthenticated = typeof window !== 'undefined' && sessionStorage.getItem('hq_authenticated') === 'true';
      if (!currentAccount.isMainCommand && !isAuthenticated) {
        setPendingAccount(account);
        setShowHQPinModal(true);
        return;
      }
    } else {
      // If Main Command HQ switches to inspect a sub-account, mark session so HQ can easily switch back
      if (currentAccount.isMainCommand && typeof window !== 'undefined') {
        sessionStorage.setItem('hq_authenticated', 'true');
      }
    }
    handleSelectAccount(account);
  };

  // Quick status change from any component
  const handleQuickStatusChange = (militaryId: string, newStatus: PersonnelStatus) => {
    StorageService.updateStatus(
      militaryId,
      newStatus,
      `تعديل مباشر للحالة القتالية بواسطة [${currentAccount.name}]`,
      `مستخدم (${currentAccount.name})`,
      currentRole
    );
    loadData();
  };

  // Save new or edited personnel
  const handleSavePersonnel = (record: PersonnelRecord) => {
    // Force unit to current account brigade if adding new personnel under a specific brigade
    if (!editingPersonnel && !currentAccount.isMainCommand) {
      record.unit = currentAccount.unitFilter;
    }

    if (editingPersonnel) {
      StorageService.updatePersonnel(
        record,
        `مستخدم (${currentAccount.name})`,
        currentRole,
        'تحديث بيانات الفرد الأساسية',
        editingPersonnel.militaryId
      );
    } else {
      StorageService.addPersonnel(
        record,
        `مستخدم (${currentAccount.name})`,
        currentRole
      );
    }
    setEditingPersonnel(null);
    loadData();
  };

  // Delete personnel (soft delete -> move to 30-day recycle bin)
  const handleDeletePersonnel = (militaryId: string, name: string) => {
    setDeleteTarget({ militaryId, name });
    setDeleteReasonInput('نقل إلى سلة المحذوفات الإدارية');
  };

  const confirmDeletePersonnel = () => {
    if (!deleteTarget) return;
    StorageService.deletePersonnelToRecycleBin(
      deleteTarget.militaryId,
      `مستخدم (${currentAccount.name})`,
      currentRole,
      deleteReasonInput || 'نقل إلى سلة المحذوفات'
    );
    if (selectedMilitaryId === deleteTarget.militaryId) {
      setSelectedMilitaryId(null);
      setActiveTab('personnel');
    }
    setDeleteTarget(null);
    loadData();
  };

  // Reset database to initial mock records
  const handleResetData = () => {
    if (window.confirm('هل أنت تأكد من إرجاع قاعدة البيانات المركزية للبيانات الافتراضية الأولية؟')) {
      StorageService.resetToDefault();
      setSelectedMilitaryId(null);
      loadData();
    }
  };

  // Handle single profile select
  const handleSelectPersonnel = (id: string) => {
    const targetPerson = personnel.find((p) => p.militaryId === id);
    if (targetPerson) {
      if (!currentAccount.isMainCommand && !isPersonnelInAccount(targetPerson, currentAccount)) {
        // Auto switch to main command account if trying to view a profile outside current isolated account
        handleSelectAccount(BRIGADE_ACCOUNTS[0]);
      }
    }
    setSelectedMilitaryId(id);
    setActiveTab('profile');
  };

  // Filtered dataset for active account
  const visiblePersonnel = personnel.filter((p) => isPersonnelInAccount(p, currentAccount));

  // Filtered audit logs (Isolated by account / brigade, High Command sees everything)
  const visibleAuditLogs = currentAccount.isMainCommand
    ? auditLogs
    : auditLogs.filter((log) => {
        if (log.accountId === 'hq' || (log.accountName && (log.accountName.includes('قيادة الفرقة') || log.accountName.includes('الرئيسي')))) {
          return false;
        }

        // 1. Direct account ID match
        if (log.accountId && log.accountId === currentAccount.id) return true;

        // 2. Direct account Name match
        if (log.accountName && (log.accountName === currentAccount.name || log.accountName.includes(currentAccount.name))) return true;

        // 3. Target personnel belongs to current account scope
        const targetP = personnel.find((p) => p.militaryId === log.targetMilitaryId);
        if (targetP && isPersonnelInAccount(targetP, currentAccount)) return true;

        return false;
      });

  // Filtered alerts
  const visibleAlerts = currentAccount.isMainCommand
    ? alerts
    : alerts.filter((alt) => {
        if (alt.createdByAccountId === 'hq') return false;
        if (alt.militaryId) {
          const targetP = personnel.find((p) => p.militaryId === alt.militaryId);
          return targetP ? isPersonnelInAccount(targetP, currentAccount) : false;
        }
        return alt.createdByAccountId === currentAccount.id;
      });

  const selectedPerson = personnel.find((p) => p.militaryId === selectedMilitaryId);

  // Render Device Binding Lock Access Denied Screen
  if (deviceAccessDenied.isDenied) {
    return (
      <div className="min-h-screen bg-slate-950 text-white font-['Cairo',sans-serif] flex items-center justify-center p-4 select-none">
        <div className="bg-slate-900 border-2 border-amber-600/90 rounded-3xl max-w-xl w-full p-8 shadow-2xl text-center space-y-6">
          <div className="w-20 h-20 bg-amber-500/20 border-2 border-amber-500 rounded-3xl flex items-center justify-center mx-auto text-amber-500 animate-pulse">
            <ShieldAlert className="w-10 h-10 text-amber-500" />
          </div>

          <div className="space-y-3">
            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-black px-4 py-1.5 rounded-full inline-block">
              🚨 تنبيه أمني: رابط الحساب مقيد بجهاز آخر
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-amber-400 font-['Tajawal'] mt-2">
              محاولة فتح الحساب عبر جهاز غير مصرح به
            </h1>
            <p className="text-xs text-slate-300 font-bold">
              حساب ({currentAccount.name})
            </p>
          </div>

          <div className="bg-amber-950/60 border border-amber-800/80 p-4 rounded-2xl text-right text-xs space-y-2 text-amber-200">
            <div className="flex items-center space-x-2 space-x-reverse font-bold text-amber-300">
              <Lock className="w-4 h-4 text-amber-400 shrink-0" />
              <span>سبب منع الفتح والتنبيه الآلي:</span>
            </div>
            <p className="font-bold text-amber-100 bg-amber-900/50 p-3 rounded-xl border border-amber-800 text-xs leading-relaxed">
              {deviceAccessDenied.reason || `رابط هذا الحساب مقيد بجهاز محدد، ولا يمكن فتحه من أي جهاز آخر. تم توثيق إشعار تنبيه أمني عاجل لدى القيادة الرئيسية بحادثة الدخول.`}
            </p>
          </div>

          <div className="pt-4 border-t border-slate-800/80">
            <div className="inline-flex items-center justify-center space-x-2 space-x-reverse bg-slate-800/80 px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-xs font-bold w-full">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>تم إرسال إشعار أمني آلي فوراً للقيادة الرئيسية يفيد بمحاولة الفتح من هذا الجهاز</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render Blocked Account Screen if current active link or account is blocked
  if (currentAccount.isBlocked || currentAccount.status === 'محظور') {
    return (
      <div className="min-h-screen bg-slate-950 text-white font-['Cairo',sans-serif] flex items-center justify-center p-4 select-none">
        <div className="bg-slate-900 border-2 border-rose-600/90 rounded-3xl max-w-xl w-full p-8 shadow-2xl text-center space-y-6">
          <div className="w-20 h-20 bg-rose-500/20 border-2 border-rose-500 rounded-3xl flex items-center justify-center mx-auto text-rose-500 animate-pulse">
            <Lock className="w-10 h-10 text-rose-500" />
          </div>

          <div className="space-y-3">
            <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-black px-4 py-1.5 rounded-full inline-block">
              🛑 حظر أمني شامل ومعطل
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-rose-500 font-['Tajawal'] mt-2">
              تم حظرك لا تستطيع استخدام الحساب
            </h1>
            <p className="text-xs text-slate-300 font-bold">
              حساب ({currentAccount.name})
            </p>
          </div>

          <div className="bg-rose-950/60 border border-rose-800/80 p-4 rounded-2xl text-right text-xs space-y-2 text-rose-200">
            <div className="flex items-center space-x-2 space-x-reverse font-bold text-rose-300">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
              <span>سبب الحظر والأوامر الإدارية:</span>
            </div>
            <p className="font-bold text-rose-100 bg-rose-900/50 p-3 rounded-xl border border-rose-800 text-xs leading-relaxed">
              {currentAccount.blockedReason || 'تم إيقاف صلاحية هذا الحساب وتجريد كافة الصلاحيات الأمنية بقرار أمني من القيادة.'}
            </p>
          </div>

          <div className="pt-4 border-t border-slate-800/80">
            <div className="inline-flex items-center justify-center space-x-2 space-x-reverse bg-rose-950/40 px-4 py-2.5 rounded-xl border border-rose-800/50 text-rose-300 text-xs font-bold w-full">
              <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
              <span>تم تحديث الأمان: الحساب معطل بالكامل ولا تتوفر أي أزرار أو خيارات للوصول</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-['Cairo',sans-serif] selection:bg-emerald-600 selection:text-white flex flex-col">
      
      {/* Offline/Online Automatic Sync Banner */}
      <OfflineSyncBanner onDataSyncTriggered={loadData} />

      {/* Navbar Header */}
      <NavbarHeader
        currentRole={currentRole}
        onRoleChange={setCurrentRole}
        currentAccount={currentAccount}
        activeTenant={activeTenant}
        currentUser={currentUser}
        onOpenLoginModal={() => setShowLoginModal(true)}
        onOpenTenantUsersModal={() => setShowTenantUsersModal(true)}
        onOpenSuperAdminSettingsModal={() => setShowSuperAdminSettingsModal(true)}
        onLogout={() => {
          StorageService.logoutUser();
          setCurrentUser(null);
        }}
        onOpenTenantModal={() => setShowTenantModal(true)}
        onOpenAccountsModal={() => setShowAccountsModal(true)}
        onOpenSearchModal={() => setShowSearchModal(true)}
        onOpenNotificationModal={() => setShowNotificationModal(true)}
        onOpenRecycleBinModal={() => setShowRecycleBinModal(true)}
        onOpenDuplicateAlertsModal={() => setShowDuplicateAlertsModal(true)}
        onOpenPwaModal={() => setShowPwaModal(true)}
        onOpenFaceScanModal={() => setShowGlobalFaceModal(true)}
        onOpenDailyReadinessReport={() => setShowDailyReadinessReportModal(true)}
        alerts={visibleAlerts}
        searchTerm={globalSearchTerm}
        onSearchChange={setGlobalSearchTerm}
        onResetData={handleResetData}
        activeTab={activeTab}
        onTabChange={(tab) => {
          if (tab !== 'profile') setSelectedMilitaryId(null);
          setActiveTab(tab);
        }}
      />

      {/* Account Isolation Banner */}
      <div className="bg-slate-900 border-b border-slate-800 text-white px-4 py-2 text-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2 space-x-reverse">
            <span className={`px-2.5 py-0.5 rounded-lg font-bold text-[11px] ${currentAccount.color}`}>
              {currentAccount.badge}
            </span>
            <span className="text-slate-300 font-medium">
              {currentAccount.isMainCommand ? (
                <span>👑 <strong>حساب القيادة العليا (لواء القيادة)</strong>: إطلاع كامل وشامل على كافة الألوية والقطاعات الثمانية وتحديثات فورية.</span>
              ) : (
                <span>🔒 <strong>وضع العزل الأمني للحساب</strong>: أنت متواجد في حساب ({currentAccount.name}). يمكنك الاطلاع فقط على بيانات منسوبي لؤاءك وتحديثاتك تتزامن فوراً مع حساب القيادة.</span>
              )}
            </span>
          </div>

          {currentAccount.isMainCommand && (
            <button
              onClick={() => setShowAccountsModal(true)}
              className="text-amber-400 hover:text-amber-300 underline font-bold flex items-center space-x-1 space-x-reverse shrink-0"
            >
              <Key className="w-3.5 h-3.5" />
              <span>عرض روابط جميع الحسابات والتنقل</span>
            </button>
          )}
        </div>
      </div>

      {/* High Command Cross-Account Duplicate Alert Banner */}
      {currentAccount.isMainCommand && alerts.some((a) => a.isDuplicateAlert || a.title.includes('إدخال متكرر') || a.title.includes('تكرار')) && (
        <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-amber-950 border-b border-rose-600/50 text-white px-4 py-3 shadow-md">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="p-2 bg-rose-600/30 text-rose-400 border border-rose-500/40 rounded-xl font-bold shrink-0">
                <ShieldAlert className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="font-black text-sm text-white font-['Tajawal'] flex items-center space-x-2 space-x-reverse">
                  <span>🚨 تنبيه القيادة العليا: تم رصد عمليات إدخال متكررة بين حسابات الألوية!</span>
                  <span className="bg-rose-500 text-white text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
                    {alerts.filter((a) => a.isDuplicateAlert || a.title.includes('إدخال متكرر') || a.title.includes('تكرار')).length} بلاغ تكرار
                  </span>
                </div>
                <p className="text-xs text-rose-200/90 mt-0.5">
                  قامت بعض الألوية بإدخال بيانات أفراد متواجدين مسبقاً بقاعدة بيانات ألوية أخرى. انقر لاستعراض السجل الكامل واتخاذ الإجراء.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowDuplicateAlertsModal(true)}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-xs transition-all shadow-md shrink-0 font-['Tajawal'] flex items-center space-x-1.5 space-x-reverse"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>عرض جميع معلومات عملية التكرر ←</span>
            </button>
          </div>
        </div>
      )}

      {/* Dev Environment Notice Banner for Share Links */}
      {typeof window !== 'undefined' && window.location.origin.includes('ais-dev-') && currentAccount.isMainCommand && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-200 px-4 py-1.5 text-[11px] font-medium">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
            <span className="flex items-center space-x-1.5 space-x-reverse">
              <span className="font-bold bg-amber-500 text-slate-950 px-1.5 py-0.5 rounded text-[10px]">تنبيه هائم لإرسال الروابط:</span>
              <span>لتجنب ظهور رسالة (ليس لديك صلاحية) لدى المستلم عند إرسال حساب عبر واتساب، انقر على <strong>[إرسال عبر واتساب 💬]</strong> أو <strong>[نسخ الرابط العام]</strong> في نافذة الحسابات.</span>
            </span>
            <button
              onClick={() => setShowAccountsModal(true)}
              className="underline font-bold text-amber-300 hover:text-white shrink-0"
            >
              مشاركة حساب عبر واتساب ←
            </button>
          </div>
        </div>
      )}

      {/* Main Container Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        
        {/* Tab 1: Readiness Dashboard */}
        {activeTab === 'dashboard' && (
          <ReadinessDashboard
            personnel={visiblePersonnel}
            onSelectPersonnel={handleSelectPersonnel}
            onQuickStatusChange={handleQuickStatusChange}
            onOpenExcelImport={() => {
              setExcelImportType('readiness');
              setShowExcelModal(true);
            }}
            onOpenDailyReadinessReport={() => setShowDailyReadinessReportModal(true)}
            currentRole={currentRole}
          />
        )}

        {/* Tab 2: Personnel Directory List */}
        {activeTab === 'personnel' && (
          <PersonnelList
            personnel={visiblePersonnel}
            onSelectPersonnel={handleSelectPersonnel}
            onEditPersonnel={(p) => {
              setEditingPersonnel(p);
              setShowFormModal(true);
            }}
            onDeletePersonnel={handleDeletePersonnel}
            onAddNewPersonnel={() => {
              setEditingPersonnel(null);
              setShowFormModal(true);
            }}
            onOpenExcelImport={() => {
              setExcelImportType('personnel');
              setShowExcelModal(true);
            }}
            onQuickStatusChange={handleQuickStatusChange}
            onOpenReplacementModal={(preId) => {
              setPreSelectedReplacementId(preId || null);
              setShowReplacementModal(true);
            }}
            currentRole={currentRole}
            globalSearchTerm={globalSearchTerm}
          />
        )}

        {/* Tab 3: Full Electronic Profile View */}
        {activeTab === 'profile' && (
          selectedPerson ? (
            <PersonnelProfileView
              personnel={selectedPerson}
              onBack={() => {
                setSelectedMilitaryId(null);
                setActiveTab('personnel');
              }}
              onRefresh={loadData}
              currentRole={currentRole}
              onDeletePersonnel={handleDeletePersonnel}
              onPrintProfile={(p) => {
                setSelectedMilitaryId(p.militaryId);
                setPrintReportTitle('');
                setPrintReportData([]);
                setShowPrintModal(true);
              }}
            />
          ) : (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-4 my-6 shadow-sm">
              <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 font-['Tajawal']">لم يتم العثور على ملف الفرد المطلوب</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                الرقم الوظيفي المحدد ({selectedMilitaryId || 'غير معروف'}) غير موجود بقاعدة البيانات الحالية.
              </p>
              <button
                onClick={() => {
                  setSelectedMilitaryId(null);
                  setActiveTab('personnel');
                }}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md"
              >
                العودة لقائمة الأفراد
              </button>
            </div>
          )
        )}

        {/* Tab 4: Department Specific Workspace */}
        {activeTab === 'workspace' && (
          <DepartmentWorkspaces
            currentRole={currentRole}
            personnel={visiblePersonnel}
            onRefresh={loadData}
            onSelectPersonnel={handleSelectPersonnel}
            currentAccountName={currentAccount.name}
            isMainCommand={currentAccount.isMainCommand}
          />
        )}

        {/* Tab 5: Smart Reports */}
        {activeTab === 'reports' && (
          <ReportsManager
            personnel={visiblePersonnel}
            onPrintReport={(title, data) => {
              setPrintReportTitle(title);
              setPrintReportData(data);
              setShowPrintModal(true);
            }}
            onOpenDailyReadinessReport={() => setShowDailyReadinessReportModal(true)}
          />
        )}

        {/* Tab 6: Central Audit Log */}
        {activeTab === 'audit' && (
          <AuditLogView auditLogs={visibleAuditLogs} currentAccount={currentAccount} />
        )}

      </main>

      {/* Accounts & Links Management Modal */}
      {showAccountsModal && (
        <AccountsManagementModal
          currentAccount={currentAccount}
          onSelectAccount={handleRequestAccountSwitch}
          onClose={() => setShowAccountsModal(false)}
          personnel={personnel}
        />
      )}

      {/* Security PIN Modal for Main Command Access */}
      <HQPinModal
        isOpen={showHQPinModal}
        onClose={() => {
          setShowHQPinModal(false);
          setPendingAccount(null);
        }}
        onSuccess={() => {
          const target = pendingAccount || BRIGADE_ACCOUNTS[0];
          handleSelectAccount(target);
          setPendingAccount(null);
        }}
      />

      {/* Add / Edit Personnel Modal */}
      <PersonnelFormModal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        onSave={handleSavePersonnel}
        editingPersonnel={editingPersonnel}
        defaultUnit={currentAccount.unitFilter}
      />

      {/* Automated Daily Readiness Report Modal */}
      <DailyReadinessReportModal
        isOpen={showDailyReadinessReportModal}
        onClose={() => setShowDailyReadinessReportModal(false)}
        personnel={visiblePersonnel}
        currentAccountName={currentAccount.name}
      />

      {/* Printable Document Modal */}
      {showPrintModal && (
        <PrintProfileModal
          personnel={printReportData.length === 0 ? selectedPerson || null : null}
          reportTitle={printReportTitle}
          reportData={printReportData}
          onClose={() => setShowPrintModal(false)}
          currentAccountName={currentAccount.name}
        />
      )}

      {/* Unified Search Modal */}
      <UnifiedSearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        personnel={visiblePersonnel}
        onSelectPersonnel={handleSelectPersonnel}
        currentRole={currentRole}
      />

      {/* Notification Center Modal */}
      <NotificationCenterModal
        isOpen={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
        personnel={personnel}
        onSelectPersonnel={handleSelectPersonnel}
        onRefreshData={loadData}
      />

      {/* Delete Personnel Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-rose-200 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl relative overflow-hidden">
            <div className="bg-rose-50 border-r-4 border-rose-600 p-4 rounded-xl flex items-start space-x-3 space-x-reverse">
              <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <h3 className="font-extrabold text-rose-950 text-sm font-['Tajawal']">
                  تأكيد نقل الفرد إلى سلة المحذوفات
                </h3>
                <p className="text-rose-900 font-medium leading-relaxed">
                  هل أنت أصل تأكيد نقل بيانات الفرد (<strong className="text-rose-950 font-bold">{deleteTarget.name}</strong>) إلى سلة المحذوفات؟
                </p>
                <p className="text-[11px] text-rose-800/90 pt-1">
                  • سيتم حجز البيانات بالسلة لمدة 30 يوماً مع إمكانية استعادتها بضغطة زر في أي وقت.
                </p>
              </div>
            </div>

            <div className="space-y-2 text-xs text-right">
              <label className="block text-slate-700 font-bold">سبب الحذف أو النقل (اختياري):</label>
              <input
                type="text"
                value={deleteReasonInput}
                onChange={(e) => setDeleteReasonInput(e.target.value)}
                placeholder="أدخل سبب الحذف..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:bg-white focus:border-rose-500 font-medium"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 space-x-reverse pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl font-bold text-xs transition-colors"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={confirmDeletePersonnel}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-md transition-colors flex items-center space-x-1.5 space-x-reverse"
              >
                <Trash2 className="w-4 h-4" />
                <span>تأكيد الحذف والنقل لسلة المحذوفات</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recycle Bin Modal */}
      <RecycleBinModal
        isOpen={showRecycleBinModal}
        onClose={() => setShowRecycleBinModal(false)}
        onRefreshData={loadData}
        currentUserName={`مستخدم (${currentAccount.name})`}
      />

      {/* Duplicate Alerts Modal for High Command */}
      <DuplicateAlertsModal
        isOpen={showDuplicateAlertsModal}
        onClose={() => setShowDuplicateAlertsModal(false)}
        alerts={alerts}
        onRefreshData={loadData}
      />

      {/* Excel Batch Import Modal */}
      <ExcelImportModal
        isOpen={showExcelModal}
        onClose={() => setShowExcelModal(false)}
        importType={excelImportType}
        onPersonnelImported={(importedRecords) => {
          const currentList = StorageService.getPersonnel();
          const updatedList = [...currentList];

          importedRecords.forEach((imported) => {
            const index = updatedList.findIndex((p) => p.militaryId === imported.militaryId);
            if (index >= 0) {
              updatedList[index] = { ...updatedList[index], ...imported };
            } else {
              updatedList.push(imported);
            }
          });

          StorageService.savePersonnel(updatedList);
          loadData();
          setShowExcelModal(false);
        }}
      />

      {/* PWA Home Screen Installation Modal */}
      <PWAInstallModal
        isOpen={showPwaModal}
        onClose={() => setShowPwaModal(false)}
      />

      {/* Personnel Replacement (استبدال فرد فرار/متغيب) Modal */}
      <PersonnelReplacementModal
        isOpen={showReplacementModal}
        onClose={() => setShowReplacementModal(false)}
        personnel={personnel}
        onRefresh={loadData}
        currentRole={currentRole}
        preSelectedMilitaryId={preSelectedReplacementId}
      />

      {/* Global Face Verification Modal */}
      <FaceVerificationModal
        isOpen={showGlobalFaceModal}
        onClose={() => setShowGlobalFaceModal(false)}
        onVerified={handleGlobalFaceVerified}
        targetPersonnel={selectedPerson}
        allPersonnel={visiblePersonnel}
        taskTitle="مسح الوجه المباشر والتحقق الحيوي من الهوية"
        sensitiveTaskType="identity_check"
      />

      {/* Multi-Tenant Platform Management Modal */}
      <TenantManagementModal
        isOpen={showTenantModal}
        onClose={() => setShowTenantModal(false)}
        currentRole={currentRole}
        onTenantSwitched={(tenant) => {
          setActiveTenant(tenant);
          loadData();
        }}
      />

      {/* Login & Tenant User Authentication Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        currentUser={currentUser}
        activeTenant={activeTenant}
        onLoginSuccess={(user, tenant) => {
          setCurrentUser(user);
          setActiveTenant(tenant);
          setShowLoginModal(false);
          loadData();
        }}
      />

      {/* Super Admin Tenant Users & Permission Management Modal */}
      <TenantUsersManagementModal
        isOpen={showTenantUsersModal}
        onClose={() => setShowTenantUsersModal(false)}
        activeTenant={activeTenant}
        currentUser={currentUser}
      />

      {/* Dedicated Super Admin Settings Page/Modal */}
      <SuperAdminSettingsModal
        isOpen={showSuperAdminSettingsModal}
        onClose={() => setShowSuperAdminSettingsModal(false)}
        activeTenant={activeTenant}
        currentUser={currentUser}
        onRefreshData={loadData}
      />

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 py-4 px-4 text-center text-xs text-slate-500 font-medium">
        نظام إدارة القوة البشرية العسكري © 2026 - جميع الحقوق محفوظة للقيادة المركزية • الربط اللحظي المباشر بين الألوية الثمانية ولواء القيادة
      </footer>

    </div>
  );
}
