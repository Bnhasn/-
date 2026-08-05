import React, { useState, useEffect } from 'react';
import { generateAccountUrl, generateWhatsAppShareUrl, copyToClipboard } from '../data/accountsData';
import { UserAccount, PersonnelRecord } from '../types';
import { isPersonnelInAccount } from '../data/accountsData';
import { StorageService } from '../lib/storage';
import {
  Key,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Lock,
  Users,
  Radio,
  Sparkles,
  MessageCircle,
  AlertTriangle,
  Smartphone,
  Clock,
  Activity,
  ShieldAlert,
  Laptop,
  Ban,
  RefreshCw,
  AlertOctagon,
  CheckCircle2,
  Shield,
  Search,
  ArrowLeftRight,
  Edit3,
  Compass,
  CheckSquare
} from 'lucide-react';

interface AccountsManagementModalProps {
  currentAccount: UserAccount;
  onSelectAccount?: (account: UserAccount) => void;
  onClose: () => void;
  personnel: PersonnelRecord[];
}

export const AccountsManagementModal: React.FC<AccountsManagementModalProps> = ({
  currentAccount,
  onSelectAccount,
  onClose,
  personnel
}) => {
  const [accounts, setAccounts] = useState<UserAccount[]>(() => StorageService.getAccounts());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'blocked'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected Account for the top Quick Link Selector
  const [selectedAccountId, setSelectedAccountId] = useState<string>(currentAccount.id);

  // Map of inline typed custom keys per account id
  const [inlineCustomKeys, setInlineCustomKeys] = useState<Record<string, string>>({});

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Block Modal State
  const [blockingAccount, setBlockingAccount] = useState<UserAccount | null>(null);
  const [blockReasonInput, setBlockReasonInput] = useState<string>('مخالفة ضوابط الوصول الأمني');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const reloadAccounts = () => {
    const updated = StorageService.getAccounts();
    setAccounts(updated);
  };

  useEffect(() => {
    const unsub = StorageService.subscribeToChanges(() => {
      reloadAccounts();
    });
    return () => unsub();
  }, []);

  const handleCopyLink = async (account: UserAccount) => {
    if (account.isBlocked || account.status === 'محظور') {
      alert('⚠️ هذا الحساب محظور حالياً، والرابط الخاص به معطل وغير صالح للدخول.');
      return;
    }
    const url = generateAccountUrl(account);
    const success = await copyToClipboard(url);
    if (success) {
      setCopiedId(account.id);
      setTimeout(() => setCopiedId(null), 3000);
      showToast(`📋 تم نسخ رابط حساب (${account.name}) بنجاح`);
    } else {
      window.prompt('انسخ رابط الحساب المعتمد أدناه:', url);
    }
  };

  // Open link in a separate standalone window/tab
  const handleOpenInSeparateWindow = (account: UserAccount) => {
    if (account.isBlocked || account.status === 'محظور') {
      alert('⚠️ هذا الحساب محظور حالياً، والرابط الخاص به معطل وغير صالح للدخول.');
      return;
    }
    const url = generateAccountUrl(account);
    window.open(url, '_blank', 'noopener,noreferrer');
    showToast(`↗️ تم فتح رابط (${account.name}) في نافذة منفصلة بنجاح.`);
  };

  // Switch to account directly in active app
  const handleSwitchToAccount = (account: UserAccount) => {
    if (account.isBlocked || account.status === 'محظور') {
      alert('⚠️ لا يمكن الانتقال لحساب محظور أمنياً.');
      return;
    }
    if (onSelectAccount) {
      onSelectAccount(account);
      showToast(`🚀 جاري الانتقال إلى شاشة حساب (${account.name})...`);
    }
  };

  // Block Account Action
  const confirmBlockAccount = () => {
    if (!blockingAccount) return;
    const updatedList = StorageService.updateAccount(blockingAccount.id, {
      status: 'محظور',
      isBlocked: true,
      blockedReason: blockReasonInput.trim() || 'حظر أمني إداري',
      connectedDevicesCount: 0,
      devicesBreakdown: { mobileCount: 0, desktopCount: 0, lastDeviceType: 'تم إنهاء كافة الجلسات بسبب الحظر' }
    });
    setAccounts(updatedList);
    showToast(`🛑 تم حظر حساب (${blockingAccount.name}) وإلغاء صلاحية الرابط بنجاح.`);
    setBlockingAccount(null);
  };

  // Unblock Account Action
  const handleUnblockAccount = (acc: UserAccount) => {
    const updatedList = StorageService.updateAccount(acc.id, {
      status: 'نشط',
      isBlocked: false,
      blockedReason: '',
      lastSeen: 'تم فك الحظر وتنشيط الحساب الان'
    });
    setAccounts(updatedList);
    showToast(`✅ تم فك الحظر عن حساب (${acc.name}) وإعادة تنشيطه بنجاح.`);
  };

  // Regenerate Link Action
  const handleAutoRegenerateLink = (acc: UserAccount) => {
    const randomKey = `${acc.shortCode}_sec_${Math.random().toString(36).substring(2, 8)}`;
    const updatedList = StorageService.updateAccount(acc.id, {
      customAccessKey: randomKey
    });
    setAccounts(updatedList);
    showToast(`🔄 تم تغيير رابط حساب (${acc.name}) وتوليد رمز أمني جديد. الرابط القديم أصبح ملغى فوراً.`);
  };

  // Save Custom Key for any account
  const handleSaveCustomKey = (acc: UserAccount, keyInput: string) => {
    const cleanKey = keyInput.trim().toLowerCase().replace(/\s+/g, '_');
    if (!cleanKey) {
      alert('يرجى كتابة رمز مخصص صالح (أرقام وحروف بدون مسافات).');
      return;
    }
    const updatedList = StorageService.updateAccount(acc.id, {
      customAccessKey: cleanKey
    });
    setAccounts(updatedList);
    showToast(`🔑 تم تعيين الرمز المخصص (${cleanKey}) لحساب (${acc.name}) بنجاح.`);
    setInlineCustomKeys(prev => ({ ...prev, [acc.id]: '' }));
  };

  // Reset Link to Default
  const handleResetLinkDefault = (acc: UserAccount) => {
    const updatedList = StorageService.updateAccount(acc.id, {
      customAccessKey: undefined
    });
    setAccounts(updatedList);
    showToast(`↩️ تم استعادة الرابط الافتراضي لحساب (${acc.name}).`);
  };

  // Reset Device Binding Lock
  const handleUnbindDevice = (acc: UserAccount) => {
    const updatedList = StorageService.unbindAccountDevice(acc.id);
    setAccounts(updatedList);
    showToast(`🔓 تم إلغاء تقييد الجهاز لحساب (${acc.name}). سيتم تقييده بأول جهاز جديد يفتح الرابط.`);
  };

  const totalConnectedDevices = accounts.reduce((sum, acc) => sum + (acc.isBlocked ? 0 : (acc.connectedDevicesCount || 0)), 0);
  const activeAccountsCount = accounts.filter(a => a.status === 'نشط' && !a.isBlocked).length;
  const inactiveAccountsCount = accounts.filter(a => a.status === 'غير نشط' && !a.isBlocked).length;
  const blockedAccountsCount = accounts.filter(a => a.status === 'محظور' || a.isBlocked).length;

  // Currently focused account in top selector
  const activeSelectedAccount = accounts.find(a => a.id === selectedAccountId) || accounts[0] || currentAccount;

  const filteredAccounts = accounts.filter(acc => {
    if (statusFilter === 'active' && (acc.isBlocked || acc.status !== 'نشط')) return false;
    if (statusFilter === 'inactive' && (acc.isBlocked || acc.status !== 'غير نشط')) return false;
    if (statusFilter === 'blocked' && !acc.isBlocked && acc.status !== 'محظور') return false;
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = acc.name.toLowerCase().includes(q);
      const matchCode = acc.shortCode.toLowerCase().includes(q);
      const matchUnit = acc.unitFilter.toLowerCase().includes(q);
      const matchKey = acc.customAccessKey?.toLowerCase().includes(q);
      return matchName || matchCode || matchUnit || matchKey;
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-6xl w-full shadow-2xl overflow-hidden my-6 font-['Cairo',sans-serif] relative">
        
        {/* Toast Alert Banner */}
        {toastMessage && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-slate-900 text-amber-300 border-2 border-amber-500 px-6 py-3 rounded-2xl shadow-2xl text-xs font-extrabold flex items-center space-x-2 space-x-reverse animate-bounce">
            <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Header */}
        <div className="bg-slate-950 text-white p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center shadow-lg text-white">
              <Key className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2 space-x-reverse flex-wrap gap-1">
                <h2 className="text-lg sm:text-xl font-extrabold text-amber-400 font-['Tajawal']">
                  إدارة وحرية اختيار روابط وحسابات الألوية والقيادة
                </h2>
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                  تحكم كامل بالروابط + فتح في نافذة منفصلة ↗️
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                تصفح واختيار أي رابط بحرية • فتح أي حساب بنقرة في نافذة منفصلة • تخصيص الروابط والأحرف • الحظر الأمني
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* System Metrics Overview Banner */}
        <div className="bg-slate-900 text-white p-4 border-b border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-800/80 border border-slate-700/60 p-3 rounded-2xl flex items-center justify-between">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Radio className="w-5 h-5 text-emerald-400 animate-pulse shrink-0" />
              <div>
                <div className="text-[10px] text-slate-400 font-bold">الحساب المعروض حالياً</div>
                <div className="font-extrabold text-amber-300 font-['Tajawal']">{currentAccount.name}</div>
              </div>
            </div>
            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${currentAccount.color}`}>
              نشط
            </span>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/60 p-3 rounded-2xl flex items-center justify-between">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Activity className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <div className="text-[10px] text-slate-400 font-bold">الحسابات النشطة</div>
                <div className="font-extrabold text-emerald-400 text-sm">{activeAccountsCount} من {accounts.length} حسابات</div>
              </div>
            </div>
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold px-2 py-0.5 rounded-md">
              %{Math.round((activeAccountsCount / (accounts.length || 1)) * 100)}
            </span>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/60 p-3 rounded-2xl flex items-center justify-between">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Smartphone className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <div className="text-[10px] text-slate-400 font-bold">الأجهزة المتصلة بالروابط</div>
                <div className="font-extrabold text-amber-400 text-sm">{totalConnectedDevices} جهاز نشط</div>
              </div>
            </div>
            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold px-2 py-0.5 rounded-md">
              موزعة
            </span>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/60 p-3 rounded-2xl flex items-center justify-between">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Ban className="w-5 h-5 text-rose-400 shrink-0" />
              <div>
                <div className="text-[10px] text-slate-400 font-bold">الحسابات المحظورة</div>
                <div className="font-extrabold text-rose-400 text-xs">{blockedAccountsCount} حسابات محظورة</div>
              </div>
            </div>
            <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold px-2 py-0.5 rounded-md">
              🔒 معطلة
            </span>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="p-4 sm:p-6 space-y-6">

          {/* FEATURE 1: DIRECT LINK SELECTOR & FREEDOM CUSTOMIZER BAR (منشئ وموجه الروابط الحرة) */}
          <div className="bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900 border-2 border-amber-500/60 rounded-3xl p-4 sm:p-5 text-white shadow-lg space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-amber-500/30 pb-3">
              <div className="flex items-center space-x-2.5 space-x-reverse">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-amber-300 font-['Tajawal'] flex items-center space-x-2 space-x-reverse">
                    <span>منصّة موجّه الروابط والاختيار الحر للألوية والقيادة</span>
                    <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/40">
                      حرية اختيار كامِلة
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    يمكنك تحديد أي لواء أو حساب، توليد أو كتابة رابط مخصص، وفتحه فوراً في نافذة تبويب منفصلة أو التبديل إليه مباشرة.
                  </p>
                </div>
              </div>

              {/* Account Dropdown Selector */}
              <div className="w-full md:w-72">
                <label className="text-[10px] font-bold text-amber-200 block mb-1">
                  اختر الحساب / اللواء المراد التعامل معه:
                </label>
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="w-full bg-slate-800 border-2 border-amber-400/80 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-hidden focus:border-amber-400 cursor-pointer shadow-sm"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id} className="bg-slate-900 text-white font-bold">
                      {acc.badge} — {acc.name} ({acc.status})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Details of Active Selected Account in Chooser */}
            {activeSelectedAccount && (
              <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 space-y-3">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <span className={`text-xs font-black px-3 py-1 rounded-xl shadow-xs ${activeSelectedAccount.color}`}>
                      {activeSelectedAccount.badge}
                    </span>
                    <div>
                      <h4 className="text-sm font-extrabold text-white flex items-center space-x-2 space-x-reverse">
                        <span>{activeSelectedAccount.name}</span>
                        {activeSelectedAccount.customAccessKey && (
                          <span className="text-[9px] bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded-md">
                            🔑 رابط مخصص
                          </span>
                        )}
                        {activeSelectedAccount.isBlocked && (
                          <span className="text-[9px] bg-rose-600 text-white font-bold px-2 py-0.5 rounded-md">
                            🛑 محظور
                          </span>
                        )}
                      </h4>
                      <p className="text-[11px] text-slate-400">{activeSelectedAccount.description}</p>
                    </div>
                  </div>

                  {/* Fast Action Buttons Bar */}
                  <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                    {onSelectAccount && !activeSelectedAccount.isBlocked && (
                      <button
                        type="button"
                        onClick={() => handleSwitchToAccount(activeSelectedAccount)}
                        className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold px-3.5 py-1.5 rounded-xl text-xs transition-all shadow-md flex items-center space-x-1.5 space-x-reverse cursor-pointer"
                        title="التبديل الفوري وعرض بيانات هذا الحساب في النظام"
                      >
                        <ArrowLeftRight className="w-4 h-4" />
                        <span>الانتقال وتصفّح الحساب 🚀</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleOpenInSeparateWindow(activeSelectedAccount)}
                      disabled={activeSelectedAccount.isBlocked}
                      className={`font-extrabold px-3.5 py-1.5 rounded-xl text-xs transition-all shadow-md flex items-center space-x-1.5 space-x-reverse cursor-pointer ${
                        activeSelectedAccount.isBlocked
                          ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-500 text-white'
                      }`}
                      title="فتح رابط هذا الحساب في نافذة متصفح منفصلة مستقلة"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>فتح في نافذة منفصلة ↗️</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopyLink(activeSelectedAccount)}
                      disabled={activeSelectedAccount.isBlocked}
                      className="bg-slate-700 hover:bg-slate-600 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition-all flex items-center space-x-1 space-x-reverse cursor-pointer"
                    >
                      {copiedId === activeSelectedAccount.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedId === activeSelectedAccount.id ? 'تم النسخ' : 'نسخ الرابط'}</span>
                    </button>

                    <a
                      href={generateWhatsAppShareUrl(activeSelectedAccount)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition-all flex items-center space-x-1 space-x-reverse shadow-xs"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>واتساب 💬</span>
                    </a>
                  </div>
                </div>

                {/* Live Link Field & Custom Key Input */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-2 pt-2 border-t border-slate-700/60">
                  <div className="md:col-span-7 space-y-1">
                    <label className="text-[10px] font-bold text-slate-300 block">
                      معاينة رابط الوصول المعتمد الحالي:
                    </label>
                    <div className="flex items-center bg-slate-900 border border-slate-700 rounded-xl p-1.5">
                      <input
                        type="text"
                        readOnly
                        value={activeSelectedAccount.isBlocked ? '[الرابط محظور ومعطل]' : generateAccountUrl(activeSelectedAccount)}
                        onClick={(e) => (e.target as HTMLInputElement).select()}
                        className="w-full bg-transparent text-amber-300 font-mono text-xs px-2 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-5 space-y-1">
                    <label className="text-[10px] font-bold text-slate-300 block">
                      كتابة وتخصيص رابط حر جديد للحساب (Custom Slug):
                    </label>
                    <div className="flex items-center space-x-1 space-x-reverse">
                      <input
                        type="text"
                        placeholder="مثال: brigade_105_hq"
                        value={inlineCustomKeys[activeSelectedAccount.id] || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setInlineCustomKeys(prev => ({ ...prev, [activeSelectedAccount.id]: val }));
                        }}
                        className="w-full bg-slate-900 border border-amber-500/50 rounded-xl px-2.5 py-1.5 text-xs text-white placeholder-slate-500 font-mono focus:outline-hidden focus:border-amber-400"
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveCustomKey(activeSelectedAccount, inlineCustomKeys[activeSelectedAccount.id] || '')}
                        className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold px-3 py-1.5 rounded-xl text-xs shrink-0 cursor-pointer shadow-xs"
                      >
                        حفظ الرمز 🔑
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Search Bar & Filter Controls */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            {/* Search Input Box */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="البحث بالاسم، اسم اللواء، أو كود الرابط..."
                className="w-full bg-white border border-slate-300 rounded-xl pr-9 pl-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
              <span className="text-xs font-bold text-slate-700 ml-1">التصفية:</span>
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                الكل ({accounts.length})
              </button>
              <button
                onClick={() => setStatusFilter('active')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'active'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white text-emerald-800 border border-emerald-200 hover:bg-emerald-50'
                }`}
              >
                🟢 النشطة ({activeAccountsCount})
              </button>
              <button
                onClick={() => setStatusFilter('inactive')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'inactive'
                    ? 'bg-slate-700 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                ⚪ غير النشطة ({inactiveAccountsCount})
              </button>
              <button
                onClick={() => setStatusFilter('blocked')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'blocked'
                    ? 'bg-rose-700 text-white shadow-xs'
                    : 'bg-white text-rose-700 border border-rose-200 hover:bg-rose-50'
                }`}
              >
                🛑 المحظورة ({blockedAccountsCount})
              </button>
            </div>
          </div>

          {/* Accounts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAccounts.map((acc) => {
              const isSelected = acc.id === currentAccount.id;
              const accountPersonnelCount = personnel.filter((p) => isPersonnelInAccount(p, acc)).length;
              const directUrl = generateAccountUrl(acc);
              const whatsappShareUrl = generateWhatsAppShareUrl(acc);
              const isBlocked = acc.isBlocked || acc.status === 'محظور';
              const isActive = acc.status === 'نشط' && !isBlocked;
              const hasCustomKey = !!acc.customAccessKey;

              return (
                <div
                  key={acc.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                    isBlocked
                      ? 'bg-rose-50/40 border-rose-300 ring-1 ring-rose-200 shadow-xs'
                      : isSelected
                      ? 'bg-amber-50/50 border-amber-500 ring-2 ring-amber-400 shadow-md'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header line */}
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${acc.color}`}>
                        {acc.badge}
                      </span>

                      {/* Account Status Badge */}
                      <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border flex items-center space-x-1 space-x-reverse ${
                        isBlocked
                          ? 'bg-rose-100 text-rose-900 border-rose-300'
                          : isActive
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                          : 'bg-slate-100 text-slate-600 border-slate-300'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${
                          isBlocked ? 'bg-rose-600' : isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                        }`} />
                        <span>حالة الحساب: {acc.status}</span>
                      </span>
                    </div>

                    {/* Account Name & Description */}
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900 font-['Tajawal'] flex items-center justify-between">
                        <span>{acc.name}</span>
                        {hasCustomKey && (
                          <span className="text-[9px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md border border-amber-300">
                            🔑 رابط مخصص
                          </span>
                        )}
                      </h3>
                      <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                        {acc.description}
                      </p>
                    </div>

                    {/* Blocked Warning Banner if Blocked */}
                    {isBlocked && (
                      <div className="bg-rose-100/80 border border-rose-300 p-2.5 rounded-xl text-xs space-y-1 text-rose-950 font-bold">
                        <div className="flex items-center space-x-1.5 space-x-reverse text-rose-800 font-extrabold">
                          <AlertOctagon className="w-4 h-4 text-rose-700 shrink-0" />
                          <span>الحساب محظور حالياً من الخدمة</span>
                        </div>
                        <p className="text-[10px] text-rose-900/90 font-medium">
                          سبب الحظر: {acc.blockedReason || 'تم إيقاف صلاحية هذا الحساب بقرار أمني'}
                        </p>
                      </div>
                    )}

                    {/* Last Seen & Devices Status Box */}
                    <div className="space-y-2 pt-1 border-t border-slate-100 text-xs">
                      {/* Last Seen */}
                      <div className="flex items-center justify-between bg-slate-50 border border-slate-200 p-2 rounded-xl text-[11px]">
                        <span className="flex items-center space-x-1.5 space-x-reverse text-slate-600 font-bold">
                          <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>آخر ظهور:</span>
                        </span>
                        <span className="font-extrabold text-slate-900 font-mono">
                          {isBlocked ? 'محظور (معطل)' : acc.lastSeen}
                        </span>
                      </div>

                      {/* Connected Devices Count per Link */}
                      <div className={`p-2.5 rounded-xl space-y-1.5 border ${
                        isBlocked ? 'bg-slate-100 border-slate-200' : 'bg-amber-50/70 border-amber-200/80'
                      }`}>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="flex items-center space-x-1.5 space-x-reverse font-extrabold text-slate-900">
                            <Smartphone className="w-4 h-4 text-amber-700 shrink-0" />
                            <span>الأجهزة المسجلة على الرابط:</span>
                          </span>
                          <span className={`font-mono font-bold text-[10px] px-2 py-0.5 rounded-md shadow-xs ${
                            isBlocked ? 'bg-slate-400 text-white' : 'bg-amber-600 text-white'
                          }`}>
                            {isBlocked ? 0 : acc.connectedDevicesCount} أجهزة
                          </span>
                        </div>
                        
                        {!isBlocked && acc.devicesBreakdown && (
                          <div className="text-[10px] text-amber-900/90 font-medium flex flex-wrap items-center justify-between pt-1 border-t border-amber-200/50 gap-1">
                            <span className="flex items-center space-x-1 space-x-reverse">
                              <Laptop className="w-3 h-3 text-amber-800 inline ml-1" />
                              <span>كمبيوتر: <strong>{acc.devicesBreakdown.desktopCount}</strong> • جوال: <strong>{acc.devicesBreakdown.mobileCount}</strong></span>
                            </span>
                            <span className="text-[9px] text-slate-500 font-mono bg-white/70 px-1.5 py-0.5 rounded">
                              {acc.devicesBreakdown.lastDeviceType}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Device Binding Security Lock Status Box */}
                      {!acc.isMainCommand && (
                        <div className={`p-2.5 rounded-xl space-y-1.5 border ${
                          acc.boundDeviceId
                            ? 'bg-emerald-50/90 border-emerald-200 text-emerald-950'
                            : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}>
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="flex items-center space-x-1.5 space-x-reverse font-extrabold text-slate-900">
                              <Shield className="w-4 h-4 text-emerald-700 shrink-0" />
                              <span>حماية وقتل الروابط الخارجية:</span>
                            </span>
                            {acc.boundDeviceId ? (
                              <span className="bg-emerald-600 text-white font-bold text-[10px] px-2 py-0.5 rounded-md flex items-center space-x-1 space-x-reverse shadow-xs">
                                <span>🔒 مقيد بجهاز محدد</span>
                              </span>
                            ) : (
                              <span className="bg-amber-500/20 text-amber-800 border border-amber-300 font-bold text-[10px] px-2 py-0.5 rounded-md">
                                📱 جاهز للتقييد بالفتح الأول
                              </span>
                            )}
                          </div>

                          <div className="text-[10px] flex flex-wrap items-center justify-between pt-1 border-t border-emerald-200/60 gap-1">
                            <span className="font-semibold text-slate-800">
                              {acc.boundDeviceId
                                ? `الجهاز المعتمد: ${acc.boundDeviceName || 'جهاز مصرح به'}`
                                : 'سيتم تقييد الرابط تلقائياً بأول جهاز يفتحه دون السماح لأي جهاز آخر.'}
                            </span>
                            {acc.boundDeviceId && (
                              <button
                                type="button"
                                onClick={() => handleUnbindDevice(acc)}
                                className="text-[10px] bg-rose-600 hover:bg-rose-700 text-white font-bold px-2 py-1 rounded-lg transition-all cursor-pointer shadow-xs flex items-center space-x-1 space-x-reverse shrink-0"
                                title="إعادة ضبط تقييد الجهاز والسماح بجهاز جديد"
                              >
                                <RefreshCw className="w-3 h-3 ml-1 inline" />
                                <span>إعادة ضبط تقييد الجهاز</span>
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Direct Copyable Link Box */}
                    <div className="pt-1 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-slate-600 block">
                          الرابط المعتمد الحالي:
                        </label>
                        {hasCustomKey && (
                          <button
                            onClick={() => handleResetLinkDefault(acc)}
                            className="text-[9px] text-amber-800 font-bold hover:underline cursor-pointer"
                          >
                            إعادة الرابط الافتراضي
                          </button>
                        )}
                      </div>
                      <div className={`flex items-center space-x-1 space-x-reverse p-1.5 rounded-xl border ${
                        isBlocked ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200'
                      }`}>
                        <input
                          type="text"
                          readOnly
                          value={isBlocked ? '[الرابط معطل ومحظور حالياً]' : directUrl}
                          onClick={(e) => !isBlocked && (e.target as HTMLInputElement).select()}
                          className={`w-full bg-transparent text-[11px] font-mono focus:outline-hidden px-1 ${
                            isBlocked ? 'text-rose-700 font-bold' : 'text-slate-700'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => handleCopyLink(acc)}
                          disabled={isBlocked}
                          className={`p-1 rounded-lg transition-all shrink-0 text-[10px] font-bold flex items-center space-x-1 space-x-reverse px-2 ${
                            isBlocked
                              ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                              : 'bg-amber-500 hover:bg-amber-600 text-white cursor-pointer'
                          }`}
                          title="نسخ الرابط"
                        >
                          {copiedId === acc.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedId === acc.id ? 'تم النسخ' : 'نسخ'}</span>
                        </button>
                      </div>

                      {/* Inline Custom Key Quick Editor */}
                      {!isBlocked && (
                        <div className="flex items-center space-x-1 space-x-reverse pt-1">
                          <input
                            type="text"
                            placeholder="رمز مخصص (مثل: l105)"
                            value={inlineCustomKeys[acc.id] || ''}
                            onChange={(e) => {
                              const v = e.target.value;
                              setInlineCustomKeys(prev => ({ ...prev, [acc.id]: v }));
                            }}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-[11px] font-mono text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-amber-500"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveCustomKey(acc, inlineCustomKeys[acc.id] || '')}
                            className="bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg shrink-0 cursor-pointer"
                            title="حفظ رمز مخصص لهذا اللواء"
                          >
                            تخصيص 🔑
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Standalone Action Buttons: Open in Separate Window & Switch Account */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleOpenInSeparateWindow(acc)}
                        disabled={isBlocked}
                        className={`flex items-center justify-center space-x-1 space-x-reverse font-extrabold py-2 px-2 rounded-xl text-[11px] transition-all shadow-xs cursor-pointer ${
                          isBlocked
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                        title="فتح رابط هذا الحساب في نافذة متصفح منفصلة"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>فتح في نافذة منفصلة ↗️</span>
                      </button>

                      {onSelectAccount && !isBlocked ? (
                        <button
                          type="button"
                          onClick={() => handleSwitchToAccount(acc)}
                          className="flex items-center justify-center space-x-1 space-x-reverse bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-2 px-2 rounded-xl text-[11px] transition-all shadow-xs cursor-pointer"
                          title="الانتقال الفوري إلى بيانات وتفاصيل هذا الحساب"
                        >
                          <ArrowLeftRight className="w-3.5 h-3.5" />
                          <span>تصفّح الحساب 🚀</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleCopyLink(acc)}
                          disabled={isBlocked}
                          className="flex items-center justify-center space-x-1 space-x-reverse bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold py-2 px-2 rounded-xl text-[11px] transition-all border border-amber-300 cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5 text-amber-700" />
                          <span>نسخ الرابط</span>
                        </button>
                      )}
                    </div>

                    {/* Personnel Count Stats */}
                    <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600 font-medium">
                      <span className="flex items-center space-x-1 space-x-reverse">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>منسوبي الحساب: <strong>{accountPersonnelCount} فرد</strong></span>
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons: Block/Unblock & Change Link */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    {/* Share WhatsApp */}
                    {!isBlocked ? (
                      <a
                        href={whatsappShareUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center space-x-1 space-x-reverse bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-1.5 px-2 rounded-xl text-[11px] transition-all shadow-xs w-full"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-white" />
                        <span>إرسال الرابط عبر واتساب 💬</span>
                      </a>
                    ) : (
                      <div className="bg-rose-100 text-rose-800 text-[10px] font-bold p-2 rounded-xl text-center border border-rose-300">
                        الرابط معطل بسبب الحظر الأمني
                      </div>
                    )}

                    {/* Change / Regenerate Link Button & Block Toggle */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        onClick={() => handleAutoRegenerateLink(acc)}
                        className="flex items-center justify-center space-x-1 space-x-reverse bg-amber-600 hover:bg-amber-700 text-white font-extrabold py-2 px-2 rounded-xl text-[11px] transition-all shadow-xs cursor-pointer"
                        title="توليد رمز أمني جديد وإلغاء الرابط القديم"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>تغيير الرابط 🔄</span>
                      </button>

                      {/* Block / Unblock Toggle Button */}
                      {isBlocked ? (
                        <button
                          onClick={() => handleUnblockAccount(acc)}
                          className="flex items-center justify-center space-x-1 space-x-reverse bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-2 px-2 rounded-xl text-[11px] transition-all shadow-xs cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>فك الحظر ✅</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setBlockingAccount(acc);
                            setBlockReasonInput('مخالفة ضوابط الوصول الأمني');
                          }}
                          className="flex items-center justify-center space-x-1 space-x-reverse bg-rose-600 hover:bg-rose-700 text-white font-extrabold py-2 px-2 rounded-xl text-[11px] transition-all shadow-xs cursor-pointer"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          <span>حظر الحساب 🛑</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredAccounts.length === 0 && (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 space-y-2">
              <Search className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-xs font-bold text-slate-600">لا توجد حسابات أو ألوية تطابق البحث الحالي</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                }}
                className="text-xs text-amber-700 font-bold hover:underline"
              >
                إعادة ضبط خيارات البحث
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-900 text-slate-400 p-4 border-t border-slate-800 text-xs flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2 space-x-reverse">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>حرية كاملة لتصفح وتوليد وفتح روابط كافة الألوية والقيادة في نوافذ مستقلة</span>
          </div>
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-5 py-2 rounded-xl transition-all cursor-pointer"
          >
            إغلاق النافذة
          </button>
        </div>

      </div>

      {/* Block Account Confirmation Modal */}
      {blockingAccount && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-rose-300 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 font-['Cairo',sans-serif]">
            <div className="flex items-center space-x-3 space-x-reverse text-rose-700">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center shrink-0">
                <Ban className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-extrabold font-['Tajawal'] text-slate-900">
                  حظر حساب ({blockingAccount.name})
                </h3>
                <p className="text-xs text-rose-600 font-bold">
                  سيتم تعطيل الرابط وإلغاء صلاحية الوصول للحساب فوراً
                </p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <label className="font-bold text-slate-700 block">
                سبب الحظر (سيظهر للمستخدم عند محاولة استخدام الرابط):
              </label>
              <textarea
                value={blockReasonInput}
                onChange={(e) => setBlockReasonInput(e.target.value)}
                rows={3}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-hidden focus:border-rose-500 font-medium"
                placeholder="ادخل سبب الحظر الأمني..."
              />
            </div>

            <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl text-[11px] text-rose-900 font-bold space-y-1">
              <p>⚠️ عند تأكيد الحظر:</p>
              <ul className="list-disc list-inside text-[10px] space-y-0.5">
                <li>سيتم إيقاف دخول الرابط الخاص بهذا الحساب فوراً من أي متصفح.</li>
                <li>ستظهر شاشة الحظر الأمني لأي فرد يحاول استخدام الرابط.</li>
                <li>يمكنك إلغاء الحظر في أي وقت لاحقاً من هذه الشاشة.</li>
              </ul>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setBlockingAccount(null)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-4 py-2 rounded-xl text-xs cursor-pointer"
              >
                إلغاء الأمر
              </button>
              <button
                onClick={confirmBlockAccount}
                className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold px-5 py-2 rounded-xl text-xs shadow-md flex items-center space-x-1.5 space-x-reverse cursor-pointer"
              >
                <Ban className="w-4 h-4" />
                <span>تأكيد حظر الحساب وإلغاء الرابط</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
