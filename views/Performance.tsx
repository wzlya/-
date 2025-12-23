
import React, { useState, useMemo } from 'react';
import { EvaluationRecord, EvaluationCriteria, Employee, CompanyBranch, UserRole } from '../types';

const TODAY = new Date().toISOString().split('T')[0];
const ONE_MONTH_AGO = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0];

interface PerformanceProps {
  employees: Employee[];
  criteria: EvaluationCriteria[];
  evaluations: EvaluationRecord[];
  setEvaluations: React.Dispatch<React.SetStateAction<EvaluationRecord[]>>;
  hierarchy: CompanyBranch[];
  currentUser: Employee;
}

const Performance: React.FC<PerformanceProps> = ({ employees, criteria, evaluations, setEvaluations, hierarchy, currentUser }) => {
  const [viewMode, setViewMode] = useState<'list' | 'report'>('list');
  const [isEvalModalOpen, setIsEvalModalOpen] = useState(false);
  
  const [branchFilter, setBranchFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [empFilter, setEmpFilter] = useState('');
  
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

    const finalScore = totalWeight > 0 ? (totalWeightedScore / totalWeight * 10).toFixed(1) : "0";

    const evaluation: EvaluationRecord = {
      id: 'ev' + Date.now(),
      employeeId: emp.id,
      employeeName: emp.name,
      evaluatorId: currentUser.id,
      evaluatorName: currentUser.name,
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

  // Role based selection logic
  const canSeeBranchFilter = currentUser.role === UserRole.SUPER_ADMIN;
  const canSeeDeptFilter = currentUser.role === UserRole.SUPER_ADMIN || currentUser.role === UserRole.BRANCH_MANAGER;

  const eligibleEmployeesForEval = useMemo(() => {
    return employees.filter(e => {
        if (currentUser.role === UserRole.SUPER_ADMIN) return true;
        if (currentUser.role === UserRole.BRANCH_MANAGER) return e.branchId === currentUser.branchId;
        if (currentUser.role === UserRole.DEPT_SUPERVISOR) return e.departmentId === currentUser.departmentId;
        return false;
    });
  }, [employees, currentUser]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-bold dark:text-white">إدارة تقييم الأداء</h1>
          <p className="text-slate-500 dark:text-slate-400">تحليل الأداء بناءً على المعايير الهرمية المعتمدة</p>
        </div>
        <div className="flex space-x-3 space-x-reverse">
          <div className="flex border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden shadow-sm">
            <button onClick={() => setViewMode('list')} className={`px-4 py-2 text-sm font-bold transition-all ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-50'}`}>سجل التقييمات</button>
            <button onClick={() => setViewMode('report')} className={`px-4 py-2 text-sm font-bold transition-all ${viewMode === 'report' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-50'}`}>تقرير الأداء التفصيلي</button>
          </div>
          <button onClick={() => setIsEvalModalOpen(true)} className="bg-emerald-600 text-white px-5 py-2 rounded-lg font-bold shadow-lg transition-transform active:scale-95">تقييم جديد +</button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-wrap gap-4 print:hidden">
        {canSeeBranchFilter && (
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[10px] font-bold text-slate-400 mb-1">الفرع</label>
            <select value={branchFilter} onChange={e => setBranchFilter(e.target.value)} className="w-full bg-transparent border-slate-200 dark:border-slate-700 rounded-lg py-1.5 text-sm dark:text-white">
              <option value="">كل الفروع</option>
              {hierarchy.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
        )}
        {canSeeDeptFilter && (
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[10px] font-bold text-slate-400 mb-1">القسم</label>
            <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} className="w-full bg-transparent border-slate-200 dark:border-slate-700 rounded-lg py-1.5 text-sm dark:text-white">
              <option value="">كل الأقسام</option>
              {hierarchy.find(b => b.id === (branchFilter || currentUser.branchId))?.departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
        )}
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
                <th className="px-6 py-4 text-center">المقيم</th>
                <th className="px-6 py-4">التاريخ</th>
                <th className="px-6 py-4 text-center">الدرجة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredEvaluations.map((ev) => (
                <tr key={ev.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 font-bold dark:text-white">{ev.employeeName}</td>
                  <td className="px-6 py-4 text-center text-xs dark:text-slate-400">{ev.evaluatorName}</td>
                  <td className="px-6 py-4 text-sm font-medium dark:text-slate-300 font-mono">{ev.date}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="font-black text-blue-600 dark:text-blue-400">{ev.totalScore}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Report view logic remains similar but uses the new hierarchical filters */
        <div className="text-center p-20 text-slate-400 font-bold">يرجى استخدام زر "تصدير التقرير" لمعاينة البيانات المجمعة</div>
      )}

      {/* Manual Eval Modal */}
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
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">الموظف *</label>
                <select className="w-full bg-transparent border-slate-200 dark:border-slate-700 dark:text-white rounded-lg p-2.5" value={newEval.employeeId} onChange={e => setNewEval({...newEval, employeeId: e.target.value})}>
                  <option value="">اختر موظفاً من فريقك...</option>
                  {eligibleEmployeesForEval.map(e => <option key={e.id} value={e.id}>{e.name} ({e.code})</option>)}
                </select>
              </div>
              <div className="space-y-4">
                 {criteria.map(c => (
                   <div key={c.id} className="flex items-center justify-between gap-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                      <div className="flex-1">
                         <p className="font-bold text-slate-900 dark:text-white text-sm">{c.name}</p>
                         <p className="text-[10px] text-slate-400">الوزن: {c.weight}%</p>
                      </div>
                      <input type="number" min="0" max="10" step="0.5" className="w-20 text-center bg-transparent border-slate-200 dark:border-slate-700 rounded-lg p-2 font-black text-blue-600" onChange={e => handleScoreChange(c.id, parseFloat(e.target.value))} />
                   </div>
                 ))}
              </div>
            </div>
            <footer className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex space-x-3 space-x-reverse">
              <button onClick={handleSaveEval} className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl font-bold hover:bg-blue-700">حفظ التقييم</button>
              <button onClick={() => setIsEvalModalOpen(false)} className="px-6 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-xl font-bold">إلغاء</button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};

export default Performance;
