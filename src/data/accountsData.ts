import { UserAccount, BrigadeAccountType, PersonnelRecord } from '../types';

export const getAccountIdForUnit = (unit?: string, fallbackAccountId: string = 'hq'): string => {
  if (!unit) return fallbackAccountId;
  const u = unit.trim();

  // Brigade 1
  if (u.includes('الأول') || u.includes('الاول') || u.includes('brigade1') || u.includes('اللواء 1') || u.includes('كتيبة 1')) {
    return 'brigade1';
  }
  // Brigade 2
  if (u.includes('الثاني') || u.includes('brigade2') || u.includes('اللواء 2') || u.includes('كتيبة 2')) {
    return 'brigade2';
  }
  // Brigade 3 (excluding HQ "الفرقة الثالثة")
  if ((u.includes('الثالث') || u.includes('brigade3') || u.includes('اللواء 3') || u.includes('كتيبة 3')) && !u.includes('الفرقة')) {
    return 'brigade3';
  }
  // Brigade 4
  if (u.includes('الرابع') || u.includes('brigade4') || u.includes('اللواء 4') || u.includes('كتيبة 4')) {
    return 'brigade4';
  }
  // Brigade 5
  if (u.includes('الخامس') || u.includes('brigade5') || u.includes('اللواء 5') || u.includes('كتيبة 5')) {
    return 'brigade5';
  }
  // Brigade 6
  if (u.includes('السادس') || u.includes('brigade6') || u.includes('اللواء 6') || u.includes('كتيبة 6')) {
    return 'brigade6';
  }
  // Brigade 7
  if (u.includes('السابع') || u.includes('brigade7') || u.includes('اللواء 7') || u.includes('كتيبة 7')) {
    return 'brigade7';
  }
  // Brigade 8
  if (u.includes('الثامن') || u.includes('brigade8') || u.includes('اللواء 8') || u.includes('كتيبة 8')) {
    return 'brigade8';
  }

  const isHqUnit =
    u.includes('القيادة') ||
    u.includes('الفرقة الثالثة') ||
    u.includes('الفرقة') ||
    u.includes('الاستخبارات') ||
    u.includes('الإشارة') ||
    u.includes('الشرطة العسكرية') ||
    u.includes('التموين والنقل') ||
    u.includes('المهندسين') ||
    u.includes('الطيران');

  if (isHqUnit) return 'hq';

  return fallbackAccountId;
};

export const isPersonnelInAccount = (p: PersonnelRecord, account: UserAccount): boolean => {
  // 1. If viewing from Main Command (HQ / قيادة الفرقة الثالثة), HQ can see EVERYTHING
  // (its own data + all data entered by sub-accounts)
  if (account.isMainCommand) {
    return true;
  }

  // 2. Resolve the target account for this personnel record based on unit and createdByAccountId
  const targetAccountId = getAccountIdForUnit(p.unit, p.createdByAccountId || 'hq');

  // If target account is a specific brigade (e.g., brigade1, brigade2), check matching
  if (targetAccountId && targetAccountId !== 'hq') {
    return targetAccountId === account.id;
  }

  // 3. If target account is 'hq', sub-accounts MUST NOT see HQ personnel
  if (targetAccountId === 'hq') {
    return false;
  }

  // 4. Fallback matching with unitFilter
  const pUnit = (p.unit || '').trim();
  if (!pUnit) return false;
  const filter = account.unitFilter.trim();
  return pUnit === filter || pUnit.startsWith(filter) || pUnit.includes(filter);
};

