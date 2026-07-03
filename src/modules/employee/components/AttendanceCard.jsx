import { useState } from "react";

const DASH = "\u2014";

function Icon({ children, className = "" }) {
  return <span className={`material-symbols-outlined ${className}`.trim()}>{children}</span>;
}

function formatToday() {
  return new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

function to12Hour(timeValue) {
  if (!timeValue) return DASH;
  let str = String(timeValue);
  const match = str.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return timeValue;
  let hour = parseInt(match[1], 10);
  const minute = match[2];
  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;
  return `${hour}:${minute} ${ampm}`;
}

function formatCheckInTime(attendance) {
  if (!attendance?.check_in) return DASH;
  return to12Hour(attendance.check_in);
}

function formatCheckOutTime(attendance) {
  if (!attendance?.check_out) return DASH;
  return to12Hour(attendance.check_out);
}

function attendanceStatus(attendance) {
  if (attendance?.check_out) {
    return { label: "Completed", className: "bg-slate-100 text-slate-700 px-4 py-2 rounded-full text-sm font-semibold" };
  }
  if (attendance?.check_in) {
    return { label: "Active Session", className: "bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm font-semibold" };
  }
  return { label: "Not Started", className: "bg-yellow-100 text-yellow-700 px-4 py-2 rounded-full text-sm font-semibold" };
}

export default function AttendanceCard({ attendance, loadingAction, onAttendance, liveSeconds, onBreakStart, onBreakStop, breakRunning }) {
  const [notes, setNotes] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const status = attendanceStatus(attendance);
  const checkedIn = !!attendance?.check_in;
  const checkedOut = !!attendance?.check_out;

  const hours = Math.floor(liveSeconds / 3600);
  const minutes = Math.floor((liveSeconds % 3600) / 60);
  const seconds = liveSeconds % 60;
  const hoursStr = String(hours).padStart(2, "0");
  const minutesStr = String(minutes).padStart(2, "0");
  const secondsStr = String(seconds).padStart(2, "0");
  const timerDisplay = `${hoursStr}:${minutesStr}:${secondsStr}`;

  return (
    <div className="col-span-12 lg:col-span-6">
      <div className="info-card">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-2xl font-bold">Daily Attendance</h3>
            <p className="text-slate-500 mt-1" id="today-date">{formatToday()}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className={status.className} id="session-status">{status.label}</div>
          </div>
        </div>
        <div className="text-center py-6">
          {checkedIn && !checkedOut ? (
            <>
              <h1 className="text-5xl font-black tracking-tight font-mono text-emerald-600" id="today-hours">{timerDisplay}</h1>
              <p className="text-slate-500 mt-3">Working time today</p>
            </>
          ) : checkedOut ? (
            <>
              <h1 className="text-5xl font-black tracking-tight font-mono text-slate-900" id="today-hours">{timerDisplay}</h1>
              <p className="text-slate-500 mt-3">Total hours worked today</p>
            </>
          ) : (
            <>
              <h1 className="text-6xl font-black tracking-tight font-mono text-slate-900" id="today-hours">{attendance?.hours_worked || 0}h</h1>
              <p className="text-slate-500 mt-3">Current working hours today</p>
            </>
          )}
        </div>
        {checkedIn && !checkedOut && (
          <div className="mb-4">
            <p className="text-xs text-slate-500 mb-1">Notes for today</p>
            <textarea
              className="w-full border border-slate-200 rounded-lg p-2 text-sm"
              id="attendance-notes"
              rows="2"
              placeholder="Add any notes for today..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        )}
        {checkedIn && !checkedOut && (
          <div className="mb-4">
            <button
              id="breakBtn"
              className="btn btn-outline w-full"
              onClick={breakRunning ? onBreakStop : onBreakStart}
            >
              <Icon>{breakRunning ? "timer_off" : "timer"}</Icon>
              {breakRunning ? "Stop Break" : "Break (1:00 PM)"}
            </button>
          </div>
        )}
        <div className="flex flex-col md:flex-row gap-4 mt-2">
          <div className="flex-1 flex flex-col items-center gap-1">
            <span id="today-check-in" className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">{formatCheckInTime(attendance)}</span>
            <button id="checkInBtn" className="btn btn-primary w-full" disabled={loadingAction === "check-in" || checkedIn || checkedOut} onClick={() => onAttendance("check-in")}>
              <Icon>login</Icon>{loadingAction === "check-in" ? "Working..." : "Check In"}
            </button>
          </div>
          <div className="flex-1 flex flex-col items-center gap-1">
            <span id="today-check-out" className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">{formatCheckOutTime(attendance)}</span>
            <button id="checkOutBtn" className="btn btn-secondary w-full" disabled={loadingAction === "check-out" || checkedOut} onClick={() => setShowConfirm(true)}>
              <Icon>schedule</Icon>{loadingAction === "check-out" ? "Working..." : "Check Out"}
            </button>
          </div>
        </div>

        {showConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowConfirm(false)}>
            <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Confirm Check Out</h3>
              <p className="text-sm text-slate-600 mb-4">Are you sure you want to check out? This will end your shift.</p>
              {notes && (
                <div className="bg-slate-50 rounded-lg p-3 mb-4">
                  <p className="text-xs text-slate-500 mb-1">Notes for today:</p>
                  <p className="text-sm text-slate-700">{notes}</p>
                </div>
              )}
              <div className="flex gap-3 justify-end">
                <button className="btn btn-outline flex-1" onClick={() => setShowConfirm(false)}>Cancel</button>
                <button className="btn btn-primary flex-1" disabled={loadingAction === "check-out"} onClick={() => { setShowConfirm(false); onAttendance("check-out", notes); }}>
                  {loadingAction === "check-out" ? "Working..." : "Confirm & Check Out"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
