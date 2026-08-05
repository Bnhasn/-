import {
  PersonnelRecord,
  PersonnelStatus,
  AuditLogEntry,
  SystemAlert,
  DepartmentRole,
  MovementLog,
  AttendanceLog,
  MedicalLog,
  FinancialLog,
  SecurityLog,
  ArmamentLog,
  TrainingLog,
  PersonnelAttachment,
  SupplyLog,
  RecycledPersonnel,
  UserAccount,
  PersonnelReplacementRecord,
  OrganizationTenant,
  TenantUserAccount
} from '../types';
import { DEFAULT_TENANTS, createFullSuperAdminUser } from '../data/tenantData';
import { INITIAL_PERSONNEL, INITIAL_AUDIT_LOGS, INITIAL_ALERTS } from '../data/initialData';
import { BRIGADE_ACCOUNTS, getAccountIdForUnit } from '../data/accountsData';
import {
  ArmoryInventoryItem,
  ArmoryWeaponPiece,
  ArmoryIntakeRecord,
  ArmoryIssueOrder,
  WeaponLifecycleEvent,
  WeaponTypeConfig,
  AmmoTypeConfig,
  INITIAL_INVENTORY_ITEMS,
  INITIAL_WEAPON_PIECES,
  INITIAL_INTAKE_RECORDS,
  INITIAL_ISSUE_ORDERS,
  INITIAL_LIFECYCLE_EVENTS,
  INITIAL_WEAPON_TYPES,
  INITIAL_AMMO_TYPES
} from '../data/armamentData';
import { syncDocToCloud, subscribeCloudDoc } from './firebase';
import { safeSetLocalItem, safeGetLocalItem } from './safeLocalStorage';
import { getDeviceTelemetry } from './deviceTelemetry';

const STORAGE_KEY_PERSONNEL = 'military_hr_personnel_v2';
const STORAGE_KEY_AUDIT = 'military_hr_audit_logs_v2';
const STORAGE_KEY_ALERTS = 'military_hr_alerts_v2';
const STORAGE_KEY_RECYCLE_BIN = 'military_hr_recycle_bin_v1';
const STORAGE_KEY_REPLACEMENTS = 'military_hr_replacements_v1';

const STORAGE_KEY_ARMORY_INVENTORY = 'military_armory_inventory_v1';
const STORAGE_KEY_ARMORY_WEAPONS = 'military_armory_weapons_v1';
const STORAGE_KEY_ARMORY_INTAKES = 'military_armory_intakes_v1';
const STORAGE_KEY_ARMORY_ISSUES = 'military_armory_issues_v1';
const STORAGE_KEY_ARMORY_LIFECYCLE = 'military_armory_lifecycle_v1';
const STORAGE_KEY_WEAPON_TYPES = 'military_weapon_types_config_v1';
const STORAGE_KEY_AMMO_TYPES = 'military_ammo_types_config_v1';
const STORAGE_KEY_ACCOUNTS = 'military_accounts_config_v2';
const STORAGE_KEY_ACTIVE_TENANT = 'military_active_tenant_id_v1';
const STORAGE_KEY_REGISTERED_TENANTS = 'military_registered_tenants_v1';

const syncChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window ? new BroadcastChannel('military_hq_sync') : null;

const notifyDataChange = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('military_data_changed'));
    if (syncChannel) {
      try {
        syncChannel.postMessage({ type: 'DATA_UPDATED', timestamp: Date.now() });
      } catch (err) {
        console.error('Failed to post broadcast message:', err);
      }
    }
  }
};

export class StorageService {
  private static cloudSubscribed = false;
  private static cloudUnsubscribers: (() => void)[] = [];

  // Multi-Tenant Isolation Helpers
  static getActiveTenantId(): string {
    if (typeof window !== 'undefined') {
      try {
        const id = localStorage.getItem(STORAGE_KEY_ACTIVE_TENANT);
        if (id) return id;
      } catch (e) {}
    }
    return DEFAULT_TENANTS[0].id; // 'tenant-hq-main'
  }

