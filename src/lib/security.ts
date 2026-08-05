import { UserAccount } from '../types';
import { StorageService } from './storage';

export function isAccessTimeAllowed(account: UserAccount): { allowed: boolean; reason?: string } {
  const settings = account.securitySettings?.accessHours;
  if (!settings || !settings.enabled) {
    return { allowed: true };
  }

  const now = new Date();
  const dayNamesEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayNamesAr = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

  const currentDayEn = dayNamesEn[now.getDay()];
  const currentDayAr = dayNamesAr[now.getDay()];

  if (settings.allowedDays && settings.allowedDays.length > 0) {
    const isDayAllowed = settings.allowedDays.some(
      (d) => d === currentDayEn || d === currentDayAr
    );
    if (!isDayAllowed) {
      return {
        allowed: false,
        reason: `اليوم الحالي (${currentDayAr}) غير مدرج ضمن أيام الدخول المسموحة بهذا الحساب.`
      };
    }
  }

  if (settings.startTime && settings.endTime) {
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const [startH, startM] = settings.startTime.split(':').map(Number);
    const [endH, endM] = settings.endTime.split(':').map(Number);

    const startMinutes = (startH || 0) * 60 + (startM || 0);
    const endMinutes = (endH || 0) * 60 + (endM || 0);

    if (currentMinutes < startMinutes || currentMinutes > endMinutes) {
      return {
        allowed: false,
        reason: `الوقت الحالي (${now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}) خارج نطاق ساعات العمل المصرح بها (${settings.startTime} - ${settings.endTime}).`
      };
    }
  }

  return { allowed: true };
}

export function getDeviceId(): string {
  if (typeof window === 'undefined') return 'unknown_device';
  let devId = localStorage.getItem('military_device_signature_v1');
  if (!devId) {
    devId = 'dev_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now();
    localStorage.setItem('military_device_signature_v1', devId);
  }
  return devId;
}

export function isDevice2FAVerified(account: UserAccount): boolean {
  if (typeof window === 'undefined') return true;
  const devId = getDeviceId();

  // Check local session
  const localVerified = localStorage.getItem(`military_2fa_verified_${account.id}`);
  if (localVerified === devId) return true;

  // Check stored trusted devices in account
  const trustedList = account.securitySettings?.twoFactor?.trustedDevices || [];
  if (trustedList.includes(devId)) {
    localStorage.setItem(`military_2fa_verified_${account.id}`, devId);
    return true;
  }

  return false;
}

export function markDeviceAs2FAVerified(account: UserAccount): void {
  if (typeof window === 'undefined') return;
  const devId = getDeviceId();
  localStorage.setItem(`military_2fa_verified_${account.id}`, devId);

  const currentSec = account.securitySettings || {};
  const current2FA = currentSec.twoFactor || { enabled: true, requireOnUnknownDevice: true };
  const trustedList = current2FA.trustedDevices || [];

  if (!trustedList.includes(devId)) {
    StorageService.updateAccount(account.id, {
      securitySettings: {
        ...currentSec,
        twoFactor: {
          ...current2FA,
          trustedDevices: [...trustedList, devId]
        }
      }
    });
  }
}
