
import React from 'react';
import { TRANSLATIONS, CURRENCY } from '../constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const data = [
  { name: 'كانون الثاني', salary: 12000000 },
  { name: 'شباط', salary: 12500000 },
  { name: 'آذار', salary: 11800000 },
  { name: 'نيسان', salary: 13000000 },
  { name: 'أيار', salary: 14200000 },
  { name: 'حزيران', salary: 13900000 },
];

const attendanceData = [
  { day: 'الأحد', rate: 95 },
  { day: 'الاثنين', rate: 92 },
  { day: 'الثلاثاء', rate: 98 },
  { day: 'الأربعاء', rate: 94 },
  { day: 'الخميس', rate: 90 },
];

const StatCard: React.FC<{ title: string; value: string; trend: string; isPositive: boolean }> = ({ title, value, trend, isPositive }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
    <p className="text-gray-500 text-sm font-medium">{title}</p>
    <div className="flex items-end justify-between mt-2">
      <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
      <span className={`text-xs font-bold px-2 py-1 rounded ${isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
        {trend}
      </span>
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{TRANSLATIONS.dashboard}</h1>
        <div className="text-sm text-gray-500">آخر تحديث: {new Date().toLocaleDateString('ar-IQ')}</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title={TRANSLATIONS.totalEmployees} value="245" trend="+5%" isPositive={true} />
        <StatCard title={TRANSLATIONS.activeEmployees} value="238" trend="+2%" isPositive={true} />
        <StatCard title={TRANSLATIONS.attendanceRate} value="94.2%" trend="-1.5%" isPositive={false} />
        <StatCard title={TRANSLATIONS.payrollSum} value={`142.5M ${CURRENCY}`} trend="+0.8%" isPositive={true} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold mb-6">نمو كتلة الرواتب (IQD)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} tickFormatter={(val) => `${val/1000000}M`} />
                <Tooltip formatter={(value: any) => [`${value.toLocaleString()} ${CURRENCY}`, 'الرواتب']} />
                <Area type="monotone" dataKey="salary" stroke="#2563eb" fill="#dbeafe" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold mb-6">معدل الحضور الأسبوعي (%)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" fontSize={12} />
                <YAxis fontSize={12} domain={[0, 100]} />
                <Tooltip formatter={(value: any) => [`${value}%`, 'الحضور']} />
                <Bar dataKey="rate" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-bold">آخر الطلبات المعلقة</h3>
          <button className="text-blue-600 text-sm font-semibold hover:underline">عرض الكل</button>
        </div>
        <table className="w-full text-right">
          <thead className="bg-gray-50 text-gray-500 text-sm">
            <tr>
              <th className="px-6 py-3 font-medium">الموظف</th>
              <th className="px-6 py-3 font-medium">نوع الطلب</th>
              <th className="px-6 py-3 font-medium">التاريخ</th>
              <th className="px-6 py-3 font-medium">الحالة</th>
              <th className="px-6 py-3 font-medium">الإجراء</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {[1, 2, 3].map((i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <img src={`https://picsum.photos/32/32?random=${i}`} className="rounded-full" />
                    <div>
                      <p className="font-semibold text-sm text-slate-900">موظف رقم {i}</p>
                      <p className="text-xs text-gray-500">قسم تكنولوجيا المعلومات</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm">طلب إجازة مرضية</td>
                <td className="px-6 py-4 text-sm">2024-05-1{i}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-700">قيد الانتظار</span>
                </td>
                <td className="px-6 py-4">
                  <button className="text-blue-600 hover:text-blue-800 font-medium text-sm">مراجعة</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;
