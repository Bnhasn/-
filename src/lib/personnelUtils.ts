import { PersonnelStatus, PersonnelRecord } from '../types';

export const RESTRICTED_DISPENSE_STATUSES: PersonnelStatus[] = [
  'فار',
  'غائب',
  'مجاز',
  'منوم بالمستشفى',
  'موقوف',
  'متقاعد'
];

export function isEligibleForDispense(status: PersonnelStatus): boolean {
  return !RESTRICTED_DISPENSE_STATUSES.includes(status);
}

export function getStatusBadgeConfig(status: PersonnelStatus) {
  switch (status) {
    case 'على رأس العمل':
    case 'متواجد':
    case 'في الميدان':
      return {
        bg: 'bg-emerald-100',
        text: 'text-emerald-900',
        border: 'border-emerald-300',
        badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
        isRestricted: false,
        label: status
      };
    case 'مكلف بمهمة':
    case 'مأمورية':
      return {
        bg: 'bg-blue-100',
        text: 'text-blue-900',
        border: 'border-blue-300',
        badgeClass: 'bg-blue-100 text-blue-900 border-blue-300',
        isRestricted: false,
        label: status
      };
    case 'مجاز':
      return {
        bg: 'bg-amber-100',
        text: 'text-amber-900',
        border: 'border-amber-300',
        badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
        isRestricted: true,
        label: status
      };
    case 'غائب':
      return {
        bg: 'bg-orange-100',
        text: 'text-orange-900',
        border: 'border-orange-300',
        badgeClass: 'bg-orange-100 text-orange-900 border-orange-300',
        isRestricted: true,
        label: status
      };
    case 'فار':
      return {
        bg: 'bg-rose-100',
        text: 'text-rose-900',
        border: 'border-rose-300',
        badgeClass: 'bg-rose-100 text-rose-900 border-rose-300 font-extrabold',
        isRestricted: true,
        label: status
      };
    case 'منوم بالمستشفى':
    case 'مستشفى':
      return {
        bg: 'bg-pink-100',
        text: 'text-pink-900',
        border: 'border-pink-300',
        badgeClass: 'bg-pink-100 text-pink-900 border-pink-300',
        isRestricted: true,
        label: status
      };
    case 'منتدب':
      return {
        bg: 'bg-purple-100',
        text: 'text-purple-900',
        border: 'border-purple-300',
        badgeClass: 'bg-purple-100 text-purple-900 border-purple-300 font-bold',
        isRestricted: false,
        label: 'منتدب'
      };
    case 'موقوف':
      return {
        bg: 'bg-slate-200',
        text: 'text-slate-900',
        border: 'border-slate-400',
        badgeClass: 'bg-slate-200 text-slate-900 border-slate-400',
        isRestricted: true,
        label: status
      };
    case 'منقول':
    case 'متقاعد':
      return {
        bg: 'bg-gray-100',
        text: 'text-gray-800',
        border: 'border-gray-300',
        badgeClass: 'bg-gray-100 text-gray-800 border-gray-300',
        isRestricted: true,
        label: status
      };
    default:
      return {
        bg: 'bg-slate-100',
        text: 'text-slate-800',
        border: 'border-slate-300',
        badgeClass: 'bg-slate-100 text-slate-800 border-slate-300',
        isRestricted: false,
        label: status
      };
  }
}

export interface CustodyItem {
  id: string;
  category: 'تسليح' | 'تموين وإمداد' | 'طبية';
  itemName: string;
  serialOrCode?: string;
  quantity: number | string;
  issueDate: string;
  condition: string;
  orderNumber?: string;
  issuingBranch: string;
  notes?: string;
}

export interface ChronologicalDispenseEntry {
  id: string;
  date: string;
  branch: 'فرع التسليح' | 'فرع التموين والإمداد' | 'الفرع الطبي' | string;
  dispenseType: string;
  itemName: string;
  details: string;
  quantity: number | string;
  issuedBy: string;
  orderNumber: string;
  notes?: string;
}

