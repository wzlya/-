
import React, { useState, useMemo, useEffect } from 'react';
import { CURRENCY, APP_NAME } from '../constants';
import { Employee, PayrollEntry, CompanyBranch, RewardRecord, AttendanceRecord, UserRole } from '../types';

interface PayrollProps {
  employees: Employee[];
  hierarchy: CompanyBranch[];
  allPayrollEntries: PayrollEntry[];
  setAllPayrollEntries: React.Dispatch<React.SetStateAction<PayrollEntry[]>>;
  rewards: RewardRecord[];
  setRewards: React.Dispatch<React.SetStateAction<RewardRecord[]>>;
  attendanceRecords: AttendanceRecord[];
}

const Payroll: React.FC<PayrollProps> = ({ 
  employees, 
  hierarchy, 
  allPayrollEntries, 
  setAllPayrollEntries, 
  rewards,
  setRewards,
  attendanceRecords 
}) => {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 7);
  });

  const [branchFilter, setBranchFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'الكل' | 'تم الصرف' | 'قيد المراجعة'>('الكل');
  
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustingEntry, setAdjustingEntry] = useState<PayrollEntry | null>(null);
  const [adjustForm, setAdjustForm] = useState({ type: 'مكافأة' as 'مكافأة' | 'خصم', amount: 0, reason: '' });

  // Helper: Get working days in a month for a specific employee
  const getExpectedWorkingDays = (monthStr: string, emp: Employee) => {
    const [year, month] = monthStr.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    let count = 0;
    const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month - 1, i);
      const dayName = days[date.getDay()];
      const schedule = emp.workingDays?.find(d => d.day === dayName);
      if (schedule && !schedule.isOff) count++;
      else if (!schedule && dayName !== 'الجمعة' && dayName !== 'السبت') count++;
    }
    return count || 22; // Default to 22 if no schedule found
  };

  // Sync Logic
  useEffect(() => {
    const missingEmployees = employees.filter(emp => 
      !allPayrollEntries.some(e => e.employeeId === emp.id && e.month === selectedMonth)
    );
    
    if (missingEmployees.length > 0) {
      const newEntries: PayrollEntry[] = missingEmployees.map(emp => ({
        id: `pay-${emp.id}-${selectedMonth}`,
        employeeId: emp.id,
        employeeName: emp.name,
        month: selectedMonth,
        baseSalary: emp.salary,
        overtimeAmount: 0,
        autoFines: 0,
        manualBonus: 0,
        manualDeduction: 0,
        netSalary: emp.salary,
        status: 'قيد المراجعة',
        branchId: emp.branchId,
        departmentId: emp.departmentId
      }));
      setAllPayrollEntries(prev => [...prev, ...newEntries]);
    }
  }, [selectedMonth, employees, allPayrollEntries.length]);

  const currentEntries = useMemo(() => {
    return allPayrollEntries
      .filter(e => e.month === selectedMonth)
      .map(entry => {
        const emp = employees.find(emp => emp.id === entry.employeeId);
        if (!emp) return null;

        // Attendance Stats
        const monthAttendance = attendanceRecords.filter(r => 
          r.employeeId === entry.employeeId && 
          r.date.startsWith(selectedMonth)
        );

        const presentDays = monthAttendance.filter(r => r.status === 'حاضر' || r.status === 'متأخر').length;
        const absentDays = monthAttendance.filter(r => r.status === 'غياب').length;
        const expectedDays = getExpectedWorkingDays(selectedMonth, emp);
        
        const autoFinesSum = monthAttendance.reduce((sum, r) => sum + (r.deductionAmount || 0), 0);
        const autoBonusSum = monthAttendance.reduce((sum, r) => sum + (r.bonusAmount || 0), 0);

        // Rewards Stats
        const monthRewards = rewards.filter(r => 
          r.employeeId === entry.employeeId && 
          r.date.startsWith(selectedMonth) && 
          r.status === 'معتمد'
        );
        const manualBonusSum = monthRewards.filter(r => r.type === 'مكافأة').reduce((s, r) => s + r.amount, 0);
        const manualDeductionSum = monthRewards.filter(r => r.type === 'خصم').reduce((s, r) => s + r.amount, 0);

        // Logic: Salary = (Base / Expected) * Present + Adjustments
        const dailyRate = emp.salary / expectedDays;
        const earnedSalary = dailyRate * presentDays;
        const net = earnedSalary + autoBonusSum + manualBonusSum - autoFinesSum - manualDeductionSum;

        return {
          ...entry,
          employeeName: emp.name,
          baseSalary: emp.salary,
          earnedSalary: Math.round(earnedSalary),
          presentDays,
          absentDays,
          expectedDays,
          autoFines: autoFinesSum,
          overtimeAmount: autoBonusSum,
          manualBonus: manualBonusSum,
          manualDeduction: manualDeductionSum,
          netSalary: Math.round(net),
          branchId: emp.branchId,
          departmentId: emp.departmentId
        };
      })
      .filter((e): e is any => {
        if (!e) return false;
        const matchBranch = !branchFilter || e.branchId === branchFilter;
        const matchDept = !deptFilter || e.departmentId === deptFilter;
        const matchStatus = statusFilter === 'الكل' || e.status === statusFilter;
        return matchBranch && matchDept && matchStatus;
      });
  }, [allPayrollEntries, selectedMonth, branchFilter, deptFilter, statusFilter, employees, rewards, attendanceRecords]);

  const handlePay = (id: string) => {
    setAllPayrollEntries(prev => prev.map(e => e.id === id ? { ...e, status: 'تم الصرف', paymentDate: new Date().toISOString() } : e));
  };

  const handleReversePay = (id: string) => {
    if (confirm('هل تريد فعلاً التراجع عن صرف هذا الراتب وإعادته للمراجعة؟')) {
      setAllPayrollEntries(prev => prev.map(e => e.id === id ? { ...e, status: 'قيد المراجعة', paymentDate: undefined } : e));
    }
  };

  const handleAdjustSave = () => {
    if (!adjustingEntry || !adjustForm.amount || !adjustForm.reason) return;
    
    const newReward: RewardRecord = {
      id: 'rew-' + Date.now(),
      employeeId: adjustingEntry.employeeId,
      employeeName: adjustingEntry.employeeName,
      type: adjustForm.type,
      amount: adjustForm.amount,
      reason: `[تعديل راتب ${selectedMonth}] ${adjustForm.reason}`,
      date: `${selectedMonth}-01`, // Tie to the first of the month for payroll sync
      status: 'معتمد',
      createdBy: 'نظام الرواتب'
    };

    setRewards(prev => [...prev, newReward]);
    setIsAdjustModalOpen(false);
    setAdjustForm({ type: 'مكافأة', amount: 0, reason: '' });
  };

  const handlePrintSlip = (entry: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html dir="rtl" lang="ar">
        <head>
          <title>كشف راتب - ${entry.employeeName}</title>
          <style>
            body { font-family: 'Cairo', sans-serif; padding: 40px; color: #1e293b; }
            .header { text-align: center; border-bottom: 2px solid #334155; padding-bottom: 20px; margin-bottom: 30px; }
            .section { margin-bottom: 20px; }
            .grid { display: grid; grid-template-cols: 1fr 1fr; gap: 20px; }
            .label { font-weight: bold; color: #64748b; font-size: 12px; }
            .value { font-size: 16px; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #e2e8f0; padding: 12px; text-align: right; }
            th { bg-color: #f8fafc; }
            .total { font-size: 24px; font-weight: 900; color: #2563eb; text-align: center; padding: 20px; background: #eff6ff; border-radius: 12px; margin-top: 30px; }
            .footer { margin-top: 50px; display: flex; justify-content: space-between; }
            .sig-box { border-top: 1px solid #000; width: 150px; text-align: center; padding-top: 10px; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${APP_NAME}</h1>
            <h2>كشف راتب تفصيلي للشهر: ${entry.month}</h2>
          </div>
          <div class="section grid">
            <div><span class="label">اسم الموظف:</span> <div class="value">${entry.employeeName}</div></div>
            <div><span class="label">الرقم الوظيفي:</span> <div class="value">${entry.employeeId}</div></div>
          </div>
          <table>
            <thead>
              <tr>
                <th>البيان</th>
                <th>التفاصيل</th>
                <th>المبلغ (${CURRENCY})</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>الراتب الأساسي</td>
                <td>أيام العمل المفترضة: ${entry.expectedDays}</td>
                <td>${entry.baseSalary.toLocaleString()}</td>
              </tr>
              <tr>
                <td>الاستحقاق الفعلي</td>
                <td>أيام الحضور: ${entry.presentDays}</td>
                <td>${entry.earnedSalary.toLocaleString()}</td>
              </tr>
              <tr>
                <td>المكافآت والإضافي</td>
                <td>إداري وآلي</td>
                <td style="color: green">+${(entry.manualBonus + entry.overtimeAmount).toLocaleString()}</td>
              </tr>
              <tr>
                <td>الخصومات والتأخير</td>
                <td>إداري وتأخير حضور</td>
                <td style="color: red">-${(entry.manualDeduction + entry.autoFines).toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
          <div class="total">الصافي النهائي: ${entry.netSalary.toLocaleString()} ${CURRENCY}</div>
          <div class="footer">
            <div class="sig-box">توقيع الموظف</div>
            <div class="sig-box">توقيع المحاسب</div>
            <div class="sig-box">ختم الإدارة</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">مسير الرواتب الذكي</h1>
          <p className="text-slate-500 text-sm font-bold">الحساب بناءً على أيام الدوام الفعلية والحضور</p>
        </div>
        <div className="flex flex-wrap gap-2">
           <button onClick={() => window.print()} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-xl font-bold flex items-center gap-2">
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
             طباعة الكشف العام
           </button>
        </div>
      </header>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-wrap gap-4 items-end print:hidden">
        <div className="flex-1 min-w-[150px]">
          <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">شهر الرواتب</label>
          <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm font-bold dark:text-white" />
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">الفرع</label>
          <select value={branchFilter} onChange={e => setBranchFilter(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm font-bold dark:text-white">
            <option value="">جميع الفروع</option>
            {hierarchy.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">الحالة</label>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm font-bold dark:text-white">
            <option value="الكل">كل الحالات</option>
            <option value="قيد المراجعة">قيد المراجعة</option>
            <option value="تم الصرف">تم الصرف</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">الموظف</th>
                <th className="px-6 py-4 text-center">أيام العمل</th>
                <th className="px-6 py-4 text-center">الحضور الفعلي</th>
                <th className="px-6 py-4 text-center">الغياب</th>
                <th className="px-6 py-4 text-center">الاستحقاق الفعلي</th>
                <th className="px-6 py-4 text-center">الصافي النهائي</th>
                <th className="px-6 py-4 text-center print:hidden">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {currentEntries.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900 dark:text-white">{e.employeeName}</span>
                      <span className="text-[10px] text-slate-400 font-bold">الأساسي: {e.baseSalary.toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center font-bold">{e.expectedDays} يوم</td>
                  <td className="px-6 py-4 text-center text-emerald-600 font-black">{e.presentDays} يوم</td>
                  <td className="px-6 py-4 text-center text-red-600 font-black">{e.absentDays} يوم</td>
                  <td className="px-6 py-4 text-center font-bold">{e.earnedSalary.toLocaleString()}</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center">
                       <span className="text-lg font-black text-blue-600">{e.netSalary.toLocaleString()} {CURRENCY}</span>
                       <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${e.status === 'تم الصرف' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                         {e.status}
                       </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center print:hidden">
                    <div className="flex items-center justify-center gap-2">
                       {e.status === 'قيد المراجعة' ? (
                         <>
                           <button onClick={() => { setAdjustingEntry(e); setIsAdjustModalOpen(true); }} className="p-2 text-slate-400 hover:text-blue-600" title="تعديل مالي">
                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/></svg>
                           </button>
                           <button onClick={() => handlePay(e.id)} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-black shadow-lg shadow-blue-900/10">صرف</button>
                         </>
                       ) : (
                         <>
                           <button onClick={() => handlePrintSlip(e)} className="p-2 text-slate-400 hover:text-emerald-600" title="طباعة كشف">
                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
                           </button>
                           <button onClick={() => handleReversePay(e.id)} className="text-red-600 text-[10px] font-black hover:underline">تراجع</button>
                         </>
                       )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjustment Modal */}
      {isAdjustModalOpen && adjustingEntry && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
           <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl animate-scale-up overflow-hidden">
              <header className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                 <h3 className="text-xl font-black dark:text-white text-right w-full">تعديل مالي قبل الصرف: {adjustingEntry.employeeName}</h3>
              </header>
              <div className="p-6 space-y-4 text-right">
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="block text-xs font-black text-slate-400 mb-1 uppercase">النوع</label>
                       <select className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-bold dark:text-white" value={adjustForm.type} onChange={e => setAdjustForm({...adjustForm, type: e.target.value as any})}>
                          <option value="مكافأة">إضافة مكافأة (+)</option>
                          <option value="خصم">إجراء خصم (-)</option>
                       </select>
                    </div>
                    <div>
                       <label className="block text-xs font-black text-slate-400 mb-1 uppercase">المبلغ</label>
                       <input type="number" className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl p-3 font-black text-blue-600" value={adjustForm.amount} onChange={e => setAdjustForm({...adjustForm, amount: parseInt(e.target.value)})} />
                    </div>
                 </div>
                 <div>
                    <label className="block text-xs font-black text-slate-400 mb-1 uppercase">السبب / الملاحظات</label>
                    <textarea rows={3} className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-bold dark:text-white" value={adjustForm.reason} onChange={e => setAdjustForm({...adjustForm, reason: e.target.value})} placeholder="مثلاً: بونص أداء متميز، غياب يوم إضافي..." />
                 </div>
              </div>
              <footer className="p-6 border-t border-slate-100 dark:border-slate-800 flex gap-3">
                 <button onClick={handleAdjustSave} className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-black shadow-lg shadow-blue-900/10 hover:bg-blue-700 transition-all">حفظ التعديل والمزامنة</button>
                 <button onClick={() => setIsAdjustModalOpen(false)} className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl font-bold">إلغاء</button>
              </footer>
           </div>
        </div>
      )}
    </div>
  );
};

export default Payroll;