export const BRIGADE_ACCOUNTS: UserAccount[] = [
  {
    id: 'hq',
    name: 'قيادة الفرقة الثالثة',
    shortCode: 'hq',
    description: 'الحساب الرئيسي - قوات الطوارئ اليمنية (الفرقة الثالثة)',
    isMainCommand: true,
    unitFilter: 'الكل',
    color: 'bg-amber-600 border-amber-500 text-white',
    badge: '⚡ قوات الطوارئ اليمنية - الفرقة الثالثة',
    status: 'نشط',
    lastSeen: 'متصل الآن (جلسة نشطة)',
    connectedDevicesCount: 5,
    devicesBreakdown: { mobileCount: 2, desktopCount: 3, lastDeviceType: 'متصفح كمبيوتر (القيادة)' }
  },
  {
    id: 'brigade1',
    name: 'اللواء الأول',
    shortCode: 'b1',
    description: 'حساب مستخدم اللواء الأول - مخصص لإدارة القوة البشرية والمهام الخاصة باللواء الأول',
    isMainCommand: false,
    unitFilter: 'اللواء الأول',
    color: 'bg-emerald-600 border-emerald-500 text-white',
    badge: '🛡️ اللواء الأول',
    status: 'نشط',
    lastSeen: 'منذ 4 دقائق',
    connectedDevicesCount: 3,
    devicesBreakdown: { mobileCount: 2, desktopCount: 1, lastDeviceType: 'هاتف ذكي (واتساب)' }
  },
  {
    id: 'brigade2',
    name: 'اللواء الثاني',
    shortCode: 'b2',
    description: 'حساب مستخدم اللواء الثاني - مخصص لإدارة القوة البشرية والمهام الخاصة باللواء الثاني',
    isMainCommand: false,
    unitFilter: 'اللواء الثاني',
    color: 'bg-blue-600 border-blue-500 text-white',
    badge: '🎖️ اللواء الثاني',
    status: 'نشط',
    lastSeen: 'منذ 12 دقيقة',
    connectedDevicesCount: 2,
    devicesBreakdown: { mobileCount: 1, desktopCount: 1, lastDeviceType: 'متصفح Chrome (Android)' }
  },
  {
    id: 'brigade3',
    name: 'اللواء الثالث',
    shortCode: 'b3',
    description: 'حساب مستخدم اللواء الثالث - مخصص لإدارة القوة البشرية والمهام الخاصة باللواء الثالث',
    isMainCommand: false,
    unitFilter: 'اللواء الثالث',
    color: 'bg-indigo-600 border-indigo-500 text-white',
    badge: '⚡ اللواء الثالث',
    status: 'نشط',
    lastSeen: 'منذ 25 دقيقة',
    connectedDevicesCount: 4,
    devicesBreakdown: { mobileCount: 3, desktopCount: 1, lastDeviceType: 'هاتف iPhone (iOS)' }
  },
  {
    id: 'brigade4',
    name: 'اللواء الرابع',
    shortCode: 'b4',
    description: 'حساب مستخدم اللواء الرابع - مخصص لإدارة القوة البشرية والمهام الخاصة باللواء الرابع',
    isMainCommand: false,
    unitFilter: 'اللواء الرابع',
    color: 'bg-purple-600 border-purple-500 text-white',
    badge: '🦅 اللواء الرابع',
    status: 'غير نشط',
    lastSeen: 'منذ يومين (08:30 ص)',
    connectedDevicesCount: 0,
    devicesBreakdown: { mobileCount: 0, desktopCount: 0, lastDeviceType: 'لا توجد أجهزة متصلة' }
  },
  {
    id: 'brigade5',
    name: 'اللواء الخامس',
    shortCode: 'b5',
    description: 'حساب مستخدم اللواء الخامس - مخصص لإدارة القوة البشرية والمهام الخاصة باللواء الخامس',
    isMainCommand: false,
    unitFilter: 'اللواء الخامس',
    color: 'bg-rose-600 border-rose-500 text-white',
    badge: '⚔️ اللواء الخامس',
    status: 'نشط',
    lastSeen: 'منذ ساعتين',
    connectedDevicesCount: 1,
    devicesBreakdown: { mobileCount: 1, desktopCount: 0, lastDeviceType: 'هاتف ذكي (واتساب)' }
  },
  {
    id: 'brigade6',
    name: 'اللواء السادس',
    shortCode: 'b6',
    description: 'حساب مستخدم اللواء السادس - مخصص لإدارة القوة البشرية والمهام الخاصة باللواء السادس',
    isMainCommand: false,
    unitFilter: 'اللواء السادس',
    color: 'bg-cyan-600 border-cyan-500 text-white',
    badge: '🎯 اللواء السادس',
    status: 'غير نشط',
    lastSeen: 'منذ 5 أيام',
    connectedDevicesCount: 0,
    devicesBreakdown: { mobileCount: 0, desktopCount: 0, lastDeviceType: 'لا توجد أجهزة متصلة' }
  },
  {
    id: 'brigade7',
    name: 'اللواء السابع',
    shortCode: 'b7',
    description: 'حساب مستخدم اللواء السابع - مخصص لإدارة القوة البشرية والمهام الخاصة باللواء السابع',
    isMainCommand: false,
    unitFilter: 'اللواء السابع',
    color: 'bg-teal-600 border-teal-500 text-white',
    badge: '🏹 اللواء السابع',
    status: 'نشط',
    lastSeen: 'منذ 15 دقيقة',
    connectedDevicesCount: 2,
    devicesBreakdown: { mobileCount: 1, desktopCount: 1, lastDeviceType: 'متصفح Safari (iOS)' }
  },
  {
    id: 'brigade8',
    name: 'اللواء الثامن',
    shortCode: 'b8',
    description: 'حساب مستخدم اللواء الثامن - مخصص لإدارة القوة البشرية والمهام الخاصة باللواء الثامن',
    isMainCommand: false,
    unitFilter: 'اللواء الثامن',
    color: 'bg-slate-700 border-slate-600 text-white',
    badge: '🚩 اللواء الثامن',
    status: 'غير نشط',
    lastSeen: 'منذ أسبوع',
    connectedDevicesCount: 0,
    devicesBreakdown: { mobileCount: 0, desktopCount: 0, lastDeviceType: 'لا توجد أجهزة متصلة' }
  }
];

