const STEPS = [
  { label: 'Personal', number: 1 },
  { label: 'Job & Role', number: 2 },
  { label: 'Payroll', number: 3 },
  { label: 'Documents', number: 4 },
  { label: 'Review', number: 5 },
];

export default function Stepper({ current }) {
  return (
    <div className="mb-10">
      <div className="grid grid-cols-5 gap-3">
        {STEPS.map((step, i) => {
          const idx = i + 1;
          const isCompleted = idx < current;
          const isActive = idx === current;
          return (
            <div
              key={step.label}
              className={`rounded-xl border-2 p-4 flex flex-col items-center gap-2 transition-all duration-300 ${
                isActive
                  ? 'border-blue-600 bg-blue-50 shadow-lg shadow-blue-100'
                  : isCompleted
                  ? 'border-emerald-400 bg-emerald-50'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <div
                className={`flex items-center justify-center font-bold transition-all ${
                  isCompleted
                    ? 'w-10 h-10 bg-emerald-500 text-white shadow-md rounded-xl'
                    : isActive
                    ? 'w-10 h-10 bg-blue-600 text-white shadow-md rounded-xl'
                    : 'w-10 h-10 bg-slate-100 text-slate-400 rounded-xl'
                }`}
              >
                {isCompleted ? (
                  <span className="material-symbols-outlined text-[18px]">check</span>
                ) : (
                  <span className="font-bold">{idx}</span>
                )}
              </div>
              <span
                className={`text-xs font-bold text-center leading-tight ${
                  isActive ? 'text-blue-700' : isCompleted ? 'text-emerald-700' : 'text-slate-400'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
