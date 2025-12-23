
import React, { useState } from 'react';
import { EvaluationCriteria, CompanyBranch } from '../types';
// Fix: Import Icons from constants to resolve the "Cannot find name 'Icons'" error.
import { Icons } from '../constants';

interface SettingsProps {
  criteria: EvaluationCriteria[];
  setCriteria: React.Dispatch<React.SetStateAction<EvaluationCriteria[]>>;
  hierarchy: CompanyBranch[];
}

const Settings: React.FC<SettingsProps> = ({ criteria, setCriteria, hierarchy }) => {
  const [activeTab, setActiveTab] = useState<'performance' | 'general'>('performance');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCriteria, setEditingCriteria] = useState<EvaluationCriteria | null>(null);

  // Form state
  const [form, setForm] = useState<Partial<EvaluationCriteria>>({
    name: '',
    description: '',
    weight: 0,
    branchId: '',
    departmentId: ''
  });

  const handleAdd = () => {
    setEditingCriteria(null);
    setForm({ name: '', description: '', weight: 0, branchId: '', departmentId: '' });
    setIsModalOpen(true);
  };

  const handleEdit = (c: EvaluationCriteria) => {
    setEditingCriteria(c);
    setForm(c);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا المعيار؟')) {
      setCriteria(prev => prev.filter(c => c.id !== id));
    }
  };

  const handleSave = () => {
    if (!form.name || form.weight === undefined) return;
    
    if (editingCriteria) {
      setCriteria(prev => prev.map(c => c.id === editingCriteria.id ? { ...c, ...form } as EvaluationCriteria : c));
    } else {
      const newCriteria: EvaluationCriteria = {
        id: 'c' + Date.now(),
        name: form.name,
        description: form.description || '',
        weight: form.weight,
        branchId: form.branchId,
        departmentId: form.departmentId
      };
      setCriteria(prev => [...prev, newCriteria]);
    }
    setIsModalOpen(false);
  };

  const getTargetName = (branchId?: string, deptId?: string) => {
    if (!branchId && !deptId) return 'عام (لكل الموظفين)';
    const branch = hierarchy.find(b => b.id === branchId);
    if (!deptId) return `فرع: ${branch?.name || branchId}`;
    const dept = branch?.departments.find(d => d.id === deptId);
    return `${branch?.name} - ${dept?.name || deptId}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">إعدادات النظام</h1>
          <p className="text-slate-500">تخصيص قواعد العمل ومعايير التقييم</p>
        </div>
      </div>

      <nav className="flex space-x-6 space-x-reverse border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('performance')} 
          className={`pb-4 px-2 font-bold text-sm transition-colors ${activeTab === 'performance' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500'}`}
        >
          معايير التقييم
        </button>
        <button 
          onClick={() => setActiveTab('general')} 
          className={`pb-4 px-2 font-bold text-sm transition-colors ${activeTab === 'general' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500'}`}
        >
          إعدادات عامة
        </button>
      </nav>

      {activeTab === 'performance' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-800">قائمة معايير تقييم الأداء</h3>
            <button onClick={handleAdd} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold shadow-md hover:bg-blue-700">إضافة معيار جديد +</button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <table className="w-full text-right">
              <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase">
                <tr>
                  <th className="px-6 py-4">اسم المعيار</th>
                  <th className="px-6 py-4">الوصف</th>
                  <th className="px-6 py-4 text-center">الوزن (%)</th>
                  <th className="px-6 py-4">النطاق</th>
                  <th className="px-6 py-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {criteria.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-bold text-slate-900">{c.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{c.description}</td>
                    <td className="px-6 py-4 text-center font-bold text-blue-600">{c.weight}%</td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-600">
                      <span className={`px-2 py-1 rounded-full ${!c.branchId ? 'bg-slate-100' : 'bg-blue-100 text-blue-700'}`}>
                        {getTargetName(c.branchId, c.departmentId)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center space-x-2 space-x-reverse">
                        <button onClick={() => handleEdit(c)} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg"><Icons.Dashboard /></button>
                        <button onClick={() => handleDelete(c.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <header className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-xl font-bold">{editingCriteria ? 'تعديل المعيار' : 'إضافة معيار تقييم جديد'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </header>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">اسم المعيار *</label>
                <input type="text" className="w-full border-slate-200 rounded-lg p-2.5" placeholder="مثلاً: الالتزام بالوقت" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">الوصف</label>
                <textarea rows={3} className="w-full border-slate-200 rounded-lg p-2.5 text-sm" placeholder="وصف مفصل لكيفية التقييم" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">الوزن النسبي (من 100) *</label>
                <input type="number" className="w-full border-slate-200 rounded-lg p-2.5 font-bold text-blue-600" value={form.weight} onChange={e => setForm({...form, weight: parseInt(e.target.value)})} />
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">تخصيص لفرع محدد (اختياري)</label>
                  <select 
                    className="w-full border-slate-200 rounded-lg p-2 text-sm" 
                    value={form.branchId} 
                    onChange={e => setForm({...form, branchId: e.target.value, departmentId: ''})}
                  >
                    <option value="">كل الفروع</option>
                    {hierarchy.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">تخصيص لقسم محدد (اختياري)</label>
                  <select 
                    className="w-full border-slate-200 rounded-lg p-2 text-sm disabled:bg-slate-100" 
                    disabled={!form.branchId}
                    value={form.departmentId} 
                    onChange={e => setForm({...form, departmentId: e.target.value})}
                  >
                    <option value="">كل الأقسام</option>
                    {hierarchy.find(b => b.id === form.branchId)?.departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <footer className="p-6 border-t border-slate-100 bg-slate-50 flex space-x-3 space-x-reverse">
              <button onClick={handleSave} className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl font-bold hover:bg-blue-700">حفظ المعيار</button>
              <button onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold">إلغاء</button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
