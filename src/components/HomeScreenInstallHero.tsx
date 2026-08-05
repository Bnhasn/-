import React, { useEffect, useState } from 'react';
import { Download, Smartphone, WifiOff, RefreshCw, ShieldCheck, CheckCircle2, Share, PlusSquare, Sparkles, X, ExternalLink } from 'lucide-react';
import { promptPwaInstall, subscribeInstallPrompt, isIOSDevice, isStandaloneMode, isInIframe } from '../lib/pwa';

interface HomeScreenInstallHeroProps {
  onOpenPwaModal?: () => void;
}

export const HomeScreenInstallHero: React.FC<HomeScreenInstallHeroProps> = ({ onOpenPwaModal }) => {
  const [canInstall, setCanInstall] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [inIframe, setInIframe] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);

  useEffect(() => {
    setIsIOS(isIOSDevice());
    setIsStandalone(isStandaloneMode());
    setInIframe(isInIframe());

    const unsubscribe = subscribeInstallPrompt((canPrompt) => {
      setCanInstall(canPrompt);
    });

    return () => unsubscribe();
  }, []);

  if (isStandalone || isDismissed) {
    return null;
  }

  const handleInstallClick = async () => {
    setInstalling(true);
    const success = await promptPwaInstall();
    setInstalling(false);
    
    if (success) {
      setInstalledSuccess(true);
    } else {
      // If native browser prompt didn't trigger (e.g. inside iframe or manual install needed)
      if (inIframe) {
        // Open app in new tab so browser top-level window can handle native PWA prompt
        window.open(window.location.href, '_blank');
      } else if (onOpenPwaModal) {
        onOpenPwaModal();
      }
    }
  };

  return (
    <div className="mb-6 bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950 border-2 border-emerald-500/40 rounded-3xl p-5 md:p-6 text-white shadow-xl relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
      {/* Background Decorative Graphic */}
      <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-amber-400 to-emerald-500" />

      {/* Close button for card */}
      <button
        onClick={() => setIsDismissed(true)}
        className="absolute top-4 left-4 p-1.5 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-full transition-colors z-10"
        title="إغلاق هذا الشريط"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex flex-col lg:flex-row items-center justify-between gap-6 relative z-0">
        {/* Left Side: Icon & Titles */}
        <div className="flex items-start space-x-4 space-x-reverse max-w-2xl">
          <div className="p-3.5 bg-gradient-to-br from-emerald-500 to-emerald-700 text-slate-950 rounded-2xl shadow-lg shadow-emerald-950/50 shrink-0 mt-1">
            <Smartphone className="w-8 h-8 text-white animate-bounce" />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2 space-x-reverse flex-wrap gap-1">
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center space-x-1 space-x-reverse">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>تطبيق متاح للتثبيت المباشر</span>
              </span>
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1 space-x-reverse">
                <WifiOff className="w-3 h-3 text-amber-400" />
                <span>عمل أوفلاين بدون إنترنت</span>
              </span>
            </div>

            <h2 className="text-lg md:text-xl font-extrabold font-['Tajawal'] text-white">
              تثبيت "المنظومة العسكرية" مباشرة على شاشة جهازك 📲
            </h2>
            <p className="text-xs text-slate-300 font-medium leading-relaxed">
              افتح التطبيق بنقرة واحدة من شاشتك الرئيسية، مع دعم كامل للعمل بدون شبكة إنترنت والتحديث التلقائي الفوري فور توفر الاتصال.
            </p>
          </div>
        </div>

        {/* Right Side: Primary Direct Action */}
        <div className="w-full lg:w-auto shrink-0 space-y-2">
          {installedSuccess ? (
            <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 px-5 py-3 rounded-2xl text-xs font-bold flex items-center space-x-2 space-x-reverse">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>تم تثبيت التطبيق بنجاح على شاشتك الرئيسية!</span>
            </div>
          ) : canInstall ? (
            <button
              onClick={handleInstallClick}
              disabled={installing}
              className="w-full lg:w-auto px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black rounded-2xl text-sm transition-all shadow-lg shadow-emerald-950/40 flex items-center justify-center space-x-2 space-x-reverse group cursor-pointer"
            >
              <Download className="w-5 h-5 text-slate-950 group-hover:translate-y-0.5 transition-transform" />
              <span>{installing ? 'جاري التثبيت...' : 'تثبيت التطبيق على الشاشة الرئيسية الآن'}</span>
            </button>
          ) : inIframe ? (
            <button
              onClick={() => {
                window.open(window.location.href, '_blank');
              }}
              className="w-full lg:w-auto px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black rounded-2xl text-sm transition-all shadow-lg flex items-center justify-center space-x-2 space-x-reverse group cursor-pointer"
            >
              <ExternalLink className="w-5 h-5 text-slate-950 group-hover:translate-x-0.5 transition-transform" />
              <span>تثبيت التطبيق (فتح في نافذة مستقلة) 📲</span>
            </button>
          ) : isIOS ? (
            <div className="bg-slate-800/90 border border-amber-500/40 p-3.5 rounded-2xl text-xs text-slate-200 space-y-1.5 max-w-sm">
              <div className="font-bold text-amber-300 text-[11px] flex items-center space-x-1.5 space-x-reverse">
                <Share className="w-4 h-4 text-amber-400 shrink-0" />
                <span>طريقة التثبيت السريعة على آيفون (iPhone):</span>
              </div>
              <p className="text-[10px] text-slate-300 leading-normal">
                اضغط على زر <strong className="text-white">المشاركة (Share)</strong> بأسفل المتصفح، ثم اختر <strong className="text-white">"إضافة إلى الشاشة الرئيسية" (<PlusSquare className="w-3 h-3 inline text-emerald-400" />)</strong>.
              </p>
            </div>
          ) : (
            <button
              onClick={handleInstallClick}
              className="w-full lg:w-auto px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl text-sm transition-all shadow-lg flex items-center justify-center space-x-2 space-x-reverse cursor-pointer"
            >
              <Download className="w-5 h-5 text-white" />
              <span>إضافة التطبيق للشاشة الرئيسية 📲</span>
            </button>
          )}

          <div className="flex items-center justify-center lg:justify-end space-x-3 space-x-reverse text-[10px] text-slate-400 font-medium">
            <span className="flex items-center space-x-1 space-x-reverse">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>حفظ محلي آمن</span>
            </span>
            <span>•</span>
            <span className="flex items-center space-x-1 space-x-reverse">
              <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
              <span>تزامن تلقائي</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
