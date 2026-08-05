import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Crosshair,
  Package,
  Plus,
  Search,
  Printer,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Wrench,
  Layers,
  FileText,
  RotateCcw,
  BarChart3,
  Calendar,
  Users,
  Settings,
  ArrowDownRight,
  ArrowUpRight,
  ShieldAlert,
  Flame,
  Key,
  Database,
  Filter,
  FileSpreadsheet,
  Pencil,
  Trash2,
  Edit3,
  Save,
  X,
  Check,
  Scan
} from 'lucide-react';
import { FaceVerificationModal, FaceVerificationResult } from './FaceVerificationModal';
import { ExcelImportModal } from './ExcelImportModal';
import { TargetPersonnelSearchSelect } from './TargetPersonnelSearchSelect';
import { ArmamentReportPrintModal, ArmamentReportType } from './ArmamentReportPrintModal';
import { PersonnelRecord, DepartmentRole, MilitaryRank } from '../types';
import {
  ArmoryInventoryItem,
  ArmoryWeaponPiece,
  ArmoryIntakeRecord,
  ArmoryIssueOrder,
  WeaponLifecycleEvent,
  WeaponTypeConfig,
  AmmoTypeConfig
} from '../data/armamentData';
import { StorageService } from '../lib/storage';

// List of the 12 specific weapons requested by command
export const TARGET_SPECIFIED_WEAPONS = [
  { name: 'كلاش صيني', icon: '🔫', defaultCaliber: '7.62×39mm', category: 'بنادق هجومية', defaultMagazines: 6, defaultAmmo: 180 },
  { name: 'قناصة دراغانوف', icon: '🎯', defaultCaliber: '7.62×54mmR', category: 'بنادق قنص', defaultMagazines: 4, defaultAmmo: 100 },
  { name: 'قناصة عيار 50', icon: '💥', defaultCaliber: '12.7×99mm (.50 BMG)', category: 'بنادق قنص ثقيلة', defaultMagazines: 3, defaultAmmo: 60 },
  { name: 'عيار 23', icon: '🛡️', defaultCaliber: '23×152mm', category: 'أسلحة ثقيلة ومضاد طائرات', defaultMagazines: 2, defaultAmmo: 500 },
  { name: 'عيار 14', icon: '⚡', defaultCaliber: '14.5×114mm', category: 'رشاشات ثقيلة', defaultMagazines: 2, defaultAmmo: 400 },
  { name: 'عيار 12', icon: '⚔️', defaultCaliber: '12.7×108mm', category: 'رشاشات ثقيلة', defaultMagazines: 2, defaultAmmo: 300 },
  { name: 'معدل شيكي', icon: '🔥', defaultCaliber: '7.62×54mmR', category: 'رشاشات متوسطة', defaultMagazines: 2, defaultAmmo: 250 },
  { name: 'مدفع 106', icon: '💣', defaultCaliber: '106mm HEAT', category: 'مدفعية عديمة الارتداد', defaultMagazines: 0, defaultAmmo: 20 },
  { name: 'راجمة صواريخ', icon: '🚀', defaultCaliber: '107mm Rocket', category: 'مدفعية صواريخ', defaultMagazines: 0, defaultAmmo: 12 },
  { name: 'هاون 120', icon: '⛰️', defaultCaliber: '120mm Mortar', category: 'سلاح المدفعية والهاونات', defaultMagazines: 0, defaultAmmo: 30 },
  { name: 'هاون 80', icon: '🎯', defaultCaliber: '80mm Mortar', category: 'سلاح المدفعية والهاونات', defaultMagazines: 0, defaultAmmo: 40 },
  { name: 'هاون 60', icon: '🗡️', defaultCaliber: '60mm Mortar', category: 'سلاح المدفعية والهاونات', defaultMagazines: 0, defaultAmmo: 50 },
];

export interface TurnInSlipRecord {
  id: string;
  receiptNumber: string;
  date: string;
  personnelName: string;
  personnelMilitaryId: string;
  personnelRank: string;
  unit: string;
  weaponType: string;
  weaponSerial: string;
  weaponCondition: string;
  ammoQty: number;
  magazinesCount: number;
  vest: boolean;
  helmet: boolean;
  personnelStatus: string;
  notes: string;
  receivingOfficer: string;
}

interface ArmamentBranchWorkspaceProps {
  currentRole: DepartmentRole;
  personnel: PersonnelRecord[];
  onRefresh: () => void;
  onSelectPersonnel: (militaryId: string) => void;
  currentAccountName?: string;
}

