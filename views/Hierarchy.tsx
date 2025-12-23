
import React, { useState } from 'react';
import { CompanyBranch, CompanyDepartment, Employee, UserRole } from '../types';

interface HierarchyProps {
  hierarchy: CompanyBranch[];
  setHierarchy: React.Dispatch<React.SetStateAction<CompanyBranch[]>>;
  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>; // Added setEmployees
  currentUser: Employee;
}

const Hierarchy: React.FC<HierarchyProps> = ({ hierarchy, setHierarchy, employees, setEmployees, currentUser }) => {
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [editingBranchId, setEditingBranchId] = useState<string | null>(null);
  const [editingDeptId, setEditingDeptId] = useState<string | null>(null);

  // Modal Form State
  const [branchForm, setBranchForm] = useState({ name: '', location: '', managerId: '' });
  const [deptForm, setDeptForm] = useState({ name: '', supervisorId: '' });

  const [newPositionName, setNewPositionName] = useState('');
  const [positionEditingDeptId, setPositionEditingDeptId] = useState<string | null>(null);

  const handleAddBranch = () => {
    setBranchForm({ name: '', location: '', managerId: '' });
    setEditingBranchId(null);
    setIsBranchModalOpen(true);
  };

  const handleEditBranch = (branch: CompanyBranch) => {
    setBranchForm({ name: branch.name, location: branch.location, managerId: branch.managerId });
    setEditingBranchId(branch.id);
    setIsBranchModalOpen(true);
  };

  const handleSaveBranch = () => {
    if (!branchForm.name) return;
    const manager = employees.find(e => e.id === branchForm.managerId);
    const branchId = editingBranchId || 'b' + Date.now();
    
    // Sync: Update Employee Role
    if (branchForm.managerId) {
      setEmployees(prev => prev.map(emp => {
        if (emp.id === branchForm.managerId) {
          return { ...emp, role: UserRole.BRANCH_MANAGER, branchId: branchId };
        }
        return emp;
      }));
    }

    if (editingBranchId) {
      setHierarchy(prev => prev.map(b => b.id === editingBranchId ? {
        ...b,
        name: branchForm.name,
        location: branchForm.location,
        managerId: branchForm.managerId,
        managerName: manager?.name || 'غير محدد'
      } : b));
    } else {
      const newBranch: CompanyBranch = {
        id: branchId,
        name: branchForm.name,
        location: branchForm.location,
        managerId: branchForm.managerId,
        managerName: manager?.name || 'غير محدد',
        departments: []
      };
      setHierarchy(prev => [...prev, newBranch]);
    }
    setIsBranchModalOpen(false);
  };

  const handleAddDept = (branchId: string) => {
    setSelectedBranchId(branchId);
    setEditingDeptId(null);
    setDeptForm({ name: '', supervisorId: '' });
    setIsDeptModalOpen(true);
  };

  const handleEditDept = (branchId: string, dept: CompanyDepartment) => {
    setSelectedBranchId(branchId);
    setEditingDeptId(dept.id);
    setDeptForm({ name: dept.name, supervisorId: dept.supervisorId });
    setIsDeptModalOpen(true);
  };

  const handleSaveDept = () => {
    if (!deptForm.name || !selectedBranchId) return;
    const supervisor = employees.find(e => e.id === deptForm.supervisorId);
    const deptId = editingDeptId || 'd' + Date.now();

    // Sync: Update Employee Role
    if (deptForm.supervisorId) {
      setEmployees(prev => prev.map(emp => {
        if (emp.id === deptForm.supervisorId) {
          return { 
            ...emp, 
            role: UserRole.DEPT_SUPERVISOR, 
            branchId: selectedBranchId, 
            departmentId: deptId 
          };
        }
        return emp;
      }));
    }
    
    if (editingDeptId) {
      setHierarchy(prev => prev.map(b => b.id === selectedBranchId ? {
        ...b,
        departments: b.departments.map(d => d.id === editingDeptId ? {
          ...d,
          name: deptForm.name,
          supervisorId: deptForm.supervisorId,
          supervisorName: supervisor?.name || 'غير محدد'
        } : d)
      } : b));
    } else {
      const newDept: CompanyDepartment = {
        id: deptId,
        name: deptForm.name,
        supervisorId: deptForm.supervisorId,
        supervisorName: supervisor?.name || 'غير محدد',
        employeeCount: 0,
        positions: []
      };
      setHierarchy(prev => prev.map(b => b.id === selectedBranchId ? {
        ...b,
        departments: [...b.departments, newDept]
      } : b));
    }
    setIsDeptModalOpen(false);
  };

  const handleDeleteBranch = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا الفرع وكافة أقسامه؟')) {
      setHierarchy(prev => prev.filter(b => b.id !== id));
    }
  };

  const handleDeleteDept = (branchId: string, deptId: string) => {
    if (confirm('هل أنت متأكد من حذف هذا القسم؟')) {
      setHierarchy(prev => prev.map(b => b.id === branchId ? {
        ...b,
        departments: b.departments.filter(d => d.id !== deptId)
      } : b));
    }
  };

  const handleAddPosition = (branchId: string, deptId: string) => {
    if (!newPositionName.trim()) return;
    setHierarchy(prev => prev.map(b => b.id === branchId ? {
      ...b,
      departments: b.departments.map(d => d.id === deptId ? {
        ...d,
        positions: [...d.positions, newPositionName]
      } : d)
    } : b));
    setNewPositionName('');
    setPositionEditingDeptId(null);
  };

  const handleDeletePosition = (branchId: string, deptId: string, posName: string) => {
    setHierarchy(prev => prev.map(b => b.id === branchId ? {
      ...b,
      departments: b.departments.map(d => d.id === deptId ? {
        ...d,
        positions: d.positions.filter(p => p !== posName)
      } : d)
    } : b));
  };

  const isSuper = currentUser.role === UserRole.SUPER_ADMIN;
  const canManageBranch = isSuper;
  const canManageDept = isSuper || currentUser.role === UserRole.BRANCH_MANAGER;

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">الهيكل التنظيمي</h1>
          <p className="text-slate-500 dark:text-slate-400">إدارة فروع الشركة وأقسامها وتحديد المسؤوليات الإدارية</p>
        </div>
        {canManageBranch && (
          <button 
            onClick={handleAddBranch}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-bold shadow-lg shadow-blue-200 transition-all"
          >
            إضافة فرع جديد +
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-8">
        {hierarchy.map((branch) => (
          <div key={branch.id} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
            <div className="p-6 bg-slate-900 dark:bg-slate-950 text-white flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black">{branch.name}</h2>
                <div className="flex items-center space-x-4 space-x-reverse mt-1 text-slate-400 text-sm">
                  <span className="flex items-center">
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                    {branch.location}
                  </span>
                  <span className="flex items-center">
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                    المدير: {branch.managerName}
                  </span>
                </div>
              </div>
              <div className="flex space-x-2 space-x-reverse">
                {canManageDept && (
                  <button 
                    onClick={() => handleAddDept(branch.id)}
                    className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm font-bold border border-white/20 transition-colors"
                  >
                    إضافة قسم
                  </button>
                )}
                {canManageBranch && (
                  <>
                    <button 
                      onClick={() => handleEditBranch(branch)}
                      className="bg-white/10 hover:bg-white/20 text-blue-300 p-2 rounded-lg transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                    </button>
                    <button 
                      onClick={() => handleDeleteBranch(branch.id)} 
                      className="bg-red-500/10 hover:bg-red-500/30 text-red-300 p-2 rounded-lg transition-colors"
                    >
                       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {branch.departments.map((dept) => (
                  <div key={dept.id} className="group border border-slate-100 dark:border-slate-800 rounded-xl p-5 hover:border-blue-200 dark:hover:border-blue-900 hover:shadow-md transition-all relative flex flex-col h-full bg-slate-50 dark:bg-slate-800/20">
                    <div className="absolute top-4 left-4 flex space-x-1 space-x-reverse opacity-0 group-hover:opacity-100 transition-opacity">
                       {canManageDept && (
                         <>
                           <button 
                             onClick={() => handleEditDept(branch.id, dept)}
                             className="p-1 text-slate-400 hover:text-blue-600"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                            </button>
                           <button 
                             onClick={() => handleDeleteDept(branch.id, dept.id)} 
                             className="p-1 text-slate-400 hover:text-red-500"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                            </button>
                         </>
                       )}
                    </div>
                    
                    <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
                    </div>
                    
                    <h3 className="font-bold text-slate-900 dark:text-white mb-1">{dept.name}</h3>
                    <div className="text-sm text-slate-500 space-y-2 mb-4">
                       <div className="flex items-center">
                          <span className="w-20 font-medium dark:text-slate-400">المسؤول:</span>
                          <span className="text-blue-600 dark:text-blue-400 font-bold">{dept.supervisorName}</span>
                       </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-lg p-3 flex-grow border border-slate-100 dark:border-slate-800">
                      <p className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">العناوين الوظيفية</p>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {dept.positions.map((pos) => (
                          <span key={pos} className="inline-flex items-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-2 py-1 rounded text-[10px] font-bold">
                            {pos}
                            {canManageDept && (
                              <button onClick={() => handleDeletePosition(branch.id, dept.id, pos)} className="mr-1 text-slate-300 hover:text-red-500">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                              </button>
                            )}
                          </span>
                        ))}
                      </div>
                      {canManageDept && (
                        positionEditingDeptId === dept.id ? (
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              className="flex-1 text-xs border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded p-1 outline-none focus:ring-1 focus:ring-blue-500" 
                              placeholder="اسم الوظيفة..."
                              value={newPositionName}
                              onChange={(e) => setNewPositionName(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && handleAddPosition(branch.id, dept.id)}
                              autoFocus
                            />
                            <button onClick={() => handleAddPosition(branch.id, dept.id)} className="bg-blue-600 text-white p-1 rounded hover:bg-blue-700"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg></button>
                            <button onClick={() => setPositionEditingDeptId(null)} className="text-slate-400 p-1"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg></button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => setPositionEditingDeptId(dept.id)}
                            className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline"
                          >
                            + إضافة مسمى وظيفي
                          </button>
                        )
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Branch Modal */}
      {isBranchModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl animate-scale-up overflow-hidden">
            <header className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <h3 className="text-xl font-bold dark:text-white">{editingBranchId ? 'تعديل بيانات الفرع' : 'إضافة فرع جديد'}</h3>
              <button onClick={() => setIsBranchModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </header>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">اسم الفرع *</label>
                <input 
                  type="text" 
                  className="w-full border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500" 
                  value={branchForm.name} 
                  onChange={e => setBranchForm({...branchForm, name: e.target.value})}
                  placeholder="مثلاً: فرع الموصل"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">موقع الفرع</label>
                <input 
                  type="text" 
                  className="w-full border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500" 
                  value={branchForm.location} 
                  onChange={e => setBranchForm({...branchForm, location: e.target.value})}
                  placeholder="المدينة، المنطقة، الشارع"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">مدير الفرع</label>
                <select 
                  className="w-full border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500" 
                  value={branchForm.managerId} 
                  onChange={e => setBranchForm({...branchForm, managerId: e.target.value})}
                >
                  <option value="">اختر مديراً...</option>
                  {employees.filter(e => e.role === UserRole.BRANCH_MANAGER || e.role === UserRole.SUPER_ADMIN || e.role === UserRole.EMPLOYEE).map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <footer className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex space-x-3 space-x-reverse">
              <button onClick={handleSaveBranch} className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-900/10">حفظ البيانات</button>
              <button onClick={() => setIsBranchModalOpen(false)} className="px-6 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-xl font-bold">إلغاء</button>
            </footer>
          </div>
        </div>
      )}

      {/* Department Modal */}
      {isDeptModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl animate-scale-up overflow-hidden">
            <header className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <h3 className="text-xl font-bold dark:text-white">{editingDeptId ? 'تعديل بيانات القسم' : 'إضافة قسم جديد'}</h3>
              <button onClick={() => setIsDeptModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </header>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">اسم القسم *</label>
                <input 
                  type="text" 
                  className="w-full border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500" 
                  value={deptForm.name} 
                  onChange={e => setDeptForm({...deptForm, name: e.target.value})}
                  placeholder="مثلاً: الموارد البشرية"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">مسؤول القسم</label>
                <select 
                  className="w-full border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500" 
                  value={deptForm.supervisorId} 
                  onChange={e => setDeptForm({...deptForm, supervisorId: e.target.value})}
                >
                  <option value="">اختر مسؤولاً...</option>
                  {employees.filter(e => e.role === UserRole.DEPT_SUPERVISOR || e.branchId === selectedBranchId || e.role === UserRole.EMPLOYEE).map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <footer className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex space-x-3 space-x-reverse">
              <button onClick={handleSaveDept} className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-900/10">حفظ القسم</button>
              <button onClick={() => setIsDeptModalOpen(false)} className="px-6 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-xl font-bold">إلغاء</button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};

export default Hierarchy;
