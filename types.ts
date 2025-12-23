
export enum EmployeeStatus {
  ACTIVE = 'نشط',
  INACTIVE = 'غير نشط',
  ON_LEAVE = 'في إجازة',
  TERMINATED = 'منتهي الخدمة'
}

export enum UserRole {
  SUPER_ADMIN = 'مشرف عام',
  BRANCH_MANAGER = 'مدير فرع',
  DEPT_SUPERVISOR = 'رئيس قسم',
  EMPLOYEE = 'موظف'
}

export interface WorkingDay {
  day: string;
  isOff: boolean;
  startTime: string;
  endTime: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  checkIn: string;
  checkOut: string;
  status: 'حاضر' | 'متأخر' | 'غياب' | 'إجازة' | 'خروج مبكر';
  delayMinutes: number;
  deductionAmount: number; 
  bonusAmount: number;     
  shiftSalary: number; // Earnings based on actual hours worked
  branchId?: string;
  departmentId?: string;
}

export interface RewardRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  type: 'مكافأة' | 'خصم';
  amount: number;
  reason: string;
  date: string;
  status: 'معتمد' | 'ملغي';
  createdBy: string;
}

export interface EvaluationCriteria {
  id: string;
  name: string;
  description: string;
  weight: number;
  branchId?: string;
  departmentId?: string;
}

export interface EvaluationRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  evaluatorId: string;
  evaluatorName: string;
  date: string;
  scores: { criteriaId: string; score: number }[];
  totalScore: number;
  comments: string;
  branchId?: string;
  departmentId?: string;
}

export interface PayrollEntry {
  id: string;
  employeeId: string;
  employeeName: string;
  month: string;
  baseSalary: number;
  overtimeAmount: number;
  autoFines: number;
  manualBonus: number;
  manualDeduction: number;
  netSalary: number;
  status: 'قيد المراجعة' | 'تم الصرف';
  paymentDate?: string;
  notes?: string;
  branchId?: string;
  departmentId?: string;
}

export interface AdvanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  totalAmount: number;
  monthlyInstallment: number;
  remainingAmount: number;
  startDate: string;
  status: 'نشط' | 'مكتمل' | 'مرفوض';
}

export interface Employee {
  id: string;
  name: string;
  code: string;
  password?: string;
  role: UserRole;
  email: string;
  phone: string;
  branchId?: string;
  departmentId?: string;
  position: string; 
  level: string;
  status: EmployeeStatus;
  salary: number; 
  hourlyRate?: number; 
  hireDate: string;
  avatar: string;
  checkInTime: string;
  checkOutTime: string;
  gracePeriodMinutes: number;
  autoCheckOutEnabled: boolean;
  autoCheckOutAfterMinutes: number;
  allowOvertime: boolean;
  allowLateEntry: boolean;
  lateFineAmount: number;
  allowEarlyExit: boolean; // New
  earlyExitGracePeriod: number; // New
  earlyExitFineAmount: number; // New
  workingDays: WorkingDay[];
}

export interface CompanyDepartment {
  id: string;
  name: string;
  supervisorId: string; 
  supervisorName?: string;
  employeeCount: number;
  positions: string[]; 
}

export interface CompanyBranch {
  id: string;
  name: string;
  location: string;
  managerId: string; 
  managerName?: string;
  departments: CompanyDepartment[];
}

export interface Applicant {
  id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  experienceYears: number;
  status: 'جديد' | 'قيد المراجعة' | 'مقابلة' | 'مرفوض' | 'مقبول';
  applyDate: string;
  branchId?: string;
  departmentId?: string;
  notes?: string;
}
