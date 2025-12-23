
import React, { useState, useEffect, useMemo } from 'react';
import { Employee, EmployeeStatus, CompanyBranch, WorkingDay } from '../types';
import { CURRENCY } from '../constants';

interface Props {
  employee?: Employee;
  onClose: () => void;
  onSave: (emp: Employee) => void;
  hierarchy: CompanyBranch[];
}

const EmployeeForm: React.FC<Props> = ({ employee, onClose, onSave, hierarchy }) => {
  const [activeTab, setActiveTab] = useState<'basic' | 'work' | 'salary'>('basic');
  const [formData, setFormData] = useState<Partial<Employee>>({
    name: '',
    phone: '',
    branchId: '',
    departmentId: '',
    position: '',
    checkInTime: '08:00',
    checkOutTime: '16:00',
    gracePeriodMinutes: 15,
    autoCheckOutEnabled: false,
    autoCheckOutAfterMinutes: 60,
    allowOvertime: false,
    allowLateEntry: true,
    lateFineAmount: 5000,
    salary: 0,
    status: EmployeeStatus.ACTIVE,
    code: '',
    password: '',
    avatar: '',
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
      setFormData(prev => ({ ...prev, code: randomId, password: randomPass }));
    }
  }, [employee]);

  // Hourly Rate Calculation Logic
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
        if (diff < 0) diff += 24 * 60; // Handle overnight shifts
        
        totalWeeklyHours += diff / 60;
      }
    });

    if (totalWeeklyHours === 0) return 0;

    // Standard business month is usually calculated as 4.33 weeks
    const monthlyHours = totalWeeklyHours * 4.33;
    return Math.round(formData.salary / monthlyHours);
  }, [formData.salary, formData.workingDays]);

  // Derived selections based on hierarchy
  const selectedBranch = hierarchy.find(b => b.id === formData.branchId);
  const availableDepartments = selectedBranch ? selectedBranch.departments : [];
  const selectedDept = availableDepartments.find(d => d.id === formData.departmentId);
  const availablePositions = selectedDept ? selectedDept.positions : [];

  const handleBranchChange = (branchId: string) => {
    setFormData(prev => ({ 
      ...prev, 
      branchId, 
      departmentId: '', 
      position: '' 
    }));
  };

  const handleDeptChange = (deptId: string) => {
    setFormData(prev => ({ 
      ...prev, 
      departmentId: deptId, 
      position: '' 
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.code || !formData.password) {
      alert("يرجى ملء الحقول الإجبارية: الاسم، المعرف، والرمز");
      return;
    }

    const finalEmployee: Employee = {
      ...formData as Employee,
      id: employee?.id || Date.now().toString(),
      avatar: formData.avatar || `https://ui-avatars.com/api/?name=${formData.name}&background=random`,
      hireDate: formData.hireDate || new Date().toISOString().split('T')[0],
      hourlyRate: hourlyRate
    };

    onSave(finalEmployee);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex justify-end">
      <div className="bg-white w-full max-w-2xl h-full flex flex-col shadow-2xl animate-slide-in-right">
        <header className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{employee ? 'تعديل بيانات موظف' : 'إضافة موظف جديد'}</h2>
            <p className="text-sm text-slate-500">الحقول المميزة بـ (*) هي حقول إجبارية</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </header>

        <nav className="flex border-b border-slate-100">
          <button onClick={() => setActiveTab('basic')} className={`flex-1 py-4 font-bold text-sm ${activeTab === 'basic' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500'}`}>البيانات الأساسية</button>
          <button onClick={() => setActiveTab('work')} className={`flex-1 py-4 font-bold text-sm ${activeTab === 'work' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500'}`}>إعدادات الدوام</button>
          <button onClick={() => setActiveTab('salary')} className={`flex-1 py-4 font-bold text-sm ${activeTab === 'salary' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500'}`}>الراتب والجدول</button>
        </nav>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'basic' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-1">الاسم الكامل *</label>
                  <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" required />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">رقم الهاتف</label>
                  <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full border-slate-200 rounded-lg p-2.5" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">حالة الموظف</label>
                  <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as EmployeeStatus})} className="w-full border-slate-200 rounded-lg p-2.5 font-bold">
                    <option value={EmployeeStatus.ACTIVE}>نشط</option>
                    <option value={EmployeeStatus.INACTIVE}>غير نشط</option>
                    <option value={EmployeeStatus.ON_LEAVE}>في إجازة</option>
                    <option value={EmployeeStatus.TERMINATED}>منتهي الخدمة</option>
                  </select>
                </div>
                
                <div className="col-span-2 bg-blue-50/50 p-4 rounded-xl border border-blue-100 space-y-4">
                  <h4 className="text-xs font-black text-blue-600 uppercase tracking-widest">التسكين الوظيفي الاختياري</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">الفرع</label>
                      <select 
                        value={formData.branchId} 
                        onChange={e => handleBranchChange(e.target.value)} 
                        className="w-full border-slate-200 rounded-lg p-2 text-sm"
                      >
                        <option value="">اختر الفرع...</option>
                        {hierarchy.map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">القسم</label>
                      <select 
                        value={formData.departmentId} 
                        onChange={e => handleDeptChange(e.target.value)} 
                        className="w-full border-slate-200 rounded-lg p-2 text-sm disabled:bg-slate-100"
                        disabled={!formData.branchId}
                      >
                        <option value="">اختر القسم...</option>
                        {availableDepartments.map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">المسمى الوظيفي</label>
                      <select 
                        value={formData.position} 
                        onChange={e => setFormData({...formData, position: e.target.value})} 
                        className="w-full border-slate-200 rounded-lg p-2 text-sm disabled:bg-slate-100"
                        disabled={!formData.departmentId}
                      >
                        <option value="">اختر المسمى...</option>
                        {availablePositions.map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <h4 className="font-bold text-sm text-slate-800">بيانات الدخول الإجبارية *</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">معرف الموظف (ID) *</label>
                      <input type="text" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} className="w-full bg-white border-slate-200 rounded-lg p-2 font-mono text-blue-600 font-bold" required />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">رمز الدخول (PIN) *</label>
                      <input type="text" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full bg-white border-slate-200 rounded-lg p-2 font-mono" required />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'work' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2 bg-amber-50 border border-amber-100 p-4 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-bold text-sm text-amber-900">تسجيل خروج تلقائي</p>
                      <p className="text-xs text-amber-700">تفعيل خروج الموظف تلقائياً في حال نسيان تسجيل الخروج</p>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={formData.autoCheckOutEnabled} 
                      onChange={e => setFormData({...formData, autoCheckOutEnabled: e.target.checked})}
                      className="w-6 h-6 text-amber-600 rounded" 
                    />
                  </div>
                  {formData.autoCheckOutEnabled && (
                    <div className="animate-fade-in">
                      <label className="block text-xs font-bold text-amber-800 mb-1">تسجيل الخروج بعد (دقائق من نهاية الدوام)</label>
                      <input 
                        type="number" 
                        value={formData.autoCheckOutAfterMinutes} 
                        onChange={e => setFormData({...formData, autoCheckOutAfterMinutes: parseInt(e.target.value)})}
                        className="w-full border-amber-200 rounded-lg p-2 text-sm bg-white" 
                        placeholder="مثلاً: 60 دقيقة"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">وقت الحضور القياسي</label>
                  <input type="time" value={formData.checkInTime} onChange={e => setFormData({...formData, checkInTime: e.target.value})} className="w-full border-slate-200 rounded-lg p-2.5" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">وقت الانصراف القياسي</label>
                  <input type="time" value={formData.checkOutTime} onChange={e => setFormData({...formData, checkOutTime: e.target.value})} className="w-full border-slate-200 rounded-lg p-2.5" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">فترة السماح (دقائق)</label>
                  <input type="number" value={formData.gracePeriodMinutes} onChange={e => setFormData({...formData, gracePeriodMinutes: parseInt(e.target.value)})} className="w-full border-slate-200 rounded-lg p-2.5" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">غرامة التأخير (لكل مرة)</label>
                  <div className="relative">
                    <input type="number" value={formData.lateFineAmount} onChange={e => setFormData({...formData, lateFineAmount: parseInt(e.target.value)})} className="w-full border-slate-200 rounded-lg p-2.5 pl-10" />
                    <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-bold">{CURRENCY}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'salary' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                  <label className="block text-sm font-bold text-slate-700 mb-1">الراتب الأساسي الشهري</label>
                  <div className="relative">
                    <input type="number" value={formData.salary} onChange={e => setFormData({...formData, salary: parseInt(e.target.value)})} className="w-full border-slate-200 rounded-lg p-3 pl-12 text-lg font-bold text-blue-600 outline-none focus:ring-2 focus:ring-blue-500" />
                    <span className="absolute left-4 top-3 text-slate-400 font-bold">{CURRENCY}</span>
                  </div>
                </div>

                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex flex-col justify-center">
                  <p className="text-xs font-bold text-emerald-700 mb-1">أجر ساعة العمل (تقديري)</p>
                  <div className="flex items-baseline space-x-1 space-x-reverse">
                    <h3 className="text-2xl font-black text-emerald-900">{hourlyRate.toLocaleString()}</h3>
                    <span className="text-xs font-bold text-emerald-600">{CURRENCY} / ساعة</span>
                  </div>
                  <p className="text-[10px] text-emerald-600 mt-1 italic">* يتم الحساب بناءً على الراتب وساعات العمل الفعلية أسبوعياً.</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-sm text-slate-800">جدول الدوام الأسبوعي المخصص</h4>
                <div className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50 text-slate-500">
                      <tr>
                        <th className="p-3">اليوم</th>
                        <th className="p-3">عطلة؟</th>
                        <th className="p-3">وقت الحضور</th>
                        <th className="p-3">وقت الانصراف</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {formData.workingDays?.map((wd, i) => (
                        <tr key={i} className={wd.isOff ? 'bg-slate-50/50' : ''}>
                          <td className="p-3 font-bold">{wd.day}</td>
                          <td className="p-3 text-center">
                            <input type="checkbox" checked={wd.isOff} onChange={e => {
                               const newDays = [...(formData.workingDays || [])];
                               newDays[i].isOff = e.target.checked;
                               setFormData({...formData, workingDays: newDays});
                            }} className="w-4 h-4 text-blue-600 rounded" />
                          </td>
                          <td className="p-3">
                            <input type="time" disabled={wd.isOff} value={wd.startTime} onChange={e => {
                               const newDays = [...(formData.workingDays || [])];
                               newDays[i].startTime = e.target.value;
                               setFormData({...formData, workingDays: newDays});
                            }} className="border-slate-200 rounded p-1 w-full disabled:opacity-30" />
                          </td>
                          <td className="p-3">
                            <input type="time" disabled={wd.isOff} value={wd.endTime} onChange={e => {
                               const newDays = [...(formData.workingDays || [])];
                               newDays[i].endTime = e.target.value;
                               setFormData({...formData, workingDays: newDays});
                            }} className="border-slate-200 rounded p-1 w-full disabled:opacity-30" />
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

        <footer className="p-6 border-t border-slate-100 bg-slate-50 flex space-x-3 space-x-reverse">
          <button onClick={handleSubmit} className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all">
            {employee ? 'تحديث البيانات' : 'حفظ الموظف الجديد'}
          </button>
          <button onClick={onClose} className="px-8 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50">
            إلغاء
          </button>
        </footer>
      </div>
    </div>
  );
};

export default EmployeeForm;