  static getTenants(): OrganizationTenant[] {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(STORAGE_KEY_REGISTERED_TENANTS);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {}
    }
    return DEFAULT_TENANTS;
  }

  static saveTenants(tenants: OrganizationTenant[]): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_REGISTERED_TENANTS, JSON.stringify(tenants));
        syncDocToCloud('registered_tenants', tenants);
        notifyDataChange();
      } catch (e) {}
    }
  }

  static getActiveTenant(): OrganizationTenant {
    const list = this.getTenants();
    const activeId = this.getActiveTenantId();
    return list.find((t) => t.id === activeId) || list[0] || DEFAULT_TENANTS[0];
  }

  static setActiveTenant(tenant: OrganizationTenant): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_ACTIVE_TENANT, tenant.id);
        this.restartCloudSync();
        notifyDataChange();
      } catch (e) {}
    }
  }

  static addTenant(newTenant: OrganizationTenant): void {
    const list = this.getTenants();
    if (!list.some((t) => t.id === newTenant.id)) {
      list.push(newTenant);
      this.saveTenants(list);
    }
    // Automatically seed Super Admin user for this new tenant
    const superAdmin = createFullSuperAdminUser(newTenant);
    this.addTenantUser(newTenant.id, superAdmin);
  }

  // Tenant Users & Permissions Management
  static getTenantUsers(tenantId?: string): TenantUserAccount[] {
    const targetId = tenantId || this.getActiveTenantId();
    const key = `military_tenant_users_${targetId}_v1`;
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {}
    }
    // If no users exist, initialize default Super Admin for this tenant
    const activeTenantObj = this.getTenants().find((t) => t.id === targetId) || this.getActiveTenant();
    const defaultSuperAdmin = createFullSuperAdminUser(activeTenantObj);
    const initialList = [defaultSuperAdmin];
    this.saveTenantUsers(targetId, initialList);
    return initialList;
  }

  static saveTenantUsers(tenantId: string, users: TenantUserAccount[]): void {
    const key = `military_tenant_users_${tenantId}_v1`;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(key, JSON.stringify(users));
        syncDocToCloud(`tenant_users_${tenantId}`, users);
        notifyDataChange();
      } catch (e) {}
    }
  }

  static addTenantUser(tenantId: string, newUser: TenantUserAccount): void {
    const users = this.getTenantUsers(tenantId);
    if (!users.some((u) => u.id === newUser.id || u.username.toLowerCase() === newUser.username.toLowerCase())) {
      users.push(newUser);
      this.saveTenantUsers(tenantId, users);
    }
  }

  static updateTenantUser(tenantId: string, updatedUser: TenantUserAccount): void {
    const users = this.getTenantUsers(tenantId);
    const index = users.findIndex((u) => u.id === updatedUser.id);
    if (index !== -1) {
      users[index] = updatedUser;
      this.saveTenantUsers(tenantId, users);
    }
  }

  static deleteTenantUser(tenantId: string, userId: string): void {
    const users = this.getTenantUsers(tenantId);
    const filtered = users.filter((u) => u.id !== userId || u.isSuperAdmin); // Never delete Super Admin
    this.saveTenantUsers(tenantId, filtered);
  }

  // Current Logged-in User Session Management
  static getCurrentUser(): TenantUserAccount | null {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('military_current_logged_user_v1');
        if (raw) {
          return JSON.parse(raw);
        }
      } catch (e) {}
    }
    // Fallback: Default to Active Tenant Super Admin
    const activeTenant = this.getActiveTenant();
    const users = this.getTenantUsers(activeTenant.id);
    const superAdmin = users.find((u) => u.isSuperAdmin) || users[0] || createFullSuperAdminUser(activeTenant);
    return superAdmin;
  }

  static setCurrentUser(user: TenantUserAccount | null): void {
    if (typeof window !== 'undefined') {
      try {
        if (user) {
          localStorage.setItem('military_current_logged_user_v1', JSON.stringify(user));
        } else {
          localStorage.removeItem('military_current_logged_user_v1');
        }
        notifyDataChange();
      } catch (e) {}
    }
  }

  static logoutUser(): void {
    this.setCurrentUser(null);
  }

  static authenticateTenantUser(
    username: string,
    password?: string,
    targetTenantId?: string
  ): { success: boolean; user?: TenantUserAccount; tenant?: OrganizationTenant; message?: string } {
    const tenants = this.getTenants();
    const cleanUsername = username.trim().toLowerCase();

    // Search across tenants or in specified tenant
    const candidateTenants = targetTenantId ? tenants.filter((t) => t.id === targetTenantId) : tenants;

    for (const t of candidateTenants) {
      const users = this.getTenantUsers(t.id);
      const user = users.find((u) => u.username.toLowerCase() === cleanUsername);

      if (user) {
        if (user.status === 'موقوف' || user.status === 'محظور') {
          return { success: false, message: `هذا الحساب (${user.fullName}) موقوف حالياً من قِبل مسؤول المؤسسة!` };
        }

        // Verify password if provided
        if (password && user.password && user.password !== password) {
          return { success: false, message: 'كلمة المرور غير صحيحة! يرجى إعادة المحاولة.' };
        }

        // Update last login
        const updatedUser = { ...user, lastLogin: new Date().toISOString() };
        this.updateTenantUser(t.id, updatedUser);
        this.setActiveTenant(t);
        this.setCurrentUser(updatedUser);

        return { success: true, user: updatedUser, tenant: t };
      }
    }

    return { success: false, message: 'اسم المستخدم غير موجود أو لم يتم العثور على حساب مطابق!' };
  }

  // Tenant-isolated key resolver for LocalStorage
  static getKeyForTenant(baseKey: string): string {
    const activeId = this.getActiveTenantId();
    if (!activeId || activeId === 'tenant-hq-main') {
      return baseKey; // Default main tenant uses base un-prefixed keys for 100% data preservation
    }
    return `tenant_${activeId}_${baseKey}`;
  }

  // Tenant-isolated document ID resolver for Cloud Firestore
  static getCloudDocIdForTenant(baseDocId: string): string {
    const activeId = this.getActiveTenantId();
    if (!activeId || activeId === 'tenant-hq-main') {
      return baseDocId;
    }
    return `${activeId}_${baseDocId}`;
  }

  static restartCloudSync(): void {
    if (this.cloudUnsubscribers.length > 0) {
      this.cloudUnsubscribers.forEach((u) => u());
      this.cloudUnsubscribers = [];
    }
    this.cloudSubscribed = false;
    this.initCloudSync();
  }

  // Initialize Cloud Live Sync with Firebase Firestore (Disabled for 100% local storage)
  static initCloudSync(): () => void {
    return () => {};
  }

  // Subscribe to live changes across tabs / components
  static notifySubscribers(): void {
    notifyDataChange();
  }

  static subscribeToChanges(callback: () => void): () => void {
    this.initCloudSync();
    const handleEvent = () => callback();
    if (typeof window !== 'undefined') {
      window.addEventListener('military_data_changed', handleEvent);
      window.addEventListener('storage', handleEvent);
      if (syncChannel) {
        syncChannel.onmessage = (event) => {
          if (event.data?.type === 'DATA_UPDATED') {
            callback();
          }
        };
      }
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('military_data_changed', handleEvent);
        window.removeEventListener('storage', handleEvent);
      }
    };
  }

  // Automatic check for expired leaves/permissions and 30-day absences
  static checkAndProcessExpiredLeavesAndAbsences(list: PersonnelRecord[]): { updated: boolean; records: PersonnelRecord[] } {
    let updated = false;
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    list.forEach((p) => {
      if (!p.logs) return;
      if (!p.logs.attendance) p.logs.attendance = [];

      // RULE 1: Check if soldier is currently on 'إجازة' or 'إذن' and leave expired
      if (['إجازة', 'إذن', 'مجاز'].includes(p.currentStatus)) {
        const activeLog = p.logs.attendance.find(
          (a) => (a.type === 'إجازة' || a.type === 'إذن') && a.endDate
        );

        if (activeLog && activeLog.endDate && activeLog.endDate < todayStr) {
          // Expiration date has passed without updating to 'متواجد'
          p.currentStatus = 'غياب';
          updated = true;

          const newLog: AttendanceLog = {
            id: `att-auto-absent-${Date.now()}-${p.militaryId}`,
            date: todayStr,
            type: 'غياب',
            reason: `انقضاء تاريخ انتهاء ${activeLog.type} المحدد (${activeLog.endDate}) دون تقديم تحضير - تم تحويل الحالة آلياً إلى غياب`,
            durationDays: 1,
            approvedBy: 'النظام الإداري الآلي',
            startDate: todayStr
          };
          p.logs.attendance.unshift(newLog);

          this.addAlert({
            title: `تنبيه انقضاء إجازة/إذن: تحويل إلى غياب`,
            description: `تجاوز الفرد ${p.rank} ${p.fullName} (${p.militaryId}) تاريخ انتهاء إذنه/إجازته (${activeLog.endDate}) دون تحضير. تم تعديل الحالة رسمياً إلى (غياب).`,
            level: 'warning',
            militaryId: p.militaryId
          });
        }
      }

      // RULE 2: Check if soldier has been in 'غياب' for >= 30 days without status updated to 'متواجد'
      if (['غياب', 'غائب'].includes(p.currentStatus)) {
        const absentLog = p.logs.attendance.find(
          (a) => a.type === 'غياب' || ((a.type === 'إجازة' || a.type === 'إذن') && a.endDate)
        );

        const absenceStartDateStr = absentLog
          ? absentLog.type === 'غياب'
            ? absentLog.startDate || absentLog.date
            : absentLog.endDate
          : null;

        if (absenceStartDateStr) {
          const startDateObj = new Date(absenceStartDateStr);
          const diffMs = today.getTime() - startDateObj.getTime();
          const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

          if (diffDays >= 30) {
            // 30 days passed without updating status to 'متواجد' -> Status becomes 'فرار'
            p.currentStatus = 'فرار';
            updated = true;

            const desertionLog: AttendanceLog = {
              id: `att-auto-desertion-${Date.now()}-${p.militaryId}`,
              date: todayStr,
              type: 'فرار',
              reason: `انقضاء 30 يوماً متواصلة على الغياب (${absenceStartDateStr}) دون تحضير - تم تعديل الحالة رسمياً إلى (فرار) بموجب اللوائح العسكرية`,
              durationDays: diffDays,
              approvedBy: 'القضاء العسكري والقيادة العامة',
              startDate: todayStr
            };
            p.logs.attendance.unshift(desertionLog);

            this.addAlert({
              title: `🚨 بلاغ فرار رسمي: تجاوز 30 يوماً غياب`,
              description: `الفرد ${p.rank} ${p.fullName} (${p.militaryId}) انقضى على غيابه 30 يوماً متواصلة دون تقديم تحضير. تم اعتماد حالة (فرار) رسمياً وإحالة السجل للجهات القضائية.`,
              level: 'urgent',
              militaryId: p.militaryId
            });
          }
        }
      }
    });

    return { updated, records: list };
  }

  // Load personnel list
  static getPersonnel(): PersonnelRecord[] {
    try {
      const key = this.getKeyForTenant(STORAGE_KEY_PERSONNEL);
      const parsed = safeGetLocalItem<PersonnelRecord[]>(key);
      if (parsed && Array.isArray(parsed) && parsed.length > 0) {
        const mapped = parsed.map((p) => {
          p.createdByAccountId = getAccountIdForUnit(p.unit, p.createdByAccountId || 'hq');
          if (!p.logs) {
            p.logs = {
              movement: [],
              attendance: [],
              medical: [],
              financial: [],
              security: [],
              armament: [],
              training: [],
              attachments: [],
              supply: []
            };
          } else if (!p.logs.supply) {
            p.logs.supply = [];
          }
          return p;
        });

        const { updated, records: processed } = this.checkAndProcessExpiredLeavesAndAbsences(mapped);
        if (updated) {
          this.savePersonnel(processed);
        }
        return processed;
      }
    } catch (err) {
      console.error('Failed to load personnel from safe storage:', err);
    }
    // Default fallback: load initial personnel if main tenant, otherwise empty for custom tenant
    if (this.getActiveTenantId() === 'tenant-hq-main') {
      this.savePersonnel(INITIAL_PERSONNEL);
      return INITIAL_PERSONNEL;
    }
    return [];
  }

  // Grant Leave or Permission directly
  static grantLeaveOrPermission(
    militaryId: string,
    grantType: 'إجازة' | 'إذن',
    details: {
      leaveType?: string;
      permissionType?: string;
      durationDays: number;
      startDate: string;
      endDate: string;
      reason: string;
      approvedBy: string;
      notes?: string;
    },
    actingUser: string,
    actingDept: DepartmentRole
  ): boolean {
    const list = this.getPersonnel();
    const person = list.find((p) => p.militaryId === militaryId);
    if (!person) return false;

    const oldStatus = person.currentStatus;
    const targetStatus: PersonnelStatus = grantType === 'إجازة' ? 'إجازة' : 'إذن';
    person.currentStatus = targetStatus;

    const newAttLog: AttendanceLog = {
      id: `att-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      date: new Date().toISOString().split('T')[0],
      type: grantType,
      leaveType: details.leaveType,
      permissionType: details.permissionType,
      reason: details.reason || `منح ${grantType} (${details.leaveType || details.permissionType || 'رسمي'})`,
      durationDays: details.durationDays,
      startDate: details.startDate,
      endDate: details.endDate,
      approvedBy: details.approvedBy || actingUser || 'إدارة الموارد البشرية والقيادة',
      notes: details.notes
    };

    if (!person.logs.attendance) {
      person.logs.attendance = [];
    }
    person.logs.attendance.unshift(newAttLog);

    this.savePersonnel(list);

    this.logAction(
      actingUser,
      actingDept,
      `مصادقة منح ${grantType}`,
      militaryId,
      person.fullName,
      `منح ${grantType} نوع: (${details.leaveType || details.permissionType || 'عام'}) - المدة: ${details.durationDays} يوم - ينتهي في: ${details.endDate} - المعتمد: ${details.approvedBy}`
    );

    return true;
  }

  // Save personnel list
  static savePersonnel(records: PersonnelRecord[]): void {
    try {
      const key = this.getKeyForTenant(STORAGE_KEY_PERSONNEL);
      const cloudDocId = this.getCloudDocIdForTenant('personnel');
      safeSetLocalItem(key, records);
      syncDocToCloud(cloudDocId, records);
      notifyDataChange();
    } catch (err) {
      console.error('Failed to save personnel:', err);
    }
  }

  // Recycle Bin (سلة المحذوفات) - 30 days retention
  static getRecycleBin(): RecycledPersonnel[] {
    try {
      const key = this.getKeyForTenant(STORAGE_KEY_RECYCLE_BIN);
      const parsed = safeGetLocalItem<RecycledPersonnel[]>(key);
      if (parsed) {
        const now = new Date().getTime();
        const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

        // Auto-purge items older than 30 days
        const validItems = parsed.filter((item) => {
          const deletedTime = new Date(item.deletedAt).getTime();
          return now - deletedTime < thirtyDaysMs;
        });

        if (validItems.length !== parsed.length) {
          this.saveRecycleBin(validItems);
        }
        return validItems;
      }
    } catch (err) {
      console.error('Failed to load recycle bin:', err);
    }
    return [];
  }

  static saveRecycleBin(items: RecycledPersonnel[]): void {
    try {
      const key = this.getKeyForTenant(STORAGE_KEY_RECYCLE_BIN);
      const cloudDocId = this.getCloudDocIdForTenant('recycle_bin');
      safeSetLocalItem(key, items);
      syncDocToCloud(cloudDocId, items);
      notifyDataChange();
    } catch (err) {
      console.error('Failed to save recycle bin:', err);
    }
  }

  // Soft-delete personnel record to recycle bin
  static deletePersonnelToRecycleBin(
    militaryId: string,
    userName: string = 'المستخدم',
    department: DepartmentRole = 'إدارة الموارد البشرية',
    reason: string = 'تم النقل إلى سلة المحذوفات'
  ): boolean {
    const personnel = this.getPersonnel();
    const target = personnel.find((p) => p.militaryId === militaryId);
    if (!target) return false;

    // Remove from active personnel
    const updatedPersonnel = personnel.filter((p) => p.militaryId !== militaryId);
    this.savePersonnel(updatedPersonnel);

    // Add to recycle bin
    const recycleBin = this.getRecycleBin();
    const trashItem: RecycledPersonnel = {
      id: `trash-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      personnel: target,
      deletedAt: new Date().toISOString(),
      deletedBy: userName,
      reason
    };
    this.saveRecycleBin([trashItem, ...recycleBin]);

    // Audit log & alert
    this.logAction(
      userName,
      department,
      'نقل إلى سلة المحذوفات',
      target.militaryId,
      target.fullName,
      `تم نقل بيانات الفرد (${target.rank} / ${target.fullName}) إلى سلة المحذوفات. يمكن استعادته خلال 30 يوماً.`
    );

    return true;
  }

  // Restore personnel from recycle bin back to active list
  static restorePersonnelFromRecycleBin(
    trashId: string,
    userName: string = 'المستخدم',
    department: DepartmentRole = 'إدارة الموارد البشرية'
  ): boolean {
    const recycleBin = this.getRecycleBin();
    const targetItem = recycleBin.find((item) => item.id === trashId);
    if (!targetItem) return false;

    // Remove from recycle bin
    const updatedBin = recycleBin.filter((item) => item.id !== trashId);
    this.saveRecycleBin(updatedBin);

    // Add back to active personnel list if not already present
    const personnel = this.getPersonnel();
    if (!personnel.some((p) => p.militaryId === targetItem.personnel.militaryId)) {
      this.savePersonnel([targetItem.personnel, ...personnel]);
    }

    // Audit log
    this.logAction(
      userName,
      department,
      'استعادة من سلة المحذوفات',
      targetItem.personnel.militaryId,
      targetItem.personnel.fullName,
      `تمت استعادة الفرد (${targetItem.personnel.rank} / ${targetItem.personnel.fullName}) بنجاح وإعادة تفعيل ملفه بقوة القوات.`
    );

    return true;
  }

  // Permanently delete single personnel record from recycle bin
  static permanentlyDeleteFromRecycleBin(
    trashId: string,
    userName: string = 'المستخدم',
    department: DepartmentRole = 'إدارة الموارد البشرية'
  ): boolean {
    const recycleBin = this.getRecycleBin();
    const targetItem = recycleBin.find((item) => item.id === trashId);
    if (!targetItem) return false;

    const updatedBin = recycleBin.filter((item) => item.id !== trashId);
    this.saveRecycleBin(updatedBin);

    this.logAction(
      userName,
      department,
      'حذف نهائي',
      targetItem.personnel.militaryId,
      targetItem.personnel.fullName,
      `تم مسح سجل وحسُاب البيانات العسكرية للفرد (${targetItem.personnel.fullName}) نهائياً من سلة المحذوفات.`
    );

    return true;
  }

  // Empty entire recycle bin
  static clearRecycleBin(
    userName: string = 'المستخدم',
    department: DepartmentRole = 'إدارة الموارد البشرية'
  ): void {
    const recycleBin = this.getRecycleBin();
    this.saveRecycleBin([]);

    this.logAction(
      userName,
      department,
      'إفراغ سلة المحذوفات',
      '-',
      'الكل',
      `تم إفراغ سلة المحذوفات وحذف (${recycleBin.length}) سجل عسكري نهائياً.`
    );
  }

  // Load audit logs
  static getAuditLogs(): AuditLogEntry[] {
    try {
      const key = this.getKeyForTenant(STORAGE_KEY_AUDIT);
      const data = localStorage.getItem(key);
      if (data) {
        return JSON.parse(data);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    }
    if (this.getActiveTenantId() === 'tenant-hq-main') {
      this.saveAuditLogs(INITIAL_AUDIT_LOGS);
      return INITIAL_AUDIT_LOGS;
    }
    return [];
  }

  // Save audit logs
  static saveAuditLogs(logs: AuditLogEntry[]): void {
    try {
      const key = this.getKeyForTenant(STORAGE_KEY_AUDIT);
      const cloudDocId = this.getCloudDocIdForTenant('audit_logs');
      localStorage.setItem(key, JSON.stringify(logs));
      syncDocToCloud(cloudDocId, logs);
      notifyDataChange();
    } catch (err) {
      console.error('Failed to save audit logs:', err);
    }
  }

  // Add audit log entry
  static logAction(
    userName: string,
    department: DepartmentRole,
    action: string,
    targetMilitaryId: string,
    targetName: string,
    details: string,
    accountId?: string,
    accountName?: string
  ): void {
    const currentLogs = this.getAuditLogs();
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(
      2,
      '0'
    )}:${String(now.getSeconds()).padStart(2, '0')}`;

    let effAccountId = accountId;
    let effAccountName = accountName;

    if (!effAccountId && typeof window !== 'undefined') {
      const activeCode = localStorage.getItem('military_active_account_v1');
      if (activeCode) {
        const found = BRIGADE_ACCOUNTS.find(
          (a) => a.id === activeCode || a.shortCode === activeCode || a.customAccessKey === activeCode
        );
        if (found) {
          effAccountId = found.id;
          effAccountName = found.name;
        }
      }
    }

    if (!effAccountId) {
      effAccountId = 'hq';
      effAccountName = 'لواء القيادة';
    }

    const newLog: AuditLogEntry = {
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: formattedDate,
      userName,
      department,
      accountId: effAccountId,
      accountName: effAccountName,
      action,
      targetMilitaryId,
      targetName,
      details
    };

    const updated = [newLog, ...currentLogs];
    this.saveAuditLogs(updated);

    // Automatically create real-time alert for Main Command / Notification center on data modifications
    if (targetMilitaryId && targetMilitaryId !== '-' && targetMilitaryId !== 'الكل') {
      this.addAlert({
        title: `تحديث بيانات: ${targetName} (${action})`,
        description: `قام المستخدم (${userName} - ${department} - ${effAccountName}) بإجراء: ${action}. التفاصيل: ${details}`,
        level: action.includes('حرج') || action.includes('فرار') || action.includes('مخالفة') ? 'urgent' : 'info',
        militaryId: targetMilitaryId
      });
    }
  }

  // Dismissed Alert IDs Storage
  static getDismissedAlertIds(): string[] {
    try {
      const data = localStorage.getItem('military_hr_dismissed_alerts_v1');
      if (data) return JSON.parse(data);
    } catch (err) {
      console.error('Failed to load dismissed alerts:', err);
    }
    return [];
  }

  static dismissAlert(alertId: string): void {
    const dismissed = this.getDismissedAlertIds();
    if (!dismissed.includes(alertId)) {
      const updated = [...dismissed, alertId];
      localStorage.setItem('military_hr_dismissed_alerts_v1', JSON.stringify(updated));
      syncDocToCloud('dismissed_alerts', updated);
    }
    this.deleteAlert(alertId);
    notifyDataChange();
  }

  static deleteAlert(alertId: string): void {
    const alerts = this.getAlerts();
    const updated = alerts.filter((a) => a.id !== alertId);
    this.saveAlerts(updated);
  }

  static clearAllAlerts(): void {
    const alerts = this.getAlerts();
    const dismissed = this.getDismissedAlertIds();
    const allIds = alerts.map((a) => a.id);
    const combinedDismissed = Array.from(new Set([...dismissed, ...allIds]));
    localStorage.setItem('military_hr_dismissed_alerts_v1', JSON.stringify(combinedDismissed));
    syncDocToCloud('dismissed_alerts', combinedDismissed);
    this.saveAlerts([]);
  }

  // Get alerts
  static getAlerts(): SystemAlert[] {
    try {
      const key = this.getKeyForTenant(STORAGE_KEY_ALERTS);
      const data = localStorage.getItem(key);
      if (data) {
        return JSON.parse(data);
      }
    } catch (err) {
      console.error('Failed to load alerts:', err);
    }
    if (this.getActiveTenantId() === 'tenant-hq-main') {
      this.saveAlerts(INITIAL_ALERTS);
      return INITIAL_ALERTS;
    }
    return [];
  }

  // Save alerts
  static saveAlerts(alerts: SystemAlert[]): void {
    try {
      const key = this.getKeyForTenant(STORAGE_KEY_ALERTS);
      const cloudDocId = this.getCloudDocIdForTenant('alerts');
      localStorage.setItem(key, JSON.stringify(alerts));
      syncDocToCloud(cloudDocId, alerts);
      notifyDataChange();
    } catch (err) {
      console.error('Failed to save alerts:', err);
    }
  }

  // Add new alert
  static addAlert(alert: Omit<SystemAlert, 'id' | 'date'>): void {
    const alerts = this.getAlerts();
    const today = new Date().toISOString().split('T')[0];

    let activeAccId = (alert as any).createdByAccountId;
    if (!activeAccId && typeof window !== 'undefined') {
      const activeCode = localStorage.getItem('military_active_account_v1');
      if (activeCode) {
        const found = BRIGADE_ACCOUNTS.find(
          (a) => a.id === activeCode || a.shortCode === activeCode || a.customAccessKey === activeCode
        );
        if (found) {
          activeAccId = found.id;
        }
      }
    }

    const newAlert: SystemAlert = {
      ...alert,
      createdByAccountId: activeAccId || 'hq',
      id: `alt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      date: today
    };
    this.saveAlerts([newAlert, ...alerts]);
  }

  // Get single personnel by ID
  static getPersonnelById(militaryId: string): PersonnelRecord | undefined {
    const list = this.getPersonnel();
    return list.find((p) => p.militaryId === militaryId);
  }

  // Check for duplicate personnel by militaryId, nationalId, or fullName
  static checkForDuplicatePersonnel(
    militaryId: string,
    nationalId?: string,
    fullName?: string,
    excludeMilitaryId?: string
  ): PersonnelRecord | undefined {
    const list = this.getPersonnel();
    const cleanMil = militaryId ? militaryId.trim().toLowerCase() : '';
    const cleanNat = nationalId ? nationalId.trim() : '';
    const cleanName = fullName ? fullName.trim().toLowerCase() : '';

    return list.find((p) => {
      if (excludeMilitaryId && p.militaryId === excludeMilitaryId) return false;

      if (cleanMil && p.militaryId.toLowerCase() === cleanMil) return true;
      if (cleanNat && cleanNat.length > 3 && p.nationalId && p.nationalId === cleanNat) return true;
      if (cleanName && cleanName.length > 5 && p.fullName.trim().toLowerCase() === cleanName) return true;

      return false;
    });
  }

  // Add new personnel
  static addPersonnel(
    personnel: PersonnelRecord,
    actingUser = 'مسؤول الموارد البشرية',
    actingDept: DepartmentRole = 'إدارة الموارد البشرية'
  ): void {
    const today = new Date().toISOString().split('T')[0];
    const list = this.getPersonnel();

    let activeAccId = 'hq';
    if (typeof window !== 'undefined') {
      const activeCode = localStorage.getItem('military_active_account_v1');
      if (activeCode) {
        const found = BRIGADE_ACCOUNTS.find(
          (a) => a.id === activeCode || a.shortCode === activeCode || a.customAccessKey === activeCode
        );
        if (found) {
          activeAccId = found.id;
        }
      }
    }
    personnel.createdByAccountId = getAccountIdForUnit(personnel.unit, personnel.createdByAccountId || activeAccId);

    // Check for duplicate soldier on system
    const existing = this.checkForDuplicatePersonnel(personnel.militaryId, personnel.nationalId, personnel.fullName);

    if (existing) {
      const timeStr = `${today} ${new Date().toLocaleTimeString('ar-SA')}`;
      this.addAlert({
        level: 'urgent',
        title: '🚨 إنذار إدخال متكرر بين الحسابات (تكرار بيانات فرد)',
        description: `تم رصد عملية إدخال متكررة للفرد (${personnel.rank} / ${personnel.fullName}). الفرد مُسجّل أصلاً لدى (${existing.unit}). الحساب المنفذ للإدخال الجديد: (${actingUser} - ${personnel.unit}).`,
        militaryId: personnel.militaryId,
        isDuplicateAlert: true,
        duplicateDetails: {
          militaryId: personnel.militaryId,
          nationalId: personnel.nationalId || existing.nationalId || '-',
          fullName: personnel.fullName,
          rank: personnel.rank,
          originalAccount: existing.unit,
          originalUnit: existing.unit,
          attemptedAccount: personnel.unit,
          attemptedUnit: personnel.unit,
          attemptedUser: actingUser,
          timestamp: timeStr
        }
      });

      this.logAction(
        actingUser,
        actingDept,
        '🚨 إدخال متكرر بين الحسابات',
        personnel.militaryId,
        personnel.fullName,
        `تكرار إدخال بيانات الفرد (${personnel.fullName}). الحساب المسجل أصلاً: (${existing.unit}). الحساب المنفذ للإدخال المتكرر: (${personnel.unit})`
      );
    }

    if (!personnel.logs) {
      personnel.logs = {
        movement: [],
        attendance: [],
        medical: [],
        financial: [],
        security: [],
        armament: [],
        training: [],
        attachments: []
      };
    }
    if (!personnel.logs.attendance) {
      personnel.logs.attendance = [];
    }

    if (personnel.logs.attendance.length === 0) {
      const initialLog: AttendanceLog = {
        id: `att-${Date.now()}`,
        date: today,
        startDate: today,
        type:
          personnel.currentStatus === 'إجازة'
            ? 'إجازة'
            : personnel.currentStatus === 'إذن'
            ? 'إذن'
            : personnel.currentStatus === 'مستشفى'
            ? 'احتجاز'
            : personnel.currentStatus === 'فرار'
            ? 'فرار'
            : personnel.currentStatus === 'غياب'
            ? 'غياب'
            : personnel.currentStatus === 'موقوف'
            ? 'احتجاز'
            : 'حضور',
        reason: `إدراج وحصر جديد للفرد برتبة (${personnel.rank}) وحالة جاهزية مبدئية: ${personnel.currentStatus}`,
        durationDays: 1,
        approvedBy: actingUser
      };
      personnel.logs.attendance.push(initialLog);
    }

    const existingIndex = list.findIndex((p) => p.militaryId === personnel.militaryId);
    let updated: PersonnelRecord[];
    if (existingIndex >= 0) {
      updated = [...list];
      updated[existingIndex] = personnel;
    } else {
      updated = [personnel, ...list];
    }
    this.savePersonnel(updated);

    this.logAction(
      actingUser,
      actingDept,
      'إضافة فرد جديد',
      personnel.militaryId,
      personnel.fullName,
      `تم إدراج الفرد برتبة ${personnel.rank} بالوحدة ${personnel.unit} بحالة جاهزية (${personnel.currentStatus})`
    );

    this.addAlert({
      level: 'warning',
      title: 'تحديث جاهزية - إضافة فرد جديد',
      description: `تم إضافة الفرد (${personnel.rank} / ${personnel.fullName}) رسمياً إلى قوة (${personnel.unit}) بحالة ${personnel.currentStatus}`,
      militaryId: personnel.militaryId
    });
  }

  // Update existing personnel basic info or status
  static updatePersonnel(
    updatedRecord: PersonnelRecord,
    actingUser = 'مسؤول الموارد البشرية',
    actingDept: DepartmentRole = 'إدارة الموارد البشرية',
    actionNote = 'تحديث بيانات الفرد',
    originalMilitaryId?: string
  ): void {
    const list = this.getPersonnel();
    const searchId = originalMilitaryId || updatedRecord.militaryId;
    const index = list.findIndex(
      (p) => p.militaryId === searchId || (updatedRecord.nationalId && p.nationalId === updatedRecord.nationalId)
    );

    if (index !== -1) {
      const oldRecord = list[index];
      updatedRecord.createdByAccountId = getAccountIdForUnit(
        updatedRecord.unit || oldRecord.unit,
        updatedRecord.createdByAccountId || oldRecord.createdByAccountId || 'hq'
      );
      const oldRank = oldRecord.rank;
      const oldJobTitle = oldRecord.jobTitle || 'غير محدد';
      const oldUnit = oldRecord.unit;
      const oldBattalion = oldRecord.battalion || 'غير محدد';
      const oldCompany = oldRecord.company || 'غير محدد';
      const oldStatus = oldRecord.currentStatus;

      const rankChanged = oldRank !== updatedRecord.rank;
      const jobChanged = oldJobTitle !== updatedRecord.jobTitle;
      const unitChanged = oldUnit !== updatedRecord.unit;
      const battalionChanged = oldBattalion !== updatedRecord.battalion;
      const companyChanged = oldCompany !== updatedRecord.company;
      const statusChanged = oldStatus !== updatedRecord.currentStatus;

      // Preserve existing logs or initialize
      if (!updatedRecord.logs) {
        updatedRecord.logs = oldRecord.logs || {
          movement: [],
          attendance: [],
          medical: [],
          financial: [],
          security: [],
          armament: [],
          training: [],
          attachments: [],
          supply: []
        };
      } else {
        updatedRecord.logs = {
          ...oldRecord.logs,
          ...updatedRecord.logs
        };
      }

      // Prepend movement log if rank, job title, unit, battalion, company or status changed
      if (rankChanged || jobChanged || unitChanged || battalionChanged || companyChanged || statusChanged) {
        const changes: string[] = [];
        if (rankChanged) changes.push(`تعديل الرتبة من (${oldRank}) إلى (${updatedRecord.rank})`);
        if (jobChanged) changes.push(`تعديل الوظيفة من (${oldJobTitle}) إلى (${updatedRecord.jobTitle})`);
        if (unitChanged) changes.push(`تعديل الوحدة من (${oldUnit}) إلى (${updatedRecord.unit})`);
        if (battalionChanged) changes.push(`تعديل الكتيبة من (${oldBattalion}) إلى (${updatedRecord.battalion})`);
        if (companyChanged) changes.push(`تعديل السرية من (${oldCompany}) إلى (${updatedRecord.company})`);
        if (statusChanged) changes.push(`تعديل الحالة من (${oldStatus}) إلى (${updatedRecord.currentStatus})`);

        const isTransfer = unitChanged || battalionChanged;

        const newMoveLog: MovementLog = {
          id: `mov-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          date: new Date().toISOString().split('T')[0],
          type: isTransfer ? 'نقل' : 'تعديل وظيفة ورتبة',
          fromUnit: `${oldUnit} - ${oldBattalion}`,
          toUnit: `${updatedRecord.unit} - ${updatedRecord.battalion}`,
          reason: `تحديث سجـل الترافق والتنقل الإداري للفرد: [${changes.join(' | ')}]`,
          orderReference: `أمر إداري صادر من (${actingUser})`,
          effectiveDate: new Date().toISOString().split('T')[0]
        };

        if (!updatedRecord.logs.movement) {
          updatedRecord.logs.movement = [];
        }
        updatedRecord.logs.movement.unshift(newMoveLog);
      }

      list[index] = updatedRecord;
      this.savePersonnel(list);

      const statusNote = statusChanged
        ? ` (تغيرت الحالة من ${oldStatus} إلى ${updatedRecord.currentStatus})`
        : '';

      this.logAction(
        actingUser,
        actingDept,
        'تحديث بيانات الفرد',
        updatedRecord.militaryId,
        updatedRecord.fullName,
        `${actionNote} [الرتبة: ${updatedRecord.rank} - الوظيفة: ${updatedRecord.jobTitle}]${statusNote}`
      );
    } else {
      this.addPersonnel(updatedRecord, actingUser, actingDept);
    }
  }

  // Get list of personnel replacement records
  static getReplacements(): PersonnelReplacementRecord[] {
    try {
      const parsed = safeGetLocalItem<PersonnelReplacementRecord[]>(STORAGE_KEY_REPLACEMENTS);
      if (parsed && Array.isArray(parsed)) {
        return parsed;
      }
    } catch (e) {
      console.error('Failed to load replacement records:', e);
    }
    return [];
  }

  // Save replacement records
  static saveReplacements(list: PersonnelReplacementRecord[]): void {
    safeSetLocalItem(STORAGE_KEY_REPLACEMENTS, list);
    syncDocToCloud('replacements', list);
    notifyDataChange();
  }

  // Execute a personnel substitution (استبدال فرد متغيب/فرار)
  static processPersonnelReplacement(
    data: Omit<PersonnelReplacementRecord, 'id' | 'replacementSerial'>,
    actingUser = 'مسؤول الموارد البشرية',
    actingRole: DepartmentRole = 'إدارة الموارد البشرية'
  ): { replacement: PersonnelReplacementRecord; newPerson: PersonnelRecord } {
    const list = this.getPersonnel();

    let activeAccId = 'hq';
    if (typeof window !== 'undefined') {
      const activeCode = localStorage.getItem('military_active_account_v1');
      if (activeCode) {
        const found = BRIGADE_ACCOUNTS.find(
          (a) => a.id === activeCode || a.shortCode === activeCode || a.customAccessKey === activeCode
        );
        if (found) {
          activeAccId = found.id;
        }
      }
    }

    // 1. Mark or add replaced soldier as substituted
    const replacedIndex = list.findIndex((p) => p.militaryId === data.replacedMilitaryId);
    if (replacedIndex !== -1) {
      const replacedPerson = list[replacedIndex];
      replacedPerson.createdByAccountId = replacedPerson.createdByAccountId || activeAccId;
      replacedPerson.fullName = data.replacedFullName || replacedPerson.fullName;
      replacedPerson.rank = data.replacedRank || replacedPerson.rank;
      replacedPerson.unit = data.replacedUnit || replacedPerson.unit;
      replacedPerson.battalion = data.replacedBattalion || replacedPerson.battalion;
      replacedPerson.company = data.replacedCompany || replacedPerson.company;
      replacedPerson.jobTitle = data.replacedJobTitle || replacedPerson.jobTitle;
      replacedPerson.currentStatus = data.replacedStatus || 'فرار';
      if (!replacedPerson.logs) {
        replacedPerson.logs = {
          movement: [],
          attendance: [],
          medical: [],
          financial: [],
          security: [],
          armament: [],
          training: [],
          attachments: [],
          supply: []
        };
      }
      if (!replacedPerson.logs.movement) replacedPerson.logs.movement = [];
      replacedPerson.logs.movement.unshift({
        id: `mov-rep-${Date.now()}`,
        date: data.replacementDate,
        type: 'استبدال عسكري',
        reason: `تم استبدال الفرد (حالة ${data.replacedStatus}) بالفرد البديل الجديد (${data.newRank} / ${data.newFullName} - الرقم ${data.newMilitaryId}) بموجب ${data.orderNumber}`,
        orderReference: data.orderNumber,
        issuingAuthority: data.issuingAuthority,
        effectiveDate: data.replacementDate
      });
    } else if (data.replacedMilitaryId && data.replacedFullName) {
      // Create record for replaced deserter if manually entered and not previously in database
      const deserterRecord: PersonnelRecord = {
        militaryId: data.replacedMilitaryId,
        nationalId: `10${Math.floor(100000000 + Math.random() * 900000000)}`,
        fullName: data.replacedFullName,
        rank: data.replacedRank || 'جندي',
        dob: '1995-01-01',
        pob: 'الرياض',
        maritalStatus: 'أعزب',
        education: 'ثانوية عامة',
        specialization: 'مشاة عامة',
        bloodType: 'O+',
        phone: '0500000000',
        photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
        biometricsRecorded: false,
        unit: data.replacedUnit || 'اللواء الأول',
        battalion: data.replacedBattalion || 'الكتيبة الأولى',
        company: data.replacedCompany || 'السرية الأولى',
        platoon: 'الفصيل الأول',
        jobTitle: data.replacedJobTitle || 'فرد مشاة',
        enlistmentDate: data.absenceStartDate || '2023-01-01',
        currentStatus: data.replacedStatus || 'فرار',
        createdByAccountId: activeAccId,
        logs: {
          movement: [{
            id: `mov-rep-${Date.now()}`,
            date: data.replacementDate,
            type: 'استبدال عسكري',
            reason: `سجل فرد متغيب/فرار تم استبداله بالفرد البديل (${data.newRank} / ${data.newFullName}) بموجب ${data.orderNumber}`,
            orderReference: data.orderNumber,
            issuingAuthority: data.issuingAuthority,
            effectiveDate: data.replacementDate
          }],
          attendance: [{
            id: `att-des-${Date.now()}`,
            date: data.absenceStartDate || data.replacementDate,
            type: (data.replacedStatus as string) === 'متغيب' ? 'غياب' : 'فرار',
            reason: 'انقطاع وفرار عن الخدمة العسكرية',
            durationDays: 30,
            approvedBy: data.issuingAuthority,
            startDate: data.absenceStartDate || data.replacementDate
          }],
          medical: [], financial: [], security: [], armament: [], training: [], attachments: [], supply: []
        }
      };
      list.unshift(deserterRecord);
    }

    // 2. Build and insert new replacement soldier
    const newPerson: PersonnelRecord = {
      militaryId: data.newMilitaryId,
      nationalId: data.newNationalId,
      fullName: data.newFullName,
      rank: data.newRank,
      dob: '1998-01-01',
      pob: 'الرياض',
      maritalStatus: 'متزوج',
      education: 'ثانوية عامة',
      specialization: 'مشاة عامة',
      bloodType: 'O+',
      phone: data.newPhone || '0500000000',
      photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
      biometricsRecorded: true,
      unit: data.newUnit,
      battalion: data.newBattalion,
      company: data.newCompany,
      platoon: data.newPlatoon,
      jobTitle: data.newJobTitle,
      enlistmentDate: data.newEnlistmentDate || data.replacementDate,
      currentStatus: 'متواجد',
      createdByAccountId: activeAccId,
      logs: {
        movement: [
          {
            id: `mov-newrep-${Date.now()}`,
            date: data.replacementDate,
            type: 'استبدال عسكري',
            reason: `تعيين وإدراج بديل جديد بدلاً من الفرد المتغيب/الفرار (${data.replacedRank} / ${data.replacedFullName} - رقم ${data.replacedMilitaryId}) بموجب ${data.orderNumber}`,
            orderReference: data.orderNumber,
            issuingAuthority: data.issuingAuthority,
            effectiveDate: data.replacementDate
          }
        ],
        attendance: [
          {
            id: `att-rep-${Date.now()}`,
            date: data.replacementDate,
            type: 'حضور',
            reason: 'مباشرة القوة كفرد بديل معتمد',
            durationDays: 0,
            approvedBy: data.issuingAuthority,
            startDate: data.replacementDate
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

    list.unshift(newPerson);
    this.savePersonnel(list);

    // 3. Save replacement transaction
    const replacementRecord: PersonnelReplacementRecord = {
      ...data,
      createdByAccountId: activeAccId,
      id: `repl-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      replacementSerial: `REP-SUB-${Math.floor(100000 + Math.random() * 900000)}`
    };

    const replacements = this.getReplacements();
    replacements.unshift(replacementRecord);
    this.saveReplacements(replacements);

    // 4. Record audit log & alerts
    this.logAction(
      actingUser,
      actingRole,
      'إجراء استبدال عسكري',
      data.newMilitaryId,
      data.newFullName,
      `استبدال البديل الجديد (${data.newRank} / ${data.newFullName}) بالفرد الفرار/المتغيب (${data.replacedRank} / ${data.replacedFullName}) - بموجب ${data.orderNumber}`
    );

    this.addAlert({
      level: 'warning',
      title: 'إحلال واستبدال فرد (فرار/متغيب)',
      description: `تم اعتماد إحلال الفرد البديل (${data.newRank} / ${data.newFullName}) رسمياً بدلاً من (${data.replacedRank} / ${data.replacedFullName}) في (${data.newUnit})`,
      militaryId: data.newMilitaryId
    });

    return { replacement: replacementRecord, newPerson };
  }

  // Update Status directly with propagation
  static updateStatus(
    militaryId: string,
    newStatus: PersonnelStatus,
    reason: string,
    actingUser: string,
    actingDept: DepartmentRole
  ): void {
    const list = this.getPersonnel();
    const person = list.find((p) => p.militaryId === militaryId);
    if (!person) return;

    const oldStatus = person.currentStatus;
    person.currentStatus = newStatus;

    // Add attendance log entry for this transition
    const today = new Date().toISOString().split('T')[0];
    const newAttLog: AttendanceLog = {
      id: `att-${Date.now()}`,
      date: today,
      type:
        newStatus === 'إجازة'
          ? 'إجازة'
          : newStatus === 'إذن'
          ? 'إذن'
          : newStatus === 'مستشفى'
          ? 'احتجاز'
          : newStatus === 'فرار'
          ? 'فرار'
          : newStatus === 'غياب'
          ? 'غياب'
          : newStatus === 'موقوف'
          ? 'احتجاز'
          : newStatus === 'متواجد'
          ? 'حضور'
          : 'عودة للخدمة',
      reason: reason || `تغيير تلقائي إلى حالة (${newStatus})`,
      durationDays: 1,
      approvedBy: actingDept,
      startDate: today
    };

    person.logs.attendance.unshift(newAttLog);

    this.savePersonnel(list);

    this.logAction(
      actingUser,
      actingDept,
      'تحديث الحالة الحالية (ربط تلقائي)',
      militaryId,
      person.fullName,
      `تحويل من (${oldStatus}) إلى (${newStatus}) - السبب: ${reason}`
    );

    // Create high-level alerts for critical statuses
    if (['فرار', 'مفقود', 'موقوف'].includes(newStatus)) {
      this.addAlert({
        title: `تحديث حرج: حالة ${newStatus}`,
        description: `تم تحويل الفرد ${person.fullName} (${person.rank}) إلى حالة ${newStatus}. السبب: ${reason}`,
        level: 'urgent',
        militaryId
      });
    }
  }

  // Add Movement Log
  static addMovementLog(
    militaryId: string,
    log: Omit<MovementLog, 'id'>,
    actingUser: string,
    actingDept: DepartmentRole,
    autoChangeStatus?: PersonnelStatus
  ): void {
    const list = this.getPersonnel();
    const person = list.find((p) => p.militaryId === militaryId);
    if (!person) return;

    const newLog: MovementLog = { ...log, id: `mov-${Date.now()}` };
    person.logs.movement.unshift(newLog);

    if (autoChangeStatus && person.currentStatus !== autoChangeStatus) {
      person.currentStatus = autoChangeStatus;
    }

    this.savePersonnel(list);

    this.logAction(
      actingUser,
      actingDept,
      'إضافة سجل حركة',
      militaryId,
      person.fullName,
      `نوع الحركة: ${log.type} - ${log.details}`
    );
  }

  // Add Medical Log
  static addMedicalLog(
    militaryId: string,
    log: Omit<MedicalLog, 'id'>,
    actingUser: string,
    actingDept: DepartmentRole,
    admitToHospital = false
  ): void {
    const list = this.getPersonnel();
    const person = list.find((p) => p.militaryId === militaryId);
    if (!person) return;

    const newLog: MedicalLog = { ...log, id: `med-${Date.now()}` };
    person.logs.medical.unshift(newLog);

    if (admitToHospital) {
      person.currentStatus = 'مستشفى';
    }

    this.savePersonnel(list);

    this.logAction(
      actingUser,
      actingDept,
      'إضافة سجل طبي',
      militaryId,
      person.fullName,
      `التشخيص: ${log.diagnosis} - المستشفى: ${log.hospital}`
    );
  }

  // Register Medical Return / Recovery
  static registerMedicalReturn(
    militaryId: string,
    details: {
      diagnosis: string;
      hospital: string;
      doctor: string;
      prescriptionDetails: string;
      recoveryStartDate: string;
      recoveryEndDate: string;
      newStatus: PersonnelStatus;
      notes?: string;
    },
    actingUser: string,
    actingDept: DepartmentRole
  ): boolean {
    const list = this.getPersonnel();
    const person = list.find((p) => p.militaryId === militaryId);
    if (!person) return false;

    const oldStatus = person.currentStatus;
    person.currentStatus = details.newStatus;

    const newMedLog: MedicalLog = {
      id: `med-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      diagnosis: details.diagnosis || 'تعافي كامل وعودة للخدمة',
      hospital: details.hospital || 'المستشفى العسكري المركزي',
      doctor: details.doctor || 'الطبيب العسكري المعالج',
      sickLeaveDays: 0,
      medications: details.prescriptionDetails
        ? [
            {
              id: `medrx-${Date.now()}`,
              name: details.prescriptionDetails,
              dose: 'حسب الخطة العلاجية والتعافي',
              dateDispensed: new Date().toISOString().split('T')[0],
              prescribedBy: details.doctor || 'طبيب الفرع الطبي'
            }
          ]
        : [],
      prescriptionDetails: details.prescriptionDetails,
      recoveryStartDate: details.recoveryStartDate,
      recoveryEndDate: details.recoveryEndDate,
      isReturnToDuty: true
    };

    if (!person.logs.medical) person.logs.medical = [];
    person.logs.medical.unshift(newMedLog);

    // Record attendance log for return to duty
    const today = new Date().toISOString().split('T')[0];
    const newAttLog: AttendanceLog = {
      id: `att-${Date.now()}`,
      date: today,
      type: 'عودة للخدمة',
      reason: `عودة علاجية واستكمال التعافي - ${details.diagnosis}`,
      durationDays: 1,
      approvedBy: details.doctor || actingUser,
      startDate: details.recoveryStartDate || today,
      endDate: details.recoveryEndDate || today,
      notes: details.notes
    };
    if (!person.logs.attendance) person.logs.attendance = [];
    person.logs.attendance.unshift(newAttLog);

    this.savePersonnel(list);

    this.logAction(
      actingUser,
      actingDept,
      'مصادقة عودة علاجية وتحديث جاهزية',
      militaryId,
      person.fullName,
      `تمت العودة العلاجية بنجاح من المستشفى. تحولت الحالة من (${oldStatus}) إلى (${details.newStatus}). فترة التعافي: ${details.recoveryStartDate} إلى ${details.recoveryEndDate}`
    );

    this.addAlert({
      level: 'info',
      title: 'عودة علاجية واستعادة جاهزية قتالية',
      description: `عاد الفرد (${person.rank} / ${person.fullName}) للخدمة بعد رحلة التعافي بالمستشفى. الجاهزية الحالية: ${details.newStatus}`,
      militaryId
    });

    return true;
  }

  // Register Training Course Enrollment
  static registerTrainingCourse(
    militaryId: string,
    details: {
      courseName: string;
      courseType: 'ميداني' | 'قيادي' | 'تقني' | 'أمني' | 'تخصصي' | 'خارجي';
      startDate: string;
      endDate: string;
      supervisorOfficer: string;
      trainingLocation: string;
      grade?: 'ممتاز' | 'جيد جداً' | 'جيد' | 'مقبول' | 'مؤهل';
      evaluation?: string;
      certificates?: string;
      updateStatusToField?: boolean;
      notes?: string;
    },
    actingUser: string,
    actingDept: DepartmentRole
  ): boolean {
    const list = this.getPersonnel();
    const person = list.find((p) => p.militaryId === militaryId);
    if (!person) return false;

    const oldStatus = person.currentStatus;
    if (details.updateStatusToField) {
      person.currentStatus = 'في الميدان';
    }

    const startD = new Date(details.startDate);
    const endD = new Date(details.endDate);
    const diffWeeks = Math.max(1, Math.round((endD.getTime() - startD.getTime()) / (1000 * 60 * 60 * 24 * 7)));

    const newTrnLog: TrainingLog = {
      id: `trn-${Date.now()}`,
      courseName: details.courseName,
      courseType: details.courseType,
      provider: details.trainingLocation || 'مركز التدريب الميداني المركزي',
      startDate: details.startDate,
      endDate: details.endDate,
      durationWeeks: diffWeeks,
      grade: details.grade || 'ممتاز',
      evaluation: details.evaluation || 'دورة تدريبية متقدمة لرفع الكفاءة والجاهزية القتالية',
      certificates: details.certificates || 'شهادة اجتياز الدورة بنجاح',
      supervisorOfficer: details.supervisorOfficer,
      trainingLocation: details.trainingLocation,
      status: 'قائمة',
      notes: details.notes
    };

    if (!person.logs.training) person.logs.training = [];
    person.logs.training.unshift(newTrnLog);

    this.savePersonnel(list);

    this.logAction(
      actingUser,
      actingDept,
      'تسجيل دورة تدريبية وتعيين مشرف',
      militaryId,
      person.fullName,
      `الدورة: (${details.courseName}) - النوع: (${details.courseType}) - الفترة: (${details.startDate} إلى ${details.endDate}) - المشرف: (${details.supervisorOfficer})`
    );

    this.addAlert({
      level: 'info',
      title: 'تسجيل دورة تدريبية - رفع جاهزية',
      description: `تم إدراج الفرد (${person.rank} / ${person.fullName}) في دورة: ${details.courseName} بمركز ${details.trainingLocation} إشراف ${details.supervisorOfficer}`,
      militaryId
    });

    return true;
  }

  // Add Financial Log
  static addFinancialLog(
    militaryId: string,
    log: Omit<FinancialLog, 'id'>,
    actingUser: string,
    actingDept: DepartmentRole
  ): void {
    const list = this.getPersonnel();
    const person = list.find((p) => p.militaryId === militaryId);
    if (!person) return;

    const newLog: FinancialLog = { ...log, id: `fin-${Date.now()}` };
    person.logs.financial.unshift(newLog);

    this.savePersonnel(list);

    this.logAction(
      actingUser,
      actingDept,
      'إضافة عملية مالية',
      militaryId,
      person.fullName,
      `نوع العملية: ${log.type} - المبلغ: ${log.amount} ريال - السبب: ${log.reason}`
    );
  }

  // Add Security Log
  static addSecurityLog(
    militaryId: string,
    log: Omit<SecurityLog, 'id'>,
    actingUser: string,
    actingDept: DepartmentRole,
    detainPerson = false
  ): void {
    const list = this.getPersonnel();
    const person = list.find((p) => p.militaryId === militaryId);
    if (!person) return;

    const newLog: SecurityLog = { ...log, id: `sec-${Date.now()}` };
    person.logs.security.unshift(newLog);

    if (detainPerson) {
      person.currentStatus = 'موقوف';
    }

    this.savePersonnel(list);

    this.logAction(
      actingUser,
      actingDept,
      'تسجيل سجل أمني/مخالفة',
      militaryId,
      person.fullName,
      `المخالفة: ${log.violation} - العقوبة: ${log.penalty}`
    );
  }

  // Add Armament Log or update weapon
  static addArmamentLog(
    militaryId: string,
    log: Omit<ArmamentLog, 'id'>,
    actingUser: string,
    actingDept: DepartmentRole
  ): void {
    const list = this.getPersonnel();
    const person = list.find((p) => p.militaryId === militaryId);
    if (!person) return;

    const newLog: ArmamentLog = { ...log, id: `arm-${Date.now()}` };
    person.logs.armament.unshift(newLog);

    this.savePersonnel(list);

    this.logAction(
      actingUser,
      actingDept,
      'تسليح / إسناد سلاح',
      militaryId,
      person.fullName,
      `السلاح: ${log.weaponType} (${log.weaponSerial}) - كمية الذخيرة: ${log.ammoQty}`
    );
  }

  // Add Training Log
  static addTrainingLog(
    militaryId: string,
    log: Omit<TrainingLog, 'id'>,
    actingUser: string,
    actingDept: DepartmentRole
  ): void {
    const list = this.getPersonnel();
    const person = list.find((p) => p.militaryId === militaryId);
    if (!person) return;

    const newLog: TrainingLog = { ...log, id: `trn-${Date.now()}` };
    person.logs.training.unshift(newLog);

    this.savePersonnel(list);

    this.logAction(
      actingUser,
      actingDept,
      'تسجيل دورة تدريبية',
      militaryId,
      person.fullName,
      `الدورة: ${log.courseName} - التقدير: ${log.grade}`
    );
  }

  // Add Attachment
  static addAttachment(
    militaryId: string,
    attachment: Omit<PersonnelAttachment, 'id'>,
    actingUser: string,
    actingDept: DepartmentRole
  ): void {
    const list = this.getPersonnel();
    const person = list.find((p) => p.militaryId === militaryId);
    if (!person) return;

    const newAtt: PersonnelAttachment = { ...attachment, id: `attch-${Date.now()}` };
    if (!person.logs.attachments) person.logs.attachments = [];
    person.logs.attachments.unshift(newAtt);

    this.savePersonnel(list);

    this.logAction(
      actingUser,
      actingDept,
      'إرفاق وثيقة إلكترونية',
      militaryId,
      person.fullName,
      `عنوان المرفق: ${attachment.title} (${attachment.category})`
    );
  }

  // Add Supply / Equipment Log (صرف مهمات وبدلات عسكرية)
  static addSupplyLog(
    militaryId: string,
    log: Omit<SupplyLog, 'id'>,
    actingUser: string,
    actingDept: DepartmentRole
  ): void {
    const list = this.getPersonnel();
    const person = list.find((p) => p.militaryId === militaryId);
    if (!person) return;

    const newLog: SupplyLog = { ...log, id: `sup-${Date.now()}` };
    if (!person.logs.supply) person.logs.supply = [];
    person.logs.supply.unshift(newLog);

    this.savePersonnel(list);

    this.logAction(
      actingUser,
      actingDept,
      'صرف مهمات/بدلات عسكرية',
      militaryId,
      person.fullName,
      `الصنف: ${log.itemName} (${log.itemType}) - الكمية: ${log.quantity} - الحالة: ${log.condition}`
    );
  }

  // Helper to filter out legacy mock sample items
  private static filterOutSampleIds<T extends { id: string }>(items: T[]): T[] {
    const sampleIds = [
      'inv-1', 'inv-2', 'inv-3', 'inv-4', 'inv-5', 'inv-6',
      'wp-101', 'wp-102', 'wp-103', 'wp-104', 'wp-105',
      'INT-2026-101', 'INT-2026-102',
      'iss-1', 'iss-2',
      'lc-1', 'lc-2'
    ];
    return items.filter((item) => !sampleIds.includes(item.id));
  }

  // --- ARMAMENT & AMMUNITION MODULE STORAGE METHODS ---

  // Armory Inventory
  static getArmoryInventory(): ArmoryInventoryItem[] {
    try {
      const key = this.getKeyForTenant(STORAGE_KEY_ARMORY_INVENTORY);
      const data = localStorage.getItem(key);
      if (data) {
        const parsed = JSON.parse(data);
        return this.filterOutSampleIds(parsed);
      }
    } catch (e) {
      console.error('Failed to load armory inventory', e);
    }
    if (this.getActiveTenantId() === 'tenant-hq-main') {
      return INITIAL_INVENTORY_ITEMS;
    }
    return [];
  }

  static saveArmoryInventory(items: ArmoryInventoryItem[]): void {
    try {
      const filtered = this.filterOutSampleIds(items);
      const key = this.getKeyForTenant(STORAGE_KEY_ARMORY_INVENTORY);
      const cloudDocId = this.getCloudDocIdForTenant('armory_inventory');
      localStorage.setItem(key, JSON.stringify(filtered));
      syncDocToCloud(cloudDocId, filtered);
      notifyDataChange();
    } catch (e) {
      console.error('Failed to save armory inventory', e);
    }
  }

  // Tracked Weapon Pieces
  static getArmoryWeapons(): ArmoryWeaponPiece[] {
    try {
      const key = this.getKeyForTenant(STORAGE_KEY_ARMORY_WEAPONS);
      const data = localStorage.getItem(key);
      if (data) {
        const parsed = JSON.parse(data);
        return this.filterOutSampleIds(parsed);
      }
    } catch (e) {
      console.error('Failed to load armory weapons', e);
    }
    if (this.getActiveTenantId() === 'tenant-hq-main') {
      return INITIAL_WEAPON_PIECES;
    }
    return [];
  }

  static saveArmoryWeapons(pieces: ArmoryWeaponPiece[]): void {
    try {
      const filtered = this.filterOutSampleIds(pieces);
      const key = this.getKeyForTenant(STORAGE_KEY_ARMORY_WEAPONS);
      const cloudDocId = this.getCloudDocIdForTenant('armory_weapons');
      localStorage.setItem(key, JSON.stringify(filtered));
      syncDocToCloud(cloudDocId, filtered);
      notifyDataChange();
    } catch (e) {
      console.error('Failed to save armory weapons', e);
    }
  }

  // Intakes / Imports
  static getArmoryIntakes(): ArmoryIntakeRecord[] {
    try {
      const key = this.getKeyForTenant(STORAGE_KEY_ARMORY_INTAKES);
      const data = localStorage.getItem(key);
      if (data) {
        const parsed = JSON.parse(data);
        return this.filterOutSampleIds(parsed);
      }
    } catch (e) {
      console.error('Failed to load armory intakes', e);
    }
    if (this.getActiveTenantId() === 'tenant-hq-main') {
      return INITIAL_INTAKE_RECORDS;
    }
    return [];
  }

  static saveArmoryIntakes(records: ArmoryIntakeRecord[]): void {
    try {
      const filtered = this.filterOutSampleIds(records);
      const key = this.getKeyForTenant(STORAGE_KEY_ARMORY_INTAKES);
      const cloudDocId = this.getCloudDocIdForTenant('armory_intakes');
      localStorage.setItem(key, JSON.stringify(filtered));
      syncDocToCloud(cloudDocId, filtered);
      notifyDataChange();
    } catch (e) {
      console.error('Failed to save armory intakes', e);
    }
  }

  // Issue Orders
  static getArmoryIssues(): ArmoryIssueOrder[] {
    try {
      const key = this.getKeyForTenant(STORAGE_KEY_ARMORY_ISSUES);
      const data = localStorage.getItem(key);
      if (data) {
        const parsed = JSON.parse(data);
        return this.filterOutSampleIds(parsed);
      }
    } catch (e) {
      console.error('Failed to load armory issues', e);
    }
    if (this.getActiveTenantId() === 'tenant-hq-main') {
      return INITIAL_ISSUE_ORDERS;
    }
    return [];
  }

  static saveArmoryIssues(orders: ArmoryIssueOrder[]): void {
    try {
      const filtered = this.filterOutSampleIds(orders);
      const key = this.getKeyForTenant(STORAGE_KEY_ARMORY_ISSUES);
      const cloudDocId = this.getCloudDocIdForTenant('armory_issues');
      localStorage.setItem(key, JSON.stringify(filtered));
      syncDocToCloud(cloudDocId, filtered);
      notifyDataChange();
    } catch (e) {
      console.error('Failed to save armory issues', e);
    }
  }

  // Weapon Lifecycle History
  static getWeaponLifecycle(): WeaponLifecycleEvent[] {
    try {
      const key = this.getKeyForTenant(STORAGE_KEY_ARMORY_LIFECYCLE);
      const data = localStorage.getItem(key);
      if (data) {
        const parsed = JSON.parse(data);
        return this.filterOutSampleIds(parsed);
      }
    } catch (e) {
      console.error('Failed to load weapon lifecycle', e);
    }
    if (this.getActiveTenantId() === 'tenant-hq-main') {
      return INITIAL_LIFECYCLE_EVENTS;
    }
    return [];
  }

  static saveWeaponLifecycle(events: WeaponLifecycleEvent[]): void {
    try {
      const filtered = this.filterOutSampleIds(events);
      const key = this.getKeyForTenant(STORAGE_KEY_ARMORY_LIFECYCLE);
      const cloudDocId = this.getCloudDocIdForTenant('armory_lifecycle');
      localStorage.setItem(key, JSON.stringify(filtered));
      syncDocToCloud(cloudDocId, filtered);
      notifyDataChange();
    } catch (e) {
      console.error('Failed to save weapon lifecycle', e);
    }
  }

  // Weapon Types Config
  static getWeaponTypesConfig(): WeaponTypeConfig[] {
    try {
      const key = this.getKeyForTenant(STORAGE_KEY_WEAPON_TYPES);
      const data = localStorage.getItem(key);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Failed to load weapon types config', e);
    }
    return INITIAL_WEAPON_TYPES;
  }

  static saveWeaponTypesConfig(types: WeaponTypeConfig[]): void {
    try {
      const key = this.getKeyForTenant(STORAGE_KEY_WEAPON_TYPES);
      const cloudDocId = this.getCloudDocIdForTenant('weapon_types');
      localStorage.setItem(key, JSON.stringify(types));
      syncDocToCloud(cloudDocId, types);
      notifyDataChange();
    } catch (e) {
      console.error('Failed to save weapon types config', e);
    }
  }

  // Ammo Types Config
  static getAmmoTypesConfig(): AmmoTypeConfig[] {
    try {
      const key = this.getKeyForTenant(STORAGE_KEY_AMMO_TYPES);
      const data = localStorage.getItem(key);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Failed to load ammo types config', e);
    }
    return INITIAL_AMMO_TYPES;
  }

  static saveAmmoTypesConfig(types: AmmoTypeConfig[]): void {
    try {
      const key = this.getKeyForTenant(STORAGE_KEY_AMMO_TYPES);
      const cloudDocId = this.getCloudDocIdForTenant('ammo_types');
      localStorage.setItem(key, JSON.stringify(types));
      syncDocToCloud(cloudDocId, types);
      notifyDataChange();
    } catch (e) {
      console.error('Failed to save ammo types config', e);
    }
  }

  // Process a new Armory Intake (تسجيل وارد جديد)
  static processArmoryIntake(
    intakeData: Omit<ArmoryIntakeRecord, 'id' | 'date'>,
    actingUser = 'ضابط التسليح والذخيرة',
    actingDept: DepartmentRole = 'إدارة التسليح'
  ): void {
    const intakes = this.getArmoryIntakes();
    const now = new Date().toISOString().split('T')[0];
    const newIntake: ArmoryIntakeRecord = {
      ...intakeData,
      id: `INT-${Date.now()}`,
      date: now
    };

    intakes.unshift(newIntake);
    this.saveArmoryIntakes(intakes);

    // Update or add to inventory stock
    const inventory = this.getArmoryInventory();
    const existingIndex = inventory.findIndex(
      (inv) =>
        inv.itemType === intakeData.itemType &&
        inv.name.trim().toLowerCase() === intakeData.name.trim().toLowerCase() &&
        inv.caliber.trim().toLowerCase() === intakeData.caliber.trim().toLowerCase()
    );

    if (existingIndex !== -1) {
      inventory[existingIndex].totalReceived += intakeData.quantity;
      inventory[existingIndex].availableQty += intakeData.quantity;
      inventory[existingIndex].lastUpdated = now;
      if (intakeData.expiryDate) {
        inventory[existingIndex].expiryDate = intakeData.expiryDate;
      }
    } else {
      inventory.push({
        id: `inv-${Date.now()}`,
        itemType: intakeData.itemType,
        name: intakeData.name,
        category: intakeData.itemType === 'weapon' ? 'بنادق/أسلحة' : 'ذخائر حية',
        caliber: intakeData.caliber,
        totalReceived: intakeData.quantity,
        availableQty: intakeData.quantity,
        issuedQty: 0,
        inMaintenanceQty: 0,
        minThreshold: intakeData.itemType === 'weapon' ? 10 : 1000,
        storageLocation: 'مخزن التسليح الرئيسي',
        unit: 'اللواء الأول',
        expiryDate: intakeData.expiryDate,
        lastUpdated: now
      });
    }

    this.saveArmoryInventory(inventory);

    // If it's a weapon intake, generate tracked weapon pieces with serial numbers
    if (intakeData.itemType === 'weapon') {
      const weapons = this.getArmoryWeapons();
      const countToCreate = Math.min(intakeData.quantity, 50);
      const batchCode = intakeData.batchNumber ? intakeData.batchNumber.replace(/[^a-zA-Z0-9]/g, '') : `B${Date.now().toString().slice(-4)}`;
      const prefix = intakeData.name.replace(/[^\u0621-\u064Aa-zA-Z0-9]/g, '').slice(0, 3).toUpperCase() || 'WPN';
      
      for (let i = 1; i <= countToCreate; i++) {
        weapons.push({
          id: `wp-intake-${Date.now()}-${i}`,
          serialNumber: `${prefix}-${batchCode}-${String(i).padStart(3, '0')}`,
          weaponType: intakeData.name,
          caliber: intakeData.caliber,
          manufactureYear: new Date().getFullYear().toString(),
          technicalCondition: 'جاهز',
          status: 'في المخزن',
          storageLocation: 'مخزن التسليح الرئيسي',
          entryDate: now,
          notes: `وارد بموجب الشحنة: ${intakeData.batchNumber || batchCode}`
        });
      }
      this.saveArmoryWeapons(weapons);
    }

    this.logAction(
      actingUser,
      actingDept,
      'تسجيل وارد تسليح/ذخائر',
      '-',
      'مخزن التسليح المركزية',
      `استلام: ${intakeData.name} (${intakeData.caliber}) - الكمية: ${intakeData.quantity} - المصدر: ${intakeData.source}`
    );
  }

  // Process a new Armory Dispense / Issue Order (عملية صرف سلاح/ذخيرة)
  static processArmoryIssue(
    orderData: Omit<ArmoryIssueOrder, 'id' | 'orderNumber' | 'date' | 'status'>,
    actingUser = 'ضابط التسليح',
    actingDept: DepartmentRole = 'إدارة التسليح'
  ): { success: boolean; message: string; order?: ArmoryIssueOrder } {
    const inventory = this.getArmoryInventory();

    // Find ammo stock item if ammo issued
    if (orderData.issuedAmmoQty > 0 && orderData.ammoType) {
      const ammoItem = inventory.find(
        (inv) =>
          inv.itemType === 'ammo' &&
          (inv.name.includes(orderData.ammoType) || orderData.ammoType.includes(inv.name))
      );

      if (ammoItem) {
        if (ammoItem.availableQty < orderData.issuedAmmoQty) {
          return {
            success: false,
            message: `عذراً! الكمية المطلوبة من الذخيرة (${orderData.issuedAmmoQty}) أكبر من الكمية المتوفرة بالمخزن حالياً (${ammoItem.availableQty}).`
          };
        }
        ammoItem.availableQty -= orderData.issuedAmmoQty;
        ammoItem.issuedQty += orderData.issuedAmmoQty;
        ammoItem.lastUpdated = new Date().toISOString().split('T')[0];
      }
    }

    // Find weapon stock item if weapon issued
    if (orderData.weaponType) {
      const weaponItem = inventory.find(
        (inv) =>
          inv.itemType === 'weapon' &&
          (inv.name.includes(orderData.weaponType) || orderData.weaponType.includes(inv.name))
      );

      if (weaponItem) {
        if (weaponItem.availableQty <= 0) {
          return {
            success: false,
            message: `عذراً! لا يوجد رصيد متاح حالياً من النوع (${orderData.weaponType}) بالمخزن.`
          };
        }
        weaponItem.availableQty -= 1;
        weaponItem.issuedQty += 1;
        weaponItem.lastUpdated = new Date().toISOString().split('T')[0];
      }
    }

    this.saveArmoryInventory(inventory);

    // Create Issue Order
    const issues = this.getArmoryIssues();
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0] + ' ' + now.toTimeString().slice(0, 5);
    const orderNumber = `ORD-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newOrder: ArmoryIssueOrder = {
      ...orderData,
      id: `iss-${Date.now()}`,
      orderNumber,
      date: dateStr,
      status: 'نشط'
    };

    issues.unshift(newOrder);
    this.saveArmoryIssues(issues);

    // Update tracked weapon piece status if serial provided
    if (orderData.weaponSerial) {
      const weapons = this.getArmoryWeapons();
      const piece = weapons.find(
        (w) => w.serialNumber.trim().toLowerCase() === orderData.weaponSerial?.trim().toLowerCase()
      );

      if (piece) {
        piece.status = 'منصرف للفرد';
        piece.currentHolderMilitaryId = orderData.recipientMilitaryId;
        piece.currentHolderName = orderData.recipientName;
        piece.currentHolderUnit = orderData.unit;
        this.saveArmoryWeapons(weapons);
      }

      // Record Lifecycle event
      const lifecycle = this.getWeaponLifecycle();
      lifecycle.unshift({
        id: `lc-${Date.now()}`,
        weaponSerial: orderData.weaponSerial,
        weaponType: orderData.weaponType,
        eventType: 'صرف للفرد',
        date: dateStr.split(' ')[0],
        actor: actingUser,
        recipientOrUnit: `${orderData.recipientRank} / ${orderData.recipientName} (${orderData.unit})`,
        details: `صرف بموجب أمر أمر الصرف رقم ${orderNumber} - ذخيرة: ${orderData.issuedAmmoQty} طلقة - سبب الصرف: ${orderData.issueReason}`
      });
      this.saveWeaponLifecycle(lifecycle);
    }

    // Sync with recipient's profile Armament log
    if (orderData.recipientMilitaryId) {
      this.addArmamentLog(
        orderData.recipientMilitaryId,
        {
          weaponSerial: orderData.weaponSerial || `WPN-${Math.floor(10000 + Math.random() * 90000)}`,
          weaponType: orderData.weaponType,
          issueDate: dateStr.split(' ')[0],
          ammoQty: orderData.issuedAmmoQty,
          firelinesCount: 4,
          ammoHistory: [
            {
              id: `ah-${Date.now()}`,
              type: 'صرف',
              quantity: orderData.issuedAmmoQty,
              date: dateStr.split(' ')[0],
              reason: orderData.issueReason || 'صرف رسمي لمهمة قتالية',
              issuedBy: actingUser
            }
          ],
          condition: 'ممتازة',
          technicalNotes: `أمر صرف رقم ${orderNumber}`
        },
        actingUser,
        actingDept
      );
    }

    this.logAction(
      actingUser,
      actingDept,
      'إصدار أمر صرف سلاح وذخيرة',
      orderData.recipientMilitaryId,
      orderData.recipientName,
      `أمر رقم: ${orderNumber} - السلاح: ${orderData.weaponType} (${orderData.weaponSerial || 'بدون رقم تسلسلي'}) - الذخيرة: ${orderData.issuedAmmoQty}`
    );

    return {
      success: true,
      message: `تم إصدار وتسجيل أمر الصرف رقم (${orderNumber}) وخصم الكمية من المخزون بنجاح.`,
      order: newOrder
    };
  }

  // Process Weapon/Ammo Return (إرجاع سلاح/ذخيرة للمخزن)
  static processArmoryReturn(
    issueId: string,
    returnNotes: string,
    actingUser = 'ضابط التسليح',
    actingDept: DepartmentRole = 'إدارة التسليح'
  ): { success: boolean; message: string } {
    const issues = this.getArmoryIssues();
    const orderIndex = issues.findIndex((i) => i.id === issueId);
    if (orderIndex === -1) {
      return { success: false, message: 'عذراً! لم يتم العثور على امر الصرف المستهدف.' };
    }

    const order = issues[orderIndex];
    if (order.status === 'تم الإرجاع') {
      return { success: false, message: 'هذا السند مسجل كمعاد مسبقاً.' };
    }

    order.status = 'تم الإرجاع';
    order.returnDate = new Date().toISOString().split('T')[0];
    order.notes = (order.notes || '') + ` | تم الإرجاع بتاريخ ${order.returnDate}: ${returnNotes}`;
    this.saveArmoryIssues(issues);

    // Return weapon & ammo back to inventory stock
    const inventory = this.getArmoryInventory();

    if (order.weaponType) {
      const weaponItem = inventory.find(
        (inv) =>
          inv.itemType === 'weapon' &&
          (inv.name.includes(order.weaponType) || order.weaponType.includes(inv.name))
      );
      if (weaponItem) {
        weaponItem.availableQty += 1;
        if (weaponItem.issuedQty > 0) weaponItem.issuedQty -= 1;
      }
    }

    if (order.issuedAmmoQty > 0 && order.ammoType) {
      const ammoItem = inventory.find(
        (inv) =>
          inv.itemType === 'ammo' &&
          (inv.name.includes(order.ammoType) || order.ammoType.includes(inv.name))
      );
      if (ammoItem) {
        ammoItem.availableQty += order.issuedAmmoQty;
        if (ammoItem.issuedQty >= order.issuedAmmoQty) ammoItem.issuedQty -= order.issuedAmmoQty;
      }
    }

    this.saveArmoryInventory(inventory);

    // Update tracked weapon piece
    if (order.weaponSerial) {
      const weapons = this.getArmoryWeapons();
      const piece = weapons.find(
        (w) => w.serialNumber.trim().toLowerCase() === order.weaponSerial?.trim().toLowerCase()
      );
      if (piece) {
        piece.status = 'في المخزن';
        piece.currentHolderMilitaryId = undefined;
        piece.currentHolderName = undefined;
        piece.currentHolderUnit = undefined;
        this.saveArmoryWeapons(weapons);
      }

      // Record Lifecycle event
      const lifecycle = this.getWeaponLifecycle();
      lifecycle.unshift({
        id: `lc-${Date.now()}`,
        weaponSerial: order.weaponSerial,
        weaponType: order.weaponType,
        eventType: 'إرجاع للمخزن',
        date: order.returnDate,
        actor: actingUser,
        recipientOrUnit: 'مخزن التسليح الرئيسي',
        details: `إرجاع السلاح من الفرد (${order.recipientName}) - الملاحظات: ${returnNotes}`
      });
      this.saveWeaponLifecycle(lifecycle);
    }

    this.logAction(
      actingUser,
      actingDept,
      'إرجاع سلاح/ذخيرة للمخزن',
      order.recipientMilitaryId,
      order.recipientName,
      `أمر الصرف: ${order.orderNumber} - السلاح: ${order.weaponType} (${order.weaponSerial || '-'})`
    );

    return { success: true, message: `تم تسليم وإعادة السلاح/الذخيرة للمخزن بنجاح وتحديث الرصيد.` };
  }

  // Reset to initial mock database
  static resetToDefault(): void {
    localStorage.removeItem(STORAGE_KEY_PERSONNEL);
    localStorage.removeItem(STORAGE_KEY_AUDIT);
    localStorage.removeItem(STORAGE_KEY_ALERTS);

    localStorage.removeItem(STORAGE_KEY_ARMORY_INVENTORY);
    localStorage.removeItem(STORAGE_KEY_ARMORY_WEAPONS);
    localStorage.removeItem(STORAGE_KEY_ARMORY_INTAKES);
    localStorage.removeItem(STORAGE_KEY_ARMORY_ISSUES);
    localStorage.removeItem(STORAGE_KEY_ARMORY_LIFECYCLE);
    localStorage.removeItem(STORAGE_KEY_WEAPON_TYPES);
    localStorage.removeItem(STORAGE_KEY_AMMO_TYPES);

    this.savePersonnel(INITIAL_PERSONNEL);
    this.saveAuditLogs(INITIAL_AUDIT_LOGS);
    this.saveAlerts(INITIAL_ALERTS);

    this.saveArmoryInventory(INITIAL_INVENTORY_ITEMS);
    this.saveArmoryWeapons(INITIAL_WEAPON_PIECES);
    this.saveArmoryIntakes(INITIAL_INTAKE_RECORDS);
    this.saveArmoryIssues(INITIAL_ISSUE_ORDERS);
    this.saveWeaponLifecycle(INITIAL_LIFECYCLE_EVENTS);
    this.saveWeaponTypesConfig(INITIAL_WEAPON_TYPES);
    this.saveAmmoTypesConfig(INITIAL_AMMO_TYPES);
    localStorage.removeItem(STORAGE_KEY_ACCOUNTS);
    this.saveAccounts(BRIGADE_ACCOUNTS);
  }

  // User Accounts Management
  static getAccounts(): UserAccount[] {
    try {
      const parsed = safeGetLocalItem<UserAccount[]>(STORAGE_KEY_ACCOUNTS);
      if (parsed && Array.isArray(parsed) && parsed.length > 0) {
        return BRIGADE_ACCOUNTS.map((defaultAcc) => {
          const found = parsed.find((a) => a.id === defaultAcc.id);
          return found ? { ...defaultAcc, ...found } : defaultAcc;
        });
      }
    } catch (err) {
      console.error('Failed to get user accounts:', err);
    }
    return BRIGADE_ACCOUNTS;
  }

  static saveAccounts(accounts: UserAccount[]): void {
    try {
      safeSetLocalItem(STORAGE_KEY_ACCOUNTS, accounts);
      syncDocToCloud('accounts_config', accounts);
      notifyDataChange();
    } catch (err) {
      console.error('Failed to save user accounts:', err);
    }
  }

  static updateAccount(accountId: string, updates: Partial<UserAccount>): UserAccount[] {
    const current = this.getAccounts();
    const updated = current.map((acc) => {
      if (acc.id === accountId) {
        return { ...acc, ...updates };
      }
      return acc;
    });
    this.saveAccounts(updated);
    return updated;
  }

  // Register live device presence & ping active status across devices
  static registerAccountActivity(accountId: string): UserAccount[] {
    const currentAccounts = this.getAccounts();
    const telemetry = getDeviceTelemetry();
    const now = Date.now();
    const nowTimeStr = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const updated = currentAccounts.map((acc) => {
      // Filter out sessions silent for more than 3 minutes (180,000 ms)
      let sessions = (acc.activeSessions || []).filter((s) => now - s.lastPing < 180000);

      if (acc.id === accountId && !acc.isBlocked && acc.status !== 'محظور') {
        const existingIdx = sessions.findIndex((s) => s.deviceId === telemetry.deviceId);
        if (existingIdx >= 0) {
          sessions[existingIdx] = {
            ...sessions[existingIdx],
            deviceTypeName: telemetry.deviceTypeName,
            deviceType: telemetry.deviceType,
            lastPing: now
          };
        } else {
          sessions.push({
            deviceId: telemetry.deviceId,
            deviceType: telemetry.deviceType,
            deviceTypeName: telemetry.deviceTypeName,
            lastPing: now
          });
        }

        const mobileCount = sessions.filter((s) => s.deviceType === 'mobile').length;
        const desktopCount = sessions.filter((s) => s.deviceType === 'desktop').length;
        const totalConnected = sessions.length;

        return {
          ...acc,
          status: 'نشط' as const,
          lastSeen: `متصل الآن (${nowTimeStr})`,
          connectedDevicesCount: totalConnected > 0 ? totalConnected : 1,
          devicesBreakdown: {
            mobileCount: mobileCount > 0 ? mobileCount : telemetry.deviceType === 'mobile' ? 1 : 0,
            desktopCount: desktopCount > 0 ? desktopCount : telemetry.deviceType === 'desktop' ? 1 : 0,
            lastDeviceType: telemetry.deviceTypeName
          },
          activeSessions: sessions
        };
      } else {
        if (sessions.length === 0 && acc.status === 'نشط' && !acc.isBlocked) {
          return {
            ...acc,
            status: 'غير نشط' as const,
            connectedDevicesCount: 0,
            activeSessions: []
          };
        }
        return {
          ...acc,
          connectedDevicesCount: sessions.length,
          activeSessions: sessions
        };
      }
    });

    safeSetLocalItem(STORAGE_KEY_ACCOUNTS, updated);
    return updated;
  }

  // Device binding logic for account link protection
  static checkAndBindAccountDevice(
    account: UserAccount,
    isHqAuthenticated: boolean = false
  ): { allowed: boolean; updatedAccount: UserAccount; isNewBinding?: boolean; reason?: string } {
    if (account.isMainCommand || isHqAuthenticated) {
      return { allowed: true, updatedAccount: account };
    }

    const telemetry = getDeviceTelemetry();
    const currentAccounts = this.getAccounts();
    const freshAccount = currentAccounts.find((a) => a.id === account.id) || account;

    // Case 1: Account is not bound to any device yet
    if (!freshAccount.boundDeviceId) {
      const nowIso = new Date().toISOString();
      const updatedList = this.updateAccount(freshAccount.id, {
        boundDeviceId: telemetry.deviceId,
        boundDeviceName: telemetry.deviceTypeName,
        boundAt: nowIso
      });
      const boundAcc = updatedList.find((a) => a.id === freshAccount.id) || {
        ...freshAccount,
        boundDeviceId: telemetry.deviceId,
        boundDeviceName: telemetry.deviceTypeName,
        boundAt: nowIso
      };

      this.logAction(
        'النظام / الأمان',
        'الاستخبارات والأمن',
        'تقييد جهاز الحساب تلقائياً',
        freshAccount.id,
        freshAccount.name,
        `تم ربط وتقييد رابط حساب (${freshAccount.name}) بالجهاز (${telemetry.deviceTypeName}) عند أول فتح للرابط.`,
        freshAccount.id,
        freshAccount.name
      );

      return { allowed: true, updatedAccount: boundAcc, isNewBinding: true };
    }

    // Case 2: Account is already bound to a device
    if (freshAccount.boundDeviceId === telemetry.deviceId) {
      return { allowed: true, updatedAccount: freshAccount };
    }

    // Case 3: Device mismatch! Unauthorized access attempt!
    this.registerUnauthorizedAccessAttempt(freshAccount, telemetry);

    return {
      allowed: false,
      updatedAccount: freshAccount,
      reason: `رابط حساب (${freshAccount.name}) مقيد بجهاز آخر (${freshAccount.boundDeviceName || 'جهاز مصرح به'}). لا يمكنك الفتح من هذا الجهاز.`
    };
  }

  static registerUnauthorizedAccessAttempt(account: UserAccount, telemetry: ReturnType<typeof getDeviceTelemetry>): void {
    const alerts = this.getAlerts();
    const nowStr = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

    // Prevent duplicate security alerts within 2 minutes for the same attempt
    const hasRecent = alerts.find(
      (a) =>
        a.title.includes(account.name) &&
        a.description &&
        a.description.includes(telemetry.deviceTypeName) &&
        Date.now() - new Date(a.date).getTime() < 120000
    );

    if (!hasRecent) {
      const newAlert: SystemAlert = {
        id: `alt-sec-dev-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        title: `🚨 تنبيه أمني عاجل: محاولة دخول غير مصرح بها عبر رابط (${account.name})`,
        description: `تم رصد محاولة فتح رابط حساب (${account.name}) [كود الحساب: ${account.shortCode}] عبر جهاز غير مصرح به: (${telemetry.deviceTypeName}) الساعة ${nowStr}. الحساب مقيد مسبقاً بالجهاز: (${account.boundDeviceName || 'جهاز آخر'}). تم منع الدخول وتوثيق التنبيه للمستخدم الرئيسي.`,
        level: 'urgent',
        date: new Date().toISOString().split('T')[0],
        createdByAccountId: 'hq'
      };

      this.saveAlerts([newAlert, ...alerts]);

      this.logAction(
        'نظام الأمان الحصري',
        'الاستخبارات والأمن',
        'محاولة دخول غير مصرح بها',
        account.id,
        account.name,
        `رصد محاولة فتح رابط حساب (${account.name}) من جهاز غير مصرح به (${telemetry.deviceTypeName}). تم الحظر التلقائي وإبلاغ القيادة الرئيسية.`,
        account.id,
        account.name
      );
    }
  }

  static unbindAccountDevice(accountId: string): UserAccount[] {
    const accounts = this.getAccounts();
    const target = accounts.find((a) => a.id === accountId);
    const updated = this.updateAccount(accountId, {
      boundDeviceId: undefined,
      boundDeviceName: undefined,
      boundAt: undefined
    });

    if (target) {
      this.logAction(
        'القيادة الرئيسية',
        'القيادة الرئيسية',
        'إعادة ضبط تقييد الجهاز',
        target.id,
        target.name,
        `تم إلغاء تقييد الجهاز لحساب (${target.name}) بواسطة القيادة الرئيسية. الحساب جاهز للتقييد بأي جهاز جديد عند فتح الرابط.`,
        target.id,
        target.name
      );
    }
    return updated;
  }

  // --- STORAGE METRICS, BACKUP & RESTORE METHODS ---

  static getStorageMetrics(): {
    totalUsedBytes: number;
    totalQuotaBytes: number;
    usedPercentage: number;
    categories: {
      name: string;
      key: string;
      bytes: number;
      percentage: number;
      itemCount: number;
      icon: string;
    }[];
  } {
    const totalQuotaBytes = 10 * 1024 * 1024; // 10 MB Allocated Limit
    let totalUsedBytes = 0;

    const keysToTrack = [
      { name: 'سجلات القوة البشرية والضباط', key: STORAGE_KEY_PERSONNEL, icon: '🪖' },
      { name: 'سجلات التسليح والأسلحة', key: STORAGE_KEY_ARMORY_WEAPONS, icon: '⚔️' },
      { name: 'جرد وإدخالات العتاد', key: STORAGE_KEY_ARMORY_INVENTORY, icon: '📦' },
      { name: 'سجل التدقيق والحركات العسكرية', key: STORAGE_KEY_AUDIT, icon: '📋' },
      { name: 'التنبيهات والإشعارات اللحظية', key: STORAGE_KEY_ALERTS, icon: '🚨' },
      { name: 'حسابات ومستخدمي المؤسسات (Users & Tenants)', key: STORAGE_KEY_REGISTERED_TENANTS, icon: '🏢' },
      { name: 'سلة المحذوفات والمستردات', key: STORAGE_KEY_RECYCLE_BIN, icon: '🗑️' },
      { name: 'حسابات الألوية والروابط', key: STORAGE_KEY_ACCOUNTS, icon: '🔑' }
    ];

    const categoryStats = keysToTrack.map((cat) => {
      let raw = '';
      let itemCount = 0;
      if (typeof window !== 'undefined') {
        try {
          raw = localStorage.getItem(cat.key) || '';
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) itemCount = parsed.length;
            else if (typeof parsed === 'object') itemCount = Object.keys(parsed).length;
          }
        } catch (e) {}
      }
      const bytes = new Blob([raw]).size;
      totalUsedBytes += bytes;
      return {
        name: cat.name,
        key: cat.key,
        bytes,
        percentage: 0,
        itemCount,
        icon: cat.icon
      };
    });

    const categories = categoryStats.map((cat) => ({
      ...cat,
      percentage: totalUsedBytes > 0 ? Math.round((cat.bytes / totalUsedBytes) * 100) : 0
    }));

    const usedPercentage = Math.min(100, Math.round((totalUsedBytes / totalQuotaBytes) * 100 * 10) / 10);

    return {
      totalUsedBytes,
      totalQuotaBytes,
      usedPercentage,
      categories
    };
  }

  static exportFullSystemBackup(): {
    version: string;
    exportTimestamp: string;
    activeTenantId: string;
    activeTenantName: string;
    data: {
      tenants: OrganizationTenant[];
      personnel: PersonnelRecord[];
      auditLogs: AuditLogEntry[];
      alerts: SystemAlert[];
      recycleBin: RecycledPersonnel[];
      replacements: PersonnelReplacementRecord[];
      accounts: UserAccount[];
      armoryWeapons: ArmoryWeaponPiece[];
      armoryInventory: ArmoryInventoryItem[];
      armoryIntakes: ArmoryIntakeRecord[];
      armoryIssues: ArmoryIssueOrder[];
      tenantUsersMap: Record<string, TenantUserAccount[]>;
    };
  } {
    const activeTenant = this.getActiveTenant();
    const tenants = this.getTenants();
    const tenantUsersMap: Record<string, TenantUserAccount[]> = {};

    tenants.forEach((t) => {
      tenantUsersMap[t.id] = this.getTenantUsers(t.id);
    });

    return {
      version: '3.0-military-hq',
      exportTimestamp: new Date().toISOString(),
      activeTenantId: activeTenant.id,
      activeTenantName: activeTenant.name,
      data: {
        tenants,
        personnel: this.getPersonnel(),
        auditLogs: this.getAuditLogs(),
        alerts: this.getAlerts(),
        recycleBin: this.getRecycleBin(),
        replacements: this.getReplacements(),
        accounts: this.getAccounts(),
        armoryWeapons: this.getArmoryWeapons(),
        armoryInventory: this.getArmoryInventory(),
        armoryIntakes: this.getArmoryIntakes(),
        armoryIssues: this.getArmoryIssues(),
        tenantUsersMap
      }
    };
  }

  static restoreFullSystemBackup(backupJson: any): { success: boolean; message: string; restoredStats?: string } {
    try {
      if (!backupJson || typeof backupJson !== 'object' || !backupJson.data) {
        return { success: false, message: 'ملف النسخة الاحتياطية غير صالح أو تالف! يرجى التأكد من استيراد ملف JSON سليم.' };
      }

      const { data } = backupJson;

      if (Array.isArray(data.tenants) && data.tenants.length > 0) {
        safeSetLocalItem(STORAGE_KEY_REGISTERED_TENANTS, JSON.stringify(data.tenants));
      }

      if (Array.isArray(data.personnel)) {
        this.savePersonnel(data.personnel);
      }

      if (Array.isArray(data.auditLogs)) {
        this.saveAuditLogs(data.auditLogs);
      }

      if (Array.isArray(data.alerts)) {
        this.saveAlerts(data.alerts);
      }

      if (Array.isArray(data.accounts)) {
        this.saveAccounts(data.accounts);
      }

      if (Array.isArray(data.armoryWeapons)) {
        this.saveArmoryWeapons(data.armoryWeapons);
      }

      if (Array.isArray(data.armoryInventory)) {
        this.saveArmoryInventory(data.armoryInventory);
      }

      if (data.tenantUsersMap && typeof data.tenantUsersMap === 'object') {
        Object.entries(data.tenantUsersMap).forEach(([tId, users]) => {
          if (Array.isArray(users)) {
            safeSetLocalItem(`military_tenant_users_${tId}`, JSON.stringify(users));
          }
        });
      }

      notifyDataChange();

      const personnelCount = Array.isArray(data.personnel) ? data.personnel.length : 0;
      const tenantsCount = Array.isArray(data.tenants) ? data.tenants.length : 0;

      return {
        success: true,
        message: 'تمت استعادة كافة البيانات والنسخة الاحتياطية بنجاح!',
        restoredStats: `تم استعادة (${personnelCount}) فرد، و(${tenantsCount}) مؤسسة عسكرية مع كافة سجلات التدقيق والتسليح.`
      };
    } catch (err: any) {
      return {
        success: false,
        message: `حدث خطأ أثناء استعادة النسخة الاحتياطية: ${err.message || err}`
      };
    }
  }

  static purgeStorageCategory(categoryKey: string): void {
    if (typeof window !== 'undefined') {
      try {
        if (categoryKey === STORAGE_KEY_AUDIT) {
          this.saveAuditLogs([]);
        } else if (categoryKey === STORAGE_KEY_ALERTS) {
          this.saveAlerts([]);
        } else if (categoryKey === STORAGE_KEY_RECYCLE_BIN) {
          safeSetLocalItem(STORAGE_KEY_RECYCLE_BIN, JSON.stringify([]));
          notifyDataChange();
        }
      } catch (e) {}
    }
  }
}

