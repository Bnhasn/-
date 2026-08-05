import React, { useState } from 'react';
import { ShieldAlert, Search, Filter, Clock, User, Building, FileCheck, ShieldCheck, Eye, Lock } from 'lucide-react';
import { AuditLogEntry, DepartmentRole, UserAccount } from '../types';

interface AuditLogViewProps {
  auditLogs: AuditLogEntry[];
  currentAccount?: UserAccount;
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ auditLogs, currentAccount }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('الكل');
  const [accountFilter, setAccountFilter] = useState('الكل');

  const isHQ = currentAccount?.isMainCommand ?? true;

  const filteredLogs = auditLogs.filter((log) => {
    const search = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !search ||
      log.userName.toLowerCase().includes(search) ||
      log.action.toLowerCase().includes(search) ||
      log.targetName.toLowerCase().includes(search) ||
      log.targetMilitaryId.toLowerCase().includes(search) ||
      (log.accountName && log.accountName.toLowerCase().includes(search)) ||
      log.details.toLowerCase().includes(search);

    const matchesDept = deptFilter === 'الكل' || log.department === deptFilter;

    const matchesAccount =
      accountFilter === 'الكل' ||
      log.accountId === accountFilter ||
      (log.accountName && log.accountName.includes(accountFilter));

    return matchesSearch && matchesDept && matchesAccount;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner - HQ vs Isolated Account */}
      {isHQ ? (
        <div className="bg-gradient-to-r from-amber-900 via-slate-900 to-amber-950 text-white rounded-2xl p-6 shadow-md border border-amber-500/30">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="p-3 bg-amber-500/20 rounded-xl border border-amber-400/30">
                <ShieldCheck className="w-7 h-7 text-amber-400" />
              </div>
              <div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <h2 className="text-lg font-black text-white font-['Tajawal']">
                    سجل التدقيق المركزي - لوحة القيادة العليا
                  </h2>
                  <span className="bg-amber-500/30 text-amber-300 border border-amber-400/40 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    👑 إشراف شامل ومراقبة حية
                  </span>
                </div>
                <p className="text-xs text-amber-100/80 mt-1 font-medium">
                  مراقبة فورية وتوثيق رقمي كامل لكافة عمليات إدخال البيانات، التعديلات، والحركات المسجلة عبر جميع حسابات الألوية والإدارات الفرعية.
                </p>
              </div>
            </div>

            <div className="text-xs font-mono bg-black/40 border border-amber-500/30 px-3 py-2 rounded-xl text-amber-300 font-bold whitespace-nowrap">
              إجمالي السجلات المركزية: {auditLogs.length}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-emerald-950 text-white rounded-2xl p-6 shadow-md border border-emerald-500/30">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="p-3 bg-emerald-500/20 rounded-xl border border-emerald-400/30">
                <Lock className="w-7 h-7 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <h2 className="text-lg font-black text-white font-['Tajawal']">
                    سجل التدقيق الخاضع للعزل - ({currentAccount?.name})
                  </h2>
                  <span className="bg-emerald-500/30 text-emerald-300 border border-emerald-400/40 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    🛡️ سجل معزول للحساب
                  </span>
                </div>
                <p className="text-xs text-emerald-100/80 mt-1 font-medium">
                  يقتصر العرض على التعديلات والحركات والمدخلات المسجلة بواسطة ({currentAccount?.name}) أو الخاصة بقوة هذا الحساب فقط.
                </p>
              </div>
            </div>

            <div className="text-xs font-mono bg-black/40 border border-emerald-500/30 px-3 py-2 rounded-xl text-emerald-300 font-bold whitespace-nowrap">
              قيود الحساب المعزول: {auditLogs.length}
            </div>
          </div>
        </div>
      )}

      {/* Filter & Search Controls */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث بالاسم، الإجراء، الرقم الوظيفي..."
            className="w-full bg-slate-50 border border-slate-300 rounded-xl pr-9 pl-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-emerald-600"
          />
        </div>

        {/* Account Filter - visible especially for HQ */}
        <div>
          <select
            value={accountFilter}
            onChange={(e) => setAccountFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-none focus:bg-white focus:border-emerald-600"
          >
            <option value="الكل">جميع الحسابات والألوية</option>
            <option value="hq">لواء القيادة العامة</option>
            <option value="اللواء الأول">اللواء الأول</option>
            <option value="اللواء الثاني">اللواء الثاني</option>
            <option value="اللواء الثالث">اللواء الثالث</option>
            <option value="اللواء الرابع">اللواء الرابع</option>
            <option value="اللواء الخامس">اللواء الخامس</option>
            <option value="اللواء السادس">اللواء السادس</option>
          </select>
        </div>

        <div>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-emerald-600"
          >
            <option value="الكل">جميع الإدارات والفروع</option>
            <option value="القيادة الرئيسية">القيادة الرئيسية</option>
            <option value="إدارة الموارد البشرية">إدارة الموارد البشرية</option>
            <option value="إدارة التسليح">إدارة التسليح</option>
            <option value="إدارة التدريب">إدارة التدريب</option>
            <option value="الإدارة المالية">الإدارة المالية</option>
            <option value="الاستخبارات والأمن">الاستخبارات والأمن</option>
            <option value="الإدارة الفنية">الإدارة الفنية</option>
            <option value="إدارة التموين">إدارة التموين</option>
          </select>
        </div>
      </div>

      {/* Audit Log Timeline Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">الوقت والتاريخ</th>
                <th className="px-4 py-3">الحساب / اللواء</th>
                <th className="px-4 py-3">المستخدم والفرع</th>
                <th className="px-4 py-3">نوع الإجراء</th>
                <th className="px-4 py-3">الفرد المستهدف</th>
                <th className="px-4 py-3">تفاصيل الحركة المسجلة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400 font-bold">
                    لا توجد قيود تدقيق مطابقة لمعايير البحث الحالية
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const accName = log.accountName || 'لواء القيادة';
                  const isHqLog = accName.includes('القيادة') || log.accountId === 'hq';

                  return (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                        {log.timestamp}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            isHqLog
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          }`}
                        >
                          {accName}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{log.userName}</div>
                        <div className="text-[10px] text-slate-500 font-medium">{log.department}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="bg-slate-100 text-slate-800 border border-slate-300 px-2 py-0.5 rounded text-[11px] font-bold">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-800">{log.targetName}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{log.targetMilitaryId}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-700 max-w-sm">{log.details}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
