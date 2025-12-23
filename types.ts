
export enum EmployeeStatus {
  ACTIVE = 'نشط',
  INACTIVE = 'غير نشط',
  ON_LEAVE = 'في إجازة',
  TERMINATED = 'منتهي الخدمة'
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
  checkIn: string; // "HH:mm" or "--"
  checkOut: string; // "HH:mm" or "--"
  status: 'حاضر' | 'متأخر' | 'غياب' | 'إجازة' | 'خروج مبكر';
  delayMinutes: number;
  branchId?: string;
  departmentId?: string;
}

export interface EvaluationCriteria {
  id: string;
  name: string;
  description: string;
  weight: number; // 0-100
  branchId?: string; // Optional scope
  departmentId?: string; // Optional scope
}

export interface EvaluationRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  evaluatorId: string;
  evaluatorName: string;
  date: string;
  scores: { criteriaId: string; score: number }[]; // score 0-10
  totalScore: number; // Calculated Weighted Average
  comments: string;
  branchId?: string;
  departmentId?: string;
}

export interface PayrollEntry {
  id: string;
  employeeId: string;
  employeeName: string;
  month: string; // "YYYY-MM"
  baseSalary: number;
  overtimeAmount: number;
  autoFines: number;
  manualBonus: number;
  manualDeduction: number;
  netSalary: number;
  status: 'قيد المراجعة' | 'تم الصرف';
  paymentDate?: string;
  notes?: string; // Added field for administrative notes
  branchId?: string;
  departmentId?: string;
}

export interface Employee {
  id: string;
  name: string;
  code: string;
  password?: string;
  email: string;
  phone: string;
  branchId?: string;
  departmentId?: string;
  positionId?: string; 
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
  workingDays: WorkingDay[];
  address?: string;
  dob?: string;
  bankAccount?: string;
  reportsTo?: string; 
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
  cvUrl?: string;
}
