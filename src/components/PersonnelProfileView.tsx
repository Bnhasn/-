import React, { useState } from 'react';
import {
  ArrowRight,
  Shield,
  Activity,
  DollarSign,
  Lock,
  Crosshair,
  Award,
  Paperclip,
  Clock,
  Plus,
  FileText,
  Printer,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Building,
  Upload,
  UserCheck,
  Package,
  Trash2,
  Scan,
  ShieldCheck
} from 'lucide-react';
import { FaceVerificationModal, FaceVerificationResult } from './FaceVerificationModal';
import {
  PersonnelRecord,
  DepartmentRole,
  PersonnelStatus,
  MovementLog,
  AttendanceLog,
  MedicalLog,
  FinancialLog,
  SecurityLog,
  ArmamentLog,
  TrainingLog,
  PersonnelAttachment,
  SupplyLog
} from '../types';
import { StorageService } from '../lib/storage';
import {
  getPersonnelCustodies,
  getPersonnelChronologicalDispenses,
  getStatusBadgeConfig
} from '../lib/personnelUtils';

interface PersonnelProfileViewProps {
  personnel: PersonnelRecord;
  onBack: () => void;
  onRefresh: () => void;
  currentRole: DepartmentRole;
  onPrintProfile: (p: PersonnelRecord) => void;
  onDeletePersonnel?: (militaryId: string, name: string) => void;
}

