import { useCallback, useEffect, useState } from "react";
import { CorporateShell, Icon } from "./CorporateShell.jsx";

  function apiBase() {
    return window.EMS_API?.LOGIN || window.location.origin;
  }

  function authHeaders() {
    if (window.Auth?.headers) return window.Auth.headers();
    const t = (() => { try { return localStorage.getItem('ems_token') || sessionStorage.getItem('ems_token'); } catch (_) { return ''; } })();
    return { 'Content-Type': 'application/json', ...(t ? { 'Authorization': `Bearer ${t}` } : {}) };
  }

  function employeeCode() {
    try { const c = window.Auth?.employeeCode?.(); if (c) return c; } catch (_) {}
    try { return localStorage.getItem('ems_employeeCode') || sessionStorage.getItem('ems_employeeCode') || ""; } catch (_) { return ""; }
  }

  function CourseCard({ course }) {
    const color = course.color;
    return (
      <div className="info-card course-card">
        <div className={`h-32 bg-gradient-to-br from-${color}-500 to-${color}-600 flex items-center justify-center rounded-t-xl`}>
          <Icon className="text-white text-5xl">{course.icon}</Icon>
        </div>
        <div className="p-5">
          <span className={`text-xs font-semibold text-${color}-600 bg-${color}-50 px-3 py-1 rounded-full`}>{course.tag}</span>
          <h3 className="info-card-title mt-3">{course.title}</h3>
          <p className="text-slate-500 text-sm mt-1">{course.text}</p>
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-slate-600">Progress</span>
              <span className={`font-bold text-${color}-600`}>{course.progress}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div className={`progress-bar bg-${color}-600 h-2 rounded-full`} style={{ width: `${course.progress}%` }}></div>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
            <span className="flex items-center gap-1"><Icon className="text-sm">schedule</Icon>{course.hours}</span>
            <button className={`text-${color}-600 font-semibold hover:underline`}>Continue</button>
          </div>
        </div>
      </div>
    );
  }

  function AvailableCourse({ course }) {
    return (
      <div className="p-4 flex items-center gap-4 hover:bg-slate-50 transition">
        <div className={`w-12 h-12 rounded-xl bg-${course.color}-100 flex items-center justify-center`}>
          <Icon className={`text-${course.color}-600`}>{course.icon}</Icon>
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-slate-900">{course.title}</h3>
          <p className="text-slate-500 text-sm">{course.text}</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-slate-500">{course.meta}</span>
          <button className="btn btn-primary btn-sm">Enroll</button>
        </div>
      </div>
    );
  }

  function TrainingApp() {
    const [learningCourses, setLearningCourses] = useState([]);
    const [availableCourses, setAvailableCourses] = useState([]);
    const [certificates, setCertificates] = useState([]);
    const [stats, setStats] = useState({ inProgress: 0, completed: 0, certificates: 0, hours: 0 });
    const [loading, setLoading] = useState(true);

    const loadTraining = useCallback(async () => {
      const code = employeeCode();
      if (!code) { setLoading(false); return; }

      try {
        const response = await fetch(`${apiBase()}/api/employees/${encodeURIComponent(code)}/training`, {
          headers: authHeaders()
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        setLearningCourses(Array.isArray(data.learningCourses) ? data.learningCourses : []);
        setAvailableCourses(Array.isArray(data.availableCourses) ? data.availableCourses : []);
        setCertificates(Array.isArray(data.certificates) ? data.certificates : []);
        setStats(data.stats || { inProgress: 0, completed: 0, certificates: 0, hours: 0 });
      } catch (err) {
        console.error("Failed to load training data:", err);
      } finally {
        setLoading(false);
      }
    }, []);

    useEffect(() => {
      loadTraining();
    }, [loadTraining]);

    return (
      <CorporateShell title="My Training">
        <div className="stats-grid">
          <div className="stat-card"><div className="stat-card-header"><span className="stat-card-icon blue"><Icon>play_circle</Icon></span></div><p className="stat-card-label">In Progress</p><h3 className="stat-card-value">{stats.inProgress || 0}</h3></div>
          <div className="stat-card"><div className="stat-card-header"><span className="stat-card-icon green"><Icon>check_circle</Icon></span></div><p className="stat-card-label">Completed</p><h3 className="stat-card-value">{stats.completed || 0}</h3></div>
          <div className="stat-card"><div className="stat-card-header"><span className="stat-card-icon purple"><Icon>emoji_events</Icon></span></div><p className="stat-card-label">Certificates</p><h3 className="stat-card-value">{stats.certificates || 0}</h3></div>
          <div className="stat-card"><div className="stat-card-header"><span className="stat-card-icon amber"><Icon>schedule</Icon></span></div><p className="stat-card-label">Learning Hours</p><h3 className="stat-card-value">{stats.hours || 0}</h3></div>
        </div>

        {loading && (
          <div className="content-card p-8 text-center text-slate-500">Loading your training data...</div>
        )}

        {!loading && (
          <>
            <section className="mb-8">
              <h2 className="section-title mb-4">Continue Learning</h2>
              {learningCourses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {learningCourses.map((course) => <CourseCard course={course} key={course.title} />)}
                </div>
              ) : (
                <p className="text-slate-500 text-sm">No courses in progress.</p>
              )}
            </section>

            <section className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="section-title">Available Courses</h2>
                <a href="#" className="text-blue-600 font-semibold hover:underline text-sm">View All</a>
              </div>
              <div className="content-card divide-y divide-slate-100">
                {availableCourses.length > 0 ? availableCourses.map((course) => <AvailableCourse course={course} key={course.title} />) : (
                  <p className="p-8 text-slate-500 text-center">No available courses at this time.</p>
                )}
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="section-title">My Certificates</h2>
                <a href="#" className="text-blue-600 font-semibold hover:underline text-sm">View All</a>
              </div>
              {certificates.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {certificates.map((cert, index) => (
                    <div className="info-card flex items-center gap-3" key={cert.id || cert.title || index}>
                      <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center"><Icon className="text-emerald-600">cert</Icon></div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 truncate">{cert.title || cert.name || "Certificate"}</p>
                        <p className="text-xs text-slate-500">{cert.issuedDate || cert.date || cert.issued_date || ""}</p>
                      </div>
                      <button className="text-slate-400 hover:text-blue-600"><Icon>download</Icon></button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-sm">No certificates yet.</p>
              )}
            </section>
          </>
        )}
      </CorporateShell>
    );
  }
export default TrainingApp;
