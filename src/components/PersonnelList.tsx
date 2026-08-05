import React, { useState, useMemo } from 'react';
import {
  UserPlus,
  Search,
  Filter,
  FileText,
  Edit,
  Shield,
  Eye,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Download,
  Trash2,
  FileSpreadsheet,
  Calendar,
  Users,
  ArrowRightLeft
} from 'lucide-react';
import { PersonnelRecord, PersonnelStatus, DepartmentRole } from '../types';
import { GrantLeavePermissionTabs } from './GrantLeavePermissionTabs';

interface PersonnelListProps {
  personnel: PersonnelRecord[];
  onSelectPersonnel: (militaryId: string) => void;
  onEditPersonnel: (personnel: PersonnelRecord) => void;
  onDeletePersonnel?: (militaryId: string, name: string) => void;
  onAddNewPersonnel: () => void;
  onOpenExcelImport?: () => void;
  onQuickStatusChange: (militaryId: string, newStatus: PersonnelStatus) => void;
  onOpenReplacementModal?: (preSelectedMilitaryId?: string) => void;
  currentRole: DepartmentRole;
  globalSearchTerm: string;
}

export const PersonnelList: React.FC<PersonnelListProps> = ({
  personnel,
  onSelectPersonnel,
  onEditPersonnel,
  onDeletePersonnel,
  onAddNewPersonnel,
  onOpenExcelImport,
  onQuickStatusChange,
  onOpenReplacementModal,
  currentRole,
  globalSearchTerm
}) => {
  const [moduleView, setModuleView] = useState<'directory' | 'leaves_permissions'>('directory');
  const [filterRank, setFilterRank] = useState<string>('الكل');
  const [filterUnit, setFilterUnit] = useState<string>('الكل');
  const [filterStatus, setFilterStatus] = useState<string>('الكل');
  const [localSearch, setLocalSearch] = useState<string>('');

  // Extract unique units for filter
  const uniqueUnits = useMemo(() => {
    const units = new Set<string>();
    personnel.forEach((p) => p.unit && units.add(p.unit));
    return ['الكل', ...Array.from(units)];
  }, [personnel]);

  // Extract unique ranks
  const uniqueRanks = [
    'الكل',
    'فريق أول',
    'فريق',
    'لواء',
    'عميد',
    'عقيد',
    'مقدم',
    'رائد',
    'نقيب',
    'ملازم أول',
    'ملازم',
    'رئيس رقباء',
    'رقيب أول',
    'رقيب',
    'وكيل رقيب',
    'عريف',
    'جندي أول',
    'جندي'
  ];

  // Filtered personnel list
  const filteredPersonnel = useMemo(() => {
    const search = (localSearch || globalSearchTerm).trim().toLowerCase();

    return personnel.filter((p) => {
      // Search term match across fields
      const matchesSearch =
        !search ||
        p.fullName.toLowerCase().includes(search) ||
        p.militaryId.toLowerCase().includes(search) ||
        p.nationalId.toLowerCase().includes(search) ||
        p.unit.toLowerCase().includes(search) ||
        p.rank.toLowerCase().includes(search) ||
        p.jobTitle.toLowerCase().includes(search) ||
        p.logs.armament.some((a) => a.weaponSerial.toLowerCase().includes(search) || a.weaponType.toLowerCase().includes(search));

      // Rank filter
      const matchesRank = filterRank === 'الكل' || p.rank === filterRank;

      // Unit filter
      const matchesUnit = filterUnit === 'الكل' || p.unit === filterUnit;

      // Status filter
      const matchesStatus = filterStatus === 'الكل' || p.currentStatus === filterStatus;

      return matchesSearch && matchesRank && matchesUnit && matchesStatus;
    });
  }, [personnel, localSearch, globalSearchTerm, filterRank, filterUnit, filterStatus]);

  // Export filtered table to CSV
  const exportCSV = () => {
    const headers = [
      'الرقم الوظيفي',
      'الاسم الرباعي',
      'الرتبة',
      'الرقم الوطني',
      'الوحدة',
      'الكتيبة',
      'السرية',
      'الحالة الحالية',
      'الهاتف'
    ];
    const rows = filteredPersonnel.map((p) => [
      p.militaryId,
      p.fullName,
      p.rank,
      p.nationalId,
      p.unit,
      p.battalion,
      p.company,
      p.currentStatus,
      p.phone
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `قائمة_القوة_البشرية_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Module Sub-Navigation Switcher */}
      <div className="bg-slate-100 p-1.5 rounded-2xl border border-slate-200 flex items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center space-x-2 space-x-reverse">
          <button
            onClick={() => setModuleView('directory')}
            className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center space-x-2 space-x-reverse cursor-pointer ${
              moduleView === 'directory'
                ? 'bg-emerald-700 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>📋 سجل وسرد القوة البشرية ({personnel.length})</span>
          </button>

          <button
            onClick={() => setModuleView('leaves_permissions')}
            className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center space-x-2 space-x-reverse cursor-pointer ${
              moduleView === 'leaves_permissions'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>🌴 إجازات وأذونات القوة والتأثير الجاهزي</span>
          </button>
        </div>

        <div className="text-[11px] text-slate-500 font-bold hidden md:block px-3">
          تحديث آلي وتطبيق فوري للوائح العسكرية
        </div>
      </div>

      {moduleView === 'leaves_permissions' ? (
        <GrantLeavePermissionTabs
          personnel={personnel}
          onSelectPersonnel={onSelectPersonnel}
          currentRole={currentRole}
        />
      ) : (
        <>
          {/* Top Header & Actions Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2 space-x-reverse font-['Tajawal']">
              <span>👥</span>
              <span>سجل القوة البشرية والملفات العسكرية الإلكترونية</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              إدارة شاملة لبيانات {personnel.length} فرد عسكري مسجل بقاعدة البيانات المركزية
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onOpenExcelImport && (
              <button
                onClick={onOpenExcelImport}
                className="flex items-center space-x-1.5 space-x-reverse bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-white" />
                <span>استيراد كشف Excel 📊</span>
              </button>
            )}

            <button
              onClick={exportCSV}
              className="flex items-center space-x-1.5 space-x-reverse bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-700" />
              <span>تصدير CSV</span>
            </button>

            {onOpenReplacementModal && (
              <button
                onClick={() => onOpenReplacementModal()}
                className="flex items-center space-x-2 space-x-reverse bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all shadow-md cursor-pointer"
              >
                <ArrowRightLeft className="w-4 h-4" />
                <span>استبدال فرد (فرار/متغيب)</span>
              </button>
            )}

            <button
              onClick={onAddNewPersonnel}
              className="flex items-center space-x-2 space-x-reverse bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-xl text-xs font-extrabold transition-all shadow-md cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>إضافة فرد جديد</span>
            </button>
          </div>
        </div>

        {/* Filters and Instant Search Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
          
          {/* Local Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="تصفية بالاسم/الرقم/السلاح..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pr-9 pl-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
            />
          </div>

          {/* Rank Filter */}
          <div>
            <select
              value={filterRank}
              onChange={(e) => setFilterRank(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-emerald-600"
            >
              <option value="الكل">كل الرتب العسكرية</option>
              {uniqueRanks.filter((r) => r !== 'الكل').map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Unit Filter */}
          <div>
            <select
              value={filterUnit}
              onChange={(e) => setFilterUnit(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-emerald-600"
            >
              <option value="الكل">جميع الوحدات والكتائب</option>
              {uniqueUnits.filter((u) => u !== 'الكل').map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-emerald-600"
            >
              <option value="الكل">جميع الحالات العسكرية</option>
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

      </div>

      {/* Main Personnel Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            
            {/* Table Header */}
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3.5">الفرد والرقم الوظيفي</th>
                <th className="px-4 py-3.5">الرتبة ووظيفته</th>
                <th className="px-4 py-3.5">الوحدة والكتيبة</th>
                <th className="px-4 py-3.5">السلاح العسكري المسند</th>
                <th className="px-4 py-3.5">الحالة الحالية</th>
                <th className="px-4 py-3.5 text-center">الملف والعمليات</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-200">
              {filteredPersonnel.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">
                    لا توجد نتائج مطابقة لشروط البحث والفلترة.
                  </td>
                </tr>
              ) : (
                filteredPersonnel.map((person) => {
                  const assignedWeapon = person.logs.armament[0];

                  return (
                    <tr
                      key={person.militaryId}
                      className="hover:bg-slate-50 transition-colors group"
                    >
                      {/* Name & Photo & Military ID */}
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-3 space-x-reverse">
                          <img
                            src={person.photoUrl}
                            alt={person.fullName}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-300 shadow-xs"
                          />
                          <div>
                            <div
                              onClick={() => onSelectPersonnel(person.militaryId)}
                              className="font-bold text-sm text-slate-900 hover:text-emerald-700 cursor-pointer transition-colors"
                            >
                              {person.fullName}
                            </div>
                            <div className="flex items-center space-x-2 space-x-reverse text-[11px] text-slate-500 mt-0.5">
                              <span className="font-mono bg-slate-100 text-emerald-800 px-1.5 py-0.5 rounded border border-slate-300 font-bold">
                                {person.militaryId}
                              </span>
                              <span>• هوية: {person.nationalId}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Rank & Job Title */}
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900 text-xs">
                          {person.rank}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {person.jobTitle || 'غير محدد'}
                        </div>
                      </td>

                      {/* Unit & Battalion */}
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-800 text-xs">
                          {person.unit}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {person.battalion} / {person.company}
                        </div>
                      </td>

                      {/* Assigned Weapon */}
                      <td className="px-4 py-3">
                        {assignedWeapon ? (
                          <div>
                            <div className="font-bold text-slate-800 text-[11px]">
                              {assignedWeapon.weaponType}
                            </div>
                            <div className="text-[10px] text-amber-700 font-mono font-bold">
                              S/N: {assignedWeapon.weaponSerial} ({assignedWeapon.ammoQty} طلقة)
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">لا يوجد سلاح مسند</span>
                        )}
                      </td>

                      {/* Current Status Dropdown */}
                      <td className="px-4 py-3">
                        <select
                          value={person.currentStatus}
                          onChange={(e) =>
                            onQuickStatusChange(
                              person.militaryId,
                              e.target.value as PersonnelStatus
                            )
                          }
                          className={`text-xs font-bold px-2.5 py-1 rounded-lg border focus:outline-none transition-colors ${
                            ['متواجد', 'في الميدان'].includes(person.currentStatus)
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : ['إجازة', 'إذن', 'مأمورية'].includes(person.currentStatus)
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : person.currentStatus === 'منتدب'
                              ? 'bg-purple-50 text-purple-800 border-purple-300'
                              : ['مستشفى'].includes(person.currentStatus)
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
                        {person.currentStatus === 'منتدب' && person.secondedUnit && (
                          <div className="text-[10px] text-purple-800 font-bold mt-1 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                            الجهة: {person.secondedUnit}
                          </div>
                        )}
                      </td>

                      {/* Actions Buttons */}
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center space-x-1.5 space-x-reverse">
                          <button
                            onClick={() => onSelectPersonnel(person.militaryId)}
                            className="flex items-center space-x-1 space-x-reverse bg-emerald-50 hover:bg-emerald-700 text-emerald-800 hover:text-white border border-emerald-300 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all"
                            title="عرض الملف الإلكتروني الكامل (8 سجلات)"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>الملف</span>
                          </button>

                          {['فرار', 'متغيب', 'غياب', 'منقطع', 'مفقود'].includes(person.currentStatus) && onOpenReplacementModal && (
                            <button
                              onClick={() => onOpenReplacementModal(person.militaryId)}
                              className="flex items-center space-x-1 space-x-reverse bg-amber-50 hover:bg-amber-600 text-amber-800 hover:text-white border border-amber-300 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all"
                              title="استبدال الفرد المتغيب/الفرار بفرد جديد"
                            >
                              <ArrowRightLeft className="w-3.5 h-3.5" />
                              <span>استبدال</span>
                            </button>
                          )}

                          <button
                            onClick={() => onEditPersonnel(person)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors border border-slate-300"
                            title="تعديل البيانات الأساسية"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {onDeletePersonnel && (
                            <button
                              onClick={() => onDeletePersonnel(person.militaryId, person.fullName)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white rounded-lg transition-all border border-rose-200"
                              title="حذف ونقل لسلة المحذوفات (احتفاظ لمدة 30 يوم)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary */}
        <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 font-medium">
          <span>
            عرض {filteredPersonnel.length} من إجمالي {personnel.length} سجل عسكري
          </span>
          <span className="text-[11px] text-emerald-800 font-bold">
            تحديث البيانات يتم تلقائياً وفورياً
          </span>
        </div>
      </div>
        </>
      )}
    </div>
  );
};