export const ArmamentBranchWorkspace: React.FC<ArmamentBranchWorkspaceProps> = ({
  currentRole,
  personnel,
  onRefresh,
  onSelectPersonnel,
  currentAccountName = 'لواء القيادة'
}) => {
  // Active inner tab
  const [activeTab, setActiveTab] = useState<
    | 'readiness'
    | 'turnin'
    | 'search'
    | 'editPersonnelArmament'
    | 'inventory'
    | 'dispense'
    | 'ammoDispense'
    | 'issueLogs'
    | 'lifecycle'
    | 'config'
    | 'reports'
    | 'analytics'
  >('readiness');

  // Dedicated Form States for Ammo Dispense ("صرف ذخيرة")
  const [ammoDispenseItemId, setAmmoDispenseItemId] = useState<string>('');
  const [ammoDispenseQty, setAmmoDispenseQty] = useState<number>(180);
  const [ammoDispenseReason, setAmmoDispenseReason] = useState<string>('مهمة قتالية وتأمين القطاع');
  const [ammoDispenseIssuingAuthority, setAmmoDispenseIssuingAuthority] = useState<string>('رئيس فرع التسليح والعمليات');
  const [ammoDispensePersonnelId, setAmmoDispensePersonnelId] = useState<string>('');
  const [ammoDispenseNotes, setAmmoDispenseNotes] = useState<string>('');
  const [editingThresholdItemId, setEditingThresholdItemId] = useState<string | null>(null);
  const [editingThresholdVal, setEditingThresholdVal] = useState<number>(0);

  // Module state
  const [inventory, setInventory] = useState<ArmoryInventoryItem[]>([]);
  const [weapons, setWeapons] = useState<ArmoryWeaponPiece[]>([]);
  const [intakes, setIntakes] = useState<ArmoryIntakeRecord[]>([]);
  const [issues, setIssues] = useState<ArmoryIssueOrder[]>([]);
  const [lifecycle, setLifecycle] = useState<WeaponLifecycleEvent[]>([]);
  const [weaponTypes, setWeaponTypes] = useState<WeaponTypeConfig[]>([]);
  const [ammoTypes, setAmmoTypes] = useState<AmmoTypeConfig[]>([]);

  // Turn-in Equipment Tab Form States
  const [turninPersonnelId, setTurninPersonnelId] = useState('');
  const [turninWeaponType, setTurninWeaponType] = useState('كلاش صيني');
  const [turninWeaponSerial, setTurninWeaponSerial] = useState('');
  const [turninWeaponCondition, setTurninWeaponCondition] = useState<'ممتازة' | 'جيدة' | 'تحتاج صيانة' | 'معطوبة'>('ممتازة');
  const [turninAmmoQty, setTurninAmmoQty] = useState<number>(180);
  const [turninMagazinesCount, setTurninMagazinesCount] = useState<number>(6);
  const [turninVest, setTurninVest] = useState(true);
  const [turninHelmet, setTurninHelmet] = useState(true);
  const [turninPersonnelStatus, setTurninPersonnelStatus] = useState<'متواجد' | 'فرار بالسلاح' | 'في الميدان' | 'إجازة' | 'غياب'>('متواجد');
  const [turninNotes, setTurninNotes] = useState('استعادة قطعة السلاح واكتمال فحص العهدة بحالة ممتازة');
  const [turninReceivingOfficer, setTurninReceivingOfficer] = useState('النقيب / ضابط التسليح والمخزن');
  const [showTurnInSlipModal, setShowTurnInSlipModal] = useState<TurnInSlipRecord | null>(null);

  // Edit Personnel Armament Form States
  const [editPersonnelId, setEditPersonnelId] = useState('');
  const [editWeaponType, setEditWeaponType] = useState('كلاش صيني');
  const [editWeaponSerial, setEditWeaponSerial] = useState('');
  const [editCondition, setEditCondition] = useState<'ممتازة' | 'جيدة' | 'تحتاج صيانة' | 'معطوبة'>('ممتازة');
  const [editAmmoQty, setEditAmmoQty] = useState<number>(180);
  const [editMagazinesCount, setEditMagazinesCount] = useState<number>(6);
  const [editVest, setEditVest] = useState(true);
  const [editHelmet, setEditHelmet] = useState(true);
  const [editPersonnelStatus, setEditPersonnelStatus] = useState<'متواجد' | 'فرار بالسلاح' | 'في الميدان' | 'إجازة' | 'غياب'>('متواجد');
  const [editNotes, setEditNotes] = useState('');
  const [showEditPersonnelModal, setShowEditPersonnelModal] = useState(false);

  // Weapon Search Tab States
  const [weaponSearchTerm, setWeaponSearchTerm] = useState('');

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUnitFilter, setSelectedUnitFilter] = useState('الكل');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('الكل');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal / Form Dialog States
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [showAddIntakeModal, setShowAddIntakeModal] = useState(false);
  const [showAddWeaponModal, setShowAddWeaponModal] = useState(false);
  const [showAddTypeModal, setShowAddTypeModal] = useState(false);
  const [showAddAmmoTypeModal, setShowAddAmmoTypeModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState<ArmoryIssueOrder | null>(null);
  const [showPrintSlipModal, setShowPrintSlipModal] = useState<ArmoryIssueOrder | null>(null);
  const [showPrintArmamentReportModal, setShowPrintArmamentReportModal] = useState(false);
  const [printReportModalType, setPrintReportModalType] = useState<ArmamentReportType>('stock');
  const [selectedLifecycleSerial, setSelectedLifecycleSerial] = useState<string>('');

  // Edit & Delete States for Armory
  const [editingWeaponPiece, setEditingWeaponPiece] = useState<ArmoryWeaponPiece | null>(null);
  const [deletingWeaponPiece, setDeletingWeaponPiece] = useState<ArmoryWeaponPiece | null>(null);
  const [editingInventoryItem, setEditingInventoryItem] = useState<ArmoryInventoryItem | null>(null);
  const [deletingInventoryItem, setDeletingInventoryItem] = useState<ArmoryInventoryItem | null>(null);

  // Form inputs for Intake Registration
  const [intakeItemType, setIntakeItemType] = useState<'weapon' | 'ammo'>('weapon');
  const [intakeName, setIntakeName] = useState('بندقية هجومية M4A1');
  const [intakeCaliber, setIntakeCaliber] = useState('5.56×45mm NATO');
  const [intakeQty, setIntakeQty] = useState<number>(50);
  const [intakeSource, setIntakeSource] = useState('الهيئة العامة للتسليح - المجمع الفني');
  const [intakeBatch, setIntakeBatch] = useState(`BATCH-${new Date().getFullYear()}-01`);
  const [intakeReceiver, setIntakeReceiver] = useState('ضابط التسليح والذخيرة');
  const [intakeExpiryDate, setIntakeExpiryDate] = useState('');
  const [intakeNotes, setIntakeNotes] = useState('');

  // Form inputs for Individual Weapon Piece Registration
  const [pieceSerial, setPieceSerial] = useState('');
  const [pieceWeaponType, setPieceWeaponType] = useState('بندقية هجومية M4A1');
  const [pieceCaliber, setPieceCaliber] = useState('5.56×45mm NATO');
  const [pieceYear, setPieceYear] = useState('2024');
  const [pieceCondition, setPieceCondition] = useState<'جاهز' | 'تحتاج صيانة' | 'غير جاهز' | 'معطوبة'>('جاهز');
  const [pieceLocation, setPieceLocation] = useState('مخزن التسليح الرئيسي - الجناح A');

  // Form inputs for Weapon Dispense / Issue
  const [issueRecipientMilitaryId, setIssueRecipientMilitaryId] = useState('');
  const [issueWeaponType, setIssueWeaponType] = useState('بندقية هجومية M4A1');
  const [issueWeaponSerial, setIssueWeaponSerial] = useState('');
  const [issueAmmoType, setIssueAmmoType] = useState('ذخيرة حية 5.56mm NATO');
  const [issueAmmoCaliber, setIssueAmmoCaliber] = useState('5.56×45mm NATO');
  const [issueAmmoQty, setIssueAmmoQty] = useState<number>(180);
  const [issueReason, setIssueReason] = useState('تسليح رسمي لمهمة قتالية وحراسة القطاع');
  const [issueOrderRef, setIssueOrderRef] = useState(`أمر تسليح ${Math.floor(100 + Math.random() * 900)}/ت`);
  const [issueResponsibleOfficer, setIssueResponsibleOfficer] = useState('النقيب / ضابط التسليح والذخائر');
  const [issueNotes, setIssueNotes] = useState('');

  // Form inputs for Weapon Return
  const [returnNotes, setReturnNotes] = useState('تسليم السلاح والذخيرة بحالة ممتازة واكتمال الفحص');

  // Face Verification State for Armament
  const [showFaceVerification, setShowFaceVerification] = useState(false);
  const [faceVerificationTitle, setFaceVerificationTitle] = useState('اعتماد تسليم وتسلح بمسح الوجه المباشر');
  const [faceTargetPersonnel, setFaceTargetPersonnel] = useState<PersonnelRecord | null>(null);

  const handleOpenFaceScanForArmament = (person: PersonnelRecord | null, title: string) => {
    setFaceVerificationTitle(title);
    setFaceTargetPersonnel(person);
    setShowFaceVerification(true);
  };

  const handleArmamentFaceVerified = (result: FaceVerificationResult) => {
    showNotice(`📸 تم التوقيع والاعتماد الرقمي بمسح الوجه لـ (${result.verifiedPerson?.fullName || faceTargetPersonnel?.fullName || 'الفرد'}) بنسبة مطابقة ${result.matchScore}% بنجاح!`);
  };

  // Form inputs for Configs (Add Weapon Type / Ammo Type)
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeCat, setNewTypeCat] = useState('بنادق/أسلحة');
  const [newTypeCaliber, setNewTypeCaliber] = useState('5.56×45mm NATO');
  const [newTypeDesc, setNewTypeDesc] = useState('');

  const [newAmmoName, setNewAmmoName] = useState('');
  const [newAmmoCaliber, setNewAmmoCaliber] = useState('5.56×45mm NATO');
  const [newAmmoCat, setNewAmmoCat] = useState('ذخائر خفيفة');

  // Load all armory data
  const loadArmoryData = () => {
    setInventory(StorageService.getArmoryInventory());
    setWeapons(StorageService.getArmoryWeapons());
    setIntakes(StorageService.getArmoryIntakes());
    setIssues(StorageService.getArmoryIssues());
    setLifecycle(StorageService.getWeaponLifecycle());
    setWeaponTypes(StorageService.getWeaponTypesConfig());
    setAmmoTypes(StorageService.getAmmoTypesConfig());
  };

  useEffect(() => {
    loadArmoryData();
  }, []);

  useEffect(() => {
    if (inventory.length > 0 && !ammoDispenseItemId) {
      const firstAmmo = inventory.find((i) => i.itemType === 'ammo');
      if (firstAmmo) {
        setAmmoDispenseItemId(firstAmmo.id);
      }
    }
  }, [inventory, ammoDispenseItemId]);

  const showNotice = (msg: string, type: 'success' | 'error' = 'success') => {
    setNotification({ type, message: msg });
    setTimeout(() => setNotification(null), 4500);
  };

  // Clear Default Sample 12 Weapons
  const handleClearSampleWeapons = () => {
    if (
      !window.confirm(
        'هل أنت متأكد من رغبتك في مسح وحذف بيانات الأسلحة الافتراضية العينة؟ ستتمكن من إضافة أسلحتك الحقيقية الخاصة والتعديل عليها بالكامل.'
      )
    ) {
      return;
    }

    const updatedInventory = inventory.filter(
      (item) => !TARGET_SPECIFIED_WEAPONS.some((tw) => item.name.includes(tw.name) || tw.name.includes(item.name))
    );
    const updatedWeapons = weapons.filter(
      (w) => !TARGET_SPECIFIED_WEAPONS.some((tw) => w.weaponType.includes(tw.name) || tw.name.includes(w.weaponType))
    );

    setInventory(updatedInventory);
    setWeapons(updatedWeapons);
    StorageService.saveArmoryInventory(updatedInventory);
    StorageService.saveArmoryWeapons(updatedWeapons);

    StorageService.logAction(
      currentAccountName,
      'إدارة التسليح',
      'حذف الأسلحة الافتراضية 12',
      'حذف عينة',
      'الربط المباشر',
      'تم مسح الأسلحة الافتراضية لإتاحة إضافة بيانات تسليح حقيقية من قبل الضابط'
    );

    showNotice('تم حذف بيانات الأسلحة الافتراضية 12 بنجاح! يمكنك الآن إضافة بيانات تسليحك الحقيقية.');
    onRefresh();
  };

  // Dedicated Ammunition Dispense Handler ("صرف ذخيرة")
  const handleAmmoDispenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const selectedAmmoItem = inventory.find((i) => i.id === ammoDispenseItemId && i.itemType === 'ammo');
    if (!selectedAmmoItem) {
      showNotice('يرجى اختيار نوع الذخيرة المراد صرفها من القائمة', 'error');
      return;
    }

    if (ammoDispenseQty <= 0) {
      showNotice('يرجى إدخال كمية صحيحة أكبر من الصفر لصرف الذخيرة', 'error');
      return;
    }

    if (ammoDispenseQty > selectedAmmoItem.availableQty) {
      showNotice(
        `عذراً! الكمية المطلوبة (${ammoDispenseQty}) تتجاوز الرصيد المتاح حالياً بالمخزن (${selectedAmmoItem.availableQty})`,
        'error'
      );
      return;
    }

    const targetPersonnel = personnel.find((p) => p.militaryId === ammoDispensePersonnelId);
    if (!targetPersonnel) {
      showNotice('يرجى اختيار الفرد المستهدف بالصرف', 'error');
      return;
    }

    // 1. Deduct from inventory
    const newAvailableQty = selectedAmmoItem.availableQty - ammoDispenseQty;
    const newIssuedQty = selectedAmmoItem.issuedQty + ammoDispenseQty;

    const updatedInventory = inventory.map((item) => {
      if (item.id === selectedAmmoItem.id) {
        return {
          ...item,
          availableQty: newAvailableQty,
          issuedQty: newIssuedQty,
          lastUpdated: new Date().toISOString().split('T')[0]
        };
      }
      return item;
    });

    setInventory(updatedInventory);
    StorageService.saveArmoryInventory(updatedInventory);

    // 2. Create Issue Order Record
    const newIssueOrder: ArmoryIssueOrder = {
      id: `issue-ammo-${Date.now()}`,
      orderNumber: `DISP-AMMO-${Math.floor(10000 + Math.random() * 90000)}`,
      date: new Date().toISOString().split('T')[0],
      recipientName: targetPersonnel.fullName,
      recipientMilitaryId: targetPersonnel.militaryId,
      recipientRank: targetPersonnel.rank,
      unit: targetPersonnel.unit,
      weaponType: 'صرف ذخيرة مستقلة',
      ammoType: selectedAmmoItem.name,
      ammoCaliber: selectedAmmoItem.caliber,
      issuedAmmoQty: ammoDispenseQty,
      issueReason: ammoDispenseReason,
      orderReference: ammoDispenseIssuingAuthority,
      responsibleOfficer: currentAccountName,
      status: 'نشط',
      notes: ammoDispenseNotes
    };

    const currentIssues = StorageService.getArmoryIssues();
    const updatedIssues = [newIssueOrder, ...currentIssues];
    setIssues(updatedIssues);
    StorageService.saveArmoryIssues(updatedIssues);

    // 3. Log into target personnel file
    const allPersonnel = StorageService.getPersonnel();
    const updatedPersonnelList = allPersonnel.map((p) => {
      if (p.militaryId === targetPersonnel.militaryId) {
        const currentLogs = p.logs?.armament || [];
        const ammoActLog = {
          id: `ammo-act-${Date.now()}`,
          type: 'صرف' as const,
          quantity: ammoDispenseQty,
          date: new Date().toISOString().split('T')[0],
          reason: `${ammoDispenseReason} • جهة الأمر: ${ammoDispenseIssuingAuthority}`,
          issuedBy: currentAccountName
        };

        const existingArmLog = currentLogs[0];
        let newArmLog;
        if (existingArmLog) {
          newArmLog = {
            ...existingArmLog,
            ammoQty: (existingArmLog.ammoQty || 0) + ammoDispenseQty,
            ammoHistory: [ammoActLog, ...(existingArmLog.ammoHistory || [])]
          };
        } else {
          newArmLog = {
            id: `arm-${Date.now()}`,
            weaponSerial: 'ذخيرة فقط',
            weaponType: 'صرف ذخيرة',
            issueDate: new Date().toISOString().split('T')[0],
            ammoQty: ammoDispenseQty,
            firelinesCount: 0,
            ammoHistory: [ammoActLog],
            condition: 'ممتازة' as const,
            technicalNotes: `صرف ذخيرة مستقلة: ${selectedAmmoItem.name}`
          };
        }

        return {
          ...p,
          logs: {
            ...p.logs,
            armament: [newArmLog, ...currentLogs.filter((_, idx) => idx !== 0)]
          }
        };
      }
      return p;
    });

    StorageService.savePersonnel(updatedPersonnelList);

    // 4. System Action Log
    StorageService.logAction(
      currentAccountName,
      'إدارة التسليح',
      'صرف ذخيرة',
      targetPersonnel.militaryId,
      targetPersonnel.fullName,
      `تم صرف كمية (${ammoDispenseQty}) طلقة من (${selectedAmmoItem.name}) للفرد (${targetPersonnel.fullName}). جهة الأمر: ${ammoDispenseIssuingAuthority}`
    );

    // 5. Notify & Refresh
    showNotice(
      `تمت عملية صرف (${ammoDispenseQty}) طلقة من (${selectedAmmoItem.name}) للفرد (${targetPersonnel.fullName}) بنجاح! الكمية المتبقية بالمخزن الآن: (${newAvailableQty}) طلقة.`,
      newAvailableQty <= selectedAmmoItem.minThreshold ? 'error' : 'success'
    );

    onRefresh();
  };

  // Quick Danger Threshold Modifier
  const handleSaveMinThreshold = (itemId: string, newThresh: number) => {
    const updated = inventory.map((inv) => {
      if (inv.id === itemId) {
        return { ...inv, minThreshold: newThresh, lastUpdated: new Date().toISOString().split('T')[0] };
      }
      return inv;
    });
    setInventory(updated);
    StorageService.saveArmoryInventory(updated);
    setEditingThresholdItemId(null);
    showNotice(`تم تحديث سقف الخطر للصنف بنجاح إلى (${newThresh}) طلقة/قذيفة`);
    onRefresh();
  };

  // Quick Technical Condition Changer
  const handleQuickConditionChange = (weaponId: string, newCondition: 'جاهز' | 'تحتاج صيانة' | 'غير جاهز' | 'معطوبة') => {
    const updated = weapons.map((w) => {
      if (w.id === weaponId) {
        return { ...w, technicalCondition: newCondition };
      }
      return w;
    });
    setWeapons(updated);
    StorageService.saveArmoryWeapons(updated);

    const target = weapons.find((w) => w.id === weaponId);
    if (target) {
      StorageService.logAction(
        currentAccountName,
        'إدارة التسليح',
        'تحديث جاهزية سلاح',
        target.serialNumber,
        target.weaponType,
        `تم تعديل الجاهزية الفنية للسلاح رقم (${target.serialNumber}) إلى: ${newCondition}`
      );
    }
    showNotice(`تم تحديث جاهزية السلاح إلى: (${newCondition}) بنجاح.`);
    onRefresh();
  };

  // Save Weapon Piece Edit
  const handleSaveWeaponPiece = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWeaponPiece) return;

    const updated = weapons.map((w) => (w.id === editingWeaponPiece.id ? editingWeaponPiece : w));
    setWeapons(updated);
    StorageService.saveArmoryWeapons(updated);

    // Record lifecycle event
    const newEvent: WeaponLifecycleEvent = {
      id: `life-${Date.now()}`,
      weaponSerial: editingWeaponPiece.serialNumber,
      weaponType: editingWeaponPiece.weaponType,
      eventType: 'صيانة وفحص',
      date: new Date().toISOString().split('T')[0],
      actor: currentAccountName,
      recipientOrUnit: editingWeaponPiece.storageLocation,
      details: `تحديث بيانات السلاح: الجاهزية الفنية (${editingWeaponPiece.technicalCondition}) • الحالة التشغيلية (${editingWeaponPiece.status})`
    };
    const currentLife = StorageService.getWeaponLifecycle();
    StorageService.saveWeaponLifecycle([newEvent, ...currentLife]);
    setLifecycle([newEvent, ...currentLife]);

    StorageService.logAction(
      currentAccountName,
      'إدارة التسليح',
      'تعديل بيانات وجاهزية سلاح',
      editingWeaponPiece.serialNumber,
      editingWeaponPiece.weaponType,
      `تم تحديث بيانات وجاهزية قطعة السلاح ذو الرقم التسلسلي (${editingWeaponPiece.serialNumber}) بنجاح.`
    );

    setEditingWeaponPiece(null);
    showNotice(`تم حفظ تعديل بيانات وجاهزية السلاح (${editingWeaponPiece.serialNumber}) بنجاح.`);
    onRefresh();
  };

  // Delete Weapon Piece
  const handleDeleteWeaponPiece = () => {
    if (!deletingWeaponPiece) return;

    const updated = weapons.filter((w) => w.id !== deletingWeaponPiece.id);
    setWeapons(updated);
    StorageService.saveArmoryWeapons(updated);

    StorageService.logAction(
      currentAccountName,
      'إدارة التسليح',
      'حذف قطعة سلاح',
      deletingWeaponPiece.serialNumber,
      deletingWeaponPiece.weaponType,
      `تم حذف بيانات قطعة السلاح ذو الرقم التسلسلي (${deletingWeaponPiece.serialNumber}) نهائياً من قاعدة البيانات.`
    );

    setDeletingWeaponPiece(null);
    showNotice(`تم حذف قطعة السلاح رقم (${deletingWeaponPiece.serialNumber}) بنجاح.`);
    onRefresh();
  };

  // Save Inventory Item Edit
  const handleSaveInventoryItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInventoryItem) return;

    const updated = inventory.map((inv) =>
      inv.id === editingInventoryItem.id
        ? { ...editingInventoryItem, lastUpdated: new Date().toISOString().split('T')[0] }
        : inv
    );
    setInventory(updated);
    StorageService.saveArmoryInventory(updated);

    StorageService.logAction(
      currentAccountName,
      'إدارة التسليح',
      'تعديل صنف المخزون المركزي',
      editingInventoryItem.id,
      editingInventoryItem.name,
      `تم تعديل بيانات صنف المخزون (${editingInventoryItem.name})، الرصيد المتاح: ${editingInventoryItem.availableQty}.`
    );

    setEditingInventoryItem(null);
    showNotice(`تم حفظ تعديل صنف المخزون (${editingInventoryItem.name}) بنجاح.`);
    onRefresh();
  };

  // Delete Inventory Item
  const handleDeleteInventoryItem = () => {
    if (!deletingInventoryItem) return;

    const updated = inventory.filter((inv) => inv.id !== deletingInventoryItem.id);
    setInventory(updated);
    StorageService.saveArmoryInventory(updated);

    StorageService.logAction(
      currentAccountName,
      'إدارة التسليح',
      'حذف صنف من المخزون',
      deletingInventoryItem.id,
      deletingInventoryItem.name,
      `تم حذف صنف المخزون (${deletingInventoryItem.name}) نهائياً من سجلات المخزون.`
    );

    setDeletingInventoryItem(null);
    showNotice(`تم حذف صنف المخزون (${deletingInventoryItem.name}) بنجاح.`);
    onRefresh();
  };

  // Selected soldier object
  const selectedRecipient = useMemo(() => {
    return personnel.find((p) => p.militaryId === issueRecipientMilitaryId) || personnel[0];
  }, [personnel, issueRecipientMilitaryId]);

  // Set default recipient on load
  useEffect(() => {
    if (personnel.length > 0 && !issueRecipientMilitaryId) {
      setIssueRecipientMilitaryId(personnel[0].militaryId);
    }
  }, [personnel]);

  // Dynamic metrics calculations
  const totalWeaponsCount = useMemo(() => {
    return weapons.length || inventory.filter((i) => i.itemType === 'weapon').reduce((acc, i) => acc + i.totalReceived, 0);
  }, [weapons, inventory]);

  const readyWeaponsCount = useMemo(() => {
    const readyFromPieces = weapons.filter((w) => w.technicalCondition === 'جاهز').length;
    if (weapons.length > 0) return readyFromPieces;
    return inventory.filter((i) => i.itemType === 'weapon').reduce((acc, i) => acc + i.availableQty, 0);
  }, [weapons, inventory]);

  const maintenanceWeaponsCount = useMemo(() => {
    return weapons.filter((w) => w.technicalCondition === 'تحتاج صيانة' || w.status === 'في الصيانة').length;
  }, [weapons]);

  const nonReadyWeaponsCount = useMemo(() => {
    return weapons.filter((w) => w.technicalCondition === 'غير جاهز' || w.technicalCondition === 'معطوبة').length;
  }, [weapons]);

  const totalAvailableAmmo = useMemo(() => {
    return inventory.filter((i) => i.itemType === 'ammo').reduce((acc, i) => acc + i.availableQty, 0);
  }, [inventory]);

  const totalIssuedAmmo = useMemo(() => {
    return inventory.filter((i) => i.itemType === 'ammo').reduce((acc, i) => acc + i.issuedQty, 0);
  }, [inventory]);

  const armedPersonnelCount = useMemo(() => {
    return personnel.filter((p) => p.logs && p.logs.armament && p.logs.armament.length > 0).length;
  }, [personnel]);

  const unarmedPersonnelCount = Math.max(0, personnel.length - armedPersonnelCount);

  // Armament Readiness Rate Percentage
  const combatReadinessPercentage = useMemo(() => {
    if (personnel.length === 0) return 100;
    const readyRate = Math.round((armedPersonnelCount / personnel.length) * 100);
    return Math.min(100, Math.max(0, readyRate));
  }, [armedPersonnelCount, personnel.length]);

  // Low stock inventory alert list
  const lowStockAlertItems = useMemo(() => {
    return inventory.filter((inv) => inv.availableQty <= inv.minThreshold);
  }, [inventory]);

  // Maintenance alert list
  const maintenanceNeededWeapons = useMemo(() => {
    return weapons.filter((w) => w.technicalCondition === 'تحتاج صيانة' || w.status === 'في الصيانة');
  }, [weapons]);

  // Expiring ammo alert list
  const expiringAmmoItems = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return inventory.filter((inv) => inv.itemType === 'ammo' && inv.expiryDate && inv.expiryDate <= '2028-12-31');
  }, [inventory]);

  // Handle Intake Registration
  const handleIntakeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    StorageService.processArmoryIntake(
      {
        itemType: intakeItemType,
        name: intakeName,
        caliber: intakeCaliber,
        quantity: intakeQty,
        source: intakeSource,
        batchNumber: intakeBatch,
        receivedBy: intakeReceiver,
        expiryDate: intakeItemType === 'ammo' ? intakeExpiryDate : undefined,
        notes: intakeNotes
      },
      'ضابط التسليح والذخيرة',
      currentRole
    );

    loadArmoryData();
    onRefresh();
    setShowAddIntakeModal(false);
    showNotice(`تم تسجيل الوارد بنجاح لـ (${intakeName}) بكمية ${intakeQty} وإضافتها للمخزون`);
    setIntakeNotes('');
  };

  // Handle Individual Weapon Piece Registration
  const handleWeaponPieceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pieceSerial) {
      showNotice('يرجى إدخال الرقم التسلسلي للسلاح', 'error');
      return;
    }

    const currentWeapons = StorageService.getArmoryWeapons();
    if (currentWeapons.some((w) => w.serialNumber.trim().toLowerCase() === pieceSerial.trim().toLowerCase())) {
      showNotice(`عذراً! الرقم التسلسلي (${pieceSerial}) مسجل مسبقاً للسلاح بالمخزن`, 'error');
      return;
    }

    const newPiece: ArmoryWeaponPiece = {
      id: `wp-${Date.now()}`,
      serialNumber: pieceSerial.trim(),
      weaponType: pieceWeaponType,
      caliber: pieceCaliber,
      manufactureYear: pieceYear,
      technicalCondition: pieceCondition,
      status: 'في المخزن',
      storageLocation: pieceLocation,
      entryDate: new Date().toISOString().split('T')[0]
    };

    const updated = [newPiece, ...currentWeapons];
    StorageService.saveArmoryWeapons(updated);

    // Record lifecycle event
    const lifecycleList = StorageService.getWeaponLifecycle();
    lifecycleList.unshift({
      id: `lc-${Date.now()}`,
      weaponSerial: pieceSerial.trim(),
      weaponType: pieceWeaponType,
      eventType: 'استلام بالمخزن',
      date: new Date().toISOString().split('T')[0],
      actor: 'ضابط التسليح',
      recipientOrUnit: 'مخزن التسليح الرئيسي',
      details: `تسجيل سلاح جديد برقم تسلسلي فريد وسنة صنع ${pieceYear} ومكان التخزين (${pieceLocation})`
    });
    StorageService.saveWeaponLifecycle(lifecycleList);

    loadArmoryData();
    setShowAddWeaponModal(false);
    showNotice(`تم إضافة قطعة السلاح بالرقم التسلسلي (${pieceSerial}) لسجل التسليح`);
    setPieceSerial('');
  };

  // Handle Weapon & Ammo Dispense / Issue
  const handleIssueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecipient) {
      showNotice('يرجى اختيار الفرد المستلم لسلاح والذخيرة', 'error');
      return;
    }

    const res = StorageService.processArmoryIssue(
      {
        recipientName: selectedRecipient.fullName,
        recipientMilitaryId: selectedRecipient.militaryId,
        recipientRank: selectedRecipient.rank,
        unit: selectedRecipient.unit,
        weaponType: issueWeaponType,
        weaponSerial: issueWeaponSerial ? issueWeaponSerial.trim() : undefined,
        ammoType: issueAmmoType,
        ammoCaliber: issueAmmoCaliber,
        issuedAmmoQty: issueAmmoQty,
        issueReason,
        orderReference: issueOrderRef,
        responsibleOfficer: issueResponsibleOfficer,
        notes: issueNotes
      },
      'ضابط التسليح',
      currentRole
    );

    if (!res.success) {
      showNotice(res.message, 'error');
      return;
    }

    loadArmoryData();
    onRefresh();
    showNotice(res.message, 'success');
    if (res.order) {
      setShowPrintSlipModal(res.order);
    }
  };

  // Handle Weapon Return
  const handleReturnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showReturnModal) return;

    const res = StorageService.processArmoryReturn(showReturnModal.id, returnNotes, 'ضابط التسليح', currentRole);
    if (!res.success) {
      showNotice(res.message, 'error');
      return;
    }

    loadArmoryData();
    onRefresh();
    setShowReturnModal(null);
    showNotice(res.message, 'success');
  };

  // Handle Dedicated Equipment Turn-In (توريد عهدة واستعادة قطعة سلاح)
  const handleTurnInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!turninPersonnelId) {
      showNotice('يرجى اختيار الفرد المورد للعهدة', 'error');
      return;
    }

    const targetPersonnel = personnel.find((p) => p.militaryId === turninPersonnelId);
    if (!targetPersonnel) {
      showNotice('لم يتم العثور على بيانات الفرد المحفوظة', 'error');
      return;
    }

    const newReceiptNumber = `TRN-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);

    const slipRecord: TurnInSlipRecord = {
      id: `turnin-${Date.now()}`,
      receiptNumber: newReceiptNumber,
      date: nowStr,
      personnelName: targetPersonnel.fullName,
      personnelMilitaryId: targetPersonnel.militaryId,
      personnelRank: targetPersonnel.rank,
      unit: targetPersonnel.unit,
      weaponType: turninWeaponType,
      weaponSerial: turninWeaponSerial.trim(),
      weaponCondition: turninWeaponCondition,
      ammoQty: turninAmmoQty,
      magazinesCount: turninMagazinesCount,
      vest: turninVest,
      helmet: turninHelmet,
      personnelStatus: turninPersonnelStatus,
      notes: turninNotes,
      receivingOfficer: turninReceivingOfficer
    };

    // 1. Update Personnel File & Logs (ويبقى رقم السلاح مقيد باسم الفرد بملفه)
    const allPersonnel = StorageService.getPersonnel();
    const updatedPersonnelList = allPersonnel.map((p) => {
      if (p.militaryId === turninPersonnelId) {
        const updatedStatus = turninPersonnelStatus === 'فرار بالسلاح' ? 'فرار' : turninPersonnelStatus;
        const currentLogs = p.logs?.armament || [];

        const newArmLog = {
          id: `arm-${Date.now()}`,
          weaponSerial: turninWeaponSerial.trim() || 'غير مدون',
          weaponType: turninWeaponType,
          issueDate: currentLogs[0]?.issueDate || nowStr.split(' ')[0],
          returnDate: nowStr.split(' ')[0],
          ammoQty: turninAmmoQty,
          firelinesCount: turninMagazinesCount,
          ammoHistory: [
            ...(currentLogs[0]?.ammoHistory || []),
            {
              id: `ammo-act-${Date.now()}`,
              type: 'استرجاع' as const,
              quantity: turninAmmoQty,
              date: nowStr.split(' ')[0],
              reason: `توريد عهدة رسمية - سند رقم ${newReceiptNumber}`,
              issuedBy: turninReceivingOfficer
            }
          ],
          condition: turninWeaponCondition,
          technicalNotes: `توريد عهدة واستعادة قطعة سلاح • خوذة: ${turninHelmet ? 'نعم' : 'لا'} • جعبة: ${turninVest ? 'نعم' : 'لا'} • مخازن: ${turninMagazinesCount} • ملاحظات: ${turninNotes}`
        };

        return {
          ...p,
          currentStatus: updatedStatus as any,
          logs: {
            ...p.logs,
            armament: [newArmLog, ...currentLogs]
          }
        };
      }
      return p;
    });

    StorageService.savePersonnel(updatedPersonnelList);

    // 2. Update weapon piece in Armory DB
    if (turninWeaponSerial.trim()) {
      const allWeapons = StorageService.getArmoryWeapons();
      const targetWeapon = allWeapons.find((w) => w.serialNumber.trim().toLowerCase() === turninWeaponSerial.trim().toLowerCase());
      if (targetWeapon) {
        const updatedWeapons = allWeapons.map((w) => {
          if (w.id === targetWeapon.id) {
            return {
              ...w,
              technicalCondition: turninWeaponCondition === 'معطوبة' ? 'معطوبة' as const : turninWeaponCondition === 'تحتاج صيانة' ? 'تحتاج صيانة' as const : 'جاهز' as const,
              status: turninWeaponCondition === 'تحتاج صيانة' || turninWeaponCondition === 'معطوبة' ? 'في الصيانة' as const : 'في المخزن' as const,
              currentHolderMilitaryId: undefined,
              currentHolderName: undefined,
              notes: `تم التوريد من الفرد ${targetPersonnel.fullName} - ${turninNotes}`
            };
          }
          return w;
        });
        StorageService.saveArmoryWeapons(updatedWeapons);
      }
    }

    // 3. Update Inventory Available Quantity
    const currentInventory = StorageService.getArmoryInventory();
    const updatedInventory = currentInventory.map((item) => {
      if (item.name.includes(turninWeaponType) || turninWeaponType.includes(item.name)) {
        return {
          ...item,
          availableQty: item.availableQty + 1,
          issuedQty: Math.max(0, item.issuedQty - 1)
        };
      }
      return item;
    });
    StorageService.saveArmoryInventory(updatedInventory);

    // 4. Record Lifecycle Event
    const lifecycleList = StorageService.getWeaponLifecycle();
    lifecycleList.unshift({
      id: `lc-${Date.now()}`,
      weaponSerial: turninWeaponSerial.trim() || 'غير مدون',
      weaponType: turninWeaponType,
      eventType: 'إرجاع للمخزن',
      date: nowStr.split(' ')[0],
      actor: turninReceivingOfficer,
      recipientOrUnit: `مستلم من الفرد: ${targetPersonnel.rank} / ${targetPersonnel.fullName}`,
      details: `استعادة قطعة السلاح بموجب سند التوريد (${newReceiptNumber}) • الحالة: ${turninWeaponCondition} • الذخيرة المستعادة: ${turninAmmoQty}`
    });
    StorageService.saveWeaponLifecycle(lifecycleList);

    // 5. Audit Log
    StorageService.logAction(
      currentAccountName,
      'إدارة التسليح',
      'توريد عهدة واستعادة سلاح',
      targetPersonnel.militaryId,
      targetPersonnel.fullName,
      `تم توريد عهدة السلاح (${turninWeaponType} - سيريال: ${turninWeaponSerial}) من الفرد (${targetPersonnel.fullName}). الحالة: ${turninPersonnelStatus}`
    );

    loadArmoryData();
    onRefresh();
    setShowTurnInSlipModal(slipRecord);
    showNotice(`تم توثيق توريد العهدة (${newReceiptNumber}) واستعادة السلاح بنجاح وتقييده بملف الفرد`);
  };

  // Handle Edit Personnel Armament Details (تعديل معلومات تسليح أي فرد وتقييدها بملفه)
  const handleSaveEditPersonnelArmament = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPersonnelId) {
      showNotice('يرجى اختيار الفرد المراد تعديل بيانات تسليحه', 'error');
      return;
    }

    const allPersonnel = StorageService.getPersonnel();
    const targetPersonnel = allPersonnel.find((p) => p.militaryId === editPersonnelId);
    if (!targetPersonnel) {
      showNotice('لم يتم العثور على بيانات الفرد', 'error');
      return;
    }

    const updatedStatus = editPersonnelStatus === 'فرار بالسلاح' ? 'فرار' : editPersonnelStatus;

    const newLog = {
      id: `arm-${Date.now()}`,
      weaponSerial: editWeaponSerial.trim() || 'غير مدون',
      weaponType: editWeaponType,
      issueDate: targetPersonnel.logs?.armament?.[0]?.issueDate || new Date().toISOString().split('T')[0],
      ammoQty: editAmmoQty,
      firelinesCount: editMagazinesCount,
      ammoHistory: targetPersonnel.logs?.armament?.[0]?.ammoHistory || [],
      condition: editCondition,
      technicalNotes: `تعديل مباشر لعهدة الفرد • حالة الفرد: ${editPersonnelStatus} • خوذة: ${editHelmet ? 'نعم' : 'لا'} • جعبة: ${editVest ? 'نعم' : 'لا'} • مخازن: ${editMagazinesCount} • ملاحظات: ${editNotes}`
    };

    const updatedPersonnelList = allPersonnel.map((p) => {
      if (p.militaryId === editPersonnelId) {
        const currentLogs = p.logs?.armament || [];
        return {
          ...p,
          currentStatus: updatedStatus as any,
          logs: {
            ...p.logs,
            armament: [newLog, ...currentLogs]
          }
        };
      }
      return p;
    });

    StorageService.savePersonnel(updatedPersonnelList);

    StorageService.logAction(
      currentAccountName,
      'إدارة التسليح',
      'تعديل عهدة تسليح فرد',
      targetPersonnel.militaryId,
      targetPersonnel.fullName,
      `تم تعديل معلومات تسليح الفرد (${targetPersonnel.fullName})، الحالة: ${editPersonnelStatus}، الذخيرة: ${editAmmoQty}، السلاح: ${editWeaponType}`
    );

    loadArmoryData();
    onRefresh();
    setShowEditPersonnelModal(false);
    showNotice(`تم تعديل وتقييد معلومات التسليح بملف الفرد (${targetPersonnel.fullName}) بنجاح`);
  };

  // Handle Adding New Weapon Type
  const handleAddWeaponType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTypeName) return;

    const currentTypes = StorageService.getWeaponTypesConfig();
    const newConfig: WeaponTypeConfig = {
      id: `wt-${Date.now()}`,
      name: newTypeName,
      category: newTypeCat,
      defaultCaliber: newTypeCaliber,
      description: newTypeDesc || 'صنف مسلح جديد معتمد'
    };

    StorageService.saveWeaponTypesConfig([...currentTypes, newConfig]);
    loadArmoryData();
    setShowAddTypeModal(false);
    showNotice(`تم إضافة صنف السلاح (${newTypeName}) لقائمة الخيارات المعيارية`);
    setNewTypeName('');
  };

  // Handle Adding New Ammo Type
  const handleAddAmmoType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAmmoName) return;

    const currentAmmo = StorageService.getAmmoTypesConfig();
    const newConfig: AmmoTypeConfig = {
      id: `at-${Date.now()}`,
      name: newAmmoName,
      caliber: newAmmoCaliber,
      category: newAmmoCat,
      unitMeasurement: 'طلقة'
    };

    StorageService.saveAmmoTypesConfig([...currentAmmo, newConfig]);
    loadArmoryData();
    setShowAddAmmoTypeModal(false);
    showNotice(`تم إضافة صنف الذخيرة (${newAmmoName}) لقائمة العيارات`);
    setNewAmmoName('');
  };

  // Filtered Inventory List
  const filteredInventory = useMemo(() => {
    return inventory.filter((inv) => {
      const matchSearch =
        inv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.caliber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.storageLocation.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory =
        selectedCategoryFilter === 'الكل'
          ? true
          : selectedCategoryFilter === 'أسلحة'
          ? inv.itemType === 'weapon'
          : selectedCategoryFilter === 'ذخائر'
          ? inv.itemType === 'ammo'
          : selectedCategoryFilter === 'منخفض'
          ? inv.availableQty <= inv.minThreshold
          : true;
      return matchSearch && matchCategory;
    });
  }, [inventory, searchQuery, selectedCategoryFilter]);

  // Filtered Issues Log
  const filteredIssues = useMemo(() => {
    return issues.filter((iss) => {
      const matchSearch =
        iss.recipientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        iss.recipientMilitaryId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        iss.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        iss.unit.toLowerCase().includes(searchQuery.toLowerCase()) ||
        iss.weaponType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (iss.weaponSerial && iss.weaponSerial.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchUnit = selectedUnitFilter === 'الكل' || iss.unit.includes(selectedUnitFilter);
      return matchSearch && matchUnit;
    });
  }, [issues, searchQuery, selectedUnitFilter]);

  // Lifecycle logs for a selected weapon serial
  const selectedWeaponLifecycleEvents = useMemo(() => {
    if (!selectedLifecycleSerial) return lifecycle;
    return lifecycle.filter(
      (ev) => ev.weaponSerial.trim().toLowerCase() === selectedLifecycleSerial.trim().toLowerCase()
    );
  }, [lifecycle, selectedLifecycleSerial]);

  return (
    <div className="space-y-6 pb-12 font-['Cairo',sans-serif]">
      
      {/* Top Floating Alert Banner */}
      {notification && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between shadow-md transition-all ${
            notification.type === 'success'
              ? 'bg-emerald-900 border-emerald-700 text-emerald-100'
              : 'bg-rose-900 border-rose-700 text-rose-100'
          }`}
        >
          <div className="flex items-center space-x-3 space-x-reverse">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-400" />
            )}
            <span className="text-xs font-bold font-['Tajawal']">{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-xs font-bold px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20"
          >
            إغلاق
          </button>
        </div>
      )}

      {/* Armament Branch Header */}
      <div className="bg-slate-950 text-white border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 translate-x-[-20%] translate-y-[-20%] w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-700 flex items-center justify-center shadow-lg text-white font-bold">
              <Crosshair className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <h1 className="text-xl md:text-2xl font-black font-['Tajawal'] text-amber-400">
                  نظام فرع التسليح والذخائر والمخازن المركزية
                </h1>
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">
                  إدارة متكاملة ومباشرة
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                منظومة القوة النارية • خصم لحظي وتتبع الأرقام التسلسلية • سجل حركات وإصدار سندات الصرف
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab('ammoDispense')}
              className="bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white font-extrabold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-2 space-x-reverse shadow-lg transition-all cursor-pointer"
            >
              <Flame className="w-4 h-4 text-amber-200" />
              <span>🔥 صرف ذخيرة وسقف الخطر</span>
            </button>
            <button
              onClick={() => setActiveTab('turnin')}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-2 space-x-reverse shadow-lg transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-emerald-200" />
              <span>🔄 توريد عهدة وحفظ سند</span>
            </button>
            <button
              onClick={() => setActiveTab('dispense')}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-2 space-x-reverse shadow-lg transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إصدار أمر صرف جديد</span>
            </button>
            <button
              onClick={() => setShowAddIntakeModal(true)}
              className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-2 space-x-reverse border border-slate-700 transition-all cursor-pointer"
            >
              <ArrowDownRight className="w-4 h-4 text-emerald-400" />
              <span>تسجيل واردات للمخزن</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation Menu */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-wrap gap-2 text-xs">
          {[
            { id: 'readiness', label: '🛡️ لوحة جاهزية الأسلحة الـ12 والذخائر', count: lowStockAlertItems.length + maintenanceNeededWeapons.length },
            { id: 'ammoDispense', label: '🔥 صرف ذخيرة (تنبيه سقف الخطر)', count: null },
            { id: 'turnin', label: '🔄 توريد عهدة واستعادة سلاح', count: null },
            { id: 'search', label: '🔎 البحث والاستعلام عن السلاح', count: null },
            { id: 'editPersonnelArmament', label: '✏️ تعديل عهدة الفرد', count: null },
            { id: 'inventory', label: '📦 المخزون والواردات والقطع', count: inventory.length },
            { id: 'dispense', label: '🎯 صرف الأسلحة والذخائر', count: null },
            { id: 'issueLogs', label: '📜 سجل عمليات الصرف الدائم', count: issues.length },
            { id: 'lifecycle', label: '🔍 سيرة حركة السلاح', count: null },
            { id: 'config', label: '⚙️ إدارة الأنواع والعيارات', count: weaponTypes.length },
            { id: 'reports', label: '🪪 تقارير وطباعة التسليح', count: null },
            { id: 'analytics', label: '📊 التحليلات والإحصائيات', count: null }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center space-x-1.5 space-x-reverse ${
                activeTab === tab.id
                  ? 'bg-amber-500 text-slate-950 font-extrabold shadow-md'
                  : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== null && tab.count > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${
                    activeTab === tab.id ? 'bg-slate-950 text-amber-400' : 'bg-slate-800 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Dynamic Tab Body Content */}

      {/* TAB 1: READINESS DASHBOARD */}
      {activeTab === 'readiness' && (
        <div className="space-y-6">
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Total Weapons Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-bold">إجمالي الأسلحة بالمخزن</span>
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <Crosshair className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-slate-900 font-['Tajawal'] mt-2">
                {totalWeaponsCount.toLocaleString()} <span className="text-xs text-slate-500 font-normal">قطعة</span>
              </div>
              <div className="text-[11px] text-emerald-800 font-semibold mt-2 flex items-center space-x-1 space-x-reverse">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>جاهز للعمليات: {readyWeaponsCount} قطعة</span>
              </div>
            </div>

            {/* Total Ammo Available */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-bold">إجمالي الذخيرة المتوفرة</span>
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center">
                  <Flame className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-slate-900 font-['Tajawal'] mt-2">
                {totalAvailableAmmo.toLocaleString()} <span className="text-xs text-slate-500 font-normal">طلقة/قذيفة</span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium mt-2">
                المنصرف للميدان: {totalIssuedAmmo.toLocaleString()} طلقة
              </div>
            </div>

            {/* Armed Personnel Count */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-bold">الأفراد المسلحين</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-emerald-800 font-['Tajawal'] mt-2">
                {armedPersonnelCount} <span className="text-xs text-slate-500 font-normal">فرد مسلح</span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium mt-2">
                غير مستلمين للسلاح: {unarmedPersonnelCount} فرد
              </div>
            </div>

            {/* Combat Readiness Rate */}
            <div className="bg-gradient-to-tr from-slate-900 to-slate-800 text-white rounded-2xl p-4 shadow-sm border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-300 font-bold">نسبة جاهزية التسليح</span>
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-black font-['Tajawal'] text-amber-400 mt-2">
                %{combatReadinessPercentage}
              </div>
              <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden mt-3">
                <div
                  className="bg-amber-400 h-full transition-all duration-500"
                  style={{ width: `${combatReadinessPercentage}%` }}
                />
              </div>
            </div>

          </div>

          {/* Real-Time Alert Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Low Stock Alert */}
            <div className="bg-white border border-rose-200 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                <div className="flex items-center space-x-2 space-x-reverse text-rose-800">
                  <AlertTriangle className="w-4 h-4" />
                  <h3 className="text-xs font-bold font-['Tajawal']">أصناف أوشكت على النفاد ({lowStockAlertItems.length})</h3>
                </div>
                <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-full">تنبيه مخزون</span>
              </div>
              {lowStockAlertItems.length === 0 ? (
                <p className="text-xs text-slate-400 font-medium py-2">لا توجد أصناف تحت حد التنبيه حالياً</p>
              ) : (
                <div className="space-y-2">
                  {lowStockAlertItems.map((item) => (
                    <div key={item.id} className="bg-rose-50 border border-rose-100 p-2.5 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-rose-950">{item.name}</div>
                        <div className="text-[10px] text-rose-800">{item.caliber} • {item.storageLocation}</div>
                      </div>
                      <div className="text-left font-mono font-bold text-rose-900">
                        {item.availableQty} <span className="text-[10px] font-normal text-rose-700">المتبقي</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Maintenance Needed Alert */}
            <div className="bg-white border border-amber-200 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                <div className="flex items-center space-x-2 space-x-reverse text-amber-800">
                  <Wrench className="w-4 h-4" />
                  <h3 className="text-xs font-bold font-['Tajawal']">أسلحة بحاجة لصيانة ({maintenanceNeededWeapons.length})</h3>
                </div>
                <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">فحص فني</span>
              </div>
              {maintenanceNeededWeapons.length === 0 ? (
                <p className="text-xs text-slate-400 font-medium py-2">جميع الأسلحة المسجلة حالة الفحص ممتازة</p>
              ) : (
                <div className="space-y-2">
                  {maintenanceNeededWeapons.map((w) => (
                    <div key={w.id} className="bg-amber-50 border border-amber-100 p-2.5 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-amber-950">{w.weaponType}</div>
                        <div className="text-[10px] font-mono text-amber-800">الرقم التسلسلي: {w.serialNumber}</div>
                      </div>
                      <div className="flex items-center space-x-1.5 space-x-reverse">
                        <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-2 py-0.5 rounded-lg">
                          {w.technicalCondition}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleQuickConditionChange(w.id, 'جاهز')}
                          className="text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2 py-0.5 rounded-lg transition-all cursor-pointer shadow-xs"
                          title="اعتماد الجاهزية الممتازة"
                        >
                          تعيين كـ جاهز ✓
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingWeaponPiece(w)}
                          className="p-1 text-amber-800 hover:text-amber-950 hover:bg-amber-100 rounded-lg transition-all cursor-pointer"
                          title="تعديل تفاصيل السلاح"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Ammo Expiration Alert */}
            <div className="bg-white border border-blue-200 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                <div className="flex items-center space-x-2 space-x-reverse text-blue-800">
                  <Clock className="w-4 h-4" />
                  <h3 className="text-xs font-bold font-['Tajawal']">صلاحية الذخائر والانتهاء ({expiringAmmoItems.length})</h3>
                </div>
                <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">مراقبة جودة</span>
              </div>
              {expiringAmmoItems.length === 0 ? (
                <p className="text-xs text-slate-400 font-medium py-2">جميع الشحنات مسجلة بتاريخ صلاحية آمن</p>
              ) : (
                <div className="space-y-2">
                  {expiringAmmoItems.map((inv) => (
                    <div key={inv.id} className="bg-blue-50 border border-blue-100 p-2.5 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-blue-950">{inv.name}</div>
                        <div className="text-[10px] text-blue-800">تاريخ الانتهاء: {inv.expiryDate}</div>
                      </div>
                      <span className="text-[10px] bg-blue-200 text-blue-900 font-mono font-bold px-2 py-0.5 rounded-lg">
                        {inv.availableQty} طلقة
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Quick Actions Bar */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs text-amber-950">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Key className="w-5 h-5 text-amber-700" />
              <div>
                <strong className="block font-['Tajawal']">الربط الشبكي والتحديث الفوري للتمام العسكري</strong>
                <span className="text-[11px] text-amber-800">جميع التغييرات التي تجريها تنعكس تلقائياً بملفات الأفراد بالملف الإلكتروني الشامل واللواء الرئيسي.</span>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('inventory')}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
            >
              استعراض المخزون الكامل
            </button>
          </div>

          {/* Section: User-Added Weapons Combat Readiness Board */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-4 gap-2">
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-lg shadow-md">
                  🛡️
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg font-['Tajawal']">
                    لوحة جاهزية الأسلحة المسجلة والمضافة
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    متابعة فورية ونسبة الجاهزية القتالية للأسلحة التي تمت إضافتها وتسجيل وارداتها
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <span className="bg-amber-100 text-amber-900 font-extrabold text-xs px-3.5 py-1.5 rounded-xl border border-amber-300/60">
                  إجمالي أصناف الأسلحة: {inventory.filter((i) => i.itemType === 'weapon').length} صنف
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddIntakeModal(true)}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs px-3.5 py-1.5 rounded-xl transition-all shadow-sm flex items-center space-x-1.5 space-x-reverse cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>تسجيل واردات تسليح ➕</span>
                </button>
              </div>
            </div>

            {inventory.filter((i) => i.itemType === 'weapon').length === 0 && weapons.length === 0 ? (
              <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 mx-auto flex items-center justify-center text-2xl font-bold">
                  🛡️
                </div>
                <h4 className="font-extrabold text-slate-800 text-base font-['Tajawal']">
                  لا توجد أسلحة مضافة بالمخزن حالياً
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  عند تسجيل واردات أسلحة جديدة أو إضافة أسلحة بسيريال فريد، ستظهر أوتوماتيكياً هنا مع الرصيد ونسبة الجاهزية القتالية المباشرة.
                </p>
                <button
                  type="button"
                  onClick={() => setShowAddIntakeModal(true)}
                  className="inline-flex items-center space-x-2 space-x-reverse bg-amber-600 hover:bg-amber-700 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs transition-all shadow-md cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>تسجيل أول وارد أسلحة جديد إلى المخزن</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {inventory
                  .filter((i) => i.itemType === 'weapon')
                  .map((invWp) => {
                    const matchingPieces = weapons.filter(
                      (w) => w.weaponType.trim().toLowerCase() === invWp.name.trim().toLowerCase()
                    );

                    const totalQty = invWp.totalReceived;
                    const availableQty = invWp.availableQty;
                    const issuedQty = invWp.issuedQty;
                    const maintenanceQty = matchingPieces.filter(
                      (w) => w.technicalCondition === 'تحتاج صيانة' || w.status === 'في الصيانة'
                    ).length;

                    const readinessPct =
                      totalQty > 0 ? Math.round(((availableQty + issuedQty) / totalQty) * 100) : 100;

                    return (
                      <div
                        key={invWp.id}
                        className="bg-slate-50 border border-slate-200 hover:border-amber-400 rounded-2xl p-4 transition-all space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <span className="text-2xl">🗡️</span>
                            <div>
                              <div className="font-extrabold text-slate-900 text-sm font-['Tajawal']">
                                {invWp.name}
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono">{invWp.caliber}</div>
                            </div>
                          </div>
                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-lg border ${
                              readinessPct >= 80
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                : 'bg-amber-100 text-amber-800 border-amber-200'
                            }`}
                          >
                            %{readinessPct} جاهزية
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-1 text-center bg-white border border-slate-200 rounded-xl p-2 text-[11px]">
                          <div>
                            <div className="text-[10px] text-slate-400 font-medium">الوارد</div>
                            <div className="font-extrabold text-slate-900">{totalQty}</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-400 font-medium">المتاح بالرصيد</div>
                            <div className="font-extrabold text-emerald-700">{availableQty}</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-400 font-medium">منصرف للميدان</div>
                            <div className="font-extrabold text-blue-700">{issuedQty}</div>
                          </div>
                        </div>

                        {maintenanceQty > 0 && (
                          <div className="text-[10px] bg-rose-50 text-rose-800 border border-rose-200 px-2 py-1 rounded-lg flex items-center justify-between font-bold">
                            <span>تحتاج صيانة / معطوبة:</span>
                            <span>{maintenanceQty} قطعة</span>
                          </div>
                        )}

                        <div className="pt-1 flex items-center justify-between text-[11px] border-t border-slate-200/60">
                          <span className="text-slate-400 font-mono text-[10px]">
                            الموقع: {invWp.storageLocation}
                          </span>
                          <button
                            type="button"
                            onClick={() => setEditingInventoryItem(invWp)}
                            className="text-amber-700 hover:text-amber-900 font-bold flex items-center space-x-1 space-x-reverse"
                          >
                            <Pencil className="w-3 h-3" />
                            <span>تعديل</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Section: User-Added Ammunition Readiness Board */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-4 gap-2">
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-lg shadow-md">
                  🔥
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg font-['Tajawal']">
                    لوحة جاهزية الذخائر والعيارات المضافة
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    عرض دقيق لمخزون الذخيرة والطلقات المتاحة والمصروفة وسقف الخطر لكل عيار مضاف
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIntakeItemType('ammo');
                  setShowAddIntakeModal(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-3.5 py-1.5 rounded-xl transition-all shadow-sm flex items-center space-x-1.5 space-x-reverse cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>تسجيل وارد ذخيرة جديد ➕</span>
              </button>
            </div>

            {inventory.filter((i) => i.itemType === 'ammo').length === 0 ? (
              <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-800 mx-auto flex items-center justify-center text-2xl font-bold">
                  🔥
                </div>
                <h4 className="font-extrabold text-slate-800 text-base font-['Tajawal']">
                  لا توجد ذخائر حية مضافة بالمخزن حالياً
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  عند تسجيل واردات الذخائر والعيارات، ستظهر أوتوماتيكياً هنا مع مراقبة سقف الخطر وتواريخ الصلاحية.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIntakeItemType('ammo');
                    setShowAddIntakeModal(true);
                  }}
                  className="inline-flex items-center space-x-2 space-x-reverse bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs transition-all shadow-md cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>تسجيل أول وارد ذخيرة إلى المخزن</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-200">
                      <th className="p-3">اسم نوع الذخيرة والعيار</th>
                      <th className="p-3">العيار</th>
                      <th className="p-3">إجمالي الواردات</th>
                      <th className="p-3">الرصيد المتاح بالمخزن</th>
                      <th className="p-3">المصروف للميدان</th>
                      <th className="p-3">سقف الخطر (الإنذار)</th>
                      <th className="p-3">تاريخ الانتهاء</th>
                      <th className="p-3 text-center">حالة الجاهزية للذخيرة</th>
                      <th className="p-3 text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {inventory
                      .filter((i) => i.itemType === 'ammo')
                      .map((ammo) => {
                        const isLow = ammo.availableQty <= ammo.minThreshold;

                        return (
                          <tr key={ammo.id} className="hover:bg-slate-50 font-medium text-slate-800">
                            <td className="p-3 font-bold text-slate-900 flex items-center space-x-2 space-x-reverse">
                              <span>🔥</span>
                              <span>{ammo.name}</span>
                            </td>
                            <td className="p-3 font-mono text-slate-600">{ammo.caliber}</td>
                            <td className="p-3 font-mono text-slate-800 font-bold">
                              {ammo.totalReceived.toLocaleString()} طلقة
                            </td>
                            <td className="p-3 font-mono font-bold text-emerald-800">
                              {ammo.availableQty.toLocaleString()} طلقة
                            </td>
                            <td className="p-3 font-mono text-blue-800">
                              {ammo.issuedQty.toLocaleString()} طلقة
                            </td>
                            <td className="p-3 font-mono text-slate-500">
                              {ammo.minThreshold.toLocaleString()}
                            </td>
                            <td className="p-3 font-mono text-slate-600">
                              {ammo.expiryDate || 'غير محدد'}
                            </td>
                            <td className="p-3 text-center">
                              {isLow ? (
                                <span className="bg-rose-100 text-rose-800 text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-rose-200">
                                  ⚠️ وصل لسقف الخطر
                                </span>
                              ) : (
                                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-emerald-200">
                                  ✅ مخزون آمن ومكتمل
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              <button
                                type="button"
                                onClick={() => setEditingInventoryItem(ammo)}
                                className="text-blue-700 hover:text-blue-900 font-bold p-1 rounded hover:bg-blue-50"
                                title="تعديل صنف الذخيرة"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB: DEDICATED AMMO DISPENSE (صرف ذخيرة وسقف الخطر) */}
      {activeTab === 'ammoDispense' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 text-white rounded-3xl p-6 shadow-xl border border-amber-500/30 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="w-14 h-14 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-2xl shadow-lg">
                🔥
              </div>
              <div>
                <h2 className="font-extrabold text-xl text-amber-400 font-['Tajawal'] flex items-center space-x-2 space-x-reverse">
                  <span>صرف ذخيرة والخصم التلقائي المباشر من المخزن</span>
                  <span className="text-[11px] bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2.5 py-0.5 rounded-full font-bold">
                    تنبيه سقف الخطر 🚨
                  </span>
                </h2>
                <p className="text-xs text-slate-300 font-medium mt-1">
                  صرف الذخيرة للفرد المستهدف مع الخصم التلقائي الفوري من مخزون عيار الذخيرة وإشعارات حية بسقف الخطر والكمية المتبقية
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <button
                type="button"
                onClick={handleClearSampleWeapons}
                className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-bold px-3.5 py-2 rounded-xl text-xs transition-all cursor-pointer flex items-center space-x-1.5 space-x-reverse"
              >
                <Trash2 className="w-4 h-4 text-rose-400" />
                <span>حذف الأسلحة الافتراضية 12</span>
              </button>
            </div>
          </div>

          {/* Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Form Column (7 Cols) */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5 text-xs">
              <div className="flex items-center space-x-2 space-x-reverse border-b border-slate-100 pb-3 text-slate-900 font-extrabold text-sm">
                <Crosshair className="w-5 h-5 text-amber-600" />
                <h3 className="font-['Tajawal']">نموذج صرف الذخيرة وتحديد الفرد والمستند</h3>
              </div>

              <form onSubmit={handleAmmoDispenseSubmit} className="space-y-5">
                
                {/* 1. Target Personnel */}
                <div className="space-y-1.5 bg-slate-50 border border-slate-200 p-4 rounded-2xl">
                  <TargetPersonnelSearchSelect
                    personnel={personnel}
                    selectedMilitaryId={ammoDispensePersonnelId}
                    onSelect={(id) => setAmmoDispensePersonnelId(id)}
                    label="١. اختيار الفرد المستهدف بالصرف *"
                    placeholder="ابحث بالاسم، الرقم العسكري، الرتبة، أو الوحدة..."
                  />
                </div>

                {/* 2. Select Ammo Type from Inventory */}
                <div>
                  <label className="block text-slate-800 font-bold mb-1">
                    ٢. نوع الذخيرة المراد صرفها من المخزن *
                  </label>
                  <select
                    required
                    value={ammoDispenseItemId}
                    onChange={(e) => setAmmoDispenseItemId(e.target.value)}
                    className="w-full bg-amber-50/70 border border-amber-300 rounded-xl px-3.5 py-2.5 font-bold text-slate-900 text-sm focus:outline-none focus:border-amber-500 focus:bg-white shadow-xs"
                  >
                    <option value="">-- اختر نوع الذخيرة المتاحة بالمخزن --</option>
                    {inventory
                      .filter((i) => i.itemType === 'ammo')
                      .map((ammo) => (
                        <option key={ammo.id} value={ammo.id}>
                          {ammo.name} ({ammo.caliber}) - المتاح بالمخزن: {ammo.availableQty.toLocaleString()} طلقة (سقف الخطر: {ammo.minThreshold})
                        </option>
                      ))}
                  </select>
                  {inventory.filter((i) => i.itemType === 'ammo').length === 0 && (
                    <p className="text-rose-600 font-bold mt-1">
                      ⚠️ لا توجد أصناف ذخائر مسجلة بالمخزن. يرجى إضافة ذخيرة أولاً من تبويب المخزون.
                    </p>
                  )}
                </div>

                {/* 3. Quantity & Issuing Authority */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-800 font-bold mb-1">
                      ٣. الكمية المطلوبة للصرف (عدد الطلقات) *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min={1}
                        required
                        value={ammoDispenseQty || ''}
                        onChange={(e) => setAmmoDispenseQty(parseInt(e.target.value) || 0)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl pr-3 pl-14 py-2.5 font-mono text-base font-black text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                        placeholder="مثال: 180"
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                        طلقة
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-800 font-bold mb-1">
                      ٤. جهة الأمر بالصرف *
                    </label>
                    <input
                      type="text"
                      required
                      value={ammoDispenseIssuingAuthority}
                      onChange={(e) => setAmmoDispenseIssuingAuthority(e.target.value)}
                      placeholder="مثال: أمر عمليات رقم 104 / قيادة الفرقة الثالثة"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 font-bold text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                    />
                  </div>
                </div>

                {/* 4. Reason for Issuance */}
                <div>
                  <label className="block text-slate-800 font-bold mb-1">
                    ٥. سبب الصرف والداعي الميداني *
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {[
                      'مهمة قتالية وتأمين القطاع',
                      'تدريب ورماية حية',
                      'دورية واستطلاع ميداني',
                      'تجهيز وتصفير أسلحة',
                      'تعزيز الذخيرة الشخصية'
                    ].map((reason) => (
                      <button
                        type="button"
                        key={reason}
                        onClick={() => setAmmoDispenseReason(reason)}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border font-bold transition-all ${
                          ammoDispenseReason === reason
                            ? 'bg-amber-500 text-slate-950 border-amber-500'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                        }`}
                      >
                        {reason}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    required
                    value={ammoDispenseReason}
                    onChange={(e) => setAmmoDispenseReason(e.target.value)}
                    placeholder="اكتب سبب الصرف..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 font-medium text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                  />
                </div>

                {/* 5. Notes */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">ملاحظات إضافية على أمر الصرف</label>
                  <textarea
                    rows={2}
                    value={ammoDispenseNotes}
                    onChange={(e) => setAmmoDispenseNotes(e.target.value)}
                    placeholder="أي ملاحظات بخصوص الشحنة أو الترقيم..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-500 resize-none"
                  />
                </div>

                {/* Submit Action */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={
                      !ammoDispenseItemId ||
                      !ammoDispensePersonnelId ||
                      ammoDispenseQty <= 0 ||
                      (inventory.find((i) => i.id === ammoDispenseItemId)?.availableQty || 0) < ammoDispenseQty
                    }
                    className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 disabled:text-slate-500 text-slate-950 font-black py-3.5 rounded-2xl transition-all shadow-lg text-sm font-['Tajawal'] flex items-center justify-center space-x-2 space-x-reverse cursor-pointer"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>تأكيد أمر صرف الذخيرة وتحديث المخزون وملف الفرد فورياً ➔</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Live Dashboard / Alert Panel (5 Cols) */}
            <div className="lg:col-span-5 space-y-4 text-xs">
              {(() => {
                const selectedAmmo = inventory.find((i) => i.id === ammoDispenseItemId && i.itemType === 'ammo');
                if (!selectedAmmo) {
                  return (
                    <div className="bg-slate-100 border border-dashed border-slate-300 rounded-3xl p-6 text-center space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-200 text-slate-500 mx-auto flex items-center justify-center text-xl">
                        🔥
                      </div>
                      <h4 className="font-extrabold text-slate-700 text-sm font-['Tajawal']">
                        مراقبة المخزون المباشر وتنبيه سقف الخطر
                      </h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        اختر نوع الذخيرة من القائمة لعرض حالة المخزون المتاح حالياً، سقف الخطر، والكمية المتبقية المتوقعة بعد الصرف مباشرة.
                      </p>
                    </div>
                  );
                }

                const currentAvail = selectedAmmo.availableQty;
                const minThresh = selectedAmmo.minThreshold;
                const reqQty = ammoDispenseQty || 0;
                const remainingAfter = currentAvail - reqQty;
                const isDangerAfter = remainingAfter <= minThresh;
                const isOverStock = reqQty > currentAvail;

                return (
                  <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b pb-3">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <Flame className="w-5 h-5 text-amber-600" />
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-sm font-['Tajawal']">
                            حالة مخزون: {selectedAmmo.name}
                          </h4>
                          <span className="text-[10px] text-slate-500 font-mono">{selectedAmmo.caliber}</span>
                        </div>
                      </div>
                      <span className="bg-slate-100 text-slate-800 text-[10px] font-extrabold px-2.5 py-1 rounded-full">
                        {selectedAmmo.storageLocation}
                      </span>
                    </div>

                    {/* Numbers overview */}
                    <div className="grid grid-cols-2 gap-3 text-center">
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3">
                        <span className="text-[10px] text-slate-500 font-bold block">الرصيد المتاح حالياً</span>
                        <span className="text-xl font-black font-mono text-emerald-800">
                          {currentAvail.toLocaleString()} <span className="text-[10px] font-normal">طلقة</span>
                        </span>
                      </div>

                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 relative">
                        <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold mb-0.5">
                          <span>سقف الخطر (الإنذار)</span>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingThresholdItemId(selectedAmmo.id);
                              setEditingThresholdVal(selectedAmmo.minThreshold);
                            }}
                            className="text-amber-700 hover:underline font-bold"
                          >
                            تعديل ⚙️
                          </button>
                        </div>
                        <span className="text-xl font-black font-mono text-rose-800">
                          {minThresh.toLocaleString()} <span className="text-[10px] font-normal">طلقة</span>
                        </span>
                      </div>
                    </div>

                    {/* Inline Threshold modification */}
                    {editingThresholdItemId === selectedAmmo.id && (
                      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 space-y-2">
                        <div className="font-bold text-amber-950 text-xs">تعديل سقف الخطر لهذا الصنف:</div>
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <input
                            type="number"
                            min={0}
                            value={editingThresholdVal}
                            onChange={(e) => setEditingThresholdVal(parseInt(e.target.value) || 0)}
                            className="bg-white border border-amber-300 rounded-xl px-3 py-1 font-mono font-bold text-slate-900 w-28 text-center"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveMinThreshold(selectedAmmo.id, editingThresholdVal)}
                            className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1 rounded-xl text-xs"
                          >
                            حفظ السقف
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingThresholdItemId(null)}
                            className="text-slate-500 hover:text-slate-800 text-xs font-bold"
                          >
                            إلغاء
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Impact Box */}
                    <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-3 space-y-2">
                      <div className="flex justify-between text-xs font-bold text-slate-800">
                        <span>الكمية المطلوبة للصرف الآن:</span>
                        <span className="font-mono text-amber-900 font-black">{reqQty.toLocaleString()} طلقة</span>
                      </div>
                      <div className="flex justify-between text-xs font-bold text-slate-800 border-t border-amber-200/60 pt-2">
                        <span>المتبقي المتوقع بعد الصرف:</span>
                        <span
                          className={`font-mono font-black text-sm ${
                            remainingAfter < 0
                              ? 'text-rose-600'
                              : isDangerAfter
                              ? 'text-rose-700'
                              : 'text-emerald-700'
                          }`}
                        >
                          {remainingAfter.toLocaleString()} طلقة
                        </span>
                      </div>
                    </div>

                    {/* Alert Banner */}
                    {isOverStock ? (
                      <div className="bg-rose-50 border-2 border-rose-500 rounded-2xl p-3.5 space-y-1 text-rose-950 font-extrabold animate-pulse">
                        <div className="flex items-center space-x-2 space-x-reverse text-rose-700">
                          <AlertTriangle className="w-5 h-5 text-rose-600" />
                          <span className="text-xs font-['Tajawal']">❌ خطأ: عدم كفاية الرصيد!</span>
                        </div>
                        <p className="text-[11px] text-rose-800 font-medium">
                          الكمية المطلوبة ({reqQty}) تتجاوز الرصيد المتاح بالمخزن ({currentAvail}). لا يمكن إتمام عملية الصرف.
                        </p>
                      </div>
                    ) : isDangerAfter ? (
                      <div className="bg-rose-50 border-2 border-rose-400 rounded-2xl p-3.5 space-y-1.5 text-rose-950 font-extrabold">
                        <div className="flex items-center space-x-2 space-x-reverse text-rose-800">
                          <AlertTriangle className="w-5 h-5 text-rose-600 animate-bounce" />
                          <span className="text-xs font-['Tajawal']">🚨 تنبيه حرج: الوصول لسقف الخطر!</span>
                        </div>
                        <p className="text-[11px] text-rose-900 font-medium leading-relaxed">
                          تحذير: بعد إتمام صرف ({reqQty}) طلقة، سيرتفع مؤشر الخطر وسيصبح المتبقي بالمخزن ({remainingAfter}) وهو مساوي أو أقل من سقف الخطر المحدد ({minThresh}). يتوجب رفع طلب تموين عاجل.
                        </p>
                      </div>
                    ) : (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 text-emerald-950 font-extrabold flex items-center space-x-2 space-x-reverse">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        <span className="text-xs font-medium text-emerald-900">
                          الرصيد آمن ومكتمل. المتبقي بعد الصرف ({remainingAfter}) طلقة أعلى من سقف الخطر ({minThresh}).
                        </span>
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3">
                <div className="flex items-center space-x-2 space-x-reverse text-slate-900 font-extrabold border-b pb-2">
                  <Trash2 className="w-4 h-4 text-rose-600" />
                  <h4 className="font-['Tajawal']">إدارة الأسلحة والبيانات الافتراضية (12 عينة)</h4>
                </div>
                <p className="text-slate-600 leading-relaxed font-medium">
                  إذا كنت ترغب في حذف بيانات الأسلحة الـ 12 الافتراضية للعينة وإدخال بيانات أسلحتك الحقيقية الخاصة:
                </p>
                <button
                  type="button"
                  onClick={handleClearSampleWeapons}
                  className="w-full bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 font-extrabold py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-1.5 space-x-reverse"
                >
                  <Trash2 className="w-4 h-4 text-rose-600" />
                  <span>🧹 مسح وحذف بيانات الأسلحة الافتراضية 12</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: TURN-IN EQUIPMENT (توريد عهدة واستعادة قطعة سلاح) */}
      {activeTab === 'turnin' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex items-center space-x-3 space-x-reverse border-b border-slate-100 pb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-xl shadow-md">
                🔄
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-xl font-['Tajawal']">
                  نموذج توريد عهدة واستعادة قطعة سلاح
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  استعادة السلاح والعتاد من الفرد وتحديد نوعيته وحالته وتقييدها بملفه الإلكتروني وطباعة سند التوريد
                </p>
              </div>
            </div>

            <form onSubmit={handleTurnInSubmit} className="space-y-6 text-xs">
              
              {/* Personnel Picker */}
              <div className="space-y-2 bg-slate-50 border border-slate-200 p-4 rounded-2xl">
                <TargetPersonnelSearchSelect
                  personnel={personnel}
                  selectedMilitaryId={turninPersonnelId}
                  onSelect={(id) => {
                    setTurninPersonnelId(id);
                    const selected = personnel.find(p => p.militaryId === id);
                    if (selected && selected.logs?.armament?.[0]) {
                      const latestArm = selected.logs.armament[0];
                      if (latestArm.weaponType) setTurninWeaponType(latestArm.weaponType);
                      if (latestArm.weaponSerial) setTurninWeaponSerial(latestArm.weaponSerial);
                      if (latestArm.ammoQty) setTurninAmmoQty(latestArm.ammoQty);
                      if (latestArm.firelinesCount) setTurninMagazinesCount(latestArm.firelinesCount);
                    }
                  }}
                  label="١. اختر الفرد المورد للعهدة (ابحث بالاسم أو الرقم العسكري) *"
                  placeholder="ابحث بالاسم، الرقم العسكري..."
                />
              </div>

              {/* Weapon & Condition Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3 bg-slate-50 border border-slate-200 p-4 rounded-2xl">
                  <label className="block font-extrabold text-slate-900 font-['Tajawal'] text-sm">
                    ٢. تفاصيل قطعة السلاح المستعادة
                  </label>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">نوع قطعة السلاح *</label>
                    <select
                      value={turninWeaponType}
                      onChange={(e) => setTurninWeaponType(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-amber-500"
                    >
                      {TARGET_SPECIFIED_WEAPONS.map((wp) => (
                        <option key={wp.name} value={wp.name}>
                          {wp.icon} {wp.name} ({wp.defaultCaliber})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">الرقم التسلسلي للسلاح (ويبقى مقيداً باسم الفرد) *</label>
                    <input
                      type="text"
                      required
                      value={turninWeaponSerial}
                      onChange={(e) => setTurninWeaponSerial(e.target.value)}
                      placeholder="مثال: WP-99014"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">الحالة الفنية للسلاح المستعاد *</label>
                    <select
                      value={turninWeaponCondition}
                      onChange={(e) => setTurninWeaponCondition(e.target.value as any)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                    >
                      <option value="ممتازة">ممتازة (جاهز للعمليات فوراً)</option>
                      <option value="جيدة">جيدة (جاهز للاستعمال)</option>
                      <option value="تحتاج صيانة">تحتاج صيانة بالمفرزة الفنية</option>
                      <option value="معطوبة">معطوبة وخارجة عن الخدمة</option>
                    </select>
                  </div>
                </div>

                {/* Ammo & Equipment Details */}
                <div className="space-y-3 bg-slate-50 border border-slate-200 p-4 rounded-2xl">
                  <label className="block font-extrabold text-slate-900 font-['Tajawal'] text-sm">
                    ٣. العتاد والملحقات المستعادة
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">عدد الذخيرة المستعادة *</label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={turninAmmoQty}
                        onChange={(e) => setTurninAmmoQty(Number(e.target.value))}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">عدد المخازن *</label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={turninMagazinesCount}
                        onChange={(e) => setTurninMagazinesCount(Number(e.target.value))}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <label className={`flex items-center space-x-2 space-x-reverse p-3 rounded-xl border cursor-pointer ${
                      turninVest ? 'bg-emerald-50 border-emerald-300 text-emerald-950' : 'bg-white border-slate-200 text-slate-600'
                    }`}>
                      <input
                        type="checkbox"
                        checked={turninVest}
                        onChange={(e) => setTurninVest(e.target.checked)}
                        className="w-4 h-4 accent-emerald-600"
                      />
                      <span className="font-extrabold">الجعبة التكتيكية (تم الاستعادة)</span>
                    </label>

                    <label className={`flex items-center space-x-2 space-x-reverse p-3 rounded-xl border cursor-pointer ${
                      turninHelmet ? 'bg-emerald-50 border-emerald-300 text-emerald-950' : 'bg-white border-slate-200 text-slate-600'
                    }`}>
                      <input
                        type="checkbox"
                        checked={turninHelmet}
                        onChange={(e) => setTurninHelmet(e.target.checked)}
                        className="w-4 h-4 accent-emerald-600"
                      />
                      <span className="font-extrabold">الخوذة العسكرية (تم الاستعادة)</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">حالة الفرد المورد للعهدة *</label>
                    <select
                      value={turninPersonnelStatus}
                      onChange={(e) => setTurninPersonnelStatus(e.target.value as any)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                    >
                      <option value="متواجد">متواجد بالكتيبة</option>
                      <option value="فرار بالسلاح">⚠️ فرار بالسلاح (تقييد بلاغ وتحديث الملف)</option>
                      <option value="في الميدان">في الميدان / المهمة</option>
                      <option value="إجازة">إجازة رسمية</option>
                      <option value="غياب">غياب</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Officers & Notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">اسم المسؤول / الضابط المستلم *</label>
                  <input
                    type="text"
                    required
                    value={turninReceivingOfficer}
                    onChange={(e) => setTurninReceivingOfficer(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">ملاحظات التوريد وحالة التسليم</label>
                  <input
                    type="text"
                    value={turninNotes}
                    onChange={(e) => setTurninNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <span className="text-slate-500 text-[11px] font-medium">
                  بمجرد الاعتماد، سيتم توثيق التوريد وتقييده فورياً بملف الفرد وطباعة السند الرسمى
                </span>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-8 py-3 rounded-xl transition-all shadow-md text-xs font-['Tajawal'] flex items-center space-x-2 space-x-reverse cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>اعتماد توريد العهدة وطباعة السند ➔</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* TAB: WEAPON SEARCH & DETAILED INFO (وعند البحث عن معلومات أي سلاح يظهر حالة السلاح والذخيرة التابعة له اسم ومستلم السلاح ومعلوماته) */}
      {activeTab === 'search' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex items-center space-x-3 space-x-reverse border-b border-slate-100 pb-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xl shadow-md">
                🔎
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-xl font-['Tajawal']">
                  البحث الشامل والاستعلام عن أي قطعة سلاح
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  ابحث بالرقم التسلسلي أو النوع أو اسم المستلم لعرض كافة التفاصيل: حالة السلاح، الذخيرة والعتاد التابع له، واسم مستلم السلاح ومعلوماته
                </p>
              </div>
            </div>

            {/* Search Input Bar */}
            <div className="relative">
              <Search className="w-5 h-5 text-slate-400 absolute right-4 top-3.5" />
              <input
                type="text"
                value={weaponSearchTerm}
                onChange={(e) => setWeaponSearchTerm(e.target.value)}
                placeholder="ادخل الرقم التسلسلي للسلاح، أو اسم السلاح، أو اسم المستلم، أو الرقم العسكري..."
                className="w-full bg-slate-50 border border-slate-300 rounded-2xl pr-12 pl-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-amber-500 shadow-inner"
              />
            </div>

            {/* Query Results */}
            <div className="space-y-4">
              {(() => {
                const term = weaponSearchTerm.trim().toLowerCase();

                const matchedResults: Array<{
                  weaponSerial: string;
                  weaponType: string;
                  caliber: string;
                  condition: string;
                  status: string;
                  holderName: string;
                  holderMilitaryId: string;
                  holderRank: string;
                  holderUnit: string;
                  holderPhoto?: string;
                  ammoQty: number;
                  magazinesCount: number;
                  vest: boolean;
                  helmet: boolean;
                  issueDate?: string;
                }> = [];

                weapons.forEach((wp) => {
                  if (
                    !term ||
                    wp.serialNumber.toLowerCase().includes(term) ||
                    wp.weaponType.toLowerCase().includes(term) ||
                    (wp.currentHolderName && wp.currentHolderName.toLowerCase().includes(term))
                  ) {
                    const holder = personnel.find((p) => p.militaryId === wp.currentHolderMilitaryId);
                    matchedResults.push({
                      weaponSerial: wp.serialNumber,
                      weaponType: wp.weaponType,
                      caliber: wp.caliber,
                      condition: wp.technicalCondition,
                      status: wp.status,
                      holderName: holder ? holder.fullName : wp.currentHolderName || 'غير منصرف (في المخزن)',
                      holderMilitaryId: holder ? holder.militaryId : wp.currentHolderMilitaryId || '---',
                      holderRank: holder ? holder.rank : '---',
                      holderUnit: holder ? holder.unit : 'المخزن الرئيسي',
                      holderPhoto: holder?.photoUrl,
                      ammoQty: holder?.logs?.armament?.[0]?.ammoQty || 180,
                      magazinesCount: holder?.logs?.armament?.[0]?.firelinesCount || 6,
                      vest: true,
                      helmet: true,
                      issueDate: wp.entryDate
                    });
                  }
                });

                personnel.forEach((p) => {
                  const armLog = p.logs?.armament?.[0];
                  if (armLog && armLog.weaponSerial) {
                    const exists = matchedResults.some((r) => r.weaponSerial.toLowerCase() === armLog.weaponSerial.toLowerCase());
                    if (!exists) {
                      if (
                        !term ||
                        armLog.weaponSerial.toLowerCase().includes(term) ||
                        armLog.weaponType.toLowerCase().includes(term) ||
                        p.fullName.toLowerCase().includes(term) ||
                        p.militaryId.toLowerCase().includes(term)
                      ) {
                        matchedResults.push({
                          weaponSerial: armLog.weaponSerial,
                          weaponType: armLog.weaponType,
                          caliber: 'قياسي',
                          condition: armLog.condition || 'ممتازة',
                          status: 'منصرف للفرد',
                          holderName: p.fullName,
                          holderMilitaryId: p.militaryId,
                          holderRank: p.rank,
                          holderUnit: p.unit,
                          holderPhoto: p.photoUrl,
                          ammoQty: armLog.ammoQty || 180,
                          magazinesCount: armLog.firelinesCount || 6,
                          vest: true,
                          helmet: true,
                          issueDate: armLog.issueDate
                        });
                      }
                    }
                  }
                });

                if (matchedResults.length === 0) {
                  return (
                    <div className="text-center py-12 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                      <p className="text-slate-500 font-extrabold text-sm font-['Tajawal']">لم يتم العثور على أسلحة تطابق بحثك</p>
                      <p className="text-xs text-slate-400">جرب البحث برقم السيريال أو نوع السلاح مثل (كلاش صيني، دراغانوف...)</p>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {matchedResults.map((res, idx) => (
                      <div key={idx} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 hover:border-amber-400 transition-all">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                          <div className="flex items-center space-x-3 space-x-reverse">
                            <span className="text-2xl">🔫</span>
                            <div>
                              <div className="font-extrabold text-slate-900 text-sm">{res.weaponType}</div>
                              <div className="text-xs font-mono text-amber-900 font-bold">سيريال: {res.weaponSerial}</div>
                            </div>
                          </div>
                          <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg ${
                            res.condition === 'معطوبة' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            حالة السلاح: {res.condition}
                          </span>
                        </div>

                        {/* Recipient Details */}
                        <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center space-x-3 space-x-reverse text-xs">
                          {res.holderPhoto ? (
                            <img src={res.holderPhoto} alt="" className="w-10 h-10 rounded-xl object-cover border" />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-slate-200 flex items-center justify-center font-bold text-slate-600">👤</div>
                          )}
                          <div className="flex-1">
                            <div className="font-extrabold text-slate-900">{res.holderRank} / {res.holderName}</div>
                            <div className="text-[11px] text-slate-500">الرقم: {res.holderMilitaryId} • الوحدة: {res.holderUnit}</div>
                          </div>
                          <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">
                            {res.status}
                          </span>
                        </div>

                        {/* Ammo & Equipment */}
                        <div className="grid grid-cols-3 gap-2 text-center text-xs bg-slate-100 p-2 rounded-xl">
                          <div>
                            <span className="text-[10px] text-slate-500 block">الذخيرة التابعة</span>
                            <strong className="text-blue-900 font-mono">{res.ammoQty} طلقة</strong>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 block">المخازن</span>
                            <strong className="text-slate-900 font-mono">{res.magazinesCount} مخزن</strong>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 block">التاريخ</span>
                            <strong className="text-slate-700 font-mono">{res.issueDate || '---'}</strong>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* TAB: EDIT PERSONNEL ARMAMENT (إمكانية تعديل معلومات تسليح أي فرد فرار بالسلاح متواجد عدد الذخيرة ملاحظات وتتقيد في ملف كل فرد) */}
      {activeTab === 'editPersonnelArmament' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex items-center space-x-3 space-x-reverse border-b border-slate-100 pb-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-600 text-white flex items-center justify-center font-black text-xl shadow-md">
                ✏️
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-xl font-['Tajawal']">
                  إمكانية تعديل وتحديث معلومات تسليح أي فرد
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  تعديل حالة التسليح (فرار بالسلاح / متواجد)، عدد الذخيرة والمخازن والعتاد وإضافة ملاحظات وتوثيقها فورياً بملف الفرد
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveEditPersonnelArmament} className="space-y-6 text-xs">
              
              {/* Target Personnel Picker */}
              <div className="space-y-2 bg-slate-50 border border-slate-200 p-4 rounded-2xl">
                <TargetPersonnelSearchSelect
                  personnel={personnel}
                  selectedMilitaryId={editPersonnelId}
                  onSelect={(id) => {
                    setEditPersonnelId(id);
                    const selected = personnel.find(p => p.militaryId === id);
                    if (selected) {
                      const latestArm = selected.logs?.armament?.[0];
                      if (latestArm) {
                        if (latestArm.weaponType) setEditWeaponType(latestArm.weaponType);
                        if (latestArm.weaponSerial) setEditWeaponSerial(latestArm.weaponSerial);
                        if (latestArm.ammoQty) setEditAmmoQty(latestArm.ammoQty);
                        if (latestArm.firelinesCount) setEditMagazinesCount(latestArm.firelinesCount);
                        if (latestArm.condition) setEditCondition(latestArm.condition as any);
                      }
                      if (selected.currentStatus === 'فرار') {
                        setEditPersonnelStatus('فرار بالسلاح');
                      } else {
                        setEditPersonnelStatus('متواجد');
                      }
                    }
                  }}
                  label="اختر الفرد المراد تعديل تسليحه (ابحث بالاسم أو الرقم العسكري) *"
                  placeholder="اختر الفرد..."
                />
              </div>

              {/* Form Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3 bg-slate-50 border border-slate-200 p-4 rounded-2xl">
                  <label className="block font-extrabold text-slate-900 font-['Tajawal'] text-sm">
                    حالة الفرد وقطعة السلاح
                  </label>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">حالة الفرد بالتسليح *</label>
                    <select
                      value={editPersonnelStatus}
                      onChange={(e) => setEditPersonnelStatus(e.target.value as any)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                    >
                      <option value="متواجد">متواجد بالكتيبة</option>
                      <option value="فرار بالسلاح">⚠️ فرار بالسلاح (تقييد بلاغ رسمى)</option>
                      <option value="في الميدان">في الميدان / خط النار</option>
                      <option value="إجازة">إجازة</option>
                      <option value="غياب">غياب</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">نوع قطعة السلاح *</label>
                    <input
                      type="text"
                      required
                      list="weapon-types-list"
                      value={editWeaponType}
                      onChange={(e) => setEditWeaponType(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">الرقم التسلسلي للسلاح *</label>
                    <input
                      type="text"
                      required
                      value={editWeaponSerial}
                      onChange={(e) => setEditWeaponSerial(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono text-slate-900 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="space-y-3 bg-slate-50 border border-slate-200 p-4 rounded-2xl">
                  <label className="block font-extrabold text-slate-900 font-['Tajawal'] text-sm">
                    الذخيرة والعتاد والملاحظات
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">عدد الذخيرة *</label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={editAmmoQty}
                        onChange={(e) => setEditAmmoQty(Number(e.target.value))}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">عدد المخازن *</label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={editMagazinesCount}
                        onChange={(e) => setEditMagazinesCount(Number(e.target.value))}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">ملاحظات وتقييد بملف الفرد</label>
                    <input
                      type="text"
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      placeholder="اكتب أي ملاحظات خاصة بالتسليح لتسجيلها بملف الفرد..."
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <span className="text-slate-500 text-[11px] font-medium">
                  سيتم حفظ وتحديث الملف الشخصي للفرد وتحديث سجله بالملف الإلكتروني فورياً
                </span>
                <button
                  type="submit"
                  className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold px-8 py-3 rounded-xl transition-all shadow-md text-xs font-['Tajawal'] flex items-center space-x-2 space-x-reverse cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>حفظ وتحديث ملف الفرد فورياً ➔</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* TAB 2: INVENTORY & INTAKES & WEAPON PIECES */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          
          {/* Controls Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
            
            {/* Search Input */}
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث بالاسم، العيار، المكان، السيريال..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pr-9 pl-4 py-2 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-amber-500 font-medium"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex items-center space-x-2 space-x-reverse text-xs">
              {['الكل', 'أسلحة', 'ذخائر', 'منخفض'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                    selectedCategoryFilter === cat
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowExcelModal(true)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center space-x-1.5 space-x-reverse transition-all shadow-xs cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-white" />
                <span>استيراد كشف تسليح Excel 📊</span>
              </button>
              <button
                onClick={() => setShowAddWeaponModal(true)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center space-x-1.5 space-x-reverse transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>تسجيل قطعة سلاح برقم تسلسلي</span>
              </button>
              <button
                onClick={() => setShowAddIntakeModal(true)}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center space-x-1.5 space-x-reverse transition-all cursor-pointer"
              >
                <ArrowDownRight className="w-3.5 h-3.5" />
                <span>تسجيل وارد جديد</span>
              </button>
            </div>

          </div>

          {/* Main Inventory Balance Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-2 space-x-reverse">
                <Database className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-extrabold text-slate-900 font-['Tajawal']">
                  رصيد المخزون المركزي للأسلحة والذخائر
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-semibold">عدد الأصناف: {filteredInventory.length}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <tr>
                    <th className="p-3">نوع الصنف</th>
                    <th className="p-3">اسم السلاح / الذخيرة</th>
                    <th className="p-3">العيار / التصنيف</th>
                    <th className="p-3">موقع التخزين بالمخزن</th>
                    <th className="p-3">إجمالي الوارد</th>
                    <th className="p-3">الرصيد المتاح</th>
                    <th className="p-3">المنصرف</th>
                    <th className="p-3">حالة الرصيد</th>
                    <th className="p-3 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredInventory.map((item) => {
                    const isLow = item.availableQty <= item.minThreshold;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-all">
                        <td className="p-3">
                          {item.itemType === 'weapon' ? (
                            <span className="bg-amber-100 text-amber-900 border border-amber-200 text-[10px] font-extrabold px-2 py-0.5 rounded-lg flex items-center space-x-1 space-x-reverse w-fit">
                              <Crosshair className="w-3 h-3 text-amber-700" />
                              <span>سلاح</span>
                            </span>
                          ) : (
                            <span className="bg-blue-100 text-blue-900 border border-blue-200 text-[10px] font-extrabold px-2 py-0.5 rounded-lg flex items-center space-x-1 space-x-reverse w-fit">
                              <Flame className="w-3 h-3 text-blue-700" />
                              <span>ذخيرة</span>
                            </span>
                          )}
                        </td>
                        <td className="p-3 font-bold text-slate-900">{item.name}</td>
                        <td className="p-3 font-mono text-slate-600">{item.caliber}</td>
                        <td className="p-3 text-slate-600">{item.storageLocation}</td>
                        <td className="p-3 font-mono font-bold text-slate-800">{item.totalReceived.toLocaleString()}</td>
                        <td className="p-3 font-mono font-extrabold text-emerald-800">{item.availableQty.toLocaleString()}</td>
                        <td className="p-3 font-mono text-slate-500">{item.issuedQty.toLocaleString()}</td>
                        <td className="p-3">
                          {isLow ? (
                            <span className="bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-lg text-[10px] border border-rose-200 flex items-center space-x-1 space-x-reverse w-fit">
                              <AlertTriangle className="w-3 h-3 text-rose-600" />
                              <span>منخفض جـداً</span>
                            </span>
                          ) : (
                            <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-lg text-[10px] border border-emerald-200 w-fit">
                              رصيد آمن✓
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center space-x-1 space-x-reverse">
                            <button
                              type="button"
                              onClick={() => setEditingInventoryItem(item)}
                              title="تعديل بيانات الصنف والرصيد"
                              className="p-1.5 text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-all cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingInventoryItem(item)}
                              title="حذف الصنف نهائياً"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Individual Tracked Weapon Pieces Grid */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2 space-x-reverse">
                <Key className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-extrabold text-slate-900 font-['Tajawal']">
                  قطع الأسلحة الفردية المسجلة بالأرقام التسلسلية الفريدة ({weapons.length})
                </h3>
              </div>
              <button
                onClick={() => setShowAddWeaponModal(true)}
                className="text-xs text-amber-700 hover:text-amber-800 font-bold underline cursor-pointer"
              >
                + إضافة قطعة جديدة
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {weapons.map((w) => (
                <div key={w.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2 text-xs relative group">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-mono font-extrabold text-slate-900 text-sm bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                      {w.serialNumber}
                    </span>
                    <div className="flex items-center space-x-1.5 space-x-reverse">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          w.status === 'في المخزن'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : w.status === 'منصرف للفرد'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-rose-100 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {w.status}
                      </span>
                    </div>
                  </div>

                  <div className="font-bold text-slate-800">{w.weaponType}</div>
                  <div className="text-[11px] text-slate-500 flex items-center justify-between">
                    <span>العيار: {w.caliber}</span>
                    <span>سنة الصنع: {w.manufactureYear}</span>
                  </div>

                  {/* Interactive Technical Condition Selector */}
                  <div className="flex items-center justify-between bg-white border border-slate-200 rounded-lg p-1.5 text-[11px]">
                    <span className="font-bold text-slate-700">الجاهزية الفنية:</span>
                    <select
                      value={w.technicalCondition}
                      onChange={(e) => handleQuickConditionChange(w.id, e.target.value as any)}
                      className={`font-extrabold rounded-md px-2 py-0.5 text-[10px] cursor-pointer outline-none border transition-all ${
                        w.technicalCondition === 'جاهز'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : w.technicalCondition === 'تحتاج صيانة'
                          ? 'bg-amber-50 text-amber-800 border-amber-300'
                          : w.technicalCondition === 'غير جاهز'
                          ? 'bg-rose-50 text-rose-800 border-rose-300'
                          : 'bg-slate-100 text-slate-800 border-slate-300'
                      }`}
                    >
                      <option value="جاهز">جاهز ✓</option>
                      <option value="تحتاج صيانة">تحتاج صيانة 🛠️</option>
                      <option value="غير جاهز">غير جاهز ❌</option>
                      <option value="معطوبة">معطوبة ⚠️</option>
                    </select>
                  </div>

                  {w.status === 'منصرف للفرد' && w.currentHolderName && (
                    <div className="bg-white border border-amber-200 rounded-lg p-2 text-[11px] text-amber-950 font-medium">
                      <strong>المستلم حالياً:</strong> {w.currentHolderRank} / {w.currentHolderName} ({w.currentHolderUnit})
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 truncate max-w-[110px]" title={w.storageLocation}>
                      المكان: {w.storageLocation}
                    </span>
                    <div className="flex items-center space-x-1 space-x-reverse">
                      <button
                        type="button"
                        onClick={() => setEditingWeaponPiece(w)}
                        className="text-amber-700 hover:text-amber-900 font-bold flex items-center space-x-1 space-x-reverse bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200 cursor-pointer transition-all"
                        title="تعديل بيانات السلاح"
                      >
                        <Pencil className="w-3 h-3" />
                        <span>تعديل</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingWeaponPiece(w)}
                        className="text-rose-600 hover:text-rose-800 font-bold flex items-center space-x-1 space-x-reverse bg-rose-50 hover:bg-rose-100 px-2 py-0.5 rounded-md border border-rose-200 cursor-pointer transition-all"
                        title="حذف السلاح"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>حذف</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedLifecycleSerial(w.serialNumber);
                          setActiveTab('lifecycle');
                        }}
                        className="text-slate-600 font-bold hover:underline text-[10px] pr-1 cursor-pointer"
                      >
                        السيرة ➔
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* TAB 3: WEAPON & AMMO DISPENSE / ISSUE FORM */}
      {activeTab === 'dispense' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6 max-w-4xl mx-auto">
          
          <div className="border-b border-slate-200 pb-4 flex items-center justify-between">
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-md">
                <Crosshair className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 font-['Tajawal']">
                  نموذج إصدار وتوثيق أمر صرف سلاح وذخيرة
                </h3>
                <p className="text-xs text-slate-500">
                  خصم تلقائي لحظي من رصيد المخزون • ربط تلقائي بملف الفرد بالتمام والجاهزية
                </p>
              </div>
            </div>
            <span className="text-xs bg-amber-100 text-amber-900 border border-amber-300 font-bold px-3 py-1 rounded-full">
              خصم لحظي معتمد
            </span>
          </div>

          <form onSubmit={handleIssueSubmit} className="space-y-6 text-xs text-right">
            
            {/* Recipient Selection Section */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <TargetPersonnelSearchSelect
                personnel={personnel}
                selectedMilitaryId={issueRecipientMilitaryId}
                onSelect={(id) => setIssueRecipientMilitaryId(id)}
                label="١. اختر الفرد المستلم للسلاح/الذخيرة (ابحث بالاسم أو الرقم الوظيفي) *"
                placeholder="ابحث بالاسم، الرقم العسكري، الرتبة، الوحدة..."
              />

              {selectedRecipient && (
                <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-3 text-slate-700">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <img
                      src={selectedRecipient.photoUrl}
                      alt={selectedRecipient.fullName}
                      className="w-10 h-10 rounded-xl object-cover border border-slate-300"
                    />
                    <div>
                      <div className="font-extrabold text-slate-900">{selectedRecipient.rank} / {selectedRecipient.fullName}</div>
                      <div className="text-[11px] text-slate-500">الرقم الوظيفي: {selectedRecipient.militaryId} • الوحدة: {selectedRecipient.unit}</div>
                    </div>
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-emerald-200">
                    الحالة: {selectedRecipient.currentStatus}
                  </span>
                </div>
              )}
            </div>

            {/* Weapon & Ammo Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Weapon Choice */}
              <div className="space-y-3 bg-slate-50 border border-slate-200 p-4 rounded-2xl">
                <label className="block font-extrabold text-slate-900 font-['Tajawal']">
                  ٢. بيانات قطعة السلاح المراد صرفها (إدخال يدوي)
                </label>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">اسم / نوع صنف السلاح المصروف *</label>
                  <input
                    type="text"
                    required
                    list="weapon-types-list"
                    value={issueWeaponType}
                    onChange={(e) => {
                      setIssueWeaponType(e.target.value);
                      const matchType = weaponTypes.find((wt) => wt.name === e.target.value);
                      if (matchType) setIssueAmmoCaliber(matchType.defaultCaliber);
                    }}
                    placeholder="اكتب اسم أو نوع السلاح يدوياً (مثال: بندقية M4A1 5.56mm)..."
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-amber-500"
                  />
                  <datalist id="weapon-types-list">
                    {weaponTypes.map((wt) => (
                      <option key={wt.id} value={wt.name}>
                        {wt.name} ({wt.defaultCaliber})
                      </option>
                    ))}
                  </datalist>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    <span className="text-[10px] text-slate-400 font-bold self-center">أصناف سريعة:</span>
                    {weaponTypes.slice(0, 4).map((wt) => (
                      <button
                        key={wt.id}
                        type="button"
                        onClick={() => {
                          setIssueWeaponType(wt.name);
                          setIssueAmmoCaliber(wt.defaultCaliber);
                        }}
                        className="text-[10px] bg-white hover:bg-amber-100 text-slate-700 hover:text-amber-900 px-2 py-0.5 rounded border border-slate-200 transition-all font-medium"
                      >
                        + {wt.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">الرقم التسلسلي للسلاح (إدخال يدوي / أو حدد قطعة)</label>
                  <input
                    type="text"
                    value={issueWeaponSerial}
                    onChange={(e) => setIssueWeaponSerial(e.target.value)}
                    placeholder="مثال: M4-99801"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">في حال إدخال سيريال متاح بالمخزن سيتم ربطه بالفرد وتغيير حالته إلى منصرف</span>
                </div>
              </div>

              {/* Ammo Choice */}
              <div className="space-y-3 bg-slate-50 border border-slate-200 p-4 rounded-2xl">
                <label className="block font-extrabold text-slate-900 font-['Tajawal']">
                  ٣. بيانات الذخيرة المصاحبة والكمية (إدخال يدوي)
                </label>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">نوع / عيار الذخيرة المصاحبة *</label>
                  <input
                    type="text"
                    required
                    list="ammo-types-list"
                    value={issueAmmoType}
                    onChange={(e) => setIssueAmmoType(e.target.value)}
                    placeholder="اكتب عيار أو نوع الذخيرة يدوياً (مثال: طلقات 5.56x45mm NATO)..."
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-amber-500"
                  />
                  <datalist id="ammo-types-list">
                    {ammoTypes.map((at) => (
                      <option key={at.id} value={at.name}>
                        {at.name} - عيار {at.caliber}
                      </option>
                    ))}
                  </datalist>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    <span className="text-[10px] text-slate-400 font-bold self-center">عيارات سريعة:</span>
                    {ammoTypes.slice(0, 4).map((at) => (
                      <button
                        key={at.id}
                        type="button"
                        onClick={() => setIssueAmmoType(at.name)}
                        className="text-[10px] bg-white hover:bg-blue-100 text-slate-700 hover:text-blue-900 px-2 py-0.5 rounded border border-slate-200 transition-all font-medium"
                      >
                        + {at.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">الكمية المنصرفة بالطلقة *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={issueAmmoQty}
                    onChange={(e) => setIssueAmmoQty(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono text-slate-900 font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

            </div>

            {/* Order Details & Official Ref */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1">سبب الصرف والمهمة القتالية *</label>
                <input
                  type="text"
                  required
                  value={issueReason}
                  onChange={(e) => setIssueReason(e.target.value)}
                  placeholder="مثال: تسليح خط النار الأول لمهمة حراسة القطاع"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">رقم مرجع أمر الصرف الرسمي *</label>
                <input
                  type="text"
                  required
                  value={issueOrderRef}
                  onChange={(e) => setIssueOrderRef(e.target.value)}
                  placeholder="مثال: أمر إداري رقم 104/ت"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1">اسم الضابط/المسؤول عن الصرف *</label>
                <input
                  type="text"
                  required
                  value={issueResponsibleOfficer}
                  onChange={(e) => setIssueResponsibleOfficer(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">ملاحظات إضافية على حالة التسليم</label>
                <input
                  type="text"
                  value={issueNotes}
                  onChange={(e) => setIssueNotes(e.target.value)}
                  placeholder="مثال: تسليم عدد 6 مخازن طلقات ممتلئة"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <span className="text-slate-500 text-[11px] font-medium">
                بمجرد اعتماد الضغط سيتم خصم الكمية وإصدار سند الصرف فوراً
              </span>
              <button
                type="submit"
                className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold px-8 py-3 rounded-xl transition-all shadow-md text-xs font-['Tajawal']"
              >
                اعتماد الصرف وتوثيق السند وخصم المخزون ➔
              </button>
            </div>

          </form>
        </div>
      )}

      {/* TAB 4: PERMANENT ISSUANCE LOGS */}
      {activeTab === 'issueLogs' && (
        <div className="space-y-4">
          
          {/* Controls Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
            
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="البحث باسم المستلم، الرقم الوظيفي، رقم أمر الصرف، السلاح..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pr-9 pl-4 py-2 text-slate-800 focus:outline-none focus:bg-white focus:border-amber-500 font-medium"
              />
            </div>

            <div className="flex items-center space-x-2 space-x-reverse">
              <span className="text-slate-500 font-bold">تصفية حسب الوحدة:</span>
              <select
                value={selectedUnitFilter}
                onChange={(e) => setSelectedUnitFilter(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 font-bold text-slate-800 focus:outline-none"
              >
                <option value="الكل">جميع الوحدات والألوية</option>
                <option value="اللواء الأول">اللواء الأول</option>
                <option value="اللواء الثاني">اللواء الثاني</option>
                <option value="اللواء الثالث">اللواء الثالث</option>
                <option value="اللواء الرابع">اللواء الرابع</option>
                <option value="اللواء الخامس">اللواء الخامس</option>
              </select>
            </div>

          </div>

          {/* Logs Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-2 space-x-reverse">
                <FileText className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-extrabold text-slate-900 font-['Tajawal']">
                  سجل جميع عمليات الصرف المسجلة بالمخزن
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-semibold">إجمالي السجلات: {filteredIssues.length}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <tr>
                    <th className="p-3">رقم أمر الصرف</th>
                    <th className="p-3">التاريخ والوقت</th>
                    <th className="p-3">اسم المستلم والرقم الوظيفي</th>
                    <th className="p-3">الوحدة</th>
                    <th className="p-3">نوع السلاح / السيريال</th>
                    <th className="p-3">الذخيرة والكمية</th>
                    <th className="p-3">الحالة</th>
                    <th className="p-3 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredIssues.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50 transition-all">
                      <td className="p-3 font-mono font-bold text-amber-900">{order.orderNumber}</td>
                      <td className="p-3 text-slate-500 text-[11px]">{order.date}</td>
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{order.recipientRank} / {order.recipientName}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{order.recipientMilitaryId}</div>
                      </td>
                      <td className="p-3 text-slate-700">{order.unit}</td>
                      <td className="p-3">
                        <div className="font-bold text-slate-800">{order.weaponType}</div>
                        {order.weaponSerial && (
                          <div className="text-[10px] font-mono text-amber-800 font-bold">
                            S/N: {order.weaponSerial}
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="text-slate-800 font-medium">{order.ammoType}</div>
                        <div className="text-[11px] font-mono font-bold text-emerald-800">
                          {order.issuedAmmoQty.toLocaleString()} طلقة
                        </div>
                      </td>
                      <td className="p-3">
                        {order.status === 'نشط' ? (
                          <span className="bg-amber-100 text-amber-900 font-extrabold px-2 py-0.5 rounded-md text-[10px] border border-amber-300">
                            منصرف (نشط)
                          </span>
                        ) : (
                          <span className="bg-emerald-100 text-emerald-900 font-extrabold px-2 py-0.5 rounded-md text-[10px] border border-emerald-300">
                            تم الإرجاع✓
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center space-x-1.5 space-x-reverse">
                          <button
                            onClick={() => setShowPrintSlipModal(order)}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-2.5 py-1 rounded-lg text-[11px] border border-slate-300 flex items-center space-x-1 space-x-reverse"
                          >
                            <Printer className="w-3 h-3 text-slate-600" />
                            <span>طباعة السند</span>
                          </button>

                          {order.status === 'نشط' && (
                            <button
                              onClick={() => setShowReturnModal(order)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1 rounded-lg text-[11px] flex items-center space-x-1 space-x-reverse"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>إرجاع السلاح</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* TAB 5: WEAPON LIFECYCLE HISTORY */}
      {activeTab === 'lifecycle' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2 space-x-reverse flex-1">
              <Search className="w-4 h-4 text-slate-400" />
              <label className="font-bold text-slate-700 shrink-0">اختر أو أدخل الرقم التسلسلي للتدقيق:</label>
              <input
                type="text"
                value={selectedLifecycleSerial}
                onChange={(e) => setSelectedLifecycleSerial(e.target.value)}
                placeholder="أدخل سيريال السلاح لمشاهدة سيرته الكاملة (مثال: M4-99801)"
                className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-slate-900 font-mono font-bold focus:outline-none focus:border-amber-500 flex-1 max-w-sm"
              />
            </div>
            {selectedLifecycleSerial && (
              <button
                onClick={() => setSelectedLifecycleSerial('')}
                className="text-slate-500 hover:text-slate-800 font-bold underline"
              >
                إلغاء التصفية
              </button>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 space-x-reverse border-b border-slate-100 pb-3">
              <Layers className="w-5 h-5 text-amber-600" />
              <h3 className="text-sm font-extrabold text-slate-900 font-['Tajawal']">
                سجل حركة السلاح الفردي والتدقيق التاريخي ({selectedWeaponLifecycleEvents.length})
              </h3>
            </div>

            <div className="relative border-r-2 border-slate-200 mr-4 space-y-6 pr-6">
              {selectedWeaponLifecycleEvents.map((ev) => (
                <div key={ev.id} className="relative group">
                  <div className="absolute -right-[31px] top-1.5 w-4 h-4 rounded-full bg-amber-500 border-2 border-white ring-2 ring-amber-300" />
                  
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-900 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-md">
                        {ev.eventType}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">{ev.date}</span>
                    </div>

                    <div className="font-bold text-slate-900 font-mono pt-1">
                      السلاح: {ev.weaponType} (S/N: {ev.weaponSerial})
                    </div>

                    <p className="text-slate-700 leading-relaxed font-medium pt-1">
                      {ev.details}
                    </p>

                    <div className="text-[11px] text-slate-500 pt-1 flex items-center justify-between border-t border-slate-200/60 mt-2">
                      <span>الجهة/المسؤول: {ev.actor}</span>
                      <span>المستلم/الموقع: {ev.recipientOrUnit}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: CATEGORIES & CALIBERS MANAGEMENT */}
      {activeTab === 'config' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Weapon Types Config */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2 space-x-reverse">
                <Settings className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-extrabold text-slate-900 font-['Tajawal']">
                  إدارة أصناف وأنواع الأسلحة المعيارية
                </h3>
              </div>
              <button
                onClick={() => setShowAddTypeModal(true)}
                className="bg-amber-600 text-white font-bold px-3 py-1 rounded-xl text-xs flex items-center space-x-1 space-x-reverse"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة صنف</span>
              </button>
            </div>

            <div className="space-y-2">
              {weaponTypes.map((wt) => (
                <div key={wt.id} className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900 font-['Tajawal']">{wt.name}</span>
                    <span className="bg-slate-200 text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded-md font-mono">
                      {wt.defaultCaliber}
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px]">{wt.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Ammo Calibers Config */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2 space-x-reverse">
                <Flame className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-extrabold text-slate-900 font-['Tajawal']">
                  إدارة أنواع الذخائر والعيارات القياسية
                </h3>
              </div>
              <button
                onClick={() => setShowAddAmmoTypeModal(true)}
                className="bg-blue-600 text-white font-bold px-3 py-1 rounded-xl text-xs flex items-center space-x-1 space-x-reverse"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة عيار</span>
              </button>
            </div>

            <div className="space-y-2">
              {ammoTypes.map((at) => (
                <div key={at.id} className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900">{at.name}</div>
                    <div className="text-[10px] text-slate-500">التصنيف: {at.category}</div>
                  </div>
                  <span className="font-mono font-bold bg-blue-100 text-blue-900 border border-blue-200 px-2 py-1 rounded-lg text-[11px]">
                    {at.caliber}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* TAB 7: ARMAMENT REPORTS & PRINTING SYSTEM */}
      {activeTab === 'reports' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-200 pb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Printer className="w-6 h-6 text-amber-600" />
              <div>
                <h3 className="text-base font-black text-slate-900 font-['Tajawal']">
                  مركز التقارير والطباعة الرسمية لفرع التسليح
                </h3>
                <p className="text-xs text-slate-500">
                  توليد وطباعة التقارير الإلكترونية المعايرة لرصيد الأسلحة والذخائر والعهد الشخصية والتنبيهات الحية.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setPrintReportModalType('stock');
                setShowPrintArmamentReportModal(true);
              }}
              className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs flex items-center space-x-2 space-x-reverse shadow-md cursor-pointer transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>معاينة وطباعة التقرير الشامل (PDF)</span>
            </button>
          </div>

          {/* 4 Main Interactive Report Option Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            
            {/* Card 1 */}
            <div className="bg-amber-50/50 border border-amber-200 p-4 rounded-2xl space-y-3 hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="p-2 rounded-xl bg-amber-600 text-white font-bold"><Package className="w-4 h-4" /></span>
                  <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-md">
                    مباشر ومحدث
                  </span>
                </div>
                <h4 className="font-extrabold text-slate-900 font-['Tajawal'] text-sm mt-3">
                  1. تقرير رصيد المخزون الشامل
                </h4>
                <p className="text-slate-600 mt-1 leading-relaxed text-[11px]">
                  طباعة بيان تفصيلي كامل برصيد القطع الـ 12 المحددة والأسلحة المخزنية والمنصرفة عهد والجاهزية القتالية.
                </p>
              </div>
              <button
                onClick={() => {
                  setPrintReportModalType('stock');
                  setShowPrintArmamentReportModal(true);
                }}
                className="w-full mt-3 bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-1.5 space-x-reverse"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>معاينة وطباعة تقرير المخزون</span>
              </button>
            </div>

            {/* Card 2 */}
            <div className="bg-rose-50/50 border border-rose-200 p-4 rounded-2xl space-y-3 hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="p-2 rounded-xl bg-rose-700 text-white font-bold"><AlertTriangle className="w-4 h-4" /></span>
                  <span className="text-[10px] font-mono font-bold bg-rose-100 text-rose-900 border border-rose-300 px-2 py-0.5 rounded-md">
                    تنبيهات حرجة
                  </span>
                </div>
                <h4 className="font-extrabold text-slate-900 font-['Tajawal'] text-sm mt-3">
                  2. الأصناف وشيكة النفاد
                </h4>
                <p className="text-slate-600 mt-1 leading-relaxed text-[11px]">
                  طباعة بيان حصر بجميع الذخائر والأسلحة التي انخفض رصيدها عن حد الأمان أو تحتاج صيانة وتزويد عاجل.
                </p>
              </div>
              <button
                onClick={() => {
                  setPrintReportModalType('low_stock');
                  setShowPrintArmamentReportModal(true);
                }}
                className="w-full mt-3 bg-rose-700 hover:bg-rose-800 text-white font-bold py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-1.5 space-x-reverse"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>طباعة كشف التنبيهات والطلبات</span>
              </button>
            </div>

            {/* Card 3 */}
            <div className="bg-slate-100/70 border border-slate-200 p-4 rounded-2xl space-y-3 hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="p-2 rounded-xl bg-slate-900 text-white font-bold"><Layers className="w-4 h-4" /></span>
                  <span className="text-[10px] font-mono font-bold bg-slate-200 text-slate-800 border border-slate-300 px-2 py-0.5 rounded-md">
                    سجلات رسمية
                  </span>
                </div>
                <h4 className="font-extrabold text-slate-900 font-['Tajawal'] text-sm mt-3">
                  3. حركة الوارد والصادر
                </h4>
                <p className="text-slate-600 mt-1 leading-relaxed text-[11px]">
                  تقرير شامل بجميع استلامات التوريد من الهيئة والتسليمات والعهد المنصرفة والمستعادة بالمخزن.
                </p>
              </div>
              <button
                onClick={() => {
                  setPrintReportModalType('movement');
                  setShowPrintArmamentReportModal(true);
                }}
                className="w-full mt-3 bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-1.5 space-x-reverse"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>توليد تقرير الحركة الكلية</span>
              </button>
            </div>

            {/* Card 4 */}
            <div className="bg-emerald-50/50 border border-emerald-200 p-4 rounded-2xl space-y-3 hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="p-2 rounded-xl bg-emerald-700 text-white font-bold"><Users className="w-4 h-4" /></span>
                  <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded-md">
                    عهد الأفراد
                  </span>
                </div>
                <h4 className="font-extrabold text-slate-900 font-['Tajawal'] text-sm mt-3">
                  4. كشف تسليح الأفراد
                </h4>
                <p className="text-slate-600 mt-1 leading-relaxed text-[11px]">
                  طباعة كشف الجاهزية النارية للأفراد والقطع المسلمة والسيريال والذخيرة والجعبة والخوذة وحالة الفرد.
                </p>
              </div>
              <button
                onClick={() => {
                  setPrintReportModalType('personnel');
                  setShowPrintArmamentReportModal(true);
                }}
                className="w-full mt-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-1.5 space-x-reverse"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>طباعة كشف تسليح الأفراد</span>
              </button>
            </div>

          </div>

          {/* On-Screen Live Real Inventory Preview Box */}
          <div className="border border-slate-300 rounded-2xl p-5 bg-slate-50 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center space-x-2 space-x-reverse">
                <FileText className="w-5 h-5 text-amber-600" />
                <h4 className="font-extrabold text-slate-900 font-['Tajawal'] text-sm">
                  معاينة حية لبيانات مخزون التسليح الحقيقي بالمستودع ({inventory.length + TARGET_SPECIFIED_WEAPONS.length} صنف)
                </h4>
              </div>
              <button
                onClick={() => {
                  setPrintReportModalType('stock');
                  setShowPrintArmamentReportModal(true);
                }}
                className="text-amber-800 hover:text-amber-900 font-bold text-xs underline flex items-center space-x-1 space-x-reverse"
              >
                <span>فتح النافذة القابلة للطباعة 🖨️</span>
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-xs">
              <table className="w-full text-xs text-right border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                    <th className="p-2.5 border-l border-slate-200">صنف السلاح / الأثر</th>
                    <th className="p-2.5 border-l border-slate-200">التصنيف</th>
                    <th className="p-2.5 border-l border-slate-200">العيار المعياري</th>
                    <th className="p-2.5 border-l border-slate-200 text-center">المتوسط المقدر</th>
                    <th className="p-2.5 border-l border-slate-200 text-center">المتوفر بالمخزن</th>
                    <th className="p-2.5 border-l border-slate-200 text-center">المنصرف كعهدة</th>
                    <th className="p-2.5 text-center">حالة الجاهزية</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {TARGET_SPECIFIED_WEAPONS.map((targetW) => (
                    <tr key={targetW.name} className="hover:bg-slate-50/70">
                      <td className="p-2.5 border-l border-slate-100 font-bold text-slate-900 flex items-center space-x-2 space-x-reverse">
                        <span>{targetW.icon}</span>
                        <span>{targetW.name}</span>
                      </td>
                      <td className="p-2.5 border-l border-slate-100 text-slate-600">{targetW.category}</td>
                      <td className="p-2.5 border-l border-slate-100 font-mono text-slate-800">{targetW.defaultCaliber}</td>
                      <td className="p-2.5 border-l border-slate-100 text-center font-mono font-bold text-slate-700">50</td>
                      <td className="p-2.5 border-l border-slate-100 text-center font-mono font-black text-emerald-700">38</td>
                      <td className="p-2.5 border-l border-slate-100 text-center font-mono font-bold text-blue-700">12</td>
                      <td className="p-2.5 text-center font-bold">
                        <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-md text-[10px]">
                          جاهز للعمليات
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => {
                  setPrintReportModalType('stock');
                  setShowPrintArmamentReportModal(true);
                }}
                className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold px-6 py-2 rounded-xl text-xs flex items-center space-x-2 space-x-reverse shadow-md cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة التقرير الرسمي إلكترونياً (PDF)</span>
              </button>
            </div>
          </div>

        </div>
      )}

      {/* TAB 8: STATISTICAL ANALYTICS PANEL */}
      {activeTab === 'analytics' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-200 pb-3 flex items-center space-x-2 space-x-reverse">
            <BarChart3 className="w-5 h-5 text-amber-600" />
            <h3 className="text-base font-black text-slate-900 font-['Tajawal']">
              لوحة الإحصائيات التحليلية ومعدلات الاستهلاك الناري
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            
            {/* Chart 1: Most Issued Weapons */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <h4 className="font-bold text-slate-900 font-['Tajawal']">أكثر الأسلحة استخداماً وصرفاً بالميدان</h4>
              <div className="space-y-2">
                {[
                  { name: 'بندقية M4A1 5.56mm', pct: 78, count: '120 قطعة' },
                  { name: 'مسدس غلوك 19 9mm', pct: 45, count: '38 قطعة' },
                  { name: 'رشاش ميني مي M249', pct: 25, count: '15 قطعة' },
                  { name: 'قناصة دراغونوف SVD', pct: 18, count: '8 قطع' }
                ].map((item) => (
                  <div key={item.name} className="space-y-1">
                    <div className="flex justify-between font-bold text-slate-800">
                      <span>{item.name}</span>
                      <span className="font-mono text-amber-700">{item.count}</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-amber-600 h-full rounded-full" style={{ width: `${item.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chart 2: Ammo Consumption Velocity */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <h4 className="font-bold text-slate-900 font-['Tajawal']">معدل الاستهلاك الشهري للذخائر حسب العيار</h4>
              <div className="space-y-2">
                {[
                  { name: 'ذخيرة حية 5.56mm NATO', pct: 85, qty: '35,000 طلقة' },
                  { name: 'ذخيرة حية 9mm Parabellum', pct: 35, qty: '7,000 طلقة' },
                  { name: 'قذائف RPG-7 مضادة للدروع', pct: 60, qty: '380 قذيفة' }
                ].map((item) => (
                  <div key={item.name} className="space-y-1">
                    <div className="flex justify-between font-bold text-slate-800">
                      <span>{item.name}</span>
                      <span className="font-mono text-blue-700">{item.qty}</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-blue-600 h-full rounded-full" style={{ width: `${item.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* --- MODAL DIALOGS --- */}

      {/* Add Intake Modal */}
      {showAddIntakeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-slate-900 text-base font-['Tajawal']">تسجيل واردات جديدة إلى مخزن التسليح</h3>
              <button onClick={() => setShowAddIntakeModal(false)} className="text-slate-400 hover:text-slate-700 font-bold">✕</button>
            </div>

            <form onSubmit={handleIntakeSubmit} className="space-y-3 text-xs text-right">
              <div>
                <label className="block text-slate-700 font-bold mb-1">نوع الصنف الوارد *</label>
                <div className="flex space-x-3 space-x-reverse">
                  <button
                    type="button"
                    onClick={() => setIntakeItemType('weapon')}
                    className={`flex-1 py-2 rounded-xl font-bold border transition-all ${
                      intakeItemType === 'weapon' ? 'bg-amber-600 text-white border-amber-600' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    سلاح / قطعة هجومية
                  </button>
                  <button
                    type="button"
                    onClick={() => setIntakeItemType('ammo')}
                    className={`flex-1 py-2 rounded-xl font-bold border transition-all ${
                      intakeItemType === 'ammo' ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    ذخيرة حية / قذائف
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">اسم الصنف *</label>
                <input
                  type="text"
                  required
                  value={intakeName}
                  onChange={(e) => setIntakeName(e.target.value)}
                  placeholder="مثال: بندقية M4A1 أو ذخيرة 5.56mm"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">العيار *</label>
                  <input
                    type="text"
                    required
                    value={intakeCaliber}
                    onChange={(e) => setIntakeCaliber(e.target.value)}
                    placeholder="مثال: 5.56×45mm NATO"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">الكمية الواردة *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={intakeQty}
                    onChange={(e) => setIntakeQty(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono text-slate-900 font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">مصدر التوريد والجهة *</label>
                <input
                  type="text"
                  required
                  value={intakeSource}
                  onChange={(e) => setIntakeSource(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">رقم الدفعة/الشحنة</label>
                  <input
                    type="text"
                    value={intakeBatch}
                    onChange={(e) => setIntakeBatch(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {intakeItemType === 'ammo' && (
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">تاريخ انتهاء الصلاحية</label>
                    <input
                      type="date"
                      value={intakeExpiryDate}
                      onChange={(e) => setIntakeExpiryDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-extrabold py-2.5 rounded-xl transition-all shadow-md font-['Tajawal']"
              >
                تسجيل الوارد وإضافته للمخزون
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Weapon Piece Modal */}
      {showAddWeaponModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-slate-900 text-base font-['Tajawal']">تسجيل قطعة سلاح برقم تسلسلي فريد</h3>
              <button onClick={() => setShowAddWeaponModal(false)} className="text-slate-400 hover:text-slate-700 font-bold">✕</button>
            </div>

            <form onSubmit={handleWeaponPieceSubmit} className="space-y-3 text-xs text-right">
              <div>
                <label className="block text-slate-700 font-bold mb-1">الرقم التسلسلي للسلاح (Serial Number) *</label>
                <input
                  type="text"
                  required
                  value={pieceSerial}
                  onChange={(e) => setPieceSerial(e.target.value)}
                  placeholder="مثال: M4-99805"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono text-slate-900 font-extrabold focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">نوع السلاح (إدخال يدوي) *</label>
                <input
                  type="text"
                  required
                  list="weapon-types-list"
                  value={pieceWeaponType}
                  onChange={(e) => setPieceWeaponType(e.target.value)}
                  placeholder="اكتب نوع صنف السلاح يدوياً..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">العيار</label>
                  <input
                    type="text"
                    value={pieceCaliber}
                    onChange={(e) => setPieceCaliber(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">سنة التصنيع</label>
                  <input
                    type="text"
                    value={pieceYear}
                    onChange={(e) => setPieceYear(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">الحالة الفنية للقطعة *</label>
                <select
                  value={pieceCondition}
                  onChange={(e) => setPieceCondition(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                >
                  <option value="جاهز">جاهز للعمليات القتالية</option>
                  <option value="تحتاج صيانة">تحتاج صيانة دورية</option>
                  <option value="غير جاهز">غير جاهز</option>
                  <option value="معطوبة">معطوبة/تالفة</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">مكان التخزين بالمخزن *</label>
                <input
                  type="text"
                  required
                  value={pieceLocation}
                  onChange={(e) => setPieceLocation(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-extrabold py-2.5 rounded-xl transition-all shadow-md font-['Tajawal']"
              >
                تسجيل السلاح وحفظه بالسجل
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Return Modal */}
      {showReturnModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-slate-900 text-base font-['Tajawal']">إرجاع وإعادة السلاح للمخزن</h3>
              <button onClick={() => setShowReturnModal(null)} className="text-slate-400 hover:text-slate-700 font-bold">✕</button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl space-y-1 text-xs">
              <div className="font-bold text-slate-900">أمر الصرف: {showReturnModal.orderNumber}</div>
              <div className="text-slate-600">المستلم: {showReturnModal.recipientRank} / {showReturnModal.recipientName}</div>
              <div className="text-slate-600">السلاح: {showReturnModal.weaponType} (S/N: {showReturnModal.weaponSerial || '-'})</div>
              <div className="text-emerald-800 font-bold">الذخيرة المعاد إرجاعها: {showReturnModal.issuedAmmoQty} طلقة</div>
            </div>

            <form onSubmit={handleReturnSubmit} className="space-y-3 text-xs text-right">
              <div>
                <label className="block text-slate-700 font-bold mb-1">ملاحظات الفحص عند الإعادة *</label>
                <input
                  type="text"
                  required
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-2.5 rounded-xl transition-all shadow-md font-['Tajawal']"
              >
                تأكيد الاستلام وإعادة السلاح والرصيد للمخزن
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Print Slip Modal */}
      {showPrintSlipModal && createPortal(
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 print:p-0 print:bg-white print:static printable-modal-overlay">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-8 shadow-2xl space-y-6 font-['Cairo',sans-serif] print:border-none print:shadow-none print:p-0 print:m-0 print:w-full printable-modal-card">
            
            {/* Header */}
            <div className="text-center border-b-2 border-slate-900 pb-4 space-y-1">
              <div className="text-base font-black text-slate-900 font-['Tajawal']">قوات الطوارى اليمنية</div>
              <div className="text-xs font-black text-slate-800">الفرقه الثالثة - قيادة فرع التسليح والذخائر</div>
              <div className="text-xs font-bold text-slate-600">{currentAccountName}</div>
              <div className="text-base font-black text-amber-700 font-['Tajawal'] pt-2">سند أمر صرف سلاح وذخيرة رسمية</div>
              <div className="text-xs text-slate-500 font-mono">رقم السند: {showPrintSlipModal.orderNumber} • التاريخ: {showPrintSlipModal.date}</div>
            </div>

            {/* Content Details */}
            <div className="grid grid-cols-2 gap-4 text-xs border border-slate-300 p-4 rounded-xl bg-slate-50">
              <div><strong>اسم المستلم:</strong> {showPrintSlipModal.recipientRank} / {showPrintSlipModal.recipientName}</div>
              <div><strong>الرقم الوظيفي:</strong> {showPrintSlipModal.recipientMilitaryId}</div>
              <div><strong>الوحدة / الكتيبة:</strong> {showPrintSlipModal.unit}</div>
              <div><strong>الجهة الآمرة:</strong> {showPrintSlipModal.orderReference}</div>
              <div><strong>نوع السلاح:</strong> {showPrintSlipModal.weaponType}</div>
              <div><strong>الرقم التسلسلي للسلاح:</strong> {showPrintSlipModal.weaponSerial || 'سلاح صنف بدون سيريال'}</div>
              <div><strong>نوع الذخيرة والعيار:</strong> {showPrintSlipModal.ammoType} ({showPrintSlipModal.ammoCaliber})</div>
              <div><strong>الكمية المنصرفة:</strong> {showPrintSlipModal.issuedAmmoQty} طلقة/قذيفة</div>
            </div>

            <div className="text-xs text-slate-700 space-y-1">
              <p><strong>سبب الصرف والمهمة:</strong> {showPrintSlipModal.issueReason}</p>
              <p><strong>ضابط التسليح المسؤول:</strong> {showPrintSlipModal.responsibleOfficer}</p>
              <p><strong>ملاحظات التسليم:</strong> {showPrintSlipModal.notes || 'تسليم رسمي معتمد مع اكتمال معايير الأمان'}</p>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-8 text-xs font-bold text-slate-900 pt-6 border-t border-slate-200 text-center signature-block">
              <div>
                <p>توقيع وضغطة المستلم</p>
                <p className="text-slate-400 mt-6">............................................</p>
              </div>
              <div>
                <p>توقيع وضابط التسليح والذخائر</p>
                <p className="text-slate-400 mt-6">............................................</p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-4 flex items-center justify-between border-t border-slate-200 print:hidden no-print">
              <button
                onClick={() => setShowPrintSlipModal(null)}
                className="bg-slate-200 text-slate-800 font-bold px-4 py-2 rounded-xl text-xs cursor-pointer"
              >
                إغلاق النافذة
              </button>
              <button
                onClick={() => window.print()}
                className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold px-6 py-2 rounded-xl text-xs shadow-md flex items-center space-x-1.5 space-x-reverse cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة السند الرسمي</span>
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

      {/* Turn-In Equipment Slip Modal (سند استلام وتوريد عهدة سلاح وعتاد رسمية) */}
      {showTurnInSlipModal && createPortal(
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 print:p-0 print:bg-white print:static printable-modal-overlay">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-8 shadow-2xl space-y-6 font-['Cairo',sans-serif] print:border-none print:shadow-none print:p-0 print:m-0 print:w-full printable-modal-card">
            
            {/* Header */}
            <div className="text-center border-b-2 border-slate-900 pb-4 space-y-1">
              <div className="text-base font-black text-slate-900 font-['Tajawal']">قوات الطوارى اليمنية</div>
              <div className="text-xs font-black text-slate-800">الفرقه الثالثة - قيادة فرع التسليح والذخائر</div>
              <div className="text-xs font-bold text-slate-600">{currentAccountName || 'المستودع الرئيسي'}</div>
              <div className="text-base font-black text-emerald-700 font-['Tajawal'] pt-2">
                سند استلام وتوريد عهدة سلاح وعتاد رسمية
              </div>
              <div className="text-xs text-slate-500 font-mono">
                رقم سند التوريد: {showTurnInSlipModal.receiptNumber} • التاريخ والوقت: {showTurnInSlipModal.date}
              </div>
            </div>

            {/* Content Details */}
            <div className="grid grid-cols-2 gap-4 text-xs border border-slate-300 p-4 rounded-xl bg-slate-50">
              <div><strong>اسم الفرد المورد:</strong> {showTurnInSlipModal.personnelRank} / {showTurnInSlipModal.personnelName}</div>
              <div><strong>الرقم العسكري:</strong> {showTurnInSlipModal.personnelMilitaryId}</div>
              <div><strong>الوحدة / الكتيبة:</strong> {showTurnInSlipModal.unit}</div>
              <div><strong>حالة الفرد المورد:</strong> <span className="font-bold text-amber-900">{showTurnInSlipModal.personnelStatus}</span></div>
              <div><strong>نوع قطعة السلاح:</strong> {showTurnInSlipModal.weaponType}</div>
              <div><strong>الرقم التسلسلي للسلاح:</strong> <span className="font-mono font-bold text-amber-900">{showTurnInSlipModal.weaponSerial || 'بدون سيريال'}</span></div>
              <div><strong>الحالة الفنية للسلاح:</strong> <span className="font-bold text-emerald-800">{showTurnInSlipModal.weaponCondition}</span></div>
              <div><strong>عدد الذخيرة المستعادة:</strong> {showTurnInSlipModal.ammoQty} طلقة</div>
              <div><strong>عدد المخازن المستعادة:</strong> {showTurnInSlipModal.magazinesCount} مخزن</div>
              <div><strong>ملحقات العهدة:</strong> {showTurnInSlipModal.vest ? 'جعبة (تم الاستعادة)' : 'جعبة (لم تستعاد)'} • {showTurnInSlipModal.helmet ? 'خوذة (تم الاستعادة)' : 'خوذة (لم تستعاد)'}</div>
            </div>

            <div className="text-xs text-slate-700 space-y-1 bg-amber-50/60 border border-amber-200 p-3 rounded-xl">
              <p><strong>الضابط/المسؤول المستلم:</strong> {showTurnInSlipModal.receivingOfficer}</p>
              <p><strong>ملاحظات التوريد وحالة التسليم:</strong> {showTurnInSlipModal.notes || 'تم الفحص والتوريد بنجاح وتقييد الاستعادة بملف الفرد'}</p>
              <p className="text-[11px] text-emerald-800 font-bold pt-1">✅ تم تحديث سجّلات المخزون والملف الإلكتروني للفرد وتقييد عملية التوريد بنجاح.</p>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-8 text-xs font-bold text-slate-900 pt-6 border-t border-slate-200 text-center signature-block">
              <div>
                <p>توقيع وضغطة الفرد المورد</p>
                <p className="text-slate-400 mt-6">............................................</p>
              </div>
              <div>
                <p>توقيع وضابط التسليح المستلم</p>
                <p className="text-slate-400 mt-6">............................................</p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-4 flex items-center justify-between border-t border-slate-200 print:hidden no-print">
              <button
                onClick={() => setShowTurnInSlipModal(null)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-4 py-2 rounded-xl text-xs cursor-pointer"
              >
                إغلاق النافذة
              </button>
              <button
                onClick={() => window.print()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-6 py-2 rounded-xl text-xs shadow-md flex items-center space-x-1.5 space-x-reverse cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة السند الرسمي (PDF)</span>
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

      {/* Add Weapon Type Modal */}
      {showAddTypeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-slate-900 text-base font-['Tajawal']">إضافة صنف سلاح معياري جديد</h3>
              <button onClick={() => setShowAddTypeModal(false)} className="text-slate-400 hover:text-slate-700 font-bold">✕</button>
            </div>

            <form onSubmit={handleAddWeaponType} className="space-y-3 text-xs text-right">
              <div>
                <label className="block text-slate-700 font-bold mb-1">اسم صنف السلاح *</label>
                <input
                  type="text"
                  required
                  value={newTypeName}
                  onChange={(e) => setNewTypeName(e.target.value)}
                  placeholder="مثال: بندقية قنص هتك HECATE"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">العيار القياسي للصنف</label>
                <input
                  type="text"
                  value={newTypeCaliber}
                  onChange={(e) => setNewTypeCaliber(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono text-slate-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">الوصف والاستخدام</label>
                <input
                  type="text"
                  value={newTypeDesc}
                  onChange={(e) => setNewTypeDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-extrabold py-2.5 rounded-xl transition-all font-['Tajawal']"
              >
                حفظ وإضافة الصنف
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Ammo Type Modal */}
      {showAddAmmoTypeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-slate-900 text-base font-['Tajawal']">إضافة نوع عيار ذخيرة جديد</h3>
              <button onClick={() => setShowAddAmmoTypeModal(false)} className="text-slate-400 hover:text-slate-700 font-bold">✕</button>
            </div>

            <form onSubmit={handleAddAmmoType} className="space-y-3 text-xs text-right">
              <div>
                <label className="block text-slate-700 font-bold mb-1">اسم نوع الذخيرة *</label>
                <input
                  type="text"
                  required
                  value={newAmmoName}
                  onChange={(e) => setNewAmmoName(e.target.value)}
                  placeholder="مثال: ذخيرة حية خوارق 12.7mm"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">العيار *</label>
                <input
                  type="text"
                  required
                  value={newAmmoCaliber}
                  onChange={(e) => setNewAmmoCaliber(e.target.value)}
                  placeholder="مثال: 12.7×99mm NATO"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono text-slate-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-2.5 rounded-xl transition-all font-['Tajawal']"
              >
                حفظ وإضافة الذخيرة
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Weapon Piece Modal */}
      {editingWeaponPiece && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-right my-8">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2 space-x-reverse">
                <Edit3 className="w-5 h-5 text-amber-600" />
                <h3 className="font-extrabold text-slate-900 text-base font-['Tajawal']">
                  تعديل بيانات وجاهزية قطعة السلاح ({editingWeaponPiece.serialNumber})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingWeaponPiece(null)}
                className="text-slate-400 hover:text-slate-700 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveWeaponPiece} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">نوع السلاح *</label>
                  <input
                    type="text"
                    required
                    value={editingWeaponPiece.weaponType}
                    onChange={(e) =>
                      setEditingWeaponPiece({ ...editingWeaponPiece, weaponType: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">الرقم التسلسلي (S/N) *</label>
                  <input
                    type="text"
                    required
                    value={editingWeaponPiece.serialNumber}
                    onChange={(e) =>
                      setEditingWeaponPiece({ ...editingWeaponPiece, serialNumber: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">العيار *</label>
                  <input
                    type="text"
                    required
                    value={editingWeaponPiece.caliber}
                    onChange={(e) =>
                      setEditingWeaponPiece({ ...editingWeaponPiece, caliber: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">سنة الصنع</label>
                  <input
                    type="text"
                    value={editingWeaponPiece.manufactureYear}
                    onChange={(e) =>
                      setEditingWeaponPiece({ ...editingWeaponPiece, manufactureYear: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">الحالة الفنية / الجاهزية *</label>
                  <select
                    value={editingWeaponPiece.technicalCondition}
                    onChange={(e) =>
                      setEditingWeaponPiece({
                        ...editingWeaponPiece,
                        technicalCondition: e.target.value as any
                      })
                    }
                    className="w-full bg-amber-50 border border-amber-300 rounded-xl px-3 py-2 font-bold text-amber-950 focus:outline-none focus:border-amber-500"
                  >
                    <option value="جاهز">جاهز للعمليات القتالية ✓</option>
                    <option value="تحتاج صيانة">تحتاج صيانة دورية 🛠️</option>
                    <option value="غير جاهز">غير جاهز ❌</option>
                    <option value="معطوبة">معطوبة / تالفة ⚠️</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">حالة الاستخدام / التواجد *</label>
                  <select
                    value={editingWeaponPiece.status}
                    onChange={(e) =>
                      setEditingWeaponPiece({
                        ...editingWeaponPiece,
                        status: e.target.value as any
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                  >
                    <option value="في المخزن">في المخزن المركزى</option>
                    <option value="منصرف للفرد">منصرف للفرد الميداني</option>
                    <option value="في الصيانة">في ورشة الصيانة</option>
                    <option value="مستبعد">مستبعد من الخدمة</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">موقع التخزين بالمخزن *</label>
                <input
                  type="text"
                  required
                  value={editingWeaponPiece.storageLocation}
                  onChange={(e) =>
                    setEditingWeaponPiece({ ...editingWeaponPiece, storageLocation: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">ملاحظات الفحص والجاهزية</label>
                <textarea
                  rows={2}
                  value={editingWeaponPiece.notes || ''}
                  onChange={(e) =>
                    setEditingWeaponPiece({ ...editingWeaponPiece, notes: e.target.value })
                  }
                  placeholder="ملاحظات فنية عن حالة السلاح..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div className="flex items-center space-x-2 space-x-reverse pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-extrabold py-2.5 rounded-xl transition-all shadow-md font-['Tajawal'] flex items-center justify-center space-x-1.5 space-x-reverse cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>حفظ التعديلات وتحديث الجاهزية</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditingWeaponPiece(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Weapon Piece Confirmation Modal */}
      {deletingWeaponPiece && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-rose-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-right">
            <div className="flex items-center space-x-3 space-x-reverse text-rose-700 border-b border-slate-100 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center font-bold">
                <Trash2 className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base font-['Tajawal']">
                  حذف بيانات قطعة سلاح
                </h3>
                <p className="text-xs text-rose-600 font-medium">تحذير: هذا الإجراء لا يمكن التراجع عنه!</p>
              </div>
            </div>

            <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 text-xs text-slate-800 space-y-2">
              <div>
                <strong className="text-slate-900">نوع السلاح:</strong> {deletingWeaponPiece.weaponType}
              </div>
              <div>
                <strong className="text-slate-900">الرقم التسلسلي (S/N):</strong>{' '}
                <span className="font-mono font-bold text-rose-900">{deletingWeaponPiece.serialNumber}</span>
              </div>
              <div>
                <strong className="text-slate-900">العيار:</strong> {deletingWeaponPiece.caliber}
              </div>
              <div>
                <strong className="text-slate-900">موقع التخزين:</strong> {deletingWeaponPiece.storageLocation}
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              هل أنت متأكد من رغبتك في حذف قطعة السلاح هذه نهائياً من مستودع التسليح المركزي؟
            </p>

            <div className="flex items-center space-x-2 space-x-reverse pt-2">
              <button
                type="button"
                onClick={handleDeleteWeaponPiece}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-extrabold py-2.5 rounded-xl transition-all shadow-md font-['Tajawal'] flex items-center justify-center space-x-1.5 space-x-reverse cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>تأكيد الحذف النهائي</span>
              </button>
              <button
                type="button"
                onClick={() => setDeletingWeaponPiece(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Inventory Item Modal */}
      {editingInventoryItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-right my-8">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2 space-x-reverse">
                <Edit3 className="w-5 h-5 text-amber-600" />
                <h3 className="font-extrabold text-slate-900 text-base font-['Tajawal']">
                  تعديل بيانات صنف المخزون المركزى
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingInventoryItem(null)}
                className="text-slate-400 hover:text-slate-700 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveInventoryItem} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">اسم الصنف (سلاح / ذخيرة) *</label>
                <input
                  type="text"
                  required
                  value={editingInventoryItem.name}
                  onChange={(e) =>
                    setEditingInventoryItem({ ...editingInventoryItem, name: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">نوع الصنف *</label>
                  <select
                    value={editingInventoryItem.itemType}
                    onChange={(e) =>
                      setEditingInventoryItem({
                        ...editingInventoryItem,
                        itemType: e.target.value as any
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                  >
                    <option value="weapon">سلاح</option>
                    <option value="ammo">ذخيرة</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">العيار / التصنيف *</label>
                  <input
                    type="text"
                    required
                    value={editingInventoryItem.caliber}
                    onChange={(e) =>
                      setEditingInventoryItem({ ...editingInventoryItem, caliber: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">إجمالي الوارد بالرصيد *</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={editingInventoryItem.totalReceived}
                    onChange={(e) =>
                      setEditingInventoryItem({
                        ...editingInventoryItem,
                        totalReceived: parseInt(e.target.value) || 0
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">الرصيد المتاح حالياً *</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={editingInventoryItem.availableQty}
                    onChange={(e) =>
                      setEditingInventoryItem({
                        ...editingInventoryItem,
                        availableQty: parseInt(e.target.value) || 0
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono font-bold text-emerald-800 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">الحد أدنى للتنبيه *</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={editingInventoryItem.minThreshold}
                    onChange={(e) =>
                      setEditingInventoryItem({
                        ...editingInventoryItem,
                        minThreshold: parseInt(e.target.value) || 0
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">موقع التخزين بالمخزن *</label>
                  <input
                    type="text"
                    required
                    value={editingInventoryItem.storageLocation}
                    onChange={(e) =>
                      setEditingInventoryItem({
                        ...editingInventoryItem,
                        storageLocation: e.target.value
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 space-x-reverse pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-extrabold py-2.5 rounded-xl transition-all shadow-md font-['Tajawal'] flex items-center justify-center space-x-1.5 space-x-reverse cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>حفظ التعديلات</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditingInventoryItem(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Inventory Item Confirmation Modal */}
      {deletingInventoryItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-rose-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-right">
            <div className="flex items-center space-x-3 space-x-reverse text-rose-700 border-b border-slate-100 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center font-bold">
                <Trash2 className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base font-['Tajawal']">
                  حذف صنف من المخزون
                </h3>
                <p className="text-xs text-rose-600 font-medium">تحذير: سيتم مسح هذا الصنف من سجلات المخزون!</p>
              </div>
            </div>

            <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 text-xs text-slate-800 space-y-1">
              <div><strong className="text-slate-900">اسم الصنف:</strong> {deletingInventoryItem.name}</div>
              <div><strong className="text-slate-900">العيار / النوع:</strong> {deletingInventoryItem.caliber}</div>
              <div><strong className="text-slate-900">الرصيد المتاح:</strong> {deletingInventoryItem.availableQty}</div>
              <div><strong className="text-slate-900">موقع التخزين:</strong> {deletingInventoryItem.storageLocation}</div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              هل أنت متأكد من رغبتك في حذف هذا الصنف من قائمة رصيد المخزون المركزي؟
            </p>

            <div className="flex items-center space-x-2 space-x-reverse pt-2">
              <button
                type="button"
                onClick={handleDeleteInventoryItem}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-extrabold py-2.5 rounded-xl transition-all shadow-md font-['Tajawal'] flex items-center justify-center space-x-1.5 space-x-reverse cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>تأكيد حذف الصنف</span>
              </button>
              <button
                type="button"
                onClick={() => setDeletingInventoryItem(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Armament Official Reports Modal */}
      <ArmamentReportPrintModal
        isOpen={showPrintArmamentReportModal}
        onClose={() => setShowPrintArmamentReportModal(false)}
        initialReportType={printReportModalType}
        currentAccountName={currentAccountName}
        inventory={inventory}
        weapons={weapons}
        intakes={intakes}
        issues={issues}
        personnel={personnel}
        weaponTypes={weaponTypes}
        ammoTypes={ammoTypes}
      />

      {/* Excel Import Modal for Armament */}
      <ExcelImportModal
        isOpen={showExcelModal}
        onClose={() => setShowExcelModal(false)}
        importType="armament"
        onArmamentImported={(newPieces) => {
          setWeapons((prev) => [...newPieces, ...prev]);
          setNotification({
            type: 'success',
            message: `تم إضافة ${newPieces.length} قطعة سلاح جديدة لمستودع التسليح عبر ملف إكسل.`
          });
          onRefresh();
        }}
      />

      {/* Face Verification Modal for Armament Operations */}
      <FaceVerificationModal
        isOpen={showFaceVerification}
        onClose={() => setShowFaceVerification(false)}
        onVerified={handleArmamentFaceVerified}
        targetPersonnel={faceTargetPersonnel}
        allPersonnel={personnel}
        taskTitle={faceVerificationTitle}
        sensitiveTaskType="signature"
      />

    </div>
  );
};
