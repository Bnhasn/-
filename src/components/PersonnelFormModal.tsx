import React, { useState, useEffect } from 'react';
import { X, Save, User, Shield, BookOpen, Fingerprint, Image, AlertTriangle } from 'lucide-react';
import { PersonnelRecord, MilitaryRank, PersonnelStatus } from '../types';
import { ImageUploadPicker } from './ImageUploadPicker';
import { StorageService } from '../lib/storage';

interface PersonnelFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: PersonnelRecord) => void;
  editingPersonnel?: PersonnelRecord | null;
  defaultUnit?: string;
}

export const PersonnelFormModal: React.FC<PersonnelFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingPersonnel,
  defaultUnit
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'basic' | 'military' | 'qualifications'>('basic');

  // Form State
  const [militaryId, setMilitaryId] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [fullName, setFullName] = useState('');
  const [rank, setRank] = useState<MilitaryRank>('جندي');
  const [dob, setDob] = useState('1998-01-01');
  const [pob, setPob] = useState('صنعاء');
  const [maritalStatus, setMaritalStatus] = useState<'أعزب' | 'متزوج' | 'مطلق' | 'أرمل'>('أعزب');
  const [education, setEducation] = useState('ثانوية عامة');
  const [specialization, setSpecialization] = useState('مشاة عامة');
  const [bloodType, setBloodType] = useState<'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-'>('O+');
  const [phone, setPhone] = useState('0500000000');
  const [motherName, setMotherName] = useState('');
  const [guarantorName, setGuarantorName] = useState('');
  const [relativeName, setRelativeName] = useState('');
  const [relativePhone, setRelativePhone] = useState('');
  const [photoUrl, setPhotoUrl] = useState('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80');
  const [biometricsRecorded, setBiometricsRecorded] = useState(true);

  const [unit, setUnit] = useState('اللواء الأول المدرع');
  const [battalion, setBattalion] = useState('الكتيبة الأولى دبابات');
  const [company, setCompany] = useState('السرية الأولى');
  const [platoon, setPlatoon] = useState('الفصيل الأول');
  const [jobTitle, setJobTitle] = useState('جندي مشاة مرافقة');
  const [enlistmentDate, setEnlistmentDate] = useState('2022-01-01');
  const [currentStatus, setCurrentStatus] = useState<PersonnelStatus>('متواجد');
  const [secondedUnit, setSecondedUnit] = useState('');

  useEffect(() => {
    if (editingPersonnel) {
      setMilitaryId(editingPersonnel.militaryId);
      setNationalId(editingPersonnel.nationalId);
      setFullName(editingPersonnel.fullName);
      setRank(editingPersonnel.rank);
      setDob(editingPersonnel.dob);
      setPob(editingPersonnel.pob);
      setMaritalStatus(editingPersonnel.maritalStatus);
      setEducation(editingPersonnel.education);
      setSpecialization(editingPersonnel.specialization);
      setBloodType(editingPersonnel.bloodType);
      setPhone(editingPersonnel.phone);
      setMotherName(editingPersonnel.motherName || '');
      setGuarantorName(editingPersonnel.guarantorName || '');
      setRelativeName(editingPersonnel.relativeName || '');
      setRelativePhone(editingPersonnel.relativePhone || '');
      setPhotoUrl(editingPersonnel.photoUrl);
      setBiometricsRecorded(editingPersonnel.biometricsRecorded);
      setUnit(editingPersonnel.unit);
      setBattalion(editingPersonnel.battalion);
      setCompany(editingPersonnel.company);
      setPlatoon(editingPersonnel.platoon);
      setJobTitle(editingPersonnel.jobTitle);
      setEnlistmentDate(editingPersonnel.enlistmentDate);
      setCurrentStatus(editingPersonnel.currentStatus);
      setSecondedUnit(editingPersonnel.secondedUnit || '');
    } else {
      // Auto-generate fresh military ID
      setMilitaryId(`MIL-${Math.floor(100000 + Math.random() * 900000)}`);
      setNationalId(`10${Math.floor(100000000 + Math.random() * 900000000)}`);
      setFullName('');
      setRank('جندي');
      setDob('1998-01-01');
      setPob('صنعاء');
      setMaritalStatus('أعزب');
      setEducation('ثانوية عامة');
      setSpecialization('مشاة عامة');
      setBloodType('O+');
      setPhone('0501234567');
      setMotherName('');
      setGuarantorName('');
      setRelativeName('');
      setRelativePhone('');
      setPhotoUrl('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80');
      setBiometricsRecorded(true);
      setUnit(defaultUnit && defaultUnit !== 'الكل' ? defaultUnit : 'اللواء الأول');
      setBattalion('الكتيبة الأولى دبابات');
      setCompany('السرية الأولى');
      setPlatoon('الفصيل الأول');
      setJobTitle('جندي مشاة مرافقة');
      setEnlistmentDate('2022-01-01');
      setCurrentStatus('متواجد');
      setSecondedUnit('');
    }
  }, [editingPersonnel, isOpen]);

  if (!isOpen) return null;

  const duplicateMatch = !editingPersonnel
    ? StorageService.checkForDuplicatePersonnel(militaryId, nationalId, fullName)
    : undefined;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !militaryId) return;

    const record: PersonnelRecord = {
      militaryId,
      nationalId,
      fullName,
      rank,
      dob,
      pob,
      maritalStatus,
      education,
      specialization,
      bloodType,
      phone,
      motherName,
      guarantorName,
      relativeName,
      relativePhone,
      photoUrl,
      biometricsRecorded,
      unit,
      battalion,
      company,
      platoon,
      jobTitle,
      enlistmentDate,
      currentStatus,
      secondedUnit: currentStatus === 'منتدب' ? secondedUnit : undefined,
      logs: editingPersonnel?.logs || {
        movement: [],
        attendance: [],
        medical: [],
        financial: [],
        security: [],
        armament: [],
        training: [],
        attachments: []
      }
    };

    onSave(record);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-['Tajawal']">
                {editingPersonnel ? 'تعديل البيانات الأساسية للفرد' : 'نموذج إضافة فرد جديد للقوة'}
              </h3>
              <p className="text-xs text-slate-400">
                تسجيل البيانات الشخصية والعسكرية والبدنية بقاعدة البيانات الموحدة
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Duplicate Personnel Alert Banner */}
        {duplicateMatch && (
          <div className="mx-6 mt-4 p-4 bg-rose-50 border-2 border-rose-500 rounded-2xl text-rose-900 shadow-md">
            <div className="flex items-start space-x-3 space-x-reverse">
              <div className="p-2 bg-rose-600 text-white rounded-xl font-bold shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
              </div>
              <div className="flex-1 text-xs">
                <div className="font-black text-sm text-rose-950 font-['Tajawal'] flex items-center justify-between">
                  <span>🚨 إنذار تكرار بيانات: بيانات هذا الفرد متواجدة على النظام مسبقاً!</span>
                  <span className="bg-rose-200 text-rose-900 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border border-rose-300">
                    تطابق بالسجل الموحد
                  </span>
                </div>
                <p className="mt-1 font-bold text-rose-800">
                  تم العثور على سجل فرد متطابق في قاعدة البيانات:
                </p>
                <div className="mt-2 bg-white/90 border border-rose-200 rounded-xl p-2.5 grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px] text-slate-800 font-bold">
                  <div><span className="text-slate-500 text-[10px] font-normal">الاسم:</span> {duplicateMatch.fullName}</div>
                  <div><span className="text-slate-500 text-[10px] font-normal">الرقم العسكري:</span> {duplicateMatch.militaryId}</div>
                  <div><span className="text-slate-500 text-[10px] font-normal">الهوية المدنية:</span> {duplicateMatch.nationalId || 'غير مسجلة'}</div>
                  <div><span className="text-slate-500 text-[10px] font-normal">التبعية الحالية:</span> {duplicateMatch.unit}</div>
                </div>
                <p className="mt-2 text-[11px] text-rose-700 font-medium">
                  ملاحظة هامة: في حال متابعة الإدخال للحفظ، سينطلق إنذار عاجل فوراً لدى <strong className="font-extrabold text-rose-950">المستخدم الرئيسي (القيادة العليا)</strong> لتنبيهه بعملية الإدخال المتكرر بين الحسابات وإبراز جميع تفاصيل العملية.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Form Subtabs */}
        <div className="flex items-center space-x-2 space-x-reverse px-6 py-2 bg-slate-50 border-b border-slate-200 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveSubTab('basic')}
            className={`flex items-center space-x-1.5 space-x-reverse px-4 py-2 rounded-lg transition-all ${
              activeSubTab === 'basic'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <User className="w-4 h-4" />
            <span>البيانات الشخصية والأساسية</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('military')}
            className={`flex items-center space-x-1.5 space-x-reverse px-4 py-2 rounded-lg transition-all ${
              activeSubTab === 'military'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>البيانات العسكرية والوظيفية</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('qualifications')}
            className={`flex items-center space-x-1.5 space-x-reverse px-4 py-2 rounded-lg transition-all ${
              activeSubTab === 'qualifications'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>المؤهلات والبيانات البدنية</span>
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 text-right">
          
          {/* Tab 1: Basic Personal Info */}
          {activeSubTab === 'basic' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الرقم الوظيفي *</label>
                <input
                  type="text"
                  required
                  value={militaryId}
                  onChange={(e) => setMilitaryId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-emerald-800 font-mono font-bold focus:outline-none focus:bg-white focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الرقم الوطني *</label>
                <input
                  type="text"
                  required
                  value={nationalId}
                  onChange={(e) => setNationalId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الاسم الرباعي الكامل *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="مثال: خالد بن عبد الله الآنسي"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ الميلاد</label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">مكان الميلاد</label>
                <input
                  type="text"
                  value={pob}
                  onChange={(e) => setPob(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الحالة الاجتماعية</label>
                <select
                  value={maritalStatus}
                  onChange={(e) => setMaritalStatus(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-emerald-600"
                >
                  <option value="أعزب">أعزب</option>
                  <option value="متزوج">متزوج</option>
                  <option value="مطلق">مطلق</option>
                  <option value="أرمل">أرمل</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">رقم الهاتف</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم الأم</label>
                <input
                  type="text"
                  value={motherName}
                  onChange={(e) => setMotherName(e.target.value)}
                  placeholder="اسم والدة الفرد..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم الضمين (الكفيل الضامن)</label>
                <input
                  type="text"
                  value={guarantorName}
                  onChange={(e) => setGuarantorName(e.target.value)}
                  placeholder="اسم الضمين أو الكفيل..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم أقرب الأقارب / صلة القرابة</label>
                <input
                  type="text"
                  value={relativeName}
                  onChange={(e) => setRelativeName(e.target.value)}
                  placeholder="مثال: محمد علي (أخ) / أحمد خالد (والد)"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">رقم هاتف القريب</label>
                <input
                  type="text"
                  value={relativePhone}
                  onChange={(e) => setRelativePhone(e.target.value)}
                  placeholder="05xxxxxxx"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-emerald-600 font-mono"
                />
              </div>

              <div className="md:col-span-3">
                <ImageUploadPicker
                  currentPhotoUrl={photoUrl}
                  onPhotoChange={setPhotoUrl}
                  label="الصورة الشخصية للفرد (مع إمكانية التصوير المباشر بالكاميرا أو الرفع من المعرض)"
                />
              </div>

              <div className="flex items-center space-x-2 space-x-reverse pt-6">
                <input
                  type="checkbox"
                  id="biometrics"
                  checked={biometricsRecorded}
                  onChange={(e) => setBiometricsRecorded(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-700 focus:ring-emerald-600 bg-slate-50 border-slate-300"
                />
                <label htmlFor="biometrics" className="text-xs font-bold text-slate-700">
                  تم تسجيل البصمة الحيوية بالنظام
                </label>
              </div>

            </div>
          )}

          {/* Tab 2: Military Role & Unit */}
          {activeSubTab === 'military' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الرتبة العسكرية *</label>
                <select
                  value={rank}
                  onChange={(e) => setRank(e.target.value as MilitaryRank)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-emerald-800 font-bold focus:outline-none focus:bg-white focus:border-emerald-600"
                >
                  <option value="فريق أول">فريق أول</option>
                  <option value="فريق">فريق</option>
                  <option value="لواء">لواء</option>
                  <option value="عميد">عميد</option>
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
                <label className="block text-xs font-bold text-slate-700 mb-1">الوحدة الرئيسية</label>
                <input
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الكتيبة</label>
                <input
                  type="text"
                  value={battalion}
                  onChange={(e) => setBattalion(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">السرية</label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الفصيل</label>
                <input
                  type="text"
                  value={platoon}
                  onChange={(e) => setPlatoon(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">المسمى الوظيفي العسكري</label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ الالتحاق بالخدمة</label>
                <input
                  type="date"
                  value={enlistmentDate}
                  onChange={(e) => setEnlistmentDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الحالة الحالية المبدئية</label>
                <select
                  value={currentStatus}
                  onChange={(e) => setCurrentStatus(e.target.value as PersonnelStatus)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-emerald-800 focus:outline-none focus:bg-white focus:border-emerald-600"
                >
                  <option value="متواجد">متواجد</option>
                  <option value="في الميدان">في الميدان</option>
                  <option value="منتدب">منتدب (انتداب خارجي)</option>
                  <option value="مأمورية">مأمورية</option>
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

              {currentStatus === 'منتدب' && (
                <div>
                  <label className="block text-xs font-bold text-amber-900 mb-1">الوحدة المنتدب لديها *</label>
                  <input
                    type="text"
                    required
                    value={secondedUnit}
                    onChange={(e) => setSecondedUnit(e.target.value)}
                    placeholder="أدخل اسم الجهة أو الوحدة المنتدب لديها (مثال: قيادة المنطقة البحرية)..."
                    className="w-full bg-amber-50 border border-amber-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-amber-600"
                  />
                </div>
              )}

            </div>
          )}

          {/* Tab 3: Education & Medical Specs */}
          {activeSubTab === 'qualifications' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">المؤهل العلمي</label>
                <input
                  type="text"
                  value={education}
                  onChange={(e) => setEducation(e.target.value)}
                  placeholder="بكالوريوس علوم عسكرية / ثانوية..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">التخصص والدراسة</label>
                <input
                  type="text"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  placeholder="مشاة آلي / هندسة اتصالات..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">فصيلة الدم *</label>
                <select
                  value={bloodType}
                  onChange={(e) => setBloodType(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-rose-700 focus:outline-none focus:bg-white focus:border-emerald-600"
                >
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>

            </div>
          )}

          {/* Footer Submit Button */}
          <div className="flex items-center justify-end space-x-3 space-x-reverse pt-6 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
            >
              إلغاء
            </button>

            <button
              type="submit"
              className="flex items-center space-x-2 space-x-reverse bg-emerald-700 hover:bg-emerald-800 text-white px-6 py-2 rounded-xl text-xs font-extrabold transition-all shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>حفظ البيانات بالسجل الموحد</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
