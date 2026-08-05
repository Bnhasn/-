import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  UserCheck,
  AlertTriangle,
  ArrowRightLeft,
  Search,
  CheckCircle2,
  Printer,
  FileText,
  Shield,
  Calendar,
  Building2,
  Award,
  History,
  PlusCircle
} from 'lucide-react';
import { PersonnelRecord, MilitaryRank, PersonnelReplacementRecord, DepartmentRole, PersonnelStatus } from '../types';
import { StorageService } from '../lib/storage';
import { BRIGADE_ACCOUNTS } from '../data/accountsData';
import { ReplacementReportPrintModal } from './ReplacementReportPrintModal';

interface PersonnelReplacementModalProps {
  isOpen: boolean;
  onClose: () => void;
  personnel: PersonnelRecord[];
  onRefresh: () => void;
  currentRole: DepartmentRole;
  preSelectedMilitaryId?: string | null;
}

export const PersonnelReplacementModal: React.FC<PersonnelReplacementModalProps> = ({
  isOpen,
  onClose,
  personnel,
  onRefresh,
  currentRole,
  preSelectedMilitaryId
}) => {
  const [activeTab, setActiveTab] = useState<'new_replacement' | 'history'>('new_replacement');
  const [searchReplaced, setSearchReplaced] = useState('');

  // 1. Replaced Soldier State (الفرد الأصلي المراد استبداله - فرار/متغيب)
  const [selectedPresetId, setSelectedPresetId] = useState<string>('');
  const [replacedMilitaryId, setReplacedMilitaryId] = useState<string>('');
  const [replacedFullName, setReplacedFullName] = useState<string>('');
  const [replacedRank, setReplacedRank] = useState<MilitaryRank>('جندي');
  const [replacedUnit, setReplacedUnit] = useState<string>('اللواء الأول');
  const [replacedBattalion, setReplacedBattalion] = useState<string>('الكتيبة الأولى');
  const [replacedCompany, setReplacedCompany] = useState<string>('السرية الأولى');
  const [replacedJobTitle, setReplacedJobTitle] = useState<string>('فرد مشاة مرافقة');
  const [replacedStatus, setReplacedStatus] = useState<PersonnelStatus>('فرار');
  const [absenceStartDate, setAbsenceStartDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Form state for NEW replacement soldier (الفرد البديل الجديد)
  const [newMilitaryId, setNewMilitaryId] = useState(() => `MIL-${Math.floor(100000 + Math.random() * 900000)}`);
  const [newNationalId, setNewNationalId] = useState(() => `10${Math.floor(100000000 + Math.random() * 900000000)}`);
  const [newFullName, setNewFullName] = useState('');
  const [newRank, setNewRank] = useState<MilitaryRank>('جندي');
  const [newJobTitle, setNewJobTitle] = useState('فرد مشاة مرافقة');
  const [newPhone, setNewPhone] = useState('0501234567');
  const [newEnlistmentDate, setNewEnlistmentDate] = useState(new Date().toISOString().split('T')[0]);

  // Order & Authority info
  const [orderNumber, setOrderNumber] = useState(`4091/ب-${Math.floor(1000 + Math.random() * 9000)}`);
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [issuingAuthority, setIssuingAuthority] = useState('قيادة الفرقة الثالثة - فرع القوى البشرية والجاهزية');
  const [reason, setReason] = useState('إحلال واستبدال كادر بشري جديد بدلاً من فرد فرار/متغيب لاستكمال الجاهزية القتالية');
  const [notes, setNotes] = useState('');

  // Officers for Approval
  const [responsibleOfficer, setResponsibleOfficer] = useState('النقيب / فؤاد بن علي العولقي');
  const [hrBranchChief, setHrBranchChief] = useState('العقيد / توفيق بن عبدالكريم الحداء');
  const [commandApproval, setCommandApproval] = useState('العميد ركن / طارق بن محمد الآنسي');

  // Print modal state
  const [printedReplacement, setPrintedReplacement] = useState<PersonnelReplacementRecord | null>(null);

  // Filter absent/deserter soldiers or all
  const deserterPersonnelList = useMemo(() => {
    return personnel.filter((p) => {
      const isAbsent = ['فرار', 'متغيب', 'غياب', 'منقطع', 'مفقود'].includes(p.currentStatus);
      const matchSearch =
        !searchReplaced ||
        p.fullName.includes(searchReplaced) ||
        p.militaryId.includes(searchReplaced) ||
        p.unit.includes(searchReplaced);
      return isAbsent || matchSearch;
    });
  }, [personnel, searchReplaced]);

  // Pre-fill replaced soldier info when selected from preset dropdown
  const handleSelectPresetPerson = (militaryId: string) => {
    setSelectedPresetId(militaryId);
    const person = personnel.find((p) => p.militaryId === militaryId);
    if (person) {
      setReplacedMilitaryId(person.militaryId);
      setReplacedFullName(person.fullName);
      setReplacedRank(person.rank);
      setReplacedUnit(person.unit || 'اللواء الأول');
      setReplacedBattalion(person.battalion || 'الكتيبة الأولى');
      setReplacedCompany(person.company || 'السرية الأولى');
      setReplacedJobTitle(person.jobTitle || 'فرد مشاة');
      setReplacedStatus(person.currentStatus || 'فرار');
      const absDate =
        person.logs?.attendance?.find((a) => a.type === 'فرار' || a.type === 'غياب')?.startDate ||
        new Date().toISOString().split('T')[0];
      setAbsenceStartDate(absDate);
      if (!newJobTitle || newJobTitle === 'فرد مشاة مرافقة') {
        setNewJobTitle(person.jobTitle || 'فرد مشاة مرافقة');
      }
    }
  };

  // Initial pre-selection on mount
  React.useEffect(() => {
    if (!isOpen) return;
    const targetId = preSelectedMilitaryId || personnel.find((p) => ['فرار', 'متغيب', 'غياب'].includes(p.currentStatus))?.militaryId || personnel[0]?.militaryId;
    if (targetId) {
      handleSelectPresetPerson(targetId);
    }
  }, [isOpen, preSelectedMilitaryId]);

  if (!isOpen) return null;

  const allPastReplacements = StorageService.getReplacements();
  const activeAccCode = typeof window !== 'undefined' ? localStorage.getItem('military_active_account_v1') : 'hq';
  const activeAcc = BRIGADE_ACCOUNTS.find(
    (a) => a.id === activeAccCode || a.shortCode === activeAccCode || a.customAccessKey === activeAccCode
  );
  const isMainCommand = activeAcc ? activeAcc.isMainCommand : true;
  const currentAccId = activeAcc ? activeAcc.id : 'hq';

  const pastReplacements = isMainCommand
    ? allPastReplacements
    : allPastReplacements.filter(
        (rep) => rep.createdByAccountId === currentAccId || (activeAcc && rep.newUnit === activeAcc.unitFilter)
      );

  const handleExecuteReplacement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replacedFullName.trim() || !replacedMilitaryId.trim()) {
      alert('الرجاء تعبئة الاسم الرباعي والرقم العسكري للفرد المستبدل (الفرار/المتغيب).');
      return;
    }
    if (!newFullName.trim() || !newMilitaryId.trim() || !newNationalId.trim()) {
      alert('الرجاء تعبئة الاسم الرباعي والرقم العسكري والهوية الوطنية للبديل الجديد.');
      return;
    }

    const { replacement } = StorageService.processPersonnelReplacement(
      {
        replacementDate: new Date().toISOString().split('T')[0],
        replacedMilitaryId,
        replacedFullName,
        replacedRank,
        replacedUnit,
        replacedBattalion,
        replacedCompany,
        replacedJobTitle,
        replacedStatus,
        absenceStartDate,

        newMilitaryId,
        newNationalId,
        newFullName,
        newRank,
        newUnit: replacedUnit,
        newBattalion: replacedBattalion,
        newCompany: replacedCompany,
        newPlatoon: 'الفصيل الأول',
        newJobTitle: newJobTitle || replacedJobTitle,
        newPhone,
        newEnlistmentDate,

        orderNumber,
        orderDate,
        issuingAuthority,
        reason,
        notes,

        responsibleOfficer,
        hrBranchChief,
        commandApproval
      },
      `مستخدم (${currentRole})`,
      currentRole
    );

    onRefresh();
    setPrintedReplacement(replacement);
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto font-['Cairo',sans-serif] print:hidden">
      
      {/* Container */}
      <div className="bg-white text-slate-900 border border-slate-300 rounded-3xl p-6 sm:p-8 max-w-4xl w-full shadow-2xl relative my-8">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 shadow-sm">
              <ArrowRightLeft className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 font-['Tajawal'] flex items-center space-x-2 space-x-reverse">
                <span>نظام استبدال وإحلال الأفراد (فرار / متغيب)</span>
                <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2.5 py-0.5 rounded-full border border-amber-300">
                  فرع القوى البشرية
                </span>
              </h2>
              <p className="text-xs font-bold text-slate-500 mt-0.5">
                تعبئة بيانات الفرد الفرار/المتغيب وتعيين بديل جديد وتفريغ السجل العسكري رسمياً
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tab Switcher: New Replacement vs Replacement History */}
        <div className="flex items-center justify-between bg-slate-100 p-1.5 rounded-2xl mb-6">
          <div className="flex items-center space-x-2 space-x-reverse w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('new_replacement')}
              className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-2 space-x-reverse cursor-pointer ${
                activeTab === 'new_replacement'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>إجراء عملية استبدال جديدة</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-2 space-x-reverse cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <History className="w-4 h-4" />
              <span>أرشيف وسندات الاستبدال السابقة ({pastReplacements.length})</span>
            </button>
          </div>

          <div className="text-[11px] font-bold text-slate-500 hidden sm:block">
            توثيق إداري قانوني آلي
          </div>
        </div>

        {activeTab === 'history' ? (
          /* Archive of past replacements */
          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-900 flex items-center space-x-2 space-x-reverse">
              <FileText className="w-4 h-4 text-amber-600" />
              <span>سجل جميع سندات وقرارات الاستبدال المعتمدة</span>
            </h3>

            {pastReplacements.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-2">
                <ArrowRightLeft className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="font-bold text-slate-600">لا توجد عمليات استبدال سابقة مسجلة بالمنظومة</p>
                <p className="text-xs text-slate-400">يمكنك بدء أول عملية استبدال بالضغط على تبويب الإجراء الجديد</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {pastReplacements.map((rep) => (
                  <div
                    key={rep.id}
                    className="border border-slate-200 bg-slate-50 hover:bg-white rounded-2xl p-4 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <span className="font-mono text-xs font-black text-amber-800 bg-amber-100 px-2 py-0.5 rounded-lg border border-amber-200">
                          {rep.replacementSerial}
                        </span>
                        <span className="text-xs font-bold text-slate-500">{rep.replacementDate}</span>
                      </div>
                      <p className="text-sm font-black text-slate-900">
                        استبدال: <span className="text-emerald-700">{rep.newRank} / {rep.newFullName}</span> بدلاً من <span className="text-rose-700">{rep.replacedRank} / {rep.replacedFullName}</span>
                      </p>
                      <p className="text-xs text-slate-600 font-bold">
                        الوحدة: {rep.newUnit} | الأمر: {rep.orderNumber}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setPrintedReplacement(rep);
                        setTimeout(() => window.print(), 350);
                      }}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center space-x-2 space-x-reverse cursor-pointer transition-all shadow-sm"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>عرض وتفريغ سند الاستبدال (PDF)</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Form for executing new replacement */
          <form onSubmit={handleExecuteReplacement} className="space-y-6">
            
            {/* Step 1: Selection & Input of Replaced Soldier */}
            <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rose-200 pb-3">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <span className="w-6 h-6 rounded-full bg-rose-600 text-white text-xs font-black flex items-center justify-center">1</span>
                  <h3 className="font-black text-rose-900 text-sm">بيانات وتفاصيل الفرد المراد استبداله (المتغيب / الفرار)</h3>
                </div>
                
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 absolute right-3 top-2.5 text-rose-400" />
                  <input
                    type="text"
                    placeholder="تصفية البحث باسم الفرد..."
                    value={searchReplaced}
                    onChange={(e) => setSearchReplaced(e.target.value)}
                    className="w-full pr-9 pl-3 py-1.5 bg-white border border-rose-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 font-bold"
                  />
                </div>
              </div>

              {/* Quick Select Preset Dropdown */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-rose-900">
                  اختيار سريع من سجل المنظومة (أو قم بإدخال/تعديل البيانات أدناه مباشرة):
                </label>
                <select
                  value={selectedPresetId}
                  onChange={(e) => handleSelectPresetPerson(e.target.value)}
                  className="w-full p-2.5 bg-white border border-rose-300 rounded-xl text-xs text-slate-900 font-black focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="">-- اختيار فرد مسجل أو أدخل بيانات يدويًا --</option>
                  {deserterPersonnelList.map((p) => (
                    <option key={p.militaryId} value={p.militaryId}>
                      [{p.currentStatus}] - {p.rank} / {p.fullName} (رقم: {p.militaryId}) - {p.unit}
                    </option>
                  ))}
                </select>
              </div>

              {/* Full Manual Input fields for Replaced Soldier */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-bold pt-2">
                <div>
                  <label className="block text-slate-800 mb-1">الاسم الرباعي للفرد المستبدل *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: عبدالله بن فهد الدوسري"
                    value={replacedFullName}
                    onChange={(e) => setReplacedFullName(e.target.value)}
                    className="w-full p-2.5 bg-white border border-rose-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-rose-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-800 mb-1">الرقم العسكري للفرد المستبدل *</label>
                  <input
                    type="text"
                    required
                    placeholder="MIL-123456"
                    value={replacedMilitaryId}
                    onChange={(e) => setReplacedMilitaryId(e.target.value)}
                    className="w-full p-2.5 bg-white border border-rose-300 rounded-xl text-slate-900 font-mono font-bold focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-800 mb-1">الرتبة العسكرية *</label>
                  <select
                    value={replacedRank}
                    onChange={(e) => setReplacedRank(e.target.value as MilitaryRank)}
                    className="w-full p-2.5 bg-white border border-rose-300 rounded-xl text-slate-900 font-bold focus:ring-2 focus:ring-rose-500"
                  >
                    {[
                      'جندي',
                      'جندي أول',
                      'عريف',
                      'وكيل رقيب',
                      'رقيب',
                      'رقيب أول',
                      'رئيس رقباء',
                      'ملازم',
                      'ملازم أول',
                      'نقيب'
                    ].map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-800 mb-1">الوحدة العسكرية *</label>
                  <input
                    type="text"
                    required
                    value={replacedUnit}
                    onChange={(e) => setReplacedUnit(e.target.value)}
                    className="w-full p-2.5 bg-white border border-rose-300 rounded-xl text-slate-900 font-bold focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-800 mb-1">الكتيبة / السرية</label>
                  <input
                    type="text"
                    value={`${replacedBattalion} - ${replacedCompany}`}
                    onChange={(e) => {
                      const parts = e.target.value.split('-');
                      setReplacedBattalion(parts[0]?.trim() || e.target.value);
                      if (parts[1]) setReplacedCompany(parts[1].trim());
                    }}
                    className="w-full p-2.5 bg-white border border-rose-300 rounded-xl text-slate-900 font-bold focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-800 mb-1">المسمى الوظيفي الأصلي</label>
                  <input
                    type="text"
                    value={replacedJobTitle}
                    onChange={(e) => setReplacedJobTitle(e.target.value)}
                    className="w-full p-2.5 bg-white border border-rose-300 rounded-xl text-slate-900 font-bold focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-800 mb-1">حالة الانقطاع / المخالفة الرسمية *</label>
                  <select
                    value={replacedStatus}
                    onChange={(e) => setReplacedStatus(e.target.value as PersonnelStatus)}
                    className="w-full p-2.5 bg-white border border-rose-300 rounded-xl text-rose-700 font-black focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="فرار">فرار (هروب عن الخدمة العسكرية)</option>
                    <option value="متغيب">متغيب (تغيب بدون إذن رسمي)</option>
                    <option value="غياب">غياب (غياب غير مبرر)</option>
                    <option value="منقطع">منقطع عن القوة</option>
                    <option value="مفقود">مفقود بالأحداث</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-800 mb-1">تاريخ بداية الانقطاع/الفرار</label>
                  <input
                    type="date"
                    value={absenceStartDate}
                    onChange={(e) => setAbsenceStartDate(e.target.value)}
                    className="w-full p-2.5 bg-white border border-rose-300 rounded-xl text-slate-900 font-mono font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Step 2: New Replacement Soldier Details */}
            <div className="bg-emerald-50/50 border border-emerald-200 rounded-2xl p-5 space-y-4">
              <div className="flex items-center space-x-2 space-x-reverse border-b border-emerald-200 pb-3">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-black flex items-center justify-center">2</span>
                <h3 className="font-black text-emerald-900 text-sm">بيانات وتفاصيل الفرد البديل الجديد (المعتمد)</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-bold">
                <div>
                  <label className="block text-slate-700 mb-1">الاسم الرباعي للبديل *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: محمد بن سعد العتيبي"
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1">الرقم العسكري للبديل *</label>
                  <input
                    type="text"
                    required
                    value={newMilitaryId}
                    onChange={(e) => setNewMilitaryId(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono font-bold focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1">الهوية الوطنية *</label>
                  <input
                    type="text"
                    required
                    value={newNationalId}
                    onChange={(e) => setNewNationalId(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono font-bold focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1">الرتبة البديلة *</label>
                  <select
                    value={newRank}
                    onChange={(e) => setNewRank(e.target.value as MilitaryRank)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold focus:ring-2 focus:ring-emerald-500"
                  >
                    {[
                      'جندي',
                      'جندي أول',
                      'عريف',
                      'وكيل رقيب',
                      'رقيب',
                      'رقيب أول',
                      'رئيس رقباء',
                      'ملازم',
                      'ملازم أول',
                      'نقيب'
                    ].map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 mb-1">المسمى الوظيفي المعين عليه *</label>
                  <input
                    type="text"
                    required
                    value={newJobTitle}
                    onChange={(e) => setNewJobTitle(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1">رقم جوال للتواصل</label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono font-bold focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Step 3: Administrative Reference & Authority */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
              <div className="flex items-center space-x-2 space-x-reverse border-b border-slate-200 pb-3">
                <span className="w-6 h-6 rounded-full bg-slate-800 text-white text-xs font-black flex items-center justify-center">3</span>
                <h3 className="font-black text-slate-900 text-sm">بيانات القرار الإداري وأمر الاستبدال الصادر</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-bold">
                <div>
                  <label className="block text-slate-700 mb-1">رقم أمر الاستبدال القيادي *</label>
                  <input
                    type="text"
                    required
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1">تاريخ أمر القرار *</label>
                  <input
                    type="date"
                    required
                    value={orderDate}
                    onChange={(e) => setOrderDate(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1">الجهة الآمرة بالإحلال *</label>
                  <input
                    type="text"
                    required
                    value={issuingAuthority}
                    onChange={(e) => setIssuingAuthority(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-700 mb-1">سبب الاستبدال ومستند القرار</label>
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1">ملاحظات إضافية للفرع</label>
                  <input
                    type="text"
                    placeholder="ملاحظات سرية أو تنويه إضافي..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold"
                  />
                </div>

                {/* Officers Approval Fields */}
                <div className="sm:col-span-3 border-t border-slate-200 pt-3 mt-2 grid grid-cols-1 sm:grid-cols-3 gap-3 bg-amber-50/60 p-3 rounded-xl border border-amber-200">
                  <div>
                    <label className="block text-amber-950 mb-1 text-[11px] font-extrabold">ضابط القوة البشرية والاستبدال *</label>
                    <input
                      type="text"
                      required
                      value={responsibleOfficer}
                      onChange={(e) => setResponsibleOfficer(e.target.value)}
                      placeholder="الرتبة / الاسم"
                      className="w-full p-2 bg-white border border-amber-300 rounded-lg text-slate-900 font-bold text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-amber-950 mb-1 text-[11px] font-extrabold">رئيس شعبة الموارد البشرية *</label>
                    <input
                      type="text"
                      required
                      value={hrBranchChief}
                      onChange={(e) => setHrBranchChief(e.target.value)}
                      placeholder="الرتبة / الاسم"
                      className="w-full p-2 bg-white border border-amber-300 rounded-lg text-slate-900 font-bold text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-amber-950 mb-1 text-[11px] font-extrabold">اعتماد وتصديق قائد الفرقة الثالثة *</label>
                    <input
                      type="text"
                      required
                      value={commandApproval}
                      onChange={(e) => setCommandApproval(e.target.value)}
                      placeholder="الرتبة / الاسم"
                      className="w-full p-2 bg-white border border-amber-300 rounded-lg text-slate-900 font-bold text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-3 space-x-reverse border-t border-slate-200 pt-5">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 border border-slate-300 hover:bg-slate-100 rounded-xl text-xs font-black text-slate-700 transition-all cursor-pointer"
              >
                إلغاء الأمر
              </button>

              <button
                type="submit"
                className="px-8 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black flex items-center space-x-2 space-x-reverse shadow-lg cursor-pointer transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>اعتماد عملية الاستبدال وطباعة التقرير والسند</span>
              </button>
            </div>

          </form>
        )}

      </div>

      {/* Render Print Modal if a replacement document is triggered */}
      {printedReplacement && (
        <ReplacementReportPrintModal
          isOpen={true}
          onClose={() => setPrintedReplacement(null)}
          replacement={printedReplacement}
        />
      )}

    </div>,
    document.body
  );
};
