import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  BrainCircuit,
  Sliders,
  Clock,
  Activity,
  Award,
  Users,
  Compass,
  Zap,
  ChevronRight,
  Filter,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';
import { PersonnelRecord } from '../types';
import {
  calculatePredictiveAnalytics,
  PredictiveEvent
} from '../utils/predictiveAnalytics';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';

interface PredictiveAnalyticsSectionProps {
  personnel: PersonnelRecord[];
  onSelectPersonnel?: (militaryId: string) => void;
}

export const PredictiveAnalyticsSection: React.FC<PredictiveAnalyticsSectionProps> = ({
  personnel,
  onSelectPersonnel,
}) => {
  // Scenario Simulator Controls State
  const [additionalLeavePercent, setAdditionalLeavePercent] = useState<number>(0);
  const [trainingRecallPercent, setTrainingRecallPercent] = useState<number>(0);
  const [reserveMobilizationCount, setReserveMobilizationCount] = useState<number>(0);

  // Active Filter for Upcoming Events Timeline
  const [eventFilter, setEventFilter] = useState<'all' | 'إجازة' | 'تدريب' | 'علاج/مستشفى' | 'مأمورية'>('all');

  // Active View Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'events' | 'units' | 'simulator'>('overview');

  // Calculate Reserve Count available
  const reservePersonnelCount = useMemo(
    () => personnel.filter((p) => p.currentStatus === 'احتياط').length,
    [personnel]
  );

  // Run Predictive Analytics Engine
  const report = useMemo(
    () =>
      calculatePredictiveAnalytics(personnel, {
        additionalLeavePercent,
        trainingRecallPercent,
        reserveMobilizationCount,
      }),
    [personnel, additionalLeavePercent, trainingRecallPercent, reserveMobilizationCount]
  );

  // Filtered Events
  const filteredEvents = useMemo(() => {
    if (eventFilter === 'all') return report.upcomingEvents;
    return report.upcomingEvents.filter((e) => e.eventType === eventFilter);
  }, [report.upcomingEvents, eventFilter]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 md:p-7 shadow-2xl text-slate-100 space-y-6">
      
      {/* Top Section Header with AI & Analytics Badges */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2 space-x-reverse">
            <span className="flex items-center space-x-1.5 space-x-reverse bg-emerald-950 text-emerald-400 border border-emerald-700/60 text-[11px] font-extrabold px-3 py-1 rounded-full shadow-xs">
              <BrainCircuit className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>محرك التحليل التنبؤي والاستشراف الذكي</span>
            </span>
            <span className="bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-bold px-2.5 py-1 rounded-full">
              توقعات 30 يوماً
            </span>
          </div>

          <h3 className="text-xl md:text-2xl font-black text-white font-['Tajawal'] flex items-center space-x-2.5 space-x-reverse">
            <Sparkles className="w-6 h-6 text-amber-400" />
            <span>التحليلات التنبؤية والتنبؤ بالجاهزية القتالية المستقبليّة</span>
          </h3>
          <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
            تحليل الاستحقاقات القادمة للإجازات، الدورات التدريبية الميدانية، المواعيد والتعافي الطبي، والمأموريات الاستطلاعية لاستشراف منحنى الجاهزية واتخاذ قرارات قيادية استباقية.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center bg-slate-950 p-1.5 rounded-2xl border border-slate-800 self-stretch lg:self-auto overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 space-x-reverse cursor-pointer whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>نظرة عامة والتوقعات</span>
          </button>

          <button
            onClick={() => setActiveTab('events')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 space-x-reverse cursor-pointer whitespace-nowrap ${
              activeTab === 'events'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>الأحداث القادمة ({report.upcomingEvents.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('units')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 space-x-reverse cursor-pointer whitespace-nowrap ${
              activeTab === 'units'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>مقارنة الوحدات</span>
          </button>

          <button
            onClick={() => setActiveTab('simulator')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 space-x-reverse cursor-pointer whitespace-nowrap ${
              activeTab === 'simulator'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>مُحاكي السيناريوهات</span>
          </button>
        </div>
      </div>

      {/* 3 Forecast Horizon Cards (7d, 14d, 30d) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* 7 Days Forecast */}
        <div className="bg-slate-950/80 border border-slate-800 hover:border-emerald-700/60 rounded-2xl p-4.5 transition-all relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 flex items-center space-x-1.5 space-x-reverse">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>المدى القريب (7 أيام)</span>
            </span>
            <span
              className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                report.horizon7d.riskLevel === 'مستقر وآمن'
                  ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                  : report.horizon7d.riskLevel === 'تنبيه متوسط'
                  ? 'bg-amber-950 text-amber-400 border-amber-800'
                  : 'bg-rose-950 text-rose-400 border-rose-800'
              }`}
            >
              {report.horizon7d.riskLevel}
            </span>
          </div>

          <div className="flex items-baseline justify-between my-2">
            <div>
              <div className="text-3xl font-black text-white font-['Tajawal']">
                {report.horizon7d.projectedPercent}%
              </div>
              <div className="text-[11px] text-slate-400 font-medium">
                جاهزية متوقعة ({report.horizon7d.projectedReadyCount} من {report.currentTotal})
              </div>
            </div>

            <div className={`flex items-center font-bold text-sm ${
              report.horizon7d.netDeltaPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {report.horizon7d.netDeltaPercent >= 0 ? (
                <ArrowUpRight className="w-4 h-4 ml-0.5" />
              ) : (
                <ArrowDownRight className="w-4 h-4 ml-0.5" />
              )}
              <span>{report.horizon7d.netDeltaPercent > 0 ? `+${report.horizon7d.netDeltaPercent}` : report.horizon7d.netDeltaPercent}%</span>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800/80 text-[11px] text-slate-300 space-y-1">
            <div className="flex justify-between">
              <span>إجازات قادمة:</span>
              <span className="font-bold text-amber-400">{report.horizon7d.upcomingLeavesCount} أفراد</span>
            </div>
            <div className="flex justify-between">
              <span>عودة متوقعة للجاهزية:</span>
              <span className="font-bold text-emerald-400">{report.horizon7d.returningPersonnelCount} أفراد</span>
            </div>
          </div>
        </div>

        {/* 14 Days Forecast */}
        <div className="bg-slate-950/80 border border-slate-800 hover:border-teal-700/60 rounded-2xl p-4.5 transition-all relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 flex items-center space-x-1.5 space-x-reverse">
              <Calendar className="w-4 h-4 text-teal-400" />
              <span>المدى المتوسط (14 يوماً)</span>
            </span>
            <span
              className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                report.horizon14d.riskLevel === 'مستقر وآمن'
                  ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                  : report.horizon14d.riskLevel === 'تنبيه متوسط'
                  ? 'bg-amber-950 text-amber-400 border-amber-800'
                  : 'bg-rose-950 text-rose-400 border-rose-800'
              }`}
            >
              {report.horizon14d.riskLevel}
            </span>
          </div>

          <div className="flex items-baseline justify-between my-2">
            <div>
              <div className="text-3xl font-black text-white font-['Tajawal']">
                {report.horizon14d.projectedPercent}%
              </div>
              <div className="text-[11px] text-slate-400 font-medium">
                جاهزية متوقعة ({report.horizon14d.projectedReadyCount} من {report.currentTotal})
              </div>
            </div>

            <div className={`flex items-center font-bold text-sm ${
              report.horizon14d.netDeltaPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {report.horizon14d.netDeltaPercent >= 0 ? (
                <ArrowUpRight className="w-4 h-4 ml-0.5" />
              ) : (
                <ArrowDownRight className="w-4 h-4 ml-0.5" />
              )}
              <span>{report.horizon14d.netDeltaPercent > 0 ? `+${report.horizon14d.netDeltaPercent}` : report.horizon14d.netDeltaPercent}%</span>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800/80 text-[11px] text-slate-300 space-y-1">
            <div className="flex justify-between">
              <span>دورات وتدريبات ميدانية:</span>
              <span className="font-bold text-sky-400">{report.horizon14d.upcomingTrainingCount} أفراد</span>
            </div>
            <div className="flex justify-between">
              <span>مراجعات/علاج طبي:</span>
              <span className="font-bold text-pink-400">{report.horizon14d.upcomingMedicalCount} أفراد</span>
            </div>
          </div>
        </div>

        {/* 30 Days Forecast */}
        <div className="bg-slate-950/80 border border-slate-800 hover:border-purple-700/60 rounded-2xl p-4.5 transition-all relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 flex items-center space-x-1.5 space-x-reverse">
              <Compass className="w-4 h-4 text-purple-400" />
              <span>المدى الممتد (30 يوماً)</span>
            </span>
            <span
              className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                report.horizon30d.riskLevel === 'مستقر وآمن'
                  ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                  : report.horizon30d.riskLevel === 'تنبيه متوسط'
                  ? 'bg-amber-950 text-amber-400 border-amber-800'
                  : 'bg-rose-950 text-rose-400 border-rose-800'
              }`}
            >
              {report.horizon30d.riskLevel}
            </span>
          </div>

          <div className="flex items-baseline justify-between my-2">
            <div>
              <div className="text-3xl font-black text-white font-['Tajawal']">
                {report.horizon30d.projectedPercent}%
              </div>
              <div className="text-[11px] text-slate-400 font-medium">
                جاهزية متوقعة ({report.horizon30d.projectedReadyCount} من {report.currentTotal})
              </div>
            </div>

            <div className={`flex items-center font-bold text-sm ${
              report.horizon30d.netDeltaPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {report.horizon30d.netDeltaPercent >= 0 ? (
                <ArrowUpRight className="w-4 h-4 ml-0.5" />
              ) : (
                <ArrowDownRight className="w-4 h-4 ml-0.5" />
              )}
              <span>{report.horizon30d.netDeltaPercent > 0 ? `+${report.horizon30d.netDeltaPercent}` : report.horizon30d.netDeltaPercent}%</span>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800/80 text-[11px] text-slate-300 space-y-1">
            <div className="flex justify-between">
              <span>إجمالي الأحداث المجدولة:</span>
              <span className="font-bold text-slate-200">{report.upcomingEvents.length} حدث مؤثّر</span>
            </div>
            <div className="flex justify-between">
              <span>الفارق التراكمي للجاهزية:</span>
              <span className="font-bold text-emerald-400">{report.horizon30d.netDeltaPercent}%</span>
            </div>
          </div>
        </div>

      </div>

      {/* Main Content View Switcher */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Recharts Area Curve: 30-Day Predictive Readiness Curve */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-800">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center space-x-2 space-x-reverse">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span>منحنى التنبؤ بالجاهزية القتالية التراكمي (30 يوماً)</span>
                </h4>
                <p className="text-[11px] text-slate-400">
                  تمثيل بياني مباشر لنسب الجاهزية المتوقعة وتأثير الاستحقاقات الزمانية للأفراد
                </p>
              </div>

              <div className="flex items-center space-x-2 space-x-reverse text-xs font-bold">
                <span className="flex items-center space-x-1.5 space-x-reverse text-emerald-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span>نسبة الجاهزية %</span>
                </span>
                <span className="flex items-center space-x-1.5 space-x-reverse text-amber-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <span>في الإجازات</span>
                </span>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={report.timelineSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorReadiness" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorLeaves" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="dateLabel" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="readinessPercent"
                    name="نسبة الجاهزية %"
                    stroke="#10b981"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorReadiness)"
                  />
                  <Area
                    type="monotone"
                    dataKey="onLeave"
                    name="الأفراد في الإجازات"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorLeaves)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Actionable Recommendations Section */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
              <h4 className="text-sm font-bold text-white flex items-center space-x-2 space-x-reverse">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>توصيات العمليات والاستجابة الاستباقية للقيادة</span>
              </h4>
              <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-800/80 px-2.5 py-0.5 rounded-full font-bold">
                تأثير عالي
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {report.recommendations.map((rec) => (
                <div
                  key={rec.id}
                  className={`p-4 rounded-xl border flex flex-col justify-between space-y-2 ${
                    rec.severity === 'high'
                      ? 'bg-rose-950/40 border-rose-800/60 text-rose-200'
                      : rec.severity === 'medium'
                      ? 'bg-amber-950/40 border-amber-800/60 text-amber-200'
                      : 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
                  }`}
                >
                  <div className="space-y-1">
                    <h5 className="text-xs font-bold flex items-center space-x-1.5 space-x-reverse">
                      <span>{rec.title}</span>
                    </h5>
                    <p className="text-[11px] opacity-90 leading-relaxed">{rec.description}</p>
                  </div>

                  <div className="pt-2 border-t border-white/10 text-[11px] font-semibold flex items-center space-x-1 space-x-reverse">
                    <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                    <span>{rec.actionText}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* Tab 2: Upcoming Events Feed */}
      {activeTab === 'events' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950 p-3 rounded-2xl border border-slate-800 text-xs">
            <div className="flex items-center space-x-2 space-x-reverse font-bold text-slate-300">
              <Filter className="w-4 h-4 text-emerald-400" />
              <span>تصنيف الأحداث:</span>
            </div>

            <div className="flex items-center space-x-1.5 space-x-reverse overflow-x-auto">
              <button
                onClick={() => setEventFilter('all')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  eventFilter === 'all'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                جميع الأحداث ({report.upcomingEvents.length})
              </button>

              <button
                onClick={() => setEventFilter('إجازة')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  eventFilter === 'إجازة'
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                الإجازات ({report.eventCountsByType.leaves})
              </button>

              <button
                onClick={() => setEventFilter('تدريب')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  eventFilter === 'تدريب'
                    ? 'bg-sky-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                التدريب والدورات ({report.eventCountsByType.training})
              </button>

              <button
                onClick={() => setEventFilter('علاج/مستشفى')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  eventFilter === 'علاج/مستشفى'
                    ? 'bg-pink-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                الميداني والعلاج ({report.eventCountsByType.medical})
              </button>

              <button
                onClick={() => setEventFilter('مأمورية')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  eventFilter === 'مأمورية'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                المأموريات والانتشار ({report.eventCountsByType.deployments})
              </button>
            </div>
          </div>

          {/* Events Grid / Table */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredEvents.map((evt) => (
              <div
                key={evt.id}
                className="bg-slate-950 border border-slate-800 hover:border-slate-700 p-4 rounded-2xl flex flex-col justify-between space-y-3 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span
                      className={`inline-block text-[10px] font-black px-2.5 py-0.5 rounded-md mb-1.5 ${
                        evt.eventType === 'إجازة'
                          ? 'bg-amber-950 text-amber-400 border border-amber-800'
                          : evt.eventType === 'تدريب'
                          ? 'bg-sky-950 text-sky-400 border border-sky-800'
                          : evt.eventType === 'علاج/مستشفى'
                          ? 'bg-pink-950 text-pink-400 border border-pink-800'
                          : 'bg-purple-950 text-purple-400 border border-purple-800'
                      }`}
                    >
                      {evt.eventType}
                    </span>
                    <h5 className="text-xs font-bold text-white line-clamp-1">{evt.title}</h5>
                  </div>

                  <span
                    className={`text-[11px] font-black px-2 py-0.5 rounded-md shrink-0 ${
                      evt.impactType === 'إيجابي'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-rose-950 text-rose-400 border border-rose-800'
                    }`}
                  >
                    {evt.impactPercentageDelta > 0 ? `+${evt.impactPercentageDelta}` : evt.impactPercentageDelta}%
                  </span>
                </div>

                <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 text-xs space-y-1">
                  <div className="font-bold text-emerald-300">
                    {evt.rank} • {evt.soldierName}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    الوحدة: <span className="text-slate-200">{evt.unit}</span> ({evt.militaryId})
                  </div>
                  <div className="text-[11px] text-slate-400">
                    الفترة: <span className="text-amber-300 font-mono">{evt.startDate}</span> ➔ <span className="text-amber-300 font-mono">{evt.endDate}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400">
                  <span>تفاصيل: {evt.details}</span>
                  {onSelectPersonnel && (
                    <button
                      onClick={() => onSelectPersonnel(evt.militaryId)}
                      className="text-emerald-400 hover:underline font-bold"
                    >
                      فتح الملف ➔
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* Tab 3: Unit-by-Unit Forecast */}
      {activeTab === 'units' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 pb-3 font-bold">
                  <th className="py-2.5 px-3">الوحدة العسكرية</th>
                  <th className="py-2.5 px-3">القوة الحالية</th>
                  <th className="py-2.5 px-3">الجاهزية الحالية</th>
                  <th className="py-2.5 px-3">توقع (7 أيام)</th>
                  <th className="py-2.5 px-3">توقع (14 يوماً)</th>
                  <th className="py-2.5 px-3">توقع (30 يوماً)</th>
                  <th className="py-2.5 px-3">تقييم المخاطر</th>
                  <th className="py-2.5 px-3">العامل المؤثر الرئيسي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {report.unitForecasts.map((uf) => (
                  <tr key={uf.unitName} className="hover:bg-slate-900/60 transition-colors">
                    <td className="py-3 px-3 font-bold text-white">{uf.unitName}</td>
                    <td className="py-3 px-3 text-slate-300">{uf.totalPersonnel} فرد</td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-emerald-400">{uf.currentPercent}%</div>
                      <div className="text-[10px] text-slate-500">{uf.currentReady} جاهز</div>
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-200">{uf.projected7dPercent}%</td>
                    <td className="py-3 px-3 font-bold text-slate-200">{uf.projected14dPercent}%</td>
                    <td className="py-3 px-3 font-bold text-emerald-300">{uf.projected30dPercent}%</td>
                    <td className="py-3 px-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          uf.riskLevel === 'منخفض'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : uf.riskLevel === 'متوسط'
                            ? 'bg-amber-950 text-amber-400 border border-amber-800'
                            : 'bg-rose-950 text-rose-400 border border-rose-800'
                        }`}
                      >
                        {uf.riskLevel}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-[11px] text-slate-400 max-w-xs leading-relaxed">
                      {uf.primaryFactor}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Interactive "What-If" Scenario Simulator */}
      {activeTab === 'simulator' && (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-6 animate-in fade-in duration-300">
          
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center space-x-2 space-x-reverse">
                <Sliders className="w-4 h-4 text-amber-400" />
                <span>مُحاكي اختبارات الإجهاد الاستباقية للقيادة (What-If Simulator)</span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                اختبار تأثير القرارات الإدارية والتعبوية قبل اعتمادها لملاحظة تأثيرها المباشر على منحنى الجاهزية.
              </p>
            </div>

            <button
              onClick={() => {
                setAdditionalLeavePercent(0);
                setTrainingRecallPercent(0);
                setReserveMobilizationCount(0);
              }}
              className="text-xs text-amber-400 hover:underline font-bold bg-amber-950/60 border border-amber-800/80 px-3 py-1 rounded-xl"
            >
              إعادة ضبط المحاكي ↺
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Slider 1: Additional Leave % */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-200">منح إجازات إضافية متوقعة:</span>
                <span className="text-amber-400 font-mono text-sm">+{additionalLeavePercent}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="25"
                step="5"
                value={additionalLeavePercent}
                onChange={(e) => setAdditionalLeavePercent(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <p className="text-[10px] text-slate-400">
                محاكاة منح نسبة إضافية من القوة إجازات استثنائية أو ميدانية.
              </p>
            </div>

            {/* Slider 2: Training Recall % */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-200">استدعاء المبكر للمتدربين:</span>
                <span className="text-sky-400 font-mono text-sm">{trainingRecallPercent}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="25"
                value={trainingRecallPercent}
                onChange={(e) => setTrainingRecallPercent(Number(e.target.value))}
                className="w-full accent-sky-500 cursor-pointer"
              />
              <p className="text-[10px] text-slate-400">
                قطع الدورات التدريبية الميدانية وإعادة المنتدبين فورياً للخدمة.
              </p>
            </div>

            {/* Slider 3: Mobilize Reserve */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-200">حشد وتعبئة قوة الاحتياط:</span>
                <span className="text-emerald-400 font-mono text-sm">+{reserveMobilizationCount} فرد</span>
              </div>
              <input
                type="range"
                min="0"
                max={Math.max(5, reservePersonnelCount)}
                step="1"
                value={reserveMobilizationCount}
                onChange={(e) => setReserveMobilizationCount(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <p className="text-[10px] text-slate-400">
                استدعاء أفراد قوة الاحتياط المتوفرين (المتوفر حالياً: {reservePersonnelCount} فرد).
              </p>
            </div>

          </div>

          {/* Simulator Result Banner */}
          <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 border border-emerald-600/50 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs text-emerald-400 font-bold flex items-center space-x-1.5 space-x-reverse">
                <CheckCircle2 className="w-4 h-4" />
                <span>النتيجة المحاكاة للجاهزية القتالية بعد تعديل المعايير</span>
              </div>
              <div className="text-sm font-bold text-white">
                نسبة الجاهزية المتوقعة بعد 30 يوماً:{' '}
                <span className="text-emerald-300 font-black text-lg">
                  {report.horizon30d.projectedPercent}%
                </span>{' '}
                <span className="text-xs text-slate-400 font-normal">
                  (الفارق عن الوضع الحالي: {report.horizon30d.netDeltaPercent}%)
                </span>
              </div>
            </div>

            <div className="text-center md:text-left">
              <span
                className={`text-xs font-black px-4 py-1.5 rounded-xl border inline-block ${
                  report.horizon30d.riskLevel === 'مستقر وآمن'
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                    : 'bg-amber-950 text-amber-300 border-amber-700'
                }`}
              >
                تقييم الأثر: {report.horizon30d.riskLevel}
              </span>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
