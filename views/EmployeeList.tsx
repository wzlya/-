
import React, { useState } from 'react';
import { Employee, EmployeeStatus, CompanyBranch } from '../types';
import { CURRENCY } from '../constants';
import EmployeeForm from './EmployeeForm';

interface EmployeeListProps {
  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  hierarchy: CompanyBranch[];
}

const EmployeeList: React.FC<EmployeeListProps> = ({ employees, setEmployees, hierarchy }) => {
  const [filter, setFilter] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | undefined>(undefined);

  const filteredEmployees = employees.filter(e => 
    e.name.includes(filter) || (e.departmentId && e.departmentId.includes(filter)) || e.code.includes(filter)
  );

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">إدارة الموظفين</h1>
          <p className="text-slate-500">عرض وإدارة جميع الموظفين وإعدادات الدوام الخاصة بهم</p>
        </div>
        <div className="flex space-x-3 space-x-reverse">
          <button className="bg-white border border-slate-200 px-4 py-2 rounded-lg hover:bg-slate-50 font-medium text-slate-700 shadow-sm">تصدير Excel</button>
          <button onClick={handleAdd} className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 font-bold shadow-md">إضافة موظف جديد</button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-wrap gap-4">
        <div className="flex-1 min-w-[300px]">
          <input 
            type="text" 
            placeholder="بحث بالاسم أو القسم أو الكود..." 
            className="w-full border-slate-200 rounded-lg focus:ring-blue-500"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <select className="border-slate-200 rounded-lg min-w-[150px]">
          <option>كل الحالات</option>
          <option>نشط</option>
          <option>غير نشط</option>
          <option>في إجازة</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden overflow-x-auto">
        <table className="w-full text-right min-w-[1000px]">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4 font-semibold">الموظف</th>
              <th className="px-6 py-4 font-semibold">الفرع والقسم</th>
              <th className="px-6 py-4 font-semibold">وقت الدوام</th>
              <th className="px-6 py-4 font-semibold">الراتب الأساسي</th>
              <th className="px-6 py-4 font-semibold">الحالة</th>
              <th className="px-6 py-4 font-semibold text-center">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredEmployees.map((emp) => (
              <tr key={emp.id} className="hover:bg-blue-50/30 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <img src={emp.avatar || `https://ui-avatars.com/api/?name=${emp.name}&background=random`} className="w-10 h-10 rounded-full border border-slate-200 shadow-sm" />
                    <div>
                      <p className="font-bold text-slate-900">{emp.name}</p>
                      <p className="text-xs text-blue-600 font-semibold">{emp.code}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm font-semibold text-slate-800">{emp.position || 'غير محدد'}</p>
                  <p className="text-xs text-slate-500">{getBranchName(emp.branchId)} | {getDeptName(emp.branchId, emp.departmentId)}</p>
                </td>
                <td className="px-6 py-4">
                  <div className="text-xs text-slate-600">
                    <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded mr-1">دخول: {emp.checkInTime || '--:--'}</span>
                    <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded">خروج: {emp.checkOutTime || '--:--'}</span>
                  </div>
                </td>
                <td className="px-6 py-4 font-bold text-sm text-slate-900 whitespace-nowrap">
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
                    <button onClick={() => handleEdit(emp)} className="text-blue-600 hover:bg-blue-100 p-2 rounded-lg transition-colors" title='تعديل البيانات'>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                    </button>
                    <button 
                      onClick={() => setEmployees(prev => prev.filter(e => e.id !== emp.id))}
                      className="text-red-500 hover:bg-red-100 p-2 rounded-lg transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
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
        />
      )}
    </div>
  );
};

export default EmployeeList;
