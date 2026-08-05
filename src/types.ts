export type MilitaryRank =
  | 'فريق أول'
  | 'فريق'
  | 'لواء'
  | 'عميد'
  | 'عقيد'
  | 'مقدم'
  | 'رائد'
  | 'نقيب'
  | 'ملازم أول'
  | 'ملازم'
  | 'رئيس رقباء'
  | 'رقيب أول'
  | 'رقيب'
  | 'وكيل رقيب'
  | 'عريف'
  | 'جندي أول'
  | 'جندي';

export type PersonnelStatus =
  | 'على رأس العمل'
  | 'مكلف بمهمة'
  | 'مجاز'
  | 'غائب'
  | 'فار'
  | 'منوم بالمستشفى'
  | 'موقوف'
  | 'منقول'
  | 'متقاعد'
  | 'متواجد'
  | 'في الميدان'
  | 'إجازة'
  | 'إذن'
  | 'مستشفى'
  | 'غياب'
  | 'فرار'
  | 'مأمورية'
  | 'مفقود'
  | 'احتياط'
  | 'منتدب';

export type DepartmentRole =
  | 'القيادة الرئيسية'
  | 'إدارة الموارد البشرية'
  | 'إدارة التسليح'
  | 'إدارة التدريب'
  | 'الإدارة المالية'
  | 'الاستخبارات والأمن'
  | 'الإدارة الطبية العسكرية'
  | 'الإدارة الفنية'
  | 'إدارة التموين والإمداد';

export interface MovementLog {
  id: string;
  date: string;
  type: 'نقل' | 'إلحاق' | 'تكليف' | 'انتداب' | 'مأمورية' | 'أمر إداري' | 'ترقية' | 'تعديل وظيفة ورتبة' | 'استبدال عسكري';
  details?: string;
  reason?: string;
  fromUnit?: string;
  toUnit?: string;
  issuingAuthority?: string;
  orderReference?: string;
  effectiveDate?: string;
}

export interface AttendanceLog {
  id: string;
  date: string;
  type: 'حضور' | 'غياب' | 'إجازة' | 'إذن' | 'فرار' | 'احتجاز' | 'عودة للخدمة';
  reason: string;
  durationDays: number;
  approvedBy: string;
  startDate: string;
  endDate?: string;
  leaveType?: string;
  permissionType?: string;
  notes?: string;
  faceVerified?: boolean;
  faceVerificationSnapshot?: string;
  faceVerificationConfidence?: number;
  faceVerifiedAt?: string;
}

export interface DispensedMedication {
  id: string;
  name: string;
  dose: string;
  dateDispensed: string;
  prescribedBy: string;
}

export interface MedicalLog {
  id: string;
  date: string;
  diagnosis: string;
  hospital: string;
  doctor: string;
  injuryDetails?: string;
  surgicalOperations?: string;
  sickLeaveDays: number;
  medications: DispensedMedication[];
  prescriptionDetails?: string; // تفاصيل الوصفات العلاجية
  recoveryStartDate?: string; // تاريخ بداية التعافي
  recoveryEndDate?: string; // تاريخ انتهاء التعافي
  isReturnToDuty?: boolean; // عودة علاجية للخدمة
}

export interface FinancialLog {
  id: string;
  date: string;
  type: 'راتب' | 'بدل' | 'مكافأة' | 'حافز' | 'استقطاع' | 'سلفة' | 'تعويض';
  amount: number;
  reason: string;
  transactionDate: string;
}

export interface SecurityLog {
  id: string;
  date: string;
  violation: string;
  investigationDetails: string;
  penalty: string;
  warningLevel: 'منخفض' | 'متوسط' | 'شديد الخطورة' | 'عالي';
  detentionOrder?: string;
  authority: string;
  status: 'قيد التحقيق' | 'تم البت' | 'محال للقضاء العسكري' | 'مغلق';
}

export interface AmmoAction {
  id: string;
  type: 'صرف' | 'استرجاع';
  quantity: number;
  date: string;
  reason: string;
  issuedBy: string;
}

export interface ArmamentLog {
  id: string;
  weaponSerial: string;
  weaponType: string;
  issueDate: string;
  returnDate?: string;
  ammoQty: number;
  firelinesCount: number; // عدد خطوط النار / الخزائن
  ammoHistory: AmmoAction[];
  condition: 'ممتازة' | 'جيدة' | 'تحتاج صيانة' | 'معطوبة';
  technicalNotes: string;
}

