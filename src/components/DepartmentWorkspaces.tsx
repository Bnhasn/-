import React, { useState } from 'react';
import {
  Users,
  ShieldAlert,
  Crosshair,
  Award,
  DollarSign,
  Lock,
  Wrench,
  Package,
  Plus,
  CheckCircle2,
  Calendar,
  Activity,
  AlertOctagon,
  FileText,
  Upload,
  Image as ImageIcon,
  Paperclip
} from 'lucide-react';
import { PersonnelRecord, DepartmentRole, PersonnelStatus } from '../types';
import { StorageService } from '../lib/storage';
import { ArmamentBranchWorkspace } from './ArmamentBranchWorkspace';
import { TargetPersonnelSearchSelect } from './TargetPersonnelSearchSelect';

interface DepartmentWorkspacesProps {
  currentRole: DepartmentRole;
  personnel: PersonnelRecord[];
  onRefresh: () => void;
  onSelectPersonnel: (militaryId: string) => void;
  currentAccountName?: string;
  isMainCommand?: boolean;
}

export const DepartmentWorkspaces: React.FC<DepartmentWorkspacesProps> = ({
  currentRole,
  personnel,
  onRefresh,
  onSelectPersonnel,
  currentAccountName = 'لواء القيادة',
  isMainCommand = true
}) => {
  const [selectedMilitaryId, setSelectedMilitaryId] = useState<string>(
    personnel[0]?.militaryId || ''
  );

  // Form states
  const [reason, setReason] = useState('');
  const [amount, setAmount] = useState<number>(1000);
  const [days, setDays] = useState<number>(7);
  const [statusInput, setStatusInput] = useState<PersonnelStatus>('إجازة');
  const [weaponSerial, setWeaponSerial] = useState('');
  const [weaponType, setWeaponType] = useState('بندقية M4A1 5.56mm');
  const [ammoQty, setAmmoQty] = useState<number>(120);

  // Medical states
  const [diagnosis, setDiagnosis] = useState('');
  const [hospitalName, setHospitalName] = useState('المستشفى العسكري المركزي');
  const [doctorName, setDoctorName] = useState('د. طبيب عسكري مناظر');
  const [prescriptionDetails, setPrescriptionDetails] = useState('برنامج علاج ودواء متكامل وتأهيل بدني');
  const [recoveryStartDate, setRecoveryStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [recoveryEndDate, setRecoveryEndDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Security states
  const [violationText, setViolationText] = useState('');
  const [securityFileUrl, setSecurityFileUrl] = useState<string>('');
  const [securityFileName, setSecurityFileName] = useState<string>('');

  // Training states
  const [courseName, setCourseName] = useState('');
  const [courseType, setCourseType] = useState<'ميداني' | 'قيادي' | 'تقني' | 'أمني' | 'تخصصي' | 'خارجي'>('ميداني');
  const [trainingLocation, setTrainingLocation] = useState('معهد القوات المسلحة / الميدان الرئيسي');
  const [courseStartDate, setCourseStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [courseEndDate, setCourseEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [supervisorOfficer, setSupervisorOfficer] = useState('العقيد ركن / أحمد الهلالي');
  const [courseGrade, setCourseGrade] = useState<'ممتاز' | 'جيد جداً' | 'جيد' | 'مقبول' | 'مؤهل'>('ممتاز');

  // Supply / Equipment states
  const [supplyType, setSupplyType] = useState<'بدلة عسكرية' | 'بسطار/حذاء' | 'خوذة/دروع' | 'معدات ميدانية' | 'مؤن/تجهيزات' | 'مهمات أخرى'>('بدلة عسكرية');
  const [supplyItemName, setSupplyItemName] = useState('بدلة تمويه ميدانية رسمية 2026');
  const [supplyQty, setSupplyQty] = useState<number>(2);
  const [supplyCondition, setSupplyCondition] = useState<'جديد' | 'مستعمل ممتازة' | 'مستعمل جيدة' | 'مستهلك'>('جديد');
  const [supplySerial, setSupplySerial] = useState('');
  const [supplyNotes, setSupplyNotes] = useState('');

  const [notification, setNotification] = useState<string | null>(null);

  const showSuccessNotice = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const activeSoldier = personnel.find((p) => p.militaryId === selectedMilitaryId) || personnel[0];

  // HR Action: Grant Leave/Permission/Mission/Status
  const handleHRAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSoldier) return;

    StorageService.updateStatus(
      activeSoldier.militaryId,
      statusInput,
      reason || `قرار من فرع ${currentRole}`,
      'مسؤول فرع HR',
      currentRole
    );

    showSuccessNotice(`تم تحديث حالة الفرد ${activeSoldier.fullName} إلى (${statusInput}) بنجاح`);
    setReason('');
    onRefresh();
  };

  // Armament Action: Issue Weapon & Ammo
  const handleArmamentAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSoldier) return;

    const serial = weaponSerial || `WPN-${Math.floor(10000 + Math.random() * 90000)}`;

    StorageService.addArmamentLog(
      activeSoldier.militaryId,
      {
        weaponSerial: serial,
        weaponType,
        issueDate: new Date().toISOString().split('T')[0],
        ammoQty,
        firelinesCount: 4,
        ammoHistory: [
          {
            id: `ah-${Date.now()}`,
            type: 'صرف',
            quantity: ammoQty,
            date: new Date().toISOString().split('T')[0],
            reason: reason || 'صرف حزمة التسليح الميدانية',
            issuedBy: currentRole
          }
        ],
        condition: 'ممتازة',
        technicalNotes: 'فحص دوري معتمد بالسلامة'
      },
      'ضابط التسليح',
      currentRole
    );

    showSuccessNotice(`تم صرف السلاح (${weaponType}) والذخيرة للفرد ${activeSoldier.fullName}`);
    setWeaponSerial('');
    setReason('');
    onRefresh();
  };

  // Medical Action: Admit & Register Diagnosis & Prescription
  const handleMedicalAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSoldier) return;

    StorageService.addMedicalLog(
      activeSoldier.militaryId,
      {
        date: new Date().toISOString().split('T')[0],
        diagnosis: diagnosis || 'حالة مرضية وعلاج تخصصي بالمستشفى',
        hospital: hospitalName,
        doctor: doctorName,
        sickLeaveDays: days,
        medications: prescriptionDetails
          ? [
              {
                id: `m-${Date.now()}`,
                name: prescriptionDetails,
                dose: 'حسب الخطة الطبية وتوصيات الاستشاري',
                dateDispensed: new Date().toISOString().split('T')[0],
                prescribedBy: doctorName
              }
            ]
          : [],
        prescriptionDetails,
        recoveryStartDate,
        recoveryEndDate,
        isReturnToDuty: false
      },
      doctorName || 'طبيب الفرع الطبي',
      currentRole,
      true // Admit to hospital
    );

    showSuccessNotice(`تم توثيق الوصفة الطبية وفترة التعافي للفرد (${activeSoldier.fullName}) بالمستشفى العسكري وانعكست على الجاهزية`);
    setDiagnosis('');
    onRefresh();
  };

  // Finance Action: Disburse Salary/Bonus/Loan
  const handleFinanceAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSoldier) return;

    StorageService.addFinancialLog(
      activeSoldier.militaryId,
      {
        date: new Date().toISOString().split('T')[0],
        type: 'مكافأة',
        amount,
        reason: reason || 'مكافأة تميز وحافز عملياتي',
        transactionDate: new Date().toISOString().split('T')[0]
      },
      'المحاسب المالي العسكري',
      currentRole
    );

    showSuccessNotice(`تم صرف مبلغ ${amount.toLocaleString()} ريال للفرد ${activeSoldier.fullName}`);
    setReason('');
    onRefresh();
  };

  // Security Action: Issue Security Infraction / Arrest Order
  const handleSecurityAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSoldier) return;

    StorageService.addSecurityLog(
      activeSoldier.militaryId,
      {
        date: new Date().toISOString().split('T')[0],
        violation: violationText || 'مخالفة الضوابط العسكرية والتمام',
        investigationDetails: securityFileName ? `مرفق محضر/وثيقة أمنية: ${securityFileName}` : 'تم إجراء التحقيق الانضباطي وتوثيق المحضر الرسمي',
        penalty: 'إنذار مسلكي رسمي وحجز تحفظي',
        warningLevel: 'عالي',
        authority: currentRole,
        status: 'قيد التحقيق'
      },
      'ضابط الأمن والاستخبارات',
      currentRole,
      true // Detain
    );

    // Save attached image/file directly to personnel record attachments
    if (securityFileUrl) {
      StorageService.addAttachment(
        activeSoldier.militaryId,
        {
          title: securityFileName || 'وثيقة ومحضر استخباراتي وأمني',
          category: 'وثيقة أمنية',
          fileType: securityFileUrl.startsWith('data:image') ? 'image' : 'pdf',
          uploadDate: new Date().toISOString().split('T')[0],
          fileSize: '1.5 MB',
          fileUrl: securityFileUrl,
          uploadedBy: currentRole,
          notes: violationText
        },
        'فرع الاستخبارات والأمن العسكري',
        currentRole
      );
    }

    showSuccessNotice(`تم توثيق القيد الأمني والمرفقات وتوقيف الفرد ${activeSoldier.fullName} تحفظياً`);
    setViolationText('');
    setSecurityFileUrl('');
    setSecurityFileName('');
    onRefresh();
  };

  // Training Action: Course Enrolment
  const handleTrainingAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSoldier) return;

    StorageService.registerTrainingCourse(
      activeSoldier.militaryId,
      {
        courseName: courseName || 'دورة المهارات القتالية المتقدمة',
        courseType,
        startDate: courseStartDate,
        endDate: courseEndDate,
        supervisorOfficer,
        trainingLocation,
        grade: courseGrade,
        evaluation: 'دورة تدريبية متقدمة لرفع الجاهزية وتطوير المهارات القتالية الميدانية',
        certificates: 'شهادة دورة تخصصية معتمدة',
        updateStatusToField: true
      },
      supervisorOfficer || 'ضابط التدريب والدورات',
      currentRole
    );

    showSuccessNotice(`تم تسجيل الفرد (${activeSoldier.fullName}) بالدورة التدريبية (${courseName}) إشراف (${supervisorOfficer}) وانعكست على الجاهزية`);
    setCourseName('');
    onRefresh();
  };

  // Supply Action: Issue Clothing, Equipment, Uniforms
  const handleSupplyAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSoldier) return;

    StorageService.addSupplyLog(
      activeSoldier.militaryId,
      {
        itemType: supplyType,
        itemName: supplyItemName || 'بدلة ومهمات عسكرية رسمية',
        quantity: supplyQty,
        issueDate: new Date().toISOString().split('T')[0],
        condition: supplyCondition,
        issuedBy: currentRole,
        serialNumber: supplySerial || `EQP-${Math.floor(1000 + Math.random() * 9000)}`,
        notes: supplyNotes || 'صرف بفرع التموين والإمداد'
      },
      'ضابط التموين والإمداد',
      currentRole
    );

    showSuccessNotice(`تم صرف وتوثيق (${supplyItemName || 'المهمات والبدلات العسكرية'}) للفرد ${activeSoldier.fullName} بالسجل الإلكتروني`);
    setSupplyItemName('');
    setSupplySerial('');
    setSupplyNotes('');
    onRefresh();
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Banner Notice */}
      {notification && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-4 rounded-2xl flex items-center space-x-3 space-x-reverse shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-700" />
          <span className="font-bold text-xs">{notification}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <span className="text-xl">🏢</span>
            <h2 className="text-xl font-black text-slate-900 font-['Tajawal']">
              مساحة العمل الخاصة بفرع: ({currentRole})
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            صلاحية تنفيذ القرارات والإصدارات الخاصة بفرعك وتحديث الملف الإلكتروني والجاهزية تلقائياً
          </p>
        </div>

        {/* Selected Soldier Card */}
        {activeSoldier && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center space-x-3 space-x-reverse min-w-[240px]">
            <img
              src={activeSoldier.photoUrl}
              alt={activeSoldier.fullName}
              className="w-10 h-10 rounded-lg object-cover border border-slate-300"
            />
            <div>
              <div className="text-xs font-bold text-slate-900">{activeSoldier.fullName}</div>
              <div className="text-[10px] text-emerald-800 font-mono font-bold">{activeSoldier.rank} • {activeSoldier.militaryId}</div>
            </div>
          </div>
        )}
      </div>

      {/* Searchable Target Soldier Selector Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <TargetPersonnelSearchSelect
          personnel={personnel}
          selectedMilitaryId={selectedMilitaryId}
          onSelect={(militaryId) => setSelectedMilitaryId(militaryId)}
          label="اختيار الفرد المستهدف بالقرار أو الإجراء الإداري (ابحث بالاسم أو الرقم الوظيفي):"
          placeholder="ابحث بالاسم أو الرقم العسكري/الوظيفي أو الوحدة..."
        />
      </div>

      {/* Dynamic Action Panel based on Department Role */}

      {/* 1. HR MANAGEMENT WORKSPACE */}
      {(currentRole === 'إدارة الموارد البشرية' || currentRole === 'القيادة الرئيسية') && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 space-x-reverse border-b border-slate-200 pb-3">
            <Users className="w-5 h-5 text-blue-700" />
            <h3 className="text-base font-bold text-slate-900 font-['Tajawal']">
              إصدار القرارات الإدارية (إجازات، أذونات، مأموريات، فرار)
            </h3>
          </div>

          <form onSubmit={handleHRAction} className="space-y-4 text-xs text-right">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1">نوع القرار أو الحالة الجديدة *</label>
                <select
                  value={statusInput}
                  onChange={(e) => setStatusInput(e.target.value as PersonnelStatus)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:bg-white focus:border-emerald-600"
                >
                  <option value="إجازة">منح إجازة سنوية/ميدانية</option>
                  <option value="إذن">إصدار إذن خروج مؤقت</option>
                  <option value="مأمورية">تكليف بمأمورية خارجية</option>
                  <option value="منتدب">تكليف بانتداب خارجي (منتدب)</option>
                  <option value="متواجد">إعادة للخدمة والتواجد بالتمام</option>
                  <option value="في الميدان">انتقال للميدان والانتشار</option>
                  <option value="غياب">تسجيل غياب عن التتمام</option>
                  <option value="فرار">تسجيل فرار رسمي</option>
                  <option value="احتياط">إدراج بقوة الاحتياط</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">سبب القرار والتفاصيل *</label>
                <input
                  type="text"
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="أدخل نص الأسباب والتوجيه الإداري..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:bg-white focus:border-emerald-600"
                />
              </div>
            </div>

            <button
              type="submit"
              className="bg-blue-700 hover:bg-blue-800 text-white font-bold px-6 py-2 rounded-xl transition-all shadow-sm"
            >
              اعتماد القرار الإداري وتحديث الجاهزية اللحظية
            </button>
          </form>
        </div>
      )}

      {/* 2. ARMAMENT WORKSPACE */}
      {(currentRole === 'إدارة التسليح' || currentRole === 'القيادة الرئيسية') && (
        <ArmamentBranchWorkspace
          currentRole={currentRole}
          personnel={personnel}
          onRefresh={onRefresh}
          onSelectPersonnel={onSelectPersonnel}
          currentAccountName={currentAccountName}
        />
      )}

      {/* 3. MEDICAL WORKSPACE */}
      {(currentRole === 'الإدارة الطبية العسكرية' || currentRole === 'القيادة الرئيسية') && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 space-x-reverse border-b border-slate-200 pb-3">
            <Activity className="w-5 h-5 text-pink-700" />
            <h3 className="text-base font-bold text-slate-900 font-['Tajawal']">
              الإدارة الطبية العسكرية: تسجيل الوصفات العلاجية وفترة التعافي واستعادة الجاهزية
            </h3>
          </div>

          <form onSubmit={handleMedicalAction} className="space-y-4 text-xs text-right">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1">التشخيص الطبي *</label>
                <input
                  type="text"
                  required
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="التشخيص الجراحي أو الباطني..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:bg-white focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">اسم المستشفى العسكري</label>
                <input
                  type="text"
                  value={hospitalName}
                  onChange={(e) => setHospitalName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:bg-white focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">الطبيب المشرف والمعالج</label>
                <input
                  type="text"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:bg-white focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">تاريخ بداية التعافي *</label>
                <input
                  type="date"
                  required
                  value={recoveryStartDate}
                  onChange={(e) => setRecoveryStartDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-bold focus:outline-none focus:bg-white focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">تاريخ انتهاء التعافي (استعادة الجاهزية) *</label>
                <input
                  type="date"
                  required
                  value={recoveryEndDate}
                  onChange={(e) => setRecoveryEndDate(e.target.value)}
                  className="w-full bg-pink-50 border border-pink-300 text-pink-950 font-mono font-bold rounded-xl px-3 py-2 focus:outline-none focus:bg-white focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">تفاصيل الوصفة العلاجية والدوائية</label>
                <input
                  type="text"
                  value={prescriptionDetails}
                  onChange={(e) => setPrescriptionDetails(e.target.value)}
                  placeholder="الوصفة العلاجية والدوائية..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:bg-white focus:border-emerald-600"
                />
              </div>
            </div>

            <button
              type="submit"
              className="bg-pink-700 hover:bg-pink-800 text-white font-bold px-6 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer"
            >
              توثيق الوصفة الطبية وفترة التعافي وتحديث منحنى الجاهزية 🏥⚡
            </button>
          </form>
        </div>
      )}

      {/* 4. SUPPLY & LOGISTICS WORKSPACE (إدارة التموين والإمداد: صرف المهمات والبدلات العسكرية) */}
      {(currentRole === 'إدارة التموين والإمداد' || currentRole === 'القيادة الرئيسية') && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 space-x-reverse border-b border-slate-200 pb-3">
            <Package className="w-5 h-5 text-indigo-700" />
            <div>
              <h3 className="text-base font-bold text-slate-900 font-['Tajawal']">
                إدارة التموين والإمداد: صرف وتوثيق المهمات والبدلات العسكرية والعتاد
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                تقييد وتسجيل كل عملية صرف للمهمات، البدلات الرسمية، البساطير، الدروع، والمعدات الميدانية مع توثيق القيد بالملف الفردي مباشرة.
              </p>
            </div>
          </div>

          <form onSubmit={handleSupplyAction} className="space-y-4 text-xs text-right">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1">نوع الصنف / المهمة (إدخال يدوي) *</label>
                <input
                  type="text"
                  required
                  list="dept-supply-types-list"
                  value={supplyType}
                  onChange={(e) => setSupplyType(e.target.value)}
                  placeholder="اكتب تصنيف الصنف يدوياً..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:bg-white focus:border-emerald-600"
                />
                <datalist id="dept-supply-types-list">
                  <option value="بدلة عسكرية" />
                  <option value="بسطار/حذاء" />
                  <option value="خوذة/دروع" />
                  <option value="معدات ميدانية" />
                  <option value="مؤن/تجهيزات" />
                  <option value="أجهزة اتصالات" />
                  <option value="مهمات عسكرية أخرى" />
                </datalist>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">مسمى الصنف والمواصفات *</label>
                <input
                  type="text"
                  required
                  value={supplyItemName}
                  onChange={(e) => setSupplyItemName(e.target.value)}
                  placeholder="بدلة تمويه 2026 / بسطار تكتيكي..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:bg-white focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">الكمية المصروفة *</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={supplyQty}
                  onChange={(e) => setSupplyQty(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-mono font-bold focus:outline-none focus:bg-white focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">حالة الصنف</label>
                <select
                  value={supplyCondition}
                  onChange={(e) => setSupplyCondition(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-bold focus:outline-none focus:bg-white focus:border-emerald-600"
                >
                  <option value="جديد">جديد بالكرتون</option>
                  <option value="مستعمل ممتازة">مستعمل - حالة ممتازة</option>
                  <option value="مستعمل جيدة">مستعمل - حالة جيدة</option>
                  <option value="مستهلك">مستهلك / تحتاج تبديل</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1">الرقم التسلسلي / كود العهدة (اختياري)</label>
                <input
                  type="text"
                  value={supplySerial}
                  onChange={(e) => setSupplySerial(e.target.value)}
                  placeholder="UNIF-2026-901..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-mono focus:outline-none focus:bg-white focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">ملاحظات والتوجيه الإداري للصرف</label>
                <input
                  type="text"
                  value={supplyNotes}
                  onChange={(e) => setSupplyNotes(e.target.value)}
                  placeholder="أدخل أي ملاحظات خاصة بعهد الصرف..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:bg-white focus:border-emerald-600"
                />
              </div>
            </div>

            <button
              type="submit"
              className="bg-indigo-700 hover:bg-indigo-800 text-white font-bold px-6 py-2 rounded-xl transition-all shadow-sm"
            >
              اعتماد وتقييد عملية الصرف بالسجل الإلكتروني للفرد
            </button>
          </form>
        </div>
      )}

      {/* 4. FINANCIAL WORKSPACE */}
      {(currentRole === 'الإدارة المالية' || currentRole === 'القيادة الرئيسية') && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 space-x-reverse border-b border-slate-200 pb-3">
            <DollarSign className="w-5 h-5 text-teal-700" />
            <h3 className="text-base font-bold text-slate-900 font-['Tajawal']">
              الإدارة المالية: صرف المكافآت البدلات الحوافز والسلف
            </h3>
          </div>

          <form onSubmit={handleFinanceAction} className="space-y-4 text-xs text-right">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1">المبلغ المالي (ريال) *</label>
                <input
                  type="number"
                  required
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-mono text-sm font-bold focus:outline-none focus:bg-white focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">سبب الصرف والبيان *</label>
                <input
                  type="text"
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="بدل انتداب / مكافأة تميز..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:bg-white focus:border-emerald-600"
                />
              </div>
            </div>

            <button
              type="submit"
              className="bg-teal-700 hover:bg-teal-800 text-white font-bold px-6 py-2 rounded-xl transition-all shadow-sm"
            >
              توثيق العملية المالي بالسجل
            </button>
          </form>
        </div>
      )}

      {/* 5. SECURITY WORKSPACE */}
      {(currentRole === 'الاستخبارات والأمن' || currentRole === 'القيادة الرئيسية') && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 space-x-reverse border-b border-slate-200 pb-3">
            <Lock className="w-5 h-5 text-rose-700" />
            <h3 className="text-base font-bold text-slate-900 font-['Tajawal']">
              الاستخبارات والأمن العسكري: تسجيل المخالفات والتحقيق والإيقاف
            </h3>
          </div>

          <form onSubmit={handleSecurityAction} className="space-y-4 text-xs text-right">
            <div>
              <label className="block text-slate-700 font-bold mb-1">تفاصيل المخالفة والأمر الأمني *</label>
              <textarea
                required
                rows={3}
                value={violationText}
                onChange={(e) => setViolationText(e.target.value)}
                placeholder="أدخل نص المحضر الانضباطي وقرار التوقيف..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-800 focus:outline-none focus:bg-white focus:border-emerald-600"
              ></textarea>
            </div>

            {/* Security Attachment / Image Upload Section */}
            <div className="bg-rose-50/70 border border-rose-200 p-3.5 rounded-xl space-y-2">
              <label className="block text-rose-900 font-bold flex items-center space-x-1.5 space-x-reverse">
                <Paperclip className="w-4 h-4 text-rose-700" />
                <span>إرفاق ملف / صورة وثيقة استخباراتية وأمنية (تظهر فوراً بملف الفرد):</span>
              </label>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <label className="cursor-pointer bg-white border border-rose-300 hover:bg-rose-100 text-rose-900 px-4 py-2 rounded-xl flex items-center space-x-2 space-x-reverse font-bold shadow-xs transition-all">
                  <Upload className="w-4 h-4 text-rose-700" />
                  <span>اختر صورة أو وثيقة من جهازك</span>
                  <input
                    type="file"
                    accept="image/*,application/pdf,.doc,.docx"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setSecurityFileName(file.name);
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          setSecurityFileUrl(event.target?.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>

                {securityFileName && (
                  <div className="flex items-center space-x-2 space-x-reverse text-xs bg-white px-3 py-1.5 rounded-lg border border-rose-200 font-bold text-slate-800">
                    <ImageIcon className="w-4 h-4 text-rose-600" />
                    <span className="truncate max-w-[200px]">{securityFileName}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSecurityFileUrl('');
                        setSecurityFileName('');
                      }}
                      className="text-rose-600 hover:text-rose-800 mr-2 font-black"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

              {securityFileUrl && securityFileUrl.startsWith('data:image') && (
                <div className="mt-2">
                  <span className="text-[10px] text-slate-500 font-bold block mb-1">معاينة الصورة المرفقة:</span>
                  <img
                    src={securityFileUrl}
                    alt="معاينة المرفق الأمني"
                    className="w-32 h-24 object-cover rounded-xl border-2 border-rose-400 shadow-sm"
                  />
                </div>
              )}
            </div>

            <button
              type="submit"
              className="bg-rose-700 hover:bg-rose-800 text-white font-bold px-6 py-2 rounded-xl transition-all shadow-sm"
            >
              تسجيل القيد الأمني والمرفقات وتوقيف الفرد
            </button>
          </form>
        </div>
      )}

      {/* 6. TRAINING WORKSPACE */}
      {(currentRole === 'إدارة التدريب' || currentRole === 'القيادة الرئيسية') && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 space-x-reverse border-b border-slate-200 pb-3">
            <Award className="w-5 h-5 text-purple-700" />
            <h3 className="text-base font-bold text-slate-900 font-['Tajawal']">
              إدارة التدريب: الالتحاق بالدورات العسكرية وتعيين المشرف وتحديث القيد
            </h3>
          </div>

          <form onSubmit={handleTrainingAction} className="space-y-4 text-xs text-right">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-slate-700 font-bold mb-1">اسم الدورة العسكرية *</label>
                <input
                  type="text"
                  required
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  placeholder="دورة صيانة مدرعات / دورة قناصة / دورة قيادة..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-bold focus:outline-none focus:bg-white focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">نوع الدورة</label>
                <select
                  value={courseType}
                  onChange={(e) => setCourseType(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-bold focus:outline-none focus:bg-white focus:border-purple-600"
                >
                  <option value="ميداني">ميداني وتكتيكي</option>
                  <option value="قيادي">قيادي وإداري</option>
                  <option value="تقني">تقني وفني</option>
                  <option value="أمني">أمني واستخباراتي</option>
                  <option value="تخصصي">تخصصي نوعي</option>
                  <option value="خارجي">دورة خارجية</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">الضابط المشرف على الدورة *</label>
                <input
                  type="text"
                  required
                  value={supervisorOfficer}
                  onChange={(e) => setSupervisorOfficer(e.target.value)}
                  placeholder="رتبة واسم الضابط المشرف..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-bold focus:outline-none focus:bg-white focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">تاريخ بداية الدورة *</label>
                <input
                  type="date"
                  required
                  value={courseStartDate}
                  onChange={(e) => setCourseStartDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-bold focus:outline-none focus:bg-white focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">تاريخ انتهاء الدورة *</label>
                <input
                  type="date"
                  required
                  value={courseEndDate}
                  onChange={(e) => setCourseEndDate(e.target.value)}
                  className="w-full bg-purple-50 border border-purple-300 text-purple-950 font-mono font-bold rounded-xl px-3 py-2 focus:outline-none focus:bg-white focus:border-purple-600"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-slate-700 font-bold mb-1">مكان ومقر التدريب</label>
                <input
                  type="text"
                  value={trainingLocation}
                  onChange={(e) => setTrainingLocation(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:bg-white focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">التقدير المتوقع</label>
                <select
                  value={courseGrade}
                  onChange={(e) => setCourseGrade(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-bold focus:outline-none focus:bg-white focus:border-purple-600"
                >
                  <option value="ممتاز">ممتاز</option>
                  <option value="جيد جداً">جيد جداً</option>
                  <option value="جيد">جيد</option>
                  <option value="مقبول">مقبول</option>
                  <option value="مؤهل">مؤهل / اجتاز</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="bg-purple-700 hover:bg-purple-800 text-white font-bold px-6 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer"
            >
              إدراج القيد بسجل الدورات وتحديث مؤشرات الجاهزية 🎓⚡
            </button>
          </form>
        </div>
      )}

    </div>
  );
};
