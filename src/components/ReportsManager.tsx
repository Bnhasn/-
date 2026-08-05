import React, { useState } from 'react';
import {
  FileText,
  Printer,
  Download,
  Filter,
  ShieldCheck,
  Activity,
  DollarSign,
  Lock,
  Crosshair,
  Award,
  Users,
  Calendar
} from 'lucide-react';
import { PersonnelRecord, MilitaryRank, PersonnelStatus } from '../types';

interface ReportsManagerProps {
  personnel: PersonnelRecord[];
  onPrintReport: (reportTitle: string, data: PersonnelRecord[]) => void;
  onOpenDailyReadinessReport?: () => void;
}

export const ReportsManager: React.FC<ReportsManagerProps> = ({
  personnel,
  onPrintReport,
  onOpenDailyReadinessReport
}) => {
  const [reportType, setReportType] = useState<
    | 'comprehensive'
    | 'readiness'
    | 'daily'
    | 'medical'
    | 'financial'
    | 'security'
    | 'armament'
    | 'training'
    | 'absences'
  >('readiness');

  const [unitFilter, setUnitFilter] = useState('الكل');
  const [rankFilter, setRankFilter] = useState('الكل');
  const [statusFilter, setStatusFilter] = useState('الكل');

  // Filtered dataset for reports
  const reportData = personnel.filter((p) => {
    const matchesUnit = unitFilter === 'الكل' || p.unit === unitFilter;
    const matchesRank = rankFilter === 'الكل' || p.rank === rankFilter;
    const matchesStatus = statusFilter === 'الكل' || p.currentStatus === statusFilter;

    // Report type specific condition
    if (reportType === 'medical') {
      return matchesUnit && matchesRank && matchesStatus && p.logs.medical.length > 0;
    }
    if (reportType === 'security') {
      return matchesUnit && matchesRank && matchesStatus && p.logs.security.length > 0;
    }
    if (reportType === 'armament') {
      return matchesUnit && matchesRank && matchesStatus && p.logs.armament.length > 0;
    }
    if (reportType === 'training') {
      return matchesUnit && matchesRank && matchesStatus && p.logs.training.length > 0;
    }
    if (reportType === 'absences') {
      return (
        matchesUnit &&
        matchesRank &&
        matchesStatus &&
        ['إجازة', 'إذن', 'غياب', 'فرار', 'موقوف'].includes(p.currentStatus)
      );
    }

    return matchesUnit && matchesRank && matchesStatus;
  });

  // Unique units list
  const uniqueUnits = Array.from(new Set(personnel.map((p) => p.unit)));

  // Organized Export to CSV / Excel
  const exportToCSV = () => {
    const escapeField = (val: any) => {
      if (val === undefined || val === null) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const reportTitlesMap: Record<string, string> = {
      readiness: 'تقرير الجاهزية القتالية والحالة الفنية',
      daily: 'تقرير القوة اليومية والحضور الإجمالي',
      comprehensive: 'التقرير الشامل والأدوار الإدارية للأفراد',
      medical: 'التقرير الطبي والسجلات المرضية والمنومين',
      financial: 'التقرير المالي والحسابات والبدلات',
      security: 'التقرير الأمني والمخالفات العسكرية',
      armament: 'تقرير عُهد التسليح الشخصي والذخيرة',
      training: 'تقرير الدورات والتدريب الميداني والتقييم',
      absences: 'تقرير الإجازات والأذونات والغياب والفرار'
    };

    const currentTitle = reportTitlesMap[reportType] || 'تقرير عسكري منظم';
    const generationDate = new Date().toLocaleString('ar-SA');

    // Header metadata lines for clean document organization
    const metadataHeader = [
      escapeField(`الجمهورية اليمنيـة - قيادة اللواء / المنظومة الإدارية المركزية`),
      escapeField(`نوع التقرير: ${currentTitle}`),
      escapeField(`تاريخ ووقت التصدير: ${generationDate}`),
      escapeField(`إجمالي السجلات المسجلة: ${reportData.length} فرد`),
      escapeField(`درجة السرية: سري للغاية وللإستعمال الرسمـي فقط`),
      ''
    ].join('\n');

    let headers: string[] = [];
    let rows: string[][] = [];

    if (reportType === 'armament') {
      headers = ['الرقم الوظيفي', 'الاسم الرباعي', 'الرتبة', 'الوحدة', 'الحالة', 'السلاح المسند', 'الرقم التسلسلي S/N', 'كمية الذخيرة'];
      rows = reportData.map((p) => {
        const weapon = p.logs.armament[0];
        return [
          p.militaryId,
          p.fullName,
          p.rank,
          p.unit,
          p.currentStatus,
          weapon ? weapon.weaponType : 'غير مسند',
          weapon ? weapon.weaponSerial : '-',
          weapon ? `${weapon.ammoQty} طلقة` : '-'
        ];
      });
    } else if (reportType === 'medical') {
      headers = ['الرقم الوظيفي', 'الاسم الرباعي', 'الرتبة', 'الوحدة', 'الحالة الحالية', 'عدد السجلات الطبية', 'آخر حالة طبية / تشخيص', 'التوصية الطبية'];
      rows = reportData.map((p) => {
        const med = p.logs.medical[0];
        return [
          p.militaryId,
          p.fullName,
          p.rank,
          p.unit,
          p.currentStatus,
          String(p.logs.medical.length),
          med ? med.diagnosis : 'سليم معافى',
          med ? med.recommendations || med.notes || '-' : 'جاهزية قتالية كاملة'
        ];
      });
    } else if (reportType === 'absences') {
      headers = ['الرقم الوظيفي', 'الاسم الرباعي', 'الرتبة', 'الوحدة', 'الحالة الحالية', 'نوع الحركة الأخيرة', 'تاريخ الانتهاء', 'الجهة المعتمدة', 'ملاحظات وتفاصيل'];
      rows = reportData.map((p) => {
        const att = p.logs.attendance[0];
        return [
          p.militaryId,
          p.fullName,
          p.rank,
          p.unit,
          p.currentStatus,
          att ? att.type : p.currentStatus,
          att?.endDate || '-',
          att?.approvedBy || '-',
          att?.reason || '-'
        ];
      });
    } else {
      headers = ['الرقم الوظيفي', 'الاسم الرباعي', 'الرتبة', 'الرقم الوطني', 'الوحدة والكتيبة', 'السرية', 'الوظيفة العسكرية', 'الحالة الحالية', 'رقم الهاتف'];
      rows = reportData.map((p) => [
        p.militaryId,
        p.fullName,
        p.rank,
        p.nationalId,
        `${p.unit} / ${p.battalion}`,
        p.company,
        p.jobTitle || 'غير محدد',
        p.currentStatus,
        p.phone
      ]);
    }

    const csvDataRows = [
      headers.map(escapeField).join(','),
      ...rows.map((row) => row.map(escapeField).join(','))
    ].join('\n');

    const fullCsvContent = '\uFEFF' + metadataHeader + '\n' + csvDataRows;

    const blob = new Blob([fullCsvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${currentTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <span className="text-xl">📊</span>
            <h2 className="text-xl font-black text-slate-900 font-['Tajawal']">
              نظام التقارير الذكية والمستندات الرسمية
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            استخراج وعرض وتصدير التقارير الإدارية والعملياتية والطبية والمالية مع إمكانية التصدير والطباعة المباشرة
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onOpenDailyReadinessReport && (
            <button
              onClick={onOpenDailyReadinessReport}
              className="flex items-center space-x-1.5 space-x-reverse bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-500/50 px-4 py-2 rounded-xl text-xs font-black transition-all shadow-md cursor-pointer"
            >
              <Activity className="w-4 h-4 text-emerald-200 animate-pulse" />
              <span>توليد تقرير الجاهزية اليومي التلقائي (PDF) 📄</span>
            </button>
          )}

          <button
            onClick={exportToCSV}
            className="flex items-center space-x-1.5 space-x-reverse bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-700" />
            <span>تصدير Excel (CSV)</span>
          </button>

          <button
            onClick={() => onPrintReport(`تقرير ${reportType}`, reportData)}
            className="flex items-center space-x-1.5 space-x-reverse bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-extrabold transition-all shadow-sm cursor-pointer"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            <span>طباعة القائمة المحددة</span>
          </button>
        </div>
      </div>

      {/* Report Types Selector Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        
        <button
          onClick={() => setReportType('readiness')}
          className={`p-3 rounded-xl border text-right transition-all flex flex-col justify-between space-y-2 ${
            reportType === 'readiness'
              ? 'bg-emerald-700 border-emerald-800 text-white shadow-sm'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <ShieldCheck className={`w-4 h-4 ${reportType === 'readiness' ? 'text-emerald-200' : 'text-emerald-700'}`} />
            <span className="text-[10px] opacity-75 font-mono">رقم 01</span>
          </div>
          <span className="text-xs font-bold">تقرير الجاهزية القتالية</span>
        </button>

        <button
          onClick={() => setReportType('daily')}
          className={`p-3 rounded-xl border text-right transition-all flex flex-col justify-between space-y-2 ${
            reportType === 'daily'
              ? 'bg-emerald-700 border-emerald-800 text-white shadow-sm'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <Users className={`w-4 h-4 ${reportType === 'daily' ? 'text-blue-200' : 'text-blue-700'}`} />
            <span className="text-[10px] opacity-75 font-mono">رقم 02</span>
          </div>
          <span className="text-xs font-bold">تقرير القوة اليومية</span>
        </button>

        <button
          onClick={() => setReportType('comprehensive')}
          className={`p-3 rounded-xl border text-right transition-all flex flex-col justify-between space-y-2 ${
            reportType === 'comprehensive'
              ? 'bg-emerald-700 border-emerald-800 text-white shadow-sm'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <FileText className={`w-4 h-4 ${reportType === 'comprehensive' ? 'text-purple-200' : 'text-purple-700'}`} />
            <span className="text-[10px] opacity-75 font-mono">رقم 03</span>
          </div>
          <span className="text-xs font-bold">التقرير الشامل للأفراد</span>
        </button>

        <button
          onClick={() => setReportType('medical')}
          className={`p-3 rounded-xl border text-right transition-all flex flex-col justify-between space-y-2 ${
            reportType === 'medical'
              ? 'bg-emerald-700 border-emerald-800 text-white shadow-sm'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <Activity className={`w-4 h-4 ${reportType === 'medical' ? 'text-pink-200' : 'text-pink-700'}`} />
            <span className="text-[10px] opacity-75 font-mono">رقم 04</span>
          </div>
          <span className="text-xs font-bold">التقرير الطبي والمنومين</span>
        </button>

        <button
          onClick={() => setReportType('financial')}
          className={`p-3 rounded-xl border text-right transition-all flex flex-col justify-between space-y-2 ${
            reportType === 'financial'
              ? 'bg-emerald-700 border-emerald-800 text-white shadow-sm'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <DollarSign className={`w-4 h-4 ${reportType === 'financial' ? 'text-teal-200' : 'text-teal-700'}`} />
            <span className="text-[10px] opacity-75 font-mono">رقم 05</span>
          </div>
          <span className="text-xs font-bold">التقرير المالي والإجمالي</span>
        </button>

        <button
          onClick={() => setReportType('security')}
          className={`p-3 rounded-xl border text-right transition-all flex flex-col justify-between space-y-2 ${
            reportType === 'security'
              ? 'bg-emerald-700 border-emerald-800 text-white shadow-sm'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <Lock className={`w-4 h-4 ${reportType === 'security' ? 'text-rose-200' : 'text-rose-700'}`} />
            <span className="text-[10px] opacity-75 font-mono">رقم 06</span>
          </div>
          <span className="text-xs font-bold">التقرير الأمني والمخالفات</span>
        </button>

        <button
          onClick={() => setReportType('armament')}
          className={`p-3 rounded-xl border text-right transition-all flex flex-col justify-between space-y-2 ${
            reportType === 'armament'
              ? 'bg-emerald-700 border-emerald-800 text-white shadow-sm'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <Crosshair className={`w-4 h-4 ${reportType === 'armament' ? 'text-amber-200' : 'text-amber-700'}`} />
            <span className="text-[10px] opacity-75 font-mono">رقم 07</span>
          </div>
          <span className="text-xs font-bold">تقرير التسليح والذخيرة</span>
        </button>

        <button
          onClick={() => setReportType('training')}
          className={`p-3 rounded-xl border text-right transition-all flex flex-col justify-between space-y-2 ${
            reportType === 'training'
              ? 'bg-emerald-700 border-emerald-800 text-white shadow-sm'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <Award className={`w-4 h-4 ${reportType === 'training' ? 'text-purple-200' : 'text-purple-700'}`} />
            <span className="text-[10px] opacity-75 font-mono">رقم 08</span>
          </div>
          <span className="text-xs font-bold">تقرير التدريب والدورات</span>
        </button>

        <button
          onClick={() => setReportType('absences')}
          className={`p-3 rounded-xl border text-right transition-all flex flex-col justify-between space-y-2 col-span-2 sm:col-span-1 ${
            reportType === 'absences'
              ? 'bg-emerald-700 border-emerald-800 text-white shadow-sm'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <Calendar className={`w-4 h-4 ${reportType === 'absences' ? 'text-orange-200' : 'text-orange-700'}`} />
            <span className="text-[10px] opacity-75 font-mono">رقم 09</span>
          </div>
          <span className="text-xs font-bold">تقرير الغياب والإجازات والفرار</span>
        </button>

      </div>

      {/* Report Filter Controls */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-[11px] font-bold text-slate-600 mb-1">فلترة حسب الوحدة:</label>
          <select
            value={unitFilter}
            onChange={(e) => setUnitFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-emerald-600"
          >
            <option value="الكل">جميع الوحدات</option>
            {uniqueUnits.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-600 mb-1">فلترة حسب الرتبة:</label>
          <select
            value={rankFilter}
            onChange={(e) => setRankFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-emerald-600"
          >
            <option value="الكل">جميع الرتب</option>
            <option value="عقيد">عقيد</option>
            <option value="مقدم">مقدم</option>
            <option value="رائد">رائد</option>
            <option value="نقيب">نقيب</option>
            <option value="ملازم أول">ملازم أول</option>
            <option value="ملازم">ملازم</option>
            <option value="رئيس رقباء">رئيس رقباء</option>
            <option value="رقيب أول">رقيب أول</option>
            <option value="رقيب">رقيب</option>
            <option value="وكيل رقيب">وكيل رقيب</option>
            <option value="عريف">عريف</option>
            <option value="جندي أول">جندي أول</option>
            <option value="جندي">جندي</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-600 mb-1">فلترة حسب الحالة الحالية:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-emerald-600"
          >
            <option value="الكل">جميع الحالات</option>
            <option value="متواجد">متواجد</option>
            <option value="في الميدان">في الميدان</option>
            <option value="مأمورية">مأمورية</option>
            <option value="منتدب">منتدب (انتداب)</option>
            <option value="إجازة">إجازة</option>
            <option value="إذن">إذن</option>
            <option value="مستشفى">مستشفى</option>
            <option value="غياب">غياب</option>
            <option value="فرار">فرار</option>
            <option value="مأمورية">مأمورية</option>
            <option value="مفقود">مفقود</option>
            <option value="موقوف">موقوف</option>
            <option value="احتياط">احتياط</option>
          </select>
        </div>
      </div>

      {/* Generated Report View Container */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="text-xs font-bold text-slate-800">
            بيانات التقرير المستخرج ({reportData.length} سجل عسكري)
          </div>
          <span className="text-[11px] text-emerald-800 font-mono font-bold">
            تاريخ الاستخراج: {new Date().toISOString().split('T')[0]}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="px-3 py-2.5">الرقم الوظيفي</th>
                <th className="px-3 py-2.5">الاسم الرباعي</th>
                <th className="px-3 py-2.5">الرتبة</th>
                <th className="px-3 py-2.5">الوحدة / الكتيبة</th>
                <th className="px-3 py-2.5">الحالة الحالية</th>
                <th className="px-3 py-2.5">تفاصيل السجل المرفق</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reportData.map((p) => (
                <tr key={p.militaryId} className="hover:bg-slate-50">
                  <td className="px-3 py-2.5 font-mono text-emerald-800 font-bold">{p.militaryId}</td>
                  <td className="px-3 py-2.5 text-slate-900 font-bold">{p.fullName}</td>
                  <td className="px-3 py-2.5 font-extrabold text-slate-800">{p.rank}</td>
                  <td className="px-3 py-2.5 text-slate-700">{p.unit} ({p.battalion})</td>
                  <td className="px-3 py-2.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-emerald-800 border border-slate-200">
                      {p.currentStatus}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-slate-600 text-[11px]">
                    {reportType === 'medical' && p.logs.medical[0]?.diagnosis}
                    {reportType === 'security' && p.logs.security[0]?.violation}
                    {reportType === 'armament' && `${p.logs.armament[0]?.weaponType} (${p.logs.armament[0]?.weaponSerial})`}
                    {reportType === 'training' && p.logs.training[0]?.courseName}
                    {reportType === 'financial' && `${p.logs.financial.reduce((acc, f) => acc + f.amount, 0).toLocaleString()} ريال`}
                    {!['medical', 'security', 'armament', 'training', 'financial'].includes(reportType) && 'قيد مستند كامل'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