export interface TrainingLog {
  id: string;
  courseName: string;
  courseType: 'ميداني' | 'قيادي' | 'تقني' | 'أمني' | 'تخصصي' | 'خارجي';
  provider: string;
  startDate: string;
  endDate: string;
  durationWeeks: number;
  grade: 'ممتاز' | 'جيد جداً' | 'جيد' | 'مقبول' | 'مؤهل';
  evaluation: string;
  certificates: string;
  supervisorOfficer?: string; // الضابط المشرف على الدورة
  trainingLocation?: string; // مقر/مكان الدورة
  status?: 'قائمة' | 'مكتملة' | 'مستقبلية';
  notes?: string;
}

export interface PersonnelAttachment {
  id: string;
  title: string;
  category: 'قرار إداري' | 'تقرير' | 'شهادة' | 'مستند شخصي' | 'وثيقة أمنية' | 'صورة/فيديو';
  fileType: 'pdf' | 'image' | 'video' | 'doc';
  uploadDate: string;
  fileSize: string;
  fileUrl?: string;
  uploadedBy?: string;
  notes?: string;
}

export interface SupplyLog {
  id: string;
  itemType: 'بدلة عسكرية' | 'بسطار/حذاء' | 'خوذة/دروع' | 'معدات ميدانية' | 'مؤن/تجهيزات' | 'مهمات أخرى';
  itemName: string;
  quantity: number;
  issueDate: string;
  returnDate?: string;
  condition: 'جديد' | 'مستعمل ممتازة' | 'مستعمل جيدة' | 'مستهلك';
  issuedBy: string;
  serialNumber?: string;
  notes?: string;
}

export interface PersonnelRecord {
  militaryId: string; // الرقم الوظيفي - Unique ID
  nationalId: string; // الرقم الوطني
  fullName: string; // الاسم الرباعي
  rank: MilitaryRank; // الرتبة
  dob: string; // تاريخ الميلاد
  pob: string; // مكان الميلاد
  maritalStatus: 'أعزب' | 'متزوج' | 'مطلق' | 'أرمل'; // الحالة الاجتماعية
  education: string; // المؤهل العلمي
  specialization: string; // التخصص
  bloodType: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  phone: string;
  motherName?: string; // اسم الأم
  guarantorName?: string; // اسم الضمين
  relativeName?: string; // اسم أقرب الأقارب
  relativePhone?: string; // رقم هاتف القريب
  photoUrl: string;
  biometricsRecorded: boolean; // حالة البصمة
  unit: string; // الوحدة
  battalion: string; // الكتيبة
  company: string; // السرية
  platoon: string; // الفصيل
  jobTitle: string; // الوظيفه
  enlistmentDate: string; // تاريخ الالتحاق
  currentStatus: PersonnelStatus; // الحالة الحالية
  secondedUnit?: string; // الوحدة المنتدب لديها
  createdByAccountId?: string; // معرف الحساب الذي قام بإدخال أو إنشاء الفرد (مثل 'hq', 'brigade1')
  
  logs: {
    movement: MovementLog[];
    attendance: AttendanceLog[];
    medical: MedicalLog[];
    financial: FinancialLog[];
    security: SecurityLog[];
    armament: ArmamentLog[];
    training: TrainingLog[];
    attachments: PersonnelAttachment[];
    supply?: SupplyLog[];
  };
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userName: string;
  department: DepartmentRole;
  accountId?: string; // معرف الحساب / اللواء
  accountName?: string; // اسم الحساب / اللواء
  action: string;
  targetMilitaryId: string;
  targetName: string;
  details: string;
  faceVerified?: boolean;
  faceConfidence?: number;
}

export interface DuplicateAlertDetails {
  militaryId: string;
  nationalId: string;
  fullName: string;
  rank: string;
  originalAccount: string;
  originalUnit: string;
  attemptedAccount: string;
  attemptedUnit: string;
  attemptedUser: string;
  timestamp: string;
}

export interface SystemAlert {
  id: string;
  title: string;
  description: string;
  level: 'urgent' | 'warning' | 'info';
  date: string;
  militaryId?: string;
  createdByAccountId?: string;
  isDuplicateAlert?: boolean;
  duplicateDetails?: DuplicateAlertDetails;
}

export type BrigadeAccountType =
  | 'hq'
  | 'brigade1'
  | 'brigade2'
  | 'brigade3'
  | 'brigade4'
  | 'brigade5'
  | 'brigade6'
  | 'brigade7'
  | 'brigade8';

export interface DeviceSessionInfo {
  deviceId: string;
  deviceType: 'mobile' | 'desktop';
  deviceTypeName: string;
  lastPing: number;
}

export interface AccessTimeRestriction {
  enabled: boolean;
  startTime: string; // "08:00"
  endTime: string;   // "17:00"
  allowedDays?: string[]; // ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  denyOutsideHoursMessage?: string;
}

