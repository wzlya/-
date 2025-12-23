
import React, { useState, useEffect } from 'react';
import { TRANSLATIONS, Icons, APP_NAME } from './constants';
import Dashboard from './views/Dashboard';
import EmployeeList from './views/EmployeeList';
import Attendance from './views/Attendance';
import Payroll from './views/Payroll';
import Advances from './views/Advances';
import Recruitment from './views/Recruitment';
import Hierarchy, { INITIAL_HIERARCHY } from './views/Hierarchy';
import Settings from './views/Settings';
import Performance from './views/Performance';
import { Employee, EmployeeStatus, CompanyBranch, AttendanceRecord, EvaluationCriteria, EvaluationRecord } from './types';

type View = 'dashboard' | 'employees' | 'attendance' | 'payroll' | 'advances' | 'requests' | 'recruitment' | 'hierarchy' | 'settings' | 'performance';

const MOCK_EMPLOYEES: Employee[] = [
  { 
    id: '1', name: 'أساور', code: 'EMP-1029', email: 'asawer@company.iq', phone: '07701234567', branchId: 'b1', departmentId: 'd1', position: 'ممثل خدمة عملاء', level: 'L2', status: EmployeeStatus.ACTIVE, salary: 1200000, hireDate: '2023-01-15', avatar: 'https://i.pravatar.cc/150?u=asawer',
    checkInTime: '08:00', checkOutTime: '16:00', gracePeriodMinutes: 15, allowOvertime: true, allowLateEntry: true, lateFineAmount: 5000, workingDays: [],
    autoCheckOutEnabled: false, autoCheckOutAfterMinutes: 60
  },
  { 
    id: '2', name: 'حسن صباح', code: 'EMP-3342', email: 'hassan@company.iq', phone: '07802345678', branchId: 'b1', departmentId: 'd1', position: 'موظف', level: 'L3', status: EmployeeStatus.ACTIVE, salary: 1500000, hireDate: '2022-03-10', avatar: 'https://i.pravatar.cc/150?u=hassan',
    checkInTime: '08:00', checkOutTime: '16:00', gracePeriodMinutes: 10, allowOvertime: false, allowLateEntry: false, lateFineAmount: 10000, workingDays: [],
    autoCheckOutEnabled: false, autoCheckOutAfterMinutes: 60
  },
];

const TODAY = new Date().toISOString().split('T')[0];

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  const [employees, setEmployees] = useState<Employee[]>(MOCK_EMPLOYEES);
  const [hierarchy, setHierarchy] = useState<CompanyBranch[]>(INITIAL_HIERARCHY);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [criteria, setCriteria] = useState<EvaluationCriteria[]>([]);
  const [evaluations, setEvaluations] = useState<EvaluationRecord[]>([]);

  // Apply dark mode to body
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const navItems = [
    { id: 'dashboard', label: TRANSLATIONS.dashboard, icon: <Icons.Dashboard /> },
    { id: 'employees', label: TRANSLATIONS.employees, icon: <Icons.Users /> },
    { id: 'hierarchy', label: TRANSLATIONS.hierarchy, icon: <Icons.Hierarchy /> },
    { id: 'attendance', label: TRANSLATIONS.attendance, icon: <Icons.Calendar /> },
    { id: 'performance', label: TRANSLATIONS.performance, icon: <Icons.Performance /> },
    { id: 'payroll', label: TRANSLATIONS.payroll, icon: <Icons.Currency /> },
    { id: 'advances', label: TRANSLATIONS.advances, icon: <Icons.Briefcase /> },
    { id: 'recruitment', label: TRANSLATIONS.recruitment, icon: <Icons.Recruitment /> },
    { id: 'settings', label: TRANSLATIONS.settings, icon: <Icons.Settings /> },
  ];

  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard />;
      case 'employees': return <EmployeeList employees={employees} setEmployees={setEmployees} hierarchy={hierarchy} />;
      case 'attendance': return <Attendance employees={employees} records={attendanceRecords} setRecords={setAttendanceRecords} hierarchy={hierarchy} />;
      case 'performance': return <Performance employees={employees} criteria={criteria} evaluations={evaluations} setEvaluations={setEvaluations} hierarchy={hierarchy} />;
      case 'payroll': return <Payroll employees={employees} hierarchy={hierarchy} />;
      case 'advances': return <Advances />;
      case 'recruitment': return <Recruitment />;
      case 'hierarchy': return <Hierarchy hierarchy={hierarchy} setHierarchy={setHierarchy} employees={employees} />;
      case 'settings': return <Settings criteria={criteria} setCriteria={setCriteria} hierarchy={hierarchy} />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className={`min-h-screen flex ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'} transition-colors duration-300`} dir="rtl">
      {/* Sidebar */}
      <aside className={`print:hidden ${isSidebarOpen ? 'w-64' : 'w-20'} ${theme === 'dark' ? 'bg-slate-900 border-l border-slate-800' : 'bg-slate-900'} text-white transition-all duration-300 flex flex-col sticky top-0 h-screen overflow-y-auto z-50`}>
        <div className="p-4 flex items-center justify-between">
          {isSidebarOpen && <span className="text-xl font-bold truncate tracking-tight">{APP_NAME}</span>}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-800 rounded transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          </button>
        </div>
        <nav className="mt-8 flex-1">
          {navItems.map((item) => (
            <button key={item.id} onClick={() => setCurrentView(item.id as View)} className={`w-full flex items-center p-4 transition-all ${currentView === item.id ? 'bg-blue-600 border-r-4 border-white' : 'hover:bg-slate-800 opacity-70 hover:opacity-100'}`}>
              <div className="flex-shrink-0">{item.icon}</div>
              {isSidebarOpen && <span className="mr-3 font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className={`print:hidden h-16 ${theme === 'dark' ? 'bg-slate-900 border-b border-slate-800' : 'bg-white shadow-sm'} flex items-center px-6 sticky top-0 z-40 transition-colors`}>
          <div className="flex-1"></div>
          <div className="flex items-center space-x-4 space-x-reverse">
             {/* Theme Toggle */}
             <button 
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                className={`p-2 rounded-full transition-all ${theme === 'dark' ? 'bg-slate-800 text-yellow-400' : 'bg-slate-100 text-slate-600'}`}
                title={theme === 'light' ? 'تبديل للوضع الليلي' : 'تبديل للوضع النهاري'}
             >
                {theme === 'light' ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M16.95 16.95l.707.707M7.757 7.757l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z"/></svg>
                )}
             </button>

             <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-2"></div>

             <button onClick={() => setCurrentView('employees')} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-bold shadow-sm transition-all text-sm">
               إضافة موظف +
             </button>
          </div>
        </header>

        <div className="p-6 overflow-y-auto print:p-0">
          {renderView()}
        </div>
      </main>
    </div>
  );
};

export default App;