export const PersonnelProfileView: React.FC<PersonnelProfileViewProps> = ({
  personnel,
  onBack,
  onRefresh,
  currentRole,
  onPrintProfile,
  onDeletePersonnel
}) => {
  const [activeTab, setActiveTab] = useState<
    'custody' | 'chronologicalDispenses' | 'movement' | 'attendance' | 'medical' | 'financial' | 'security' | 'armament' | 'supply' | 'training' | 'attachments'
  >('custody');

  // Modal forms states for adding new log items
  const [showAddModal, setShowAddModal] = useState(false);

  // Quick form states
  const [formType, setFormType] = useState<string>('');
  const [formText1, setFormText1] = useState('');
  const [formText2, setFormText2] = useState('');
  const [formText3, setFormText3] = useState('');
  const [formNum1, setFormNum1] = useState<number>(0);
  const [formDate1, setFormDate1] = useState(new Date().toISOString().split('T')[0]);
  const [dispensesFilterQuery, setDispensesFilterQuery] = useState('');
  const [previewImageModal, setPreviewImageModal] = useState<string | null>(null);
  const [showFaceVerificationModal, setShowFaceVerificationModal] = useState(false);
  const [lastFaceVerification, setLastFaceVerification] = useState<FaceVerificationResult | null>(null);

  const handleFaceVerified = (result: FaceVerificationResult) => {
    setLastFaceVerification(result);
    StorageService.logAction(
      currentRole,
      'الاستخبارات والأمن',
      'فحص واختبار مسح الوجه المباشر',
      personnel.militaryId,
      personnel.fullName,
      `تم إجراء فحص مسح الوجه المباشر للفرد (${personnel.rank} / ${personnel.fullName}) بنسبة مطابقة حيومية ${result.matchScore}% وتوقيع رقمي معتمد.`,
      personnel.militaryId,
      personnel.fullName
    );
    if (onRefresh) onRefresh();
  };

  // Extract Custody list & Chronological dispenses list
  const custodiesList = getPersonnelCustodies(personnel);
  const chronologicalDispensesList = getPersonnelChronologicalDispenses(personnel);

  const filteredDispenses = chronologicalDispensesList.filter((d) => {
    const q = dispensesFilterQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      d.itemName.toLowerCase().includes(q) ||
      d.branch.toLowerCase().includes(q) ||
      d.dispenseType.toLowerCase().includes(q) ||
      d.orderNumber.toLowerCase().includes(q) ||
      d.details.toLowerCase().includes(q)
    );
  });

  const handleAddLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (activeTab === 'movement') {
      StorageService.addMovementLog(
        personnel.militaryId,
        {
          date: formDate1,
          type: (formType as any) || 'أمر إداري',
          details: formText1,
          issuingAuthority: formText2 || currentRole,
          effectiveDate: formDate1
        },
        'المستخدم الحالي',
        currentRole
      );
    } else if (activeTab === 'attendance') {
      StorageService.updateStatus(
        personnel.militaryId,
        (formType as any) || 'إجازة',
        formText1,
        'المستخدم الحالي',
        currentRole
      );
    } else if (activeTab === 'medical') {
      StorageService.addMedicalLog(
        personnel.militaryId,
        {
          date: formDate1,
          diagnosis: formText1,
          hospital: formText2 || 'المستشفى العسكري المركزي',
          doctor: formText3 || 'طبيب عسكري معتمد',
          sickLeaveDays: formNum1 || 3,
          medications: [
            {
              id: `med-med-${Date.now()}`,
              name: 'علاج وصرف صيدلاني عسكري',
              dose: 'حسب إرشادات الطبيب المعالج',
              dateDispensed: formDate1,
              prescribedBy: formText3 || 'طبيب عسكري'
            }
          ]
        },
        'المستخدم الحالي',
        currentRole,
        formType === 'تنويم مستشفى'
      );
    } else if (activeTab === 'financial') {
      StorageService.addFinancialLog(
        personnel.militaryId,
        {
          date: formDate1,
          type: (formType as any) || 'مكافأة',
          amount: formNum1 || 1000,
          reason: formText1,
          transactionDate: formDate1
        },
        'المستخدم الحالي',
        currentRole
      );
    } else if (activeTab === 'security') {
      StorageService.addSecurityLog(
        personnel.militaryId,
        {
          date: formDate1,
          violation: formText1,
          investigationDetails: formText2,
          penalty: formText3 || 'إنذار مسلكي',
          warningLevel: 'متوسط',
          authority: currentRole,
          status: 'تم البت'
        },
        'المستخدم الحالي',
        currentRole
      );
    } else if (activeTab === 'armament') {
      StorageService.addArmamentLog(
        personnel.militaryId,
        {
          weaponSerial: formText1 || `WPN-${Math.floor(Math.random() * 90000)}`,
          weaponType: formText2 || 'بندقية M4A1 5.56mm',
          issueDate: formDate1,
          ammoQty: formNum1 || 90,
          firelinesCount: 3,
          ammoHistory: [
            {
              id: `ah-${Date.now()}`,
              type: 'صرف',
              quantity: formNum1 || 90,
              date: formDate1,
              reason: 'صرف حزمة تسليح معتمدة',
              issuedBy: currentRole
            }
          ],
          condition: 'ممتازة',
          technicalNotes: formText3 || 'فحص أمان فني ناجح'
        },
        'المستخدم الحالي',
        currentRole
      );
    } else if (activeTab === 'training') {
      StorageService.addTrainingLog(
        personnel.militaryId,
        {
          courseName: formText1,
          courseType: 'تخصصي',
          provider: formText2 || 'معهد القوات المسلحة',
          startDate: formDate1,
          endDate: formDate1,
          durationWeeks: formNum1 || 4,
          grade: 'ممتاز',
          evaluation: formText3 || 'تقييم عالي الأداء',
          certificates: 'شهادة اجتياز دورة معتمدة'
        },
        'المستخدم الحالي',
        currentRole
      );
    } else if (activeTab === 'supply') {
      StorageService.addSupplyLog(
        personnel.militaryId,
        {
          itemType: (formType as any) || 'بدلة عسكرية',
          itemName: formText1 || 'بدلة تمويه ومهمات عسكرية رسمية',
          quantity: formNum1 || 1,
          issueDate: formDate1,
          condition: 'جديد',
          issuedBy: currentRole,
          serialNumber: formText2 || `EQP-${Math.floor(1000 + Math.random() * 9000)}`,
          notes: formText3 || 'صرف وتوثيق بسجل الفرد العسكري'
        },
        'المستخدم الحالي',
        currentRole
      );
    } else if (activeTab === 'attachments') {
      StorageService.addAttachment(
        personnel.militaryId,
        {
          title: formText1 || 'مستند عسكري رسمي',
          category: (formType as any) || 'قرار إداري',
          fileType: 'pdf',
          uploadDate: formDate1,
          fileSize: '1.5 MB'
        },
        'المستخدم الحالي',
        currentRole
      );
    }

    setShowAddModal(false);
    setFormText1('');
    setFormText2('');
    setFormText3('');
    setFormNum1(0);
    onRefresh();
  };

  // Calculate totals for financial summary
  const totalFinancialSpent = personnel.logs.financial.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Navigation & Action Controls */}
      <div className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 space-x-reverse bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2 rounded-xl text-xs font-bold transition-all border border-slate-300"
        >
          <ArrowRight className="w-4 h-4 text-emerald-700" />
          <span>العودة لقائمة القوة البشرية</span>
        </button>

        <div className="flex items-center space-x-2 space-x-reverse">
          <button
            onClick={() => setShowFaceVerificationModal(true)}
            className="flex items-center space-x-2 space-x-reverse bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-emerald-400 border border-emerald-500/50 px-4 py-2 rounded-xl text-xs font-black transition-all shadow-md cursor-pointer"
            title="مسح وجه الفرد بالكاميرا للتحقق من هوية الملف الإلكتروني"
          >
            <Scan className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>مسح الوجه واختبار الهوية 📸</span>
          </button>

          <button
            onClick={() => onPrintProfile(personnel)}
            className="flex items-center space-x-2 space-x-reverse bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-xl text-xs font-extrabold transition-all shadow-md"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة الملف الشامل (PDF)</span>
          </button>

          {onDeletePersonnel && (
            <button
              onClick={() => onDeletePersonnel(personnel.militaryId, personnel.fullName)}
              className="flex items-center space-x-1.5 space-x-reverse bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-300 px-3.5 py-2 rounded-xl text-xs font-bold transition-all"
              title="نقل الملف لسلة المحذوفات (احتفاظ لمدة 30 يوم)"
            >
              <Trash2 className="w-4 h-4" />
              <span>نقل لسلة المحذوفات</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Personnel Military Badge Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-5 md:space-x-reverse text-center md:text-right">
            <img
              src={personnel.photoUrl}
              alt={personnel.fullName}
              className="w-24 h-24 md:w-28 md:h-28 rounded-2xl object-cover border-2 border-emerald-600 shadow-md"
            />

            <div className="space-y-1.5">
              <div className="flex items-center justify-center md:justify-start space-x-2 space-x-reverse">
                <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-extrabold px-3 py-0.5 rounded-md">
                  {personnel.rank}
                </span>
                <span className="text-xs font-mono bg-slate-100 text-slate-800 border border-slate-300 px-2.5 py-0.5 rounded-md font-bold">
                  الرقم الوظيفي: {personnel.militaryId}
                </span>
              </div>

              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 font-['Tajawal']">
                {personnel.fullName}
              </h2>

              <p className="text-xs text-slate-600 font-medium">
                {personnel.unit} • {personnel.battalion} • {personnel.company}
              </p>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-1 text-[11px] text-slate-500 font-medium">
                <span>الرقم الوطني: <strong className="text-slate-900">{personnel.nationalId}</strong></span>
                <span>•</span>
                <span>فصيلة الدم: <strong className="text-rose-700 font-mono font-bold">{personnel.bloodType}</strong></span>
                <span>•</span>
                <span>الهاتف: <strong className="text-slate-900">{personnel.phone}</strong></span>
                <span>•</span>
                <span>الوظيفة: <strong className="text-slate-900">{personnel.jobTitle}</strong></span>
              </div>

              {/* Family & Guarantor Intelligence Card */}
              <div className="mt-2 pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-2 text-right text-[11px] bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/80">
                <div>
                  <span className="text-slate-500 font-bold block">اسم الأم:</span>
                  <span className="font-extrabold text-slate-900">{personnel.motherName || 'غير مسجل'}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold block">اسم الضمين (الكفيل):</span>
                  <span className="font-extrabold text-indigo-900">{personnel.guarantorName || 'غير مسجل'}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold block">أقرب القرباء وهاتفه:</span>
                  <span className="font-extrabold text-slate-900">
                    {personnel.relativeName || 'غير مسجل'} {personnel.relativePhone ? `(${personnel.relativePhone})` : ''}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Current Status Badge Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center min-w-[200px]">
            <span className="text-[11px] text-slate-500 font-bold block mb-1">الحالة الحالية بالفرد</span>
            <span
              className={`inline-block text-sm font-bold px-4 py-1.5 rounded-xl border font-['Tajawal'] ${
                ['متواجد', 'في الميدان'].includes(personnel.currentStatus)
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : ['إجازة', 'إذن', 'مأمورية'].includes(personnel.currentStatus)
                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                  : personnel.currentStatus === 'منتدب'
                  ? 'bg-purple-100 text-purple-900 border-purple-300'
                  : ['مستشفى'].includes(personnel.currentStatus)
                  ? 'bg-pink-100 text-pink-800 border-pink-300'
                  : 'bg-rose-100 text-rose-800 border-rose-300'
              }`}
            >
              {personnel.currentStatus}
            </span>
            {personnel.currentStatus === 'منتدب' && personnel.secondedUnit && (
              <span className="text-[11px] text-purple-900 font-bold block mt-1.5 bg-purple-100/80 px-2.5 py-1 rounded-lg border border-purple-300">
                منتدب لدى: {personnel.secondedUnit}
              </span>
            )}
            <span className="text-[10px] text-slate-500 font-medium block mt-2">
              تاريخ الالتحاق: {personnel.enlistmentDate}
            </span>
          </div>

        </div>
      </div>

      {/* Electronic Log Subtabs Navigation */}
      <div className="bg-white border border-slate-200 rounded-2xl p-2 shadow-sm overflow-x-auto">
        <div className="flex items-center space-x-1 space-x-reverse min-w-max text-xs font-bold">
          
          <button
            onClick={() => setActiveTab('custody')}
            className={`flex items-center space-x-1.5 space-x-reverse px-4 py-2.5 rounded-xl transition-all ${
              activeTab === 'custody'
                ? 'bg-indigo-800 text-white shadow-md font-extrabold'
                : 'bg-indigo-50 text-indigo-900 border border-indigo-200 hover:bg-indigo-100'
            }`}
          >
            <Package className="w-4 h-4 text-amber-400" />
            <span>لوحة العهد الحالية ({custodiesList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('chronologicalDispenses')}
            className={`flex items-center space-x-1.5 space-x-reverse px-4 py-2.5 rounded-xl transition-all ${
              activeTab === 'chronologicalDispenses'
                ? 'bg-slate-900 text-white shadow-md font-extrabold'
                : 'bg-slate-100 text-slate-800 border border-slate-200 hover:bg-slate-200'
            }`}
          >
            <Clock className="w-4 h-4 text-emerald-400" />
            <span>سجل الصرف الزمني الشامل ({chronologicalDispensesList.length})</span>
          </button>

          <span className="h-6 w-px bg-slate-300 mx-1"></span>

          <button
            onClick={() => setActiveTab('movement')}
            className={`flex items-center space-x-1.5 space-x-reverse px-4 py-2.5 rounded-xl transition-all ${
              activeTab === 'movement'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>1. سجل الحركة ({personnel.logs.movement.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('attendance')}
            className={`flex items-center space-x-1.5 space-x-reverse px-4 py-2.5 rounded-xl transition-all ${
              activeTab === 'attendance'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>2. سجل الحضور والانضباط ({personnel.logs.attendance.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('medical')}
            className={`flex items-center space-x-1.5 space-x-reverse px-4 py-2.5 rounded-xl transition-all ${
              activeTab === 'medical'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>3. السجل الطبي ({personnel.logs.medical.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('financial')}
            className={`flex items-center space-x-1.5 space-x-reverse px-4 py-2.5 rounded-xl transition-all ${
              activeTab === 'financial'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>4. السجل المالي ({personnel.logs.financial.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center space-x-1.5 space-x-reverse px-4 py-2.5 rounded-xl transition-all ${
              activeTab === 'security'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>5. السجل الأمني ({personnel.logs.security.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('armament')}
            className={`flex items-center space-x-1.5 space-x-reverse px-4 py-2.5 rounded-xl transition-all ${
              activeTab === 'armament'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Crosshair className="w-4 h-4" />
            <span>6. سجل التسليح ({personnel.logs.armament.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('supply')}
            className={`flex items-center space-x-1.5 space-x-reverse px-4 py-2.5 rounded-xl transition-all ${
              activeTab === 'supply'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>7. المهمات والبدلات العسكرية ({personnel.logs.supply?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('training')}
            className={`flex items-center space-x-1.5 space-x-reverse px-4 py-2.5 rounded-xl transition-all ${
              activeTab === 'training'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>8. سجل الدورات والتدريب ({personnel.logs.training.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('attachments')}
            className={`flex items-center space-x-1.5 space-x-reverse px-4 py-2.5 rounded-xl transition-all ${
              activeTab === 'attachments'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Paperclip className="w-4 h-4" />
            <span>9. مرفقات الفرد ({personnel.logs.attachments.length})</span>
          </button>

        </div>
      </div>

      {/* Subtab Content Area */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
        
        {/* Subtab Top Controls */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div>
            <h3 className="text-lg font-bold text-slate-900 font-['Tajawal']">
              {activeTab === 'custody' && 'لوحة العهد الشخصية الحالية المصروفة للفرد'}
              {activeTab === 'chronologicalDispenses' && 'سجل عمليات الصرف الزمني الشامل (تسليح • تموين • طبي)'}
              {activeTab === 'movement' && 'سجل الحركة والتنقلات والترقيات'}
              {activeTab === 'attendance' && 'سجل الحضور والغياب والإجازات والفرار'}
              {activeTab === 'medical' && 'السجل الطبي والأدوية المصروفة والعمليات'}
              {activeTab === 'financial' && 'السجل المالي والرواتب والبدلات والمكافآت'}
              {activeTab === 'security' && 'السجل الأمني والمخالفات والتحقيقات والقرارات المتخذة'}
              {activeTab === 'armament' && 'سجل التسليح الشخصي وصرف واسترجاع الذخيرة'}
              {activeTab === 'supply' && 'سجل المهمات والبدلات العسكرية وعهد التموين المصروفة'}
              {activeTab === 'training' && 'سجل التدريب والدورات والتقييم والشهادات'}
              {activeTab === 'attachments' && 'المستندات والمرفقات والقرارات المرفوعة'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              جميع المدخلات موثقة وتحدث آلياً بالتكامل مع الفروع والإدارات المختصة
            </p>
          </div>

          {activeTab !== 'custody' && activeTab !== 'chronologicalDispenses' && (
            <button
              onClick={() => {
                setFormType('');
                setFormText1('');
                setFormText2('');
                setFormText3('');
                setFormNum1(0);
                setShowAddModal(true);
              }}
              className="flex items-center space-x-1.5 space-x-reverse bg-emerald-700 hover:bg-emerald-800 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة قيد بالسجل</span>
            </button>
          )}
        </div>

        {/* TAB 0.1: CUSTODY DASHBOARD */}
        {activeTab === 'custody' && (
          <div className="space-y-6">
            {/* Overview Stats Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl">
                <span className="text-[11px] font-bold text-indigo-700 block">إجمالي العهد المقيدة</span>
                <span className="text-2xl font-black text-indigo-950 font-mono mt-1 block">
                  {custodiesList.length}
                </span>
                <span className="text-[10px] text-indigo-600 font-medium mt-1 block">
                  أسلحة، ذخائر، مهمات، ومستلزمات
                </span>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                <span className="text-[11px] font-bold text-amber-800 block">عهد التسليح والذخيرة</span>
                <span className="text-2xl font-black text-amber-950 font-mono mt-1 block">
                  {custodiesList.filter((c) => c.category === 'تسليح').length}
                </span>
                <span className="text-[10px] text-amber-700 font-medium mt-1 block">قطع تسليح معتمدة</span>
              </div>

              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
                <span className="text-[11px] font-bold text-emerald-800 block">مهمات التموين والبدلات</span>
                <span className="text-2xl font-black text-emerald-950 font-mono mt-1 block">
                  {custodiesList.filter((c) => c.category === 'تموين وإمداد').length}
                </span>
                <span className="text-[10px] text-emerald-700 font-medium mt-1 block">تجهيزات وبدلات عسكرية</span>
              </div>

              <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl">
                <span className="text-[11px] font-bold text-purple-800 block">أدوية ومستلزمات طبية</span>
                <span className="text-2xl font-black text-purple-950 font-mono mt-1 block">
                  {custodiesList.filter((c) => c.category === 'طبية').length}
                </span>
                <span className="text-[10px] text-purple-700 font-medium mt-1 block">وصفات طبية مصروفة</span>
              </div>
            </div>

            {/* Custody Items Grid / Cards */}
            {custodiesList.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 border border-dashed border-slate-300 rounded-2xl text-slate-500 text-xs font-bold">
                لا توجد أي عهدة مقيدة حالياً بذمة هذا الفرد.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {custodiesList.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 bg-white border border-slate-200 hover:border-slate-300 rounded-2xl shadow-2xs space-y-3 relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                        <span className="font-extrabold text-sm text-slate-900 font-['Tajawal']">
                          {item.itemName}
                        </span>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-lg border ${
                          item.category === 'تسليح'
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : item.category === 'تموين وإمداد'
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                            : 'bg-purple-100 text-purple-900 border-purple-300'
                        }`}
                      >
                        {item.category}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-400 text-[10px] block">الرقم التسلسلي / الكود:</span>
                        <span className="font-mono font-bold text-slate-800">{item.serialOrCode || '-'}</span>
                      </div>

                      <div>
                        <span className="text-slate-400 text-[10px] block">الكمية المصروفة:</span>
                        <span className="font-bold text-slate-900">{item.quantity}</span>
                      </div>

                      <div>
                        <span className="text-slate-400 text-[10px] block">تاريخ الصرف:</span>
                        <span className="font-mono text-slate-700">{item.issueDate}</span>
                      </div>

                      <div>
                        <span className="text-slate-400 text-[10px] block">الحالة الفنية:</span>
                        <span className="font-bold text-emerald-800">{item.condition}</span>
                      </div>

                      <div>
                        <span className="text-slate-400 text-[10px] block">رقم أمر الصرف:</span>
                        <span className="font-mono text-xs font-bold text-indigo-900">{item.orderNumber}</span>
                      </div>

                      <div>
                        <span className="text-slate-400 text-[10px] block">جهة الصرف:</span>
                        <span className="font-bold text-slate-800">{item.issuingBranch}</span>
                      </div>
                    </div>

                    {item.notes && (
                      <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-xl border border-slate-100 font-medium">
                        ملاحظات: {item.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 0.2: CHRONOLOGICAL DISPENSES */}
        {activeTab === 'chronologicalDispenses' && (
          <div className="space-y-4">
            {/* Search Filter for Dispenses */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <input
                type="text"
                value={dispensesFilterQuery}
                onChange={(e) => setDispensesFilterQuery(e.target.value)}
                placeholder="تصفية الصرفيات بالاسم، نوع المادة، الفرع، أمر الصرف..."
                className="w-full sm:w-80 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-600"
              />

              <button
                onClick={() => window.print()}
                className="flex items-center space-x-1.5 space-x-reverse bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0"
              >
                <Printer className="w-4 h-4 text-emerald-400" />
                <span>طباعة سجل الصرف الزمني</span>
              </button>
            </div>

            {/* Timeline Table */}
            {filteredDispenses.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs font-bold">
                لا توجد سجلات صرف مسجلة تطابق التصفية.
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-900 text-white text-[11px] font-bold">
                    <tr>
                      <th className="p-3">التاريخ</th>
                      <th className="p-3">الفرع المختص</th>
                      <th className="p-3">نوع الصرف</th>
                      <th className="p-3">المادة / العتاد</th>
                      <th className="p-3">تفاصيل المادة</th>
                      <th className="p-3">الكمية</th>
                      <th className="p-3">رقم أمر الصرف</th>
                      <th className="p-3">المسؤول عن الصرف</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                    {filteredDispenses.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-mono font-bold text-slate-900 whitespace-nowrap">{d.date}</td>
                        <td className="p-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-lg font-bold text-[10px] border ${
                              d.branch === 'فرع التسليح'
                                ? 'bg-amber-100 text-amber-900 border-amber-300'
                                : d.branch === 'فرع التموين والإمداد'
                                ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                : 'bg-purple-100 text-purple-900 border-purple-300'
                            }`}
                          >
                            {d.branch}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-slate-900">{d.dispenseType}</td>
                        <td className="p-3 font-black text-emerald-950 font-['Tajawal']">{d.itemName}</td>
                        <td className="p-3 text-slate-600 text-[11px]">{d.details}</td>
                        <td className="p-3 font-mono font-bold text-slate-900">{d.quantity}</td>
                        <td className="p-3 font-mono font-bold text-indigo-900">{d.orderNumber}</td>
                        <td className="p-3 text-slate-700">{d.issuedBy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 1. MOVEMENT LOG TAB */}
        {activeTab === 'movement' && (
          <div className="space-y-4">
            {personnel.logs.movement.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                لا توجد سجلات حركة مسجلة لهذا الفرد حتى الآن.
              </div>
            ) : (
              <div className="space-y-3">
                {personnel.logs.movement.map((m) => (
                  <div
                    key={m.id}
                    className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-start justify-between gap-4 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <span className="font-extrabold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded">
                          {m.type}
                        </span>
                        <span className="text-slate-500 text-[11px] font-medium">تاريخ القرار: {m.date}</span>
                      </div>
                      <p className="text-slate-900 font-bold pt-1">{m.details}</p>
                      <p className="text-slate-500 text-[11px] font-medium">الجهة المصدرة: {m.issuingAuthority}</p>
                    </div>

                    <span className="text-[11px] bg-white border border-slate-300 px-2.5 py-1 rounded text-slate-800 font-mono font-bold shadow-2xs">
                      ساري من: {m.effectiveDate}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 2. ATTENDANCE & DISCIPLINE TAB */}
        {activeTab === 'attendance' && (
          <div className="space-y-4">
            {personnel.logs.attendance.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                لا توجد حركات انضباط أو إجازات مسجلة.
              </div>
            ) : (
              <div className="space-y-3">
                {personnel.logs.attendance.map((att) => (
                  <div
                    key={att.id}
                    className={`p-4 rounded-xl border flex items-start justify-between text-xs ${
                      ['إجازة', 'إذن'].includes(att.type)
                        ? 'bg-amber-50 border-amber-300 text-amber-900'
                        : ['فرار', 'غياب', 'احتجاز'].includes(att.type)
                        ? 'bg-rose-50 border-rose-300 text-rose-900'
                        : 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <span className="font-black text-sm">{att.type}</span>
                        <span className="text-[11px] opacity-75">التاريخ: {att.date}</span>
                      </div>
                      <p className="font-semibold text-slate-800">{att.reason}</p>
                      <p className="text-[11px] opacity-75">المعتمد: {att.approvedBy}</p>
                    </div>

                    <div className="text-left font-mono text-[11px] font-bold">
                      <div>المدة: {att.durationDays} يوم</div>
                      {att.endDate && <div>حتى: {att.endDate}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 3. MEDICAL LOG TAB */}
        {activeTab === 'medical' && (
          <div className="space-y-4">
            {personnel.logs.medical.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                السجل الطبي نظيف - لا توجد إصابات أو إجازات مرضية مسجلة.
              </div>
            ) : (
              <div className="space-y-4">
                {personnel.logs.medical.map((med) => (
                  <div key={med.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <Activity className="w-4 h-4 text-pink-600" />
                        <span className="font-bold text-slate-900 text-sm">{med.diagnosis}</span>
                      </div>
                      <span className="text-slate-500 text-[11px] font-medium">{med.date}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-slate-700 text-[11px]">
                      <div>المستشفى: <strong className="text-slate-900">{med.hospital}</strong></div>
                      <div>الطبيب المعالج: <strong className="text-slate-900">{med.doctor}</strong></div>
                      <div>الإجازة المرضية: <strong className="text-pink-700">{med.sickLeaveDays} أيام</strong></div>
                    </div>

                    {med.injuryDetails && (
                      <div className="p-2 bg-white border border-slate-200 rounded text-slate-700">
                        تفاصيل الإصابة: {med.injuryDetails}
                      </div>
                    )}

                    {med.surgicalOperations && (
                      <div className="p-2 bg-pink-50 border border-pink-200 rounded text-pink-800 font-bold">
                        العمليات الجراحية: {med.surgicalOperations}
                      </div>
                    )}

                    {/* Dispensed Medications List */}
                    {med.medications && med.medications.length > 0 && (
                      <div className="pt-2 border-t border-slate-200 space-y-1.5">
                        <span className="text-[11px] font-bold text-emerald-800 block">الأدوية والعلاجات المصروفة:</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {med.medications.map((m) => (
                            <div key={m.id} className="p-2 bg-white border border-slate-200 rounded flex justify-between items-center text-[11px]">
                              <div>
                                <div className="font-bold text-slate-800">{m.name}</div>
                                <div className="text-slate-500 text-[10px]">{m.dose}</div>
                              </div>
                              <span className="text-slate-500 font-mono text-[10px]">{m.dateDispensed}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 4. FINANCIAL LOG TAB */}
        {activeTab === 'financial' && (
          <div className="space-y-4">
            <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800">إجمالي المبالغ المصروفة للفرد طوال الخدمة:</span>
              <span className="text-xl font-black text-teal-800 font-mono">{totalFinancialSpent.toLocaleString()} ريال</span>
            </div>

            {personnel.logs.financial.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                لا توجد عمليات مالية مسجلة.
              </div>
            ) : (
              <div className="space-y-2">
                {personnel.logs.financial.map((fin) => (
                  <div key={fin.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                          fin.type === 'استقطاع' ? 'bg-rose-100 text-rose-800 border border-rose-300' : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        }`}>
                          {fin.type}
                        </span>
                        <span className="font-bold text-slate-900">{fin.reason}</span>
                      </div>
                      <span className="text-slate-500 text-[10px]">التاريخ: {fin.transactionDate}</span>
                    </div>

                    <span className={`text-base font-bold font-mono ${
                      fin.type === 'استقطاع' ? 'text-rose-700' : 'text-emerald-800'
                    }`}>
                      {fin.type === 'استقطاع' ? '-' : '+'}{fin.amount.toLocaleString()} ريال
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 5. SECURITY LOG TAB */}
        {activeTab === 'security' && (
          <div className="space-y-4">
            {personnel.logs.security.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                السجل الأمني نظيف تماماً - لا توجد قيود أو عقوبات.
              </div>
            ) : (
              <div className="space-y-3">
                {personnel.logs.security.map((sec) => (
                  <div key={sec.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <Lock className="w-4 h-4 text-rose-700" />
                        <span className="font-bold text-rose-900 text-sm">{sec.violation}</span>
                      </div>
                      <span className="text-rose-800 font-bold bg-rose-100 border border-rose-300 px-2 py-0.5 rounded text-[10px]">
                        خطورة: {sec.warningLevel}
                      </span>
                    </div>

                    <p className="text-slate-700">{sec.investigationDetails}</p>
                    <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1 border-t border-slate-200 font-medium">
                      <span>العقوبة: <strong className="text-slate-900">{sec.penalty}</strong></span>
                      <span>الحالة: <strong className="text-emerald-800">{sec.status}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 6. ARMAMENT LOG TAB */}
        {activeTab === 'armament' && (
          <div className="space-y-4">
            {personnel.logs.armament.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                لا يوجد سلاح مسند لهذا الفرد حالياً.
              </div>
            ) : (
              <div className="space-y-4">
                {personnel.logs.armament.map((arm) => (
                  <div key={arm.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <div>
                        <span className="text-sm font-bold text-amber-900 block">{arm.weaponType}</span>
                        <span className="text-slate-500 text-[11px] font-mono">الرقم التسلسلي: {arm.weaponSerial}</span>
                      </div>
                      <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-1 rounded text-[11px] font-bold">
                        حالة السلاح: {arm.condition}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[11px] text-slate-700">
                      <div>كمية الذخيرة الحية: <strong className="text-amber-800 font-mono text-xs font-bold">{arm.ammoQty} طلقة</strong></div>
                      <div>خطوط النار / الخزائن: <strong className="text-slate-900 font-mono">{arm.firelinesCount} خزائن</strong></div>
                      <div>تاريخ الاستلام: <strong className="text-slate-900">{arm.issueDate}</strong></div>
                    </div>

                    <p className="text-slate-600 text-[11px]">ملاحظات فنية: {arm.technicalNotes}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 7. SUPPLY & LOGISTICS TAB (المهمات والبدلات العسكرية) */}
        {activeTab === 'supply' && (
          <div className="space-y-4">
            {(!personnel.logs.supply || personnel.logs.supply.length === 0) ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                لا توجد مهمات أو بدلات مقيدة باسم هذا الفرد حالياً.
              </div>
            ) : (
              <div className="space-y-3">
                {personnel.logs.supply.map((sup) => (
                  <div key={sup.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <Package className="w-4 h-4 text-indigo-700" />
                        <div>
                          <span className="font-bold text-indigo-950 text-sm block">{sup.itemName}</span>
                          <span className="text-[10px] text-slate-500 font-semibold">{sup.itemType}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <span className="bg-indigo-100 text-indigo-900 border border-indigo-200 px-2.5 py-1 rounded text-[11px] font-bold">
                          الكمية: {sup.quantity}
                        </span>
                        <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded text-[11px] font-bold">
                          {sup.condition}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[11px] text-slate-700 font-medium">
                      <div>تاريخ الصرف: <strong className="text-slate-900 font-mono">{sup.issueDate}</strong></div>
                      <div>جهة الصرف: <strong className="text-indigo-800">{sup.issuedBy}</strong></div>
                      {sup.serialNumber && (
                        <div>الرقم التسلسلي / العهدة: <strong className="text-slate-900 font-mono">{sup.serialNumber}</strong></div>
                      )}
                    </div>

                    {sup.notes && (
                      <p className="text-slate-600 text-[11px] pt-1 border-t border-slate-200">
                        ملاحظات الصرف والتعليمات: {sup.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 7. TRAINING & COURSES TAB */}
        {activeTab === 'training' && (
          <div className="space-y-4">
            {personnel.logs.training.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                لا توجد دورات مسجلة حتى الآن.
              </div>
            ) : (
              <div className="space-y-3">
                {personnel.logs.training.map((trn) => (
                  <div key={trn.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-900">{trn.courseName}</span>
                      <span className="bg-purple-100 text-purple-900 border border-purple-300 px-2 py-0.5 rounded text-[11px] font-bold">
                        التقدير: {trn.grade}
                      </span>
                    </div>
                    <p className="text-slate-700 text-[11px]">{trn.evaluation}</p>
                    <div className="text-slate-500 text-[10px] flex justify-between pt-1 border-t border-slate-200 font-medium">
                      <span>الجهة: {trn.provider}</span>
                      <span>الشهادة: {trn.certificates}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 8. ATTACHMENTS TAB */}
        {activeTab === 'attachments' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-xs font-bold text-slate-800">
                المستندات، الصور والملفات الموثقة بالفرد ({personnel.logs.attachments.length})
              </span>

              {/* Direct File & Image Upload button in Personnel Profile */}
              <label className="cursor-pointer bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl flex items-center space-x-1.5 space-x-reverse transition-all shadow-xs">
                <Upload className="w-3.5 h-3.5" />
                <span>إرفاق وثيقة / صورة جديدة</span>
                <input
                  type="file"
                  accept="image/*,application/pdf,.doc,.docx"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (evt) => {
                        const fileUrl = evt.target?.result as string;
                        StorageService.addAttachment(
                          personnel.militaryId,
                          {
                            title: file.name,
                            category: file.type.startsWith('image') ? 'صورة/فيديو' : 'مستند شخصي',
                            fileType: file.type.startsWith('image') ? 'image' : 'pdf',
                            uploadDate: new Date().toISOString().split('T')[0],
                            fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
                            fileUrl,
                            uploadedBy: 'مدير النظام'
                          },
                          'مدير النظام',
                          currentRole
                        );
                        onRefresh();
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
            </div>

            {personnel.logs.attachments.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                لا توجد وثائق أو مرفقات إلكترونية مرفوعة حتى الآن.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {personnel.logs.attachments.map((attch) => (
                  <div key={attch.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 space-x-reverse overflow-hidden">
                        <FileText className="w-5 h-5 text-emerald-700 shrink-0" />
                        <div className="truncate">
                          <div className="font-bold text-slate-900 truncate">{attch.title}</div>
                          <div className="text-slate-500 text-[10px]">{attch.category} • {attch.fileSize}</div>
                        </div>
                      </div>
                      <span className="text-[10px] text-emerald-800 bg-emerald-100 border border-emerald-300 px-1.5 py-0.5 rounded font-bold shrink-0">
                        مستند موثق
                      </span>
                    </div>

                    {/* Image Preview if Base64 or Image URL */}
                    {attch.fileUrl && attch.fileUrl.startsWith('data:image') && (
                      <div className="mt-2 relative group cursor-pointer" onClick={() => setPreviewImageModal(attch.fileUrl!)}>
                        <img
                          src={attch.fileUrl}
                          alt={attch.title}
                          className="w-full h-32 object-cover rounded-lg border border-slate-300 shadow-2xs group-hover:opacity-90 transition-opacity"
                        />
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold rounded-lg transition-opacity">
                          انقر التوسيع والعرض
                        </div>
                      </div>
                    )}

                    {attch.notes && (
                      <p className="text-[10px] text-slate-600 bg-white p-2 rounded border border-slate-200">
                        ملاحظة: {attch.notes}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-200 font-medium">
                      <span>تاريخ الرفع: {attch.uploadDate}</span>
                      {attch.fileUrl && (
                        <a
                          href={attch.fileUrl}
                          download={attch.title}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-700 hover:underline font-bold"
                        >
                          تنزيل / معاينة
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Add Log Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-900 font-['Tajawal'] border-b border-slate-200 pb-3">
              إضافة قيد جديد إلى {activeTab}
            </h3>

            <form onSubmit={handleAddLogSubmit} className="space-y-3 text-right text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">تاريخ العملية / القرار</label>
                <input
                  type="date"
                  value={formDate1}
                  onChange={(e) => setFormDate1(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:bg-white focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">البيان الأساسي / العنوان *</label>
                <input
                  type="text"
                  required
                  value={formText1}
                  onChange={(e) => setFormText1(e.target.value)}
                  placeholder="أدخل التفاصيل الرئيسية..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:bg-white focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">الجهة المصدرة / المستشفى / الملاحظة</label>
                <input
                  type="text"
                  value={formText2}
                  onChange={(e) => setFormText2(e.target.value)}
                  placeholder="الجهة أو المصدر..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:bg-white focus:border-emerald-600"
                />
              </div>

              {(activeTab === 'financial' || activeTab === 'medical' || activeTab === 'armament') && (
                <div>
                  <label className="block text-slate-700 font-bold mb-1">المبلغ / الأيام / كمية الذخيرة</label>
                  <input
                    type="number"
                    value={formNum1}
                    onChange={(e) => setFormNum1(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-mono focus:outline-none focus:bg-white focus:border-emerald-600"
                  />
                </div>
              )}

              <div className="flex items-center justify-end space-x-2 space-x-reverse pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl font-bold transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold shadow-sm transition-colors"
                >
                  حفظ القيد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fullscreen Image Preview Lightbox Modal */}
      {previewImageModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md cursor-pointer"
          onClick={() => setPreviewImageModal(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl p-2" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setPreviewImageModal(null)}
              className="absolute top-3 right-3 z-10 bg-slate-800/90 hover:bg-rose-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-md transition-all"
            >
              ✕
            </button>
            <img
              src={previewImageModal}
              alt="معاينة الوثيقة المرفقة"
              className="max-w-full max-h-[85vh] object-contain rounded-xl mx-auto"
            />
          </div>
        </div>
      )}

      {/* Face Verification Camera Scan Modal */}
      <FaceVerificationModal
        isOpen={showFaceVerificationModal}
        onClose={() => setShowFaceVerificationModal(false)}
        onVerified={handleFaceVerified}
        targetPersonnel={personnel}
        taskTitle={`مسح وجه الفرد واختبار الهوية بالمباشر (${personnel.rank} / ${personnel.fullName})`}
        sensitiveTaskType="identity_check"
      />

    </div>
  );
};
