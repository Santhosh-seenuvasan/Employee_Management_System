import { CorporateShell, Icon } from "./CorporateShell.jsx";

  const learningCourses = [
    { icon: "code", title: "Advanced JavaScript Patterns", text: "Master modern JS development", tag: "Technical", color: "blue", progress: 65, hours: "8 hours" },
    { icon: "security", title: "Cybersecurity Fundamentals", text: "Protect your organization", tag: "Security", color: "emerald", progress: 40, hours: "6 hours" },
    { icon: "psychology", title: "Effective Communication", text: "Improve workplace communication", tag: "Soft Skills", color: "purple", progress: 85, hours: "4 hours" }
  ];

  const availableCourses = [
    { icon: "cloud", title: "AWS Cloud Practitioner", text: "Cloud Computing \u2022 12 hours", color: "blue", meta: "New" },
    { icon: "data_usage", title: "Data Analysis with Python", text: "Data Science \u2022 15 hours", color: "emerald", meta: "4.8 rating" },
    { icon: "leaderboard", title: "Project Management Basics", text: "Management \u2022 8 hours", color: "amber", meta: "4.6 rating" },
    { icon: "brush", title: "UI/UX Design Principles", text: "Design \u2022 10 hours", color: "red", meta: "4.9 rating" }
  ];

  const certificates = [
    ["JavaScript Advanced", "Issued: Mar 2024"],
    ["Security Awareness", "Issued: Feb 2024"],
    ["Agile Fundamentals", "Issued: Jan 2024"],
    ["Cloud Basics", "Issued: Dec 2023"]
  ];

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
    return (
      <CorporateShell title="My Training">
        <div className="page-header">
          <div className="page-header-content">
            <h1>Learning & Development</h1>
            <p>Track your training progress and explore new courses</p>
          </div>
          <div className="page-header-actions">
            <button className="btn btn-secondary"><Icon>history</Icon> My History</button>
            <button className="btn btn-primary"><Icon>menu_book</Icon> Browse Courses</button>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card"><div className="stat-card-header"><span className="stat-card-icon blue"><Icon>play_circle</Icon></span></div><p className="stat-card-label">In Progress</p><h3 className="stat-card-value">4</h3></div>
          <div className="stat-card"><div className="stat-card-header"><span className="stat-card-icon green"><Icon>check_circle</Icon></span></div><p className="stat-card-label">Completed</p><h3 className="stat-card-value">12</h3></div>
          <div className="stat-card"><div className="stat-card-header"><span className="stat-card-icon purple"><Icon>emoji_events</Icon></span></div><p className="stat-card-label">Certificates</p><h3 className="stat-card-value">8</h3></div>
          <div className="stat-card"><div className="stat-card-header"><span className="stat-card-icon amber"><Icon>schedule</Icon></span></div><p className="stat-card-label">Learning Hours</p><h3 className="stat-card-value">48</h3></div>
        </div>

        <section className="mb-8">
          <h2 className="section-title mb-4">Continue Learning</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {learningCourses.map((course) => <CourseCard course={course} key={course.title} />)}
          </div>
        </section>

        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Available Courses</h2>
            <a href="#" className="text-blue-600 font-semibold hover:underline text-sm">View All</a>
          </div>
          <div className="content-card divide-y divide-slate-100">
            {availableCourses.map((course) => <AvailableCourse course={course} key={course.title} />)}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">My Certificates</h2>
            <a href="#" className="text-blue-600 font-semibold hover:underline text-sm">View All</a>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {certificates.map(([title, date]) => (
              <div className="info-card flex items-center gap-3" key={title}>
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center"><Icon className="text-emerald-600">cert</Icon></div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 truncate">{title}</p>
                  <p className="text-xs text-slate-500">{date}</p>
                </div>
                <button className="text-slate-400 hover:text-blue-600"><Icon>download</Icon></button>
              </div>
            ))}
          </div>
        </section>
      </CorporateShell>
    );
  }
export default TrainingApp;
