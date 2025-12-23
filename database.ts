
import { Employee, EmployeeStatus, CompanyBranch, AttendanceRecord, EvaluationCriteria, EvaluationRecord, PayrollEntry, UserRole, RewardRecord, AdvanceRecord } from './types';

// Storage Keys
const KEYS = {
  EMPLOYEES: 'hrms_employees',
  HIERARCHY: 'hrms_hierarchy',
  ATTENDANCE: 'hrms_attendance',
  REWARDS: 'hrms_rewards',
  ADVANCES: 'hrms_advances',
  PAYROLL: 'hrms_payroll',
  CRITERIA: 'hrms_criteria',
  EVALUATIONS: 'hrms_evaluations'
};

// Seed Data
export const INITIAL_HIERARCHY: CompanyBranch[] = [
  {
    id: 'b1',
    name: 'فرع بغداد - الكرادة',
    location: 'بغداد، الكرادة، شارع 62',
    managerId: '1',
    managerName: 'زيد الهاشمي',
    departments: [
      { id: 'd1', name: 'تكنولوجيا المعلومات', supervisorId: '1', employeeCount: 5, positions: ['مدير تقني', 'مطور', 'دعم فني'] },
      { id: 'd2', name: 'المالية', supervisorId: '2', employeeCount: 3, positions: ['محاسب أول', 'أمين صندوق'] }
    ]
  }
];

export const INITIAL_EMPLOYEES: Employee[] = [
  { 
    id: 'admin-001', name: 'حسام', code: 'admin', password: 'admin', 
    role: UserRole.SUPER_ADMIN, email: 'hussam@madar.iq', phone: '0770000000', 
    position: 'مشرف عام', level: 'Director', status: EmployeeStatus.ACTIVE, 
    salary: 5000000, hireDate: '2020-01-01', avatar: '', checkInTime: '08:00', checkOutTime: '16:00',
    gracePeriodMinutes: 30, autoCheckOutEnabled: false, autoCheckOutAfterMinutes: 0,
    allowOvertime: true, allowLateEntry: true, lateFineAmount: 0,
    allowEarlyExit: true, earlyExitGracePeriod: 0, earlyExitFineAmount: 0,
    workingDays: []
  },
  { 
    id: '1', name: 'زيد الهاشمي', code: 'EMP-1001', password: '123',
    role: UserRole.BRANCH_MANAGER, email: 'zaid@madar.iq', phone: '07701234567', 
    branchId: 'b1', departmentId: 'd1', position: 'مدير تقني', level: 'L1', status: EmployeeStatus.ACTIVE, 
    salary: 2500000, hireDate: '2022-01-01', avatar: '', checkInTime: '08:00', checkOutTime: '16:00',
    gracePeriodMinutes: 15, autoCheckOutEnabled: true, autoCheckOutAfterMinutes: 60,
    allowOvertime: true, allowLateEntry: true, lateFineAmount: 5000,
    allowEarlyExit: false, earlyExitGracePeriod: 5, earlyExitFineAmount: 5000,
    workingDays: []
  }
];

// Helper Functions for Persistence
export const DB = {
  save: (key: string, data: any) => localStorage.setItem(key, JSON.stringify(data)),
  load: (key: string, fallback: any) => {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  },
  clear: () => localStorage.clear()
};

export const getPayrollForMonth = (employees: Employee[], month: string, existingEntries: PayrollEntry[]): PayrollEntry[] => {
  const monthEntries = existingEntries.filter(e => e.month === month);
  if (monthEntries.length === 0) {
    return employees.map(emp => ({
      id: `pay-${emp.id}-${month}`,
      employeeId: emp.id,
      employeeName: emp.name,
      month: month,
      baseSalary: emp.salary,
      overtimeAmount: 0,
      autoFines: 0,
      manualBonus: 0,
      manualDeduction: 0,
      netSalary: emp.salary,
      status: 'قيد المراجعة',
      notes: '',
      branchId: emp.branchId,
      departmentId: emp.departmentId
    }));
  }
  return monthEntries;
};
