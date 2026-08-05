import React, { useState } from 'react';
import { ShieldCheck, Lock, Key, AlertCircle, X, Check } from 'lucide-react';

interface HQPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const HQPinModal: React.FC<HQPinModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.trim() === '1122' || pin.trim() === '1234') {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('hq_authenticated', 'true');
      }
      setError('');
      setPin('');
      onSuccess();
      onClose();
    } else {
      setError('رمز الأمان السري غير صحيح. غير مصرح بالدخول لحساب القيادة الرئيسية.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-amber-500/40 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden font-['Cairo',sans-serif] text-right">
        {/* Modal Header */}
        <div className="p-6 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shadow-inner">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-amber-400 font-['Tajawal']">
                التحقق من أمان القيادة الرئيسية
              </h3>
              <p className="text-[11px] text-slate-400">
                مطلوب رمز الأمان للانتقال إلى حساب القيادة العامة
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-xs text-amber-200 leading-relaxed">
            <p className="font-bold flex items-center space-x-2 space-x-reverse text-amber-300 mb-1">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>عزل أمني بين حسابات الألوية والقيادة:</span>
            </p>
            <span>
              لضمان خصوصية البيانات وعدم وصول مستخدمي الألوية الفرعية إلى حساب القيادة العامة، يرجى إدخال رمز الأمان الخاص بالقيادة الرئيسية.
            </span>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-300 mb-2">
              رمز الأمان السري للقيادة (PIN Code) *
            </label>
            <div className="relative">
              <input
                type="password"
                required
                maxLength={6}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setError('');
                }}
                placeholder="أدخل رمز الأمان (الرمز الافتراضي: 1122)"
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 text-amber-400 font-mono font-bold tracking-widest text-center text-lg rounded-2xl py-3 px-4 focus:outline-none transition-all shadow-inner"
                autoFocus
              />
              <Key className="w-5 h-5 text-slate-500 absolute left-3 top-3.5" />
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5 flex items-center space-x-1 space-x-reverse">
              <span>💡 رمز أمان القيادة الرئيسي الافتراضي:</span>
              <span className="font-mono font-bold text-amber-400 bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/30">1122</span>
            </p>
          </div>

          {error && (
            <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-xs font-bold text-rose-300 flex items-center space-x-2 space-x-reverse animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center space-x-3 space-x-reverse pt-2">
            <button
              type="submit"
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black py-3 rounded-2xl text-xs transition-all shadow-lg flex items-center justify-center space-x-2 space-x-reverse cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>التحقق والدخول للقيادة الرئيسية</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl text-xs font-bold transition-all cursor-pointer"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
