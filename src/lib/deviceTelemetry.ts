export interface DeviceTelemetry {
  deviceId: string;
  deviceType: 'mobile' | 'desktop';
  deviceTypeName: string;
  browserName: string;
}

export const getDeviceTelemetry = (): DeviceTelemetry => {
  if (typeof window === 'undefined') {
    return {
      deviceId: 'server',
      deviceType: 'desktop',
      deviceTypeName: 'متصفح كمبيوتر',
      browserName: 'Unknown'
    };
  }

  // Persistent device ID per browser
  let deviceId = localStorage.getItem('military_device_id_v1');
  if (!deviceId) {
    deviceId = `dev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    localStorage.setItem('military_device_id_v1', deviceId);
  }

  const ua = navigator.userAgent || '';
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);

  let deviceTypeName = 'كمبيوتر شخصي';
  if (/iPhone/i.test(ua)) {
    deviceTypeName = 'هاتف آيفون (iOS)';
  } else if (/iPad/i.test(ua)) {
    deviceTypeName = 'آيباد (iPad)';
  } else if (/Android/i.test(ua)) {
    deviceTypeName = isMobile ? 'هاتف أندرويد (Android)' : 'تابلت أندرويد (Android)';
  } else if (/Windows/i.test(ua)) {
    deviceTypeName = 'كمبيوتر (Windows)';
  } else if (/Macintosh|Mac OS X/i.test(ua)) {
    deviceTypeName = 'كمبيوتر (Mac)';
  } else if (/Linux/i.test(ua)) {
    deviceTypeName = 'كمبيوتر (Linux)';
  }

  let browserName = 'Chrome';
  if (/Chrome/i.test(ua) && !/Edg/i.test(ua)) browserName = 'Chrome';
  else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browserName = 'Safari';
  else if (/Edg/i.test(ua)) browserName = 'Edge';
  else if (/Firefox/i.test(ua)) browserName = 'Firefox';

  return {
    deviceId,
    deviceType: isMobile ? 'mobile' : 'desktop',
    deviceTypeName: `${deviceTypeName} • ${browserName}`,
    browserName
  };
};
