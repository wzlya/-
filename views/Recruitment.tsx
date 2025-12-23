
import React, { useState } from 'react';
import { Applicant } from '../types';

const MOCK_APPLICANTS: Applicant[] = [
  { id: '1', name: 'أحمد محمود العبيدي', email: 'ahmed@mail.com', phone: '07709998887', position: 'محاسب كلف', experienceYears: 5, status: 'مقابلة', applyDate: '2024-05-10' },
  { id: '2', name: 'سارة خالد البياتي', email: 'sara@mail.com', phone: '07801112223', position: 'مهندس برمجيات', experienceYears: 2, status: 'جديد', applyDate: '2024-05-12' },
  { id: '3', name: 'جعفر الصادق', email: 'jaafar@mail.com', phone: '07504445556', position: 'مدير مبيعات', experienceYears: 10, status: 'قيد المراجعة', applyDate: '2024-05-08' },
  { id: '4', name: 'نور الهدى', email: 'noor@mail.com', phone: '07703334445', position: 'مصمم جرافيك', experienceYears: 3, status: 'مرفوض', applyDate: '2024-05-05' },
];

const Recruitment: React.FC = () => {
  const [filter, setFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('الكل');

  const filtered = MOCK_APPLICANTS.filter(a => 
    (a.name.includes(filter) || a.position.includes(filter)) && 
    (statusFilter === 'الكل' || a.status === statusFilter)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">طلبات التوظيف</h1>
          <p className="text-slate-500">قاعدة بيانات المتقدمين وإدارة مراحل التوظيف</p>
        </div>
        <button className="bg-emerald-600 text-white px-5 py-2 rounded-lg hover:bg-emerald-700 font-bold shadow-md">
          إضافة مرشح يدوياً +
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <p className="text-slate-500 text-xs font-bold mb-1">إجمالي المتقدمين</p>
          <h3 className="text-xl font-black text-slate-900">{MOCK_APPLICANTS.length}</h3>
        </div>
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
          <p className="text-blue-600 text-xs font-bold mb-1">بانتظار المقابلة</p>
          <h3 className="text-xl font-black text-blue-700">12</h3>
        </div>
        <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100">
          <p className="text-yellow-600 text-xs font-bold mb-1">قيد المراجعة</p>
          <h3 className="text-xl font-black text-yellow-700">8</h3>
        </div>
        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
          <p className="text-emerald-600 text-xs font-bold mb-1">تم توظيفهم مؤخراً</p>
          <h3 className="text-xl font-black text-emerald-700">3</h3>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-wrap gap-4">
        <div className="flex-1 min-w-[300px]">
          <input 
            type="text" 
            placeholder="البحث بالاسم أو التخصص..." 
            className="w-full border-slate-200 rounded-lg"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border-slate-200 rounded-lg">
          <option>الكل</option>
          <option>جديد</option>
          <option>قيد المراجعة</option>
          <option>مقابلة</option>
          <option>مرفوض</option>
          <option>مقبول</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-slate-50 text-slate-500 text-xs">
            <tr>
              <th className="px-6 py-4">اسم المتقدم</th>
              <th className="px-6 py-4">الوظيفة المطلوبة</th>
              <th className="px-6 py-4">سنوات الخبرة</th>
              <th className="px-6 py-4">تاريخ التقديم</th>
              <th className="px-6 py-4">الحالة</th>
              <th className="px-6 py-4">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((app) => (
              <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <p className="font-bold text-slate-900">{app.name}</p>
                  <p className="text-xs text-slate-500">{app.phone} | {app.email}</p>
                </td>
                <td className="px-6 py-4 font-medium">{app.position}</td>
                <td className="px-6 py-4">
                  <span className="bg-slate-100 px-2 py-1 rounded text-xs font-bold">{app.experienceYears} سنوات</span>
                </td>
                <td className="px-6 py-4 text-xs">{app.applyDate}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-[10px] font-bold rounded-full ${
                    app.status === 'مقابلة' ? 'bg-blue-100 text-blue-700' :
                    app.status === 'جديد' ? 'bg-purple-100 text-purple-700' :
                    app.status === 'مرفوض' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>{app.status}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex space-x-2 space-x-reverse">
                    <button className="text-blue-600 hover:underline text-xs font-bold">عرض السيرة</button>
                    <button className="text-slate-400 hover:text-slate-600">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"/></svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="p-10 text-center text-slate-400">لا توجد نتائج مطابقة للبحث</div>
        )}
      </div>
    </div>
  );
};

export default Recruitment;
