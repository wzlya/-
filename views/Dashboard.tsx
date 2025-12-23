import React, { useMemo } from 'react';
// Fix: Import APP_NAME to resolve the "Cannot find name 'APP_NAME'" error.
import { TRANSLATIONS, CURRENCY, APP_NAME } from '../constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Cell, PieChart, Pie } from 'recharts';
import { Employee, AttendanceRecord, PayrollEntry, RewardRecord, AdvanceRecord, Applicant, UserRole } from '../types';

interface DashboardProps {
  employees: Employee[];
  attendanceRecords: AttendanceRecord[];
  payrollEntries: PayrollEntry[];
  rewardRecords: RewardRecord[];
  advanceRecords: AdvanceRecord[];
  applicants: Applicant[];
  currentUser: Employee;
}

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const StatCard: React.FC<{ title: string; value: string | number; subtitle: string; icon: React.ReactNode; colorClass: string }> = ({ title, value, subtitle, icon, colorClass }) => (
  <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-start justify-between transition-transform hover:scale-[1.02]">
    <div>
      <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-1">{title}</p>
      <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">{value}</h3>
      <p className="text-xs text-slate-500 font-bold mt-1">{subtitle}</p>
    </div>
    <div className={`p-3 rounded-2xl ${colorClass}`}>
      {icon}
    </div>
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ 
  employees, 
  attendanceRecords, 
  payrollEntries, 
  rewardRecords, 
  advanceRecords, 
  applicants,
  currentUser 
}) => {
  const today = new Date().toISOString().split('T')[0];
  const currentMonth = new Date().toISOString().slice(0, 7);

  // Real-time Calculations
  const stats = useMemo(() => {
    // 1. Workforce Stats
    const totalEmps = employees.length;
    const activeToday = attendanceRecords.filter(r => r.date === today && (r.status === 'حاضر' || r.status === 'متأخر')).length;
    const attendanceRate = totalEmps > 0 ? Math.round((activeToday / totalEmps) * 100) : 0;

    // 2. Financial Stats (Current Month)
    const monthPayroll = payrollEntries.filter(e => e.month === currentMonth);
    const totalPayroll = monthPayroll.reduce((sum, e) => sum + e.netSalary, 0);
    const pendingPayroll = monthPayroll.filter(e => e.status === 'قيد المراجعة').reduce((sum, e) => sum + e.netSalary, 0);

    // 3. Recruitment Stats
    const newApplicants = applicants.filter(a => a.status === 'جديد').length;
    const interviews = applicants.filter(a => a.status === 'مقابلة').length;

    // 4. Rewards/Advances
    const totalAdvances = advanceRecords.filter(a => a.status === 'نشط').reduce((sum, a) => sum + a.remainingAmount, 0);

    return { totalEmps, activeToday, attendanceRate, totalPayroll, pendingPayroll, newApplicants, interviews, totalAdvances };
  }, [employees, attendanceRecords, payrollEntries, applicants, advanceRecords, today, currentMonth]);

  // Chart Data: Attendance for the last 5 active days
  const attendanceTrend = useMemo(() => {
    const last5Days = [...new Set(attendanceRecords.map(r => r.date))].sort().slice(-5);
    return last5Days.map(date => {
      const records = attendanceRecords.filter(r => r.date === date);
      const present = records.filter(r => r.status === 'حاضر' || r.status === 'متأخر').length;
      return { 
        // Fix: Cast date to string to resolve the type error "Argument of type 'unknown' is not assignable to parameter of type 'string | number | Date'".
        name: new Date(date as string).toLocaleDateString('ar-IQ', { weekday: 'short' }),
        rate: employees.length > 0 ? Math.round((present / employees.length) * 100) : 0
      };
    });
  }, [attendanceRecords, employees]);

  // Chart Data: Employee Distribution by Branch
  const branchData = useMemo(() => {
    const branches: Record<string, number> = {};
    employees.forEach(e => {
      const b = e.branchId || 'غير محدد';
      branches[b] = (branches[b] || 0) + 1;
    });
    return Object.entries(branches).map(([name, value]) => ({ name, value }));
  }, [employees]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">أهلاً بك، {currentUser.name} 👋</h1>
          {/* Fix: APP_NAME is now imported from constants */}
          <p className="text-slate-500 text-sm font-bold">إليك نظرة شاملة على أداء {APP_NAME} اليوم</p>
        </div>
        <div className="flex gap-2 text-[10px] font-black text-slate-400 bg-white dark:bg-slate-900 px-4 py-2 rounded-xl border border-slate-100 dark:border-slate-800">
           تاريخ اليوم: {new Date().toLocaleDateString('ar-IQ', { dateStyle: 'long' })}
        </div>
      </header>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="قوة العمل" 
          value={stats.totalEmps} 
          subtitle={`${stats.activeToday} موظفاً باشروا اليوم`} 
          colorClass="bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>}
        />
        <StatCard 
          title="معدل الحضور" 
          value={`${stats.attendanceRate}%`} 
          subtitle="نسبة الالتزام اللحظية اليوم" 
          colorClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>}
        />
        <StatCard 
          title="الرواتب المعلقة" 
          value={`${stats.pendingPayroll.toLocaleString()} ${CURRENCY}`} 
          subtitle={`لشهر ${currentMonth} قيد المراجعة`} 
          colorClass="bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>}
        />
        <StatCard 
          title="طلبات التوظيف" 
          value={stats.newApplicants} 
          subtitle={`${stats.interviews} مقابلة مجدولة قريباً`} 
          colorClass="bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Attendance Rate Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
          <h3 className="text-lg font-black dark:text-white mb-6">تحليل التزام الحضور الأسبوعي (%)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={attendanceTrend}>
                <defs>
                  <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis fontSize={10} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                  labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                />
                <Area type="monotone" dataKey="rate" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorRate)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Branch Distribution Pie Chart */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
          <h3 className="text-lg font-black dark:text-white mb-6">توزيع الموظفين</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={branchData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {branchData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {branchData.map((b, i) => (
              <div key={b.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                  <span className="font-bold dark:text-slate-400">{b.name}</span>
                </div>
                <span className="font-black dark:text-white">{b.value} موظف</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Feed Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity: Attendance */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
          <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-lg font-black dark:text-white">آخر حركات المباشرة</h3>
            <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">مباشر الآن</span>
          </div>
          <div className="divide-y divide-slate-50 dark:divide-slate-800">
            {attendanceRecords.filter(r => r.date === today).slice(0, 5).map((r, i) => (
              <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs">{r.employeeName.charAt(0)}</div>
                  <div>
                    <p className="text-sm font-bold dark:text-white">{r.employeeName}</p>
                    <p className="text-[10px] text-slate-400 font-bold">{r.checkIn} - {r.status}</p>
                  </div>
                </div>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${r.status === 'حاضر' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  {r.status === 'متأخر' ? `تأخير ${r.delayMinutes}د` : 'في الوقت'}
                </span>
              </div>
            ))}
            {attendanceRecords.filter(r => r.date === today).length === 0 && (
              <p className="p-12 text-center text-slate-400 font-bold italic text-sm">لا توجد حركات حضور مسجلة اليوم بعد</p>
            )}
          </div>
        </div>

        {/* Latest Job Applicants */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
          <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-lg font-black dark:text-white">آخر المتقدمين للوظائف</h3>
            <button className="text-blue-600 text-[10px] font-black hover:underline">عرض الكل</button>
          </div>
          <div className="divide-y divide-slate-50 dark:divide-slate-800">
            {applicants.slice(0, 5).map((app, i) => (
              <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div>
                  <p className="text-sm font-bold dark:text-white">{app.name}</p>
                  <p className="text-[10px] text-slate-400 font-bold">{app.position} | {app.experienceYears} سنوات خبرة</p>
                </div>
                <span className="text-[10px] font-black bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-1 rounded-lg">
                  {app.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Gemini AI Insights Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-blue-900/20 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="space-y-4 text-right">
           <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L14.85 8.65L22 9.24L16.5 13.97L18.18 21L12 17.27L5.82 21L7.5 13.97L2 9.24L9.15 8.65L12 2Z"/></svg>
              تحليل Gemini الذكي
           </div>
           <h2 className="text-2xl font-black">تحليل أداء الشهر الحالي</h2>
           <p className="text-blue-100 font-bold max-w-xl text-sm leading-relaxed">
             بناءً على بيانات {stats.activeToday} موظفاً حاضرين اليوم، نلاحظ استقراراً في معدل الالتزام. إجمالي الالتزامات المالية المعلقة لشهر {currentMonth} تبلغ {stats.pendingPayroll.toLocaleString()} {CURRENCY}. ننصح بمراجعة سجلات المكافآت قبل موعد الصرف النهائي.
           </p>
        </div>
        <div className="hidden lg:block">
           <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md border border-white/20">
              <svg className="w-16 h-16 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
