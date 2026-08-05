import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Shield, Printer, X, FileCheck, ArrowRightLeft, UserCheck, AlertOctagon, CheckCircle2, UserPlus, ArrowRight } from 'lucide-react';
import { PersonnelReplacementRecord } from '../types';

interface ReplacementReportPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  replacement: PersonnelReplacementRecord | null;
}

export const ReplacementReportPrintModal: React.FC<ReplacementReportPrintModalProps> = ({
  isOpen,
  onClose,
  replacement
}) => {
  if (!isOpen || !replacement) return null;

  const [responsibleOfficer, setResponsibleOfficer] = useState(
    replacement.responsibleOfficer || 'النقيب / فؤاد بن علي العولقي'
  );
  const [hrBranchChief, setHrBranchChief] = useState(
    replacement.hrBranchChief || 'العقيد / توفيق بن عبدالكريم الحداء'
  );
  const [commandApproval, setCommandApproval] = useState(
    replacement.commandApproval || 'العميد ركن / طارق بن محمد الآنسي'
  );

  const handlePrint = () => {
    window.print();
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-md overflow-hidden print:p-0 print:bg-white print:static printable-modal-overlay font-['Cairo',sans-serif]">
      {/* Container */}
      <div className="bg-white text-slate-900 border border-slate-300 rounded-3xl max-w-4xl w-full shadow-2xl relative my-2 sm:my-4 max-h-[94vh] flex flex-col overflow-hidden print:max-h-none print:border-none print:shadow-none print:p-0 print:m-0 print:w-full printable-modal-card">
        
        {/* Sticky Top Bar (Hidden on Print) */}
        <div className="sticky top-0 z-30 bg-slate-900 text-white p-3.5 sm:p-4 rounded-t-3xl border-b-2 border-amber-500/80 shadow-md flex items-center justify-between gap-3 print:hidden no-print shrink-0">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-amber-300 font-['Tajawal']">سند وتقرير استبدال وإحلال فرد عسكري</h2>
              <p className="text-[11px] font-bold text-slate-300">معتمد رسمياً لفرع القوى البشرية وقيادة الفرقة الثالثة</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 space-x-reverse">
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
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold flex items-center space-x-1.5 space-x-reverse shadow-md transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة السند (PDF) 📄</span>
            </button>

            <button
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl cursor-pointer border border-slate-700 transition-all"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto p-4 sm:p-6 md:p-8 flex-1 space-y-6">

        {/* Dynamic Officer Approval Settings Panel (Hidden on Print) */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl p-4 mb-6 print:hidden shadow-xs">
          <div className="flex items-center space-x-2 space-x-reverse text-amber-950 font-black text-xs mb-3">
            <UserPlus className="w-4 h-4 text-amber-700 shrink-0" />
            <span>تحديد وإضافة أسماء ورتب الضباط المعنيين باعتِماد وتوقيع هذا القرار السند:</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">ضابط القوة البشرية والاستبدال:</label>
              <input
                type="text"
                value={responsibleOfficer}
                onChange={(e) => setResponsibleOfficer(e.target.value)}
                placeholder="الرتبة / الاسم"
                className="w-full bg-white border border-amber-300 rounded-xl px-3 py-1.5 font-bold text-slate-900 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">رئيس شعبة الموارد البشرية:</label>
              <input
                type="text"
                value={hrBranchChief}
                onChange={(e) => setHrBranchChief(e.target.value)}
                placeholder="الرتبة / الاسم"
                className="w-full bg-white border border-amber-300 rounded-xl px-3 py-1.5 font-bold text-slate-900 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">اعتماد وتصديق قائد الفرقة الثالثة:</label>
              <input
                type="text"
                value={commandApproval}
                onChange={(e) => setCommandApproval(e.target.value)}
                placeholder="الرتبة / الاسم"
                className="w-full bg-white border border-amber-300 rounded-xl px-3 py-1.5 font-bold text-slate-900 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="space-y-6 print:p-0">
          
          {/* Document Header */}
          <div className="border-b-2 border-slate-900 pb-6">
            <div className="flex justify-between items-start text-xs font-bold text-slate-800">
              <div className="text-right space-y-1">
                <p className="font-black text-sm">الجمهورية اليمنية</p>
                <p>قوات الطوارى اليمنية - الفرقه الثالثة</p>
                <p>قيادة فرع القوى البشرية والجاهزية</p>
                <p className="text-emerald-800 font-bold">{replacement.newUnit}</p>
              </div>

              <div className="text-center space-y-2">
                <div className="w-16 h-16 mx-auto bg-slate-100 border border-slate-300 rounded-full flex items-center justify-center">
                  <Shield className="w-10 h-10 text-slate-800" />
                </div>
                <div className="inline-block px-4 py-1 bg-slate-900 text-white font-black text-xs rounded-lg tracking-wider">
                  سند استبدال وإحلال رسمي
                </div>
              </div>

              <div className="text-left space-y-1">
                <p><span className="font-black">رقم السند:</span> <span className="font-mono text-emerald-800 font-bold">{replacement.replacementSerial}</span></p>
                <p><span className="font-black">تاريخ الإحلال:</span> <span className="font-mono">{replacement.replacementDate}</span></p>
                <p><span className="font-black">التصنيف:</span> سري للغاية وشديد الأهمية</p>
              </div>
            </div>
          </div>

          {/* Report Title */}
          <div className="text-center py-2 bg-amber-50 rounded-2xl border border-amber-200">
            <h1 className="text-xl font-black text-slate-900 font-['Tajawal']">
              تقرير ومحضر استبدال كادر عسكري (بديل فرار / غياب)
            </h1>
            <p className="text-xs font-bold text-slate-600 mt-1">
              بموجب الأمر الإداري القيادي رقم ({replacement.orderNumber}) الصادر بتاريخ {replacement.orderDate}
            </p>
          </div>

          {/* Comparison Grid: Replaced Soldier vs New Soldier */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2">
            
            {/* Box 1: Replaced Absent/Deserter Soldier */}
            <div className="border-2 border-rose-300 bg-rose-50/50 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-rose-200 pb-2">
                <div className="flex items-center space-x-2 space-x-reverse font-black text-sm text-rose-900">
                  <AlertOctagon className="w-4 h-4 text-rose-600" />
                  <span>الفرد الأصلي (المتغيب / الفرار)</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white">
                  {replacement.replacedStatus}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">الاسم الرباعي:</span>
                  <span className="font-black text-slate-900">{replacement.replacedFullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">الرقم العسكري:</span>
                  <span className="font-mono font-bold text-slate-800">{replacement.replacedMilitaryId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">الرتبة العسكرية:</span>
                  <span className="font-bold text-slate-800">{replacement.replacedRank}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">المسمى الوظيفي:</span>
                  <span className="font-bold text-slate-800">{replacement.replacedJobTitle || 'غير محدد'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">الوحدة / السرية:</span>
                  <span className="font-bold text-slate-800">{replacement.replacedUnit} - {replacement.replacedCompany}</span>
                </div>
                {replacement.absenceStartDate && (
                  <div className="flex justify-between border-t border-rose-200 pt-2 text-rose-900 font-bold">
                    <span>تاريخ بدء الانقطاع/الفرار:</span>
                    <span className="font-mono">{replacement.absenceStartDate}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Box 2: New Replacement Soldier */}
            <div className="border-2 border-emerald-400 bg-emerald-50/50 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                <div className="flex items-center space-x-2 space-x-reverse font-black text-sm text-emerald-900">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  <span>الفرد البديل الجديد (المعتمد)</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-600 text-white">
                  متواجد - جاهز
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">الاسم الرباعي:</span>
                  <span className="font-black text-slate-900">{replacement.newFullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">الرقم العسكري:</span>
                  <span className="font-mono font-bold text-emerald-800">{replacement.newMilitaryId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">السجل المدني (الهوية):</span>
                  <span className="font-mono text-slate-800">{replacement.newNationalId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">الرتبة البديلة:</span>
                  <span className="font-bold text-slate-800">{replacement.newRank}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">الوظيفة المعين عليها:</span>
                  <span className="font-bold text-emerald-900">{replacement.newJobTitle}</span>
                </div>
                <div className="flex justify-between border-t border-emerald-200 pt-2 text-emerald-900 font-bold">
                  <span>الوحدة المسند إليها:</span>
                  <span>{replacement.newUnit} - {replacement.newCompany}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Legal Order & Authority Reference */}
          <div className="border border-slate-300 rounded-2xl p-4 bg-slate-50 space-y-2 text-xs">
            <h3 className="font-black text-slate-900 text-sm border-b border-slate-200 pb-1">
              📜 المرجعية الإدارية والقانونية لعملية الاستبدال
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <p><span className="font-bold text-slate-600">الجهة الآمرة بالإحلال:</span> <span className="font-bold text-slate-900">{replacement.issuingAuthority}</span></p>
              <p><span className="font-bold text-slate-600">رقم الأمر القيادي:</span> <span className="font-mono font-bold text-slate-900">{replacement.orderNumber}</span></p>
              <p><span className="font-bold text-slate-600">تاريخ صدور القرار:</span> <span className="font-mono text-slate-900">{replacement.orderDate}</span></p>
              <p><span className="font-bold text-slate-600">سبب الاستبدال المعتمد:</span> <span className="font-bold text-slate-900">{replacement.reason}</span></p>
            </div>
            {replacement.notes && (
              <p className="border-t border-slate-200 pt-2 font-bold text-slate-700">
                <span className="text-slate-500">ملاحظات الفرع:</span> {replacement.notes}
              </p>
            )}
          </div>

          {/* Official Instructions Statement */}
          <div className="p-4 border border-dashed border-slate-300 rounded-2xl bg-amber-50/40 text-[11px] text-slate-700 space-y-1 font-bold">
            <p>1. يُعتبر الفرد البديل الجديد ({replacement.newFullName}) معتمداً ومسجلاً رسمياً ضمن سجلات القوة البشرية والجاهزية القتالية اعتباراً من تاريخه.</p>
            <p>2. تُستكمل الإجراءات القانونية والملاحقة القضائية بحق الفرد المستبدل ({replacement.replacedFullName}) وفق نظام عقوبات الجرائم العسكرية.</p>
          </div>

          {/* Signatures & Approvals Section */}
          <div className="pt-8 border-t-2 border-slate-900 grid grid-cols-3 gap-6 text-center text-xs font-bold text-slate-900 signature-block">
            <div className="space-y-12">
              <p className="font-black">ضابط القوة البشرية والاستبدال</p>
              <p className="font-bold text-slate-900 text-sm">{responsibleOfficer}</p>
              <p className="text-[10px] text-slate-400">التوقيع: ....................</p>
            </div>

            <div className="space-y-12">
              <p className="font-black">رئيس شعبة الموارد البشرية</p>
              <p className="font-bold text-slate-900 text-sm">{hrBranchChief}</p>
              <p className="text-[10px] text-slate-400">التوقيع والختم: ....................</p>
            </div>

            <div className="space-y-12">
              <p className="font-black">اعتماد وتصديق قائد الفرقة الثالثة</p>
              <p className="font-bold text-slate-900 text-sm">{commandApproval}</p>
              <p className="text-[10px] text-slate-400">التوقيع والخاتم: ....................</p>
            </div>
          </div>

          {/* Footer Bar */}
          <div className="flex items-center justify-between border-t border-slate-200 pt-4 text-[10px] text-slate-500 font-mono">
            <span>رمز المصادقة الرقمية: HQ-SUB-CERT-2026-X9</span>
            <span>وثيقة رسمية صادرة من منظومة قيادة السيطرة والقوى البشرية</span>
            <span>صفحة 1 من 1</span>
          </div>

        </div>

        </div>

        {/* Floating Sticky Bottom Bar for Quick Return & Print */}
        <div className="sticky bottom-0 z-30 bg-slate-950 text-white p-3.5 rounded-b-3xl border-t-2 border-amber-500/80 shadow-2xl flex items-center justify-between gap-3 print:hidden no-print backdrop-blur-md shrink-0 font-['Cairo',sans-serif]">
          <div className="flex items-center space-x-2 space-x-reverse text-xs text-slate-300 font-medium">
            <Printer className="w-4 h-4 text-amber-400" />
            <span className="font-bold hidden sm:inline text-amber-300 font-['Tajawal']">سند وتقرير الاستبدال العسكري</span>
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
              <span>طباعة السند (PDF) 📄</span>
            </button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
};
