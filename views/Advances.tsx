
import React, { useState, useMemo } from 'react';
import { CURRENCY } from '../constants';
import { Employee, AdvanceRecord, UserRole } from '../types';

interface AdvancesProps {
  employees: Employee[];
  advances: AdvanceRecord[];
  setAdvances: React.Dispatch<React.SetStateAction<AdvanceRecord[]>>;
  currentUser: Employee;
}

const Advances: React.FC<AdvancesProps> = ({ employees, advances, setAdvances, currentUser }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAdvance, setNewAdvance] = useState({
    employeeId: '',
    totalAmount: 0,
    monthlyInstallment: 0,
    startDate: new Date().toISOString().split('T')[0]
  });

  const filteredAdvances = useMemo(() => {
    return advances.filter(a => {
        const emp = employees.find(e => e.id === a.employeeId);
        if (!emp) return false;
        if (currentUser.role === UserRole.SUPER_ADMIN) return true;
        if (currentUser.role === UserRole.BRANCH_MANAGER) return emp.branchId === currentUser.branchId;
        if (currentUser.role === UserRole.DEPT_SUPERVISOR) return emp.departmentId === currentUser.departmentId;
        return emp.id === currentUser.id;
    });
  }, [advances, employees, currentUser]);

  const stats = useMemo(() => {
    const active = filteredAdvances.filter(a => a.status === 'نشط');
    const totalGiven = active.reduce((s, a) => s + a.totalAmount, 0);
    const totalRemaining = active.reduce((s, a) => s + a.remainingAmount, 0);
    return { totalGiven, totalRemaining, totalPaid: totalGiven - totalRemaining };
  }, [filteredAdvances]);

  const handleSave = () => {
    const emp = employees.find(e => e.id === newAdvance.employeeId);
    if (!emp) return;

    const record: AdvanceRecord = {
      id: 'adv-' + Date.now(),
      employeeId: emp.id,
      employeeName: emp.name,
      totalAmount: newAdvance.totalAmount,
      monthlyInstallment: newAdvance.monthlyInstallment,
      remainingAmount: newAdvance.totalAmount,
      startDate: newAdvance.startDate,
      status: 'نشط'
    };

    setAdvances(prev => [...prev, record]);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold dark:text-white">السلف والقروض المزامنة</h1>
          <p className="text-gray-500">إدارة الالتزامات المالية للموظفين الفعليين</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-bold">
          طلب سلفة جديد +
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800">
          <p className="text-gray-500 text-sm uppercase font-bold">إجمالي المبالغ الممنوحة</p>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats.totalGiven.toLocaleString()} {CURRENCY}</h3>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border-gray-100 dark:border-slate-800">
          <p className="text-emerald-600 text-sm uppercase font-bold">المبالغ المستردة</p>
          <h3 className="text-2xl font-bold text-emerald-600 mt-1">{stats.totalPaid.toLocaleString()} {CURRENCY}</h3>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border-gray-100 dark:border-slate-800">
          <p className="text-red-600 text-sm uppercase font-bold">الرصيد المتبقي</p>
          <h3 className="text-2xl font-bold text-red-600 mt-1">{stats.totalRemaining.toLocaleString()} {CURRENCY}</h3>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-gray-50 dark:bg-slate-800 text-gray-500 text-sm">
            <tr>
              <th className="px-6 py-4 font-bold">الموظف</th>
              <th className="px-6 py-4 font-bold text-center">مبلغ السلفة</th>
              <th className="px-6 py-4 font-bold text-center">القسط</th>
              <th className="px-6 py-4 font-bold text-center">المتبقي</th>
              <th className="px-6 py-4 font-bold">تاريخ البدء</th>
              <th className="px-6 py-4">الحالة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-800 text-sm">
            {filteredAdvances.map((loan) => (
              <tr key={loan.id} className="hover:bg-gray-50 dark:hover:bg-slate-800">
                <td className="px-6 py-4 font-bold dark:text-white">{loan.employeeName}</td>
                <td className="px-6 py-4 text-center">{loan.totalAmount.toLocaleString()}</td>
                <td className="px-6 py-4 text-center font-bold text-blue-600">{loan.monthlyInstallment.toLocaleString()}</td>
                <td className="px-6 py-4 text-center font-black text-red-600">{loan.remainingAmount.toLocaleString()}</td>
                <td className="px-6 py-4 font-mono">{loan.startDate}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${loan.status === 'نشط' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{loan.status}</span>
                </td>
              </tr>
            ))}
            {filteredAdvances.length === 0 && (
                <tr>
                    <td colSpan={6} className="p-20 text-center text-slate-400 font-bold italic">لا توجد سلف نشطة للفريق المحدد</td>
                </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md p-6 space-y-4 animate-scale-up">
                <h3 className="text-xl font-bold dark:text-white">تسجيل سلفة مالية جديدة</h3>
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">الموظف</label>
                    <select className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 rounded-lg p-2.5 dark:text-white" value={newAdvance.employeeId} onChange={e => setNewAdvance({...newAdvance, employeeId: e.target.value})}>
                        <option value="">اختر موظفاً...</option>
                        {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                    </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">المبلغ الكلي</label>
                        <input type="number" className="w-full border-slate-200 rounded-lg p-2.5 font-bold text-blue-600" value={newAdvance.totalAmount} onChange={e => setNewAdvance({...newAdvance, totalAmount: parseInt(e.target.value)})} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">القسط الشهري</label>
                        <input type="number" className="w-full border-slate-200 rounded-lg p-2.5 font-bold text-emerald-600" value={newAdvance.monthlyInstallment} onChange={e => setNewAdvance({...newAdvance, monthlyInstallment: parseInt(e.target.value)})} />
                    </div>
                </div>
                <footer className="flex gap-2 pt-4">
                    <button onClick={handleSave} className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl font-bold">حفظ الطلب</button>
                    <button onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold">إلغاء</button>
                </footer>
            </div>
        </div>
      )}
    </div>
  );
};

export default Advances;
