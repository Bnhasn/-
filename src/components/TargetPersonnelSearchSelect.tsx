import React, { useState, useRef, useEffect } from 'react';
import { Search, UserCheck, X, Check, Shield } from 'lucide-react';
import { PersonnelRecord } from '../types';

interface TargetPersonnelSearchSelectProps {
  personnel: PersonnelRecord[];
  selectedMilitaryId: string;
  onSelect: (militaryId: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
}

export const TargetPersonnelSearchSelect: React.FC<TargetPersonnelSearchSelectProps> = ({
  personnel,
  selectedMilitaryId,
  onSelect,
  label = 'اختر الفرد المستهدف بالقرار أو الإجراء:',
  placeholder = 'ابحث بالاسم الرباعي أو الرقم الوظيفي/العسكري...',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedPerson = personnel.find((p) => p.militaryId === selectedMilitaryId);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter list by query
  const filteredPersonnel = personnel.filter((p) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase().trim();
    return (
      p.fullName.toLowerCase().includes(q) ||
      p.militaryId.toLowerCase().includes(q) ||
      (p.nationalId && p.nationalId.toLowerCase().includes(q)) ||
      p.rank.toLowerCase().includes(q) ||
      p.unit.toLowerCase().includes(q) ||
      p.jobTitle.toLowerCase().includes(q)
    );
  }).slice(0, 100); // Limit rendered list to 100 for high performance with 1260+ records

  return (
    <div ref={wrapperRef} className={`relative space-y-1 text-right ${className}`}>
      {label && (
        <label className="block text-xs font-bold text-slate-800 font-['Tajawal']">
          {label}
        </label>
      )}

      {/* Trigger Box / Input */}
      <div className="relative">
        <div
          onClick={() => setIsOpen(true)}
          className={`w-full bg-slate-50 border ${
            isOpen ? 'border-emerald-600 bg-white ring-2 ring-emerald-500/20' : 'border-slate-300 hover:border-slate-400'
          } rounded-xl px-3 py-2.5 flex items-center justify-between cursor-pointer transition-all shadow-xs`}
        >
          {selectedPerson ? (
            <div className="flex items-center space-x-2 space-x-reverse overflow-hidden text-xs">
              <img
                src={selectedPerson.photoUrl}
                alt={selectedPerson.fullName}
                className="w-7 h-7 rounded-lg object-cover border border-slate-200 shrink-0"
              />
              <div className="truncate">
                <span className="font-extrabold text-slate-900 font-['Tajawal'] ml-1">
                  {selectedPerson.rank} / {selectedPerson.fullName}
                </span>
                <span className="font-mono text-emerald-800 bg-emerald-100 border border-emerald-300 px-1.5 py-0.2 rounded text-[10px] font-bold">
                  {selectedPerson.militaryId}
                </span>
                <span className="text-[10px] text-slate-500 mr-2 font-medium">
                  ({selectedPerson.unit} • {selectedPerson.currentStatus})
                </span>
              </div>
            </div>
          ) : (
            <span className="text-xs text-slate-400 font-medium">{placeholder}</span>
          )}

          <div className="flex items-center space-x-1 space-x-reverse shrink-0">
            {selectedPerson && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect('');
                  setQuery('');
                }}
                className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
                title="إلغاء التحديد"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <Search className="w-4 h-4 text-emerald-700" />
          </div>
        </div>
      </div>

      {/* Floating Dropdown List */}
      {isOpen && (
        <div className="absolute z-50 right-0 left-0 mt-1 bg-white border border-slate-200 rounded-2xl shadow-2xl p-2 space-y-2 text-xs">
          {/* Search Box */}
          <div className="relative">
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="اكتب للبحث بالاسم أو الرقم العسكري أو الوحدة..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pr-8 pl-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5" />
          </div>

          {/* Records Counter */}
          <div className="text-[10px] text-slate-500 px-2 flex items-center justify-between font-bold border-b border-slate-100 pb-1">
            <span>النتائج المطابقة: {filteredPersonnel.length} فرد</span>
            <span>(إجمالي القوة: {personnel.length})</span>
          </div>

          {/* Results List */}
          <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
            {filteredPersonnel.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs font-bold">
                لا يوجد فرد مطابق لبحثك ({query})
              </div>
            ) : (
              filteredPersonnel.map((p) => {
                const isSelected = p.militaryId === selectedMilitaryId;
                return (
                  <div
                    key={p.militaryId}
                    onClick={() => {
                      onSelect(p.militaryId);
                      setIsOpen(false);
                      setQuery('');
                    }}
                    className={`p-2 rounded-xl flex items-center justify-between cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-emerald-50 border border-emerald-300 text-emerald-950 font-bold'
                        : 'hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center space-x-2 space-x-reverse overflow-hidden">
                      <img
                        src={p.photoUrl}
                        alt={p.fullName}
                        className="w-8 h-8 rounded-lg object-cover border border-slate-200 shrink-0"
                      />
                      <div className="truncate">
                        <div className="flex items-center space-x-1.5 space-x-reverse">
                          <span className="font-extrabold text-slate-900 text-xs font-['Tajawal']">
                            {p.rank} / {p.fullName}
                          </span>
                          <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded border border-slate-200">
                            {p.militaryId}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center space-x-2 space-x-reverse mt-0.5">
                          <span>{p.unit}</span>
                          <span>•</span>
                          <span>{p.jobTitle || 'عسكري'}</span>
                          <span>•</span>
                          <span
                            className={`font-bold ${
                              ['متواجد', 'في الميدان'].includes(p.currentStatus)
                                ? 'text-emerald-700'
                                : 'text-amber-700'
                            }`}
                          >
                            {p.currentStatus}
                          </span>
                        </div>
                      </div>
                    </div>

                    {isSelected && <Check className="w-4 h-4 text-emerald-700 shrink-0 mr-1" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
