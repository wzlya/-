
import React, { useState, useMemo } from 'react';
import { CURRENCY } from '../constants';
import { Employee, RewardRecord, UserRole, CompanyBranch } from '../types';

interface RewardsProps {
  employees: Employee[];
  rewards: RewardRecord[];
  setRewards: React.Dispatch<React.SetStateAction<RewardRecord[]>>;
  currentUser: Employee;
  hierarchy: CompanyBranch[];
}

const Rewards: React.FC<RewardsProps> = ({ employees, rewards, setRewards, currentUser, hierarchy }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Filters
  const [branchFilter, setBranchFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<'الكل' | 'مكافأة' | 'خصم'>('الكل');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [form, setForm] = useState<Partial<RewardRecord>>({
    employeeId: '',
    type: 'مكافأة',
    amount: 0,
    reason: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Authorization Check
  const canSeeBranchFilter = currentUser.role === UserRole.SUPER_ADMIN;
  const canSeeDeptFilter = currentUser.role === UserRole.SUPER_ADMIN || currentUser.role === UserRole.BRANCH_MANAGER;

  const filteredRewards = useMemo(() => {
    return rewards.filter(r => {
        const emp = employees.find(e => e.id === r.employeeId);
        if (!emp) return false;

        // Hierarchical Visibility
        let isVisible = false;
        if (currentUser.role === UserRole.SUPER_ADMIN) isVisible = true;
        else if (currentUser.role === UserRole.BRANCH_MANAGER) isVisible = emp.branchId === currentUser.branchId;
        else if (currentUser.role === UserRole.DEPT_SUPERVISOR) isVisible = emp.departmentId === currentUser.departmentId;
        else isVisible = emp.id === currentUser.id;

        if (!isVisible) return false;

        // Apply Filters
        const matchSearch = emp.name.includes(searchTerm) || r.reason.includes(searchTerm);
        const matchBranch = !branchFilter || emp.branchId === branchFilter;
        const matchDept = !deptFilter || emp.departmentId === deptFilter;
        const matchType = typeFilter === 'الكل' || r.type === typeFilter;
        const matchStart = !startDate || r.date >= startDate;
        const matchEnd = !endDate || r.date <= endDate;

        return matchSearch && matchBranch && matchDept && matchType && matchStart && matchEnd;
    });
  }, [rewards, employees, currentUser, branchFilter, deptFilter, typeFilter, startDate, endDate, searchTerm]);

  const handleSave = () => {
    if (!form.employeeId || !form.amount || !form.reason) {
        alert("يرجى ملء كافة الحقول الإجبارية");
        return;
    }

    const emp = employees.find(e => e.id === form.employeeId);
    if (!emp) return;

    const newRecord: RewardRecord = {
        id: 'rew-' + Date.now(),
        employeeId: emp.id,
        employeeName: emp.name,
        type: form.type as any,
        amount: form.amount as number,
        reason: form.reason as string,
        date: form.date as string,
        status: 'معتمد',
        createdBy: currentUser.name
    };

    setRewards(prev => [...prev, newRecord]);
    setIsModalOpen(false);
    setForm({ employeeId: '', type: 'مكافأة', amount: 0, reason: '', date: new Date().toISOString().split('T')[0] });
  };

  const cancelReward = (id: string) => {
    if (confirm('هل أنت متأكد من إلغاء هذا الإجراء المالي؟')) {
        setRewards(prev => prev.map(r => r.id === id ? { ...r, status: 'ملغي' } : r));
    }
  };

  const selectedBranch = hierarchy.find(b => b.id === (canSeeBranchFilter ? branchFilter : currentUser.branchId));
  const availableDepts = selectedBranch ? selectedBranch.departments : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">المكافآت والخصومات الإدارية</h1>
          <p className="text-slate-500 font-bold text-sm">فلترة متقدمة حسب الصلاحيات والنوع والتاريخ</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="w-full md:w-auto bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black shadow-lg shadow-emerald-900/10 hover:bg-emerald-700 transition-all active:scale-95">
          إجراء مالي جديد +
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
        {/* Advanced Filter Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="lg:col-span-2">
            <label className="block text-[10px] font-black text-slate-400 mb-1 uppercase">البحث بالاسم أو السبب</label>
            <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm dark:text-white" placeholder="بحث..." />
          </div>

          {canSeeBranchFilter && (
            <div>
              <label className="block text-[10px] font-black text-slate-400 mb-1 uppercase">الفرع</label>
              <select value={branchFilter} onChange={e => {setBranchFilter(e.target.value); setDeptFilter('');}} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm dark:text-white">
                <option value="">كل الفروع</option>
                {hierarchy.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          )}

          {canSeeDeptFilter && (
            <div>
              <label className="block text-[10px] font-black text-slate-400 mb-1 uppercase">القسم</label>
              <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm dark:text-white">
                <option value="">كل الأقسام</option>
                {availableDepts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-black text-slate-400 mb-1 uppercase">نوع الإجراء</label>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as any)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm dark:text-white">
              <option value="الكل">الكل</option>
              <option value="مكافأة">مكافآت فقط</option>
              <option value="خصم">خصومات فقط</option>
            </select>
          </div>

          <div className="lg:col-span-1">
            <label className="block text-[10px] font-black text-slate-400 mb-1 uppercase">من تاريخ</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm dark:text-white" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right border-t border-slate-50 dark:border-slate-800">
            <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">الموظف</th>
                <th className="px-6 py-4">النوع</th>
                <th className="px-6 py-4 text-center">المبلغ</th>
                <th className="px-6 py-4">السبب / البيان</th>
                <th className="px-6 py-4 text-center">التاريخ</th>
                <th className="px-6 py-4">الحالة</th>
                <th className="px-6 py-4 text-center">الإجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {filteredRewards.map((rew) => (
                <tr key={rew.id} className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors ${rew.status === 'ملغي' ? 'opacity-40 grayscale' : ''}`}>
                  <td className="px-6 py-4">
                     <p className="font-bold dark:text-white">{rew.employeeName}</p>
                     <p className="text-[10px] text-slate-400 font-bold">بواسطة: {rew.createdBy}</p>
                  </td>
                  <td className="px-6 py-4">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded ${rew.type === 'مكافأة' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          {rew.type}
                      </span>
                  </td>
                  <td className={`px-6 py-4 text-center font-black ${rew.type === 'مكافأة' ? 'text-emerald-600' : 'text-red-600'}`}>
                      {rew.amount.toLocaleString()} {CURRENCY}
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-400 max-w-[250px] leading-relaxed">{rew.reason}</td>
                  <td className="px-6 py-4 font-mono text-xs text-center dark:text-slate-500">{rew.date}</td>
                  <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold ${rew.status === 'معتمد' ? 'text-emerald-500' : 'text-slate-400 line-through'}`}>{rew.status}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                      {rew.status === 'معتمد' && currentUser.role === UserRole.SUPER_ADMIN && (
                          <button onClick={() => cancelReward(rew.id)} className="text-red-400 hover:text-red-600 transition-all hover:bg-red-50 p-2 rounded-lg">
                               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                          </button>
                      )}
                  </td>
                </tr>
              ))}
              {filteredRewards.length === 0 && (
                  <tr>
                      <td colSpan={7} className="p-20 text-center text-slate-400 font-black italic">لا توجد سجلات مكافآت أو خصومات مطابقة لهذه الفلاتر</td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
             <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl animate-scale-up overflow-hidden">
                <header className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
                   <h3 className="text-xl font-black dark:text-white">إجراء مالي يدوي</h3>
                   <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                     <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                   </button>
                </header>
                <div className="p-6 space-y-4 text-right">
                   <div>
                        <label className="block text-xs font-black text-slate-400 uppercase mb-1">الموظف المعني</label>
                        <select className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-bold dark:text-white" value={form.employeeId} onChange={e => setForm({...form, employeeId: e.target.value})}>
                            <option value="">اختر موظفاً...</option>
                            {employees.filter(e => {
                                if (currentUser.role === UserRole.SUPER_ADMIN) return true;
                                if (currentUser.role === UserRole.BRANCH_MANAGER) return e.branchId === currentUser.branchId;
                                if (currentUser.role === UserRole.DEPT_SUPERVISOR) return e.departmentId === currentUser.departmentId;
                                return false;
                            }).map(e => <option key={e.id} value={e.id}>{e.name} ({e.code})</option>)}
                        </select>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase mb-1">النوع</label>
                            <select className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-bold dark:text-white" value={form.type} onChange={e => setForm({...form, type: e.target.value as any})}>
                                <option value="مكافأة">مكافأة (+)</option>
                                <option value="خصم">خصم (-)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase mb-1">المبلغ ({CURRENCY})</label>
                            <input type="number" className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl p-3 font-black text-blue-600" value={form.amount} onChange={e => setForm({...form, amount: parseInt(e.target.value)})} />
                        </div>
                   </div>
                   <div>
                        <label className="block text-xs font-black text-slate-400 uppercase mb-1">التاريخ</label>
                        <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm dark:text-white" />
                   </div>
                   <div>
                        <label className="block text-xs font-black text-slate-400 uppercase mb-1">السبب / الملاحظات</label>
                        <textarea rows={3} className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm dark:text-white" placeholder="اكتب سبب المكافأة أو الخصم بالتفصيل..." value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} />
                   </div>
                </div>
                <footer className="p-6 border-t border-slate-100 dark:border-slate-800 flex gap-3">
                   <button onClick={handleSave} className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-black shadow-lg shadow-emerald-900/10 hover:bg-emerald-700 transition-all active:scale-95">اعتماد الإجراء</button>
                   <button onClick={() => setIsModalOpen(false)} className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl font-bold">إلغاء</button>
                </footer>
             </div>
        </div>
      )}
    </div>
  );
};

export default Rewards;
