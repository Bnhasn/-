import React, { useMemo, useState } from 'react';
import {
  Bell,
  X,
  AlertTriangle,
  Package,
  Clock,
  CheckCircle2,
  AlertOctagon,
  Trash2,
  ExternalLink,
  User,
  FileText,
  Filter,
  RotateCw
} from 'lucide-react';
import { PersonnelRecord, SystemAlert } from '../types';
import { StorageService } from '../lib/storage';
import { getPersonnelCustodies } from '../lib/personnelUtils';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  personnel: PersonnelRecord[];
  onSelectPersonnel: (militaryId: string) => void;
  onRefreshData?: () => void;
}

export interface GeneratedAlert {
  id: string;
  category: 'مخزون منخفض' | 'صلاحية/نفاد' | 'عهد متأخرة' | 'تكرار عهدة' | 'صيانة أسلحة' | 'تحديث بيانات' | 'عام';
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'info';
  date: string;
  relatedMilitaryId?: string;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  personnel,
  onSelectPersonnel,
  onRefreshData
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'data' | 'armory' | 'urgent'>('all');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshNotice, setRefreshNotice] = useState<string | null>(null);

  // Generate real-time system alerts
  const alerts = useMemo<GeneratedAlert[]>(() => {
    const list: GeneratedAlert[] = [];
    const today = new Date().toISOString().split('T')[0];
    const dismissedIds = StorageService.getDismissedAlertIds();

    // 1. Armory Inventory Low Stock
    const inventory = StorageService.getArmoryInventory();
    inventory.forEach((item) => {
      if (item.availableQty <= item.minThreshold) {
        list.push({
          id: `alert-inv-${item.id}`,
          category: 'مخزون منخفض',
          title: `انخفاض المخزون: ${item.name}`,
          description: `الكمية المتوفرة حالياً بالمخزن (${item.availableQty}) أقل من الحد الأدنى المقبول (${item.minThreshold}). يرجى توريد شحنة جديدة.`,
          severity: item.availableQty === 0 ? 'high' : 'medium',
          date: today
        });
      }

      // Expiring ammo or items
      if (item.expiryDate) {
        const exp = new Date(item.expiryDate);
        const now = new Date();
        const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 3600 * 24));
        if (diffDays <= 60) {
          list.push({
            id: `alert-exp-${item.id}`,
            category: 'صلاحية/نفاد',
            title: `قرب انتهاء صلاحية: ${item.name}`,
            description: `تاريخ الانتهاء المحدد هو ${item.expiryDate} (متبقي ${diffDays} يوم).`,
            severity: diffDays <= 15 ? 'high' : 'medium',
            date: today
          });
        }
      }
    });

    // 2. Unreturned Weapons / Custodies
    const issues = StorageService.getArmoryIssues();
    issues.forEach((order) => {
      if (order.status === 'نشط') {
        list.push({
          id: `alert-iss-${order.id}`,
          category: 'عهد متأخرة',
          title: `سلاح/ذخيرة معلقة بحوزة: ${order.recipientName}`,
          description: `أمر الصرف رقم (${order.orderNumber}) بتاريخ ${order.date.split(' ')[0]} لم يتم إرجاعه بعد للمخزن.`,
          severity: 'medium',
          date: order.date.split(' ')[0],
          relatedMilitaryId: order.recipientMilitaryId
        });
      }
    });

    // 3. Multi-Custody Duplicate Alerts
    personnel.forEach((p) => {
      const custodies = getPersonnelCustodies(p);
      const weaponCustodies = custodies.filter((c) => c.category === 'تسليح');
      if (weaponCustodies.length > 1) {
        list.push({
          id: `alert-dup-${p.militaryId}`,
          category: 'تكرار عهدة',
          title: `تنبيه ازدواج عهدة: ${p.fullName}`,
          description: `الفرد برتبة ${p.rank} ينضوي تحت ذمته عدد (${weaponCustodies.length}) أسلحة مقيدة. يرجى المراجعة.`,
          severity: 'high',
          date: today,
          relatedMilitaryId: p.militaryId
        });
      }
    });

    // 4. Weapons Under Maintenance
    const weapons = StorageService.getArmoryWeapons();
    weapons.forEach((wpn) => {
      if (wpn.technicalCondition === 'تحتاج صيانة' || wpn.technicalCondition === 'معطوبة') {
        list.push({
          id: `alert-maint-${wpn.id}`,
          category: 'صيانة أسلحة',
          title: `سلاح غير جاهز للصرف: ${wpn.weaponType} (${wpn.serialNumber})`,
          description: `الحالة الفنية الحالية: (${wpn.technicalCondition}) - بموقع التخزين: ${wpn.storageLocation}.`,
          severity: 'medium',
          date: today
        });
      }
    });

    // 5. Stored Alerts (User operations across all accounts)
    const storedAlerts = StorageService.getAlerts();
    storedAlerts.forEach((alt) => {
      list.push({
        id: alt.id,
        category: alt.title.includes('تحديث بيانات') ? 'تحديث بيانات' : 'عام',
        title: alt.title,
        description: alt.description,
        severity: alt.level === 'urgent' ? 'high' : 'medium',
        date: alt.date,
        relatedMilitaryId: alt.militaryId
      });
    });

    // Filter out dismissed alerts
    return list.filter((alt) => !dismissedIds.includes(alt.id));
  }, [personnel, refreshTrigger]);

  const filteredAlerts = useMemo(() => {
    if (selectedFilter === 'data') {
      return alerts.filter((a) => a.category === 'تحديث بيانات');
    }
    if (selectedFilter === 'armory') {
      return alerts.filter(
        (a) =>
          a.category === 'مخزون منخفض' ||
          a.category === 'عهد متأخرة' ||
          a.category === 'تكرار عهدة' ||
          a.category === 'صيانة أسلحة' ||
          a.category === 'صلاحية/نفاد'
      );
    }
    if (selectedFilter === 'urgent') {
      return alerts.filter((a) => a.severity === 'high');
    }
    return alerts;
  }, [alerts, selectedFilter]);

  const handleDeleteSingleAlert = (alertId: string) => {
    StorageService.dismissAlert(alertId);
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleClearAllAlerts = () => {
    if (window.confirm('هل أنت تأكد من رغبتك في حذف وإخلاء جميع التنبيهات؟')) {
      StorageService.clearAllAlerts();
      setRefreshTrigger((prev) => prev + 1);
    }
  };

  const handleRefreshAllData = () => {
    setIsRefreshing(true);
    StorageService.notifySubscribers();
    if (onRefreshData) {
      onRefreshData();
    }
    setRefreshTrigger((prev) => prev + 1);
    setRefreshNotice('تم تحديث البيانات والجاهزية الحالية وحساب القيادة الرئيسي بنجاح ⚡');
    setTimeout(() => {
      setIsRefreshing(false);
    }, 400);
    setTimeout(() => {
      setRefreshNotice(null);
    }, 3500);
  };

  const handleOpenProfile = (militaryId: string) => {
    onSelectPersonnel(militaryId);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 px-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden my-6">
        {/* Modal Header */}
        <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-['Tajawal'] flex items-center space-x-2 space-x-reverse">
                <span>مركز الإشعارات والتنبيهات المباشرة</span>
                <span className="text-xs bg-amber-500 text-slate-950 font-mono px-2 py-0.5 rounded-full font-black">
                  {alerts.length}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                ربط لحظي لكافة تحديات البيانات المصدرة من الألوية والعهد والمخازن
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 space-x-reverse">
            <button
              onClick={handleRefreshAllData}
              disabled={isRefreshing}
              className="flex items-center space-x-1.5 space-x-reverse bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white border border-emerald-500/40 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              title="تحديث بيانات الجاهزية وحساب القيادة آلياً"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>تحديث البيانات والجاهزية</span>
            </button>

            {alerts.length > 0 && (
              <button
                onClick={handleClearAllAlerts}
                className="flex items-center space-x-1 space-x-reverse bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                title="حذف جميع التنبيهات"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>مسح الكل</span>
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

        {refreshNotice && (
          <div className="bg-emerald-600 text-white text-xs font-extrabold px-4 py-2.5 text-center border-b border-emerald-700 animate-in fade-in duration-200">
            {refreshNotice}
          </div>
        )}

        {/* Filter Navigation Tabs */}
        <div className="bg-slate-100 border-b border-slate-200 p-2.5 flex items-center space-x-1.5 space-x-reverse overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl transition-all ${
              selectedFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            جميع التنبيهات ({alerts.length})
          </button>

          <button
            onClick={() => setSelectedFilter('data')}
            className={`px-3.5 py-1.5 rounded-xl transition-all ${
              selectedFilter === 'data'
                ? 'bg-indigo-900 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            تحديثات مدخلات الحسابات ({alerts.filter((a) => a.category === 'تحديث بيانات').length})
          </button>

          <button
            onClick={() => setSelectedFilter('armory')}
            className={`px-3.5 py-1.5 rounded-xl transition-all ${
              selectedFilter === 'armory'
                ? 'bg-amber-900 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            العهد والتسليح (
            {
              alerts.filter(
                (a) =>
                  a.category === 'مخزون منخفض' ||
                  a.category === 'عهد متأخرة' ||
                  a.category === 'تكرار عهدة' ||
                  a.category === 'صيانة أسلحة' ||
                  a.category === 'صلاحية/نفاد'
              ).length
            }
            )
          </button>

          <button
            onClick={() => setSelectedFilter('urgent')}
            className={`px-3.5 py-1.5 rounded-xl transition-all ${
              selectedFilter === 'urgent'
                ? 'bg-rose-700 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            تنبيهات حرجة ({alerts.filter((a) => a.severity === 'high').length})
          </button>
        </div>

        {/* Notifications Body List */}
        <div className="max-h-[62vh] overflow-y-auto p-5 space-y-3 text-right">
          {filteredAlerts.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto" />
              <h4 className="text-base font-bold text-slate-800 font-['Tajawal']">لا توجد إشعارات أو تنبيهات نشطة</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                جميع منظومات القوة البشرية والتسليح تعمل بانضباط. أي عملية إدخال أو تعديل بيانات بحسابات الألوية تظهر فوراً هنا.
              </p>
            </div>
          ) : (
            filteredAlerts.map((alt) => (
              <div
                key={alt.id}
                className={`p-4 rounded-2xl border transition-all space-y-2 relative group ${
                  alt.severity === 'high'
                    ? 'bg-rose-50/90 border-rose-300 text-rose-950 hover:bg-rose-100/90'
                    : alt.category === 'تحديث بيانات'
                    ? 'bg-indigo-50/90 border-indigo-200 text-indigo-950 hover:bg-indigo-100/90'
                    : 'bg-amber-50/90 border-amber-300 text-amber-950 hover:bg-amber-100/90'
                }`}
              >
                {/* Header line */}
                <div className="flex items-start justify-between gap-3 border-b border-black/10 pb-2">
                  <div className="flex items-center space-x-2 space-x-reverse font-bold text-sm">
                    {alt.severity === 'high' ? (
                      <AlertOctagon className="w-4 h-4 text-rose-700 shrink-0" />
                    ) : alt.category === 'تحديث بيانات' ? (
                      <FileText className="w-4 h-4 text-indigo-700 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                    )}
                    <span className="font-['Tajawal'] text-slate-900 font-extrabold">{alt.title}</span>
                  </div>

                  <div className="flex items-center space-x-2 space-x-reverse shrink-0">
                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                        alt.severity === 'high'
                          ? 'bg-rose-200 border-rose-400 text-rose-950'
                          : alt.category === 'تحديث بيانات'
                          ? 'bg-indigo-200 border-indigo-400 text-indigo-950'
                          : 'bg-amber-200 border-amber-400 text-amber-950'
                      }`}
                    >
                      {alt.category}
                    </span>

                    {/* Delete Alert Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSingleAlert(alt.id);
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-700 hover:bg-rose-100 rounded-lg transition-colors"
                      title="حذف هذا التنبيه"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs font-medium text-slate-800 leading-relaxed">{alt.description}</p>

                {/* Footer bar with direct open button */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-black/5 text-[11px] font-bold">
                  <span className="text-slate-500 font-mono text-[10px]">التاريخ: {alt.date}</span>

                  {alt.relatedMilitaryId ? (
                    <button
                      onClick={() => handleOpenProfile(alt.relatedMilitaryId!)}
                      className="flex items-center space-x-1.5 space-x-reverse bg-emerald-800 hover:bg-emerald-900 text-white px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all shadow-xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                      <span>الدخول المباشر إلى ملف الفرد</span>
                    </button>
                  ) : (
                    <span className="text-slate-400 text-[10px]">تنبيه منظومة عامة</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 bg-slate-900 text-slate-300 border-t border-slate-800 text-xs font-medium flex flex-wrap items-center justify-between gap-3 px-6">
          <div className="flex items-center space-x-3 space-x-reverse">
            <span>نظام التنبيهات الموحد • يتزامن تلقائياً بين كافة حسابات الألوية والقيادة</span>
            <span className="text-emerald-400 font-bold hidden sm:inline">الربط المباشر فعّال ⚡</span>
          </div>
          <button
            onClick={onClose}
            className="flex items-center space-x-1.5 space-x-reverse bg-slate-800 hover:bg-rose-700 text-white border border-slate-700 hover:border-rose-600 px-4 py-2 rounded-xl font-bold transition-all text-xs cursor-pointer shadow-xs"
          >
            <X className="w-4 h-4 text-slate-300 group-hover:text-white" />
            <span>إغلاق النافذة</span>
          </button>
        </div>
      </div>
    </div>
  );
};
