import {
  ArrowRight,
  Trophy,
  TrendingUp,
  ChartNoAxesColumnIncreasing,
  History,
  Terminal,
} from "lucide-react";
import { motion } from "motion/react";
import {
  LEVELS,
  TOTAL_QUESTIONS,
  QUESTIONS_PER_LEVEL,
  POINTS,
} from "../constants.js";

const maxScore =
  QUESTIONS_PER_LEVEL *
  LEVELS.reduce((total, level) => total + POINTS[level], 0);
export default function Dashboard({ progress, onStart, onViewMistakes }) {
  const latest = progress.recent[0];
  const previous = progress.recent[1];
  const average = progress.recent.length
    ? (progress.recent.reduce((sum, run) => sum + run.score, 0) / progress.recent.length).toFixed(1)
    : "—";
  const change = latest && previous ? latest.score - previous.score : null;
  const cards = [
    {
      label: "Personal best",
      value: progress.bestScore,
      detail: `out of ${maxScore} points`,
      icon: Trophy,
      color: "text-amber-400",
    },
    {
      label: "Challenges completed",
      value: progress.completed,
      detail: progress.completed ? "All finished challenges" : "Your first challenge awaits",
      icon: History,
      color: "text-brand-400",
    },
    {
      label: "Latest score",
      value: latest ? `${latest.score}/${maxScore}` : "—",
      detail: change === null ? (latest ? "Your most recent completed challenge" : "Finish a challenge to set your score") : change === 0 ? "Same score as your previous run" : `${change > 0 ? "+" : ""}${change} points vs. previous run`,
      icon: TrendingUp,
      color: "text-emerald-400",
    },
    {
      label: "Average score",
      value: average,
      detail: progress.recent.length ? `Last ${progress.recent.length} completed ${progress.recent.length === 1 ? "challenge" : "challenges"} · out of ${maxScore}` : "Based on your last 8 challenges",
      icon: ChartNoAxesColumnIncreasing,
      color: "text-amber-400",
    },
  ];
  return (
    <motion.main
      key="home"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="dashboard-layout"
    >
      <div className="dashboard-content w-full max-w-6xl mx-auto">
        <section className="dashboard-card p-3 md:p-4 relative flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="text-brand-400 text-xs font-bold uppercase tracking-widest mb-1 flex items-center gap-2">
              <Terminal size={16} /> Your logic dashboard
            </div>
            <h1 className="text-xl md:text-2xl font-black mb-1">
              Your progress, at a glance.
            </h1>
            <p className="text-slate-500 text-xs mt-1">
              {TOTAL_QUESTIONS} questions · 3 difficulty levels · {maxScore}{" "}
              possible points
            </p>
          </div>
          <button
            id="start-quiz-btn"
            onClick={onStart}
            className="shrink-0 flex items-center justify-center gap-3 bg-brand-600 hover:bg-brand-500 text-black rounded-2xl px-6 py-4 font-black text-sm transition-colors shadow-lg shadow-brand-950/40"
          >
            START CHALLENGE <ArrowRight size={18} />
          </button>
        </section>

        <section
          aria-label="Your statistics"
          className="grid grid-cols-2 lg:grid-cols-4 gap-3"
        >
          {cards.map(({ label, value, detail, icon: Icon, color }) => (
            <div key={label} className="dashboard-card p-3 md:p-4 relative">
              <Icon size={20} className={`${color} absolute top-4 right-4`} />
              <div className="text-xs text-slate-400 font-medium mb-2 pr-7">
                {label}
              </div>
              <div className="font-mono text-2xl font-bold text-white mb-1">
                {value}
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">{detail}</p>
            </div>
          ))}
        </section>

        <section className="dashboard-card p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold mb-1">Latest mistakes <span className="text-xs text-slate-500 font-normal ml-2">{progress.mistakes.length} saved</span></h2>
            <p className="text-xs text-slate-500">Open your saved mistakes to review the flowcharts and correct answers.</p>
          </div>
          <button id="view-mistakes-btn" onClick={onViewMistakes} className="shrink-0 flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-5 py-3 text-sm font-bold text-white hover:bg-slate-700 transition-colors">View mistakes <ArrowRight size={16} /></button>
        </section>

        <section aria-labelledby="mistake-breakdown-title" className="dashboard-card p-3 md:p-4">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h2 id="mistake-breakdown-title" className="text-sm font-bold">Mistakes by difficulty</h2>
            <span className="text-[11px] text-slate-500">Last {progress.mistakes.length} saved</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {LEVELS.map(level => {
              const count = progress.mistakes.filter(mistake => mistake.difficulty === level).length;
              const color = level === "easy" ? "text-emerald-400" : level === "medium" ? "text-amber-400" : "text-rose-400";
              return <div key={level} className="rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 flex flex-wrap items-center justify-between gap-2">
                <span className={`text-xs font-semibold capitalize ${color}`}>{level}</span>
                <span className="font-mono text-xl font-bold text-white">{count}</span>
              </div>;
            })}
          </div>
        </section>
      </div>
    </motion.main>
  );
}
