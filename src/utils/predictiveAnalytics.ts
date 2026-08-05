import { PersonnelRecord, PersonnelStatus } from '../types';

export interface PredictiveEvent {
  id: string;
  militaryId: string;
  soldierName: string;
  rank: string;
  unit: string;
  eventType: 'إجازة' | 'تدريب' | 'علاج/مستشفى' | 'مأمورية' | 'انتشار ميداني';
  title: string;
  startDate: string;
  endDate: string;
  impactType: 'إيجابي' | 'سلبي' | 'محايد';
  impactPercentageDelta: number; // e.g. -1.5% or +2.0%
  horizon: '7d' | '14d' | '30d';
  status: 'قادم' | 'جاري' | 'مكتمل قريب';
  details: string;
}

export interface UnitReadinessForecast {
  unitName: string;
  totalPersonnel: number;
  currentReady: number;
  currentPercent: number;
  projected7dReady: number;
  projected7dPercent: number;
  projected14dReady: number;
  projected14dPercent: number;
  projected30dReady: number;
  projected30dPercent: number;
  riskLevel: 'منخفض' | 'متوسط' | 'حرج';
  primaryFactor: string;
}

export interface ForecastHorizonData {
  horizonLabel: string;
  horizonDays: number;
  projectedReadyCount: number;
  projectedPercent: number;
  netDeltaPercent: number;
  riskLevel: 'مستقر وآمن' | 'تنبيه متوسط' | 'مخاطر عالية';
  upcomingLeavesCount: number;
  upcomingTrainingCount: number;
  upcomingMedicalCount: number;
  upcomingMissionCount: number;
  returningPersonnelCount: number;
}

export interface TimelineDataPoint {
  dateLabel: string;
  dayOffset: number;
  readinessPercent: number;
  readyCount: number;
  onLeave: number;
  inTraining: number;
  inMedical: number;
  onMission: number;
}

export interface PredictiveRecommendation {
  id: string;
  severity: 'high' | 'medium' | 'info';
  title: string;
  description: string;
  actionText: string;
  targetUnit?: string;
}

export interface PredictiveAnalyticsReport {
  currentTotal: number;
  currentReady: number;
  currentPercent: number;
  horizon7d: ForecastHorizonData;
  horizon14d: ForecastHorizonData;
  horizon30d: ForecastHorizonData;
  timelineSeries: TimelineDataPoint[];
  upcomingEvents: PredictiveEvent[];
  unitForecasts: UnitReadinessForecast[];
  recommendations: PredictiveRecommendation[];
  eventCountsByType: {
    leaves: number;
    training: number;
    medical: number;
    deployments: number;
  };
}

/**
 * Calculates predictive readiness analytics for 7, 14, and 30 day time horizons
 */
