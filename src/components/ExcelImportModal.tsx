import React, { useState, useRef } from 'react';
import { X, FileSpreadsheet, Download, Upload, CheckCircle2, AlertTriangle, RefreshCw, FileText, ArrowLeft, ShieldCheck, Database } from 'lucide-react';
import * as XLSX from 'xlsx';
import { PersonnelRecord, MilitaryRank, PersonnelStatus } from '../types';
import { ArmoryWeaponPiece } from '../data/armamentData';
import { StorageService } from '../lib/storage';
import { BRIGADE_ACCOUNTS, getAccountIdForUnit } from '../data/accountsData';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  importType?: 'personnel' | 'armament';
  onPersonnelImported?: (updatedPersonnel: PersonnelRecord[]) => void;
  onArmamentImported?: (newPieces: ArmoryWeaponPiece[]) => void;
  currentPersonnelList?: PersonnelRecord[];
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  importType = 'personnel',
  onPersonnelImported,
  onArmamentImported,
  currentPersonnelList = []
}) => {
  const [activeType, setActiveType] = useState<'personnel' | 'armament'>(importType);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [fileInfo, setFileInfo] = useState<{ name: string; rowsCount: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  // Normalize header keys for fuzzy comparison
  const normalizeKey = (str: string) => {
    return str.toString().trim().replace(/[\s_\-\.\/\#\(\)\:\,]/g, '').toLowerCase();
  };

  // Find header row in 2D array if there are top banners or title rows
  const findHeaderRowIndex = (rawRows: any[][]): number => {
    if (!rawRows || rawRows.length === 0) return 0;
    
    const keywords = [
      'الاسم', 'الرقم', 'رقم', 'رتبة', 'الرتبة', 'جاهزية', 'وحدة', 'الوحدة',
      'كتيبة', 'الكتيبة', 'سرية', 'السرية', 'سلسلة', 'سيريال', 'نوع', 'سلاح',
      'هوية', 'الهوية', 'هاتف', 'الوظيفة', 'فصيلة',
      'name', 'id', 'military', 'rank', 'unit', 'serial', 'type', 'status', 'phone'
    ];

    for (let r = 0; r < Math.min(rawRows.length, 15); r++) {
      const row = rawRows[r];
      if (!Array.isArray(row)) continue;
      let matchCount = 0;
      row.forEach((cell: any) => {
        const cellStr = String(cell || '').trim().toLowerCase();
        if (cellStr && keywords.some(kw => cellStr.includes(kw))) {
          matchCount++;
        }
      });
      if (matchCount >= 2) {
        return r;
      }
    }
    return 0;
  };

  // Extract cell value from row object matching a set of aliases
  const getRowValue = (row: Record<string, any>, aliases: string[]): string => {
    if (!row) return '';
    const keys = Object.keys(row);
    const normalizedAliases = aliases.map(a => normalizeKey(a));

    // 1. Direct exact normalized match
    for (const alias of normalizedAliases) {
      for (const key of keys) {
        if (normalizeKey(key) === alias) {
          const val = row[key];
          if (val !== undefined && val !== null && String(val).trim() !== '') {
            return String(val).trim();
          }
        }
      }
    }
    
    // 2. Substring match
    for (const alias of normalizedAliases) {
      if (alias.length < 3) continue;
      for (const key of keys) {
        const normKey = normalizeKey(key);
        if (normKey.includes(alias) || alias.includes(normKey)) {
          const val = row[key];
          if (val !== undefined && val !== null && String(val).trim() !== '') {
            return String(val).trim();
          }
        }
      }
    }

    return '';
  };

  // Handle Excel/CSV file upload & parsing
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setImportError(null);
    setImportSuccess(null);

    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array', cellDates: true, raw: false });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];

        // Convert to 2D array of rows to intelligently detect the header row
        const raw2D: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

        if (!raw2D || raw2D.length === 0) {
          setImportError('الملف المرفوع فارغ أو لا يحتوي على صفوف بيانات صالحة.');
          setIsLoading(false);
          return;
        }

        const headerIndex = findHeaderRowIndex(raw2D);
        const headers = raw2D[headerIndex].map((h: any) => String(h || '').trim());
        const dataRows = raw2D.slice(headerIndex + 1);

        const parsedObjects: any[] = [];
        dataRows.forEach((rowArray: any[]) => {
          if (!Array.isArray(rowArray) || rowArray.every(cell => String(cell || '').trim() === '')) {
            return;
          }
          const obj: any = {};
          let hasContent = false;
          headers.forEach((h, colIdx) => {
            if (h) {
              const val = rowArray[colIdx] !== undefined ? rowArray[colIdx] : '';
              obj[h] = val;
              if (String(val).trim() !== '') {
                hasContent = true;
              }
            }
          });
          if (hasContent) {
            parsedObjects.push(obj);
          }
        });

        if (parsedObjects.length === 0) {
          setImportError('الملف المرفوع فارغ أو لا يحتوي على صفوف بيانات صالحة بعد قراءة الهيدر.');
          setIsLoading(false);
          return;
        }

        setParsedData(parsedObjects);
        setFileInfo({
          name: file.name,
          rowsCount: parsedObjects.length
        });
      } catch (err: any) {
        console.error('Error parsing Excel file:', err);
        setImportError('تعذر قراءة ملف الإكسل. يرجى التأكد من صيغة الملف (.xlsx, .xls, .csv).');
      } finally {
        setIsLoading(false);
      }
    };

    reader.onerror = () => {
      setImportError('حدث خطأ أثناء قراءة الملف من جهازك.');
      setIsLoading(false);
    };

    reader.readAsArrayBuffer(file);
  };

  // Process Personnel Import & Readiness Update
  const processPersonnelImport = () => {
    if (parsedData.length === 0) return;

    try {
      // Always read full central personnel list to avoid wiping out records from other brigade accounts
      const existingRecords = StorageService.getPersonnel();
      let updatedCount = 0;
      let addedCount = 0;

      const validRanks: MilitaryRank[] = [
        'فريق أول', 'فريق', 'لواء', 'عميد', 'عقيد', 'مقدم', 'رائد', 'نقيب', 'ملازم أول', 'ملازم',
        'رئيس رقباء', 'رقيب أول', 'رقيب', 'وكيل رقيب', 'عريف', 'جندي أول', 'جندي'
      ];

      const validStatuses: PersonnelStatus[] = [
        'متواجد', 'في الميدان', 'إجازة', 'إذن', 'مستشفى', 'غياب', 'فرار', 'مأمورية', 'منتدب',
        'على رأس العمل', 'مكلف بمهمة', 'مجاز', 'منوم بالمستشفى', 'موقوف', 'احتياط'
      ];

      const resultMap = new Map<string, PersonnelRecord>();
      existingRecords.forEach(p => resultMap.set(p.militaryId, { ...p }));

      const activeCode = typeof window !== 'undefined' ? localStorage.getItem('military_active_account_v1') : 'hq';
      const activeAcc = BRIGADE_ACCOUNTS.find(a => a.id === activeCode || a.shortCode === activeCode || a.customAccessKey === activeCode);
      const currentAccId = activeAcc ? activeAcc.id : 'hq';

      parsedData.forEach((row: any, idx: number) => {
        const rawMilitaryId = getRowValue(row, [
          'الرقم الوظيفي', 'الرقم العسكري', 'رقم الوظيفة', 'الرقم', 'رقم', 'رقم الفرد', 'الكود', 'الرقم العسكري/الوظيفي',
          'militaryId', 'military_id', 'Job ID', 'jobId', 'ID', 'id', 'No', 'no', '#'
        ]);

        const rawFullName = getRowValue(row, [
          'الاسم الرباعي', 'الاسم الكامل', 'الاسم الثلاثي', 'الاسم', 'اسم الفرد', 'اسم الضابط', 'اسم الشخص', 'الاسم والشهرة',
          'fullName', 'full_name', 'Name', 'name'
        ]);

        const rawRank = getRowValue(row, [
          'الرتبة', 'رتبة', 'الرتبه', 'rank', 'Rank'
        ]);

        const rawNationalId = getRowValue(row, [
          'الرقم الوطني', 'رقم الهوية', 'الهوية', 'السجل المدني', 'بطاقة شخصية', 'رقم البطاقة',
          'nationalId', 'national_id', 'National ID', 'civilId'
        ]);

        const rawUnit = getRowValue(row, [
          'الوحدة', 'اللواء', 'التشكيل', 'الجهة', 'الكتيبة/اللواء', 'unit', 'Unit', 'brigade'
        ]);

        const rawBattalion = getRowValue(row, [
          'الكتيبة', 'كتيبة', 'battalion', 'Battalion'
        ]);

        const rawCompany = getRowValue(row, [
          'السرية', 'سرية', 'company', 'Company'
        ]);

        const rawPlatoon = getRowValue(row, [
          'الفصيل', 'فصيل', 'platoon', 'Platoon'
        ]);

        const rawStatus = getRowValue(row, [
          'حالة الجاهزية', 'الجاهزية', 'الحالة الحالية', 'الحالة', 'حالة الفرد', 'تمام الفرد', 'التمام',
          'currentStatus', 'status', 'Status'
        ]);

        const rawPhone = getRowValue(row, [
          'رقم الهاتف', 'الهاتف', 'الجوال', 'رقم الجوال', 'رقم التواصل', 'phone', 'Phone', 'mobile'
        ]);

        const rawJobTitle = getRowValue(row, [
          'المسمى الوظيفي', 'الوظيفة', 'العمل', 'الموقع الوظيفي', 'jobTitle', 'job_title', 'Job'
        ]);

        const rawBloodType = getRowValue(row, [
          'فصيلة الدم', 'فصيلة', 'bloodType', 'blood_type'
        ]);

        const rawMotherName = getRowValue(row, [
          'اسم الأم', 'الأم', 'اسم والدة الفرد', 'motherName', 'mother'
        ]);

        const rawGuarantorName = getRowValue(row, [
          'اسم الضمين', 'الضمين', 'الكفيل', 'guarantorName', 'guarantor'
        ]);

        const rawRelativeName = getRowValue(row, [
          'اسم أقرب الأقارب', 'اسم القريب', 'أقرب أقارب', 'قريب', 'relativeName', 'relative'
        ]);

        const rawRelativePhone = getRowValue(row, [
          'هاتف القريب', 'جوال القريب', 'رقم هاتف أقرب الأقارب', 'relativePhone'
        ]);

        const rawEducation = getRowValue(row, [
          'المؤهل التعليمي', 'المؤهل', 'المستوى التعليمي', 'education'
        ]);

        const rawSpecialization = getRowValue(row, [
          'التخصص', 'التخصص العسكري', 'specialization'
        ]);

        const rawEnlistmentDate = getRowValue(row, [
          'تاريخ الالتحاق', 'تاريخ التجنيد', 'تاريخ التعيين', 'enlistmentDate'
        ]);

        if (!rawFullName && !rawMilitaryId && !rawNationalId) return; // Skip empty rows

        const militaryId = rawMilitaryId || `MIL-${Math.floor(100000 + Math.random() * 900000)}`;
        const matchedRank = validRanks.find(r => r === rawRank) || 'جندي';
        const matchedStatus = validStatuses.find(s => s === rawStatus) || 'متواجد';

        // Match existing record by militaryId or nationalId or fullName
        let existingKey: string | null = null;
        if (resultMap.has(militaryId)) {
          existingKey = militaryId;
        } else {
          for (const [key, p] of resultMap.entries()) {
            if ((rawNationalId && p.nationalId === rawNationalId) || (rawFullName && p.fullName === rawFullName)) {
              existingKey = key;
              break;
            }
          }
        }

        if (existingKey) {
          // Update existing personnel record with daily readiness
          const existing = resultMap.get(existingKey)!;
          const updatedRecord: PersonnelRecord = {
            ...existing,
            fullName: rawFullName || existing.fullName,
            rank: matchedRank || existing.rank,
            unit: rawUnit || existing.unit,
            battalion: rawBattalion || existing.battalion,
            company: rawCompany || existing.company,
            platoon: rawPlatoon || existing.platoon,
            currentStatus: matchedStatus,
            phone: rawPhone || existing.phone,
            jobTitle: rawJobTitle || existing.jobTitle,
            nationalId: rawNationalId || existing.nationalId,
            motherName: rawMotherName || existing.motherName,
            guarantorName: rawGuarantorName || existing.guarantorName,
            relativeName: rawRelativeName || existing.relativeName,
            relativePhone: rawRelativePhone || existing.relativePhone,
            education: rawEducation || existing.education,
            specialization: rawSpecialization || existing.specialization,
            enlistmentDate: rawEnlistmentDate || existing.enlistmentDate
          };

          // Record attendance log entry
          if (existing.currentStatus !== matchedStatus) {
            updatedRecord.logs = {
              ...existing.logs,
              attendance: [
                {
                  id: `att-upd-${Date.now()}-${idx}`,
                  date: new Date().toISOString().split('T')[0],
                  type: matchedStatus === 'متواجد' || matchedStatus === 'في الميدان' ? 'حضور' : 'إجازة',
                  reason: `تحديث جاهزية يومي مستورد من ملف إكسل (${matchedStatus})`,
                  durationDays: 1,
                  approvedBy: 'تحديث الجاهزية اليومية',
                  startDate: new Date().toISOString().split('T')[0]
                },
                ...(existing.logs?.attendance || [])
              ]
            };
          }

          resultMap.set(existingKey, updatedRecord);
          updatedCount++;
        } else {
          // Add brand new personnel record
          const newRecord: PersonnelRecord = {
            militaryId,
            nationalId: rawNationalId || `10${Math.floor(100000000 + Math.random() * 900000000)}`,
            fullName: rawFullName || `فرد عسكري ${idx + 1}`,
            rank: matchedRank,
            dob: '1998-01-01',
            pob: 'صنعاء',
            maritalStatus: 'أعزب',
            education: rawEducation,
            specialization: rawSpecialization,
            bloodType: (rawBloodType as any) || 'O+',
            phone: rawPhone,
            motherName: rawMotherName || 'غير مسجل',
            guarantorName: rawGuarantorName || 'غير مسجل',
            relativeName: rawRelativeName || 'غير مسجل',
            relativePhone: rawRelativePhone || 'غير مسجل',
            photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
            biometricsRecorded: true,
            unit: rawUnit || 'اللواء الأول',
            battalion: rawBattalion || 'الكتيبة الأولى',
            company: rawCompany || 'السرية الأولى',
            platoon: rawPlatoon || 'الفصيل الأول',
            jobTitle: rawJobTitle || 'فرد عسكري',
            enlistmentDate: rawEnlistmentDate || new Date().toISOString().split('T')[0],
            currentStatus: matchedStatus,
            createdByAccountId: getAccountIdForUnit(rawUnit, currentAccId),
            logs: {
              movement: [],
              attendance: [
                {
                  id: `att-init-${Date.now()}-${idx}`,
                  date: new Date().toISOString().split('T')[0],
                  type: matchedStatus === 'متواجد' || matchedStatus === 'في الميدان' ? 'حضور' : 'إجازة',
                  reason: `تسجيل الجاهزية الأولية (${matchedStatus})`,
                  durationDays: 1,
                  approvedBy: 'نظام كشوفات الجاهزية',
                  startDate: new Date().toISOString().split('T')[0]
                }
              ],
              medical: [],
              financial: [],
              security: [],
              armament: [],
              training: [],
              attachments: [],
              supply: []
            }
          };
          resultMap.set(militaryId, newRecord);
          addedCount++;
        }
      });

      if (addedCount === 0 && updatedCount === 0) {
        setImportSuccess(null);
        setImportError(
          `⚠️ تم قراءة ملف الإكسل وفحص ${parsedData.length} صف، ولكن لم يتم استيراد أو تحديث أي بيانات أفراد!\nالسبب: تعذر التعرف على حقول البيانات (مثل الاسم أو الرقم العسكري/الوظيفي أو الرتبة) في عناوين أسماء الأعمدة.\n💡 يرجى التأكد من تسمية الأعمدة بشكل صحيح أو الضغط على "تحميل القالب (.XLSX)" لتعبئة بياناتك بالنظام المعتمد.`
        );
      } else {
        const updatedList = Array.from(resultMap.values());
        StorageService.savePersonnel(updatedList);

        // Audit Log
        StorageService.logAction(
          'مدير المنظومة',
          'إدارة الموارد البشرية',
          'استيراد كشف إكسل أفراد',
          'BATCH-EXCEL',
          'استيراد أفراد وتحديث جاهزية',
          `تم استيراد ملف إكسل شامل: إدراج (${addedCount}) فرد جديد وتحديث جاهزية وبيانات (${updatedCount}) فرد.`
        );

        if (onPersonnelImported) {
          onPersonnelImported(updatedList);
        }

        setImportError(null);
        setImportSuccess(`✅ تم استيراد وتحديث البيانات بنجاح! تم إضافة ${addedCount} فرد جديد، وتحديث حالة الجاهزية والبيانات لـ ${updatedCount} فرد في قاعدة البيانات. 🛡️ (إجمالي الصفوف المعالجة بنجاح = ${addedCount + updatedCount} من أصل ${parsedData.length} صف).`);
      }

      setParsedData([]);
      setFileInfo(null);
    } catch (err: any) {
      console.error('Personnel import error:', err);
      setImportError('حدث خطأ أثناء معالجة بيانات الأفراد. يرجى مراجعة عناوين الأعمدة.');
    }
  };

  // Process Armament Import
  const processArmamentImport = () => {
    if (parsedData.length === 0) return;

    try {
      const newPieces: ArmoryWeaponPiece[] = [];

      parsedData.forEach((row: any, idx: number) => {
        const serialNumber = getRowValue(row, [
          'الرقم التسلسلي', 'سيريال السلاح', 'السيريال', 'رقم القطعة', 'سلسلة السلاح',
          'serialNumber', 'serial_number', 'Serial', 'serial', 'SN', 'sn'
        ]);

        const weaponType = getRowValue(row, [
          'نوع السلاح', 'اسم السلاح', 'نوع القطعة', 'السلاح', 'الوصف',
          'weaponType', 'weapon_type', 'Type', 'type', 'Name', 'name'
        ]);

        const caliber = getRowValue(row, [
          'العيار', 'العيار الخاص', 'caliber', 'Caliber'
        ]);

        const technicalCondition = getRowValue(row, [
          'الحالة الفنية', 'الفنية', 'حالة الصيانة', 'technicalCondition', 'condition'
        ]);

        const storageLocation = getRowValue(row, [
          'موقع التخزين', 'المخزن', 'مكانالتخزين', 'storageLocation', 'location'
        ]);

        const manufactureYear = getRowValue(row, [
          'سنة الصنع', 'سنة التصنيع', 'manufactureYear', 'year'
        ]);

        const status = getRowValue(row, [
          'حالة القطعة', 'الحالة', 'status', 'Status'
        ]);

        const notes = getRowValue(row, [
          'ملاحظات', 'الملاحظات', 'notes', 'Notes'
        ]);

        if (!serialNumber && !weaponType) return; // Skip empty rows

        const piece: ArmoryWeaponPiece = {
          id: `wpn-imp-${Date.now()}-${idx}`,
          serialNumber: serialNumber || `WPN-${Math.floor(100000 + Math.random() * 900000)}`,
          weaponType: weaponType || 'بندقية كلاشينكوف AK-47',
          caliber: caliber || '7.62x39mm',
          manufactureYear: manufactureYear || '2024',
          technicalCondition: (['جاهز', 'تحتاج صيانة', 'غير جاهز', 'معطوبة'].includes(technicalCondition) ? technicalCondition : 'جاهز') as any,
          status: (['في المخزن', 'منصرف للفرد', 'في الصيانة', 'مستبعد'].includes(status) ? status : 'في المخزن') as any,
          storageLocation: storageLocation || 'مخزن التسليح الرئيسي',
          notes: notes || 'مستورد من ملف إكسل',
          entryDate: new Date().toISOString().split('T')[0]
        };

        newPieces.push(piece);
      });

      if (newPieces.length === 0) {
        setImportSuccess(null);
        setImportError(
          `⚠️ تم قراءة ملف الإكسل وفحص ${parsedData.length} صف، ولكن لم يتم استيراد أي قطع سلاح!\nالسبب: تعذر التعرف على حقول القطع (الرقم التسلسلي أو نوع السلاح).\n💡 يرجى تحميل "قالب التسليح المعتمد (.XLSX)" وتعبئته لإتمام العملية بنجاح.`
        );
      } else {
        if (onArmamentImported) {
          onArmamentImported(newPieces);
        }
        setImportError(null);
        setImportSuccess(
          `✅ تم استيراد وتخزين ${newPieces.length} قطعة سلاح وعهدة تسليح بنجاح وإضافتها لمستودع التسليح! 🛡️`
        );
      }
      setParsedData([]);
      setFileInfo(null);
    } catch (err: any) {
      console.error('Armament import error:', err);
      setImportError('حدث خطأ أثناء معالجة بيانات قطع التسليح.');
    }
  };

  // Download Sample Excel Template
  const downloadSampleTemplate = (type: 'personnel' | 'armament') => {
    let headers: string[] = [];
    let sampleRows: any[] = [];
    let filename = '';

    if (type === 'personnel') {
      filename = 'قالب_استيراد_القوة_البشرية_والجاهزية.xlsx';
      headers = [
        'الرقم الوظيفي', 'الاسم الرباعي', 'الرتبة', 'الوحدة', 'الكتيبة', 'السرية',
        'حالة الجاهزية', 'رقم الهاتف', 'الرقم الوطني', 'المسمى الوظيفي', 'فصيلة الدم'
      ];
      sampleRows = [
        {
          'الرقم الوظيفي': 'MIL-202601',
          'الاسم الرباعي': 'سالم بن أحمد الحداء',
          'الرتبة': 'رقيب',
          'الوحدة': 'اللواء الأول المدرع',
          'الكتيبة': 'الكتيبة الأولى دبابات',
          'السرية': 'السرية الأولى',
          'حالة الجاهزية': 'متواجد',
          'رقم الهاتف': '0501112233',
          'الرقم الوطني': '1098765432',
          'المسمى الوظيفي': 'قائد فصيل مشاة',
          'فصيلة الدم': 'O+'
        },
        {
          'الرقم الوظيفي': 'MIL-202602',
          'الاسم الرباعي': 'عبد الله بن سعيد الأهدل',
          'الرتبة': 'عريف',
          'الوحدة': 'اللواء الأول المدرع',
          'الكتيبة': 'الكتيبة الثانية',
          'السرية': 'السرية الثانية',
          'حالة الجاهزية': 'مهمة رسمية',
          'رقم الهاتف': '0504445566',
          'الرقم الوطني': '1087654321',
          'المسمى الوظيفي': 'سائق مدرعة',
          'فصيلة الدم': 'A+'
        }
      ];
    } else {
      filename = 'قالب_استيراد_قطع_التسليح.xlsx';
      headers = [
        'الرقم التسلسلي', 'نوع السلاح', 'العيار', 'الحالة الفنية', 'موقع التخزين', 'سنة الصنع', 'حالة القطعة', 'ملاحظات'
      ];
      sampleRows = [
        {
          'الرقم التسلسلي': 'AK47-998811',
          'نوع السلاح': 'بندقية كلاشينكوف AK-47',
          'العيار': '7.62x39mm',
          'الحالة الفنية': 'جاهز',
          'موقع التخزين': 'مخزن التسليح الرئيسي - رف أ1',
          'سنة الصنع': '2024',
          'حالة القطعة': 'في المخزن',
          'ملاحظات': 'سلاح جديد ممتاز'
        },
        {
          'الرقم التسلسلي': 'GLOCK-772233',
          'نوع السلاح': 'مسدس جلوك 19',
          'العيار': '9x19mm',
          'الحالة الفنية': 'جاهز',
          'موقع التخزين': 'مخزن الضباط',
          'سنة الصنع': '2023',
          'حالة القطعة': 'في المخزن',
          'ملاحظات': 'جاهز للصرف اللحظي'
        }
      ];
    }

    const ws = XLSX.utils.json_to_sheet(sampleRows, { header: headers });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, filename);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200" dir="rtl">
      <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl relative overflow-hidden font-['Cairo',sans-serif]">
        
        {/* Header bar */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white font-['Tajawal']">
                رفع واستيراد كشوفات إكسل (Excel / CSV) 📊
              </h2>
              <p className="text-xs text-slate-400">
                استيراد بيانات الأفراد، تحديث الجاهزية القتالية، وإدخال عهد التسليح دفعة واحدة
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Type selector tabs */}
        <div className="flex items-center p-1 bg-slate-800/80 rounded-2xl border border-slate-700/80 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setActiveType('personnel');
              setParsedData([]);
              setFileInfo(null);
            }}
            className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center space-x-2 space-x-reverse ${
              activeType === 'personnel'
                ? 'bg-emerald-600 text-white shadow-md font-extrabold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>كشف الأفراد وتحديث الجاهزية</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveType('armament');
              setParsedData([]);
              setFileInfo(null);
            }}
            className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center space-x-2 space-x-reverse ${
              activeType === 'armament'
                ? 'bg-amber-600 text-white shadow-md font-extrabold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>كشف قطع وعهد التسليح</span>
          </button>
        </div>

        {/* Template Download Prompt */}
        <div className="bg-slate-800/60 border border-slate-700 p-3.5 rounded-2xl flex items-center justify-between gap-3 text-xs">
          <div className="space-y-0.5">
            <h4 className="font-bold text-emerald-400">تحميل القالب المعتمد للإكسل</h4>
            <p className="text-[11px] text-slate-400">
              حمل القالب الجاهز بأعمدة ({activeType === 'personnel' ? 'الاسم، الرقم الوظيفي، الرتبة، الجاهزية' : 'السيريال، نوع السلاح، العيار، الحالة'}) لتعبئة بياناتك.
            </p>
          </div>
          <button
            type="button"
            onClick={() => downloadSampleTemplate(activeType)}
            className="px-3.5 py-2 bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-xl font-bold transition-all shrink-0 flex items-center space-x-1.5 space-x-reverse cursor-pointer border border-slate-600"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>تحميل القالب (.XLSX)</span>
          </button>
        </div>

        {/* Alerts */}
        {importError && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-3.5 rounded-2xl text-xs font-medium flex items-center space-x-2 space-x-reverse">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{importError}</span>
          </div>
        )}

        {importSuccess && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-3.5 rounded-2xl text-xs font-medium flex items-center space-x-2 space-x-reverse">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{importSuccess}</span>
          </div>
        )}

        {/* Drag & Drop File Upload Box */}
        {!fileInfo ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-700 hover:border-emerald-500/80 bg-slate-950/50 hover:bg-slate-950 p-8 rounded-3xl text-center space-y-3 cursor-pointer transition-all group"
          >
            <div className="w-14 h-14 mx-auto bg-emerald-500/10 group-hover:bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/20 flex items-center justify-center transition-colors">
              <Upload className="w-7 h-7 group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <p className="font-extrabold text-slate-200 text-sm">اضغط هنا لاختيار ملف إكسل من جهازك</p>
              <p className="text-xs text-slate-400 mt-1">يدعم صيغ .xlsx, .xls, .csv حتى حجم 20 ميجابايت</p>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              accept=".xlsx, .xls, .csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        ) : (
          /* Parsed Data Preview */
          <div className="space-y-4">
            <div className="bg-slate-800 border border-slate-700 p-3.5 rounded-2xl flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2 space-x-reverse">
                <FileText className="w-5 h-5 text-emerald-400" />
                <div>
                  <span className="font-bold text-white block">{fileInfo.name}</span>
                  <span className="text-[11px] text-slate-400">تم استخراج {fileInfo.rowsCount} صف بيانات جاهزة للاستيراد</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setParsedData([]);
                  setFileInfo(null);
                }}
                className="text-xs text-rose-400 hover:text-rose-300 underline font-bold"
              >
                تغيير الملف
              </button>
            </div>

            {/* Table Sample Preview */}
            <div className="max-h-48 overflow-y-auto border border-slate-800 rounded-2xl bg-slate-950 text-xs">
              <table className="w-full text-right text-[11px]">
                <thead className="bg-slate-900 text-slate-300 font-bold sticky top-0 border-b border-slate-800">
                  <tr>
                    {Object.keys(parsedData[0] || {}).slice(0, 6).map((key, i) => (
                      <th key={i} className="p-2.5 border-l border-slate-800">{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300 font-medium">
                  {parsedData.slice(0, 5).map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/50">
                      {Object.keys(parsedData[0] || {}).slice(0, 6).map((key, i) => (
                        <td key={i} className="p-2.5 border-l border-slate-800/60">
                          {String(row[key] || '-')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Submit Action */}
            <button
              type="button"
              disabled={isLoading}
              onClick={activeType === 'personnel' ? processPersonnelImport : processArmamentImport}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-extrabold rounded-2xl text-sm transition-all shadow-lg flex items-center justify-center space-x-2 space-x-reverse cursor-pointer"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>جاري معالجة واستيراد البيانات...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>
                    {activeType === 'personnel'
                      ? `اعتماد وتحديث حالة الجاهزية لـ (${fileInfo.rowsCount}) فرد`
                      : `إضافة (${fileInfo.rowsCount}) قطعة سلاح لمستودع التسليح`}
                  </span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span className="text-[11px] text-slate-500">
            تحديث وتزامن فوري لقاعدة البيانات المحلية 💾
          </span>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white font-bold underline"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
