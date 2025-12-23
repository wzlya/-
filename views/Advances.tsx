
import React from 'react';
import { CURRENCY } from '../constants';

const Advances: React.FC = () => {
  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">السلف والقروض</h1>
          <p className="text-gray-500">إدارة طلبات السلف المالية للموظفين والجدولة الشهرية</p>
        </div>
        <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-bold">
          طلب سلفة جديد +
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-gray-500 text-sm">إجمالي السلف الممنوحة</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">85,200,000 {CURRENCY}</h3>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-gray-500 text-sm">المبالغ المستردة حتى الآن</p>
          <h3 className="text-2xl font-bold text-emerald-600 mt-1">42,800,000 {CURRENCY}</h3>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-gray-500 text-sm">الرصيد المتبقي</p>
          <h3 className="text-2xl font-bold text-red-600 mt-1">42,400,000 {CURRENCY}</h3>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="font-bold">طلبات السلف الحالية</h3>
        </div>
        <table className="w-full text-right">
          <thead className="bg-gray-50 text-gray-500 text-sm">
            <tr>
              <th className="px-6 py-4 font-medium">اسم الموظف</th>
              <th className="px-6 py-4 font-medium">مبلغ السلفة</th>
              <th className="px-6 py-4 font-medium">القسط الشهري</th>
              <th className="px-6 py-4 font-medium">مدة السداد</th>
              <th className="px-6 py-4 font-medium">المتبقي</th>
              <th className="px-6 py-4 font-medium">الحالة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {[
              { name: 'علي كاظم', amount: 2000000, monthly: 200000, duration: '10 أشهر', remaining: 800000, status: 'نشط' },
              { name: 'هند وليد', amount: 1500000, monthly: 150000, duration: '10 أشهر', remaining: 1500000, status: 'جديد' },
              { name: 'مصطفى جواد', amount: 3000000, monthly: 250000, duration: '12 شهر', remaining: 500000, status: 'نشط' },
            ].map((loan, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-bold">{loan.name}</td>
                <td className="px-6 py-4">{loan.amount.toLocaleString()} {CURRENCY}</td>
                <td className="px-6 py-4 text-emerald-700 font-semibold">{loan.monthly.toLocaleString()} {CURRENCY}</td>
                <td className="px-6 py-4">{loan.duration}</td>
                <td className="px-6 py-4 font-bold">{loan.remaining.toLocaleString()} {CURRENCY}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                    loan.status === 'نشط' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                  }`}>{loan.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Advances;
