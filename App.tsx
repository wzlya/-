
import React, { useState, useEffect, useMemo } from 'react';
import { TRANSLATIONS, Icons, APP_NAME } from './constants';
import Dashboard from './views/Dashboard';
import EmployeeList from './views/EmployeeList';
import Attendance from './views/Attendance';
import Payroll from './views/Payroll';
import Advances from './views/Advances';
import Rewards from './views/Rewards';
import Recruitment from './views/Recruitment';
import Hierarchy from './views/Hierarchy';
import Settings from './views/Settings';
import Performance from './views/Performance';
import Login from './views/Login';
import { INITIAL_EMPLOYEES, INITIAL_HIERARCHY, DB } from './database';
import { Employee, CompanyBranch, AttendanceRecord, EvaluationCriteria, EvaluationRecord, PayrollEntry, UserRole, RewardRecord, AdvanceRecord, Applicant } from './types';

type View = 'dashboard' | 'employees' | 'attendance' | 'payroll' | 'advances' | 'rewards' | 'recruitment' | 'hierarchy' | 'settings' | 'performance';

const DEFAULT_CONTRACT = `
<div style="font-family: 'Cairo', sans-serif; line-height: 1.8; color: #333;">
  <h1 style="text-align: center; color: #1a202c; border-bottom: 2px solid #333; padding-bottom: 10px;">عقد عمل فردي</h1>
  <p style="text-align: left;">تاريخ التحرير: {{تاريخ_اليوم}}</p>
  <p><strong>الطرف الأول:</strong> شركة برايم الأصالة للمقاولات والتجارة العامة.</p>
  <p><strong>الطرف الثاني:</strong> السيد/السيدة {{الاسم}}، الحامل للرقم الوظيفي {{الكود}}.</p>
  <h3>البند الأول: موضوع العقد</h3>
  <p>تعيين الطرف الثاني بمهنة <strong>{{المنصب}}</strong> في فرع <strong>{{الفرع}}</strong>.</p>
  <h3>البند الثاني: الراتب والامتيازات</h3>
  <p>يتقاضى الطرف الثاني راتباً أساسياً قدره <strong>{{الراتب}} د.ع</strong>.</p>
  <br><br>
  <div style="display: flex; justify-content: space-between;">
    <div style="border-top: 1px solid #000; width: 200px; text-align: center;">الطرف الأول</div>
    <div style="border-top: 1px solid #000; width: 200px; text-align: center;">الطرف الثاني</div>
  </div>
</div>
`;

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Persistent States
  const [employees, setEmployees] = useState<Employee[]>(() => DB.load('hrms_employees', INITIAL_EMPLOYEES));
  const [hierarchy, setHierarchy] = useState<CompanyBranch[]>(() => DB.load('hrms_hierarchy', INITIAL_HIERARCHY));
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() => DB.load('hrms_attendance', []));
  const [rewardRecords, setRewardRecords] = useState<RewardRecord[]>(() => DB.load('hrms_rewards', []));
  const [advanceRecords, setAdvanceRecords] = useState<AdvanceRecord[]>(() => DB.load('hrms_advances', []));
  const [allPayrollEntries, setAllPayrollEntries] = useState<PayrollEntry[]>(() => DB.load('hrms_payroll', []));
  const [criteria, setCriteria] = useState<EvaluationCriteria[]>(() => DB.load('hrms_criteria', []));
  const [evaluations, setEvaluations] = useState<EvaluationRecord[]>(() => DB.load('hrms_evaluations', []));
  const [contractTemplate, setContractTemplate] = useState(() => DB.load('hrms_contract', DEFAULT_CONTRACT));
  const [applicants, setApplicants] = useState<Applicant[]>(() => DB.load('hrms_applicants', []));

  // Sync to LocalStorage on changes
  useEffect(() => DB.save('hrms_employees', employees), [employees]);
  useEffect(() => DB.save('hrms_hierarchy', hierarchy), [hierarchy]);
  useEffect(() => DB.save('hrms_attendance', attendanceRecords), [attendanceRecords]);
  useEffect(() => DB.save('hrms_rewards', rewardRecords), [rewardRecords]);
  useEffect(() => DB.save('hrms_advances', advanceRecords), [advanceRecords]);
  useEffect(() => DB.save('hrms_payroll', allPayrollEntries), [allPayrollEntries]);
  useEffect(() => DB.save('hrms_criteria', criteria), [criteria]);
  useEffect(() => DB.save('hrms_evaluations', evaluations), [evaluations]);
  useEffect(() => DB.save('hrms_contract', contractTemplate), [contractTemplate]);
  useEffect(() => DB.save('hrms_applicants', applicants), [applicants]);

  const filteredEmployees = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === UserRole.SUPER_ADMIN) return employees;
    if (currentUser.role === UserRole.BRANCH_MANAGER) return employees.filter(e => e.branchId === currentUser.branchId);
    if (currentUser.role === UserRole.DEPT_SUPERVISOR) return employees.filter(e => e.departmentId === currentUser.departmentId);
    return employees.filter(e => e.id === currentUser.id);
  }, [employees, currentUser]);

  const filteredHierarchy = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === UserRole.SUPER_ADMIN) return hierarchy;
    if (currentUser.role === UserRole.BRANCH_MANAGER) return hierarchy.filter(h => h.id === currentUser.branchId);
    return hierarchy.filter(h => h.id === currentUser.branchId).map(h => ({
        ...h,
        departments: h.departments.filter(d => d.id === currentUser.departmentId)
    }));
  }, [hierarchy, currentUser]);

  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [theme]);

  if (!currentUser) return <Login onLogin={setCurrentUser} employees={employees} />;

  const navItems = [
    { id: 'dashboard', label: TRANSLATIONS.dashboard, icon: <Icons.Dashboard /> },
    { id: 'employees', label: TRANSLATIONS.employees, icon: <Icons.Users /> },
    { id: 'hierarchy', label: TRANSLATIONS.hierarchy, icon: <Icons.Hierarchy /> },
    { id: 'attendance', label: TRANSLATIONS.attendance, icon: <Icons.Calendar /> },
    { id: 'rewards', label: TRANSLATIONS.rewards, icon: <Icons.Rewards /> },
    { id: 'performance', label: TRANSLATIONS.performance, icon: <Icons.Performance /> },
    { id: 'payroll', label: TRANSLATIONS.payroll, icon: <Icons.Currency /> },
    { id: 'advances', label: TRANSLATIONS.advances, icon: <Icons.Briefcase /> },
    { id: 'recruitment', label: TRANSLATIONS.recruitment, icon: <Icons.Recruitment /> },
    { id: 'settings', label: TRANSLATIONS.settings, icon: <Icons.Settings /> },
  ];

  return (
    <div className={`min-h-screen flex transition-colors duration-300 ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}`} dir="rtl">
      <aside className={`print:hidden ${isSidebarOpen ? 'w-64' : 'w-20'} bg-slate-900 text-white transition-all duration-300 flex flex-col sticky top-0 h-screen overflow-y-auto z-50`}>
        <div className="p-4 flex items-center justify-between">
          {isSidebarOpen && <span className="text-xl font-bold truncate tracking-tight">{APP_NAME}</span>}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-800 rounded transition-colors"><Icons.Dashboard /></button>
        </div>
        <nav className="mt-8 flex-1">
          {navItems.map((item) => (
            <button key={item.id} onClick={() => setCurrentView(item.id as View)} className={`w-full flex items-center p-4 transition-all ${currentView === item.id ? 'bg-blue-600 border-r-4 border-white font-black' : 'hover:bg-slate-800 opacity-70'}`}>
              <div className="flex-shrink-0">{item.icon}</div>
              {isSidebarOpen && <span className="mr-3">{item.label}</span>}
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className={`print:hidden h-16 ${theme === 'dark' ? 'bg-slate-900 border-b border-slate-800' : 'bg-white shadow-sm'} flex items-center px-6 sticky top-0 z-40`}>
          <div className="flex-1"></div>
          <div className="flex items-center space-x-4 space-x-reverse">
             <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="p-2 rounded-full bg-slate-100 dark:bg-slate-800">
                {theme === 'light' ? '🌙' : '☀️'}
             </button>
             <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 px-4 py-1.5 rounded-2xl border border-slate-100 dark:border-slate-800">
               <div className="text-right">
                  <p className="text-sm font-black dark:text-white leading-tight">{currentUser.name}</p>
                  <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold">{currentUser.role}</p>
               </div>
               <button onClick={() => setCurrentUser(null)} className="mr-2 text-red-500 hover:scale-110 transition-transform">🚪</button>
             </div>
          </div>
        </header>
        <div className="p-6 overflow-y-auto">
          {currentView === 'dashboard' && <Dashboard employees={filteredEmployees} attendanceRecords={attendanceRecords} payrollEntries={allPayrollEntries} rewardRecords={rewardRecords} advanceRecords={advanceRecords} applicants={applicants} currentUser={currentUser} />}
          {currentView === 'employees' && <EmployeeList employees={filteredEmployees} setEmployees={setEmployees} hierarchy={filteredHierarchy} setHierarchy={setHierarchy} currentUser={currentUser} contractTemplate={contractTemplate} />}
          {currentView === 'attendance' && <Attendance employees={filteredEmployees} records={attendanceRecords} setRecords={setAttendanceRecords} hierarchy={filteredHierarchy} setRewards={setRewardRecords} currentUser={currentUser} />}
          {currentView === 'payroll' && <Payroll employees={filteredEmployees} hierarchy={filteredHierarchy} allPayrollEntries={allPayrollEntries} setAllPayrollEntries={setAllPayrollEntries} rewards={rewardRecords} setRewards={setRewardRecords} attendanceRecords={attendanceRecords} />}
          {currentView === 'rewards' && <Rewards employees={filteredEmployees} rewards={rewardRecords} setRewards={setRewardRecords} currentUser={currentUser} hierarchy={filteredHierarchy} />}
          {currentView === 'advances' && <Advances employees={filteredEmployees} advances={advanceRecords} setAdvances={setAdvanceRecords} currentUser={currentUser} />}
          {currentView === 'recruitment' && <Recruitment applicants={applicants} setApplicants={setApplicants} hierarchy={filteredHierarchy} currentUser={currentUser} setEmployees={setEmployees} contractTemplate={contractTemplate} />}
          {currentView === 'hierarchy' && <Hierarchy hierarchy={filteredHierarchy} setHierarchy={setHierarchy} employees={employees} setEmployees={setEmployees} currentUser={currentUser} />}
          {currentView === 'performance' && <Performance employees={filteredEmployees} criteria={criteria} evaluations={evaluations} setEvaluations={setEvaluations} hierarchy={filteredHierarchy} currentUser={currentUser} />}
          {currentView === 'settings' && <Settings criteria={criteria} setCriteria={setCriteria} hierarchy={filteredHierarchy} contractTemplate={contractTemplate} setContractTemplate={setContractTemplate} />}
        </div>
      </main>
    </div>
  );
};

export default App;
