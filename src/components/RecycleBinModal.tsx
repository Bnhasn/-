import React, { useState, useEffect } from 'react';
import {
  Trash2,
  X,
  RotateCcw,
  AlertOctagon,
  Clock,
  User,
  Shield,
  Search,
  CheckCircle2,
  AlertTriangle,
  Calendar
} from 'lucide-react';
import { RecycledPersonnel } from '../types';
import { StorageService } from '../lib/storage';

interface RecycleBinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshData: () => void;
  currentUserName?: string;
}

export const RecycleBinModal: React.FC<RecycleBinModalProps> = ({
  isOpen,
  onClose,
  onRefreshData,
  currentUserName = 'المستخدم'
}) => {
  const [recycleItems, setRecycleItems] = useState<RecycledPersonnel[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const loadBinItems = () => {
    const items = StorageService.getRecycleBin();
    setRecycleItems(items);
  };

  useEffect(() => {
    if (isOpen) {
      loadBinItems();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRestore = (trashId: string, name: string) => {
    if (window.confirm(`هل أنت تأكد من استعادة بيانات الفرد (${name}) وإعادتها لقوة البيانات الفعلية؟`)) {
      StorageService.restorePersonnelFromRecycleBin(trashId, currentUserName);
      loadBinItems();
      onRefreshData();
    }
  };

  const handlePermanentDelete = (trashId: string, name: string) => {
    if (
      window.confirm(
        `تنبيه تحذيري: حذف الفرد (${name}) نهائياً لا يمكن التراجع عنه. هل تريد الاستمرار بحذفه من السيرفر نهائياً؟`
      )
    ) {
      StorageService.permanentlyDeleteFromRecycleBin(trashId, currentUserName);
      loadBinItems();
      onRefreshData();
    }
  };

  const handleClearAll = () => {
    if (
      window.confirm(
        `إفراغ سلة المحذوفات نهائياً: سيتم مسح كافة الأفراد المحددين (${recycleItems.length}) بلا إمكانية لاستعادتهم. هل أنت متأكد؟`
      )
    ) {
      StorageService.clearRecycleBin(currentUserName);
      loadBinItems();
      onRefreshData();
    }
  };

  const calculateDaysRemaining = (deletedAtISO: string) => {
    const deletedTime = new Date(deletedAtISO).getTime();
    const now = new Date().getTime();
    const elapsedMs = now - deletedTime;
    const elapsedDays = Math.floor(elapsedMs / (1000 * 60 * 60 * 24));
    const remainingDays = 30 - elapsedDays;
    return remainingDays > 0 ? remainingDays : 0;
  };

  const filteredItems = recycleItems.filter((item) => {
    const s = searchTerm.trim().toLowerCase();
    if (!s) return true;
    return (
      item.personnel.fullName.toLowerCase().includes(s) ||
      item.personnel.militaryId.toLowerCase().includes(s) ||
      item.personnel.rank.toLowerCase().includes(s) ||
      item.personnel.unit.toLowerCase().includes(s)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 px-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden my-6">
        {/* Modal Header */}
        <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center font-bold">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-['Tajawal'] flex items-center space-x-2 space-x-reverse">
                <span>سلة المحذوفات والسجلات المعلقة</span>
                <span className="text-xs bg-rose-600 text-white font-mono px-2 py-0.5 rounded-full font-black">
                  {recycleItems.length}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                يتم الاحتفاظ بالسجلات المحذوفة لمدة 30 يوماً تلقائياً مع إمكانية الاستعادة الفورية أو الحذف النهائي
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 space-x-reverse">
            {recycleItems.length > 0 && (
              <button
                onClick={handleClearAll}
                className="flex items-center space-x-1.5 space-x-reverse bg-rose-900/80 hover:bg-rose-800 text-rose-200 border border-rose-700 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
                <span>إفراغ السلة نهائياً</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        {recycleItems.length > 0 && (
          <div className="p-4 bg-slate-100 border-b border-slate-200">
            <div className="relative max-w-md">
              <Search className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="البحث في سلة المحذوفات بالاسم أو الرقم الوظيفي..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-3 pr-9 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="max-h-[60vh] overflow-y-auto p-6 space-y-3">
          {filteredItems.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto" />
              <h4 className="text-base font-bold text-slate-800 font-['Tajawal']">
                سلة المحذوفات فارغة
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                لا توجد سجلات عسكرية معلقة بالمحذوفات حالياً. أي فرد يتم حذفه سيبقى هنا لمدة 30 يوماً قبل مسحه النهائي.
              </p>
            </div>
          ) : (
            filteredItems.map((item) => {
              const remainingDays = calculateDaysRemaining(item.deletedAt);
              return (
                <div
                  key={item.id}
                  className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-300 transition-all shadow-2xs"
                >
                  {/* Personnel Info */}
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="w-12 h-12 rounded-xl bg-slate-200 border border-slate-300 flex items-center justify-center shrink-0 overflow-hidden">
                      {item.personnel.photoUrl ? (
                        <img
                          src={item.personnel.photoUrl}
                          alt={item.personnel.fullName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-6 h-6 text-slate-500" />
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 space-x-reverse font-bold">
                        <span className="text-xs bg-slate-900 text-white px-2 py-0.5 rounded-lg">
                          {item.personnel.rank}
                        </span>
                        <span className="text-sm text-slate-900 font-['Tajawal'] font-black">
                          {item.personnel.fullName}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                        <span>الرقم الوظيفي: <strong className="text-slate-800 font-mono">{item.personnel.militaryId}</strong></span>
                        <span>• الوحدة: {item.personnel.unit || 'غير محدد'}</span>
                        <span>• الكتيبة: {item.personnel.battalion || '-'}</span>
                      </div>

                      <div className="flex items-center space-x-3 space-x-reverse text-[11px] text-slate-500 pt-0.5">
                        <span className="flex items-center space-x-1 space-x-reverse">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>تاريخ الحذف: {new Date(item.deletedAt).toLocaleDateString('ar-EG')} ({new Date(item.deletedAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })})</span>
                        </span>
                        <span>بواسطة: {item.deletedBy}</span>
                      </div>
                    </div>
                  </div>

                  {/* Days remaining badge & Action Buttons */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between md:justify-end gap-3 border-t md:border-t-0 border-slate-200 pt-3 md:pt-0 shrink-0">
                    <div
                      className={`flex items-center space-x-1.5 space-x-reverse text-xs font-bold px-3 py-1.5 rounded-xl border ${
                        remainingDays <= 5
                          ? 'bg-rose-100 text-rose-900 border-rose-300'
                          : remainingDays <= 15
                          ? 'bg-amber-100 text-amber-900 border-amber-300'
                          : 'bg-indigo-100 text-indigo-900 border-indigo-200'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>متبقي للحذف النهائي: {remainingDays} يوم</span>
                    </div>

                    <div className="flex items-center space-x-2 space-x-reverse">
                      <button
                        onClick={() => handleRestore(item.id, item.personnel.fullName)}
                        className="flex items-center space-x-1.5 space-x-reverse bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>استعادة البيانات</span>
                      </button>

                      <button
                        onClick={() => handlePermanentDelete(item.id, item.personnel.fullName)}
                        className="flex items-center space-x-1 space-x-reverse bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>حذف نهائي</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-900 text-slate-400 border-t border-slate-800 text-center text-xs font-medium flex items-center justify-between px-6">
          <span>سلة المحذوفات الموحدة • الحذف التلقائي ينشط بعد مرور 30 يوماً من تاريخ النقل</span>
          <span className="text-emerald-400 font-bold">الحفظ المحلي الآمن فعّال 💾</span>
        </div>
      </div>
    </div>
  );
};
