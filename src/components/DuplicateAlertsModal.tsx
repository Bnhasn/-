import React, { useState } from 'react';
import { ShieldAlert, X, AlertTriangle, User, Building, Clock, Trash2, CheckCircle2, ShieldCheck, Search, Filter } from 'lucide-react';
import { SystemAlert } from '../types';
import { StorageService } from '../lib/storage';

interface DuplicateAlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: SystemAlert[];
  onRefreshData?: () => void;
}

export const DuplicateAlertsModal: React.FC<DuplicateAlertsModalProps> = ({
  isOpen,
  onClose,
  alerts,
  onRefreshData
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  // Filter duplicate alerts
  const duplicateAlerts = alerts.filter(
    (a) => a.isDuplicateAlert || a.title.includes('إدخال متكرر') || a.title.includes('تكرار')
  );

  const filteredAlerts = duplicateAlerts.filter((alt) => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return true;
    return (
      alt.title.toLowerCase().includes(query) ||
      alt.description.toLowerCase().includes(query) ||
      (alt.militaryId && alt.militaryId.toLowerCase().includes(query)) ||
      (alt.duplicateDetails?.fullName && alt.duplicateDetails.fullName.toLowerCase().includes(query)) ||
      (alt.duplicateDetails?.originalAccount && alt.duplicateDetails.originalAccount.toLowerCase().includes(query)) ||
      (alt.duplicateDetails?.attemptedAccount && alt.duplicateDetails.attemptedAccount.toLowerCase().includes(query))
    );
  });

  const handleDismissAlert = (alertId: string) => {
    const updated = alerts.filter((a) => a.id !== alertId);
    StorageService.saveAlerts(updated);
    if (onRefreshData) onRefreshData();
  };

  const handleDeleteDuplicatePersonnel = (militaryId?: string, alertId?: string) => {
    if (militaryId && militaryId !== '-') {
      if (confirm(`هل أنت أكيّد من حذف القيد المكرر للفرد صاحب الرقم العسكري (${militaryId})؟`)) {
        StorageService.deletePersonnelToRecycleBin(
          militaryId,
          'القيادة العليا',
          'القيادة الرئيسية',
          'إلغاء قيد مكرر بناءً على إنذار التكرار بين الحسابات'
        );
        if (alertId) handleDismissAlert(alertId);
        if (onRefreshData) onRefreshData();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden my-6">
        
        {/* Header - HQ Command Theme */}
        <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-amber-950 px-6 py-5 border-b border-rose-900/50 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-11 h-11 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center shadow-inner">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <h3 className="text-xl font-black font-['Tajawal'] text-white">
                  سجل إنذارات الإدخال المتكرر بين الحسابات
                </h3>
                <span className="bg-rose-500/30 text-rose-300 border border-rose-400/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                  المستخدم الرئيسي (القيادة العليا)
                </span>
              </div>
              <p className="text-xs text-rose-200/80 mt-1 font-medium">
                توثيق كامل لكافة محاولات وعمليات إدخال بيانات الأفراد المكررة بين حسابات الألوية المختلفة
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-rose-200 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Summary Banner */}
        <div className="p-6 bg-slate-50 border-b border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-rose-200 rounded-2xl p-4 shadow-2xs">
            <div className="text-xs text-slate-500 font-bold">إجمالي حالات التكرار المرصودة</div>
            <div className="text-2xl font-black text-rose-600 font-mono mt-1">
              {duplicateAlerts.length} <span className="text-xs font-normal text-slate-500">حالة إدخال متكرر</span>
            </div>
          </div>

          <div className="bg-white border border-amber-200 rounded-2xl p-4 shadow-2xs">
            <div className="text-xs text-slate-500 font-bold">مستوى الخطورة والحساسية</div>
            <div className="text-sm font-extrabold text-amber-800 font-['Tajawal'] mt-1 flex items-center space-x-1.5 space-x-reverse">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>عالي - تعارض ألوية وتكرار قوة</span>
            </div>
          </div>

          <div className="bg-white border border-emerald-200 rounded-2xl p-4 shadow-2xs">
            <div className="text-xs text-slate-500 font-bold">حالة التدقيق والإشراف</div>
            <div className="text-sm font-extrabold text-emerald-800 font-['Tajawal'] mt-1 flex items-center space-x-1.5 space-x-reverse">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>مراقبة القيادة العليا نشطة 100%</span>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="px-6 py-3 bg-white border-b border-slate-200">
          <div className="relative">
            <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث برقم الهوية، الرقم العسكري، اسم الفرد، أو اسم اللواء..."
              className="w-full pl-4 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-rose-500 font-bold"
            />
          </div>
        </div>

        {/* Alerts List */}
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
          {filteredAlerts.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h4 className="text-base font-bold text-slate-800 font-['Tajawal']">
                لا توجد إنذارات إدخال متكرر حالياً
              </h4>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                جميع بيانات الأفراد المدخلة عبر مختلف الحسابات متوافقة ولا تحتوي على تعارضات أو تكرار بالرقم العسكري أو الهوية.
              </p>
            </div>
          ) : (
            filteredAlerts.map((alt) => {
              const details = alt.duplicateDetails;
              return (
                <div
                  key={alt.id}
                  className="bg-white border-2 border-rose-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-rose-500 via-amber-500 to-rose-600"></div>

                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <div className="p-2 bg-rose-100 text-rose-800 rounded-xl font-bold">
                        <AlertTriangle className="w-5 h-5 text-rose-600" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900 font-['Tajawal'] flex items-center space-x-2 space-x-reverse">
                          <span>{alt.title}</span>
                          <span className="bg-rose-100 text-rose-800 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
                            تكرار حقيقي
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 flex items-center space-x-2 space-x-reverse mt-0.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>تاريخ البلاغ: {alt.date}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 space-x-reverse">
                      {alt.militaryId && (
                        <button
                          onClick={() => handleDeleteDuplicatePersonnel(alt.militaryId, alt.id)}
                          className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 space-x-reverse shadow-2xs"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>حذف القيد المكرر</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleDismissAlert(alt.id)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
                      >
                        إغلاق البلاغ
                      </button>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-700 mt-3 font-bold leading-relaxed bg-rose-50/50 p-3 rounded-xl border border-rose-100">
                    {alt.description}
                  </p>

                  {/* Detailed Breakdown if available */}
                  {details && (
                    <div className="mt-3 bg-slate-900 text-white p-4 rounded-xl text-xs space-y-3 font-mono">
                      <div className="text-amber-400 font-bold border-b border-slate-800 pb-1.5 flex items-center justify-between">
                        <span>🔍 تفاصيل عملية التكرار الكاملة:</span>
                        <span className="text-[10px] text-slate-400">{details.timestamp}</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
                          <span className="text-slate-400 text-[10px] block">اسم الفرد المكرر:</span>
                          <span className="text-white font-bold text-xs">{details.fullName}</span>
                        </div>

                        <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
                          <span className="text-slate-400 text-[10px] block">الرقم العسكري:</span>
                          <span className="text-amber-300 font-bold text-xs">{details.militaryId}</span>
                        </div>

                        <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
                          <span className="text-slate-400 text-[10px] block">رقم الهوية المدنية:</span>
                          <span className="text-emerald-300 font-bold text-xs">{details.nationalId}</span>
                        </div>

                        <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
                          <span className="text-slate-400 text-[10px] block">رتبة الفرد:</span>
                          <span className="text-white font-bold text-xs">{details.rank}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div className="bg-emerald-950/80 border border-emerald-500/40 p-3 rounded-xl">
                          <div className="text-emerald-400 text-[11px] font-bold mb-1 flex items-center space-x-1 space-x-reverse">
                            <Building className="w-3.5 h-3.5" />
                            <span>1. الحساب الأصلي المسجل عليه الفرد أولاً:</span>
                          </div>
                          <div className="text-white font-bold text-xs">{details.originalAccount}</div>
                          <div className="text-[10px] text-emerald-200 mt-0.5">الوحدة: {details.originalUnit}</div>
                        </div>

                        <div className="bg-rose-950/80 border border-rose-500/40 p-3 rounded-xl">
                          <div className="text-rose-400 text-[11px] font-bold mb-1 flex items-center space-x-1 space-x-reverse">
                            <User className="w-3.5 h-3.5" />
                            <span>2. الحساب الذي حاول الإدخال المتكرر:</span>
                          </div>
                          <div className="text-white font-bold text-xs">{details.attemptedAccount}</div>
                          <div className="text-[10px] text-rose-200 mt-0.5">
                            المنفذ: {details.attemptedUser} | الوحدة: {details.attemptedUnit}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <div className="text-slate-500 font-medium">
            توجيه القيادة العليا: يوصى بحذف السجلات المكررة للإبقاء على السجل العسكري الحصين وموثوقية حصر القوة.
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all"
          >
            إغلاق النافذة
          </button>
        </div>

      </div>
    </div>
  );
};
