
import React, { useState, useMemo } from 'react';
import { Employee, AttendanceRecord, CompanyBranch } from '../types';

interface AttendanceProps {
  employees: Employee[];
  records: AttendanceRecord[];
  setRecords: React.Dispatch<React.SetStateAction<AttendanceRecord[]>>;
  hierarchy: CompanyBranch[];
}

const Attendance: React.FC<AttendanceProps> = ({ employees, records, setRecords, hierarchy }) => {
  const [filterType, setFilterType] = useState<'الكل' | 'متأخر' | 'غياب' | 'إجازة' | 'حاضر'>('الكل');
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [branchFilter, setBranchFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);

  // Manual Entry Form State
  const [manualEntry, setManualEntry] = useState({
    employeeId: '',
    checkIn: '08:00',
    checkOut: '16:00',
    date: new Date().toISOString().split('T')[0],
    status: 'حاضر' as AttendanceRecord['status']
  });

  const filteredRecords = useMemo(() => {
    return records.filter(rec => {
      const matchType = filterType === 'الكل' || rec.status === filterType;
      const matchDate = rec.date === dateFilter;
      const matchBranch = !branchFilter || rec.branchId === branchFilter;
      const matchDept = !deptFilter || rec.departmentId === deptFilter;
      return matchType && matchDate && matchBranch && matchDept;
    });
  }, [records, filterType, dateFilter, branchFilter, deptFilter]);

  const stats = useMemo(() => {
    const todayRecs = records.filter(r => r.date === dateFilter);
    return {
      present: todayRecs.filter(r => r.status === 'حاضر' || r.status === 'متأخر').length,
      late: todayRecs.filter(r => r.status === 'متأخر').length,
      absent: todayRecs.filter(r => r.status === 'غياب').length,
      onLeave: todayRecs.filter(r => r.status === 'إجازة').length
    };
  }, [records, dateFilter]);

  const handleManualSave = () => {
    if (!manualEntry.employeeId) return;
    const emp = employees.find(e => e.id === manualEntry.employeeId);
    if (!emp) return;

    const newRecord: AttendanceRecord = {
      id: 'att' + Date.now(),
      employeeId: emp.id,
      employeeName: emp.name,
      date: manualEntry.date,
      checkIn: manualEntry.checkIn,
      checkOut: manualEntry.checkOut,
      status: manualEntry.status,
      delayMinutes: 0, // Simplified for now
      branchId: emp.branchId,
      departmentId: emp.departmentId
    };

    setRecords(prev => [...prev, newRecord]);
    setIsManualModalOpen(false);
  };

  const handleEditSave = () => {
    if (!editingRecord) return;
    setRecords(prev => prev.map(r => r.id === editingRecord.id ? editingRecord : r));
    setIsEditModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">الحضور والانصراف</h1>
          <p className="text-gray-500">متابعة سجلات الدخول والخروج والغيابات</p>
        </div>
        <div className="flex space-x-3 space-x-reverse">
          <button className="bg-white border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 font-medium">تقارير الحضور</button>
          <button onClick={() => setIsManualModalOpen(true)} className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 font-bold shadow-md shadow-emerald-100">تسجيل حضور يدوي +</button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm">حاضرون ({dateFilter})</p>
            <h3 className="text-2xl font-bold">{stats.present}</h3>
          </div>
          <div className="bg-green-100 p-3 rounded-full text-green-600">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm">متأخرون</p>
            <h3 className="text-2xl font-bold">{stats.late}</h3>
          </div>
          <div className="bg-yellow-100 p-3 rounded-full text-yellow-600">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm">غياب</p>
            <h3 className="text-2xl font-bold">{stats.absent}</h3>
          </div>
          <div className="bg-red-100 p-3 rounded-full text-red-600">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm">إجازات</p>
            <h3 className="text-2xl font-bold">{stats.onLeave}</h3>
          </div>
          <div className="bg-blue-100 p-3 rounded-full text-blue-600">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Advanced Filters */}
        <div className="p-6 border-b border-gray-100 bg-slate-50 space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-500">التاريخ</label>
              <input 
                type="date" 
                value={dateFilter} 
                onChange={(e) => setDateFilter(e.target.value)}
                className="border-slate-200 rounded-lg py-1 px-3 text-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-500">الفرع</label>
              <select 
                value={branchFilter} 
                onChange={(e) => setBranchFilter(e.target.value)}
                className="border-slate-200 rounded-lg py-1 px-3 text-sm"
              >
                <option value="">جميع الفروع</option>
                {hierarchy.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-500">القسم</label>
              <select 
                value={deptFilter} 
                onChange={(e) => setDeptFilter(e.target.value)}
                className="border-slate-200 rounded-lg py-1 px-3 text-sm"
              >
                <option value="">جميع الأقسام</option>
                {hierarchy.flatMap(b => b.departments).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-4 space-x-reverse">
               <div className="flex rounded-lg overflow-hidden border border-gray-200 bg-white">
                 {(['الكل', 'حاضر', 'متأخر', 'غياب', 'إجازة'] as const).map(type => (
                   <button 
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-4 py-2 text-sm font-bold transition-colors ${filterType === type ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                   >
                     {type}
                   </button>
                 ))}
               </div>
            </div>
            <button className="text-blue-600 font-bold flex items-center space-x-1 space-x-reverse hover:underline text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
              <span>تحميل كشف كامل</span>
            </button>
          </div>
        </div>

        <table className="w-full text-right">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4 font-bold">الموظف</th>
              <th className="px-6 py-4 font-bold">وقت الدخول</th>
              <th className="px-6 py-4 font-bold">وقت الخروج</th>
              <th className="px-6 py-4 font-bold">التأخير</th>
              <th className="px-6 py-4 font-bold">الحالة</th>
              <th className="px-6 py-4 font-bold text-center">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredRecords.map((rec) => (
              <tr key={rec.id} className="hover:bg-blue-50/20 transition-colors">
                <td className="px-6 py-4 font-bold text-slate-900">{rec.employeeName}</td>
                <td className="px-6 py-4 text-sm font-mono">{rec.checkIn}</td>
                <td className="px-6 py-4 text-sm font-mono">{rec.checkOut}</td>
                <td className="px-6 py-4 text-sm text-red-600 font-bold">{rec.delayMinutes > 0 ? `${rec.delayMinutes} دق` : '--'}</td>
                <td className="px-6 py-4">
                   <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                     rec.status === 'حاضر' ? 'bg-green-100 text-green-700' :
                     rec.status === 'متأخر' ? 'bg-yellow-100 text-yellow-700' :
                     rec.status === 'غياب' ? 'bg-red-100 text-red-700' : 
                     rec.status === 'إجازة' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'
                   }`}>
                     {rec.status}
                   </span>
                </td>
                <td className="px-6 py-4 text-center">
                   <button 
                    onClick={() => { setEditingRecord(rec); setIsEditModalOpen(true); }}
                    className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                   >
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                   </button>
                </td>
              </tr>
            ))}
            {filteredRecords.length === 0 && (
              <tr>
                <td colSpan={6} className="p-12 text-center text-slate-400 font-bold">لا توجد سجلات مطابقة للفلاتر المختارة</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Manual Entry Modal */}
      {isManualModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-scale-up">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-bold">تسجيل حضور يدوي</h3>
              <button onClick={() => setIsManualModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">الموظف *</label>
                <select 
                  className="w-full border-slate-200 rounded-lg p-2.5"
                  value={manualEntry.employeeId}
                  onChange={e => setManualEntry({...manualEntry, employeeId: e.target.value})}
                >
                  <option value="">اختر موظفاً...</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.code})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">وقت الدخول</label>
                  <input type="time" className="w-full border-slate-200 rounded-lg p-2.5" value={manualEntry.checkIn} onChange={e => setManualEntry({...manualEntry, checkIn: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">وقت الخروج</label>
                  <input type="time" className="w-full border-slate-200 rounded-lg p-2.5" value={manualEntry.checkOut} onChange={e => setManualEntry({...manualEntry, checkOut: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">الحالة</label>
                <select 
                  className="w-full border-slate-200 rounded-lg p-2.5 font-bold"
                  value={manualEntry.status}
                  onChange={e => setManualEntry({...manualEntry, status: e.target.value as AttendanceRecord['status']})}
                >
                  <option value="حاضر">حاضر</option>
                  <option value="متأخر">متأخر</option>
                  <option value="غياب">غياب</option>
                  <option value="إجازة">إجازة</option>
                </select>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 flex space-x-3 space-x-reverse">
              <button onClick={handleManualSave} className="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl font-bold hover:bg-emerald-700">حفظ السجل</button>
              <button onClick={() => setIsManualModalOpen(false)} className="px-6 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Record Modal */}
      {isEditModalOpen && editingRecord && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-scale-up">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">تعديل سجل: {editingRecord.employeeName}</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1 text-right">وقت الدخول</label>
                  <input 
                    type="text" 
                    className="w-full border-slate-200 rounded-lg p-2.5 text-center font-mono" 
                    value={editingRecord.checkIn} 
                    onChange={e => setEditingRecord({...editingRecord, checkIn: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1 text-right">وقت الخروج</label>
                  <input 
                    type="text" 
                    className="w-full border-slate-200 rounded-lg p-2.5 text-center font-mono" 
                    value={editingRecord.checkOut} 
                    onChange={e => setEditingRecord({...editingRecord, checkOut: e.target.value})} 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1 text-right">الحالة</label>
                <select 
                  className="w-full border-slate-200 rounded-lg p-2.5 font-bold"
                  value={editingRecord.status}
                  onChange={e => setEditingRecord({...editingRecord, status: e.target.value as AttendanceRecord['status']})}
                >
                  <option value="حاضر">حاضر</option>
                  <option value="متأخر">متأخر</option>
                  <option value="غياب">غياب</option>
                  <option value="إجازة">إجازة</option>
                  <option value="خروج مبكر">خروج مبكر</option>
                </select>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 flex space-x-3 space-x-reverse">
              <button onClick={handleEditSave} className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl font-bold hover:bg-blue-700">تحديث البيانات</button>
              <button onClick={() => setIsEditModalOpen(false)} className="px-6 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;