export interface TwoFactorAuthConfig {
  enabled: boolean;
  requireOnUnknownDevice: boolean;
  verificationPin?: string; // 6-digit pin code
  phoneOrEmail?: string;
  trustedDevices?: string[]; // Array of trusted device signatures
}

export interface AccountSecuritySettings {
  accessHours?: AccessTimeRestriction;
  twoFactor?: TwoFactorAuthConfig;
  lastSecurityAudit?: string;
}

export interface TenantUserPermission {
  role: DepartmentRole; // Department or role title
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canExport: boolean;
  modules: {
    personnel: boolean;
    armament: boolean;
    medical: boolean;
    security: boolean;
    reports: boolean;
    audit: boolean;
    accounts: boolean;
  };
}

export interface TenantUserAccount {
  id: string;
  tenantId: string;
  username: string;
  password?: string;
  fullName: string;
  rank?: string;
  email?: string;
  phone?: string;
  isSuperAdmin: boolean;
  roleTitle: string;
  status: 'نشط' | 'موقوف' | 'محظور';
  permissions: TenantUserPermission;
  createdAt: string;
  lastLogin?: string;
}

export interface OrganizationTenant {
  id: string; // Tenant ID e.g. 'tenant-hq-main', 'tenant-brigade-1'
  name: string; // e.g. 'المؤسسة العسكرية المركزية - الفرقة الثالثة'
  code: string; // e.g. 'ORG-HQ'
  category: 'عسكري' | 'أمني' | 'حكومي' | 'طبي' | 'إداري';
  badge: string; // Icon/Emblem string
  description: string;
  accessKey?: string; // Optional secret key for tenant entrance
  status: 'نشط' | 'موقوف' | 'تحت الصيانة';
  createdAt: string;
  isDefaultMain?: boolean;
  unitFilter?: string;
  contactEmail?: string;
  contactPhone?: string;
  superAdminUsername?: string;
  superAdminName?: string;
  superAdminEmail?: string;
}

export interface UserAccount {
  id: BrigadeAccountType;
  name: string;
  shortCode: string;
  description: string;
  isMainCommand: boolean;
  unitFilter: string;
  color: string;
  badge: string;
  status: 'نشط' | 'غير نشط' | 'محظور';
  isBlocked?: boolean;
  blockedReason?: string;
  blockedAt?: string;
  customAccessKey?: string;
  lastSeen: string;
  connectedDevicesCount: number;
  boundDeviceId?: string;
  boundDeviceName?: string;
  boundAt?: string;
  devicesBreakdown?: {
    mobileCount: number;
    desktopCount: number;
    lastDeviceType?: string;
  };
  activeSessions?: DeviceSessionInfo[];
  securitySettings?: AccountSecuritySettings;
}


export interface SearchFilterState {
  searchTerm: string;
  rank?: string;
  unit?: string;
  battalion?: string;
  company?: string;
  status?: PersonnelStatus | 'الكل';
  weaponSearch?: string;
  hasViolationsOnly?: boolean;
}

export interface RecycledPersonnel {
  id: string;
  personnel: PersonnelRecord;
  deletedAt: string; // ISO string e.g. 2026-07-27T13:00:00.000Z
  deletedBy: string;
  reason?: string;
}

export interface PersonnelReplacementRecord {
  id: string;
  replacementSerial: string; // e.g. REP-2026-0042
  replacementDate: string; // YYYY-MM-DD
  createdByAccountId?: string;
  
  // Replaced Absent/Deserter Soldier (الفرد الأصلي المتغيب/الفرار)
  replacedMilitaryId: string;
  replacedFullName: string;
  replacedRank: MilitaryRank;
  replacedUnit: string;
  replacedBattalion: string;
  replacedCompany: string;
  replacedJobTitle: string;
  replacedStatus: PersonnelStatus; // e.g. فرار or غياب
  absenceStartDate?: string;

  // New Replacement Soldier (الفرد البديل الجديد)
  newMilitaryId: string;
  newNationalId: string;
  newFullName: string;
  newRank: MilitaryRank;
  newUnit: string;
  newBattalion: string;
  newCompany: string;
  newPlatoon: string;
  newJobTitle: string;
  newPhone: string;
  newEnlistmentDate: string;

  // Administrative Authority & Orders (الجهة الآمرة وأمر الاستبدال)
  orderNumber: string; // e.g. أمر قيادة اللواء رقم 4091/ب
  orderDate: string;
  issuingAuthority: string; // e.g. قيادة القوات المسلحة - شعبة إدارة التنظيم والضباط
  reason: string; // e.g. استبدال كادر بشرى بديل عن فرد متغيب/فرار لاستكمال الجاهزية القتالية
  notes?: string;

  // Signatures / Approvals
  responsibleOfficer: string;
  hrBranchChief: string;
  commandApproval: string;
}
