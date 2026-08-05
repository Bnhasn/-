import { MilitaryRank } from '../types';

export interface ArmoryWeaponPiece {
  id: string;
  serialNumber: string;
  weaponType: string;
  caliber: string;
  manufactureYear: string;
  technicalCondition: 'جاهز' | 'تحتاج صيانة' | 'غير جاهز' | 'معطوبة';
  status: 'في المخزن' | 'منصرف للفرد' | 'في الصيانة' | 'مستبعد';
  currentHolderMilitaryId?: string;
  currentHolderName?: string;
  currentHolderRank?: MilitaryRank;
  currentHolderUnit?: string;
  storageLocation: string;
  notes?: string;
  entryDate: string;
}

export interface ArmoryInventoryItem {
  id: string;
  itemType: 'weapon' | 'ammo';
  name: string;
  category: string;
  caliber: string;
  totalReceived: number;
  availableQty: number;
  issuedQty: number;
  inMaintenanceQty: number;
  minThreshold: number;
  storageLocation: string;
  unit: string;
  expiryDate?: string;
  lastUpdated: string;
}

export interface ArmoryIntakeRecord {
  id: string;
  date: string;
  itemType: 'weapon' | 'ammo';
  name: string;
  caliber: string;
  quantity: number;
  source: string;
  batchNumber: string;
  receivedBy: string;
  expiryDate?: string;
  notes?: string;
}

export interface ArmoryIssueOrder {
  id: string;
  orderNumber: string;
  date: string;
  recipientName: string;
  recipientMilitaryId: string;
  recipientRank: string;
  unit: string;
  weaponType: string;
  weaponSerial?: string;
  ammoType: string;
  ammoCaliber: string;
  issuedAmmoQty: number;
  issueReason: string;
  orderReference: string;
  responsibleOfficer: string;
  notes?: string;
  status: 'نشط' | 'تم الإرجاع' | 'إرجاع جزئي';
  returnDate?: string;
}

export interface WeaponLifecycleEvent {
  id: string;
  weaponSerial: string;
  weaponType: string;
  eventType: 'استلام بالمخزن' | 'صرف للفرد' | 'إرجاع للمخزن' | 'صيانة وفحص' | 'نقل بين الوحدات';
  date: string;
  actor: string;
  recipientOrUnit: string;
  details: string;
}

export interface WeaponTypeConfig {
  id: string;
  name: string;
  category: string;
  defaultCaliber: string;
  description: string;
}

export interface AmmoTypeConfig {
  id: string;
  name: string;
  caliber: string;
  category: string;
  unitMeasurement: string;
}

// Initial Weapon Types
export const INITIAL_WEAPON_TYPES: WeaponTypeConfig[] = [
  { id: 'wt-1', name: 'كلاش صيني', category: 'بنادق هجومية', defaultCaliber: '7.62×39mm', description: 'بندقية هجومية مشاة صينية شديدة التحمل' },
  { id: 'wt-2', name: 'قناصة دراغانوف', category: 'بنادق قنص', defaultCaliber: '7.62×54mmR', description: 'بندقية قنص ميداني بعيدة المدى مع منظار رؤية' },
  { id: 'wt-3', name: 'قناصة عيار 50', category: 'بنادق قنص ثقيلة', defaultCaliber: '12.7×99mm (.50 BMG)', description: 'بندقية قنص ثقيلة ومضادة للمعدات والتحصينات' },
  { id: 'wt-4', name: 'عيار 23', category: 'أسلحة ثقيلة ومضاد طائرات', defaultCaliber: '23×152mm', description: 'مدفع/رشاش ثقيل مزدوج مضاد للطائرات والأهداف الأرضية' },
  { id: 'wt-5', name: 'عيار 14', category: 'رشاشات ثقيلة', defaultCaliber: '14.5×114mm', description: 'رشاش ثقيل عيار 14.5 مم محمول على عربات ميدانية' },
  { id: 'wt-6', name: 'عيار 12', category: 'رشاشات ثقيلة', defaultCaliber: '12.7×108mm', description: 'رشاش ثقيل عيار 12.7 مم (دوشكا / براونينغ)' },
  { id: 'wt-7', name: 'معدل شيكي', category: 'رشاشات متوسطة', defaultCaliber: '7.62×54mmR', description: 'رشاش متوسط بكت أو شيكي للإسناد الناري المكثف' },
  { id: 'wt-8', name: 'مدفع 106', category: 'مدفعية عديمة الارتداد', defaultCaliber: '106mm HEAT', description: 'مدفع عديم الارتداد مضاد للدروع والتحصينات' },
  { id: 'wt-9', name: 'راجمة صواريخ', category: 'مدفعية صواريخ', defaultCaliber: '107mm / 122mm Rocket', description: 'راجمة صواريخ ميدانية للإسناد المساحي' },
  { id: 'wt-10', name: 'هاون 120', category: 'سلاح المدفعية والهاونات', defaultCaliber: '120mm Mortar', description: 'مدفع هاون ثقيل عيار 120 مم للإسناد البعيد' },
  { id: 'wt-11', name: 'هاون 80', category: 'سلاح المدفعية والهاونات', defaultCaliber: '81mm/80mm Mortar', description: 'مدفع هاون متوسط عيار 80 مم لمستوى الكتائب' },
  { id: 'wt-12', name: 'هاون 60', category: 'سلاح المدفعية والهاونات', defaultCaliber: '60mm Mortar', description: 'مدفع هاون خفيف محمول عيار 60 مم لمستوى السرايا' },
  { id: 'wt-13', name: 'بندقية هجومية M4A1', category: 'بنادق هجومية', defaultCaliber: '5.56×45mm NATO', description: 'بندقية هجومية خفيفة عالية الدقة للتدخل السريع' },
  { id: 'wt-14', name: 'مسدس غلوك 19 Glock', category: 'مسدسات شخصية', defaultCaliber: '9×19mm Parabellum', description: 'سلاح دفاع شخصي للضباط' },
];

