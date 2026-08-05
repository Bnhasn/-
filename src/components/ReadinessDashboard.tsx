import React from 'react';
import {
  ShieldCheck,
  Users,
  CheckCircle2,
  Crosshair,
  Calendar,
  Clock,
  Activity,
  AlertCircle,
  XCircle,
  Compass,
  HelpCircle,
  Lock,
  Archive,
  ArrowUpRight,
  TrendingUp,
  Radio,
  ExternalLink,
  FileSpreadsheet
} from 'lucide-react';
import { PersonnelRecord, PersonnelStatus, DepartmentRole } from '../types';
import { PredictiveAnalyticsSection } from './PredictiveAnalyticsSection';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';

interface ReadinessDashboardProps {
  personnel: PersonnelRecord[];
  onSelectPersonnel: (militaryId: string) => void;
  onQuickStatusChange: (militaryId: string, newStatus: PersonnelStatus) => void;
  onOpenExcelImport?: () => void;
  onOpenDailyReadinessReport?: () => void;
  currentRole: DepartmentRole;
}

export const ReadinessDashboard: React.FC<ReadinessDashboardProps> = ({
  personnel,
  onSelectPersonnel,
  onQuickStatusChange,
  onOpenExcelImport,
  onOpenDailyReadinessReport,
  currentRole
}) => {
  const total = personnel.length;

  const countByStatus = (st: PersonnelStatus) =>
    personnel.filter((p) => p.currentStatus === st).length;

  const present = countByStatus('متواجد');
  const field = countByStatus('في الميدان');
  const leave = countByStatus('إجازة');
  const permission = countByStatus('إذن');
  const hospital = countByStatus('مستشفى');
  const absent = countByStatus('غياب');
  const deserter = countByStatus('فرار');
  const mission = countByStatus('مأمورية');
  const missing = countByStatus('مفقود');
  const detained = countByStatus('موقوف');
  const reserve = countByStatus('احتياط');
  const seconded = countByStatus('منتدب');

  // Combat readiness ratio: Ready forces (Present + Field + Mission) / Total Force
  const readyCount = present + field + mission;
  const readinessPercent = total > 0 ? Math.round((readyCount / total) * 1000) / 10 : 0;

  // Data for Recharts Pie Chart
  const statusPieData = [
    { name: 'متواجد', value: present, color: '#10b981' },
    { name: 'في الميدان', value: field, color: '#059669' },
    { name: 'مأمورية', value: mission, color: '#0284c7' },
    { name: 'منتدب', value: seconded, color: '#a855f7' },
    { name: 'إجازة', value: leave, color: '#eab308' },
    { name: 'إذن', value: permission, color: '#f59e0b' },
    { name: 'مستشفى', value: hospital, color: '#ec4899' },
    { name: 'غياب', value: absent, color: '#f97316' },
    { name: 'فرار', value: deserter, color: '#ef4444' },
    { name: 'مفقود', value: missing, color: '#881337' },
    { name: 'موقوف', value: detained, color: '#6b7280' },
    { name: 'احتياط', value: reserve, color: '#6366f1' }
  ].filter((d) => d.value > 0);

  // Group strength by Unit for Bar Chart
  const unitsMap: Record<string, { unit: string; ready: number; away: number; total: number }> = {};
  personnel.forEach((p) => {
    const unitName = p.unit || 'غير محدد';
    if (!unitsMap[unitName]) {
      unitsMap[unitName] = { unit: unitName, ready: 0, away: 0, total: 0 };
    }
    unitsMap[unitName].total += 1;
    if (['متواجد', 'في الميدان', 'مأمورية'].includes(p.currentStatus)) {
      unitsMap[unitName].ready += 1;
    } else {
      unitsMap[unitName].away += 1;
    }
  });

  const unitChartData = Object.values(unitsMap);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner: Real-time Readiness Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-emerald-950/80 to-slate-900 border border-emerald-800/40 p-6 shadow-2xl">
        <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          
          <div className="space-y-2">
            <div className="flex items-center space-x-2 space-x-reverse">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-black tracking-wider uppercase text-emerald-400 bg-emerald-950/90 border border-emerald-800 px-2.5 py-1 rounded-md">
                لوحة التحكم المباشرة - الجاهزية اللحظية
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-black text-white font-['Tajawal']">
              حالة القوة البشرية والجاهزية القتالية للقوات
            </h2>
            <p className="text-xs md:text-sm text-slate-300 max-w-2xl leading-relaxed">
              تحديث مباشر وتلقائي لجميع السجلات الإدارية، الطبية، المالية، والتسليحية. يتم تحويل حالة الأفراد آلياً فور إصدار الإجازات، المأموريات، أو التنويم.
            </p>

            {onOpenDailyReadinessReport && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onOpenDailyReadinessReport}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs transition-all shadow-lg hover:shadow-emerald-500/20 flex items-center space-x-2 space-x-reverse cursor-pointer border border-emerald-400/50"
                >
                  <Activity className="w-4 h-4 text-emerald-200" />
                  <span>توليد تقرير الجاهزية اليومي التلقائي (PDF) 📄</span>
                </button>
              </div>
            )}
          </div>

          {/* Big Readiness Percentage Badge */}
          <div className="bg-slate-950/90 border border-emerald-500/40 rounded-2xl p-4 md:p-6 text-center shadow-2xl min-w-[220px] backdrop-blur-md">
            <div className="text-xs font-bold text-slate-400 mb-1 flex items-center justify-center space-x-1 space-x-reverse">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>نسبة الجاهزية القتالية الإجمالية</span>
            </div>
            <div className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200 my-1 font-['Tajawal']">
              {readinessPercent}%
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2.5 mt-2 overflow-hidden border border-slate-700">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-1000"
                style={{ width: `${Math.min(readinessPercent, 100)}%` }}
              ></div>
            </div>
            <span className="text-[11px] text-emerald-400 font-medium mt-2 inline-block">
              {readyCount} من إجمالي {total} في حالة استعداد قتالي
            </span>
          </div>

        </div>
      </div>

      {/* Grid of 12 Metric Cards representing Military Statuses */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
        
        {/* Total Force */}
        <div className="bg-white border border-slate-200 border-t-4 border-t-slate-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1.5 font-bold">
            <span>إجمالي القوة</span>
            <Users className="w-4 h-4 text-slate-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-['Tajawal']">{total}</div>
          <p className="text-[10px] text-slate-500 mt-1">سجل القوة الكلية</p>
        </div>

        {/* Present (متواجد) */}
        <div className="bg-white border border-slate-200 border-t-4 border-t-emerald-600 rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-emerald-700 text-xs mb-1.5 font-bold">
            <span>القوة المتواجدة</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 font-['Tajawal']">{present}</div>
          <p className="text-[10px] text-slate-500 mt-1">بالثكنات والمقرات</p>
        </div>

        {/* Field (في الميدان) */}
        <div className="bg-white border border-slate-200 border-t-4 border-t-teal-600 rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-teal-700 text-xs mb-1.5 font-bold">
            <span>في الميدان</span>
            <Crosshair className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-bold text-teal-700 font-['Tajawal']">{field}</div>
          <p className="text-[10px] text-slate-500 mt-1">مواقع انتشارات عملياتية</p>
        </div>

        {/* Missions (مأمورية) */}
        <div className="bg-white border border-slate-200 border-t-4 border-t-sky-600 rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-sky-700 text-xs mb-1.5 font-bold">
            <span>المأموريات</span>
            <Radio className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-bold text-sky-700 font-['Tajawal']">{mission}</div>
          <p className="text-[10px] text-slate-500 mt-1">مهام رسمية خارجية</p>
        </div>

        {/* Seconded (منتدب) */}
        <div className="bg-white border border-slate-200 border-t-4 border-t-purple-600 rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-purple-700 text-xs mb-1.5 font-bold">
            <span>منتدب (انتداب)</span>
            <Compass className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-purple-700 font-['Tajawal']">{seconded}</div>
          <p className="text-[10px] text-slate-500 mt-1">انتداب لدى جهة أخرى</p>
        </div>

        {/* Leaves (إجازة) */}
        <div className="bg-white border border-slate-200 border-t-4 border-t-amber-500 rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-amber-700 text-xs mb-1.5 font-bold">
            <span>في الإجازات</span>
            <Calendar className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-700 font-['Tajawal']">{leave}</div>
          <p className="text-[10px] text-slate-500 mt-1">إجازات سنوية وميدانية</p>
        </div>

        {/* Permissions (إذن) */}
        <div className="bg-white border border-slate-200 border-t-4 border-t-yellow-500 rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-yellow-700 text-xs mb-1.5 font-bold">
            <span>في الأذونات</span>
            <Clock className="w-4 h-4 text-yellow-600" />
          </div>
          <div className="text-2xl font-bold text-yellow-700 font-['Tajawal']">{permission}</div>
          <p className="text-[10px] text-slate-500 mt-1">أذونات زمنية مؤقتة</p>
        </div>

        {/* Hospital (مستشفى) */}
        <div className="bg-white border border-slate-200 border-t-4 border-t-pink-600 rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-pink-700 text-xs mb-1.5 font-bold">
            <span>في المستشفى</span>
            <Activity className="w-4 h-4 text-pink-600" />
          </div>
          <div className="text-2xl font-bold text-pink-700 font-['Tajawal']">{hospital}</div>
          <p className="text-[10px] text-slate-500 mt-1">منومين وعلاج طبي</p>
        </div>

        {/* Absent (غياب) */}
        <div className="bg-white border border-slate-200 border-t-4 border-t-orange-500 rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-orange-700 text-xs mb-1.5 font-bold">
            <span>الغياب</span>
            <AlertCircle className="w-4 h-4 text-orange-600" />
          </div>
          <div className="text-2xl font-bold text-orange-700 font-['Tajawal']">{absent}</div>
          <p className="text-[10px] text-slate-500 mt-1">تغيب بدون عذر رسمي</p>
        </div>

        {/* Deserter (فرار) */}
        <div className="bg-white border border-slate-200 border-t-4 border-t-red-600 rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-red-700 text-xs mb-1.5 font-bold">
            <span>حالات الفرار</span>
            <XCircle className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-bold text-red-700 font-['Tajawal']">{deserter}</div>
          <p className="text-[10px] text-red-600 mt-1 font-semibold">مطلوبون للنيابة العسكرية</p>
        </div>

        {/* Missing (مفقود) */}
        <div className="bg-white border border-slate-200 border-t-4 border-t-purple-600 rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-purple-700 text-xs mb-1.5 font-bold">
            <span>المفقودون</span>
            <HelpCircle className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-purple-700 font-['Tajawal']">{missing}</div>
          <p className="text-[10px] text-slate-500 mt-1">أثناء العمليات والمطاردات</p>
        </div>

        {/* Detained (موقوف) */}
        <div className="bg-white border border-slate-200 border-t-4 border-t-slate-600 rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-700 text-xs mb-1.5 font-bold">
            <span>الموقوفون</span>
            <Lock className="w-4 h-4 text-slate-600" />
          </div>
          <div className="text-2xl font-bold text-slate-800 font-['Tajawal']">{detained}</div>
          <p className="text-[10px] text-slate-500 mt-1">احتجاز بالشرطة العسكرية</p>
        </div>

        {/* Reserve (احتياط) */}
        <div className="bg-white border border-slate-200 border-t-4 border-t-indigo-600 rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-indigo-700 text-xs mb-1.5 font-bold">
            <span>قوة الاحتياط</span>
            <Archive className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-indigo-700 font-['Tajawal']">{reserve}</div>
          <p className="text-[10px] text-slate-500 mt-1">جاهز للاستدعاء الفوري</p>
        </div>

      </div>

      {/* Integrated Predictive Analytics Engine & Forecasting Section */}
      <PredictiveAnalyticsSection
        personnel={personnel}
        onSelectPersonnel={onSelectPersonnel}
      />

      {/* Visual Charts & Quick Status Changer Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Status Distribution Pie Chart */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2 space-x-reverse">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>توزيع القوة البشرية حسب الحالة</span>
            </h3>
            <span className="text-[11px] text-slate-500 font-semibold">إحصاء دقيق</span>
          </div>

          <div className="h-56 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {statusPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2 text-[11px]">
            {statusPieData.slice(0, 6).map((st) => (
              <div key={st.name} className="flex items-center justify-between bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
                <span className="flex items-center space-x-1.5 space-x-reverse">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: st.color }}></span>
                  <span className="text-slate-700 font-medium">{st.name}</span>
                </span>
                <span className="font-bold text-slate-900">{st.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Readiness by Military Unit Bar Chart */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm lg:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2 space-x-reverse">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span>مقارنة جاهزية الوحدات العسكرية الرئيسية</span>
            </h3>
            <span className="text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-bold">
              جاهزية القوة
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={unitChartData}>
                <XAxis dataKey="unit" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#fff' }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="ready" name="جاهز قتالياً (متواجد/ميدان/مأمورية)" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="away" name="غير متواجد (إجازات/علاج/فرار/غيرها)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Quick Action List: Personnel Status Instant Changer */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2 space-x-reverse">
              <Radio className="w-5 h-5 text-emerald-600" />
              <span>التحديث السريع للحالة العسكرية والتأثير الفوري على الجاهزية</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              غيّر حالة أي فرد مباشرة لتبديل جاهزيته اللحظية أو رفع كشف إكسل كامل للتحديث الجماعي.
            </p>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            {onOpenExcelImport && (
              <button
                type="button"
                onClick={onOpenExcelImport}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center space-x-1.5 space-x-reverse cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-white" />
                <span>رفع تحديث الجاهزية إكسل 📊</span>
              </button>
            )}
            <span className="text-xs text-slate-700 font-bold bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl">
              الفرع: {currentRole}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {personnel.slice(0, 6).map((p) => (
            <div
              key={p.militaryId}
              className="bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl p-3 flex flex-col justify-between transition-all space-y-2.5"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2.5 space-x-reverse">
                  <img
                    src={p.photoUrl}
                    alt={p.fullName}
                    className="w-10 h-10 rounded-lg object-cover border border-slate-300 shadow-sm"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-900 line-clamp-1">{p.fullName}</div>
                    <div className="text-[11px] text-emerald-700 font-bold">
                      {p.rank} • {p.militaryId}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onSelectPersonnel(p.militaryId)}
                  className="p-1.5 text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors shadow-xs"
                  title="فتح الملف الإلكتروني الشامل"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
                <span className="text-[11px] text-slate-600 font-medium">{p.unit}</span>
                
                {/* Status Switcher Select */}
                <select
                  value={p.currentStatus}
                  onChange={(e) => onQuickStatusChange(p.militaryId, e.target.value as PersonnelStatus)}
                  className={`text-[11px] font-bold px-2 py-1 rounded-lg border focus:outline-none transition-colors ${
                    ['متواجد', 'في الميدان'].includes(p.currentStatus)
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : ['إجازة', 'إذن', 'مأمورية'].includes(p.currentStatus)
                      ? 'bg-amber-50 text-amber-800 border-amber-300'
                      : ['مستشفى'].includes(p.currentStatus)
                      ? 'bg-pink-50 text-pink-800 border-pink-300'
                      : 'bg-rose-50 text-rose-800 border-rose-300'
                  }`}
                >
                  <option value="متواجد">متواجد</option>
                  <option value="في الميدان">في الميدان</option>
                  <option value="مأمورية">مأمورية</option>
                  <option value="منتدب">منتدب (انتداب)</option>
                  <option value="إجازة">إجازة</option>
                  <option value="إذن">إذن</option>
                  <option value="مستشفى">مستشفى</option>
                  <option value="غياب">غياب</option>
                  <option value="فرار">فرار</option>
                  <option value="مفقود">مفقود</option>
                  <option value="موقوف">موقوف</option>
                  <option value="احتياط">احتياط</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
