import { PersonnelRecord, AuditLogEntry, SystemAlert } from '../types';

export const INITIAL_PERSONNEL: PersonnelRecord[] = [
  {
    militaryId: 'MIL-100201',
    nationalId: '1098273641',
    fullName: 'خالد بن عبد الله الآنسي',
    rank: 'عقيد',
    dob: '1982-04-12',
    pob: 'صنعاء',
    maritalStatus: 'متزوج',
    education: 'ماجستير علوم عسكرية',
    specialization: 'قيادة وسيطرة مدرعات',
    bloodType: 'O+',
    phone: '0501234567',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    biometricsRecorded: true,
    unit: 'اللواء الأول المدرع',
    battalion: 'الكتيبة الأولى دبابات',
    company: 'قيادة الكتيبة',
    platoon: 'فصيل القيادة',
    jobTitle: 'قائد الكتيبة الاولى',
    enlistmentDate: '2002-09-15',
    currentStatus: 'متواجد',
    logs: {
      movement: [
        {
          id: 'mov-1',
          date: '2025-01-10',
          type: 'ترقية',
          details: 'صدر الأمر القيادي بالترقية إلى رتبة عقيد',
          issuingAuthority: 'الأمانة العامة للقيادة العليا',
          effectiveDate: '2025-01-01'
        },
        {
          id: 'mov-2',
          date: '2023-06-01',
          type: 'نقل',
          details: 'نقل من كتيبة الاستطلاع إلى قيادة الكتيبة الأولى دبابات',
          issuingAuthority: 'قيادة القوات البرية',
          effectiveDate: '2023-06-15'
        }
      ],
      attendance: [
        {
          id: 'att-1',
          date: '2026-07-20',
          type: 'حضور',
          reason: 'حضور التمام اليومي للمقر القيادي',
          durationDays: 1,
          approvedBy: 'قائد اللواء',
          startDate: '2026-07-20'
        }
      ],
      medical: [
        {
          id: 'med-1',
          date: '2025-11-05',
          diagnosis: 'إجهاد عضلي بالظهر جراء التمرين الميداني',
          hospital: 'المستشفى العسكري المركزي',
          doctor: 'د. يوسف الأهدل - استشاري عظام',
          sickLeaveDays: 5,
          medications: [
            {
              id: 'm1',
              name: 'مسكن آلام ومضاد التهاب - فولتارين 75mg',
              dose: 'قرص مرتين يومياً بعد الأكل',
              dateDispensed: '2025-11-05',
              prescribedBy: 'د. يوسف الأهدل'
            },
            {
              id: 'm2',
              name: 'باسط عضلات - باسكوبان',
              dose: 'قرص قبل النوم',
              dateDispensed: '2025-11-05',
              prescribedBy: 'د. يوسف الأهدل'
            }
          ]
        }
      ],
      financial: [
        {
          id: 'fin-1',
          date: '2026-07-01',
          type: 'راتب',
          amount: 24500,
          reason: 'الراتب الأساسي لشهر يوليو مع بدلات القيادة والخطر',
          transactionDate: '2026-07-01'
        },
        {
          id: 'fin-2',
          date: '2026-05-15',
          type: 'مكافأة',
          amount: 5000,
          reason: 'مكافأة التميز العملياتي في تمرين درع الوطن',
          transactionDate: '2026-05-15'
        }
      ],
      security: [
        {
          id: 'sec-1',
          date: '2024-02-10',
          violation: 'لا يوجد - مسلك أمني ممتاز وصحيفة بيضاء',
          investigationDetails: 'تم إجراء التدقيق الأمني السنوي وحصوله على درجة أمان عالية جدًا',
          penalty: 'لا يوجد',
          warningLevel: 'منخفض',
          authority: 'شعبة الاستخبارات العسكرية',
          status: 'مغلق'
        }
      ],
      armament: [
        {
          id: 'arm-1',
          weaponSerial: 'WPN-SIG-99120',
          weaponType: 'مسدس SIG Sauer P226 9mm',
          issueDate: '2021-03-10',
          ammoQty: 45,
          firelinesCount: 3,
          ammoHistory: [
            {
              id: 'ah-1',
              type: 'صرف',
              quantity: 45,
              date: '2026-01-10',
              reason: 'صرف حصة رماية القيادة السنوية',
              issuedBy: 'إدارة التسليح'
            }
          ],
          condition: 'ممتازة',
          technicalNotes: 'فحص فني شامل بتاريخ 2026-06-01 - جاهز للاستخدام'
        }
      ],
      training: [
        {
          id: 'trn-1',
          courseName: 'دورة القيادة والأركان المتقدمة',
          courseType: 'قيادي',
          provider: 'كلية القيادة والأركان العسكرية',
          startDate: '2024-09-01',
          endDate: '2025-05-30',
          durationWeeks: 36,
          grade: 'ممتاز',
          evaluation: 'أظهر قدرة عالية على التخطيط الاستراتيجي وقيادة المناورات',
          certificates: 'شهادة ماجستير العلوم العسكرية ودبلوم الأركان'
        }
      ],
      attachments: [
        {
          id: 'attch-1',
          title: 'قرار الترقية إلى رتبة عقيد',
          category: 'قرار إداري',
          fileType: 'pdf',
          uploadDate: '2025-01-11',
          fileSize: '1.2 MB'
        },
        {
          id: 'attch-2',
          title: 'شهادة كلية القيادة والأركان',
          category: 'شهادة',
          fileType: 'pdf',
          uploadDate: '2025-06-01',
          fileSize: '2.4 MB'
        }
      ],
      supply: [
        {
          id: 'sup-1',
          itemType: 'بدلة عسكرية',
          itemName: 'بدلة تمويه ميدانية رسمية 2026 (مقاس XL)',
          quantity: 2,
          issueDate: '2026-01-15',
          condition: 'جديد',
          issuedBy: 'إدارة التموين والإمداد',
          serialNumber: 'UNIF-2026-001',
          notes: 'صرف طقم بدلات عسكرية صحراوية كاملة مع الرتب والكتفيات'
        },
        {
          id: 'sup-2',
          itemType: 'بسطار/حذاء',
          itemName: 'بسطار تكتيكي خفيف مضاد للانزلاق (مقاس 44)',
          quantity: 1,
          issueDate: '2026-01-15',
          condition: 'جديد',
          issuedBy: 'إدارة التموين والإمداد',
          serialNumber: 'BOOT-2026-88',
          notes: 'صرف بسطار عسكري للخدمة الميدانية'
        },
        {
          id: 'sup-3',
          itemType: 'خوذة/دروع',
          itemName: 'خوذة تكتيكية مع درع حماية باليستي المستوى III',
          quantity: 1,
          issueDate: '2025-08-10',
          condition: 'جديد',
          issuedBy: 'إدارة التموين والإمداد',
          serialNumber: 'ARMOR-9012',
          notes: 'صرف درع وخوذة للجاهزية الميدانية'
        }
      ]
    }
  },
  {
    militaryId: 'MIL-100202',
    nationalId: '1087625149',
    fullName: 'سعيد بن ناصر الحداء',
    rank: 'مقدم',
    dob: '1985-08-22',
    pob: 'عدن',
    maritalStatus: 'متزوج',
    education: 'بكالوريوس هندسة اتصالات',
    specialization: 'سلاح الإشارة والحروب الإلكترونية',
    bloodType: 'A+',
    phone: '0502345678',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
    biometricsRecorded: true,
    unit: 'لواء الإشارة الاتصالات',
    battalion: 'كتيبة الحروب الإلكترونية',
    company: 'السرية الأولى شفرات',
    platoon: 'فصيل التشفير',
    jobTitle: 'رئيس قسم الأمن السيبراني والإشارة',
    enlistmentDate: '2007-06-10',
    currentStatus: 'في الميدان',
    logs: {
      movement: [
        {
          id: 'mov-201',
          date: '2026-07-01',
          type: 'مأمورية',
          details: 'مأمورية ميدانية لتأمين الاتصالات المشفرة بالحدود الشمالية',
          issuingAuthority: 'قيادة سلاح الإشارة',
          effectiveDate: '2026-07-01'
        }
      ],
      attendance: [
        {
          id: 'att-201',
          date: '2026-07-01',
          type: 'حضور',
          reason: 'انطلاق المأمورية الميدانية',
          durationDays: 30,
          approvedBy: 'قائد لواء الإشارة',
          startDate: '2026-07-01',
          endDate: '2026-07-31'
        }
      ],
      medical: [],
      financial: [
        {
          id: 'fin-201',
          date: '2026-07-01',
          type: 'بدل',
          amount: 3500,
          reason: 'بدل انتداب ميداني لمأمورية الاتصالات',
          transactionDate: '2026-07-01'
        }
      ],
      security: [],
      armament: [
        {
          id: 'arm-201',
          weaponSerial: 'WPN-HK-416-08',
          weaponType: 'بندقية HK416 5.56mm',
          issueDate: '2025-02-14',
          ammoQty: 120,
          firelinesCount: 4,
          ammoHistory: [],
          condition: 'ممتازة',
          technicalNotes: 'مزودة بمكبر رؤية ليلي وموجه ليزري'
        }
      ],
      training: [
        {
          id: 'trn-201',
          courseName: 'دورة الدفاع السيبراني التكتيكي',
          courseType: 'تقني',
          provider: 'معهد نظم المعلومات القوات المسلحة',
          startDate: '2025-01-10',
          endDate: '2025-03-20',
          durationWeeks: 10,
          grade: 'ممتاز',
          evaluation: 'المركز الأول في الحماية الميدانية للشبكات',
          certificates: 'شهادة التشفير العسكري المتقدم'
        }
      ],
      attachments: []
    }
  },
  {
    militaryId: 'MIL-100203',
    nationalId: '1065432198',
    fullName: 'محمد بن سالم العولقي',
    rank: 'رائد',
    dob: '1989-11-03',
    pob: 'المدينة المنورة',
    maritalStatus: 'متزوج',
    education: 'بكالوريوس علوم عسكرية',
    specialization: 'مشاة آلي واستطلاع',
    bloodType: 'B+',
    phone: '0503456789',
    photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80',
    biometricsRecorded: true,
    unit: 'اللواء الثاني مشاة آلي',
    battalion: 'كتيبة الاستطلاع والفرسان',
    company: 'السرية الثانية',
    platoon: 'فصيل الاقتحام',
    jobTitle: 'قائد السرية الثانية',
    enlistmentDate: '2011-08-20',
    currentStatus: 'إجازة',
    logs: {
      movement: [],
      attendance: [
        {
          id: 'att-301',
          date: '2026-07-20',
          type: 'إجازة',
          reason: 'إجازة سنوية اعتيادية لمدة 15 يوماً',
          durationDays: 15,
          approvedBy: 'إدارة الموارد البشرية',
          startDate: '2026-07-20',
          endDate: '2026-08-04'
        }
      ],
      medical: [],
      financial: [
        {
          id: 'fin-301',
          date: '2026-07-01',
          type: 'راتب',
          amount: 18200,
          reason: 'صرف راتب شهر يوليو',
          transactionDate: '2026-07-01'
        }
      ],
      security: [],
      armament: [
        {
          id: 'arm-301',
          weaponSerial: 'WPN-M4-88410',
          weaponType: 'بندقية M4A1 Carabine',
          issueDate: '2022-05-10',
          ammoQty: 90,
          firelinesCount: 3,
          ammoHistory: [],
          condition: 'ممتازة',
          technicalNotes: 'تم إيداع السلاح بمستودع التسليح لحين العودة من الإجازة'
        }
      ],
      training: [],
      attachments: []
    }
  },
  {
    militaryId: 'MIL-100204',
    nationalId: '1054321987',
    fullName: 'عبد الرحمن بن فهد الأهدل',
    rank: 'نقيب',
    dob: '1992-02-14',
    pob: 'أبها',
    maritalStatus: 'أعزب',
    education: 'بكالوريوس طب وجراحة عسكرية',
    specialization: 'طب الميدان والكوارث',
    bloodType: 'AB+',
    phone: '0504567890',
    photoUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=300&q=80',
    biometricsRecorded: true,
    unit: 'الإدارة الطبية العسكرية',
    battalion: 'مستشفى الميدان الطبي',
    company: 'قسم الإخلاء الجوي والطوارئ',
    platoon: 'فصيل المسعفين',
    jobTitle: 'طبيب ميداني مسؤول الطوارئ',
    enlistmentDate: '2016-04-10',
    currentStatus: 'متواجد',
    logs: {
      movement: [],
      attendance: [],
      medical: [],
      financial: [
        {
          id: 'fin-401',
          date: '2026-07-01',
          type: 'بدل',
          amount: 4000,
          reason: 'بدل ممارسة الطب العسكري ومخاطر العدوى',
          transactionDate: '2026-07-01'
        }
      ],
      security: [],
      armament: [
        {
          id: 'arm-401',
          weaponSerial: 'WPN-GLOCK-7711',
          weaponType: 'مسدس Glock 19 9mm',
          issueDate: '2020-01-15',
          ammoQty: 30,
          firelinesCount: 2,
          ammoHistory: [],
          condition: 'ممتازة',
          technicalNotes: 'فحص دوري مقبول'
        }
      ],
      training: [
        {
          id: 'trn-401',
          courseName: 'دورة الطب الميداني المتقدم وإخلاء الجرحى',
          courseType: 'تخصصي',
          provider: 'الأكاديمية الطبية العسكرية',
          startDate: '2024-03-01',
          endDate: '2024-04-15',
          durationWeeks: 6,
          grade: 'ممتاز',
          evaluation: 'قدرة فائقة على التعامل مع الإصابات الحادة تحت النار',
          certificates: 'شهادة إنعاش الإصابات العسكرية ATLS'
        }
      ],
      attachments: []
    }
  },
  {
    militaryId: 'MIL-100205',
    nationalId: '1043219876',
    fullName: 'سلطان بن حمد الصايدي',
    rank: 'ملازم أول',
    dob: '1995-07-19',
    pob: 'مأرب',
    maritalStatus: 'أعزب',
    education: 'بكالوريوس علوم عسكرية',
    specialization: 'مدفعية وصواريخ',
    bloodType: 'O-',
    phone: '0505678901',
    photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80',
    biometricsRecorded: true,
    unit: 'لواء المدفعية الميدانية',
    battalion: 'الكتيبة الثانية صواريخ',
    company: 'السرية الأولى',
    platoon: 'فصيل التوجيه',
    jobTitle: 'ضابط توجيه نيران المدفعية',
    enlistmentDate: '2018-09-01',
    currentStatus: 'مستشفى',
    logs: {
      movement: [],
      attendance: [
        {
          id: 'att-501',
          date: '2026-07-22',
          type: 'احتجاز',
          reason: 'منوم بالمستشفى العسكري لعلاج إصابة بالقدم',
          durationDays: 7,
          approvedBy: 'الإدارة الطبية',
          startDate: '2026-07-22',
          endDate: '2026-07-29'
        }
      ],
      medical: [
        {
          id: 'med-501',
          date: '2026-07-22',
          diagnosis: 'كسر مضاعف في الساق اليمنى جراء سقوط أثناء التمرين',
          hospital: 'المستشفى العسكري بالظهران',
          doctor: 'د. طارق المالكي - جراحة عظام',
          injuryDetails: 'إصابة ميدانية أثناء التمرين التكتيكي للكتيبة الثانية',
          surgicalOperations: 'عملية تثبيت شريحة ومسامير جراحية',
          sickLeaveDays: 21,
          medications: [
            {
              id: 'med-501-1',
              name: 'مضاد حيوي أوجمنتين 1g',
              dose: 'جرعة كل 12 ساعة',
              dateDispensed: '2026-07-22',
              prescribedBy: 'د. طارق المالكي'
            },
            {
              id: 'med-501-2',
              name: 'مسكن مورفين / ترامادول عسكري',
              dose: 'عند الحاجة الشديدة للآلام',
              dateDispensed: '2026-07-22',
              prescribedBy: 'د. طارق المالكي'
            }
          ]
        }
      ],
      financial: [
        {
          id: 'fin-501',
          date: '2026-07-23',
          type: 'تعويض',
          amount: 8000,
          reason: 'تعويض إصابة عمل ميداني مبدئي',
          transactionDate: '2026-07-23'
        }
      ],
      security: [],
      armament: [
        {
          id: 'arm-501',
          weaponSerial: 'WPN-SIG-10492',
          weaponType: 'مسدس SIG P229',
          issueDate: '2021-06-11',
          ammoQty: 30,
          firelinesCount: 2,
          ammoHistory: [],
          condition: 'جيدة',
          technicalNotes: 'تم التحفظ على السلاح بالأمانة الفنية خلال فترة التنويم'
        }
      ],
      training: [],
      attachments: []
    }
  },
  {
    militaryId: 'MIL-100206',
    nationalId: '1032198765',
    fullName: 'تركي بن منصور السنحاني',
    rank: 'ملازم',
    dob: '1998-10-05',
    pob: 'حائل',
    maritalStatus: 'أعزب',
    education: 'بكالوريوس علوم عسكرية',
    specialization: 'مشاة واستطلاع',
    bloodType: 'A-',
    phone: '0506789012',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    biometricsRecorded: true,
    unit: 'اللواء الأول المدرع',
    battalion: 'الكتيبة الأولى دبابات',
    company: 'السرية الثالثة',
    platoon: 'فصيل المدافع',
    jobTitle: 'قائد فصيل المدافع',
    enlistmentDate: '2021-07-01',
    currentStatus: 'مأمورية',
    logs: {
      movement: [
        {
          id: 'mov-601',
          date: '2026-07-15',
          type: 'مأمورية',
          details: 'مأمورية استطلاع حدودي بالمنطقة الغربية',
          issuingAuthority: 'قيادة اللواء الأول',
          effectiveDate: '2026-07-15'
        }
      ],
      attendance: [],
      medical: [],
      financial: [],
      security: [],
      armament: [
        {
          id: 'arm-601',
          weaponSerial: 'WPN-M16-3392',
          weaponType: 'بندقية M16A4',
          issueDate: '2022-01-10',
          ammoQty: 150,
          firelinesCount: 5,
          ammoHistory: [
            {
              id: 'ah-601',
              type: 'صرف',
              quantity: 150,
              date: '2026-07-15',
              reason: 'ذخيرة حية لمأمورية الاستطلاع',
              issuedBy: 'إدارة التسليح'
            }
          ],
          condition: 'ممتازة',
          technicalNotes: 'جاهزية قتالية عالية'
        }
      ],
      training: [],
      attachments: []
    }
  },
  {
    militaryId: 'MIL-100207',
    nationalId: '1021987654',
    fullName: 'مساعد بن سعد العنيزي',
    rank: 'رئيس رقباء',
    dob: '1980-03-30',
    pob: 'تبوك',
    maritalStatus: 'متزوج',
    education: 'دبلوم إدارة عسكرية',
    specialization: 'إدارة أفراد وشؤون إدارية',
    bloodType: 'O+',
    phone: '0507890123',
    photoUrl: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=300&q=80',
    biometricsRecorded: true,
    unit: 'اللواء الأول المدرع',
    battalion: 'قيادة اللواء',
    company: 'شعبة الموارد البشرية',
    platoon: 'قسم السجلات العسكرية',
    jobTitle: 'رئيس رقباء الكتيبة والمنسق الإداري',
    enlistmentDate: '1999-11-12',
    currentStatus: 'متواجد',
    logs: {
      movement: [],
      attendance: [],
      medical: [],
      financial: [
        {
          id: 'fin-701',
          date: '2026-07-01',
          type: 'راتب',
          amount: 16500,
          reason: 'صرف الراتب والبدلات الإدارية',
          transactionDate: '2026-07-01'
        }
      ],
      security: [],
      armament: [
        {
          id: 'arm-701',
          weaponSerial: 'WPN-BROWNING-0092',
          weaponType: 'مسدس Browning Hi-Power',
          issueDate: '2010-04-12',
          ammoQty: 26,
          firelinesCount: 2,
          ammoHistory: [],
          condition: 'ممتازة',
          technicalNotes: 'صيانة دورية منتظمة'
        }
      ],
      training: [],
      attachments: []
    }
  },
  {
    militaryId: 'MIL-100208',
    nationalId: '1010987654',
    fullName: 'فهد بن منصور المطيري',
    rank: 'رقيب أول',
    dob: '1987-09-12',
    pob: 'حفر الباطن',
    maritalStatus: 'متزوج',
    education: 'ثانوية عامة + دبلوم صيانة مدرعات',
    specialization: 'صيانة الآليات والدبابات',
    bloodType: 'B-',
    phone: '0508901234',
    photoUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=300&q=80',
    biometricsRecorded: true,
    unit: 'اللواء الأول المدرع',
    battalion: 'الكتيبة الأولى دبابات',
    company: 'السرية الفنية',
    platoon: 'فصيل الصيانة الثقيلة',
    jobTitle: 'مشرف فني صيانة محركات الدبابات',
    enlistmentDate: '2006-03-15',
    currentStatus: 'متواجد',
    logs: {
      movement: [],
      attendance: [],
      medical: [],
      financial: [],
      security: [],
      armament: [
        {
          id: 'arm-801',
          weaponSerial: 'WPN-AK47-0912',
          weaponType: 'بندقية AK-103',
          issueDate: '2018-02-10',
          ammoQty: 60,
          firelinesCount: 2,
          ammoHistory: [],
          condition: 'جيدة',
          technicalNotes: 'فحص فني ممتاز'
        }
      ],
      training: [
        {
          id: 'trn-801',
          courseName: 'دورة صيانة دبابات أبراج الهيدروليك',
          courseType: 'تقني',
          provider: 'معهد المدارعات العسكري',
          startDate: '2023-02-01',
          endDate: '2023-05-01',
          durationWeeks: 12,
          grade: 'ممتاز',
          evaluation: 'خبير في إصلاح الأعطال الميدانية السريعة',
          certificates: 'شهادة فني مدرعات معتمد'
        }
      ],
      attachments: []
    }
  },
  {
    militaryId: 'MIL-100209',
    nationalId: '1009876543',
    fullName: 'نايف بن عبيد الريمي',
    rank: 'رقيب',
    dob: '1990-12-01',
    pob: 'الباحة',
    maritalStatus: 'متزوج',
    education: 'ثانوية عامة',
    specialization: 'مشاة وقناصة',
    bloodType: 'O+',
    phone: '0509012345',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
    biometricsRecorded: true,
    unit: 'اللواء الثاني مشاة آلي',
    battalion: 'كتيبة الاستطلاع والفرسان',
    company: 'السرية الأولى',
    platoon: 'فصيل القناصة',
    jobTitle: 'قناص أول - فصيل القناصة',
    enlistmentDate: '2010-01-20',
    currentStatus: 'غياب',
    logs: {
      movement: [],
      attendance: [
        {
          id: 'att-901',
          date: '2026-07-24',
          type: 'غياب',
          reason: 'عدم الحضور في التمام الصباحي بدون عذر مشروع',
          durationDays: 3,
          approvedBy: 'قائد الكتيبة',
          startDate: '2026-07-24'
        }
      ],
      medical: [],
      financial: [
        {
          id: 'fin-901',
          date: '2026-07-25',
          type: 'استقطاع',
          amount: 850,
          reason: 'خصم أجر أيام الغياب بدون عذر رسمي',
          transactionDate: '2026-07-25'
        }
      ],
      security: [
        {
          id: 'sec-901',
          date: '2026-07-25',
          violation: 'الغياب عن التمام الصباحي لمدة 3 أيام متتالية',
          investigationDetails: 'تم فتح تحقيق أمني مسلكي لمعرفة أسباب عدم التواجد',
          penalty: 'إنذار كتابي أول مع حسم 3 أيام من الراتب',
          warningLevel: 'متوسط',
          detentionOrder: 'أمر إحضار للتحقيق العسكري',
          authority: 'الاستخبارات العسكرية والشرطة العسكرية',
          status: 'قيد التحقيق'
        }
      ],
      armament: [
        {
          id: 'arm-901',
          weaponSerial: 'WPN-SNIPER-ACCURACY-019',
          weaponType: 'بندقية قنص Accuracy International .338',
          issueDate: '2021-08-15',
          ammoQty: 40,
          firelinesCount: 4,
          ammoHistory: [],
          condition: 'ممتازة',
          technicalNotes: 'السلاح محفوظ بغرفة التسليح الرئيسية تحت حراسة مشددة'
        }
      ],
      training: [],
      attachments: []
    }
  },
  {
    militaryId: 'MIL-100210',
    nationalId: '1098765432',
    fullName: 'عمر بن طارق الضبيابي',
    rank: 'عريف',
    dob: '1996-05-18',
    pob: 'النماس',
    maritalStatus: 'أعزب',
    education: 'ثانوية عامة',
    specialization: 'سائق آليات ثقيلة',
    bloodType: 'A+',
    phone: '0501122334',
    photoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80',
    biometricsRecorded: true,
    unit: 'لواء التموين والنقل',
    battalion: 'كتيبة النقل الأولى',
    company: 'سرية القوافل',
    platoon: 'فصيل الناقلات',
    jobTitle: 'سائق ناقلة دبابات Oshkosh M1070',
    enlistmentDate: '2017-02-10',
    currentStatus: 'إذن',
    logs: {
      movement: [],
      attendance: [
        {
          id: 'att-1001',
          date: '2026-07-26',
          type: 'إذن',
          reason: 'إذن خروج إداري مؤقت لمراجعة دائرة حكومية',
          durationDays: 1,
          approvedBy: 'قائد السرية',
          startDate: '2026-07-26',
          endDate: '2026-07-26'
        }
      ],
      medical: [],
      financial: [],
      security: [],
      armament: [
        {
          id: 'arm-1001',
          weaponSerial: 'WPN-G3-55910',
          weaponType: 'بندقية G3A3 7.62mm',
          issueDate: '2019-05-01',
          ammoQty: 40,
          firelinesCount: 2,
          ammoHistory: [],
          condition: 'جيدة',
          technicalNotes: 'سلاح شخصي معتمد'
        }
      ],
      training: [],
      attachments: []
    }
  },
  {
    militaryId: 'MIL-100211',
    nationalId: '1087654321',
    fullName: 'وليد بن حمد السبيعي',
    rank: 'جندي أول',
    dob: '2000-01-11',
    pob: 'الرين',
    maritalStatus: 'أعزب',
    education: 'ثانوية عامة',
    specialization: 'حراسات وأمن منشآت',
    bloodType: 'O+',
    phone: '0502233445',
    photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
    biometricsRecorded: true,
    unit: 'كتيبة الشرطة العسكرية',
    battalion: 'الكتيبة الأولى شرطة عسكرية',
    company: 'سرية الحراسات الخاصة',
    platoon: 'فصيل بوابات القيادة',
    jobTitle: 'رجل حراسة وتفتيش بوابات',
    enlistmentDate: '2021-03-01',
    currentStatus: 'متواجد',
    logs: {
      movement: [],
      attendance: [],
      medical: [],
      financial: [],
      security: [],
      armament: [
        {
          id: 'arm-1101',
          weaponSerial: 'WPN-MP5-99201',
          weaponType: 'رشاش قصير MP5 9mm',
          issueDate: '2022-04-15',
          ammoQty: 60,
          firelinesCount: 2,
          ammoHistory: [],
          condition: 'ممتازة',
          technicalNotes: 'جاهزية كاملة للخدمة'
        }
      ],
      training: [],
      attachments: []
    }
  },
  {
    militaryId: 'MIL-100212',
    nationalId: '1076543210',
    fullName: 'ياسر بن صالح الصراري',
    rank: 'جندي',
    dob: '2002-06-25',
    pob: 'القصيم',
    maritalStatus: 'أعزب',
    education: 'ثانوية عامة',
    specialization: 'مشاة عامة',
    bloodType: 'B+',
    phone: '0503344556',
    photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80',
    biometricsRecorded: false,
    unit: 'اللواء الأول المدرع',
    battalion: 'الكتيبة الأولى دبابات',
    company: 'السرية الأولى',
    platoon: 'فصيل المشاة المرافقة',
    jobTitle: 'جندي مشاة مرافقة مدرعات',
    enlistmentDate: '2025-01-15',
    currentStatus: 'فرار',
    logs: {
      movement: [],
      attendance: [
        {
          id: 'att-1201',
          date: '2026-07-10',
          type: 'فرار',
          reason: 'تغيب عن الوحدة لأكثر من 15 يوماً دون عذر مقنع (حالة فرار رسمية)',
          durationDays: 16,
          approvedBy: 'قائد اللواء والأمن العسكري',
          startDate: '2026-07-10'
        }
      ],
      medical: [],
      financial: [],
      security: [
        {
          id: 'sec-1201',
          date: '2026-07-15',
          violation: 'جريمة الفرار من الخدمة العسكرية في وقت الجاهزية',
          investigationDetails: 'صدر أمر القبض والإحضار القهري من النيابة العسكرية',
          penalty: 'المحاكمة العسكرية وسحب الرتبة والطرد في حال الإدانة',
          warningLevel: 'شديد الخطورة',
          detentionOrder: 'أمر قبص قهري صادر لكل وحدات الشرطة العسكرية',
          authority: 'النيابة العسكرية والشرطة العسكرية',
          status: 'محال للقضاء العسكري'
        }
      ],
      armament: [
        {
          id: 'arm-1201',
          weaponSerial: 'WPN-G3-11029',
          weaponType: 'بندقية G3A3',
          issueDate: '2025-02-01',
          returnDate: '2026-07-10',
          ammoQty: 0,
          firelinesCount: 0,
          ammoHistory: [],
          condition: 'جيدة',
          technicalNotes: 'تم تسليم السلاح لمشجب السرية قبل الهروب'
        }
      ],
      training: [],
      attachments: []
    }
  },
  {
    militaryId: 'MIL-100213',
    nationalId: '1065432109',
    fullName: 'بدر بن زياد المالكي',
    rank: 'وكيل رقيب',
    dob: '1993-08-14',
    pob: 'الطائف',
    maritalStatus: 'متزوج',
    education: 'دبلوم مساحة ومخططات',
    specialization: 'مهندسين عسكريين وألغام',
    bloodType: 'AB-',
    phone: '0504455667',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
    biometricsRecorded: true,
    unit: 'لواء المهندسين العسكريين',
    battalion: 'كتيبة الألغام والمفرقعات',
    company: 'سرية التطهير',
    platoon: 'فصيل الكشف والنزع',
    jobTitle: 'فني تفكيك مفرقعات وألغام',
    enlistmentDate: '2015-05-10',
    currentStatus: 'موقوف',
    logs: {
      movement: [],
      attendance: [
        {
          id: 'att-1301',
          date: '2026-07-21',
          type: 'احتجاز',
          reason: 'توقيف تحفظي بالشرطة العسكرية جراء مخالفة التعليمات الأفراد',
          durationDays: 5,
          approvedBy: 'قائد الكتيبة',
          startDate: '2026-07-21',
          endDate: '2026-07-26'
        }
      ],
      medical: [],
      financial: [],
      security: [
        {
          id: 'sec-1301',
          date: '2026-07-21',
          violation: 'مخالفة قواعد السلامة أثناء التعامل مع العبوات النانسفة التجريبية',
          investigationDetails: 'تحقيق انضباطي داخلي بالكتيبة',
          penalty: 'حجز 7 أيام بالسجن العسكري الخفيف',
          warningLevel: 'متوسط',
          detentionOrder: 'قرار حجز رقم 441/2026',
          authority: 'قيادة كتيبة المهندسين',
          status: 'تم البت'
        }
      ],
      armament: [],
      training: [
        {
          id: 'trn-1301',
          courseName: 'دورة التعامل مع الألغام والعبوات المبتكرة C-IED',
          courseType: 'تخصصي',
          provider: 'معهد المهندسين العسكريين',
          startDate: '2022-01-10',
          endDate: '2022-04-10',
          durationWeeks: 12,
          grade: 'ممتاز',
          evaluation: 'خبرة ميدانية عالية',
          certificates: 'شهادة خبير نزع ألغام'
        }
      ],
      attachments: []
    }
  },
  {
    militaryId: 'MIL-100214',
    nationalId: '1054321098',
    fullName: 'ماجد بن عيسى الكندي',
    rank: 'عقيد',
    dob: '1981-12-04',
    pob: 'عمران',
    maritalStatus: 'متزوج',
    education: 'ماجستير استخبارات وأمن قومي',
    specialization: 'أمن عسكري واستخبارات مضادة',
    bloodType: 'O+',
    phone: '0505566778',
    photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80',
    biometricsRecorded: true,
    unit: 'الاستخبارات والأمن العسكري',
    battalion: 'إدارة الأمن الوقائي',
    company: 'شعبة الاستعلامات',
    platoon: 'قسم التحريات',
    jobTitle: 'رئيس شعبة الاستعلامات والتحريات الأمنية',
    enlistmentDate: '2001-08-25',
    currentStatus: 'احتياط',
    logs: {
      movement: [
        {
          id: 'mov-1401',
          date: '2026-06-01',
          type: 'تكليف',
          details: 'إلحاق بقوة الاحتياط الجاهز للاستدعاء الفوري',
          issuingAuthority: 'هيئة أركان القوات المسلحة',
          effectiveDate: '2026-06-01'
        }
      ],
      attendance: [],
      medical: [],
      financial: [],
      security: [],
      armament: [
        {
          id: 'arm-1401',
          weaponSerial: 'WPN-GLOCK-00911',
          weaponType: 'مسدس Glock 17',
          issueDate: '2015-09-01',
          ammoQty: 30,
          firelinesCount: 2,
          ammoHistory: [],
          condition: 'ممتازة',
          technicalNotes: 'سلاح شخصي مرخص'
        }
      ],
      training: [],
      attachments: []
    }
  },
  {
    militaryId: 'MIL-100215',
    nationalId: '1043210987',
    fullName: 'عماد بن طلال الشريف',
    rank: 'ملازم أول',
    dob: '1994-03-29',
    pob: 'مكة المكرمة',
    maritalStatus: 'متزوج',
    education: 'بكالوريوس طيران عسكري',
    specialization: 'طيران طائرات بدون طيار (درون)',
    bloodType: 'A+',
    phone: '0506677889',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    biometricsRecorded: true,
    unit: 'جناح الطيران العسكري العمودي',
    battalion: 'سرب الاستطلاع الجوي والدرون',
    company: 'السرب الرابع',
    platoon: 'فصيل المسيرات',
    jobTitle: 'قائد مشغل طائرات الاستطلاع المسيرة',
    enlistmentDate: '2017-07-20',
    currentStatus: 'مفقود',
    logs: {
      movement: [],
      attendance: [
        {
          id: 'att-1501',
          date: '2026-07-18',
          type: 'غياب',
          reason: 'انقطاع الاتصال بالطائرة والضابط المشغل أثناء مهمة استطلاع جوية شاقة',
          durationDays: 8,
          approvedBy: 'قيادة الطيران العسكري',
          startDate: '2026-07-18'
        }
      ],
      medical: [],
      financial: [],
      security: [
        {
          id: 'sec-1501',
          date: '2026-07-19',
          violation: 'فقدان أثناء المهمة العملياتية الرسمية',
          investigationDetails: 'جاري تنفيذ عمليات البحث والإنقاذ المسنودة بالطيران العمودي والفرسان',
          penalty: 'لا يوجد - حالة طوارئ عملياتية',
          warningLevel: 'شديد الخطورة',
          authority: 'قيادة العمليات المشتركة والاستخبارات',
          status: 'قيد التحقيق'
        }
      ],
      armament: [],
      training: [
        {
          id: 'trn-1501',
          courseName: 'دورة قيادة الطائرات المسيرة التكتيكية CH-4',
          courseType: 'تقني',
          provider: 'معهد طيران القوات المسلحة',
          startDate: '2023-01-10',
          endDate: '2023-06-10',
          durationWeeks: 20,
          grade: 'ممتاز',
          evaluation: 'طيار درون ممتاز مع أكثر من 400 ساعة طيران عملياتي',
          certificates: 'ترخيص طيار مسيرات عسكرية متقدم'
        }
      ],
      attachments: []
    }
  }
];

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'aud-1',
    timestamp: '2026-07-26 10:15:22',
    userName: 'العقيد د. خالد الآنسي',
    department: 'القيادة الرئيسية',
    accountId: 'hq',
    accountName: 'لواء القيادة',
    action: 'تحديث حالة الجاهزية',
    targetMilitaryId: 'MIL-100201',
    targetName: 'خالد بن عبد الله الآنسي',
    details: 'اعتماد تمام القوة الصباحي وتحديث الجاهزية القتالية بنسبة 86.4%'
  },
  {
    id: 'aud-2',
    timestamp: '2026-07-26 09:30:10',
    userName: 'الرقيب أول مساعد السبيعي',
    department: 'إدارة الموارد البشرية',
    accountId: 'brigade1',
    accountName: 'اللواء الأول',
    action: 'تسجيل إذن خروج',
    targetMilitaryId: 'MIL-100210',
    targetName: 'عمر بن طارق الضبيابي',
    details: 'إضافة إذن خروج إداري لمدة يوم واحد لمراجعة دائرة حكومية'
  },
  {
    id: 'aud-3',
    timestamp: '2026-07-25 16:45:00',
    userName: 'الملازم أول عبد الرحمن الأهدل',
    department: 'إدارة الموارد البشرية',
    accountId: 'brigade2',
    accountName: 'اللواء الثاني',
    action: 'إدخال سجل طبي وتنويم',
    targetMilitaryId: 'MIL-100205',
    targetName: 'سلطان بن حمد الصايدي',
    details: 'تسجيل دخول المستشفى العسكري وجراحة تثبيت كسر وإدخال وصفة أدوية'
  },
  {
    id: 'aud-4',
    timestamp: '2026-07-25 14:10:05',
    userName: 'المقدم الركن ناصر العولقي',
    department: 'إدارة التسليح',
    accountId: 'brigade1',
    accountName: 'اللواء الأول',
    action: 'صرف ذخيرة حية',
    targetMilitaryId: 'MIL-100206',
    targetName: 'تركي بن منصور السنحاني',
    details: 'صرف 150 طلقة 5.56mm و 5 خزائن لمأمورية الاستطلاع الميداني'
  },
  {
    id: 'aud-5',
    timestamp: '2026-07-24 11:20:00',
    userName: 'العقيد ماجد الكندي',
    department: 'الاستخبارات والأمن',
    accountId: 'brigade3',
    accountName: 'اللواء الثالث',
    action: 'فتح ملف تحقيق أمني',
    targetMilitaryId: 'MIL-100209',
    targetName: 'نايف بن عبيد الريمي',
    details: 'تسجيل حالة غياب بدون عذر وإصدار إنذار واستقطاع مالي'
  }
];

