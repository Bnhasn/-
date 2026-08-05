import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  Search,
  ShieldCheck,
  User,
  FileText,
  Building,
  Award,
  Sparkles,
  ArrowRight,
  Send,
  X,
  Flame,
  Check,
  Activity,
  GraduationCap,
  HeartPulse,
  UserPlus,
  Scan
} from 'lucide-react';
import { PersonnelRecord, PersonnelStatus, DepartmentRole } from '../types';
import { StorageService } from '../lib/storage';
import { FaceVerificationModal, FaceVerificationResult } from './FaceVerificationModal';

interface GrantLeavePermissionTabsProps {
  personnel: PersonnelRecord[];
  onSelectPersonnel?: (militaryId: string) => void;
  onRefreshData?: () => void;
  currentRole: DepartmentRole;
  currentUserName?: string;
}

export const GrantLeavePermissionTabs: React.FC<GrantLeavePermissionTabsProps> = ({
  personnel,
  onSelectPersonnel,
  onRefreshData,
  currentRole,
  currentUserName = 'ضابط الموارد البشرية'
}) => {
  // Mode switcher: 'leave' | 'permission' | 'medical_return' | 'training_course' | 'tracker'
  const [activeTab, setActiveTab] = useState<'leave' | 'permission' | 'medical_return' | 'training_course' | 'tracker'>('leave');

  // Selected Target Personnel
  const [selectedMilitaryId, setSelectedMilitaryId] = useState<string>('');
  const [personnelSearchTerm, setPersonnelSearchTerm] = useState<string>('');
  const [showSearchDropdown, setShowSearchDropdown] = useState<boolean>(false);

  // Common Form Fields
  const [leaveType, setLeaveType] = useState<string>('إجازة اعتيادية');
  const [permissionType, setPermissionType] = useState<string>('إذن خروج مؤقت');
  const [durationDays, setDurationDays] = useState<number>(7);
  
  const todayStr = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState<string>(todayStr);

  // Medical Return Form State
  const [medicalDiagnosis, setMedicalDiagnosis] = useState<string>('تعافي كامل واجتياز الفحص الطبي والعودة للخدمة');
  const [hospitalName, setHospitalName] = useState<string>('المستشفى العسكري المركزي');
  const [doctorName, setDoctorName] = useState<string>('د. طبيب عسكري مناظر');
  const [prescriptionDetails, setPrescriptionDetails] = useState<string>('برنامج فيتامينات وتأهيل بدني واستكمال التعافي');
  const [recoveryStartDate, setRecoveryStartDate] = useState<string>(todayStr);
  const [recoveryEndDate, setRecoveryEndDate] = useState<string>(todayStr);
  const [newDutyStatus, setNewDutyStatus] = useState<PersonnelStatus>('متواجد');

  // Training Course Form State
  const [courseName, setCourseName] = useState<string>('دورة القتال المتقدم والتكتيك العسكري');
  const [courseType, setCourseType] = useState<'ميداني' | 'قيادي' | 'تقني' | 'أمني' | 'تخصصي' | 'خارجي'>('ميداني');
  const [trainingLocation, setTrainingLocation] = useState<string>('معهد القوات المسلحة / الميدان الرئيسي');
  const [courseStartDate, setCourseStartDate] = useState<string>(todayStr);
  const [courseEndDate, setCourseEndDate] = useState<string>(todayStr);
  const [supervisorOfficer, setSupervisorOfficer] = useState<string>('العقيد ركن / أحمد الهلالي');
  const [courseGrade, setCourseGrade] = useState<'ممتاز' | 'جيد جداً' | 'جيد' | 'مقبول' | 'مؤهل'>('ممتاز');
  const [courseEvaluation, setCourseEvaluation] = useState<string>('اجتياز بنجاح واقتدار ورفع الكفاءة والقتالية الميدانية');
  const [courseCertificates, setCourseCertificates] = useState<string>('شهادة كفاءة قتالية معتمدة');
  const [updateStatusToField, setUpdateStatusToField] = useState<boolean>(true);

  // Compute default end date based on start date + durationDays
  const calculatedEndDate = useMemo(() => {
    if (!startDate) return todayStr;
    const d = new Date(startDate);
    d.setDate(d.getDate() + (Number(durationDays) || 1));
    return d.toISOString().split('T')[0];
  }, [startDate, durationDays]);

  const [endDate, setEndDate] = useState<string>(calculatedEndDate);

  // Keep endDate synced when calculatedEndDate changes if user hasn't overridden
  React.useEffect(() => {
    setEndDate(calculatedEndDate);
  }, [calculatedEndDate]);

  const [reason, setReason] = useState<string>('');
  const [approvedBy, setApprovedBy] = useState<string>('قائد الكتيبة / إدارة الموارد البشرية');
  const [notes, setNotes] = useState<string>('');

  // Status message / toast
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Face Scan Modal States
  const [showFaceScanModal, setShowFaceScanModal] = useState<boolean>(false);
  const [faceScanActionTitle, setFaceScanActionTitle] = useState<string>('تسجيل وتحضير الفرد عبر مسح الوجه');
  const [targetForFaceScan, setTargetForFaceScan] = useState<PersonnelRecord | null>(null);

  const selectedPersonnel = useMemo(() => {
    return personnel.find((p) => p.militaryId === selectedMilitaryId) || null;
  }, [personnel, selectedMilitaryId]);

  const handleOpenFaceScan = (person: PersonnelRecord | null, title: string) => {
    const target = person || selectedPersonnel;
    if (!target) {
      setErrorMessage('يرجى تحديد الفرد المستهدف أولاً لتشغيل كاميرا مسح الوجه.');
      return;
    }
    setFaceScanActionTitle(title);
    setTargetForFaceScan(target);
    setShowFaceScanModal(true);
  };

  const handleFaceScanVerified = (result: FaceVerificationResult) => {
    const target = result.verifiedPerson || targetForFaceScan || selectedPersonnel;
    if (!target) return;

    StorageService.logAction(
      currentRole,
      'إدارة الموارد البشرية',
      'توثيق حضور بمسح الوجه المباشر',
      target.militaryId,
      target.fullName,
      `تم التحقق المباشر من هوية الفرد (${target.rank} / ${target.fullName}) بالكاميرا بمسح الوجه بنسبة مطابقة ${result.matchScore}% للعملية: (${faceScanActionTitle}).`,
      target.militaryId,
      target.fullName
    );

    setSuccessMessage(`📸 تم توثيق الاعتماد الرقمي ومسح وجه الفرد (${target.rank} / ${target.fullName}) بنسبة مطابقة ${result.matchScore}% بنجاح ✓`);
    if (onRefreshData) onRefreshData();
  };

  // Filtered personnel for selector search
  const searchedPersonnel = useMemo(() => {
    const term = personnelSearchTerm.trim().toLowerCase();
    if (!term) return personnel.slice(0, 10);
    return personnel.filter(
      (p) =>
        p.fullName.toLowerCase().includes(term) ||
        p.militaryId.toLowerCase().includes(term) ||
        p.nationalId.toLowerCase().includes(term) ||
        p.unit.toLowerCase().includes(term) ||
        p.rank.toLowerCase().includes(term)
    );
  }, [personnel, personnelSearchTerm]);

  // Handle Submit Grant Leave
  const handleGrantLeaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    if (!selectedMilitaryId) {
      setErrorMessage('يرجى اختيار الفرد المستهدف أولاً من قائمة القوة البشرية.');
      return;
    }

    if (durationDays <= 0) {
      setErrorMessage('يرجى تحديد مدة إجازة صحيحة بالأيام.');
      return;
    }

    const success = StorageService.grantLeaveOrPermission(
      selectedMilitaryId,
      'إجازة',
      {
        leaveType,
        durationDays: Number(durationDays),
        startDate,
        endDate,
        reason: reason || `منح إجازة (${leaveType}) لمدة ${durationDays} أيام`,
        approvedBy,
        notes
      },
      currentUserName,
      currentRole
    );

    if (success) {
      setSuccessMessage(
        `تم المصادقة بنجاح على منح ${leaveType} للفرد (${selectedPersonnel?.rank} / ${selectedPersonnel?.fullName}) وتحديث الجاهزية القتالية مباشرة ✓`
      );
      setReason('');
      setNotes('');
      if (onRefreshData) onRefreshData();
    } else {
      setErrorMessage('حدث خطأ أثناء حفظ الإجازة في السجل الإلكتروني.');
    }
  };

  // Handle Submit Grant Permission
  const handleGrantPermissionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    if (!selectedMilitaryId) {
      setErrorMessage('يرجى اختيار الفرد المستهدف أولاً من قائمة القوة البشرية.');
      return;
    }

    if (durationDays <= 0) {
      setErrorMessage('يرجى تحديد مدة إذن صحيحة.');
      return;
    }

    const success = StorageService.grantLeaveOrPermission(
      selectedMilitaryId,
      'إذن',
      {
        permissionType,
        durationDays: Number(durationDays),
        startDate,
        endDate,
        reason: reason || `منح إذن (${permissionType}) لمدة ${durationDays} أيام`,
        approvedBy,
        notes
      },
      currentUserName,
      currentRole
    );

    if (success) {
      setSuccessMessage(
        `تم المصادقة بنجاح على منح ${permissionType} للفرد (${selectedPersonnel?.rank} / ${selectedPersonnel?.fullName}) وتحديث الجاهزية مباشرة ✓`
      );
      setReason('');
      setNotes('');
      if (onRefreshData) onRefreshData();
    } else {
      setErrorMessage('حدث خطأ أثناء تسجيل الإذن بالملف العسكري.');
    }
  };

  // Handle Medical Return / Recovery
  const handleMedicalReturnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    if (!selectedMilitaryId) {
      setErrorMessage('يرجى اختيار الفرد المستهدف أولاً من قائمة القوة البشرية.');
      return;
    }

    const success = StorageService.registerMedicalReturn(
      selectedMilitaryId,
      {
        diagnosis: medicalDiagnosis,
        hospital: hospitalName,
        doctor: doctorName,
        prescriptionDetails,
        recoveryStartDate,
        recoveryEndDate,
        newStatus: newDutyStatus,
        notes
      },
      currentUserName,
      currentRole
    );

    if (success) {
      setSuccessMessage(`تم تسجيل العودة العلاجية واستكمال التأهيل بنجاح للفرد (${selectedPersonnel?.rank} / ${selectedPersonnel?.fullName}) وتحديث الجاهزية مباشرة 🏥⚡`);
      if (onRefreshData) onRefreshData();
    } else {
      setErrorMessage('تعذر تسجيل العودة العلاجية. يرجى التثبت من البيانات.');
    }
  };

  // Handle Training Course Enrollment
  const handleTrainingCourseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    if (!selectedMilitaryId) {
      setErrorMessage('يرجى اختيار الفرد المستهدف أولاً من قائمة القوة البشرية.');
      return;
    }

    const success = StorageService.registerTrainingCourse(
      selectedMilitaryId,
      {
        courseName,
        courseType,
        startDate: courseStartDate,
        endDate: courseEndDate,
        supervisorOfficer,
        trainingLocation,
        grade: courseGrade,
        evaluation: courseEvaluation,
        certificates: courseCertificates,
        updateStatusToField,
        notes
      },
      currentUserName,
      currentRole
    );

    if (success) {
      setSuccessMessage(`تم تسجيل الفرد (${selectedPersonnel?.rank} / ${selectedPersonnel?.fullName}) بالدورة التدريبية (${courseName}) إشراف (${supervisorOfficer}) وتحديث لوحة الجاهزية 🎓⚡`);
      if (onRefreshData) onRefreshData();
    } else {
      setErrorMessage('تعذر تسجيل الدورة التدريبية.');
    }
  };

  // Quick Action: Mark Return to Duty / Present
  const handleMarkPresent = (militaryId: string) => {
    StorageService.updateStatus(
      militaryId,
      'متواجد',
      'إثبات تحضير وعودة رسمية للخدمة بعد انقضاء الفترة',
      currentUserName,
      currentRole
    );
    setSuccessMessage('تم تسجيل تحضير الفرد وتحديث حالته إلى (متواجد) واستعادة الجاهزية الميدانية بنجاح.');
    if (onRefreshData) onRefreshData();
  };

  // Active Personnel on Leave / Permission / Absent
  const activeTrackerPersonnel = useMemo(() => {
    return personnel.filter((p) =>
      ['إجازة', 'إذن', 'غياب', 'فرار', 'مجاز', 'غائب'].includes(p.currentStatus)
    );
  }, [personnel]);

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-5 md:p-7 shadow-sm space-y-6">
      
      {/* Top Banner & Tab Navigation */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <div className="flex items-center space-x-2 space-x-reverse mb-1">
            <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-black px-3 py-1 rounded-full shadow-xs flex items-center space-x-1 space-x-reverse">
              <Calendar className="w-3.5 h-3.5 text-amber-700" />
              <span>إدارة الانضباط والاستحقاقات الزمانية</span>
            </span>
            <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-bold px-2.5 py-1 rounded-full">
              تحديث الجاهزية الفوري
            </span>
          </div>

          <h3 className="text-xl md:text-2xl font-black text-slate-900 font-['Tajawal'] flex items-center space-x-2 space-x-reverse">
            <span>منح الإجازات والأذونات الرسمية ومتابعة الانضباط</span>
          </h3>
          <p className="text-xs text-slate-500 max-w-3xl leading-relaxed mt-1">
            توثيق جميع حركات الإجازات والأذونات في السجل الإلكتروني للفرد مع تحديث فوري للنسبة المئوية للجاهزية القتالية والتنبيه الآلي في حالة التجاوز أو الغياب.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-200 self-stretch lg:self-auto overflow-x-auto gap-1">
          <button
            onClick={() => {
              setActiveTab('leave');
              setSuccessMessage(null);
              setErrorMessage(null);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center space-x-1.5 space-x-reverse cursor-pointer whitespace-nowrap ${
              activeTab === 'leave'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>🌴 منح واستحقاق إجازة</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('permission');
              setSuccessMessage(null);
              setErrorMessage(null);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center space-x-1.5 space-x-reverse cursor-pointer whitespace-nowrap ${
              activeTab === 'permission'
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>🎟️ منح إذن خروج</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('medical_return');
              setSuccessMessage(null);
              setErrorMessage(null);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center space-x-1.5 space-x-reverse cursor-pointer whitespace-nowrap ${
              activeTab === 'medical_return'
                ? 'bg-teal-700 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <HeartPulse className="w-3.5 h-3.5" />
            <span>🏥 عودة علاجية وتأهيل</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('training_course');
              setSuccessMessage(null);
              setErrorMessage(null);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center space-x-1.5 space-x-reverse cursor-pointer whitespace-nowrap ${
              activeTab === 'training_course'
                ? 'bg-indigo-700 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>🎓 دورات تدريبية</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('tracker');
              setSuccessMessage(null);
              setErrorMessage(null);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center space-x-1.5 space-x-reverse cursor-pointer whitespace-nowrap ${
              activeTab === 'tracker'
                ? 'bg-emerald-700 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>سجل التحضير ({activeTrackerPersonnel.length})</span>
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-950 p-4 rounded-2xl flex items-start justify-between animate-in fade-in">
          <div className="flex items-center space-x-2 space-x-reverse">
            <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
            <span className="text-xs font-bold leading-relaxed">{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Error Notification Alert */}
      {errorMessage && (
        <div className="bg-rose-50 border border-rose-300 text-rose-950 p-4 rounded-2xl flex items-start justify-between animate-in fade-in">
          <div className="flex items-center space-x-2 space-x-reverse">
            <AlertTriangle className="w-5 h-5 text-rose-700 shrink-0" />
            <span className="text-xs font-bold leading-relaxed">{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-700 hover:text-rose-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* TAB 1, 2, 3, 4: Target Personnel Picker (Shared Header) */}
      {(activeTab === 'leave' || activeTab === 'permission' || activeTab === 'medical_return' || activeTab === 'training_course') && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 md:p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-2 space-x-reverse">
              <User className="w-4 h-4 text-emerald-700" />
              <span>1. اختيار الفرد المستهدف من القوة البشرية:</span>
            </h4>
            {selectedPersonnel && (
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full">
                تم تحديد الفرد بنجاح ✓
              </span>
            )}
          </div>

          {/* Search Input for Target Personnel */}
          <div className="relative">
            <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={personnelSearchTerm}
              onChange={(e) => {
                setPersonnelSearchTerm(e.target.value);
                setShowSearchDropdown(true);
              }}
              onFocus={() => setShowSearchDropdown(true)}
              placeholder="ابحث بالاسم الرباعي، الرقم الوظيفي، الهوية الوطنية، أو الرتبة..."
              className="w-full bg-white border border-slate-300 rounded-xl pr-10 pl-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 font-medium"
            />

            {/* Dropdown Suggestions */}
            {showSearchDropdown && (
              <div className="absolute z-30 right-0 left-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-60 overflow-y-auto divide-y divide-slate-100">
                {searchedPersonnel.length === 0 ? (
                  <div className="p-4 text-center text-slate-500 text-xs">لا يوجد أفراد مطابقين للبحث.</div>
                ) : (
                  searchedPersonnel.map((p) => (
                    <div
                      key={p.militaryId}
                      onClick={() => {
                        setSelectedMilitaryId(p.militaryId);
                        setPersonnelSearchTerm(`${p.rank} / ${p.fullName} (${p.militaryId})`);
                        setShowSearchDropdown(false);
                      }}
                      className="p-3 hover:bg-slate-50 cursor-pointer transition-colors flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <img
                          src={p.photoUrl}
                          alt={p.fullName}
                          className="w-8 h-8 rounded-lg object-cover border border-slate-300"
                        />
                        <div>
                          <div className="font-bold text-xs text-slate-900">
                            {p.rank} / {p.fullName}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            الرقم الوظيفي: <span className="font-mono font-bold text-emerald-800">{p.militaryId}</span> • {p.unit}
                          </div>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          ['متواجد', 'في الميدان'].includes(p.currentStatus)
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {p.currentStatus}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Selected Personnel Summary Box */}
          {selectedPersonnel ? (
            <div className="bg-white border-2 border-emerald-600/60 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
              <div className="flex items-center space-x-3.5 space-x-reverse">
                <img
                  src={selectedPersonnel.photoUrl}
                  alt={selectedPersonnel.fullName}
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-slate-200 shadow-xs"
                />
                <div className="space-y-1">
                  <div className="text-sm font-black text-slate-900 flex items-center space-x-2 space-x-reverse">
                    <span>{selectedPersonnel.rank} / {selectedPersonnel.fullName}</span>
                    <span className="text-[10px] bg-slate-100 text-emerald-900 px-2 py-0.5 rounded-md border font-mono font-bold">
                      {selectedPersonnel.militaryId}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600">
                    الوحدة: <span className="font-bold text-slate-800">{selectedPersonnel.unit}</span> • الكتيبة: <span className="font-bold text-slate-800">{selectedPersonnel.battalion}</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    الحالة الحالية: <span className="font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">{selectedPersonnel.currentStatus}</span>
                  </div>
                </div>
              </div>

              {onSelectPersonnel && (
                <button
                  type="button"
                  onClick={() => onSelectPersonnel(selectedPersonnel.militaryId)}
                  className="text-xs text-emerald-800 font-bold hover:underline bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl cursor-pointer"
                >
                  عرض ملف الفرد الكامل ➔
                </button>
              )}
            </div>
          ) : (
            <div className="text-xs text-amber-800 bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-center space-x-2 space-x-reverse font-medium">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
              <span>الرجاء البحث واختيار أحد أفراد القوة العسكرية للبدء في مصادقة منح الإجازة أو الإذن.</span>
            </div>
          )}
        </div>
      )}

      {/* TAB 1: GRANT LEAVE FORM */}
      {activeTab === 'leave' && (
        <form onSubmit={handleGrantLeaveSubmit} className="space-y-5 animate-in fade-in duration-300">
          
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
            <h4 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-3 flex items-center space-x-2 space-x-reverse">
              <Calendar className="w-4 h-4 text-amber-600" />
              <span>2. تحديد تفاصيل ونوع مدة الإجازة الرسمية:</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Leave Type */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">نوع الإجازة:</label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:border-amber-600"
                >
                  <option value="إجازة اعتيادية">إجازة اعتيادية (سنوية)</option>
                  <option value="إجازة مرضية">إجازة مرضية (تقرير طبي)</option>
                  <option value="إجازة ميدانية">إجازة ميدانية (راحة عملياتية)</option>
                  <option value="إجازة إدارية">إجازة إدارية استثنائية</option>
                  <option value="إجازة اضطرارية">إجازة اضطرارية طارئة</option>
                  <option value="إجازة مرافق">إجازة مرافق مريض</option>
                </select>
              </div>

              {/* Duration in Days */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">مدة الإجازة (بالأيام):</label>
                <input
                  type="number"
                  min="1"
                  max="90"
                  value={durationDays}
                  onChange={(e) => setDurationDays(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-amber-600"
                  required
                />
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">تاريخ بداية الإجازة:</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-amber-600"
                  required
                />
              </div>

              {/* End Date (Expiration Date) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">تاريخ انتهاء الإجازة (تاريخ العودة):</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-amber-50 border border-amber-300 text-amber-950 font-mono font-bold rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-600"
                  required
                />
                <p className="text-[10px] text-slate-500 mt-1">يُحسب آلياً بناءً على عدد الأيام ويمكن تعديله.</p>
              </div>

              {/* Approved By */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">الجهة / الضابط المعتمد:</label>
                <input
                  type="text"
                  value={approvedBy}
                  onChange={(e) => setApprovedBy(e.target.value)}
                  placeholder="مثال: قائد اللواء / رئيس فرع HR"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-amber-600"
                  required
                />
              </div>

              {/* Reason */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">مبرر وسبب الإجازة:</label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="سبب منح الإجازة..."
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-amber-600"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">ملاحظات والتزامات الخروج:</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="توجيهات التسليم والتسلح وأية ملاحظات إدارية أخرى..."
                className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 font-medium focus:outline-none focus:border-amber-600"
              />
            </div>
          </div>

          {/* Action Submit Button */}
          <div className="flex items-center justify-end space-x-3 space-x-reverse pt-2">
            <button
              type="button"
              onClick={() => handleOpenFaceScan(selectedPersonnel, 'مصادقة منح إجازة رسمية بمسح الوجه المباشر')}
              disabled={!selectedMilitaryId}
              className={`px-4 py-3 rounded-2xl text-xs font-black transition-all flex items-center space-x-2 space-x-reverse shadow-md cursor-pointer ${
                selectedMilitaryId
                  ? 'bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-emerald-500/50'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
              }`}
            >
              <Scan className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>مسح الوجه والتحقق الحيوي 📸</span>
            </button>

            <button
              type="submit"
              disabled={!selectedMilitaryId}
              className={`px-6 py-3 rounded-2xl text-xs font-black transition-all flex items-center space-x-2 space-x-reverse shadow-md cursor-pointer ${
                selectedMilitaryId
                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>مصادقة واعتماد منح الإجازة وتحديث الجاهزية مباشرة ⚡</span>
            </button>
          </div>

        </form>
      )}

      {/* TAB 2: GRANT PERMISSION FORM */}
      {activeTab === 'permission' && (
        <form onSubmit={handleGrantPermissionSubmit} className="space-y-5 animate-in fade-in duration-300">
          
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
            <h4 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-3 flex items-center space-x-2 space-x-reverse">
              <Clock className="w-4 h-4 text-sky-600" />
              <span>2. تحديد تفاصيل ومدد الإذن الخروج المؤقت:</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Permission Type */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">نوع الإذن:</label>
                <select
                  value={permissionType}
                  onChange={(e) => setPermissionType(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:border-sky-600"
                >
                  <option value="إذن خروج مؤقت (ساعات)">إذن خروج مؤقت (ساعات محدودة)</option>
                  <option value="إذن يومي (24 ساعة)">إذن يومي (24 ساعة)</option>
                  <option value="إذن مبيّت خارج المعسكر">إذن مبيّت خارج المعسكر</option>
                  <option value="إذن مراجعة طبية">إذن مراجعة طبية ومستشفى</option>
                  <option value="إذن إداري طارئ">إذن إداري طارئ</option>
                </select>
              </div>

              {/* Duration in Days */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">مدة الإذن (أيام/ساعات):</label>
                <input
                  type="number"
                  min="1"
                  max="7"
                  value={durationDays}
                  onChange={(e) => setDurationDays(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-sky-600"
                  required
                />
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">تاريخ بداية الإذن:</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-sky-600"
                  required
                />
              </div>

              {/* End Date (Expiration Date) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">تاريخ انتهاء الإذن (موعد التحضير):</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-sky-50 border border-sky-300 text-sky-950 font-mono font-bold rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-600"
                  required
                />
              </div>

              {/* Approved By */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">الضابط / القائد المعتمد للإذن:</label>
                <input
                  type="text"
                  value={approvedBy}
                  onChange={(e) => setApprovedBy(e.target.value)}
                  placeholder="اسم القائد المعتمد..."
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-sky-600"
                  required
                />
              </div>

              {/* Reason */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">سبب ومبرر الإذن:</label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="سبب الإذن..."
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-sky-600"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">تعليمات وملاحظات العودة:</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="أي تعليمات إضافية..."
                className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 font-medium focus:outline-none focus:border-sky-600"
              />
            </div>
          </div>

          {/* Action Submit Button */}
          <div className="flex items-center justify-end space-x-3 space-x-reverse pt-2">
            <button
              type="submit"
              disabled={!selectedMilitaryId}
              className={`px-6 py-3 rounded-2xl text-xs font-black transition-all flex items-center space-x-2 space-x-reverse shadow-md cursor-pointer ${
                selectedMilitaryId
                  ? 'bg-sky-600 hover:bg-sky-700 text-white'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>مصادقة واعتماد منح الإذن وتحديث الجاهزية مباشرة ⚡</span>
            </button>
          </div>

        </form>
      )}

      {/* TAB 3: MEDICAL RETURN & RECOVERY FORM */}
      {activeTab === 'medical_return' && (
        <form onSubmit={handleMedicalReturnSubmit} className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-teal-50/70 border border-teal-200 rounded-2xl p-4 md:p-5 space-y-4">
            <h4 className="text-sm font-bold text-teal-950 border-b border-teal-200/80 pb-3 flex items-center space-x-2 space-x-reverse">
              <HeartPulse className="w-4 h-4 text-teal-700" />
              <span>2. إدخال بيانات العودة العلاجية والوصفات الطبية وفترة التعافي:</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Diagnosis */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">التشخيص الطبي وحالة التعافي:</label>
                <input
                  type="text"
                  value={medicalDiagnosis}
                  onChange={(e) => setMedicalDiagnosis(e.target.value)}
                  placeholder="التشخيص الطبي..."
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-teal-600"
                  required
                />
              </div>

              {/* Hospital */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">المستشفى / الجهة العلاجية:</label>
                <input
                  type="text"
                  value={hospitalName}
                  onChange={(e) => setHospitalName(e.target.value)}
                  placeholder="اسم المستشفى..."
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-teal-600"
                  required
                />
              </div>

              {/* Doctor */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">الطبيب المباشر / المشرف:</label>
                <input
                  type="text"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  placeholder="اسم الطبيب..."
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-teal-600"
                  required
                />
              </div>

              {/* Recovery Start Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">تاريخ بداية التعافي:</label>
                <input
                  type="date"
                  value={recoveryStartDate}
                  onChange={(e) => setRecoveryStartDate(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-teal-600"
                  required
                />
              </div>

              {/* Recovery End Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">تاريخ انتهاء التعافي (استعادة الجاهزية):</label>
                <input
                  type="date"
                  value={recoveryEndDate}
                  onChange={(e) => setRecoveryEndDate(e.target.value)}
                  className="w-full bg-teal-100 border border-teal-300 text-teal-950 font-mono font-bold rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-teal-600"
                  required
                />
              </div>

              {/* Prescription Details */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">تفاصيل الوصفة العلاجية والتوصيات الطبية:</label>
                <input
                  type="text"
                  value={prescriptionDetails}
                  onChange={(e) => setPrescriptionDetails(e.target.value)}
                  placeholder="الوصفة العلاجية والدوائية..."
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-teal-600"
                />
              </div>

              {/* Target Status */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">الحالة الجديدة للفرد بعد العودة:</label>
                <select
                  value={newDutyStatus}
                  onChange={(e) => setNewDutyStatus(e.target.value as PersonnelStatus)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-teal-600"
                >
                  <option value="متواجد">متواجد بالمعسكر (جاهزية كاملة)</option>
                  <option value="في الميدان">في الميدان (جاهزية عملياتية)</option>
                </select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">تعليمات وملاحظات العودة العلاجية:</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="توصيات التأهيل البدني والجاهزية القتالية..."
                className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 font-medium focus:outline-none focus:border-teal-600"
              />
            </div>
          </div>

          {/* Action Submit Button */}
          <div className="flex items-center justify-end space-x-3 space-x-reverse pt-2">
            <button
              type="submit"
              disabled={!selectedMilitaryId}
              className={`px-6 py-3 rounded-2xl text-xs font-black transition-all flex items-center space-x-2 space-x-reverse shadow-md cursor-pointer ${
                selectedMilitaryId
                  ? 'bg-teal-700 hover:bg-teal-800 text-white'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed'
              }`}
            >
              <HeartPulse className="w-4 h-4" />
              <span>مصادقة العودة العلاجية وتحديث منحنى الجاهزية فوراً 🏥⚡</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 4: TRAINING COURSE FORM */}
      {activeTab === 'training_course' && (
        <form onSubmit={handleTrainingCourseSubmit} className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-4 md:p-5 space-y-4">
            <h4 className="text-sm font-bold text-indigo-950 border-b border-indigo-200/80 pb-3 flex items-center space-x-2 space-x-reverse">
              <GraduationCap className="w-4 h-4 text-indigo-700" />
              <span>2. إدخال بيانات الدورة التدريبية والضابط المشرف وتأثير الجاهزية:</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Course Name */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">اسم الدورة التدريبية:</label>
                <input
                  type="text"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  placeholder="عنوان الدورة العسكرية..."
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-indigo-600"
                  required
                />
              </div>

              {/* Course Category */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">تصنيف نوع الدورة:</label>
                <select
                  value={courseType}
                  onChange={(e) => setCourseType(e.target.value as any)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-indigo-600"
                >
                  <option value="ميداني">ميداني وتكتيكي</option>
                  <option value="قيادي">قيادي وإداري</option>
                  <option value="تقني">تقني وفني</option>
                  <option value="أمني">أمني واستخباراتي</option>
                  <option value="تخصصي">تخصصي نوعي</option>
                  <option value="خارجي">دورة خارجية / ابتعاث</option>
                </select>
              </div>

              {/* Training Location */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">مكان ومقر التدريب:</label>
                <input
                  type="text"
                  value={trainingLocation}
                  onChange={(e) => setTrainingLocation(e.target.value)}
                  placeholder="معهد / مركز التدريب..."
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-indigo-600"
                  required
                />
              </div>

              {/* Supervisor Officer */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">الضابط المشرف على الدورة:</label>
                <input
                  type="text"
                  value={supervisorOfficer}
                  onChange={(e) => setSupervisorOfficer(e.target.value)}
                  placeholder="الرتبة والاسم الكامل للضابط المشرف..."
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-indigo-600"
                  required
                />
              </div>

              {/* Course Start Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">تاريخ بداية الدورة:</label>
                <input
                  type="date"
                  value={courseStartDate}
                  onChange={(e) => setCourseStartDate(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-indigo-600"
                  required
                />
              </div>

              {/* Course End Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">تاريخ انتهاء الدورة:</label>
                <input
                  type="date"
                  value={courseEndDate}
                  onChange={(e) => setCourseEndDate(e.target.value)}
                  className="w-full bg-indigo-100 border border-indigo-300 text-indigo-950 font-mono font-bold rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-600"
                  required
                />
              </div>

              {/* Expected Grade */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">التقدير / التقييم المتوقع:</label>
                <select
                  value={courseGrade}
                  onChange={(e) => setCourseGrade(e.target.value as any)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-indigo-600"
                >
                  <option value="ممتاز">ممتاز</option>
                  <option value="جيد جداً">جيد جداً</option>
                  <option value="جيد">جيد</option>
                  <option value="مقبول">مقبول</option>
                  <option value="مؤهل">مؤهل / اجتاز</option>
                </select>
              </div>

              {/* Certificate */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">الشهادة / المؤهل المكتسب:</label>
                <input
                  type="text"
                  value={courseCertificates}
                  onChange={(e) => setCourseCertificates(e.target.value)}
                  placeholder="اسم الشهادة المكتسبة..."
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-indigo-600"
                />
              </div>

              {/* Checkbox for Status */}
              <div className="flex items-center space-x-2 space-x-reverse pt-6">
                <input
                  type="checkbox"
                  id="statusFieldChk"
                  checked={updateStatusToField}
                  onChange={(e) => setUpdateStatusToField(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                />
                <label htmlFor="statusFieldChk" className="text-xs font-bold text-indigo-950 cursor-pointer">
                  تحديث حالة الفرد إلى (في الميدان) طوال فترة التدريب
                </label>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">تقييم المشرف وملاحظات الدورة:</label>
              <textarea
                value={courseEvaluation}
                onChange={(e) => setCourseEvaluation(e.target.value)}
                rows={2}
                placeholder="تقييم الأداء والملاحظات..."
                className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 font-medium focus:outline-none focus:border-indigo-600"
              />
            </div>
          </div>

          {/* Action Submit Button */}
          <div className="flex items-center justify-end space-x-3 space-x-reverse pt-2">
            <button
              type="submit"
              disabled={!selectedMilitaryId}
              className={`px-6 py-3 rounded-2xl text-xs font-black transition-all flex items-center space-x-2 space-x-reverse shadow-md cursor-pointer ${
                selectedMilitaryId
                  ? 'bg-indigo-700 hover:bg-indigo-800 text-white'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>تسجيل وإسناد الدورة التدريبية وتحديث مؤشرات الجاهزية 🎓⚡</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: ACTIVE LEAVES & PERMISSIONS TRACKER & RETURN ATTENDANCE */}
      {activeTab === 'tracker' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-slate-700 font-medium flex items-center justify-between">
            <div className="flex items-center space-x-2 space-x-reverse">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>
                قائمة متابعة الانضباط والأفراد المسجلين بـ (إجازة / إذن / غياب / فرار) – التحويل الآلي يحول الحالة إلى غياب عند انتهاء التاريخ وإلى فرار بعد 30 يوماً.
              </span>
            </div>
            <span className="font-bold text-slate-900 bg-white border px-2.5 py-1 rounded-lg">
              الإجمالي: {activeTrackerPersonnel.length} فرد
            </span>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-x-auto shadow-xs">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">الفرد والرقم الوظيفي</th>
                  <th className="py-3 px-4">الرتبة والوحدة</th>
                  <th className="py-3 px-4">الحالة الحالية</th>
                  <th className="py-3 px-4">تاريخ الانتهاء المحدد</th>
                  <th className="py-3 px-4">تفاصيل السجل</th>
                  <th className="py-3 px-4 text-center">إجراء التحضير والعودة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                {activeTrackerPersonnel.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-slate-500">
                      جميع أفراد القوة البشرية متواجدون وفي الجاهزية الكاملة! لا توجد إجازات أو غيابات نشطة حالياً.
                    </td>
                  </tr>
                ) : (
                  activeTrackerPersonnel.map((p) => {
                    const activeLog = p.logs.attendance[0];
                    const isOverdue = activeLog?.endDate && activeLog.endDate < todayStr;

                    return (
                      <tr key={p.militaryId} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <img src={p.photoUrl} alt={p.fullName} className="w-8 h-8 rounded-lg object-cover border" />
                            <div>
                              <div>{p.fullName}</div>
                              <div className="text-[10px] text-slate-500 font-mono font-bold">{p.militaryId}</div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-800">{p.rank}</div>
                          <div className="text-[10px] text-slate-500">{p.unit}</div>
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md ${
                              ['إجازة', 'مجاز'].includes(p.currentStatus)
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : p.currentStatus === 'إذن'
                                ? 'bg-sky-100 text-sky-900 border border-sky-300'
                                : p.currentStatus === 'غياب'
                                ? 'bg-rose-100 text-rose-900 border border-rose-300 font-black'
                                : 'bg-red-950 text-white border border-red-800 font-black'
                            }`}
                          >
                            {p.currentStatus}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-mono font-bold text-slate-800">
                            {activeLog?.endDate || 'غير محدد'}
                          </div>
                          {isOverdue && (
                            <div className="text-[10px] text-rose-700 font-bold mt-0.5 animate-pulse">
                              ⚠️ متجاوز التاريخ المسموح!
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-4 text-slate-600 max-w-xs text-[11px]">
                          {activeLog?.reason || 'لا توجد ملاحظات تفصيلية'}
                        </td>

                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center space-x-1.5 space-x-reverse">
                            <button
                              onClick={() => handleMarkPresent(p.militaryId)}
                              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-3 py-1.5 rounded-xl transition-all shadow-xs cursor-pointer inline-flex items-center space-x-1 space-x-reverse"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>إثبات تحضير (متواجد) ✓</span>
                            </button>
                            <button
                              onClick={() => handleOpenFaceScan(p, `إثبات تحضير وحضور بالفرد بمسح الوجه (${p.rank} / ${p.fullName})`)}
                              className="bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-emerald-500/50 font-bold text-xs px-2.5 py-1.5 rounded-xl transition-all shadow-xs cursor-pointer inline-flex items-center space-x-1 space-x-reverse"
                              title="مسح الوجه المباشر للكاميرا لإثبات الحضور"
                            >
                              <Scan className="w-3.5 h-3.5 text-emerald-400" />
                              <span>مسح الوجه 📸</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* Face Verification Modal */}
      <FaceVerificationModal
        isOpen={showFaceScanModal}
        onClose={() => setShowFaceScanModal(false)}
        onVerified={handleFaceScanVerified}
        targetPersonnel={targetForFaceScan || selectedPersonnel}
        allPersonnel={personnel}
        taskTitle={faceScanActionTitle}
        sensitiveTaskType="attendance"
      />

    </div>
  );
};
