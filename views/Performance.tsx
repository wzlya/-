
import React, { useState, useMemo } from 'react';
import { EvaluationRecord, EvaluationCriteria, Employee, CompanyBranch } from '../types';

const TODAY = new Date().toISOString().split('T')[0];
const ONE_MONTH_AGO = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0];

interface PerformanceProps {
  employees: Employee[];
  criteria: EvaluationCriteria[];
  evaluations: EvaluationRecord[];
  setEvaluations: React.Dispatch<React.SetStateAction<EvaluationRecord[]>>;
  hierarchy: CompanyBranch[];
}

const Performance: React.FC<PerformanceProps> = ({ employees, criteria, evaluations, setEvaluations, hierarchy }) => {
  const [viewMode, setViewMode] = useState<'list' | 'report'>('list');
  const [isEvalModalOpen, setIsEvalModalOpen] = useState(false);
  
  const [branchFilter, setBranchFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [empFilter, setEmpFilter] = useState('');
  
  // Date Range Filtering
  const [startDate, setStartDate] = useState(ONE_MONTH_AGO);
  const [endDate, setEndDate] = useState(TODAY);

  const [newEval, setNewEval] = useState<Partial<EvaluationRecord>>({
    employeeId: '',
    scores: [],
    comments: '',
    date: TODAY
  });

  const filteredEvaluations = useMemo(() => {
    return evaluations.filter(ev => {
      const matchBranch = !branchFilter || ev.branchId === branchFilter;
      const matchDept = !deptFilter || ev.departmentId === deptFilter;
      const matchEmp = !empFilter || ev.employeeId === empFilter;
      const matchDate = ev.date >= startDate && ev.date <= endDate;
      return matchBranch && matchDept && matchEmp && matchDate;
    });
  }, [evaluations, branchFilter, deptFilter, empFilter, startDate, endDate]);

  const groupedReportData = useMemo(() => {
    const employeeMap = new Map<string, {
      employee: Employee | undefined,
      evalCount: number,
      criteriaScores: Record<string, number>,
      totalScoreSum: number,
      latestDate: string
    }>();

    filteredEvaluations.forEach(ev => {
      if (!employeeMap.has(ev.employeeId)) {
        employeeMap.set(ev.employeeId, {
          employee: employees.find(e => e.id === ev.employeeId),
          evalCount: 0,
          criteriaScores: {},
          totalScoreSum: 0,
          latestDate: ev.date
        });
      }
      const data = employeeMap.get(ev.employeeId)!;
      data.evalCount += 1;
      data.totalScoreSum += ev.totalScore;
      
      ev.scores.forEach(s => {
        data.criteriaScores[s.criteriaId] = (data.criteriaScores[s.criteriaId] || 0) + s.score;
      });
    });

    return Array.from(employeeMap.values()).map(data => ({
      ...data,
      avgTotal: (data.totalScoreSum / data.evalCount).toFixed(1),
      avgCriteria: Object.fromEntries(
        Object.entries(data.criteriaScores).map(([id, sum]) => [id, (sum / data.evalCount).toFixed(1)])
      )
    }));
  }, [filteredEvaluations, employees]);

  const handleScoreChange = (criteriaId: string, score: number) => {
    setNewEval(prev => {
      const existing = prev.scores || [];
      const updated = existing.some(s => s.criteriaId === criteriaId)
        ? existing.map(s => s.criteriaId === criteriaId ? { ...s, score } : s)
        : [...existing, { criteriaId, score }];
      return { ...prev, scores: updated };
    });
  };

  const handleSaveEval = () => {
    if (!newEval.employeeId || !newEval.scores || newEval.scores.length === 0) {
      alert('يرجى اختيار الموظف وإدخال التقييمات');
      return;
    }
    const emp = employees.find(e => e.id === newEval.employeeId);
    if (!emp) return;

    let totalWeightedScore = 0;
    let totalWeight = 0;
    newEval.scores.forEach(s => {
      const crit = criteria.find(c => c.id === s.criteriaId);
      if (crit) {
        totalWeightedScore += (s.score * crit.weight);
        totalWeight += crit.weight;
      }
    });

    // Weighted average normalized to 100%
    const finalScore = totalWeight > 0 ? (totalWeightedScore / totalWeight * 10).toFixed(1) : "0";

    const evaluation: EvaluationRecord = {
      id: 'ev' + Date.now(),
      employeeId: emp.id,
      employeeName: emp.name,
      evaluatorId: 'admin',
      evaluatorName: 'أحمد العراقي',
      date: newEval.date || TODAY,
      scores: newEval.scores,
      totalScore: parseFloat(finalScore),
      comments: newEval.comments || '',
      branchId: emp.branchId,
      departmentId: emp.departmentId
    };

    setEvaluations(prev => [...prev, evaluation]);
    setIsEvalModalOpen(false);
    setNewEval({ employeeId: '', scores: [], comments: '', date: TODAY });
  };

  const exportPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-bold dark:text-white">إدارة تقييم الأداء</h1>
          <p className="text-slate-500 dark:text-slate-400">مراجعة وتحليل أداء الموظفين بناءً على المعايير المعتمدة</p>
        </div>
        <div className="flex space-x-3 space-x-reverse">
          <div className="flex border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden shadow-sm">
            <button onClick={() => setViewMode('list')} className={`px-4 py-2 text-sm font-bold transition-all ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-50'}`}>سجل التقييمات</button>
            <button onClick={() => setViewMode('report')} className={`px-4 py-2 text-sm font-bold transition-all ${viewMode === 'report' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-50'}`}>تقرير الأداء التفصيلي</button>
          </div>
          <button onClick={() => setIsEvalModalOpen(true)} className="bg-emerald-600 text-white px-5 py-2 rounded-lg font-bold shadow-lg shadow-emerald-100 dark:shadow-none transition-transform active:scale-95">تقييم جديد +</button>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-wrap gap-4 print:hidden">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-[10px] font-bold text-slate-400 mb-1">الفرع</label>
          <select value={branchFilter} onChange={e => setBranchFilter(e.target.value)} className="w-full bg-transparent border-slate-200 dark:border-slate-700 rounded-lg py-1.5 text-sm dark:text-white">
            <option value="">كل الفروع</option>
            {hierarchy.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-[10px] font-bold text-slate-400 mb-1">القسم</label>
          <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} className="w-full bg-transparent border-slate-200 dark:border-slate-700 rounded-lg py-1.5 text-sm dark:text-white">
            <option value="">كل الأقسام</option>
            {hierarchy.flatMap(b => b.departments).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[300px] flex gap-2">
           <div className="flex-1">
              <label className="block text-[10px] font-bold text-slate-400 mb-1">من تاريخ</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-transparent border-slate-200 dark:border-slate-700 rounded-lg py-1.5 text-sm dark:text-white" />
           </div>
           <div className="flex-1">
              <label className="block text-[10px] font-bold text-slate-400 mb-1">إلى تاريخ</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-transparent border-slate-200 dark:border-slate-700 rounded-lg py-1.5 text-sm dark:text-white" />
           </div>
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden print:hidden">
          <table className="w-full text-right">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">الموظف</th>
                <th className="px-6 py-4">تاريخ التقييم</th>
                <th className="px-6 py-4 text-center">الدرجة النهائية</th>
                <th className="px-6 py-4 text-center">الإجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredEvaluations.map((ev) => (
                <tr key={ev.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold dark:text-white">{ev.employeeName}</p>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium dark:text-slate-300">{ev.date}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-lg font-black ${ev.totalScore >= 85 ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' : 'text-blue-600 bg-blue-50 dark:bg-blue-900/20'}`}>
                      {ev.totalScore}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button className="text-blue-600 hover:underline font-bold text-sm">التفاصيل</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in">
           {/* Detailed Header Section */}
           <div className="flex items-end justify-between px-2">
              <div className="space-y-1">
                 <h2 className="text-3xl font-black text-blue-600 dark:text-blue-400 underline decoration-4 underline-offset-8">تقرير الأداء التفصيلي</h2>
                 <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mr-1">نظام المدار لإدارة الموارد البشرية</p>
              </div>
              <div className="flex flex-col items-end gap-3 print:hidden">
                 <button 
                  onClick={exportPDF}
                  className="bg-slate-900 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-slate-800 shadow-md transition-all active:scale-95"
                 >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                    تصدير التقرير (PDF)
                 </button>
                 <div className="text-right text-slate-500 dark:text-slate-400 font-bold text-sm bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg">
                    <span>الفترة: </span>
                    <span className="font-mono text-blue-600 dark:text-blue-400">{startDate}</span>
                    <span className="mx-2">إلى</span>
                    <span className="font-mono text-blue-600 dark:text-blue-400">{endDate}</span>
                 </div>
              </div>
           </div>

           <div className="bg-[#0b1424] dark:bg-[#020617] rounded-2xl border border-slate-800 shadow-2xl overflow-x-auto print:border-none print:shadow-none print:bg-white print:text-black">
             <table className="w-full border-collapse text-center">
                <thead>
                  <tr className="text-white print:text-black text-xs lg:text-sm font-bold border-b border-slate-700 print:border-black">
                    <th className="p-4 border-l border-slate-700 print:border-black w-48 text-right">الموظف</th>
                    <th className="p-4 border-l border-slate-700 print:border-black">التقييمات</th>
                    <th className="p-4 border-l border-slate-700 print:border-black bg-blue-900/40 print:bg-slate-100">المتوسط العام</th>
                    {criteria.map(c => (
                      <th key={c.id} className="p-2 border-l border-slate-700 print:border-black font-normal min-w-[100px]">
                        <div className="font-bold leading-tight">{c.name}</div>
                        <div className="text-[10px] text-slate-400 print:text-slate-600 mt-1">({c.weight}%)</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-slate-200 print:text-black">
                  {groupedReportData.map((data, idx) => (
                    <tr key={idx} className="border-b border-slate-800 print:border-black hover:bg-slate-800/30 transition-colors">
                      <td className="p-4 border-l border-slate-800 print:border-black text-right">
                        <div className="font-bold text-white print:text-black">{data.employee?.name}</div>
                        <div className="text-[10px] text-slate-500 print:text-slate-700">{data.employee?.position}</div>
                      </td>
                      <td className="p-4 border-l border-slate-800 print:border-black font-mono text-lg">{data.evalCount}</td>
                      <td className="p-4 border-l border-slate-800 print:border-black bg-blue-900/20 print:bg-slate-50 font-black text-xl text-blue-400 print:text-blue-900">{data.avgTotal}%</td>
                      {criteria.map(c => (
                        <td key={c.id} className="p-4 border-l border-slate-800 print:border-black font-bold text-slate-300 print:text-black">
                          {data.avgCriteria[c.id] || '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {groupedReportData.length === 0 && (
                    <tr>
                      <td colSpan={criteria.length + 3} className="p-20 text-slate-500 font-bold">لا تتوفر بيانات تقييم في هذه الفترة</td>
                    </tr>
                  )}
                </tbody>
             </table>
           </div>

           <div className="hidden print:block mt-8 text-xs text-slate-500 italic text-center">
              تم استخراج هذا التقرير آلياً من نظام المدار HRMS بتاريخ {new Date().toLocaleString('ar-IQ')}
           </div>
        </div>
      )}

      {/* Manual Evaluation Modal */}
      {isEvalModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <header className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <h3 className="text-xl font-bold dark:text-white">إجراء تقييم أداء جديد</h3>
              <button onClick={() => setIsEvalModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </header>
            <div className="p-6 overflow-y-auto space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">اختر الموظف *</label>
                <select className="w-full bg-transparent border-slate-200 dark:border-slate-700 dark:text-white rounded-lg p-2.5" value={newEval.employeeId} onChange={e => setNewEval({...newEval, employeeId: e.target.value})}>
                  <option value="">اختر موظفاً...</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.code})</option>)}
                </select>
              </div>
              <div className="space-y-4">
                 <h4 className="font-black text-blue-600 dark:text-blue-400 text-sm border-b border-blue-100 dark:border-blue-900 pb-2">تقييم المعايير (من 10 درجات)</h4>
                 {criteria.map(c => (
                   <div key={c.id} className="flex items-center justify-between gap-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                      <div className="flex-1">
                         <p className="font-bold text-slate-900 dark:text-white text-sm">{c.name}</p>
                      </div>
                      <div className="w-24">
                         <input type="number" min="0" max="10" step="0.5" className="w-full text-center bg-transparent border-slate-200 dark:border-slate-700 rounded-lg p-2 font-black text-blue-600 dark:text-blue-400" onChange={e => handleScoreChange(c.id, parseFloat(e.target.value))} placeholder="0-10" />
                      </div>
                   </div>
                 ))}
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">الملاحظات والتوصيات</label>
                <textarea rows={3} className="w-full bg-transparent border-slate-200 dark:border-slate-700 dark:text-white rounded-lg p-2.5 text-sm" value={newEval.comments} onChange={e => setNewEval({...newEval, comments: e.target.value})} />
              </div>
            </div>
            <footer className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex space-x-3 space-x-reverse">
              <button onClick={handleSaveEval} className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl font-bold hover:bg-blue-700">حفظ التقييم النهائي</button>
              <button onClick={() => setIsEvalModalOpen(false)} className="px-6 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-xl font-bold">إلغاء</button>
            </footer>
          </div>
        </div>
      )}

      {/* Print Styles */}
      <style>{`
        @media print {
          body { background: white !important; padding: 0 !important; margin: 0 !important; }
          .min-h-screen { background: white !important; }
          main { padding: 0 !important; margin: 0 !important; }
          .print-hidden { display: none !important; }
          table { width: 100% !important; border: 1px solid black !important; }
          th, td { border: 1px solid black !important; color: black !important; padding: 8px !important; }
          .rounded-2xl { border-radius: 0 !important; }
          .shadow-2xl { box-shadow: none !important; }
          h2 { color: black !important; }
          .bg-blue-900\/40, .bg-blue-900\/20 { background: transparent !important; color: black !important; }
        }
      `}</style>
    </div>
  );
};

export default Performance;
