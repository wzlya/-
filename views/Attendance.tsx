
import React, { useState, useMemo } from 'react';
import { Employee, AttendanceRecord, CompanyBranch, RewardRecord } from '../types';
import { CURRENCY } from '../constants';

interface AttendanceProps {
  employees: Employee[];
  records: AttendanceRecord[];
  setRecords: React.Dispatch<React.SetStateAction<AttendanceRecord[]>>;
  hierarchy: CompanyBranch[];
  setRewards: React.Dispatch<React.SetStateAction<RewardRecord[]>>;
  currentUser: Employee;
}

const Attendance: React.FC<AttendanceProps> = ({ employees, records, setRecords, hierarchy, setRewards, currentUser }) => {
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [branchFilter, setBranchFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [filterType, setFilterType] = useState<'الكل' | 'حاضر' | 'متأخر' | 'غياب' | 'إجازة' | 'خروج مبكر'>('الكل');

  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);

  const [manualEntry, setManualEntry] = useState({
    employeeId: '',
    checkIn: '',
    checkOut: '',
    date: new Date().toISOString().split('T')[0]
  });

  const getDayName = (dateStr: string) => {
    const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const date = new Date(dateStr);
    return days[date.getDay()];
  };

  /**
   * Financial & Sync Logic
   */
  const calculateFinancials = (checkIn: string, checkOut: string, emp: Employee): Partial<AttendanceRecord> => {
    let status: AttendanceRecord['status'] = 'حاضر';
    let delay = 0;
    let deduction = 0;
    let bonus = 0;
    let shiftSalary = 0;

    if (!checkIn || checkIn === '' || checkIn === '--:--') {
      return { status: 'غياب', delayMinutes: 0, deductionAmount: 0, bonusAmount: 0, shiftSalary: 0 };
    }

    const [h, m] = checkIn.split(':').map(Number);
    const [eh, em] = emp.checkInTime.split(':').map(Number);
    const actualInMinutes = h * 60 + m;
    const expectedInMinutes = eh * 60 + em;
    const graceMinutes = emp.gracePeriodMinutes || 0;

    // 1. Late Entry Deduction (Auto Fine)
    if (actualInMinutes > (expectedInMinutes + graceMinutes)) {
      delay = actualInMinutes - expectedInMinutes;
      status = 'متأخر';
      deduction += emp.lateFineAmount || 0;
    }

    // 2. Check-Out Logic
    if (checkOut && checkOut !== '' && checkOut !== '--:--') {
      const [oh, om] = checkOut.split(':').map(Number);
      const [eoh, eom] = emp.checkOutTime.split(':').map(Number);
      const actualOutMinutes = oh * 60 + om;
      const expectedOutMinutes = eoh * 60 + eom;

      // Actual Working Time Salary (Shift Pay)
      const totalMinutesWorked = actualOutMinutes - actualInMinutes;
      if (totalMinutesWorked > 0 && emp.hourlyRate) {
        shiftSalary = Math.round((totalMinutesWorked / 60) * emp.hourlyRate);
      }

      // Early Exit Logic (Auto Fine)
      const earlyExitGrace = emp.earlyExitGracePeriod || 0;
      if (actualOutMinutes < (expectedOutMinutes - earlyExitGrace)) {
        status = 'خروج مبكر';
        if (!emp.allowEarlyExit) {
          deduction += emp.earlyExitFineAmount || 0;
        }
      }

      // Overtime Bonus
      if (actualOutMinutes > expectedOutMinutes && emp.allowOvertime) {
        const overtimeMinutes = actualOutMinutes - expectedOutMinutes;
        if (emp.hourlyRate) {
          bonus = Math.round((overtimeMinutes / 60) * emp.hourlyRate);
        }
      }
    }

    return { status, delayMinutes: delay, deductionAmount: deduction, bonusAmount: bonus, shiftSalary };
  };

  const syncToRewards = (empId: string, empName: string, date: string, type: 'late' | 'early' | 'bonus', amount: number) => {
    if (amount <= 0) return;

    const rewardType = type === 'bonus' ? 'مكافأة' : 'خصم';
    const reasonPrefix = type === 'late' ? 'تلقائي: تأخير حضور' : 
                         type === 'early' ? 'تلقائي: خروج مبكر' : 
                         'تلقائي: عمل إضافي';

    const newReward: RewardRecord = {
      id: `att-sync-${empId}-${date}-${type}`,
      employeeId: empId,
      employeeName: empName,
      type: rewardType,
      amount: amount,
      reason: `${reasonPrefix} - بتاريخ ${date}`,
      date: date,
      status: 'معتمد',
      createdBy: 'نظام الحضور والاحتساب التلقائي'
    };

    setRewards(prev => {
      const filtered = prev.filter(r => r.id !== newReward.id);
      return [...filtered, newReward];
    });
  };

  const computedData = useMemo(() => {
    const dayName = getDayName(dateFilter);

    return employees
      .filter(emp => {
        const isHired = emp.hireDate <= dateFilter;
        const matchBranch = !branchFilter || emp.branchId === branchFilter;
        const matchDept = !deptFilter || emp.departmentId === deptFilter;
        return isHired && matchBranch && matchDept;
      })
      .map(emp => {
        const actualRecord = records.find(r => r.employeeId === emp.id && r.date === dateFilter);
        if (actualRecord) return actualRecord;

        const schedule = emp.workingDays?.find(d => d.day === dayName);
        const isOffDay = schedule ? schedule.isOff : (dayName === 'الجمعة' || dayName === 'السبت');

        return {
          id: `virtual-${emp.id}-${dateFilter}`,
          employeeId: emp.id,
          employeeName: emp.name,
          date: dateFilter,
          checkIn: '',
          checkOut: '',
          status: isOffDay ? 'إجازة' : 'غياب' as any,
          delayMinutes: 0,
          deductionAmount: 0,
          bonusAmount: 0,
          shiftSalary: 0,
          branchId: emp.branchId,
          departmentId: emp.departmentId,
          isVirtual: true
        } as AttendanceRecord & { isVirtual?: boolean };
      })
      .filter(rec => filterType === 'الكل' || rec.status === filterType);
  }, [employees, records, dateFilter, branchFilter, deptFilter, filterType]);

  const stats = useMemo(() => {
    const presentCount = computedData.filter(r => r.status === 'حاضر' || r.status === 'متأخر' || r.status === 'خروج مبكر').length;
    const totalDailyPay = computedData.reduce((sum, r) => sum + (r.shiftSalary || 0) + (r.bonusAmount || 0) - (r.deductionAmount || 0), 0);
    return {
      present: presentCount,
      late: computedData.filter(r => r.status === 'متأخر').length,
      absent: computedData.filter(r => r.status === 'غياب').length,
      totalPay: totalDailyPay
    };
  }, [computedData]);

  const handleManualSave = () => {
    const emp = employees.find(e => e.id === manualEntry.employeeId);
    if (!emp) return;

    const autoCalcs = calculateFinancials(manualEntry.checkIn, manualEntry.checkOut, emp);

    const newRecord: AttendanceRecord = {
      id: 'att-' + Date.now(),
      employeeId: emp.id,
      employeeName: emp.name,
      date: manualEntry.date,
      checkIn: manualEntry.checkIn,
      checkOut: manualEntry.checkOut,
      status: autoCalcs.status!,
      delayMinutes: autoCalcs.delayMinutes!,
      deductionAmount: autoCalcs.deductionAmount!,
      bonusAmount: autoCalcs.bonusAmount!,
      shiftSalary: autoCalcs.shiftSalary!,
      branchId: emp.branchId,
      departmentId: emp.departmentId
    };

    setRecords(prev => {
      const filtered = prev.filter(r => !(r.employeeId === emp.id && r.date === manualEntry.date));
      return [...filtered, newRecord];
    });

    // Sync to Rewards Section
    if (newRecord.status === 'متأخر') syncToRewards(emp.id, emp.name, newRecord.date, 'late', emp.lateFineAmount);
    if (newRecord.status === 'خروج مبكر') syncToRewards(emp.id, emp.name, newRecord.date, 'early', emp.earlyExitFineAmount);
    if (newRecord.bonusAmount > 0) syncToRewards(emp.id, emp.name, newRecord.date, 'bonus', newRecord.bonusAmount);

    setIsManualModalOpen(false);
    setManualEntry({ ...manualEntry, employeeId: '', checkIn: '', checkOut: '' });
  };

  const handleEditSave = () => {
    if (!editingRecord) return;
    const emp = employees.find(e => e.id === editingRecord.employeeId);
    if (!emp) return;

    // Recalculate based on modified times
    const autoCalcs = calculateFinancials(editingRecord.checkIn, editingRecord.checkOut, emp);

    const updatedRecord: AttendanceRecord = {
      ...editingRecord,
      ...autoCalcs,
      deductionAmount: editingRecord.deductionAmount // Prioritize manual adjustment in modal
    };

    setRecords(prev => {
      const filtered = prev.filter(r => r.id !== editingRecord.id && !(r.employeeId === editingRecord.employeeId && r.date === editingRecord.date));
      return [...filtered, updatedRecord];
    });

    // Sync to Rewards Section (Mention as Auto-Reward/Deduction)
    if (updatedRecord.status === 'متأخر') syncToRewards(emp.id, emp.name, updatedRecord.date, 'late', updatedRecord.deductionAmount);
    if (updatedRecord.status === 'خروج مبكر') syncToRewards(emp.id, emp.name, updatedRecord.date, 'early', updatedRecord.deductionAmount);
    if (updatedRecord.bonusAmount > 0) syncToRewards(emp.id, emp.name, updatedRecord.date, 'bonus', updatedRecord.bonusAmount);

    setIsEditModalOpen(false);
    setEditingRecord(null);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">إدارة الحضور والرواتب اليومية</h1>
          <p className="text-slate-500 text-sm font-bold">حساب آلي للاستحقاق، الإضافي، والغرامات بناءً على أجر الساعة</p>
        </div>
        <button onClick={() => setIsManualModalOpen(true)} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-900/20 transition-all">
          تسجيل حضور يدوي +
        </button>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
           <p className="text-[10px] font-black text-slate-400 uppercase">قوة العمل اليوم</p>
           <h3 className="text-xl font-black dark:text-white">{computedData.length} موظف</h3>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-800">
           <p className="text-[10px] font-black text-emerald-600 uppercase">حاضر / مباشر</p>
           <h3 className="text-xl font-black text-emerald-700 dark:text-emerald-400">{stats.present}</h3>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-2xl border border-blue-100 dark:border-blue-800">
           <p className="text-[10px] font-black text-blue-600 uppercase">صافي استحقاق اليوم</p>
           <h3 className="text-xl font-black text-blue-700 dark:text-blue-400">{stats.totalPay.toLocaleString()} {CURRENCY}</h3>
        </div>
        <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-2xl border border-red-100 dark:border-red-800">
           <p className="text-[10px] font-black text-red-600 uppercase">غياب</p>
           <h3 className="text-xl font-black text-red-700 dark:text-red-400">{stats.absent}</h3>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex flex-wrap items-center gap-6 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black text-slate-400 uppercase">تاريخ العرض</label>
            <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm font-bold dark:text-white" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black text-slate-400 uppercase">الفرع</label>
            <select value={branchFilter} onChange={e => setBranchFilter(e.target.value)} className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm font-bold dark:text-white min-w-[150px]">
              <option value="">جميع الفروع</option>
              {hierarchy.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div className="flex-1 flex flex-col gap-1 text-left">
             <label className="text-[10px] font-black text-slate-400 uppercase">أيام الأسبوع</label>
             <span className="text-blue-600 font-bold">{getDayName(dateFilter)}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">الموظف</th>
                <th className="px-6 py-4 text-center">وقت الحضور</th>
                <th className="px-6 py-4 text-center">وقت الانصراف</th>
                <th className="px-6 py-4 text-center">أجر الساعات</th>
                <th className="px-6 py-4 text-center text-emerald-600">إضافي</th>
                <th className="px-6 py-4 text-center text-red-600">إجمالي الخصم</th>
                <th className="px-6 py-4 text-center font-black">الصافي النهائي</th>
                <th className="px-6 py-4 text-center">تعديل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {computedData.map((rec) => {
                const dayTotal = (rec.shiftSalary || 0) + (rec.bonusAmount || 0) - (rec.deductionAmount || 0);
                return (
                  <tr key={rec.id} className={`group transition-colors ${rec.status === 'غياب' ? 'bg-red-50/10' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/40'}`}>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 dark:text-white">{rec.employeeName}</span>
                        <span className="text-[10px] text-slate-400 font-bold">{rec.employeeId}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center font-mono text-sm text-blue-600 dark:text-blue-400 font-black">{rec.checkIn || '--:--'}</td>
                    <td className="px-6 py-4 text-center font-mono text-sm text-slate-600 dark:text-slate-300 font-black">{rec.checkOut || '--:--'}</td>
                    <td className="px-6 py-4 text-center font-bold text-slate-700 dark:text-slate-300">
                      {rec.shiftSalary > 0 ? rec.shiftSalary.toLocaleString() : '--'}
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-emerald-600">
                      {rec.bonusAmount > 0 ? `+${rec.bonusAmount.toLocaleString()}` : '--'}
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-red-600">
                      {rec.deductionAmount > 0 ? `-${rec.deductionAmount.toLocaleString()}` : '--'}
                    </td>
                    <td className="px-6 py-4 text-center">
                       <div className="flex flex-col items-center">
                          <span className={`text-sm font-black ${dayTotal >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                            {dayTotal.toLocaleString()} {CURRENCY}
                          </span>
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full mt-1 ${
                            rec.status === 'حاضر' ? 'bg-emerald-100 text-emerald-700' :
                            rec.status === 'متأخر' ? 'bg-amber-100 text-amber-700' :
                            rec.status === 'غياب' ? 'bg-red-100 text-red-700' :
                            rec.status === 'خروج مبكر' ? 'bg-orange-100 text-orange-700' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {rec.status}
                          </span>
                       </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => {
                          const actualRec = records.find(r => r.employeeId === rec.employeeId && r.date === dateFilter);
                          setEditingRecord(actualRec || rec);
                          setIsEditModalOpen(true);
                        }}
                        className="text-slate-300 group-hover:text-blue-600 transition-colors p-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {computedData.length === 0 && (
            <div className="p-20 text-center text-slate-400 font-black italic">لا يوجد موظفون لمباشرتهم في هذا التاريخ</div>
          )}
        </div>
      </div>

      {/* Manual Entry Modal */}
      {isManualModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl animate-scale-up overflow-hidden">
             <header className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
                <h3 className="text-xl font-black dark:text-white">تسجيل حضور يدوي</h3>
                <button onClick={() => setIsManualModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
             </header>
             <div className="p-6 space-y-4 text-right">
                <div>
                  <label className="block text-xs font-black text-slate-400 mb-1">الموظف</label>
                  <select 
                    className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-bold dark:text-white"
                    value={manualEntry.employeeId}
                    onChange={e => setManualEntry({...manualEntry, employeeId: e.target.value})}
                  >
                    <option value="">اختر موظفاً...</option>
                    {employees.filter(e => e.hireDate <= manualEntry.date).map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name} ({emp.code})</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-400 mb-1">وقت الحضور</label>
                    <input type="time" className="w-full border-slate-200 rounded-xl p-3 font-mono text-blue-600 font-bold" value={manualEntry.checkIn} onChange={e => setManualEntry({...manualEntry, checkIn: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-400 mb-1">وقت الانصراف</label>
                    <input type="time" className="w-full border-slate-200 rounded-xl p-3 font-mono text-slate-600 font-bold" value={manualEntry.checkOut} onChange={e => setManualEntry({...manualEntry, checkOut: e.target.value})} />
                  </div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl border border-blue-100 dark:border-blue-800">
                   <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold leading-relaxed">سيتم حساب الأجر المستحق والغرامة آلياً بناءً على بيانات الموظف المحفوظة بمجرد الحفظ.</p>
                </div>
             </div>
             <footer className="p-6 border-t border-slate-100 dark:border-slate-800 flex gap-3">
                <button onClick={handleManualSave} className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-900/10">حفظ واعتماد السجل</button>
                <button onClick={() => setIsManualModalOpen(false)} className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl font-bold">إلغاء</button>
             </footer>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && editingRecord && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl animate-scale-up overflow-hidden">
            <header className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <h3 className="text-xl font-black dark:text-white text-right w-full">تعديل بيانات {editingRecord.employeeName}</h3>
            </header>
            <div className="p-6 space-y-4 text-right">
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-black text-slate-400 mb-1">وقت الحضور</label>
                    <input 
                      type="time" 
                      className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl p-3 font-mono text-blue-600 font-bold" 
                      value={editingRecord.checkIn} 
                      onChange={e => {
                        const newTime = e.target.value;
                        const emp = employees.find(emp => emp.id === editingRecord.employeeId);
                        if(emp) {
                          const calcs = calculateFinancials(newTime, editingRecord.checkOut, emp);
                          setEditingRecord({...editingRecord, checkIn: newTime, ...calcs});
                        }
                      }} 
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-black text-slate-400 mb-1">وقت الانصراف</label>
                    <input 
                      type="time" 
                      className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl p-3 font-mono text-slate-600 font-bold" 
                      value={editingRecord.checkOut} 
                      onChange={e => {
                        const newTime = e.target.value;
                        const emp = employees.find(emp => emp.id === editingRecord.employeeId);
                        if(emp) {
                          const calcs = calculateFinancials(editingRecord.checkIn, newTime, emp);
                          setEditingRecord({...editingRecord, checkOut: newTime, ...calcs});
                        }
                      }} 
                    />
                 </div>
              </div>

              {/* Automatic Deduction Info */}
              <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-xl border border-red-100 dark:border-red-800">
                <label className="block text-xs font-black text-red-600 mb-1 uppercase tracking-widest">إجمالي الخصومات (تلقائي)</label>
                <div className="flex gap-2">
                  <input 
                    type="number" 
                    className="flex-1 bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900 rounded-lg p-2 font-black text-red-600 outline-none" 
                    value={editingRecord.deductionAmount} 
                    onChange={e => setEditingRecord({...editingRecord, deductionAmount: parseInt(e.target.value) || 0})} 
                  />
                  <button 
                    onClick={() => setEditingRecord({...editingRecord, deductionAmount: 0})}
                    className="bg-red-600 text-white px-3 rounded-lg text-xs font-bold hover:bg-red-700 transition-colors"
                  >
                    حذف الخصم
                  </button>
                </div>
                <p className="text-[10px] text-red-400 mt-2 font-bold italic">ملاحظة: سيتم تسجيل أي خصم هنا تلقائياً في قسم المكافآت والخصومات للموظف.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100">
                   <p className="text-[10px] text-slate-400 uppercase font-black">أجر الساعات</p>
                   <p className="text-sm font-black text-blue-600">{editingRecord.shiftSalary?.toLocaleString()} {CURRENCY}</p>
                 </div>
                 <div className="p-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100">
                   <p className="text-[10px] text-slate-400 uppercase font-black">الإضافي</p>
                   <p className="text-sm font-black text-emerald-600">{editingRecord.bonusAmount?.toLocaleString()} {CURRENCY}</p>
                 </div>
              </div>
            </div>
            <footer className="p-6 border-t border-slate-100 dark:border-slate-800 flex gap-3">
              <button onClick={handleEditSave} className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-black hover:bg-blue-700 shadow-lg shadow-blue-900/10 transition-all">حفظ واعتماد التعديل</button>
              <button onClick={() => setIsEditModalOpen(false)} className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl font-bold">إلغاء</button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;
