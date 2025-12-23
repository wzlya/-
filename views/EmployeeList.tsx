
import React, { useState, useMemo } from 'react';
import { Employee, EmployeeStatus, CompanyBranch, UserRole } from '../types';
import { CURRENCY } from '../constants';
import EmployeeForm from './EmployeeForm';

interface EmployeeListProps {
  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  hierarchy: CompanyBranch[];
  setHierarchy: React.Dispatch<React.SetStateAction<CompanyBranch[]>>;
  currentUser: Employee; 
  contractTemplate: string;
}

const EmployeeList: React.FC<EmployeeListProps> = ({ 
  employees, 
  setEmployees, 
  hierarchy, 
  setHierarchy, 
  currentUser,
  contractTemplate
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | undefined>(undefined);

  // Filters state
  const [branchFilter, setBranchFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [posFilter, setPosFilter] = useState('');

  const filteredEmployees = useMemo(() => {
    return employees.filter(e => {
      const matchSearch = e.name.includes(searchTerm) || e.code.includes(searchTerm);
      const matchBranch = !branchFilter || e.branchId === branchFilter;
      const matchDept = !deptFilter || e.departmentId === deptFilter;
      const matchPos = !posFilter || e.position === posFilter;
      return matchSearch && matchBranch && matchDept && matchPos;
    });
  }, [employees, searchTerm, branchFilter, deptFilter, posFilter]);

  const handleEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setIsFormOpen(true);
  };

  const handleAdd = () => {
    setEditingEmployee(undefined);
    setIsFormOpen(true);
  };

  const handleSave = (newEmployee: Employee) => {
    if (editingEmployee) {
      setEmployees(prev => prev.map(e => e.id === newEmployee.id ? newEmployee : e));
    } else {
      setEmployees(prev => [...prev, newEmployee]);
    }
  };

  const getBranchName = (id?: string) => hierarchy.find(b => b.id === id)?.name || id || 'غير محدد';
  const getDeptName = (branchId?: string, deptId?: string) => {
    const branch = hierarchy.find(b => b.id === branchId);
    return branch?.departments.find(d => d.id === deptId)?.name || deptId || 'غير محدد';
  };

  const canSeeBranchFilter = currentUser.role === UserRole.SUPER_ADMIN;
  const canSeeDeptFilter = currentUser.role === UserRole.SUPER_ADMIN || currentUser.role === UserRole.BRANCH_MANAGER;
  
  const selectedBranch = hierarchy.find(b => b.id === (canSeeBranchFilter ? branchFilter : currentUser.branchId));
  const availableDepts = selectedBranch ? selectedBranch.departments : [];
  const selectedDept = availableDepts.find(d => d.id === (canSeeDeptFilter ? deptFilter : currentUser.departmentId));
  const availablePositions = selectedDept ? selectedDept.positions : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">إدارة الموظفين</h1>
          <p className="text-slate-500 dark:text-slate-400">عرض وإدارة الموظفين التابعين لصلاحيتك</p>
        </div>
        <div className="flex space-x-3 space-x-reverse">
          <button className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 dark:text-slate-300 font-medium shadow-sm">تصدير Excel</button>
          <button onClick={handleAdd} className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 font-bold shadow-md">إضافة موظف جديد</button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 space-y-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[250px]">
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">البحث السريع</label>
            <input 
              type="text" 
              placeholder="الاسم أو الكود..." 
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 dark:text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {canSeeBranchFilter && (
            <div className="w-48">
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">الفرع</label>
              <select value={branchFilter} onChange={e => {setBranchFilter(e.target.value); setDeptFilter(''); setPosFilter('');}} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 dark:text-white">
                <option value="">كل الفروع</option>
                {hierarchy.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          )}

          {canSeeDeptFilter && (
            <div className="w-48">
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">القسم</label>
              <select value={deptFilter} onChange={e => {setDeptFilter(e.target.value); setPosFilter('');}} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 dark:text-white">
                <option value="">كل الأقسام</option>
                {availableDepts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          )}

          <div className="w-48">
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">المسمى الوظيفي</label>
            <select value={posFilter} onChange={e => setPosFilter(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 dark:text-white">
              <option value="">كل الوظائف</option>
              {availablePositions.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden overflow-x-auto">
        <table className="w-full text-right min-w-[1000px]">
          <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4 font-semibold">الموظف</th>
              <th className="px-6 py-4 font-semibold">الفرع والقسم</th>
              <th className="px-6 py-4 font-semibold">وقت الدوام</th>
              <th className="px-6 py-4 font-semibold">الراتب الأساسي</th>
              <th className="px-6 py-4 font-semibold">الحالة</th>
              <th className="px-6 py-4 text-center">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredEmployees.map((emp) => (
              <tr key={emp.id} className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <img src={emp.avatar || `https://ui-avatars.com/api/?name=${emp.name}&background=random`} className="w-10 h-10 rounded-full border border-slate-200 shadow-sm" />
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{emp.name}</p>
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold">{emp.code}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-300">{emp.position || 'غير محدد'}</p>
                  <p className="text-xs text-slate-500">{getBranchName(emp.branchId)} | {getDeptName(emp.branchId, emp.departmentId)}</p>
                </td>
                <td className="px-6 py-4">
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded mr-1">دخول: {emp.checkInTime || '--:--'}</span>
                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 px-2 py-0.5 rounded">خروج: {emp.checkOutTime || '--:--'}</span>
                  </div>
                </td>
                <td className="px-6 py-4 font-bold text-sm text-slate-900 dark:text-white whitespace-nowrap">
                  {emp.salary ? emp.salary.toLocaleString() : '0'} {CURRENCY}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-[10px] font-bold rounded-full ${
                    emp.status === EmployeeStatus.ACTIVE ? 'bg-emerald-100 text-emerald-700' : 
                    emp.status === EmployeeStatus.INACTIVE ? 'bg-slate-100 text-slate-600' :
                    emp.status === EmployeeStatus.ON_LEAVE ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {emp.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center space-x-2 space-x-reverse">
                    <button onClick={() => handleEdit(emp)} className="text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/40 p-2 rounded-lg transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                    </button>
                    {currentUser.role === UserRole.SUPER_ADMIN && (
                      <button 
                        onClick={() => setEmployees(prev => prev.filter(e => e.id !== emp.id))}
                        className="text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 p-2 rounded-lg transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isFormOpen && (
        <EmployeeForm 
          employee={editingEmployee} 
          onClose={() => setIsFormOpen(false)} 
          onSave={handleSave}
          hierarchy={hierarchy}
          setHierarchy={setHierarchy}
          currentUser={currentUser}
          contractTemplate={contractTemplate}
        />
      )}
    </div>
  );
};

export default EmployeeList;