// Extract all active custody items for a person across all branches
export function getPersonnelCustodies(personnel: PersonnelRecord): CustodyItem[] {
  const custodies: CustodyItem[] = [];

  // Armament custodies
  if (personnel.logs?.armament) {
    personnel.logs.armament.forEach((arm) => {
      if (!arm.returnDate) {
        custodies.push({
          id: arm.id,
          category: 'تسليح',
          itemName: arm.weaponType,
          serialOrCode: arm.weaponSerial,
          quantity: `1 قطعة + ${arm.ammoQty} طلقة`,
          issueDate: arm.issueDate,
          condition: arm.condition,
          orderNumber: arm.technicalNotes?.match(/ORD-\d+-\d+/)?.[0] || 'أمر صرف تسليح',
          issuingBranch: 'إدارة التسليح',
          notes: arm.technicalNotes
        });
      }
    });
  }

  // Supply custodies
  if (personnel.logs?.supply) {
    personnel.logs.supply.forEach((sup) => {
      if (!sup.returnDate) {
        custodies.push({
          id: sup.id,
          category: 'تموين وإمداد',
          itemName: sup.itemName,
          serialOrCode: sup.serialNumber || '-',
          quantity: sup.quantity,
          issueDate: sup.issueDate,
          condition: sup.condition,
          orderNumber: sup.serialNumber ? `EQP-${sup.serialNumber}` : 'سند صرف إمداد',
          issuingBranch: sup.issuedBy || 'إدارة التموين والإمداد',
          notes: sup.notes
        });
      }
    });
  }

  // Medical dispensed supplies & medications
  if (personnel.logs?.medical) {
    personnel.logs.medical.forEach((med) => {
      if (med.medications) {
        med.medications.forEach((m) => {
          custodies.push({
            id: m.id,
            category: 'طبية',
            itemName: m.name,
            serialOrCode: m.dose,
            quantity: 1,
            issueDate: m.dateDispensed || med.date,
            condition: 'مصروف حديثاً',
            orderNumber: `MED-${med.id.slice(-5)}`,
            issuingBranch: 'الإدارة الطبية العسكرية',
            notes: `وصفة: ${m.prescribedBy} - تشخيص: ${med.diagnosis}`
          });
        });
      }
    });
  }

  return custodies;
}

// Get unified chronological dispense log for a person
export function getPersonnelChronologicalDispenses(personnel: PersonnelRecord): ChronologicalDispenseEntry[] {
  const entries: ChronologicalDispenseEntry[] = [];

  // Armament logs
  if (personnel.logs?.armament) {
    personnel.logs.armament.forEach((arm) => {
      entries.push({
        id: `disp-arm-${arm.id}`,
        date: arm.issueDate,
        branch: 'فرع التسليح',
        dispenseType: 'سلاح وذخيرة',
        itemName: arm.weaponType,
        details: `رقم تسلسلي: ${arm.weaponSerial} • ذخيرة: ${arm.ammoQty} طلقة`,
        quantity: 1,
        issuedBy: 'ضابط التسليح',
        orderNumber: arm.technicalNotes?.match(/ORD-\d+-\d+/)?.[0] || `ARM-${arm.id.slice(-5)}`,
        notes: arm.technicalNotes
      });
    });
  }

  // Supply logs
  if (personnel.logs?.supply) {
    personnel.logs.supply.forEach((sup) => {
      entries.push({
        id: `disp-sup-${sup.id}`,
        date: sup.issueDate,
        branch: 'فرع التموين والإمداد',
        dispenseType: sup.itemType,
        itemName: sup.itemName,
        details: `حالة: ${sup.condition} ${sup.serialNumber ? `• الرقم: ${sup.serialNumber}` : ''}`,
        quantity: sup.quantity,
        issuedBy: sup.issuedBy,
        orderNumber: `SUP-${sup.id.slice(-5)}`,
        notes: sup.notes
      });
    });
  }

  // Medical logs
  if (personnel.logs?.medical) {
    personnel.logs.medical.forEach((med) => {
      if (med.medications && med.medications.length > 0) {
        med.medications.forEach((m) => {
          entries.push({
            id: `disp-med-${m.id}`,
            date: m.dateDispensed || med.date,
            branch: 'الفرع الطبي',
            dispenseType: 'أدوية ومستلزمات طبية',
            itemName: m.name,
            details: `الجرعة/المواصفة: ${m.dose} • المستشفى: ${med.hospital}`,
            quantity: 1,
            issuedBy: m.prescribedBy || med.doctor,
            orderNumber: `MED-${m.id.slice(-5)}`,
            notes: `التشخيص: ${med.diagnosis}`
          });
        });
      }
    });
  }

  // Sort by date descending
  return entries.sort((a, b) => (a.date < b.date ? 1 : -1));
}