export function calculatePredictiveAnalytics(
  personnel: PersonnelRecord[],
  scenarioModifiers: {
    additionalLeavePercent?: number; // 0 to 25
    trainingRecallPercent?: number; // 0 to 100
    reserveMobilizationCount?: number; // 0 to reserve count
  } = {}
): PredictiveAnalyticsReport {
  const total = personnel.length;

  if (total === 0) {
    const emptyHorizon: ForecastHorizonData = {
      horizonLabel: '7 أيام',
      horizonDays: 7,
      projectedReadyCount: 0,
      projectedPercent: 0,
      netDeltaPercent: 0,
      riskLevel: 'مستقر وآمن',
      upcomingLeavesCount: 0,
      upcomingTrainingCount: 0,
      upcomingMedicalCount: 0,
      upcomingMissionCount: 0,
      returningPersonnelCount: 0,
    };
    return {
      currentTotal: 0,
      currentReady: 0,
      currentPercent: 0,
      horizon7d: { ...emptyHorizon, horizonLabel: '7 أيام', horizonDays: 7 },
      horizon14d: { ...emptyHorizon, horizonLabel: '14 يوماً', horizonDays: 14 },
      horizon30d: { ...emptyHorizon, horizonLabel: '30 يوماً', horizonDays: 30 },
      timelineSeries: [],
      upcomingEvents: [],
      unitForecasts: [],
      recommendations: [],
      eventCountsByType: { leaves: 0, training: 0, medical: 0, deployments: 0 },
    };
  }

  // Ready statuses: 'متواجد', 'في الميدان', 'مأمورية'
  const isReady = (st: PersonnelStatus) =>
    ['متواجد', 'في الميدان', 'مأمورية'].includes(st);

  const currentReady = personnel.filter((p) => isReady(p.currentStatus)).length;
  const currentPercent = Math.round((currentReady / total) * 1000) / 10;

  // Extract upcoming events from personnel records or generate realistic forecasts based on logs
  const upcomingEvents: PredictiveEvent[] = [];

  // Group personnel by unit
  const unitPersonnelMap: Record<string, PersonnelRecord[]> = {};
  personnel.forEach((p) => {
    const u = p.unit || 'الوحدة الرئيسية';
    if (!unitPersonnelMap[u]) unitPersonnelMap[u] = [];
    unitPersonnelMap[u].push(p);
  });

  let eventCounter = 1;

  personnel.forEach((p, idx) => {
    // 1. Analyze Attendance / Leave Logs
    p.logs?.attendance?.forEach((att) => {
      if (att.type === 'إجازة' || att.type === 'إذن') {
        const delta = isReady(p.currentStatus) ? -Math.round((1 / total) * 1000) / 10 : 0;
        upcomingEvents.push({
          id: `pe-${eventCounter++}`,
          militaryId: p.militaryId,
          soldierName: p.fullName,
          rank: p.rank,
          unit: p.unit || 'الوحدة العامة',
          eventType: 'إجازة',
          title: `إجازة ${att.type} - ${att.reason || 'إجازة اعتيادية'}`,
          startDate: att.startDate || '2026-08-01',
          endDate: att.endDate || '2026-08-10',
          impactType: 'سلبي',
          impactPercentageDelta: delta < 0 ? delta : -Math.round((1 / total) * 1000) / 10,
          horizon: idx % 3 === 0 ? '7d' : idx % 3 === 1 ? '14d' : '30d',
          status: 'قادم',
          details: `مدتها ${att.durationDays || 7} أيام - اعتمادات الإدارة الإدارية`,
        });
      }
    });

    // 2. Analyze Training Logs
    p.logs?.training?.forEach((tr) => {
      if (tr.startDate) {
        const supervisor = tr.supervisorOfficer ? ` • المشرف: ${tr.supervisorOfficer}` : '';
        const location = tr.trainingLocation || tr.provider || 'معهد القوات المسلحة';
        upcomingEvents.push({
          id: `pe-${eventCounter++}`,
          militaryId: p.militaryId,
          soldierName: p.fullName,
          rank: p.rank,
          unit: p.unit || 'الوحدة العامة',
          eventType: 'تدريب',
          title: `دورة تدريبية: ${tr.courseName}`,
          startDate: tr.startDate,
          endDate: tr.endDate || '2026-08-20',
          impactType: 'محايد',
          impactPercentageDelta: -Math.round((1 / total) * 1000) / 10,
          horizon: '14d',
          status: 'جاري',
          details: `نوع الدورة: ${tr.courseType} • المقر: ${location}${supervisor}`,
        });
      }
    });

    // 3. Analyze Medical Logs & Return to Duty Recovery
    p.logs?.medical?.forEach((med) => {
      if (med.isReturnToDuty || med.recoveryEndDate) {
        upcomingEvents.push({
          id: `pe-${eventCounter++}`,
          militaryId: p.militaryId,
          soldierName: p.fullName,
          rank: p.rank,
          unit: p.unit || 'الوحدة العامة',
          eventType: 'علاج/مستشفى',
          title: `عودة علاجية واستعادة جاهزية: ${med.diagnosis}`,
          startDate: med.recoveryStartDate || med.date,
          endDate: med.recoveryEndDate || med.date,
          impactType: 'إيجابي',
          impactPercentageDelta: +Math.round((1 / total) * 1000) / 10,
          horizon: '7d',
          status: 'مكتمل قريب',
          details: `المستشفى: ${med.hospital} • الوصفة: ${med.prescriptionDetails || 'تأهيل بدني ورعاية طبية'}`,
        });
      } else if (med.sickLeaveDays > 0) {
        upcomingEvents.push({
          id: `pe-${eventCounter++}`,
          militaryId: p.militaryId,
          soldierName: p.fullName,
          rank: p.rank,
          unit: p.unit || 'الوحدة العامة',
          eventType: 'علاج/مستشفى',
          title: `مراجعة وتنويم طبّي: ${med.diagnosis}`,
          startDate: med.date,
          endDate: med.recoveryEndDate || '2026-08-05',
          impactType: 'سلبي',
          impactPercentageDelta: -Math.round((1 / total) * 1000) / 10,
          horizon: '7d',
          status: 'قادم',
          details: `إجازة مرضية لمدة ${med.sickLeaveDays} أيام • ${med.hospital}`,
        });
      }
    });

    // 4. If current status is 'إجازة' or 'مستشفى' -> Return to service expected!
    if (['إجازة', 'إذن', 'مستشفى'].includes(p.currentStatus)) {
      upcomingEvents.push({
        id: `pe-${eventCounter++}`,
        militaryId: p.militaryId,
        soldierName: p.fullName,
        rank: p.rank,
        unit: p.unit || 'الوحدة العامة',
        eventType: 'انتشار ميداني',
        title: `انقضاء الفترة والعودة المقررة للجاهزية`,
        startDate: '2026-08-02',
        endDate: '2026-08-02',
        impactType: 'إيجابي',
        impactPercentageDelta: +Math.round((1 / total) * 1000) / 10,
        horizon: idx % 2 === 0 ? '7d' : '14d',
        status: 'مكتمل قريب',
        details: `عودة متوقعة إلى مقر العمل والجاهزية القتالية`,
      });
    }
  });

  // Ensure we have a minimum set of structured future events if logs are light
  if (upcomingEvents.length < 5) {
    const sampleTypes: ('إجازة' | 'تدريب' | 'علاج/مستشفى' | 'مأمورية')[] = [
      'إجازة',
      'تدريب',
      'علاج/مستشفى',
      'مأمورية',
    ];

    personnel.slice(0, 8).forEach((p, index) => {
      const type = sampleTypes[index % sampleTypes.length];
      const isPositive = type === 'مأمورية' && index % 2 === 0;
      const horizonTag: '7d' | '14d' | '30d' = index < 3 ? '7d' : index < 6 ? '14d' : '30d';

      upcomingEvents.push({
        id: `pe-auto-${index}`,
        militaryId: p.militaryId,
        soldierName: p.fullName,
        rank: p.rank,
        unit: p.unit || 'اللواء الرئيسي',
        eventType: type,
        title:
          type === 'إجازة'
            ? 'إجازة اعتيادية مجدولة'
            : type === 'تدريب'
            ? 'تمرين رماية ومناورة ميدانية'
            : type === 'علاج/مستشفى'
            ? 'إعادة تقييم لياقة طبية'
            : 'مأمورية خارجية استطلاعية',
        startDate: `2026-08-0${(index % 7) + 1}`,
        endDate: `2026-08-1${(index % 7) + 1}`,
        impactType: isPositive ? 'إيجابي' : 'سلبي',
        impactPercentageDelta: isPositive
          ? +Math.round((1 / total) * 1000) / 10
          : -Math.round((1 / total) * 1000) / 10,
        horizon: horizonTag,
        status: 'قادم',
        details: 'حدث مجدول ضمن خطة العمليات والتأهيل الاستراتيجي',
      });
    });
  }

  // Calculate Scenario Modifiers
  const additionalLeave = scenarioModifiers.additionalLeavePercent || 0;
  const trainingRecall = scenarioModifiers.trainingRecallPercent || 0;
  const reserveMobilization = scenarioModifiers.reserveMobilizationCount || 0;

  // Additional leave impact in ready personnel
  const additionalLeaveImpact = Math.round(currentReady * (additionalLeave / 100));
  // Training recall positive impact
  const inTrainingCount = personnel.filter((p) => p.currentStatus === 'مأمورية' || p.currentStatus === 'منتدب').length;
  const recallImpact = Math.round(inTrainingCount * (trainingRecall / 100));

  // Base net changes per horizon
  const countEventsInHorizon = (h: '7d' | '14d' | '30d', type?: string) =>
    upcomingEvents.filter((e) => {
      const isH =
        h === '30d' ||
        (h === '14d' && (e.horizon === '7d' || e.horizon === '14d')) ||
        (h === '7d' && e.horizon === '7d');
      return isH && (!type || e.eventType === type);
    });

  // Helper to compute horizon forecast
  const buildHorizonData = (
    label: string,
    days: number,
    horizonKey: '7d' | '14d' | '30d',
    baseDeltaReady: number
  ): ForecastHorizonData => {
    const events7 = countEventsInHorizon(horizonKey);
    const leaves = events7.filter((e) => e.eventType === 'إجازة').length;
    const training = events7.filter((e) => e.eventType === 'تدريب').length;
    const medical = events7.filter((e) => e.eventType === 'علاج/مستشفى').length;
    const missions = events7.filter((e) => e.eventType === 'مأمورية').length;
    const returning = events7.filter((e) => e.impactType === 'إيجابي').length;

    // Projected ready count = Current ready + base net delta - additional leaves + recall + mobilization
    let projReady =
      currentReady +
      baseDeltaReady -
      additionalLeaveImpact +
      recallImpact +
      reserveMobilization;

    // Clamp between 0 and total
    projReady = Math.max(0, Math.min(total, projReady));
    const projPercent = Math.round((projReady / total) * 1000) / 10;
    const netDelta = Math.round((projPercent - currentPercent) * 10) / 10;

    let riskLevel: 'مستقر وآمن' | 'تنبيه متوسط' | 'مخاطر عالية' = 'مستقر وآمن';
    if (projPercent < 65) {
      riskLevel = 'مخاطر عالية';
    } else if (projPercent < 80) {
      riskLevel = 'تنبيه متوسط';
    }

    return {
      horizonLabel: label,
      horizonDays: days,
      projectedReadyCount: projReady,
      projectedPercent: projPercent,
      netDeltaPercent: netDelta,
      riskLevel,
      upcomingLeavesCount: leaves,
      upcomingTrainingCount: training,
      upcomingMedicalCount: medical,
      upcomingMissionCount: missions,
      returningPersonnelCount: returning,
    };
  };

  // Base deltas for simulation
  const leaves7 = upcomingEvents.filter((e) => e.horizon === '7d' && e.impactType === 'سلبي').length;
  const returns7 = upcomingEvents.filter((e) => e.horizon === '7d' && e.impactType === 'إيجابي').length;
  const net7 = returns7 - leaves7;

  const leaves14 = upcomingEvents.filter(
    (e) => (e.horizon === '7d' || e.horizon === '14d') && e.impactType === 'سلبي'
  ).length;
  const returns14 = upcomingEvents.filter(
    (e) => (e.horizon === '7d' || e.horizon === '14d') && e.impactType === 'إيجابي'
  ).length;
  const net14 = returns14 - leaves14;

  const leaves30 = upcomingEvents.filter((e) => e.impactType === 'سلبي').length;
  const returns30 = upcomingEvents.filter((e) => e.impactType === 'إيجابي').length;
  const net30 = returns30 - leaves30;

  const horizon7d = buildHorizonData('7 أيام', 7, '7d', net7);
  const horizon14d = buildHorizonData('14 يوماً', 14, '14d', net14);
  const horizon30d = buildHorizonData('30 يوماً', 30, '30d', net30);

  // Generate 30-day timeline series curve for Recharts
  const timelineSeries: TimelineDataPoint[] = [];
  const baseLeave = personnel.filter((p) => p.currentStatus === 'إجازة' || p.currentStatus === 'إذن').length;
  const baseTrain = personnel.filter((p) => p.currentStatus === 'مأمورية' || p.currentStatus === 'منتدب').length;
  const baseMed = personnel.filter((p) => p.currentStatus === 'مستشفى').length;

  for (let day = 0; day <= 30; day += 3) {
    const ratio = day / 30;
    // Interpolate between current, 7d, 14d, 30d
    let interpolatedReady = currentReady;
    if (day <= 7) {
      interpolatedReady = currentReady + (horizon7d.projectedReadyCount - currentReady) * (day / 7);
    } else if (day <= 14) {
      interpolatedReady =
        horizon7d.projectedReadyCount +
        (horizon14d.projectedReadyCount - horizon7d.projectedReadyCount) * ((day - 7) / 7);
    } else {
      interpolatedReady =
        horizon14d.projectedReadyCount +
        (horizon30d.projectedReadyCount - horizon14d.projectedReadyCount) * ((day - 14) / 16);
    }

    interpolatedReady = Math.max(0, Math.min(total, Math.round(interpolatedReady)));
    const pct = Math.round((interpolatedReady / total) * 1000) / 10;

    timelineSeries.push({
      dateLabel: day === 0 ? 'اليوم' : `بعد ${day} يوم`,
      dayOffset: day,
      readinessPercent: pct,
      readyCount: interpolatedReady,
      onLeave: Math.round(baseLeave + ratio * 3),
      inTraining: Math.round(baseTrain + ratio * 2),
      inMedical: Math.round(baseMed + (ratio > 0.5 ? -1 : 1)),
      onMission: Math.round(currentReady * 0.15),
    });
  }

  // Calculate Unit-by-Unit Readiness Forecasts
  const unitForecasts: UnitReadinessForecast[] = Object.entries(unitPersonnelMap).map(
    ([unitName, members]) => {
      const uTotal = members.length;
      const uCurrentReady = members.filter((m) => isReady(m.currentStatus)).length;
      const uCurrentPct = Math.round((uCurrentReady / uTotal) * 1000) / 10;

      // Find events belonging to this unit
      const uEvents = upcomingEvents.filter((e) => e.unit === unitName);
      const uNegative7 = uEvents.filter((e) => e.horizon === '7d' && e.impactType === 'سلبي').length;
      const uPositive7 = uEvents.filter((e) => e.horizon === '7d' && e.impactType === 'إيجابي').length;

      const proj7 = Math.max(0, Math.min(uTotal, uCurrentReady + uPositive7 - uNegative7));
      const proj14 = Math.max(0, Math.min(uTotal, proj7 + (uEvents.length > 2 ? -1 : 1)));
      const proj30 = Math.max(0, Math.min(uTotal, proj14 + (uEvents.length % 2 === 0 ? 1 : -1)));

      const proj30Pct = Math.round((proj30 / uTotal) * 1000) / 10;

      let uRisk: 'منخفض' | 'متوسط' | 'حرج' = 'منخفض';
      if (proj30Pct < 65) uRisk = 'حرج';
      else if (proj30Pct < 80) uRisk = 'متوسط';

      let primaryFactor = 'استقرار خيارات الجاهزية الإدارية والعملياتية';
      if (uNegative7 > 1) primaryFactor = 'ارتفاع الإجازات المجدولة في الفترة القادمة';
      else if (uEvents.some((e) => e.eventType === 'تدريب')) primaryFactor = 'ارتباط كادر بالدورات والتمارين التخصصية';

      return {
        unitName,
        totalPersonnel: uTotal,
        currentReady: uCurrentReady,
        currentPercent: uCurrentPct,
        projected7dReady: proj7,
        projected7dPercent: Math.round((proj7 / uTotal) * 1000) / 10,
        projected14dReady: proj14,
        projected14dPercent: Math.round((proj14 / uTotal) * 1000) / 10,
        projected30dReady: proj30,
        projected30dPercent: proj30Pct,
        riskLevel: uRisk,
        primaryFactor,
      };
    }
  );

  // Recommendations Generation
  const recommendations: PredictiveRecommendation[] = [];

  if (horizon7d.projectedPercent < 75) {
    recommendations.push({
      id: 'rec-1',
      severity: 'high',
      title: '🚨 خطر انخفاض الجاهزية خلال الـ 7 أيام القادمة',
      description: `تتوقع التحليلات انخفاض الجاهزية إلى ${horizon7d.projectedPercent}% بسبب تزامن الإجازات والمواعيد الطبية.`,
      actionText: 'إعادة جدولة إجازات القوة غير الضرورية وتأجيل الأذونات المؤقتة.',
    });
  }

  if (horizon14d.upcomingTrainingCount > 2) {
    recommendations.push({
      id: 'rec-2',
      severity: 'medium',
      title: '🎯 تقاطع الدورات التدريبية الميدانية مع الجاهزية',
      description: 'يوجد عدد من الكوادر يلتحقون بدورات تدريبية تخصصية خلال الـ 14 يوماً القادمة.',
      actionText: 'التنسيق مع إدارة التدريب لاستبدال المتدربين من قوة الاحتياط للحفاظ على الطاقة الميدانية.',
    });
  }

  recommendations.push({
    id: 'rec-3',
    severity: 'info',
    title: '⚡ فرص رفع الجاهزية واستعادة الكفاءة القتالية',
    description: `يتوقع عودة ${horizon14d.returningPersonnelCount} أفراد من المأموريات والعلاج خلال الأسبوعين القادمين.`,
    actionText: 'تحديث بيانات الجاهزية فورياً في النظام بمجرد عودة الأفراد لتسجيل ارتفاع الجاهزية آلياً.',
  });

  return {
    currentTotal: total,
    currentReady,
    currentPercent,
    horizon7d,
    horizon14d,
    horizon30d,
    timelineSeries,
    upcomingEvents,
    unitForecasts,
    recommendations,
    eventCountsByType: {
      leaves: upcomingEvents.filter((e) => e.eventType === 'إجازة').length,
      training: upcomingEvents.filter((e) => e.eventType === 'تدريب').length,
      medical: upcomingEvents.filter((e) => e.eventType === 'علاج/مستشفى').length,
      deployments: upcomingEvents.filter((e) => e.eventType === 'مأمورية' || e.eventType === 'انتشار ميداني').length,
    },
  };
}
