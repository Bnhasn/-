import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Shield, Printer, X, FileCheck, UserPlus, FileText, CheckCircle2, Activity, Award, AlertTriangle, HeartPulse, DollarSign, Package, Repeat, Calendar, MapPin, User, Crosshair, Phone, Clock, FileSpreadsheet, Filter, CheckSquare, Layers, ExternalLink, ArrowRight } from 'lucide-react';
import { PersonnelRecord } from '../types';

interface PrintProfileModalProps {
  personnel: PersonnelRecord | null;
  reportTitle?: string;
  reportData?: PersonnelRecord[];
  onClose: () => void;
  currentAccountName?: string;
}

export const PrintProfileModal: React.FC<PrintProfileModalProps> = ({
  personnel,
  reportTitle,
  reportData,
  onClose,
  currentAccountName = 'قيادة الفرقة الثالثة'
}) => {
  if (!personnel && (!reportData || reportData.length === 0)) return null;

  const [officer1Title, setOfficer1Title] = useState('مسؤول السجلات والقوة');
  const [officer1Name, setOfficer1Name] = useState('الرقيب أول / أحمد بن علي الصايدي');

  const [officer2Title, setOfficer2Title] = useState('رئيس شعبة الموارد البشرية');
  const [officer2Name, setOfficer2Name] = useState('العقيد / توفيق بن عبدالكريم الحداء');

  const [officer3Title, setOfficer3Title] = useState('اعتماد قائد الفرقة الثالثة');
  const [officer3Name, setOfficer3Name] = useState('العميد ركن / طارق بن محمد الآنسي');

  // Custom Section Selector State for Printing
  const [selectedSections, setSelectedSections] = useState({
    summary: true,      // البطاقة التعريفية والتمام
    admin: true,        // السجل الإداري والشخصي
    movement: true,     // حركة التنقلات
    armament: true,     // سجل العهد والتسليح
    supply: true,       // المهمات والتجهيزات
    attendance: true,   // التحضير والغياب
    medical: true,      // السجل الطبي والعيادات
    financial: true,    // السجل المالي والرواتب
    security: true,     // السجل الأمني والمخالفات
    training: true      // سجل الدورات والتأهيل
  });

  const toggleSection = (key: keyof typeof selectedSections) => {
    setSelectedSections((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const selectAllSections = () => {
    setSelectedSections({
      summary: true,
      admin: true,
      movement: true,
      armament: true,
      supply: true,
      attendance: true,
      medical: true,
      financial: true,
      security: true,
      training: true
    });
  };

  const unselectAllSections = () => {
    setSelectedSections({
      summary: true, // Keep basic summary ID card
      admin: false,
      movement: false,
      armament: false,
      supply: false,
      attendance: false,
      medical: false,
      financial: false,
      security: false,
      training: false
    });
  };

  const selectPreset = (preset: 'medicalOnly' | 'financialOnly' | 'armamentOnly' | 'adminOnly') => {
    if (preset === 'medicalOnly') {
      setSelectedSections({
        summary: true,
        admin: false,
        movement: false,
        armament: false,
        supply: false,
        attendance: false,
        medical: true,
        financial: false,
        security: false,
        training: false
      });
    } else if (preset === 'financialOnly') {
      setSelectedSections({
        summary: true,
        admin: false,
        movement: false,
        armament: false,
        supply: false,
        attendance: false,
        medical: false,
        financial: true,
        security: false,
        training: false
      });
    } else if (preset === 'armamentOnly') {
      setSelectedSections({
        summary: true,
        admin: false,
        movement: false,
        armament: true,
        supply: true,
        attendance: false,
        medical: false,
        financial: false,
        security: false,
        training: false
      });
    } else if (preset === 'adminOnly') {
      setSelectedSections({
        summary: true,
        admin: true,
        movement: true,
        armament: false,
        supply: false,
        attendance: true,
        medical: false,
        financial: false,
        security: false,
        training: false
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-md overflow-hidden print:p-0 print:bg-white print:static printable-modal-overlay">
      
      {/* Container */}
      <div className="bg-white text-slate-900 border border-slate-300 rounded-3xl max-w-5xl w-full shadow-2xl relative my-2 sm:my-4 max-h-[94vh] flex flex-col overflow-hidden print:max-h-none print:border-none print:shadow-none print:p-0 print:m-0 print:w-full printable-modal-card">
        
        {/* Sticky Header with Action Controls (Print, Open in New Window, Return to List) */}
        <div className="sticky top-0 z-30 bg-slate-900 text-white p-3.5 sm:p-4 rounded-t-3xl border-b-2 border-emerald-500/80 shadow-md flex flex-wrap items-center justify-between gap-3 print:hidden no-print shrink-0">
          <div className="flex items-center space-x-2.5 space-x-reverse">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0 shadow-sm">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-black text-amber-300 font-['Tajawal'] flex items-center space-x-2 space-x-reverse">
                <span>معاينة وتخصيص طباعة الملف العسكري الموحد والشامل</span>
              </h2>
              <p className="text-[11px] text-slate-300 font-medium">
                {personnel ? `الفرد: ${personnel.rank} / ${personnel.fullName} (${personnel.militaryId})` : reportTitle || 'التقرير الموحد'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 space-x-reverse flex-wrap gap-1.5">
            {/* Prominent Return to List Button */}
            <button
              type="button"
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-white border border-amber-500/50 font-extrabold px-3.5 py-2 rounded-xl text-xs transition-all shadow-md flex items-center space-x-1.5 space-x-reverse cursor-pointer"
              title="العودة للقائمة السابقة وإغلاق نافذة المعاينة والطباعة"
            >
              <ArrowRight className="w-4 h-4 text-amber-400" />
              <span>العودة للقائمة السابقة ↩️</span>
            </button>

            {/* Open in Separate Tab / Window */}
            <button
              type="button"
              onClick={() => {
                const win = window.open('', '_blank');
                if (win) {
                  win.document.write(`<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>تقرير ملف فرد عسكري - ${personnel?.fullName || 'طباعة'}</title><link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&family=Tajawal:wght@700;900&display=swap" rel="stylesheet"><script src="https://cdn.tailwindcss.com"></script></head><body class="p-8 bg-white font-['Cairo',sans-serif]">`);
                  const content = document.getElementById('printable-official-form-content');
                  if (content) {
                    win.document.write(content.innerHTML);
                  } else {
                    win.document.write('<p>تعذر تحميل التقرير</p>');
                  }
                  win.document.write('</body></html>');
                  win.document.close();
                }
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-3.5 py-2 rounded-xl text-xs transition-all shadow-md cursor-pointer flex items-center space-x-1.5 space-x-reverse"
              title="فتح هذا الملف المستندي في نافذة تبويب منفصلة مستقلة للطباعة والمشاركة"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline">فتح في نافذة منفصلة ↗️</span>
            </button>

            {/* Instant Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-4 py-2 rounded-xl text-xs transition-all shadow-md cursor-pointer flex items-center space-x-1.5 space-x-reverse"
            >
              <Printer className="w-4 h-4" />
              <span>أمر الطباعة الفورية (PDF) 📄</span>
            </button>

            {/* Close Icon Button */}
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl cursor-pointer transition-all border border-slate-700"
              title="إغلاق والعودة"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Document Body Container */}
        <div className="overflow-y-auto p-4 sm:p-6 md:p-8 flex-1 space-y-6">

        {/* Dynamic Officer Approval Settings Panel (Hidden on Print) */}
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-300 rounded-2xl p-4 mb-4 print:hidden shadow-xs font-['Cairo',sans-serif]">
          <div className="flex items-center space-x-2 space-x-reverse text-emerald-950 font-black text-xs mb-3">
            <UserPlus className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>تحديد وتخصيص أسماء ورتب الضباط المعنيين باعتِماد وتوقيع هذا الملف الشامل:</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-700">الضابط الأول (الرتبة والاسم):</label>
              <input
                type="text"
                value={officer1Name}
                onChange={(e) => setOfficer1Name(e.target.value)}
                placeholder="الرتبة / الاسم"
                className="w-full bg-white border border-emerald-300 rounded-xl px-3 py-1.5 font-bold text-slate-900 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-700">الضابط الثاني (الرتبة والاسم):</label>
              <input
                type="text"
                value={officer2Name}
                onChange={(e) => setOfficer2Name(e.target.value)}
                placeholder="الرتبة / الاسم"
                className="w-full bg-white border border-emerald-300 rounded-xl px-3 py-1.5 font-bold text-slate-900 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-700">قائد الفرقة / الجهة المعتمدة:</label>
              <input
                type="text"
                value={officer3Name}
                onChange={(e) => setOfficer3Name(e.target.value)}
                placeholder="الرتبة / الاسم"
                className="w-full bg-white border border-emerald-300 rounded-xl px-3 py-1.5 font-bold text-slate-900 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section Selection Panel for Custom Paper-Saving Print (Hidden on Print) */}
        {personnel && (
          <div className="bg-slate-50 border-2 border-slate-300 rounded-2xl p-4 mb-6 print:hidden shadow-xs font-['Cairo',sans-serif]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-200">
              <div className="flex items-center space-x-2 space-x-reverse text-slate-900 font-black text-xs">
                <Filter className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>تخصيص واختيار السجلات المطلوب طباعتها (لتوفير الورق وتسهيل الأرشفة):</span>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse text-[11px] font-bold">
                <button
                  type="button"
                  onClick={selectAllSections}
                  className="text-emerald-800 hover:text-emerald-900 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                >
                  تحديد جميع السجلات
                </button>
                <button
                  type="button"
                  onClick={unselectAllSections}
                  className="text-slate-700 hover:text-slate-900 bg-slate-200 hover:bg-slate-300 border border-slate-300 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                >
                  إلغاء التحديد
                </button>
              </div>
            </div>

            {/* Section Toggles Checkbox Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 text-xs">
              <label className={`flex items-center space-x-2 space-x-reverse p-2 rounded-xl border cursor-pointer transition-all ${selectedSections.summary ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-black shadow-xs' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-100'}`}>
                <input
                  type="checkbox"
                  checked={selectedSections.summary}
                  onChange={() => toggleSection('summary')}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 accent-emerald-600 cursor-pointer"
                />
                <span className="text-[11px] truncate">بطاقة الفرد والتمام</span>
              </label>

              <label className={`flex items-center space-x-2 space-x-reverse p-2 rounded-xl border cursor-pointer transition-all ${selectedSections.admin ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-black shadow-xs' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-100'}`}>
                <input
                  type="checkbox"
                  checked={selectedSections.admin}
                  onChange={() => toggleSection('admin')}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 accent-emerald-600 cursor-pointer"
                />
                <span className="text-[11px] truncate">السجل الإداري والشخصي</span>
              </label>

              <label className={`flex items-center space-x-2 space-x-reverse p-2 rounded-xl border cursor-pointer transition-all ${selectedSections.movement ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-black shadow-xs' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-100'}`}>
                <input
                  type="checkbox"
                  checked={selectedSections.movement}
                  onChange={() => toggleSection('movement')}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 accent-emerald-600 cursor-pointer"
                />
                <span className="text-[11px] truncate">الحركة والتنقلات</span>
              </label>

              <label className={`flex items-center space-x-2 space-x-reverse p-2 rounded-xl border cursor-pointer transition-all ${selectedSections.armament ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-black shadow-xs' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-100'}`}>
                <input
                  type="checkbox"
                  checked={selectedSections.armament}
                  onChange={() => toggleSection('armament')}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 accent-emerald-600 cursor-pointer"
                />
                <span className="text-[11px] truncate">سجل العهد والتسليح</span>
              </label>

              <label className={`flex items-center space-x-2 space-x-reverse p-2 rounded-xl border cursor-pointer transition-all ${selectedSections.supply ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-black shadow-xs' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-100'}`}>
                <input
                  type="checkbox"
                  checked={selectedSections.supply}
                  onChange={() => toggleSection('supply')}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 accent-emerald-600 cursor-pointer"
                />
                <span className="text-[11px] truncate">المهمات والتجهيزات</span>
              </label>

              <label className={`flex items-center space-x-2 space-x-reverse p-2 rounded-xl border cursor-pointer transition-all ${selectedSections.attendance ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-black shadow-xs' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-100'}`}>
                <input
                  type="checkbox"
                  checked={selectedSections.attendance}
                  onChange={() => toggleSection('attendance')}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 accent-emerald-600 cursor-pointer"
                />
                <span className="text-[11px] truncate">التحضير والغياب والفرار</span>
              </label>

              <label className={`flex items-center space-x-2 space-x-reverse p-2 rounded-xl border cursor-pointer transition-all ${selectedSections.medical ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-black shadow-xs' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-100'}`}>
                <input
                  type="checkbox"
                  checked={selectedSections.medical}
                  onChange={() => toggleSection('medical')}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 accent-emerald-600 cursor-pointer"
                />
                <span className="text-[11px] truncate">السجل الطبي والعيادات</span>
              </label>

              <label className={`flex items-center space-x-2 space-x-reverse p-2 rounded-xl border cursor-pointer transition-all ${selectedSections.financial ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-black shadow-xs' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-100'}`}>
                <input
                  type="checkbox"
                  checked={selectedSections.financial}
                  onChange={() => toggleSection('financial')}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 accent-emerald-600 cursor-pointer"
                />
                <span className="text-[11px] truncate">السجل المالي والرواتب</span>
              </label>

              <label className={`flex items-center space-x-2 space-x-reverse p-2 rounded-xl border cursor-pointer transition-all ${selectedSections.security ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-black shadow-xs' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-100'}`}>
                <input
                  type="checkbox"
                  checked={selectedSections.security}
                  onChange={() => toggleSection('security')}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 accent-emerald-600 cursor-pointer"
                />
                <span className="text-[11px] truncate">السجل الأمني والمخالفات</span>
              </label>

              <label className={`flex items-center space-x-2 space-x-reverse p-2 rounded-xl border cursor-pointer transition-all ${selectedSections.training ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-black shadow-xs' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-100'}`}>
                <input
                  type="checkbox"
                  checked={selectedSections.training}
                  onChange={() => toggleSection('training')}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 accent-emerald-600 cursor-pointer"
                />
                <span className="text-[11px] truncate">سجل الدورات والتأهيل</span>
              </label>
            </div>

            {/* Presets Quick Toolbar */}
            <div className="flex flex-wrap items-center gap-2 mt-3 pt-2.5 border-t border-slate-200 text-[11px]">
              <span className="text-slate-600 font-bold ml-1">قوالب طباعة جاهزة وسريعة:</span>
              <button
                type="button"
                onClick={() => selectPreset('medicalOnly')}
                className="bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 px-3 py-1 rounded-xl font-bold transition-all shadow-2xs cursor-pointer flex items-center space-x-1 space-x-reverse"
              >
                <span>🏥 السجل الطبي فقط</span>
              </button>
              <button
                type="button"
                onClick={() => selectPreset('financialOnly')}
                className="bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 px-3 py-1 rounded-xl font-bold transition-all shadow-2xs cursor-pointer flex items-center space-x-1 space-x-reverse"
              >
                <span>💰 السجل المالي والرواتب</span>
              </button>
              <button
                type="button"
                onClick={() => selectPreset('armamentOnly')}
                className="bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 px-3 py-1 rounded-xl font-bold transition-all shadow-2xs cursor-pointer flex items-center space-x-1 space-x-reverse"
              >
                <span>🔫 العهد والتسليح والمهمات</span>
              </button>
              <button
                type="button"
                onClick={() => selectPreset('adminOnly')}
                className="bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 px-3 py-1 rounded-xl font-bold transition-all shadow-2xs cursor-pointer flex items-center space-x-1 space-x-reverse"
              >
                <span>📁 الملف الإداري والتمام</span>
              </button>
            </div>
          </div>
        )}

        {/* PRINTABLE OFFICIAL MILITARY FORM CONTENT */}
        <div className="space-y-6 text-right font-['Cairo',sans-serif]">
          
          {/* Header Seal */}
          <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
            <div>
              <h1 className="text-xl font-black text-slate-900 font-['Tajawal']">قوات الطوارى اليمنية</h1>
              <h2 className="text-sm font-black text-slate-800">الفرقه الثالثة - المنظومة المركزية</h2>
              <p className="text-xs font-bold text-slate-600">{currentAccountName}</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 border-2 border-slate-900 rounded-full flex items-center justify-center mx-auto bg-slate-50 font-black text-[10px] text-slate-900 text-center leading-tight shadow-xs">
                قوات الطوارى<br/>اليمنية
              </div>
              <span className="text-[10px] text-slate-600 font-extrabold block mt-1">سري للغاية وخاص جداً</span>
            </div>

            <div className="text-left text-xs font-mono space-y-0.5 dir-ltr">
              <div className="text-right">رقم الملف: <strong className="font-bold text-slate-900">{personnel?.militaryId || `REP-${Math.floor(1000 + Math.random() * 9000)}`}</strong></div>
              <div className="text-right">تاريخ الطباعة: <strong className="font-bold text-slate-900">{new Date().toISOString().split('T')[0]}</strong></div>
              <div className="text-right">الحالة: <strong className="text-emerald-700 font-bold">ملف عسكري شامل وموثق</strong></div>
            </div>
          </div>

          {/* SINGLE PERSONNEL COMPLETE COMPREHENSIVE PRINT SHEET */}
          {personnel ? (
            <div className="space-y-6">
              
              {/* TOP SUMMARY BANNER */}
              {selectedSections.summary && (
                <div className="bg-slate-50 border-2 border-slate-300 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 print:break-inside-avoid">
                  <div className="flex items-center space-x-4 space-x-reverse">
                    <img
                      src={personnel.photoUrl}
                      alt={personnel.fullName}
                      className="w-24 h-24 rounded-2xl object-cover border-2 border-slate-700 shadow-md shrink-0"
                    />
                    <div>
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <span className="bg-slate-900 text-white text-[11px] font-black px-2.5 py-0.5 rounded-lg">
                          {personnel.rank}
                        </span>
                        <h3 className="text-xl font-black text-slate-900 font-['Tajawal']">{personnel.fullName}</h3>
                      </div>
                      <p className="text-xs font-extrabold text-emerald-800 mt-1">
                        الرقم العسكري / الوظيفي: <span className="font-mono text-slate-900 text-sm">{personnel.militaryId}</span> • السجل المدني: <span className="font-mono text-slate-900">{personnel.nationalId}</span>
                      </p>
                      <p className="text-xs font-bold text-slate-700 mt-1">
                        الوحدة: {personnel.unit} | الكتيبة: {personnel.battalion} | السرية: {personnel.company} | الفصيل: {personnel.platoon}
                      </p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        الوظيفة الحالية: <strong className="text-slate-900">{personnel.jobTitle}</strong> | تاريخ الالتحاق: <strong className="text-slate-900">{personnel.enlistmentDate}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="text-left border-r-2 border-slate-300 pr-5 shrink-0 space-y-1">
                    <div className="text-xs font-bold text-slate-600">حالة التمام والخدمة الحالية</div>
                    <div className="text-base font-black text-emerald-800 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-300 inline-block">
                      {personnel.currentStatus}
                    </div>
                    <div className="text-xs text-slate-700 font-bold">فصيلة الدم: <strong className="text-red-700">{personnel.bloodType}</strong></div>
                    <div className="text-[11px] text-slate-500 font-bold">البصمة الحيوية: {personnel.biometricsRecorded ? '✅ مسجلة وموثقة' : '❌ غير مسجلة'}</div>
                  </div>
                </div>
              )}

              {/* 1. SECTION: PERSONAL & ADMINISTRATIVE DETAILS */}
              {selectedSections.admin && (
                <div className="border border-slate-300 rounded-2xl p-4 bg-slate-50/70 space-y-3 print:break-inside-avoid">
                  <h4 className="text-xs font-black text-slate-900 border-b border-slate-300 pb-2 flex items-center space-x-1.5 space-x-reverse">
                    <User className="w-4 h-4 text-emerald-700" />
                    <span>أولاً: السجل الإداري والشخصي والبيانات الاجتماعية</span>
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div>تاريخ الميلاد: <strong>{personnel.dob}</strong></div>
                    <div>مكان الميلاد: <strong>{personnel.pob}</strong></div>
                    <div>الحالة الاجتماعية: <strong>{personnel.maritalStatus}</strong></div>
                    <div>المؤهل العلمي: <strong>{personnel.education}</strong></div>
                    <div>التخصص الرئيسي: <strong>{personnel.specialization}</strong></div>
                    <div>رقم الهاتف: <strong className="font-mono">{personnel.phone}</strong></div>
                    <div>اسم الأم: <strong>{personnel.motherName || 'غير مسجل'}</strong></div>
                    <div>الضامن / الكفيل: <strong>{personnel.guarantorName || 'غير مسجل'}</strong></div>
                    <div>أقرب أقاربه للطوارئ: <strong>{personnel.relativeName || 'غير مسجل'}</strong></div>
                    <div>هاتف القريب: <strong className="font-mono">{personnel.relativePhone || 'غير مسجل'}</strong></div>
                    <div>تاريخ بداية الخدمة: <strong>{personnel.enlistmentDate}</strong></div>
                    <div>الوحدة المنتدب لديها: <strong>{personnel.secondedUnit || 'لا يوجد'}</strong></div>
                  </div>
                </div>
              )}

              {/* 2. SECTION: MOVEMENT & TRANSFER LOG (سجل الحركة والتنقلات والإنهاء والإنضمام) */}
              {selectedSections.movement && (
                <div className="border border-slate-300 rounded-2xl p-4 space-y-3 print:break-inside-avoid">
                  <h4 className="text-xs font-black text-slate-900 border-b border-slate-300 pb-2 flex items-center justify-between">
                    <div className="flex items-center space-x-1.5 space-x-reverse">
                      <Repeat className="w-4 h-4 text-emerald-700" />
                      <span>ثانياً: سجل حركة التنقلات الإدارية والترقيات والإنضمام بين الكتيبات والوحدات</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500">عدد السجلات: ({personnel.logs.movement?.length || 0})</span>
                  </h4>
                  
                  {(!personnel.logs.movement || personnel.logs.movement.length === 0) ? (
                    <p className="text-xs text-slate-500 font-bold py-2 text-center">لا توجد تنقلات أو أوامر إدارية مسجلة للفرد سابقاً.</p>
                  ) : (
                    <table className="w-full text-right text-xs border border-slate-300">
                      <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-300">
                        <tr>
                          <th className="p-2 border-l">التاريخ</th>
                          <th className="p-2 border-l">نوع الحركة</th>
                          <th className="p-2 border-l">من وحدة / كتيبة</th>
                          <th className="p-2 border-l">إلى وحدة / كتيبة</th>
                          <th className="p-2 border-l">تفاصيل وأسباب الحركة والتنقل</th>
                          <th className="p-2">مرجع الأمر الإداري والجهة المصدرة</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {personnel.logs.movement.map((m) => (
                          <tr key={m.id}>
                            <td className="p-2 border-l font-mono text-slate-900">{m.date}</td>
                            <td className="p-2 border-l font-bold text-emerald-800">{m.type}</td>
                            <td className="p-2 border-l text-slate-800">{m.fromUnit || '-'}</td>
                            <td className="p-2 border-l font-bold text-slate-900">{m.toUnit || '-'}</td>
                            <td className="p-2 border-l text-slate-700">{m.reason || m.details || '-'}</td>
                            <td className="p-2 text-slate-600 font-mono text-[11px]">{m.orderReference || m.issuingAuthority || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* 3. SECTION: ARMAMENT & WEAPON CUSTODY LOG (سجل العهد والأسلحة والذخيرة) */}
              {selectedSections.armament && (
                <div className="border border-slate-300 rounded-2xl p-4 space-y-3 print:break-inside-avoid">
                  <h4 className="text-xs font-black text-slate-900 border-b border-slate-300 pb-2 flex items-center justify-between">
                    <div className="flex items-center space-x-1.5 space-x-reverse">
                      <Crosshair className="w-4 h-4 text-emerald-700" />
                      <span>ثالثاً: سجل العهد الشخصية والأسلحة والذخائر المسندة</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500">عدد القطع: ({personnel.logs.armament?.length || 0})</span>
                  </h4>

                  {(!personnel.logs.armament || personnel.logs.armament.length === 0) ? (
                    <p className="text-xs text-slate-500 font-bold py-2 text-center">لا توجد عهد أسلحة شخصية عسكرية مصروفة مسجلة حالياً.</p>
                  ) : (
                    <table className="w-full text-right text-xs border border-slate-300">
                      <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-300">
                        <tr>
                          <th className="p-2 border-l">نوع السلاح</th>
                          <th className="p-2 border-l">الرقم التسلسلي</th>
                          <th className="p-2 border-l">حجم الذخيرة</th>
                          <th className="p-2 border-l">المخازن / خطوط النار</th>
                          <th className="p-2 border-l">تاريخ الصرف</th>
                          <th className="p-2 border-l">الحالة الفنية</th>
                          <th className="p-2">الملاحظات الفنية</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {personnel.logs.armament.map((a) => (
                          <tr key={a.id}>
                            <td className="p-2 border-l font-bold text-slate-900">{a.weaponType}</td>
                            <td className="p-2 border-l font-mono font-bold text-emerald-800">{a.weaponSerial}</td>
                            <td className="p-2 border-l font-mono">{a.ammoQty} طلقة</td>
                            <td className="p-2 border-l font-mono">{a.firelinesCount || 1} مخزن</td>
                            <td className="p-2 border-l font-mono text-slate-800">{a.issueDate}</td>
                            <td className="p-2 border-l font-bold text-slate-800">{a.condition}</td>
                            <td className="p-2 text-slate-600 text-[11px]">{a.technicalNotes || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* 4. SECTION: SUPPLIES & DISPATCHED GEAR LOG (سجل المهمات المنصرفة والمعدات الميدانية) */}
              {selectedSections.supply && (
                <div className="border border-slate-300 rounded-2xl p-4 space-y-3 print:break-inside-avoid">
                  <h4 className="text-xs font-black text-slate-900 border-b border-slate-300 pb-2 flex items-center justify-between">
                    <div className="flex items-center space-x-1.5 space-x-reverse">
                      <Package className="w-4 h-4 text-emerald-700" />
                      <span>رابعاً: سجل المهمات المنصرفة والتجهيزات والمعدات العسكرية الميدانية</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500">إجمالي المواد: ({personnel.logs.supply?.length || 0})</span>
                  </h4>

                  {(!personnel.logs.supply || personnel.logs.supply.length === 0) ? (
                    <p className="text-xs text-slate-500 font-bold py-2 text-center">لا توجد سجلات صرف مهمات عسكرية أو تجهيزات ميدانية مضافة.</p>
                  ) : (
                    <table className="w-full text-right text-xs border border-slate-300">
                      <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-300">
                        <tr>
                          <th className="p-2 border-l">نوع المهمة / المادة</th>
                          <th className="p-2 border-l">اسم التجهيز</th>
                          <th className="p-2 border-l">الكمية</th>
                          <th className="p-2 border-l">تاريخ الصرف</th>
                          <th className="p-2 border-l">الحالة عند التسليم</th>
                          <th className="p-2">المُسلِّم / ملاحظات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {personnel.logs.supply.map((s) => (
                          <tr key={s.id}>
                            <td className="p-2 border-l font-bold text-slate-900">{s.itemType}</td>
                            <td className="p-2 border-l font-bold text-emerald-800">{s.itemName}</td>
                            <td className="p-2 border-l font-mono font-bold text-center">{s.quantity}</td>
                            <td className="p-2 border-l font-mono">{s.issueDate}</td>
                            <td className="p-2 border-l font-bold text-slate-700">{s.condition}</td>
                            <td className="p-2 text-slate-600 text-[11px]">{s.issuedBy} {s.notes ? `(${s.notes})` : ''}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* 5. SECTION: ATTENDANCE, ABSENCE & DESERTION LOG (سجل التحضير والحضور والغياب والفرار والإجازات) */}
              {selectedSections.attendance && (
                <div className="border border-slate-300 rounded-2xl p-4 space-y-3 print:break-inside-avoid">
                  <h4 className="text-xs font-black text-slate-900 border-b border-slate-300 pb-2 flex items-center justify-between">
                    <div className="flex items-center space-x-1.5 space-x-reverse">
                      <Clock className="w-4 h-4 text-emerald-700" />
                      <span>خامساً: سجل التحضير والحضور والغياب والفرار والإجازات والتمام</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500">إجمالي الحالات: ({personnel.logs.attendance?.length || 0})</span>
                  </h4>

                  {(!personnel.logs.attendance || personnel.logs.attendance.length === 0) ? (
                    <p className="text-xs text-slate-500 font-bold py-2 text-center">لا توجد قيود تمام أو إجازات أو غياب مدونة سابقاً.</p>
                  ) : (
                    <table className="w-full text-right text-xs border border-slate-300">
                      <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-300">
                        <tr>
                          <th className="p-2 border-l">التاريخ</th>
                          <th className="p-2 border-l">حالة التتمام</th>
                          <th className="p-2 border-l">المدة (أيام)</th>
                          <th className="p-2 border-l">تاريخ البداية والنهاية</th>
                          <th className="p-2 border-l">أسباب وملاحظات التمام</th>
                          <th className="p-2 border-l">المعتمد</th>
                          <th className="p-2">التصديق الحيوي للوجه</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {personnel.logs.attendance.map((att) => (
                          <tr key={att.id}>
                            <td className="p-2 border-l font-mono text-slate-900">{att.date}</td>
                            <td className={`p-2 border-l font-black ${
                              att.type === 'فرار' || att.type === 'غياب'
                                ? 'text-red-700'
                                : att.type === 'حضور'
                                ? 'text-emerald-700'
                                : 'text-amber-700'
                            }`}>
                              {att.type}
                            </td>
                            <td className="p-2 border-l font-mono text-center font-bold">{att.durationDays || 1}</td>
                            <td className="p-2 border-l font-mono text-[11px] text-slate-700">
                              {att.startDate} {att.endDate ? `إلى ${att.endDate}` : ''}
                            </td>
                            <td className="p-2 border-l text-slate-800">{att.reason || att.notes || '-'}</td>
                            <td className="p-2 border-l text-slate-700">{att.approvedBy || '-'}</td>
                            <td className="p-2 text-xs font-bold text-slate-700">
                              {att.faceVerified ? '📸 مؤكد حيويًا' : 'عادي'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* 6. SECTION: MEDICAL LOG (السجل الطبي والعيادات والوصفات) */}
              {selectedSections.medical && (
                <div className="border border-slate-300 rounded-2xl p-4 space-y-3 print:break-inside-avoid">
                  <h4 className="text-xs font-black text-slate-900 border-b border-slate-300 pb-2 flex items-center justify-between">
                    <div className="flex items-center space-x-1.5 space-x-reverse">
                      <HeartPulse className="w-4 h-4 text-emerald-700" />
                      <span>سادساً: السجل الطبي والعيادات العسكرية والوصفات والعمليات</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500">إجمالي الحالات: ({personnel.logs.medical?.length || 0})</span>
                  </h4>

                  {(!personnel.logs.medical || personnel.logs.medical.length === 0) ? (
                    <p className="text-xs text-slate-500 font-bold py-2 text-center">لا توجد زيارات طبية أو إجازات مرضية مسجلة للفرد.</p>
                  ) : (
                    <table className="w-full text-right text-xs border border-slate-300">
                      <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-300">
                        <tr>
                          <th className="p-2 border-l">التاريخ</th>
                          <th className="p-2 border-l">التشخيص الطبي</th>
                          <th className="p-2 border-l">المستشفى / العيادة</th>
                          <th className="p-2 border-l">الطبيب المعالج</th>
                          <th className="p-2 border-l">الراحة المرضية</th>
                          <th className="p-2">الأدوية والوصفات العلاجية المنصرفة</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {personnel.logs.medical.map((med) => (
                          <tr key={med.id}>
                            <td className="p-2 border-l font-mono text-slate-900">{med.date}</td>
                            <td className="p-2 border-l font-bold text-slate-900">{med.diagnosis}</td>
                            <td className="p-2 border-l text-slate-800">{med.hospital}</td>
                            <td className="p-2 border-l text-slate-700">{med.doctor}</td>
                            <td className="p-2 border-l font-bold text-red-700">{med.sickLeaveDays} أيام</td>
                            <td className="p-2 text-slate-700 text-[11px]">
                              {med.medications && med.medications.length > 0
                                ? med.medications.map(m => `${m.name} (${m.dose})`).join(' ، ')
                                : med.prescriptionDetails || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* 7. SECTION: FINANCIAL LOG (السجل المالي والرواتب والبدلات) */}
              {selectedSections.financial && (
                <div className="border border-slate-300 rounded-2xl p-4 space-y-3 print:break-inside-avoid">
                  <h4 className="text-xs font-black text-slate-900 border-b border-slate-300 pb-2 flex items-center justify-between">
                    <div className="flex items-center space-x-1.5 space-x-reverse">
                      <DollarSign className="w-4 h-4 text-emerald-700" />
                      <span>سابعاً: السجل المالي والرواتب والبدلات والاستقطاعات</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500">إجمالي المعاملات: ({personnel.logs.financial?.length || 0})</span>
                  </h4>

                  {(!personnel.logs.financial || personnel.logs.financial.length === 0) ? (
                    <p className="text-xs text-slate-500 font-bold py-2 text-center">لا توجد حركات سداد أو استقطاعات مالية مضافة لسجل الفرد.</p>
                  ) : (
                    <table className="w-full text-right text-xs border border-slate-300">
                      <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-300">
                        <tr>
                          <th className="p-2 border-l">التاريخ</th>
                          <th className="p-2 border-l">نوع المعاملة</th>
                          <th className="p-2 border-l">المبلغ المالية</th>
                          <th className="p-2 border-l">أسباب المعاملة والبيان</th>
                          <th className="p-2">تاريخ القيد والتنفيذ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {personnel.logs.financial.map((fin) => (
                          <tr key={fin.id}>
                            <td className="p-2 border-l font-mono text-slate-900">{fin.date}</td>
                            <td className="p-2 border-l font-bold text-emerald-800">{fin.type}</td>
                            <td className="p-2 border-l font-mono font-black text-slate-900">{fin.amount.toLocaleString()} ريال</td>
                            <td className="p-2 border-l text-slate-800">{fin.reason}</td>
                            <td className="p-2 font-mono text-slate-600 text-[11px]">{fin.transactionDate}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* 8. SECTION: SECURITY & INVESTIGATION LOG (السجل الأمني والمخالفات) */}
              {selectedSections.security && (
                <div className="border border-slate-300 rounded-2xl p-4 space-y-3 print:break-inside-avoid">
                  <h4 className="text-xs font-black text-slate-900 border-b border-slate-300 pb-2 flex items-center justify-between">
                    <div className="flex items-center space-x-1.5 space-x-reverse">
                      <AlertTriangle className="w-4 h-4 text-emerald-700" />
                      <span>ثامناً: السجل الأمني والاستخباراتي والمخالفات والجزاءات العسكرية</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500">إجمالي القيود: ({personnel.logs.security?.length || 0})</span>
                  </h4>

                  {(!personnel.logs.security || personnel.logs.security.length === 0) ? (
                    <p className="text-xs text-slate-500 font-bold py-2 text-center">السجل الأمني ناصع. لا توجد قضايا أو مخالفات استخباراتية مسجلة.</p>
                  ) : (
                    <table className="w-full text-right text-xs border border-slate-300">
                      <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-300">
                        <tr>
                          <th className="p-2 border-l">التاريخ</th>
                          <th className="p-2 border-l">نوع المخالفة / القضية</th>
                          <th className="p-2 border-l">تفاصيل التحقيق</th>
                          <th className="p-2 border-l">درجة الخطورة</th>
                          <th className="p-2 border-l">العقوبة والجزاء الإداري</th>
                          <th className="p-2">حالة القيد الأمني</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {personnel.logs.security.map((sec) => (
                          <tr key={sec.id}>
                            <td className="p-2 border-l font-mono text-slate-900">{sec.date}</td>
                            <td className="p-2 border-l font-bold text-red-800">{sec.violation}</td>
                            <td className="p-2 border-l text-slate-800">{sec.investigationDetails}</td>
                            <td className="p-2 border-l font-bold text-slate-900">{sec.warningLevel}</td>
                            <td className="p-2 border-l font-bold text-slate-900">{sec.penalty}</td>
                            <td className="p-2 font-bold text-slate-700">{sec.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* 9. SECTION: TRAINING COURSES LOG (سجل الدورات والتأهيل الميداني) */}
              {selectedSections.training && (
                <div className="border border-slate-300 rounded-2xl p-4 space-y-3 print:break-inside-avoid">
                  <h4 className="text-xs font-black text-slate-900 border-b border-slate-300 pb-2 flex items-center justify-between">
                    <div className="flex items-center space-x-1.5 space-x-reverse">
                      <Award className="w-4 h-4 text-emerald-700" />
                      <span>تاسعاً: سجل الدورات التدريبية والتأهيل القيادي والميداني</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500">إجمالي الدورات: ({personnel.logs.training?.length || 0})</span>
                  </h4>

                  {(!personnel.logs.training || personnel.logs.training.length === 0) ? (
                    <p className="text-xs text-slate-500 font-bold py-2 text-center">لا توجد دورات تدريبية مسجلة سابقاً.</p>
                  ) : (
                    <table className="w-full text-right text-xs border border-slate-300">
                      <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-300">
                        <tr>
                          <th className="p-2 border-l">اسم الدورة</th>
                          <th className="p-2 border-l">نوع الدورة</th>
                          <th className="p-2 border-l">مقر ومقدم الدورة</th>
                          <th className="p-2 border-l">الفترة الزمنية</th>
                          <th className="p-2 border-l">التقدير النهائي</th>
                          <th className="p-2">الشهادات والتقييم</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {personnel.logs.training.map((trn) => (
                          <tr key={trn.id}>
                            <td className="p-2 border-l font-bold text-slate-900">{trn.courseName}</td>
                            <td className="p-2 border-l text-slate-800">{trn.courseType}</td>
                            <td className="p-2 border-l text-slate-800">{trn.provider}</td>
                            <td className="p-2 border-l font-mono text-[11px] text-slate-700">
                              {trn.startDate} إلى {trn.endDate} ({trn.durationWeeks} أسابيع)
                            </td>
                            <td className="p-2 border-l font-bold text-emerald-800">{trn.grade}</td>
                            <td className="p-2 text-slate-600 text-[11px]">{trn.evaluation || trn.certificates || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* EMPTY SELECTION NOTICE */}
              {!Object.values(selectedSections).some(Boolean) && (
                <div className="bg-amber-50 border-2 border-amber-300 text-amber-900 rounded-2xl p-6 text-center font-bold text-xs my-4">
                  ⚠️ لم يتم تحديد أي سجل للطباعة! يرجى اختيار سجل واحد على الأقل من القائمة أعلاه (مثل: السجل الطبي، أو السجل المالي).
                </div>
              )}

              {/* OFFICIAL SIGNATURES AND SEALS BLOCK */}
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
          ) : (
            /* MULTIPLE RECORDS REPORT SHEET */
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="text-base font-black text-slate-900">
                  {reportTitle || 'تقرير القوة الجماعي المعتمد'}
                </h3>
                <span className="text-xs font-bold text-slate-600 font-mono">
                  إجمالي السجلات: {reportData?.length || 0} فرد
                </span>
              </div>

              <table className="w-full text-right text-xs border border-slate-300">
                <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                  <tr>
                    <th className="p-2 border-l">#</th>
                    <th className="p-2 border-l">الرقم الوظيفي</th>
                    <th className="p-2 border-l">الاسم الرباعي</th>
                    <th className="p-2 border-l">الرتبة</th>
                    <th className="p-2 border-l">الوحدة والكتيبة</th>
                    <th className="p-2 border-l">الحالة الحالية</th>
                    <th className="p-2">رقم الهاتف</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {reportData?.map((p, idx) => (
                    <tr key={p.militaryId}>
                      <td className="p-2 border-l font-mono text-center text-slate-500">{idx + 1}</td>
                      <td className="p-2 border-l font-mono font-bold text-slate-900">{p.militaryId}</td>
                      <td className="p-2 border-l font-bold text-slate-900">{p.fullName}</td>
                      <td className="p-2 border-l font-bold text-slate-800">{p.rank}</td>
                      <td className="p-2 border-l text-slate-700">{p.unit} - {p.battalion}</td>
                      <td className="p-2 border-l font-bold text-emerald-800">{p.currentStatus}</td>
                      <td className="p-2 font-mono text-slate-700">{p.phone}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Footer Signatures */}
              <div className="pt-8 border-t-2 border-slate-800 grid grid-cols-3 gap-6 text-center text-xs font-bold text-slate-900 signature-block print:break-inside-avoid">
                <div className="space-y-3">
                  <p className="font-black">{officer1Title}</p>
                  <p className="font-bold text-slate-800 text-xs">{officer1Name}</p>
                  <p className="text-[10px] text-slate-400">التوقيع: ....................</p>
                </div>
                <div className="space-y-3">
                  <p className="font-black">{officer2Title}</p>
                  <p className="font-bold text-slate-800 text-xs">{officer2Name}</p>
                  <p className="text-[10px] text-slate-400">المصادقة والختم: ....................</p>
                </div>
                <div className="space-y-3">
                  <p className="font-black">{officer3Title}</p>
                  <p className="font-bold text-slate-800 text-xs">{officer3Name}</p>
                  <p className="text-[10px] text-slate-400">التوقيع والخاتم الرسمي: ....................</p>
                </div>
              </div>
            </div>
          )}

        </div>

        </div>

        {/* Floating Sticky Bottom Bar for Quick Return & Print */}
        <div className="sticky bottom-0 z-30 bg-slate-950 text-white p-3.5 rounded-b-3xl border-t-2 border-emerald-500/80 shadow-2xl flex items-center justify-between gap-3 print:hidden no-print backdrop-blur-md shrink-0">
          <div className="flex items-center space-x-2 space-x-reverse text-xs text-slate-300 font-medium">
            <Printer className="w-4 h-4 text-emerald-400" />
            <span className="font-bold hidden sm:inline text-amber-300 font-['Tajawal']">معاينة وتخصيص طباعة الملف الموحد</span>
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
              <span>طباعة فورية (PDF) 📄</span>
            </button>
          </div>
        </div>

      </div>

    </div>,
    document.body
  );
};

