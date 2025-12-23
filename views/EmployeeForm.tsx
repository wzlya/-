
import React, { useState, useEffect, useMemo } from 'react';
import { Employee, EmployeeStatus, CompanyBranch, WorkingDay, UserRole } from '../types';
import { CURRENCY } from '../constants';

interface Props {
  employee?: Employee;
  onClose: () => void;
  onSave: (emp: Employee) => void;
  hierarchy: CompanyBranch[];
  setHierarchy?: React.Dispatch<React.SetStateAction<CompanyBranch[]>>; 
  currentUser: Employee;
  contractTemplate: string;
}

const EmployeeForm: React.FC<Props> = ({ employee, onClose, onSave, hierarchy, setHierarchy, currentUser, contractTemplate }) => {
  const [activeTab, setActiveTab] = useState<'basic' | 'work' | 'salary'>('basic');
  const [formData, setFormData] = useState<Partial<Employee>>({
    name: '',
    phone: '',
    branchId: '',
    departmentId: '',
    position: '',
    role: UserRole.EMPLOYEE,
    checkInTime: '08:00',
    checkOutTime: '16:00',
    gracePeriodMinutes: 15,
    autoCheckOutEnabled: false,
    autoCheckOutAfterMinutes: 60,
    allowOvertime: false,
    allowLateEntry: true,
    lateFineAmount: 5000,
    allowEarlyExit: false,
    earlyExitGracePeriod: 0,
    earlyExitFineAmount: 5000,
    salary: 0,
    status: EmployeeStatus.ACTIVE,
    code: '',
    password: '',
    avatar: '',
    hireDate: new Date().toISOString().split('T')[0],
    workingDays: [
      { day: 'الأحد', isOff: false, startTime: '08:00', endTime: '16:00' },
      { day: 'الاثنين', isOff: false, startTime: '08:00', endTime: '16:00' },
      { day: 'الثلاثاء', isOff: false, startTime: '08:00', endTime: '16:00' },
      { day: 'الأربعاء', isOff: false, startTime: '08:00', endTime: '16:00' },
      { day: 'الخميس', isOff: false, startTime: '08:00', endTime: '16:00' },
      { day: 'الجمعة', isOff: true, startTime: '00:00', endTime: '00:00' },
      { day: 'السبت', isOff: true, startTime: '00:00', endTime: '00:00' },
    ]
  });

  useEffect(() => {
    if (employee) {
      setFormData(employee);
    } else {
      const randomId = 'EMP-' + Math.floor(1000 + Math.random() * 9000);
      const randomPass = Math.floor(100000 + Math.random() * 900000).toString();
      
      let initialBranch = '';
      let initialDept = '';
      
      if (currentUser.role === UserRole.BRANCH_MANAGER || currentUser.role === UserRole.DEPT_SUPERVISOR) {
        initialBranch = currentUser.branchId || '';
      }
      if (currentUser.role === UserRole.DEPT_SUPERVISOR) {
        initialDept = currentUser.departmentId || '';
      }

      setFormData(prev => ({ 
        ...prev, 
        code: randomId, 
        password: randomPass,
        branchId: initialBranch,
        departmentId: initialDept
      }));
    }
  }, [employee, currentUser]);

  const hourlyRate = useMemo(() => {
    if (!formData.salary || !formData.workingDays) return 0;
    let totalWeeklyHours = 0;
    formData.workingDays.forEach((day: WorkingDay) => {
      if (!day.isOff && day.startTime && day.endTime) {
        const [startH, startM] = day.startTime.split(':').map(Number);
        const [endH, endM] = day.endTime.split(':').map(Number);
        const startTotalMinutes = startH * 60 + startM;
        const endTotalMinutes = endH * 60 + endM;
        let diff = endTotalMinutes - startTotalMinutes;
        if (diff < 0) diff += 24 * 60;
        totalWeeklyHours += diff / 60;
      }
    });
    if (totalWeeklyHours === 0) return 0;
    const monthlyHours = totalWeeklyHours * 4.33;
    return Math.round(formData.salary / monthlyHours);
  }, [formData.salary, formData.workingDays]);

  const selectedBranch = hierarchy.find(b => b.id === formData.branchId);
  const availableDepartments = selectedBranch ? selectedBranch.departments : [];
  const selectedDept = availableDepartments.find(d => d.id === formData.departmentId);
  const availablePositions = selectedDept ? selectedDept.positions : [];

  const handleBranchChange = (branchId: string) => {
    setFormData(prev => ({ ...prev, branchId, departmentId: '', position: '' }));
  };

  const handleDeptChange = (deptId: string) => {
    setFormData(prev => ({ ...prev, departmentId: deptId, position: '' }));
  };

  const handleDayChange = (index: number, field: keyof WorkingDay, value: any) => {
    const updatedDays = [...(formData.workingDays || [])];
    updatedDays[index] = { ...updatedDays[index], [field]: value };
    setFormData({ ...formData, workingDays: updatedDays });
  };

  const handlePrintContract = () => {
    if (!formData.name) {
      alert("يرجى ملء اسم الموظف أولاً");
      return;
    }

    const replacements: Record<string, string> = {
      '{{الاسم}}': formData.name || '---',
      '{{الكود}}': formData.code || '---',
      '{{المنصب}}': formData.position || '---',
      '{{الفرع}}': selectedBranch?.name || '---',
      '{{القسم}}': selectedDept?.name || '---',
      '{{الراتب}}': (formData.salary || 0).toLocaleString(),
      '{{وقت_الحضور}}': formData.checkInTime || '08:00',
      '{{وقت_الانصراف}}': formData.checkOutTime || '16:00',
      '{{تاريخ_اليوم}}': new Date().toLocaleDateString('ar-IQ'),
    };

    let contractHtml = contractTemplate || '';
    if (!contractHtml) {
      alert("قالب العقد غير متوفر. يرجى ضبطه من الإعدادات.");
      return;
    }

    Object.keys(replacements).forEach(key => {
      contractHtml = contractHtml.replaceAll(key, replacements[key]);
    });

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html dir="rtl" lang="ar">
          <head>
            <title>عقد عمل - ${formData.name}</title>
            <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap" rel="stylesheet">
            <style>
              body { font-family: 'Cairo', sans-serif; padding: 50px; }
              @media print {
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            ${contractHtml}
            <div class="no-print" style="margin-top: 50px; text-align: center;">
              <button onclick="window.print()" style="padding: 10px 20px; font-weight: bold; cursor: pointer;">بدء الطباعة</button>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.code || !formData.password || !formData.hireDate) {
      alert("يرجى ملء الحقول الإجبارية بما فيها تاريخ المباشرة");
      return;
    }

    const finalEmployee: Employee = {
      ...formData as Employee,
      id: employee?.id || Date.now().toString(),
      avatar: formData.avatar || `https://ui-avatars.com/api/?name=${formData.name}&background=random`,
      hireDate: formData.hireDate || new Date().toISOString().split('T')[0],
      hourlyRate: hourlyRate
    };

    if (setHierarchy && (finalEmployee.role === UserRole.BRANCH_MANAGER || finalEmployee.role === UserRole.DEPT_SUPERVISOR)) {
      setHierarchy(prev => prev.map(branch => {
        if (finalEmployee.role === UserRole.BRANCH_MANAGER && branch.id === finalEmployee.branchId) {
          return { ...branch, managerId: finalEmployee.id, managerName: finalEmployee.name };
        }
        if (finalEmployee.role === UserRole.DEPT_SUPERVISOR && branch.id === finalEmployee.branchId) {
          return {
            ...branch,
            departments: branch.departments.map(dept => {
              if (dept.id === finalEmployee.departmentId) {
                return { ...dept, supervisorId: finalEmployee.id, supervisorName: finalEmployee.name };
              }
              return dept;
            })
          };
        }
        return branch;
      }));
    }

    onSave(finalEmployee);
    onClose();
  };

  const isBranchLocked = currentUser.role === UserRole.BRANCH_MANAGER || currentUser.role === UserRole.DEPT_SUPERVISOR;
  const isDeptLocked = currentUser.role === UserRole.DEPT_SUPERVISOR;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex justify-end">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl h-full flex flex-col shadow-2xl animate-slide-in-right">
        <header className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div>
            <h2 className="text-xl font-bold dark:text-white">{employee ? 'تعديل بيانات موظف' : 'إضافة موظف جديد'}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">إدارة الصلاحيات والبيانات الوظيفية</p>
          </div>
          <div className="flex gap-2">
            <button 
              type="button"
              onClick={handlePrintContract}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-slate-50 dark:text-white"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
              طباعة العقد
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        </header>

        <nav className="flex border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <button onClick={() => setActiveTab('basic')} className={`flex-1 py-4 font-bold text-sm transition-all ${activeTab === 'basic' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/30' : 'text-slate-500 dark:text-slate-400'}`}>البيانات والارتباط</button>
          <button onClick={() => setActiveTab('work')} className={`flex-1 py-4 font-bold text-sm transition-all ${activeTab === 'work' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/30' : 'text-slate-500 dark:text-slate-400'}`}>إعدادات الدوام</button>
          <button onClick={() => setActiveTab('salary')} className={`flex-1 py-4 font-bold text-sm transition-all ${activeTab === 'salary' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/30' : 'text-slate-500 dark:text-slate-400'}`}>الراتب والجدول</button>
        </nav>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 bg-white dark:bg-slate-900">
          {activeTab === 'basic' && (
            <div className="space-y-4 animate-fade-in">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">الاسم الكامل *</label>
                  <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 dark:text-white outline-none focus:ring-2 focus:ring-blue-600" required />
                </div>

                <div className="col-span-1">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">تاريخ المباشرة (البداية) *</label>
                  <input type="date" value={formData.hireDate} onChange={e => setFormData({...formData, hireDate: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 dark:text-white outline-none focus:ring-2 focus:ring-blue-600" required />
                </div>

                <div className="col-span-1">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">رقم الهاتف</label>
                  <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 dark:text-white outline-none focus:ring-2 focus:ring-blue-600" />
                </div>
                
                <div className="col-span-2 bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-800 space-y-4">
                  <h4 className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">الصلاحيات والارتباط التنظيمي</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">دور الموظف في النظام</label>
                      <select 
                        value={formData.role} 
                        onChange={e => setFormData({...formData, role: e.target.value as UserRole})} 
                        className="w-full bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm font-bold dark:text-white"
                      >
                        {Object.values(UserRole).filter(role => {
                          if (currentUser.role === UserRole.DEPT_SUPERVISOR) return role === UserRole.EMPLOYEE;
                          if (currentUser.role === UserRole.BRANCH_MANAGER) return role === UserRole.EMPLOYEE || role === UserRole.DEPT_SUPERVISOR;
                          return true;
                        }).map(role => <option key={role} value={role}>{role}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">الفرع {isBranchLocked && "(مقفل)"}</label>
                      <select 
                        value={formData.branchId} 
                        onChange={e => handleBranchChange(e.target.value)} 
                        className={`w-full bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm dark:text-white ${isBranchLocked ? 'opacity-60 cursor-not-allowed' : ''}`}
                        disabled={isBranchLocked}
                      >
                        <option value="">اختر الفرع...</option>
                        {hierarchy.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">القسم {isDeptLocked && "(مقفل)"}</label>
                      <select 
                        value={formData.departmentId} 
                        onChange={e => handleDeptChange(e.target.value)} 
                        className={`w-full bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm dark:text-white ${isDeptLocked || !formData.branchId ? 'opacity-60 cursor-not-allowed' : ''}`}
                        disabled={isDeptLocked || !formData.branchId}
                      >
                        <option value="">اختر القسم...</option>
                        {availableDepartments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">المسمى الوظيفي</label>
                      <select 
                        value={formData.position} 
                        onChange={e => setFormData({...formData, position: e.target.value})} 
                        className="w-full bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm dark:text-white disabled:opacity-50"
                        disabled={!formData.departmentId}
                      >
                        <option value="">اختر المسمى...</option>
                        {availablePositions.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="col-span-2 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <h4 className="font-bold text-sm dark:text-white">بيانات تسجيل الدخول *</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">المعرف (ID)</label>
                      <input type="text" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} className="w-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-lg p-2 font-mono text-blue-600 font-bold" required />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">كلمة المرور (Password)</label>
                      <input type="text" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-lg p-2 font-mono dark:text-white" required />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'work' && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <h4 className="text-sm font-black text-slate-800 dark:text-white mb-4">ساعات الدوام الافتراضية</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">وقت الحضور</label>
                      <input type="time" value={formData.checkInTime} onChange={e => setFormData({...formData, checkInTime: e.target.value})} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-blue-600 font-black" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">وقت الانصراف الرسمي</label>
                      <input type="time" value={formData.checkOutTime} onChange={e => setFormData({...formData, checkOutTime: e.target.value})} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-blue-600 font-black" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">فترة السماح للحضور (بالدقائق)</label>
                      <input type="number" value={formData.gracePeriodMinutes} onChange={e => setFormData({...formData, gracePeriodMinutes: parseInt(e.target.value)})} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 dark:text-white" />
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <h4 className="text-sm font-black text-slate-800 dark:text-white mb-4">قواعد التأخير والإضافي</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">قيمة غرامة التأخير ({CURRENCY})</label>
                      <input type="number" value={formData.lateFineAmount} onChange={e => setFormData({...formData, lateFineAmount: parseInt(e.target.value)})} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-red-600 font-black" />
                    </div>
                    <div className="flex items-center justify-between p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700">
                      <span className="text-xs font-bold dark:text-slate-300">السماح بالعمل الإضافي</span>
                      <input type="checkbox" checked={formData.allowOvertime} onChange={e => setFormData({...formData, allowOvertime: e.target.checked})} className="w-5 h-5 accent-blue-600" />
                    </div>
                    
                    <div className="bg-blue-50/50 dark:bg-blue-900/5 p-3 rounded-xl border border-blue-100 space-y-3">
                       <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-blue-700">سياسة الخروج المبكر</span>
                          <input type="checkbox" checked={!formData.allowEarlyExit} onChange={e => setFormData({...formData, allowEarlyExit: !e.target.checked})} className="w-5 h-5 accent-red-600" />
                       </div>
                       {!formData.allowEarlyExit && (
                         <div className="grid grid-cols-1 gap-2 animate-fade-in">
                            <div>
                               <label className="block text-[10px] font-bold text-blue-500 mb-1 uppercase">فترة السماح للانصراف (دقائق)</label>
                               <input type="number" value={formData.earlyExitGracePeriod} onChange={e => setFormData({...formData, earlyExitGracePeriod: parseInt(e.target.value)})} className="w-full bg-white dark:bg-slate-900 border border-blue-100 dark:border-slate-700 rounded-lg p-2 text-xs dark:text-white" />
                            </div>
                            <div>
                               <label className="block text-[10px] font-bold text-red-500 mb-1 uppercase">غرامة الخروج المبكر ({CURRENCY})</label>
                               <input type="number" value={formData.earlyExitFineAmount} onChange={e => setFormData({...formData, earlyExitFineAmount: parseInt(e.target.value)})} className="w-full bg-white dark:bg-slate-900 border border-red-100 dark:border-slate-700 rounded-lg p-2 text-xs text-red-600 font-black" />
                            </div>
                         </div>
                       )}
                    </div>

                    <div className="space-y-2">
                       <div className="flex items-center justify-between p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700">
                        <span className="text-xs font-bold dark:text-slate-300">انصراف تلقائي ذكي</span>
                        <input type="checkbox" checked={formData.autoCheckOutEnabled} onChange={e => setFormData({...formData, autoCheckOutEnabled: e.target.checked})} className="w-5 h-5 accent-blue-600" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'salary' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-emerald-50 dark:bg-emerald-900/10 p-6 rounded-3xl border-2 border-emerald-100 dark:border-emerald-800 flex items-center justify-between">
                <div className="flex-1">
                  <label className="block text-sm font-black text-emerald-800 dark:text-emerald-400 mb-2">الراتب الأساسي الشهري ({CURRENCY}) *</label>
                  <input 
                    type="number" 
                    value={formData.salary} 
                    onChange={e => setFormData({...formData, salary: parseInt(e.target.value)})} 
                    className="w-full bg-white dark:bg-slate-900 border-2 border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 text-3xl font-black text-emerald-600 dark:text-emerald-400 outline-none focus:ring-4 focus:ring-emerald-500/20"
                    placeholder="0"
                  />
                </div>
                <div className="mr-8 text-left">
                  <p className="text-xs font-bold text-emerald-700 dark:text-emerald-500 uppercase tracking-widest mb-1">أجر الساعة التقريبي</p>
                  <p className="text-2xl font-black text-emerald-800 dark:text-emerald-400">{hourlyRate.toLocaleString()} <span className="text-sm font-bold opacity-50">{CURRENCY}</span></p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                   <h4 className="text-sm font-black text-slate-800 dark:text-white">جدول العمل الأسبوعي</h4>
                   <p className="text-[10px] text-slate-500">حدد أيام الدوام وساعاتها المخصصة لهذا الموظف</p>
                </div>
                
                <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                  <table className="w-full text-right text-sm">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold">
                      <tr>
                        <th className="p-3">اليوم</th>
                        <th className="p-3 text-center">إجازة؟</th>
                        <th className="p-3 text-center">وقت الدخول</th>
                        <th className="p-3 text-center">وقت الانصراف</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {formData.workingDays?.map((day, idx) => (
                        <tr key={day.day} className={`transition-colors ${day.isOff ? 'opacity-50 grayscale bg-red-50/20 dark:bg-red-900/5' : 'hover:bg-blue-50/50 dark:hover:bg-blue-900/10'}`}>
                          <td className="p-3 font-bold dark:text-white">{day.day}</td>
                          <td className="p-3 text-center">
                            <input 
                              type="checkbox" 
                              checked={day.isOff} 
                              onChange={e => handleDayChange(idx, 'isOff', e.target.checked)}
                              className="w-4 h-4 accent-red-500"
                            />
                          </td>
                          <td className="p-3 text-center">
                            <input 
                              type="time" 
                              disabled={day.isOff}
                              value={day.startTime} 
                              onChange={e => handleDayChange(idx, 'startTime', e.target.value)}
                              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-1 text-xs dark:text-white disabled:opacity-30"
                            />
                          </td>
                          <td className="p-3 text-center">
                            <input 
                              type="time" 
                              disabled={day.isOff}
                              value={day.endTime} 
                              onChange={e => handleDayChange(idx, 'endTime', e.target.value)}
                              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-1 text-xs dark:text-white disabled:opacity-30"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </form>

        <footer className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex space-x-3 space-x-reverse">
          <button 
            onClick={handleSubmit} 
            className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black text-lg hover:bg-blue-700 shadow-xl shadow-blue-900/20 transition-all active:scale-[0.98]"
          >
            {employee ? 'تحديث البيانات' : 'إضافة الموظف للنظام'}
          </button>
          <button 
            onClick={onClose} 
            className="px-8 py-4 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-2xl font-bold hover:bg-slate-100 transition-all"
          >
            إلغاء
          </button>
        </footer>
      </div>
    </div>
  );
};

export default EmployeeForm;
