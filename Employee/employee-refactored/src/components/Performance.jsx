import { useCallback, useEffect, useState } from "react";
import { CorporateShell, Icon } from "./CorporateShell.jsx";

  function apiBase() {
    return window.EMS_API?.LOGIN || window.location.origin;
  }

  function authHeaders() {
    return window.Auth?.headers ? window.Auth.headers() : { "Content-Type": "application/json" };
  }

  const DEV_EMPLOYEE_CODE = "EMP-IT-001"; // fallback when no login session

  function employeeCode() {
    return (window.Auth?.employeeCode ? window.Auth.employeeCode() : "")
      || DEV_EMPLOYEE_CODE;
  }

  function notifyError(message) {
    window.EMS_Toast?.error?.(message);
  }

  function GoalList({ goals }) {
    if (!goals.length) {
      return <p className="text-slate-500 text-center py-4">No goals set for this quarter</p>;
    }

    return goals.map((goal, index) => {
      const progress = Number(goal.progress || 0);
      const color = progress >= 100 ? "bg-emerald-500" : "bg-primary";
      return (
        <div key={goal.id || index}>
          <div className="flex justify-between text-sm mb-2">
            <span>{goal.title || "Goal"}</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className={`h-full ${color}`} style={{ width: `${Math.min(progress, 100)}%` }}></div>
          </div>
        </div>
      );
    });
  }

  function FeedbackList({ feedback }) {
    if (!feedback.length) {
      return <p className="text-slate-500 text-center py-4">No recent feedback</p>;
    }

    return feedback.map((item, index) => (
      <div className="border-l-4 border-primary pl-4" key={item.id || index}>
        <p>"{item.comment || item.feedback_text || ""}"</p>
        <p className="text-slate-500 mt-2">- {item.reviewer || item.reviewer_name || "Reviewer"}</p>
      </div>
    ));
  }

  function PerformanceApp() {
    const [data, setData] = useState({ goals: [], feedback: [] });

    const loadPerformance = useCallback(async () => {
      const code = employeeCode();
      if (!code) return;

      try {
        const response = await fetch(`${apiBase()}/api/employees/${encodeURIComponent(code)}/performance`, {
          headers: authHeaders()
        });
        if (!response.ok) throw new Error("Failed to load performance");
        const loaded = await response.json();
        setData({
          rating: loaded.rating || "--",
          quarter: loaded.quarter || "Q2 2026",
          goals: loaded.goals || [],
          feedback: loaded.feedback || [],
          history: loaded.history || []
        });
      } catch (error) {
        console.error("Error loading performance:", error);
        notifyError("Could not load performance data");
      }
    }, []);

    useEffect(() => {
      loadPerformance();
    }, [loadPerformance]);

    return (
      <CorporateShell title="Corporate EMS">
        <div className="p-8 space-y-8">
          <div className="bg-white rounded-3xl p-10 border border-slate-100">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-slate-500">Current Quarter Rating</p>
                <p className="text-6xl font-bold text-emerald-600">{data.rating || "--"}</p>
                <p className="text-emerald-600">Excellent - {data.quarter || "Q2 2026"}</p>
              </div>
              <Icon className="text-8xl text-emerald-100">star</Icon>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl p-8 border border-slate-100">
              <h3 className="font-semibold mb-6">Quarterly Goals</h3>
              <div className="space-y-6">
                <GoalList goals={data.goals || []} />
              </div>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-slate-100">
              <h3 className="font-semibold mb-6">Recent Feedback</h3>
              <div className="space-y-6 text-sm">
                <FeedbackList feedback={data.feedback || []} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 p-8">
            <h3 className="font-semibold mb-6">Performance History</h3>
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-4">Quarter</th>
                  <th className="text-left py-4">Rating</th>
                  <th className="text-left py-4">Key Achievement</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(data.history || []).length ? data.history.map((item, index) => (
                  <tr className="hover:bg-slate-50" key={item.id || index}>
                    <td className="py-5">{item.quarter || "--"}</td>
                    <td className="py-5 font-medium text-emerald-600">{item.rating || "--"}</td>
                    <td className="py-5 text-slate-600">{item.achievement || item.keyAchievement || "--"}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="3" className="py-16 text-center text-slate-500">No performance history available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </CorporateShell>
    );
  }
export default PerformanceApp;
