import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Shield,
  Printer,
  X,
  FileText,
  Activity,
  HeartPulse,
  Award,
  Repeat,
  Users,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  UserPlus,
  Crosshair,
  TrendingUp,
  FileSpreadsheet,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { PersonnelRecord, PersonnelStatus } from '../types';

interface DailyReadinessReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  personnel: PersonnelRecord[];
  currentAccountName?: string;
}

export const DailyReadinessReportModal: React.FC<DailyReadinessReportModalProps> = ({
  isOpen,
  onClose,
  personnel,
  currentAccountName = 'المنظومة المركزية لقوات الطوارئ'
}) => {
  if (!isOpen) return null;

  // Officer Signatures
  const [officer1Title, setOfficer1Title] = useState('رئيس شعبة التنظيم والإدارة');
  const [officer1Name, setOfficer1Name] = useState('عقيد / أحمد بن علي الحيمي');
  
  const [officer2Title, setOfficer2Title] = useState('رئيس أركان حرب الفرقة');
  const [officer2Name, setOfficer2Name] = useState('عميد / سلطان مبارك القحطاني');

  const [officer3Title, setOfficer3Title] = useState('قائد قوات الطوارئ اليمنية');
  const [officer3Name, setOfficer3Name] = useState('اللواء / عبدالكريم يحيى شرف الدين');

  const [reportDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [reportTime] = useState<string>(
    new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' })
  );

  // --- AUTOMATED DATA AGGREGATION ENGINE --- //
  const totalForce = personnel.length;

  const countStatus = (st: PersonnelStatus) =>
    personnel.filter((p) => p.currentStatus === st).length;

  const presentCount = countStatus('متواجد');
  const fieldCount = countStatus('في الميدان');
  const missionCount = countStatus('مأمورية');
  const leaveCount = countStatus('إجازة');
  const permissionCount = countStatus('إذن');
  const hospitalCount = countStatus('مستشفى');
  const absentCount = countStatus('غياب');
  const deserterCount = countStatus('فرار');
  const secondedCount = countStatus('منتدب');
  const detainedCount = countStatus('موقوف');
  const reserveCount = countStatus('احتياط');

  // Ready Forces Calculation
  const readyForces = presentCount + fieldCount + missionCount;
  const readinessPercentage =
    totalForce > 0 ? Math.round((readyForces / totalForce) * 100) : 0;

  // Medical Data Collection
  const hospitalPersonnel = personnel.filter(
    (p) => p.currentStatus === 'مستشفى' || p.logs?.medical?.some((m) => m.sickLeaveDays > 0)
  );

  const activeMedicalLeaves = personnel.reduce((acc, p) => {
    const activeLeaves = p.logs?.medical?.filter((m) => m.sickLeaveDays > 0) || [];
    return acc + activeLeaves.length;
  }, 0);

  const medicalUnfitCount = hospitalCount + activeMedicalLeaves;
  const medicalFitnessPercentage =
    totalForce > 0 ? Math.round(((totalForce - medicalUnfitCount) / totalForce) * 100) : 100;

  // Training Data Collection
  const activeTrainingPersonnel = personnel.filter((p) =>
    p.logs?.training?.some((t) => t.status === 'قيد التنفيذ' || t.status === 'مستمر')
  );

  const totalCompletedCourses = personnel.reduce((acc, p) => {
    const completed = p.logs?.training?.filter((t) => t.status === 'مكتملة') || [];
    return acc + completed.length;
  }, 0);

  const trainingReadinessPercentage =
    totalForce > 0
      ? Math.round(
          ((totalForce - (deserterCount + absentCount)) / totalForce) * 100
        )
      : 100;

  // Movement & Transfer Data Collection
  const movementLogsList = personnel.flatMap((p) =>
    (p.logs?.movement || []).map((m) => ({
      ...m,
      personName: p.fullName,
      personRank: p.rank,
      militaryId: p.militaryId,
      currentUnit: p.unit,
      currentBattalion: p.battalion
    }))
  );

  // Sort movement logs by date descending
  movementLogsList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const recentMovements = movementLogsList.slice(0, 15); // Top 15 recent movements

  // Armament Summary
  const armedPersonnelCount = personnel.filter((p) => p.logs?.armament && p.logs.armament.length > 0).length;
  const armamentPercentage = totalForce > 0 ? Math.round((armedPersonnelCount / totalForce) * 100) : 0;

  const handlePrint = () => {
    window.print();
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-md overflow-hidden print:p-0 print:bg-white print:static printable-modal-overlay">
      {/* Printable Document Modal Card */}
      <div className="bg-white text-slate-900 border border-slate-300 rounded-3xl max-w-5xl w-full shadow-2xl relative my-2 sm:my-4 max-h-[94vh] flex flex-col overflow-hidden print:max-h-none print:border-none print:shadow-none print:p-0 print:m-0 print:w-full printable-modal-card">
        
        {/* Screen Controls Header (Hidden during printing) */}
        <div className="sticky top-0 z-30 bg-slate-900 text-white p-3.5 sm:p-4 rounded-t-3xl border-b-2 border-emerald-500/80 shadow-md flex items-center justify-between gap-3 print:hidden no-print shrink-0">
          <div className="flex items-center space-x-2.5 space-x-reverse">
            <div className="p-2 bg-emerald-700 text-emerald-300 rounded-xl shrink-0">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-black font-['Tajawal'] text-amber-300">
                تقرير الجاهزية القتالية والطبية والتدريبية اليومي التلقائي
              </h2>
              <p className="text-[11px] text-slate-300 font-medium">
                تجميع وتوليد تلقائي للبيانات من السجلات الطبية والتدريبية وسجل الحركة والتنقلات
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 space-x-reverse shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-white border border-amber-500/50 font-extrabold px-3.5 py-2 rounded-xl text-xs transition-all shadow-md flex items-center space-x-1.5 space-x-reverse cursor-pointer"
              title="العودة للقائمة السابقة"
            >
              <ArrowRight className="w-4 h-4 text-amber-400" />
              <span>العودة للقائمة السابقة ↩️</span>
            </button>

            <button
              onClick={handlePrint}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-4 py-2 rounded-xl text-xs transition-all shadow-md cursor-pointer flex items-center space-x-1.5 space-x-reverse"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة وتصدير (PDF) 📄</span>
            </button>

            <button
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 cursor-pointer"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Document Body Container */}
        <div className="overflow-y-auto p-4 sm:p-6 md:p-8 flex-1 space-y-6">

        {/* Officer Signature Customizer Bar (Hidden during printing) */}
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-300 rounded-2xl p-4 mb-6 print:hidden shadow-xs font-['Cairo',sans-serif]">
          <div className="flex items-center space-x-2 space-x-reverse text-emerald-950 font-black text-xs mb-3">
            <UserPlus className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>تخصيص أسماء ورتب الضباط المعنيين باعتِماد وتوقيع تقرير الجاهزية اليومي:</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700">الضابط الأول (التنظيم والإدارة):</label>
              <input
                type="text"
                value={officer1Name}
                onChange={(e) => setOfficer1Name(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-900 font-bold focus:border-emerald-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700">الضابط الثاني (رئيس الأركان):</label>
              <input
                type="text"
                value={officer2Name}
                onChange={(e) => setOfficer2Name(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-900 font-bold focus:border-emerald-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700">الضابط الثالث (قائد الفرقة/القوات):</label>
              <input
                type="text"
                value={officer3Name}
                onChange={(e) => setOfficer3Name(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-900 font-bold focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* --- OFFICIAL PRINTABLE DOCUMENT BODY --- */}
        <div className="space-y-6 text-right font-['Cairo',sans-serif]">
          
          {/* Header Seal & Information */}
          <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
            <div>
              <h1 className="text-xl font-black text-slate-900 font-['Tajawal']">الجمهورية اليمنية - وزارة الدفاع</h1>
              <h2 className="text-sm font-black text-slate-800">قيادة قوات الطوارئ - قيادة أركان الحرب</h2>
              <p className="text-xs font-bold text-slate-600">{currentAccountName}</p>
            </div>

            <div className="text-center px-4">
              <div className="w-16 h-16 border-2 border-slate-900 rounded-full flex items-center justify-center mx-auto bg-slate-50 font-black text-[10px] text-slate-900 text-center leading-tight shadow-xs">
                قوات الطوارئ<br/>تقرير الجاهزية
              </div>
              <span className="text-[10px] text-red-700 font-black block mt-1">سري للغاية - يُحظر التداول</span>
            </div>

            <div className="text-left text-xs font-mono space-y-0.5">
              <div className="text-right">تاريخ التقرير: <strong className="font-bold text-slate-900">{reportDate}</strong></div>
              <div className="text-right">توقيت الاصدار: <strong className="font-bold text-slate-900">{reportTime}</strong></div>
              <div className="text-right">رقم المرجع: <strong className="font-bold text-slate-900">RDN-{reportDate.replace(/-/g, '')}-HQ</strong></div>
            </div>
          </div>

          {/* REPORT TITLE BANNER */}
          <div className="bg-slate-900 text-white rounded-2xl p-4 text-center space-y-1 shadow-md">
            <h3 className="text-base md:text-lg font-black font-['Tajawal'] tracking-wide">
              التقرير التلقائي الموحد للجاهزية القتالية والطبية والتدريبية وحركة القوة اليومية
            </h3>
            <p className="text-xs text-slate-300 font-bold">
              تجميع وتحليل فوري وشامل لقوة الفرقة الميدانية، السجلات الطبية والجاهزية، الدورات التدريبية، وسجل حركة التنقلات
            </p>
          </div>

          {/* 1. EXECUTIVE READINESS SUMMARY & STRENGTH BREAKDOWN */}
          <div className="border border-slate-300 rounded-2xl p-4 bg-slate-50 space-y-3 print:break-inside-avoid">
            <h4 className="text-xs font-black text-slate-900 border-b border-slate-300 pb-2 flex items-center justify-between">
              <div className="flex items-center space-x-1.5 space-x-reverse">
                <Activity className="w-4 h-4 text-emerald-700" />
                <span>أولاً: موقف القوة الإجمالية ونسبة الجاهزية القتالية والتسليح</span>
              </div>
              <span className="text-xs font-black text-emerald-800">
                نسبة الجاهزية القتالية: {readinessPercentage}%
              </span>
            </h4>

            {/* Main Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center">
              <div className="p-3 bg-white border border-slate-300 rounded-xl shadow-xs">
                <span className="text-[11px] font-bold text-slate-600 block">إجمالي القوة البشرية</span>
                <span className="text-lg font-black text-slate-900 font-mono">{totalForce}</span>
              </div>
              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl shadow-xs">
                <span className="text-[11px] font-bold text-emerald-800 block">القوة الجاهزة والقتالية</span>
                <span className="text-lg font-black text-emerald-800 font-mono">{readyForces}</span>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl shadow-xs">
                <span className="text-[11px] font-bold text-amber-800 block">الإجازات والأذونات</span>
                <span className="text-lg font-black text-amber-800 font-mono">{leaveCount + permissionCount}</span>
              </div>
              <div className="p-3 bg-red-50 border border-red-300 rounded-xl shadow-xs">
                <span className="text-[11px] font-bold text-red-800 block">الغياب والفرار</span>
                <span className="text-lg font-black text-red-800 font-mono">{absentCount + deserterCount}</span>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-300 rounded-xl shadow-xs">
                <span className="text-[11px] font-bold text-blue-800 block">جاهزية التسليح الشخصي</span>
                <span className="text-lg font-black text-blue-800 font-mono">{armamentPercentage}%</span>
              </div>
            </div>

            {/* Detailed Status Breakdown Grid */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-xs pt-2">
              <div className="border p-2 rounded-lg text-right">متواجد بالمعسكر: <strong className="font-mono">{presentCount}</strong></div>
              <div className="border p-2 rounded-lg text-right">في الميدان: <strong className="font-mono">{fieldCount}</strong></div>
              <div className="border p-2 rounded-lg text-right">مأمورية خارجية: <strong className="font-mono">{missionCount}</strong></div>
              <div className="border p-2 rounded-lg text-right">إجازة رسمية: <strong className="font-mono">{leaveCount}</strong></div>
              <div className="border p-2 rounded-lg text-right">إذن ساعة/يوم: <strong className="font-mono">{permissionCount}</strong></div>
              <div className="border p-2 rounded-lg text-right">مستشفى / منوم: <strong className="font-mono text-red-700">{hospitalCount}</strong></div>
              <div className="border p-2 rounded-lg text-right">غياب عن الخدمة: <strong className="font-mono text-red-700">{absentCount}</strong></div>
              <div className="border p-2 rounded-lg text-right">فرار من الخدمة: <strong className="font-mono text-red-700">{deserterCount}</strong></div>
              <div className="border p-2 rounded-lg text-right">منتدب لدى جهة: <strong className="font-mono">{secondedCount}</strong></div>
              <div className="border p-2 rounded-lg text-right">موقوف/توقيف: <strong className="font-mono">{detainedCount}</strong></div>
              <div className="border p-2 rounded-lg text-right">قوة احتياط: <strong className="font-mono">{reserveCount}</strong></div>
              <div className="border p-2 rounded-lg text-right font-bold text-emerald-800">نسبة التواجد: {totalForce > 0 ? Math.round(((presentCount + fieldCount) / totalForce) * 100) : 0}%</div>
            </div>
          </div>

          {/* 2. MEDICAL READINESS SECTION (تجميع البيانات الطبية) */}
          <div className="border border-slate-300 rounded-2xl p-4 space-y-3 print:break-inside-avoid">
            <h4 className="text-xs font-black text-slate-900 border-b border-slate-300 pb-2 flex items-center justify-between">
              <div className="flex items-center space-x-1.5 space-x-reverse">
                <HeartPulse className="w-4 h-4 text-emerald-700" />
                <span>ثانياً: موقف السجل الطبي واللياقة البدنية والراحة المرضية</span>
              </div>
              <span className="text-xs font-black text-emerald-800">
                مؤشر اللياقة والجاهزية الطبية: {medicalFitnessPercentage}%
              </span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs mb-2">
              <div className="bg-slate-50 p-2.5 rounded-xl border">
                إجمالي المنومين والمحولين للمستشفيات: <strong className="font-mono text-slate-900 font-black">{hospitalCount} فرد</strong>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border">
                حالات الراحة الطبية والإجازات المرضية النشطة: <strong className="font-mono text-slate-900 font-black">{activeMedicalLeaves} حالة</strong>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border">
                القوة اللائقة طبياً للخدمة الشاقة: <strong className="font-mono text-emerald-800 font-black">{totalForce - medicalUnfitCount} فرد</strong>
              </div>
            </div>

            {hospitalPersonnel.length === 0 ? (
              <p className="text-xs text-slate-500 font-bold py-2 text-center">لا توجد حالات تنويم أو إصابات مرضية حرجة مسجلة اليوم.</p>
            ) : (
              <table className="w-full text-right text-xs border border-slate-300">
                <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-300">
                  <tr>
                    <th className="p-2 border-l">الرقم العسكري</th>
                    <th className="p-2 border-l">الرتبة والاسم الكامل</th>
                    <th className="p-2 border-l">الوحدة والكتيبة</th>
                    <th className="p-2 border-l">التشخيص الطبي / الحالة</th>
                    <th className="p-2 border-l">المستشفى / العيادة</th>
                    <th className="p-2">الراحة المرضية والوصفة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {hospitalPersonnel.slice(0, 10).map((p) => {
                    const lastMed = p.logs?.medical?.[0];
                    return (
                      <tr key={p.id}>
                        <td className="p-2 border-l font-mono text-slate-900 font-bold">{p.militaryId}</td>
                        <td className="p-2 border-l font-bold text-slate-900">{p.rank} / {p.fullName}</td>
                        <td className="p-2 border-l text-slate-700">{p.unit} - {p.battalion}</td>
                        <td className="p-2 border-l font-bold text-red-800">{lastMed?.diagnosis || p.currentStatus}</td>
                        <td className="p-2 border-l text-slate-800">{lastMed?.hospital || 'المستشفى العسكري'}</td>
                        <td className="p-2 text-slate-700 text-[11px]">{lastMed?.sickLeaveDays ? `${lastMed.sickLeaveDays} أيام راحة` : 'متابعة طبية'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* 3. TRAINING READINESS SECTION (تجميع البيانات التدريبية) */}
          <div className="border border-slate-300 rounded-2xl p-4 space-y-3 print:break-inside-avoid">
            <h4 className="text-xs font-black text-slate-900 border-b border-slate-300 pb-2 flex items-center justify-between">
              <div className="flex items-center space-x-1.5 space-x-reverse">
                <Award className="w-4 h-4 text-emerald-700" />
                <span>ثالثاً: موقف التأهيل التدريبي والدورات القتالية القائمة</span>
              </div>
              <span className="text-xs font-black text-emerald-800">
                نسبة التأهيل الميداني: {trainingReadinessPercentage}%
              </span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs mb-2">
              <div className="bg-slate-50 p-2.5 rounded-xl border">
                الأفراد المشاركين بالدورات القائمة حالياً: <strong className="font-mono text-slate-900 font-black">{activeTrainingPersonnel.length} فرد</strong>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border">
                إجمالي الشهادات والدورات المكتملة: <strong className="font-mono text-slate-900 font-black">{totalCompletedCourses} دورة</strong>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border">
                مستوى التأهيل والتأهب الميداني: <strong className="text-emerald-800 font-black">عالي ومكتمل</strong>
              </div>
            </div>

            {activeTrainingPersonnel.length === 0 ? (
              <p className="text-xs text-slate-500 font-bold py-2 text-center">لا توجد دورات تدريبية ميدانية جارية في الوقت الحالي.</p>
            ) : (
              <table className="w-full text-right text-xs border border-slate-300">
                <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-300">
                  <tr>
                    <th className="p-2 border-l">الرقم العسكري</th>
                    <th className="p-2 border-l">الرتبة والاسم الكامل</th>
                    <th className="p-2 border-l">اسم الدورة التدريبية</th>
                    <th className="p-2 border-l">مقر التدريب</th>
                    <th className="p-2 border-l">فترة الدورة</th>
                    <th className="p-2">الحالة والتقييم</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {activeTrainingPersonnel.slice(0, 10).map((p) => {
                    const activeCourse = p.logs?.training?.find((t) => t.status === 'قيد التنفيذ' || t.status === 'مستمر');
                    return (
                      <tr key={p.id}>
                        <td className="p-2 border-l font-mono text-slate-900 font-bold">{p.militaryId}</td>
                        <td className="p-2 border-l font-bold text-slate-900">{p.rank} / {p.fullName}</td>
                        <td className="p-2 border-l font-bold text-emerald-800">{activeCourse?.courseName || 'دورة قتالية'}</td>
                        <td className="p-2 border-l text-slate-800">{activeCourse?.provider || 'معهد القوات'}</td>
                        <td className="p-2 border-l font-mono text-[11px]">{activeCourse?.startDate} - {activeCourse?.endDate}</td>
                        <td className="p-2 font-bold text-slate-700">{activeCourse?.status || 'مستمرة'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* 4. MOVEMENT & TRANSFERS SECTION (سجل الحركة والتنقلات والتعيينات) */}
          <div className="border border-slate-300 rounded-2xl p-4 space-y-3 print:break-inside-avoid">
            <h4 className="text-xs font-black text-slate-900 border-b border-slate-300 pb-2 flex items-center justify-between">
              <div className="flex items-center space-x-1.5 space-x-reverse">
                <Repeat className="w-4 h-4 text-emerald-700" />
                <span>رابعاً: سجل حركة التنقلات بين الكتيبات والترقيات والأوامر الإدارية الحديثة</span>
              </div>
              <span className="text-[10px] font-bold text-slate-500">
                إجمالي الحركات المقيدة: ({movementLogsList.length})
              </span>
            </h4>

            {recentMovements.length === 0 ? (
              <p className="text-xs text-slate-500 font-bold py-2 text-center">لا توجد تنقلات إدارية أو تغييرات في الكتيبات والسرايا مسجلة مؤخراً.</p>
            ) : (
              <table className="w-full text-right text-xs border border-slate-300">
                <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-300">
                  <tr>
                    <th className="p-2 border-l">التاريخ</th>
                    <th className="p-2 border-l">الفرد والكتيبة الحالية</th>
                    <th className="p-2 border-l">نوع الحركة</th>
                    <th className="p-2 border-l">من وحدة/كتيبة</th>
                    <th className="p-2 border-l">إلى وحدة/كتيبة</th>
                    <th className="p-2">تفاصيل وأسباب الحركة والجهة المصدرة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {recentMovements.map((m, idx) => (
                    <tr key={`${m.id}-${idx}`}>
                      <td className="p-2 border-l font-mono text-slate-900 font-bold">{m.date}</td>
                      <td className="p-2 border-l font-bold text-slate-900">
                        {m.personRank} / {m.personName} ({m.militaryId})
                      </td>
                      <td className="p-2 border-l font-bold text-emerald-800">{m.type}</td>
                      <td className="p-2 border-l text-slate-800">{m.fromUnit || '-'}</td>
                      <td className="p-2 border-l font-bold text-slate-900">{m.toUnit || '-'}</td>
                      <td className="p-2 text-slate-700 text-[11px]">{m.reason || m.orderReference || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* OFFICIAL SIGNATURES & ENDORSEMENT BLOCK */}
          <div className="pt-8 border-t-2 border-slate-900 grid grid-cols-3 gap-6 text-center text-xs font-bold text-slate-900 signature-block print:break-inside-avoid">
            <div className="space-y-3">
              <p className="font-black text-slate-900">{officer1Title}</p>
              <p className="font-bold text-slate-800 text-xs">{officer1Name}</p>
              <p className="text-[10px] text-slate-400 font-mono">التوقيع: ....................</p>
            </div>
            <div className="space-y-3">
              <p className="font-black text-slate-900">{officer2Title}</p>
              <p className="font-bold text-slate-800 text-xs">{officer2Name}</p>
              <p className="text-[10px] text-slate-400 font-mono">المصادقة والختم: ....................</p>
            </div>
            <div className="space-y-3">
              <p className="font-black text-slate-900">{officer3Title}</p>
              <p className="font-bold text-slate-800 text-xs">{officer3Name}</p>
              <p className="text-[10px] text-slate-400 font-mono">التوقيع والخاتم الرسمي: ....................</p>
            </div>
          </div>

        </div>

        </div>

        {/* Floating Sticky Bottom Bar for Quick Return & Print */}
        <div className="sticky bottom-0 z-30 bg-slate-950 text-white p-3.5 rounded-b-3xl border-t-2 border-emerald-500/80 shadow-2xl flex items-center justify-between gap-3 print:hidden no-print backdrop-blur-md shrink-0 font-['Cairo',sans-serif]">
          <div className="flex items-center space-x-2 space-x-reverse text-xs text-slate-300 font-medium">
            <Printer className="w-4 h-4 text-emerald-400" />
            <span className="font-bold hidden sm:inline text-amber-300 font-['Tajawal']">تقرير الجاهزية القتالية اليومي</span>
          </div>

          <div className="flex items-center space-x-2 space-x-reverse">
            <button
              type="button"
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-white border border-amber-500/50 font-extrabold px-4 py-2 rounded-xl text-xs transition-all shadow-md flex items-center space-x-1.5 space-x-reverse cursor-pointer"
              title="العودة للقائمة السابقة"
            >
              <ArrowRight className="w-4 h-4 text-amber-400" />
              <span>العودة للقائمة السابقة ↩️</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-5 py-2 rounded-xl text-xs transition-all shadow-md cursor-pointer flex items-center space-x-1.5 space-x-reverse"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة وتصدير (PDF) 📄</span>
            </button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
};
