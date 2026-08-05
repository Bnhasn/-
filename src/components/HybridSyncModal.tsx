import React, { useState, useEffect } from 'react';
import {
  X,
  Cloud,
  Database,
  Wifi,
  WifiOff,
  RefreshCw,
  CheckCircle2,
  HardDrive,
  ShieldCheck,
  AlertCircle,
  Clock,
  Layers
} from 'lucide-react';
import { hybridSyncEngine, HybridSyncStatus } from '../lib/hybridSync';

interface HybridSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HybridSyncModal: React.FC<HybridSyncModalProps> = ({ isOpen, onClose }) => {
  const [status, setStatus] = useState<HybridSyncStatus>(() => hybridSyncEngine.getStatus());
  const [isSyncingNow, setIsSyncingNow] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const unsub = hybridSyncEngine.subscribe((newStatus) => {
      setStatus(newStatus);
    });
    return () => unsub();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleForceSync = async () => {
    setIsSyncingNow(true);
    setFeedbackMessage(null);
    try {
      const result = await hybridSyncEngine.forceSyncNow();
      if (result.success) {
        setFeedbackMessage({
          type: 'success',
          text: result.message
        });
      } else {
        setFeedbackMessage({
          type: 'error',
          text: result.message
        });
      }
    } catch (err: any) {
      setFeedbackMessage({
        type: 'error',
        text: `حدث خطأ أثناء المزامنة: ${err.message || err}`
      });
    } finally {
      setIsSyncingNow(false);
    }
  };

  const formatLastSync = (isoStr: string | null) => {
    if (!isoStr) return 'لم تتم المزامنة بعد';
    try {
      const d = new Date(isoStr);
      return `${d.toLocaleDateString('ar-EG')} - ${d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
    } catch (e) {
      return isoStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto font-['Cairo',sans-serif] animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden dir-rtl">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="p-2.5 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-emerald-400">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <span>مركز التخزين المحلي والنسخ الاحتياطي 💾</span>
              </h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                نظام الحفظ المحلي الفوري والآمن 100% على جهازك بدون سحابة
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          
          {/* Status Card */}
          <div className="p-4 rounded-2xl border flex items-center justify-between bg-emerald-50 border-emerald-200 text-emerald-950">
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="p-3 rounded-2xl bg-emerald-600 text-white">
                <HardDrive className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-black opacity-80">حالة نظام التخزين الحالي</div>
                <div className="text-sm font-extrabold flex items-center gap-1.5 mt-0.5">
                  <span>وضع التخزين المحلي الآمن 100% (بدون سحابة) 💾</span>
                </div>
              </div>
            </div>

            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full border bg-emerald-200 text-emerald-800 border-emerald-300">
              محلي 100%
            </span>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 flex items-center space-x-3 space-x-reverse">
              <div className="p-2 bg-blue-100 text-blue-700 rounded-xl shrink-0">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-extrabold text-slate-500">مقر الحفظ الأساسي</div>
                <div className="text-xs font-bold text-slate-900 mt-0.5">جهازك المحلي (مباشر)</div>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 flex items-center space-x-3 space-x-reverse">
              <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-extrabold text-slate-500">سرعة وأمان البيانات</div>
                <div className="text-xs font-bold text-slate-900 mt-0.5">
                  <span className="text-emerald-700 font-bold">فوري، آمن وبدون إنترنت</span>
                </div>
              </div>
            </div>
          </div>

          {/* Explanatory Banner */}
          <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-3.5 text-xs text-emerald-950 font-medium leading-relaxed">
            <div className="font-bold text-emerald-900 mb-1 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>كيف يعمل نظام التخزين المحلي؟</span>
            </div>
            تتم معالجة وحفظ كافة البيانات والأنشطة (سجلات الضباط، الأسلحة، الحركات، التنبيهات) <strong>مباشرةً داخل ذاكرة جهازك المحلية</strong> بأعلى معايير السرعة والأمان بدون إرسال أي بيانات لخوادم سحابية خارجية.
          </div>

          {/* Feedback Message if any */}
          {feedbackMessage && (
            <div className={`p-3.5 rounded-2xl text-xs font-bold flex items-center space-x-2 space-x-reverse ${
              feedbackMessage.type === 'success'
                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                : 'bg-rose-100 text-rose-900 border border-rose-300'
            }`}>
              {feedbackMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{feedbackMessage.text}</span>
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end space-x-3 space-x-reverse">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors"
            >
              إغلاق
            </button>

            <button
              type="button"
              onClick={handleForceSync}
              disabled={isSyncingNow || status.isSyncing}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition-all flex items-center space-x-2 space-x-reverse disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncingNow || status.isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncingNow || status.isSyncing ? 'جاري المزامنة...' : 'مزامنة فورية الآن ⚡'}</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