export const getAllAccounts = (): UserAccount[] => {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('military_accounts_config_v2');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return BRIGADE_ACCOUNTS.map((defaultAcc) => {
            const found = parsed.find((a: UserAccount) => a.id === defaultAcc.id);
            return found ? { ...defaultAcc, ...found } : defaultAcc;
          });
        }
      }
    } catch (e) {
      console.error('Error reading stored accounts config:', e);
    }
  }
  return BRIGADE_ACCOUNTS;
};

export const getAccountByCode = (code: string): UserAccount => {
  const accounts = getAllAccounts();
  if (!code) return accounts[0];
  let raw = code.trim();
  try {
    raw = decodeURIComponent(raw).trim();
  } catch (e) {
    // ignore decode error
  }
  const normalized = raw.toLowerCase();

  // 1. Check customAccessKey first (exact match)
  const keyMatch = accounts.find(
    (a) => a.customAccessKey && a.customAccessKey.toLowerCase() === normalized
  );
  if (keyMatch) return keyMatch;

  // 2. Match standard identifiers
  const match = accounts.find((a) => {
    return (
      a.id.toLowerCase() === normalized ||
      a.shortCode.toLowerCase() === normalized ||
      a.name.toLowerCase() === normalized ||
      a.unitFilter.toLowerCase() === normalized ||
      a.badge.toLowerCase().includes(normalized) ||
      normalized === `b${a.shortCode.replace(/\D/g, '')}` ||
      normalized === a.shortCode.replace(/\D/g, '')
    );
  });

  if (match) {
    // If account has a custom key generated, and user is accessing via old default shortCode:
    if (match.customAccessKey && match.customAccessKey.toLowerCase() !== normalized) {
      return {
        ...match,
        isBlocked: true,
        status: 'محظور',
        blockedReason: 'تم تغيير رابط هذا الحساب وتوليد رابط أمني جديد. يُرجى طلب الرابط الجديد من القيادة العامة.'
      };
    }
    return match;
  }

  return accounts[0]; // default to hq
};

export const parseAccountFromUrl = (): UserAccount | null => {
  if (typeof window === 'undefined') return null;

  try {
    // 1. Search params from search
    const searchParams = new URLSearchParams(window.location.search);
    let accParam =
      searchParams.get('account') ||
      searchParams.get('user') ||
      searchParams.get('brigade') ||
      searchParams.get('acc') ||
      searchParams.get('code');

    // 2. Search params from hash if not found
    if (!accParam && window.location.hash) {
      const hash = window.location.hash;
      const qIndex = hash.indexOf('?');
      if (qIndex !== -1) {
        const hashSearch = new URLSearchParams(hash.substring(qIndex));
        accParam =
          hashSearch.get('account') ||
          hashSearch.get('user') ||
          hashSearch.get('brigade') ||
          hashSearch.get('acc') ||
          hashSearch.get('code');
      } else {
        const cleanHash = hash.replace(/^#\/?/, '');
        if (cleanHash.includes('account=')) {
          accParam = cleanHash.split('account=')[1]?.split('&')[0];
        } else if (cleanHash && !cleanHash.includes('/')) {
          accParam = cleanHash;
        }
      }
    }

    if (accParam) {
      return getAccountByCode(accParam);
    }
  } catch (err) {
    console.error('Error parsing account parameter from URL:', err);
  }

  return null;
};

export const generateAccountUrl = (account: UserAccount): string => {
  if (typeof window === 'undefined') return '';
  let origin = window.location.origin;
  const pathname = window.location.pathname;

  // Convert private development URL (ais-dev-...) to public shared URL (ais-pre-...)
  // so external users can open the app without getting Cloud Run 403 / permission denied errors
  if (origin.includes('ais-dev-')) {
    origin = origin.replace('ais-dev-', 'ais-pre-');
  }

  const codeOrKey = account.customAccessKey || account.shortCode;
  return `${origin}${pathname}?account=${encodeURIComponent(codeOrKey)}`;
};

export const generateWhatsAppShareUrl = (account: UserAccount): string => {
  const url = generateAccountUrl(account);
  const text = `مرحباً، هذا هو رابط الدخول المباشر المعتمد الخاص بحساب (${account.name}) على المنظومة العسكرية:\n\n${url}\n\nيمكنك فتح الرابط مباشرة في المتصفح للبدء في الاستخدام والعمل على الحساب.`;
  return `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (err) {
    console.warn('navigator.clipboard.writeText failed, trying execCommand fallback:', err);
  }

  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '-9999px';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('execCommand copy fallback failed:', err);
    return false;
  }
};