// Initial Ammo Types
export const INITIAL_AMMO_TYPES: AmmoTypeConfig[] = [
  { id: 'at-1', name: 'ذخيرة 7.62×39mm (كلاش صيني)', caliber: '7.62×39mm', category: 'ذخائر بنادق', unitMeasurement: 'طلقة' },
  { id: 'at-2', name: 'ذخيرة 7.62×54mmR (دراغانوف / شيكي)', caliber: '7.62×54mmR', category: 'ذخائر قنص ورشاشات', unitMeasurement: 'طلقة' },
  { id: 'at-3', name: 'ذخيرة 12.7×99mm (قناصة عيار 50)', caliber: '12.7×99mm (.50 BMG)', category: 'ذخائر قنص ثقيلة', unitMeasurement: 'طلقة' },
  { id: 'at-4', name: 'ذخيرة عيار 23mm (مضاد طائرات)', caliber: '23×152mm', category: 'ذخائر أسلحة ثقيلة', unitMeasurement: 'طلقة' },
  { id: 'at-5', name: 'ذخيرة عيار 14.5mm', caliber: '14.5×114mm', category: 'ذخائر رشاشات ثقيلة', unitMeasurement: 'طلقة' },
  { id: 'at-6', name: 'ذخيرة عيار 12.7mm (دوشكا)', caliber: '12.7×108mm', category: 'ذخائر رشاشات ثقيلة', unitMeasurement: 'طلقة' },
  { id: 'at-7', name: 'ذخيرة معدل شيكي 7.62mm', caliber: '7.62×54mmR', category: 'ذخائر رشاشات متوسطة', unitMeasurement: 'طلقة' },
  { id: 'at-8', name: 'قذائف مدفع 106mm مضادة للدروع', caliber: '106mm HEAT', category: 'قذائف مدفعية', unitMeasurement: 'قذيفة' },
  { id: 'at-9', name: 'صواريخ راجمة 107mm / 122mm', caliber: '107mm Rocket', category: 'صواريخ راجمات', unitMeasurement: 'صاروخ' },
  { id: 'at-10', name: 'قذائف هاون 120mm', caliber: '120mm Mortar', category: 'قذائف هاون', unitMeasurement: 'قذيفة' },
  { id: 'at-11', name: 'قذائف هاون 80mm', caliber: '80mm Mortar', category: 'قذائف هاون', unitMeasurement: 'قذيفة' },
  { id: 'at-12', name: 'قذائف هاون 60mm', caliber: '60mm Mortar', category: 'قذائف هاون', unitMeasurement: 'قذيفة' },
  { id: 'at-13', name: 'ذخيرة حية 5.56mm NATO', caliber: '5.56×45mm NATO', category: 'ذخائر خفيفة', unitMeasurement: 'طلقة' },
  { id: 'at-14', name: 'ذخيرة حية 9×19mm Parabellum', caliber: '9×19mm Parabellum', category: 'ذخائر مسدسات', unitMeasurement: 'طلقة' },
];

// Initial Inventory Items (Cleaned of sample default mock data)
export const INITIAL_INVENTORY_ITEMS: ArmoryInventoryItem[] = [];

// Initial Weapon Pieces
export const INITIAL_WEAPON_PIECES: ArmoryWeaponPiece[] = [];

// Initial Intake Records
export const INITIAL_INTAKE_RECORDS: ArmoryIntakeRecord[] = [];

// Initial Issue Orders
export const INITIAL_ISSUE_ORDERS: ArmoryIssueOrder[] = [];

// Initial Weapon Lifecycle Events
export const INITIAL_LIFECYCLE_EVENTS: WeaponLifecycleEvent[] = [];

