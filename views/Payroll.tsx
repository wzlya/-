
import React, { useState, useMemo, useEffect } from 'react';
import { CURRENCY, APP_NAME } from '../constants';
import { Employee, PayrollEntry, CompanyBranch } from '../types';

interface PayrollProps {
  employees: Employee[];
  hierarchy: CompanyBranch[];
}

const Payroll: React.FC<PayrollProps> = ({ employees, hierarchy }) => {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 7); // Previous month YYYY-MM
  });

  const [branchFilter, setBranchFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  // Main state for all payroll records across all months
  // In a real app, this would be fetched from an API whenever selectedMonth changes.
  const [allPayrollEntries, setAllPayrollEntries] = useState<PayrollEntry[]>([]);

  // Initialize or update entries when month changes or employees are added
  useEffect(() => {
    // Logic: If we don't have entries for this month, generate them for current employees
    const existingEntriesForMonth = allPayrollEntries.filter(e => e.month === selectedMonth);
    
    if (existingEntriesForMonth.length === 0) {
      const newEntries: PayrollEntry[] = employees.map(emp => ({
        id: `p-${emp.id}-${selectedMonth}`,
        employeeId: emp.id,
        employeeName: emp.name,
        month: selectedMonth,
        baseSalary: emp.salary,
        overtimeAmount: Math.floor(Math.random() * 50000), // In real life, calculate from attendance
        autoFines: Math.floor(Math.random() * 20000), // In real life, calculate from attendance
        manualBonus: 0,
        manualDeduction: 0,
        netSalary: emp.salary,
        status: 'قيد المراجعة',
        notes: '',
        branchId: emp.branchId,
        departmentId: emp.departmentId
      }));
      setAllPayrollEntries(prev => [...prev, ...newEntries]);
    }
  }, [selectedMonth, employees]);

  const [adjustmentModal, setAdjustmentModal] = useState<{ isOpen: boolean, entryId: string | null, type: 'bonus' | 'deduction' | 'note' }>({
    isOpen: false,
    entryId: null,
    type: 'bonus'
  });

  const [adjustmentValue, setAdjustmentValue] = useState<string | number>(0);
  const [slipModal, setSlipModal] = useState<{ isOpen: boolean, entry: PayrollEntry | null }>({
    isOpen: false,
    entry: null
  });

  // Derived filtered and calculated entries
  const currentViewEntries = useMemo(() => {
    return allPayrollEntries
      .filter(entry => {
        const matchMonth = entry.month === selectedMonth;
        const matchBranch = !branchFilter || entry.branchId === branchFilter;
        const matchDept = !deptFilter || entry.departmentId === deptFilter;
        return matchMonth && matchBranch && matchDept;
      })
      .map(entry => {
        const net = entry.baseSalary + entry.overtimeAmount + entry.manualBonus - entry.autoFines - entry.manualDeduction;
        return { ...entry, netSalary: net };
      });
  }, [allPayrollEntries, selectedMonth, branchFilter, deptFilter]);

  const handlePay = (id: string) => {
    setAllPayrollEntries(prev => prev.map(entry => 
      entry.id === id ? { ...entry, status: 'تم الصرف', paymentDate: new Date().toISOString().split('T')[0] } : entry
    ));
  };

  const handlePayAll = () => {
    const pendingIds = currentViewEntries.filter(e => e.status !== 'تم الصرف').map(e => e.id);
    if (pendingIds.length === 0) {
      alert('لا توجد رواتب قيد المراجعة في الفلتر الحالي');
      return;
    }
    if (confirm(`هل أنت متأكد من صرف (${pendingIds.length}) راتب معلق للفترة المختارة؟`)) {
      setAllPayrollEntries(prev => prev.map(entry => 
        pendingIds.includes(entry.id) 
          ? { ...entry, status: 'تم الصرف', paymentDate: new Date().toISOString().split('T')[0] } 
          : entry
      ));
    }
  };

  const openAdjustment = (id: string, type: 'bonus' | 'deduction' | 'note') => {
    const entry = currentViewEntries.find(e => e.id === id);
    if (type === 'note') {
      setAdjustmentValue(entry?.notes || '');
    } else {
      setAdjustmentValue(type === 'bonus' ? (entry?.manualBonus || 0) : (entry?.manualDeduction || 0));
    }
    setAdjustmentModal({ isOpen: true, entryId: id, type });
  };

  const saveAdjustment = () => {
    setAllPayrollEntries(prev => prev.map(entry => {
      if (entry.id === adjustmentModal.entryId) {
        if (adjustmentModal.type === 'note') {
          return { ...entry, notes: String(adjustmentValue) };
        }
        return adjustmentModal.type === 'bonus' 
          ? { ...entry, manualBonus: Number(adjustmentValue) } 
          : { ...entry, manualDeduction: Number(adjustmentValue) };
      }
      return entry;
    }));
    setAdjustmentModal({ isOpen: false, entryId: null, type: 'bonus' });
  };

  const printSlip = (entry: PayrollEntry) => {
    setSlipModal({ isOpen: true, entry });
  };

  const stats = useMemo(() => {
    const total = currentViewEntries.reduce((acc, curr) => acc + curr.netSalary, 0);
    const paid = currentViewEntries.filter(e => e.status === 'تم الصرف').reduce((acc, curr) => acc + curr.netSalary, 0);
    return { total, paid, pending: total - paid };
  }, [currentViewEntries]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold dark:text-white">إدارة صرف الرواتب</h1>
          <p className="text-slate-500 dark:text-slate-400">احتساب المستحقات والمكافآت لشهر محدد</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-slate-400 mb-1">الشهر المستهدف</label>
            <input 
              type="month" 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2 rounded-lg font-bold dark:text-white text-sm"
            />
          </div>
          <button 
            onClick={handlePayAll}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 dark:shadow-none transition-all active:scale-95 mt-5"
          >
            صرف كافة الظاهر
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-wrap gap-4 print:hidden">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-[10px] font-bold text-slate-400 mb-1">تصفية حسب الفرع</label>
          <select value={branchFilter} onChange={e => setBranchFilter(e.target.value)} className="w-full bg-transparent border-slate-200 dark:border-slate-700 rounded-lg py-1.5 text-sm dark:text-white">
            <option value="">كل الفروع</option>
            {hierarchy.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-[10px] font-bold text-slate-400 mb-1">تصفية حسب القسم</label>
          <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} className="w-full bg-transparent border-slate-200 dark:border-slate-700 rounded-lg py-1.5 text-sm dark:text-white">
            <option value="">كل الأقسام</option>
            {hierarchy.flatMap(b => b.departments).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:hidden">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
          <p className="text-slate-500 text-sm font-bold">إجمالي كلفة الفلتر الحالي</p>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stats.total.toLocaleString()} {CURRENCY}</h3>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 border-r-4 border-r-emerald-500">
          <p className="text-emerald-600 text-sm font-bold">تم صرفه (بالفلتر)</p>
          <h3 className="text-2xl font-black text-emerald-600 mt-1">{stats.paid.toLocaleString()} {CURRENCY}</h3>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 border-r-4 border-r-blue-500">
          <p className="text-blue-600 text-sm font-bold">متبقي قيد الصرف</p>
          <h3 className="text-2xl font-black text-blue-600 mt-1">{stats.pending.toLocaleString()} {CURRENCY}</h3>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden print:hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">الموظف</th>
                <th className="px-6 py-4 text-center">الأساسي</th>
                <th className="px-6 py-4 text-center">إضافي (+)</th>
                <th className="px-6 py-4 text-center text-red-500">غرامات (-)</th>
                <th className="px-6 py-4 text-center text-emerald-600">مكافآت (+)</th>
                <th className="px-6 py-4 text-center text-red-600">خصم يدوي (-)</th>
                <th className="px-6 py-4 text-center bg-blue-50 dark:bg-blue-900/10">صافي الراتب</th>
                <th className="px-6 py-4 text-center">ملاحظات</th>
                <th className="px-6 py-4 text-center">الحالة</th>
                <th className="px-6 py-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {currentViewEntries.map((entry) => (
                <tr key={entry.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 font-bold dark:text-white">{entry.employeeName}</td>
                  <td className="px-6 py-4 text-center">{entry.baseSalary.toLocaleString()}</td>
                  <td className="px-6 py-4 text-center text-emerald-600">{entry.overtimeAmount.toLocaleString()}</td>
                  <td className="px-6 py-4 text-center text-red-400">{entry.autoFines.toLocaleString()}</td>
                  <td className="px-6 py-4 text-center">
                    <button onClick={() => openAdjustment(entry.id, 'bonus')} className="text-emerald-600 hover:underline font-bold">
                      {entry.manualBonus > 0 ? `+${entry.manualBonus.toLocaleString()}` : 'إضافة'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button onClick={() => openAdjustment(entry.id, 'deduction')} className="text-red-600 hover:underline font-bold">
                      {entry.manualDeduction > 0 ? `-${entry.manualDeduction.toLocaleString()}` : 'خصم'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-center bg-blue-50/50 dark:bg-blue-900/5 font-black text-blue-600 dark:text-blue-400 whitespace-nowrap">
                    {entry.netSalary.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-center max-w-[150px] truncate">
                    <button onClick={() => openAdjustment(entry.id, 'note')} className="text-slate-400 hover:text-blue-600 transition-colors italic text-xs">
                      {entry.notes || 'إضافة ملاحظة...'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${entry.status === 'تم الصرف' ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {entry.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                       {entry.status !== 'تم الصرف' && (
                         <button onClick={() => handlePay(entry.id)} className="bg-emerald-600 text-white p-2 rounded-lg hover:bg-emerald-700 transition-colors" title="صرف الراتب">
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                         </button>
                       )}
                       <button onClick={() => printSlip(entry)} className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 p-2 rounded-lg hover:bg-slate-200 transition-colors" title="كشف الراتب">
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
              {currentViewEntries.length === 0 && (
                <tr>
                  <td colSpan={10} className="p-20 text-center text-slate-400 font-bold">لا تتوفر رواتب للعرض في الفلتر والشهر الحالي</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjustment Modal (Bonus, Deduction, Note) */}
      {adjustmentModal.isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm shadow-2xl p-6">
            <h3 className="text-xl font-bold mb-4 dark:text-white">
              {adjustmentModal.type === 'bonus' ? 'إضافة مكافأة مالية' : 
               adjustmentModal.type === 'deduction' ? 'إضافة خصم يدوي' : 'إضافة ملاحظات إدارية'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-500 mb-1">
                   {adjustmentModal.type === 'note' ? 'نص الملاحظة' : `المبلغ (${CURRENCY})`}
                </label>
                {adjustmentModal.type === 'note' ? (
                  <textarea 
                    value={adjustmentValue} 
                    onChange={(e) => setAdjustmentValue(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm dark:text-white min-h-[100px]"
                    autoFocus
                  />
                ) : (
                  <input 
                    type="number" 
                    value={adjustmentValue} 
                    onChange={(e) => setAdjustmentValue(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl p-3 text-lg font-black text-blue-600"
                    autoFocus
                  />
                )}
              </div>
              <div className="flex gap-3">
                <button onClick={saveAdjustment} className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl font-bold">حفظ</button>
                <button onClick={() => setAdjustmentModal({ ...adjustmentModal, isOpen: false })} className="flex-1 bg-slate-100 dark:bg-slate-800 dark:text-slate-400 text-slate-600 py-2.5 rounded-xl font-bold">إلغاء</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Salary Slip Modal & Print View */}
      {slipModal.isOpen && slipModal.entry && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[250] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl shadow-2xl p-8 print:p-0 print:shadow-none print:w-full">
            <header className="flex items-center justify-between border-b-2 border-slate-100 dark:border-slate-800 pb-6 mb-6">
               <div className="text-right">
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white">كشف راتب تفصيلي</h2>
                  <p className="text-sm text-slate-500">{APP_NAME} - العراق</p>
               </div>
               <div className="bg-blue-600 text-white p-3 rounded-2xl font-black italic">MADAR HR</div>
            </header>

            <div className="grid grid-cols-2 gap-8 mb-8">
               <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-400 uppercase">بيانات الموظف</p>
                  <p className="text-lg font-black dark:text-white">{slipModal.entry.employeeName}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">الفترة المالية: {slipModal.entry.month}</p>
               </div>
               <div className="text-left space-y-2">
                  <p className="text-xs font-bold text-slate-400 uppercase text-left">تاريخ الاستخراج</p>
                  <p className="text-sm font-bold dark:text-white">{new Date().toLocaleDateString('ar-IQ')}</p>
                  <p className="text-sm text-emerald-600 font-bold">الحالة: {slipModal.entry.status}</p>
               </div>
            </div>

            <div className="space-y-4">
               <div className="flex justify-between items-center py-3 border-b border-slate-50 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-400">الراتب الأساسي</span>
                  <span className="font-bold dark:text-white">{slipModal.entry.baseSalary.toLocaleString()} {CURRENCY}</span>
               </div>
               <div className="flex justify-between items-center py-3 border-b border-slate-50 dark:border-slate-800">
                  <span className="text-emerald-600 font-bold">ساعات العمل الإضافي</span>
                  <span className="text-emerald-600 font-bold">+{slipModal.entry.overtimeAmount.toLocaleString()} {CURRENCY}</span>
               </div>
               <div className="flex justify-between items-center py-3 border-b border-slate-50 dark:border-slate-800">
                  <span className="text-emerald-600 font-bold">المكافآت والبدلات</span>
                  <span className="text-emerald-600 font-bold">+{slipModal.entry.manualBonus.toLocaleString()} {CURRENCY}</span>
               </div>
               <div className="flex justify-between items-center py-3 border-b border-slate-50 dark:border-slate-800">
                  <span className="text-red-500 font-bold">غرامات التأخير والغياب</span>
                  <span className="text-red-500 font-bold">-{slipModal.entry.autoFines.toLocaleString()} {CURRENCY}</span>
               </div>
               <div className="flex justify-between items-center py-3 border-b border-slate-50 dark:border-slate-800">
                  <span className="text-red-600 font-bold">خصومات إدارية أخرى</span>
                  <span className="text-red-600 font-bold">-{slipModal.entry.manualDeduction.toLocaleString()} {CURRENCY}</span>
               </div>

               {/* Notes in Slip */}
               {slipModal.entry.notes && (
                 <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 mt-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">ملاحظات إضافية:</p>
                    <p className="text-sm text-slate-600 dark:text-slate-300 italic">"{slipModal.entry.notes}"</p>
                 </div>
               )}

               <div className="flex justify-between items-center py-6 mt-4 bg-slate-50 dark:bg-slate-800 rounded-2xl px-6 border-2 border-blue-600/20">
                  <span className="text-lg font-black text-slate-900 dark:text-white">صافي المبلغ المستحق</span>
                  <span className="text-3xl font-black text-blue-600 dark:text-blue-400">{slipModal.entry.netSalary.toLocaleString()} {CURRENCY}</span>
               </div>
            </div>

            <div className="mt-12 grid grid-cols-2 gap-20">
               <div className="text-center border-t border-slate-200 dark:border-slate-700 pt-4">
                  <p className="text-xs text-slate-400 mb-8">توقيع الموظف</p>
                  <div className="h-10 border-b border-slate-300 dark:border-slate-700 border-dashed"></div>
               </div>
               <div className="text-center border-t border-slate-200 dark:border-slate-700 pt-4">
                  <p className="text-xs text-slate-400 mb-8">ختم وتوقيع الإدارة المعتمد</p>
                  <div className="h-10 border-b border-slate-300 dark:border-slate-700 border-dashed"></div>
               </div>
            </div>

            <footer className="mt-12 flex gap-4 print:hidden">
               <button onClick={() => window.print()} className="flex-1 bg-slate-900 text-white py-3 rounded-2xl font-bold">طباعة الكشف</button>
               <button onClick={() => setSlipModal({ isOpen: false, entry: null })} className="flex-1 bg-slate-100 dark:bg-slate-800 dark:text-slate-400 text-slate-600 py-3 rounded-2xl font-bold">إغلاق</button>
            </footer>
          </div>
        </div>
      )}

      <style>{`
        @media print {
          body * { visibility: hidden; }
          .fixed.inset-0.z-\\[250\\] { position: absolute; left: 0; top: 0; width: 100%; height: auto; visibility: visible; }
          .fixed.inset-0.z-\\[250\\] * { visibility: visible; }
          .print\\:hidden { display: none !important; }
          .bg-white { background: white !important; }
          .text-blue-600 { color: #2563eb !important; }
          .dark .bg-slate-900 { background: white !important; }
          .dark .text-white { color: black !important; }
        }
      `}</style>
    </div>
  );
};

export default Payroll;
