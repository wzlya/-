
import React, { useState, useMemo } from 'react';
import { Applicant, CompanyBranch, Employee, UserRole, EmployeeStatus } from '../types';
import EmployeeForm from './EmployeeForm';

interface RecruitmentProps {
  applicants: Applicant[];
  setApplicants: React.Dispatch<React.SetStateAction<Applicant[]>>;
  hierarchy: CompanyBranch[];
  currentUser: Employee;
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  contractTemplate: string;
}

const Recruitment: React.FC<RecruitmentProps> = ({ 
  applicants, 
  setApplicants, 
  hierarchy, 
  currentUser,
  setEmployees,
  contractTemplate
}) => {
  const [filter, setFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('الكل');
  const [branchFilter, setBranchFilter] = useState('');
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isHiringFormOpen, setIsHiringFormOpen] = useState(false);
  const [selectedApplicantForHire, setSelectedApplicantForHire] = useState<Applicant | null>(null);

  const [newApplicant, setNewApplicant] = useState<Partial<Applicant>>({
    name: '',
    email: '',
    phone: '',
    position: '',
    experienceYears: 0,
    branchId: '',
    departmentId: '',
    status: 'جديد',
    applyDate: new Date().toISOString().split('T')[0]
  });

  const filtered = useMemo(() => {
    return applicants.filter(a => {
      // Role-based visibility
      let isVisible = false;
      if (currentUser.role === UserRole.SUPER_ADMIN) isVisible = true;
      else if (currentUser.role === UserRole.BRANCH_MANAGER) isVisible = a.branchId === currentUser.branchId;
      else if (currentUser.role === UserRole.DEPT_SUPERVISOR) isVisible = a.departmentId === currentUser.departmentId;

      if (!isVisible) return false;

      const matchSearch = (a.name.includes(filter) || a.position.includes(filter));
      const matchStatus = (statusFilter === 'الكل' || a.status === statusFilter);
      const matchBranch = (!branchFilter || a.branchId === branchFilter);
      
      return matchSearch && matchStatus && matchBranch;
    });
  }, [applicants, filter, statusFilter, branchFilter, currentUser]);

  const stats = useMemo(() => {
    return {
      total: applicants.length,
      new: applicants.filter(a => a.status === 'جديد').length,
      interviews: applicants.filter(a => a.status === 'مقابلة').length,
      accepted: applicants.filter(a => a.status === 'مقبول').length,
    };
  }, [applicants]);

  const updateStatus = (id: string, newStatus: Applicant['status']) => {
    setApplicants(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
  };

  const handleAddApplicant = () => {
    if (!newApplicant.name || !newApplicant.position) {
      alert("يرجى ملء البيانات الأساسية");
      return;
    }
    const id = 'app-' + Date.now();
    setApplicants(prev => [...prev, { ...newApplicant, id } as Applicant]);
    setIsAddModalOpen(false);
    setNewApplicant({
      name: '', email: '', phone: '', position: '', experienceYears: 0,
      branchId: '', departmentId: '', status: 'جديد',
      applyDate: new Date().toISOString().split('T')[0]
    });
  };

  const handleStartHiring = (app: Applicant) => {
    setSelectedApplicantForHire(app);
    setIsHiringFormOpen(true);
  };

  const handleHireComplete = (newEmp: Employee) => {
    // 1. Add employee to state
    setEmployees(prev => [...prev, newEmp]);
    // 2. Mark applicant as hired/accepted if not already
    updateStatus(selectedApplicantForHire!.id, 'مقبول');
    // 3. Close forms
    setIsHiringFormOpen(false);
    setSelectedApplicantForHire(null);
  };

  const selectedBranchData = hierarchy.find(b => b.id === (newApplicant.branchId || branchFilter));
  const availableDepts = selectedBranchData ? selectedBranchData.departments : [];

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">إدارة المواهب والتوظيف</h1>
          <p className="text-slate-500 font-bold text-sm">تتبع طلبات التوظيف وتحويل المرشحين إلى موظفين</p>
        </div>
        <button onClick={() => setIsAddModalOpen(true)} className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-black shadow-lg shadow-emerald-900/10 hover:bg-emerald-700 transition-all active:scale-95">
          إضافة مرشح جديد +
        </button>
      </header>

      {/* Stats Funnel */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
          <p className="text-[10px] font-black text-slate-400 uppercase">إجمالي المرشحين</p>
          <h3 className="text-xl font-black dark:text-white">{stats.total}</h3>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-2xl border border-blue-100 dark:border-blue-800">
          <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">جديد</p>
          <h3 className="text-xl font-black text-blue-700 dark:text-blue-400">{stats.new}</h3>
        </div>
        <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-2xl border border-amber-100 dark:border-amber-800">
          <p className="text-[10px] font-black text-amber-600 uppercase">مقابلات</p>
          <h3 className="text-xl font-black text-amber-700 dark:text-amber-400">{stats.interviews}</h3>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-800">
          <p className="text-[10px] font-black text-emerald-600 uppercase">مقبولين</p>
          <h3 className="text-xl font-black text-emerald-700 dark:text-emerald-400">{stats.accepted}</h3>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[250px]">
          <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">البحث السريع</label>
          <input 
            type="text" 
            placeholder="البحث بالاسم أو التخصص..." 
            className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm font-bold dark:text-white"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        {currentUser.role === UserRole.SUPER_ADMIN && (
          <div className="w-48">
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">الفرع</label>
            <select value={branchFilter} onChange={e => setBranchFilter(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm font-bold dark:text-white">
              <option value="">كل الفروع</option>
              {hierarchy.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
        )}
        <div className="w-48">
          <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">الحالة</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm font-bold dark:text-white">
            <option value="الكل">جميع الحالات</option>
            <option value="جديد">جديد</option>
            <option value="قيد المراجعة">قيد المراجعة</option>
            <option value="مقابلة">مقابلة</option>
            <option value="مرفوض">مرفوض</option>
            <option value="مقبول">مقبول</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">المرشح</th>
                <th className="px-6 py-4">التخصص المطلوب</th>
                <th className="px-6 py-4 text-center">الخبرة</th>
                <th className="px-6 py-4 text-center">تاريخ التقديم</th>
                <th className="px-6 py-4">الحالة</th>
                <th className="px-6 py-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {filtered.map((app) => (
                <tr key={app.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-900 dark:text-white">{app.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold">{app.phone} | {app.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold dark:text-slate-300">{app.position}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-[10px] font-black dark:text-slate-400">{app.experienceYears} سنوات</span>
                  </td>
                  <td className="px-6 py-4 text-center font-mono text-[10px] dark:text-slate-500">{app.applyDate}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 text-[10px] font-black rounded-full ${
                      app.status === 'مقابلة' ? 'bg-amber-100 text-amber-700' :
                      app.status === 'جديد' ? 'bg-blue-100 text-blue-700' :
                      app.status === 'مرفوض' ? 'bg-red-100 text-red-700' :
                      app.status === 'مقبول' ? 'bg-emerald-100 text-emerald-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>{app.status}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                       {app.status === 'جديد' && (
                         <button onClick={() => updateStatus(app.id, 'قيد المراجعة')} className="text-blue-600 p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                         </button>
                       )}
                       {app.status === 'قيد المراجعة' && (
                         <button onClick={() => updateStatus(app.id, 'مقابلة')} className="text-amber-600 p-2 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                         </button>
                       )}
                       {(app.status === 'مقابلة' || app.status === 'قيد المراجعة') && (
                         <>
                           <button onClick={() => handleStartHiring(app)} className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-black shadow-lg shadow-emerald-900/10">توظيف فوري</button>
                           <button onClick={() => updateStatus(app.id, 'مرفوض')} className="text-red-400 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                           </button>
                         </>
                       )}
                       {app.status === 'مقبول' && (
                         <span className="text-emerald-500 font-black text-xs">تم التوظيف بنجاح ✓</span>
                       )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="p-20 text-center text-slate-400 font-black italic">لا توجد طلبات توظيف تطابق هذا البحث</div>
          )}
        </div>
      </div>

      {/* Add Applicant Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
           <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-xl shadow-2xl animate-scale-up overflow-hidden">
              <header className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
                 <h3 className="text-xl font-black dark:text-white">تسجيل مرشح جديد</h3>
                 <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                 </button>
              </header>
              <div className="p-6 space-y-4 text-right">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                       <label className="block text-xs font-black text-slate-400 mb-1 uppercase tracking-widest">الاسم الكامل للمرشح</label>
                       <input type="text" className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-bold dark:text-white" value={newApplicant.name} onChange={e => setNewApplicant({...newApplicant, name: e.target.value})} />
                    </div>
                    <div>
                       <label className="block text-xs font-black text-slate-400 mb-1 uppercase">رقم الهاتف</label>
                       <input type="text" className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-bold dark:text-white" value={newApplicant.phone} onChange={e => setNewApplicant({...newApplicant, phone: e.target.value})} />
                    </div>
                    <div>
                       <label className="block text-xs font-black text-slate-400 mb-1 uppercase">البريد الإلكتروني</label>
                       <input type="email" className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-bold dark:text-white text-left" value={newApplicant.email} onChange={e => setNewApplicant({...newApplicant, email: e.target.value})} />
                    </div>
                    <div className="md:col-span-2 grid grid-cols-2 gap-4">
                       <div>
                          <label className="block text-xs font-black text-slate-400 mb-1 uppercase">الوظيفة المستهدفة</label>
                          <input type="text" className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-bold dark:text-white" value={newApplicant.position} onChange={e => setNewApplicant({...newApplicant, position: e.target.value})} />
                       </div>
                       <div>
                          <label className="block text-xs font-black text-slate-400 mb-1 uppercase">سنوات الخبرة</label>
                          <input type="number" className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-bold dark:text-white" value={newApplicant.experienceYears} onChange={e => setNewApplicant({...newApplicant, experienceYears: parseInt(e.target.value)})} />
                       </div>
                    </div>
                    <div className="md:col-span-2 grid grid-cols-2 gap-4 pt-2">
                       <div>
                          <label className="block text-xs font-black text-slate-400 mb-1 uppercase">الفرع المرشح له</label>
                          <select className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-bold dark:text-white" value={newApplicant.branchId} onChange={e => setNewApplicant({...newApplicant, branchId: e.target.value, departmentId: ''})}>
                             <option value="">اختر الفرع...</option>
                             {hierarchy.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                          </select>
                       </div>
                       <div>
                          <label className="block text-xs font-black text-slate-400 mb-1 uppercase">القسم</label>
                          <select className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-bold dark:text-white" value={newApplicant.departmentId} onChange={e => setNewApplicant({...newApplicant, departmentId: e.target.value})}>
                             <option value="">اختر القسم...</option>
                             {availableDepts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                          </select>
                       </div>
                    </div>
                 </div>
              </div>
              <footer className="p-6 border-t border-slate-100 dark:border-slate-800 flex gap-3">
                 <button onClick={handleAddApplicant} className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-black shadow-lg shadow-emerald-900/10 hover:bg-emerald-700 transition-all">إضافة لجدول المراجعة</button>
                 <button onClick={() => setIsAddModalOpen(false)} className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl font-bold">إلغاء</button>
              </footer>
           </div>
        </div>
      )}

      {/* Hiring Integration Form */}
      {isHiringFormOpen && selectedApplicantForHire && (
        <EmployeeForm 
          employee={{
            // Fake pre-fill for the form based on applicant
            id: 'TEMP',
            name: selectedApplicantForHire.name,
            code: 'EMP-' + Math.floor(Math.random() * 10000),
            role: UserRole.EMPLOYEE,
            email: selectedApplicantForHire.email,
            phone: selectedApplicantForHire.phone,
            position: selectedApplicantForHire.position,
            branchId: selectedApplicantForHire.branchId,
            departmentId: selectedApplicantForHire.departmentId,
            level: 'Junior',
            status: EmployeeStatus.ACTIVE,
            salary: 0,
            hireDate: new Date().toISOString().split('T')[0],
            avatar: '',
            checkInTime: '08:00',
            checkOutTime: '16:00',
            gracePeriodMinutes: 15,
            autoCheckOutEnabled: false,
            autoCheckOutAfterMinutes: 60,
            allowOvertime: false,
            allowLateEntry: true,
            lateFineAmount: 5000,
            workingDays: [
              { day: 'الأحد', isOff: false, startTime: '08:00', endTime: '16:00' },
              { day: 'الاثنين', isOff: false, startTime: '08:00', endTime: '16:00' },
              { day: 'الثلاثاء', isOff: false, startTime: '08:00', endTime: '16:00' },
              { day: 'الأربعاء', isOff: false, startTime: '08:00', endTime: '16:00' },
              { day: 'الخميس', isOff: false, startTime: '08:00', endTime: '16:00' },
              { day: 'الجمعة', isOff: true, startTime: '00:00', endTime: '00:00' },
              { day: 'السبت', isOff: true, startTime: '00:00', endTime: '00:00' },
            ]
          }}
          onClose={() => {
            setIsHiringFormOpen(false);
            setSelectedApplicantForHire(null);
          }}
          onSave={handleHireComplete}
          hierarchy={hierarchy}
          currentUser={currentUser}
          contractTemplate={contractTemplate}
        />
      )}
    </div>
  );
};

export default Recruitment;