import { OrganizationTenant, TenantUserAccount } from '../types';

export const DEFAULT_TENANTS: OrganizationTenant[] = [
  {
    id: 'tenant-hq-main',
    name: 'المؤسسة القيادية المركزية - الفرقة الثالثة',
    code: 'ORG-HQ-01',
    category: 'عسكري',
    badge: '🏛️',
    description: 'القيادة المركزية العامة - النطاق الرئيسي الشامل لكافة الألوية والقطاعات',
    status: 'نشط',
    createdAt: '2026-01-01',
    isDefaultMain: true,
    unitFilter: 'الكل',
    superAdminUsername: 'admin_hq',
    superAdminName: 'اللواء / قائد الفرقة الثالثة (المسؤول الرئيسي)',
    superAdminEmail: 'superadmin.hq@military.gov'
  },
  {
    id: 'tenant-brigade-1',
    name: 'مؤسسة اللواء الأول - حرس حدود',
    code: 'ORG-BRIG-01',
    category: 'عسكري',
    badge: '⚔️',
    description: 'قيادة وقواعد اللواء الأول - حرس الحدود والاستطلاع الميداني',
    status: 'نشط',
    createdAt: '2026-01-15',
    isDefaultMain: false,
    unitFilter: 'اللواء الأول',
    superAdminUsername: 'admin_b1',
    superAdminName: 'العميد / قائد اللواء الأول (المسؤول الرئيسي)',
    superAdminEmail: 'superadmin.b1@military.gov'
  },
  {
    id: 'tenant-brigade-2',
    name: 'مؤسسة اللواء الثاني - مشاة ميكانيكي',
    code: 'ORG-BRIG-02',
    category: 'عسكري',
    badge: '🛡️',
    description: 'قيادة وقواعد اللواء الثاني - المشاة الميكانيكي المدرع',
    status: 'نشط',
    createdAt: '2026-02-01',
    isDefaultMain: false,
    unitFilter: 'اللواء الثاني',
    superAdminUsername: 'admin_b2',
    superAdminName: 'العميد / قائد اللواء الثاني (المسؤول الرئيسي)',
    superAdminEmail: 'superadmin.b2@military.gov'
  },
  {
    id: 'tenant-medical-hq',
    name: 'المؤسسة الطبية العسكرية والمستشفيات',
    code: 'ORG-MED-01',
    category: 'طبي',
    badge: '🏥',
    description: 'إدارة المستشفيات والخدمات الطبية العسكرية وشؤون الجرحى والمستشفيات الميدانية',
    status: 'نشط',
    createdAt: '2026-02-10',
    isDefaultMain: false,
    unitFilter: 'الإدارة الطبية العسكرية',
    superAdminUsername: 'admin_med',
    superAdminName: 'الدكتور / المدير الطبي العام (المسؤول الرئيسي)',
    superAdminEmail: 'superadmin.med@military.gov'
  },
  {
    id: 'tenant-security-hq',
    name: 'مؤسسة الأمن والاستخبارات العسكرية',
    code: 'ORG-SEC-01',
    category: 'أمني',
    badge: '🔒',
    description: 'منظومة الاستخبارات العسكرية والأمن الوقائي ومراقبة التصاريح والمنافذ',
    status: 'نشط',
    createdAt: '2026-03-01',
    isDefaultMain: false,
    unitFilter: 'الاستخبارات والأمن',
    superAdminUsername: 'admin_sec',
    superAdminName: 'العقيد / رئيس فرع الاستخبارات (المسؤول الرئيسي)',
    superAdminEmail: 'superadmin.sec@military.gov'
  }
];

export const createFullSuperAdminUser = (tenant: OrganizationTenant, customUsername?: string, customPassword?: string): TenantUserAccount => {
  return {
    id: `user-superadmin-${tenant.id}`,
    tenantId: tenant.id,
    username: customUsername || tenant.superAdminUsername || `admin_${tenant.code.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
    password: customPassword || 'Admin@123456',
    fullName: tenant.superAdminName || `المسؤول الرئيسي - ${tenant.name}`,
    rank: 'مسؤول رئيسي Super Admin',
    email: tenant.superAdminEmail || `admin@${tenant.code.toLowerCase()}.gov`,
    phone: '+967 770 000 000',
    isSuperAdmin: true,
    roleTitle: 'مسؤول المنظومة الرئيسي (Super Admin)',
    status: 'نشط',
    createdAt: tenant.createdAt || new Date().toISOString().split('T')[0],
    permissions: {
      role: 'القيادة الرئيسية',
      canAdd: true,
      canEdit: true,
      canDelete: true,
      canExport: true,
      modules: {
        personnel: true,
        armament: true,
        medical: true,
        security: true,
        reports: true,
        audit: true,
        accounts: true
      }
    }
  };
};