export const INITIAL_ALERTS: SystemAlert[] = [
  {
    id: 'alt-1',
    title: 'تنبيه غياب وفرار أمني',
    description: 'تسجيل حالة فرار للجندي ياسر بن صالح الصراري (MIL-100212) - أمر إحضار قهري صادر',
    level: 'urgent',
    date: '2026-07-26',
    militaryId: 'MIL-100212'
  },
  {
    id: 'alt-2',
    title: 'مفتقد أثناء المهمة العملياتية',
    description: 'الملازم أول عماد بن طلال الشريف (MIL-100215) مفقود أثناء دورية الدرون الجوية',
    level: 'urgent',
    date: '2026-07-25',
    militaryId: 'MIL-100215'
  },
  {
    id: 'alt-3',
    title: 'اقتراب انتهاء إجازة سنوية',
    description: 'إجازة الرائد محمد بن سالم العولقي (MIL-100203) تنتهي بتاريخ 2026-08-04',
    level: 'info',
    date: '2026-07-25',
    militaryId: 'MIL-100203'
  },
  {
    id: 'alt-4',
    title: 'مريض منوم بالمستشفى العسكري',
    description: 'الملازم أول سلطان الصايدي (MIL-100205) منوم بجراحة عظام - يستحق مراجعة طبية',
    level: 'warning',
    date: '2026-07-23',
    militaryId: 'MIL-100205'
  }
];
