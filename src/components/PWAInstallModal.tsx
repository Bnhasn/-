import React, { useEffect, useState } from 'react';
import { Download, Smartphone, WifiOff, RefreshCw, CheckCircle2, Share, PlusSquare, X, ShieldCheck, Zap, ExternalLink } from 'lucide-react';
import { promptPwaInstall, subscribeInstallPrompt, isIOSDevice, isStandaloneMode, isInIframe } from '../lib/pwa';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({ isOpen, onClose }) => {
  const [canInstall, setCanInstall] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [inIframe, setInIframe] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
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

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    setInstalling(true);
    const success = await promptPwaInstall();
    setInstalling(false);
    if (success) {
      setInstalledSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2500);
    } else if (inIframe) {
      window.open(window.location.href, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200" dir="rtl">
      <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl relative overflow-hidden">
        {/* Decorative Background Accent */}
        <div className="absolute top-0 right-0 left-0 h-2 bg-gradient-to-r from-emerald-500 via-amber-500 to-emerald-600" />
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-2 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3 space-x-reverse pt-2">
          <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
            <Smartphone className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold font-['Tajawal'] text-white">
              تثبيت التطبيق على الشاشة الرئيسية 📲
            </h2>
            <p className="text-xs text-slate-400 font-medium">
              استخدم المنظومة العسكرية كتطبيق كامل بدون إنترنت مع فتح مباشر
            </p>
          </div>
        </div>

        {/* Success Alert */}
        {installedSuccess ? (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 p-5 rounded-2xl flex items-center space-x-3 space-x-reverse">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" />
            <div className="space-y-1 text-xs font-medium">
              <h4 className="font-bold text-sm text-emerald-300">تم تثبيت التطبيق بنجاح!</h4>
              <p>تجد الآن أيقونة المنظومة العسكرية على شاشة جهازك الرئيسية، يمكنك فتحها مباشرة في أي وقت.</p>
            </div>
          </div>
        ) : (
          <>
            {/* Features Badge Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-slate-800/80 border border-slate-700/60 p-3 rounded-2xl space-y-1.5 text-center">
                <WifiOff className="w-5 h-5 text-amber-400 mx-auto" />
                <h4 className="text-xs font-bold text-slate-200">يعمل بدون إنترنت</h4>
                <p className="text-[10px] text-slate-400 leading-snug">فتح واستعراض البيانات وإجراء العمليات بدون تغطية</p>
              </div>

              <div className="bg-slate-800/80 border border-slate-700/60 p-3 rounded-2xl space-y-1.5 text-center">
                <RefreshCw className="w-5 h-5 text-emerald-400 mx-auto" />
                <h4 className="text-xs font-bold text-slate-200">تحديث وتزامن تلقائي</h4>
                <p className="text-[10px] text-slate-400 leading-snug">تتزامن التعديلات فور عودة الاتصال بالشبكة</p>
              </div>

              <div className="bg-slate-800/80 border border-slate-700/60 p-3 rounded-2xl space-y-1.5 text-center">
                <Zap className="w-5 h-5 text-blue-400 mx-auto" />
                <h4 className="text-xs font-bold text-slate-200">فتح أسرع ومباشر</h4>
                <p className="text-[10px] text-slate-400 leading-snug">أيقونة خاصة بالشاشة الرئيسية دون الحاجة لمتصفح</p>
              </div>
            </div>

            {/* Installation Action Section */}
            {inIframe && (
              <div className="bg-emerald-950/80 border border-emerald-500/40 p-4 rounded-2xl space-y-2.5">
                <div className="flex items-center space-x-2 space-x-reverse text-emerald-300 font-bold text-xs">
                  <ExternalLink className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>خطوة سريعة للتثبيت المباشر:</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  أنت تتصفح التطبيق حالياً داخل نافذة المعاينة. اضغط على الزر أدناه لفتح التطبيق في نافذة مستقلة ليتمكن المتصفح من إظهار خيار التثبيت المباشر على شاشتك الرئيسية فوراً:
                </p>
                <button
                  onClick={() => window.open(window.location.href, '_blank')}
                  className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black rounded-xl text-xs transition-all flex items-center justify-center space-x-2 space-x-reverse cursor-pointer shadow-md"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>فتح التطبيق في نافذة جديدة للتثبيت 📲</span>
                </button>
              </div>
            )}

            {canInstall ? (
              <div className="space-y-3 pt-2">
                <button
                  onClick={handleInstallClick}
                  disabled={installing}
                  className="w-full py-3.5 px-6 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-extrabold rounded-2xl text-sm transition-all shadow-lg shadow-emerald-900/20 flex items-center justify-center space-x-2 space-x-reverse"
                >
                  <Download className="w-5 h-5" />
                  <span>{installing ? 'جاري التثبيت...' : 'تثبيت التطبيق الآن بضغطة زر 📲'}</span>
                </button>
                <p className="text-[11px] text-slate-400 text-center font-medium">
                  سيتم إضافة التطبيق فوراً إلى شاشتك الرئيسية وأدوات الجهاز.
                </p>
              </div>
            ) : isIOS ? (
              /* iOS Safari Instructions */
              <div className="bg-slate-800/90 border border-slate-700 p-4 rounded-2xl space-y-3 text-xs text-slate-200">
                <h4 className="font-bold text-amber-400 text-xs flex items-center space-x-1.5 space-x-reverse">
                  <Smartphone className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>خطوات تثبيت التطبيق على آيفون (iPhone / iPad):</span>
                </h4>
                <ol className="space-y-2.5 text-[11px] font-medium text-slate-300">
                  <li className="flex items-center space-x-2 space-x-reverse">
                    <span className="w-5 h-5 bg-amber-500/20 text-amber-300 font-bold rounded-full flex items-center justify-center text-[10px] shrink-0">1</span>
                    <span>اضغط على زر المشاركة <Share className="w-3.5 h-3.5 inline text-amber-400 mx-1" /> بأسفل متصفح Safari.</span>
                  </li>
                  <li className="flex items-center space-x-2 space-x-reverse">
                    <span className="w-5 h-5 bg-amber-500/20 text-amber-300 font-bold rounded-full flex items-center justify-center text-[10px] shrink-0">2</span>
                    <span>اختر خيار <strong className="text-white">"إضافة إلى الشاشة الرئيسية"</strong> (<PlusSquare className="w-3.5 h-3.5 inline text-emerald-400 mx-1" /> Add to Home Screen).</span>
                  </li>
                  <li className="flex items-center space-x-2 space-x-reverse">
                    <span className="w-5 h-5 bg-amber-500/20 text-amber-300 font-bold rounded-full flex items-center justify-center text-[10px] shrink-0">3</span>
                    <span>اضغط على زر <strong className="text-white">"إضافة" (Add)</strong> بالأعلى لتظهر أيقونة التطبيق في شاشتك الرئيسية.</span>
                  </li>
                </ol>
              </div>
            ) : isStandalone ? (
              <div className="bg-emerald-950/60 border border-emerald-800/60 p-4 rounded-2xl text-center text-xs text-emerald-300 space-y-1">
                <ShieldCheck className="w-6 h-6 mx-auto text-emerald-400" />
                <p className="font-bold text-sm">التطبيق مثبت ومفتوح من الشاشة الرئيسية بالفعل!</p>
                <p className="text-[11px] text-emerald-400/80">أنت تستخدم المنظومة العسكرية الآن بالوضع المثبت المستقل مع دعم كامل للأوفلاين.</p>
              </div>
            ) : (
              /* Android Chrome or General Browser Instructions */
              <div className="bg-slate-800/90 border border-slate-700 p-4 rounded-2xl space-y-3 text-xs text-slate-200">
                <h4 className="font-bold text-amber-400 text-xs flex items-center space-x-1.5 space-x-reverse">
                  <Smartphone className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>خطوات التثبيت من قائمة المتصفح:</span>
                </h4>
                <ol className="space-y-2 text-[11px] font-medium text-slate-300">
                  <li className="flex items-center space-x-2 space-x-reverse">
                    <span className="w-5 h-5 bg-slate-700 text-slate-200 font-bold rounded-full flex items-center justify-center text-[10px] shrink-0">1</span>
                    <span>افتح قائمة خيارات المتصفح (النقاط الثلاث <strong>⋮</strong> بالأعلى).</span>
                  </li>
                  <li className="flex items-center space-x-2 space-x-reverse">
                    <span className="w-5 h-5 bg-slate-700 text-slate-200 font-bold rounded-full flex items-center justify-center text-[10px] shrink-0">2</span>
                    <span>اختر <strong className="text-white">"التثبيت على الشاشة الرئيسية"</strong> أو <strong className="text-white">"إضافة تطبيق"</strong> (Install app / Add to Home screen).</span>
                  </li>
                </ol>
              </div>
            )}
          </>
        )}

        {/* Footer */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center space-x-1 space-x-reverse text-emerald-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>نظام محمي ومشفر بالكامل</span>
          </span>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white font-bold underline transition-colors"
          >
            إغلاق النافذة
          </button>
        </div>
      </div>
    </div>
  );
};
