import { useState } from "react";
import { ArrowLeft, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { motion } from "motion/react";
import Flowchart from "./Flowchart.jsx";

const dateLabel = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Recent"
    : date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

export default function Mistakes({ mistakes, onBack }) {
  const [expanded, setExpanded] = useState(mistakes.length ? 0 : null);
  return (
    <motion.main
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mistakes-layout"
    >
      <div className="w-full max-w-4xl mx-auto pb-5">
        <button
          id="back-to-dashboard-btn"
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-5"
        >
          <ArrowLeft size={18} /> Back to dashboard
        </button>
        <section className="dashboard-card p-4 md:p-5">
          <div className="flex items-center justify-between gap-3 mb-2">
            <h1 className="text-2xl font-bold">Latest mistakes</h1>
            <span className="text-xs text-slate-500">
              {mistakes.length} saved
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-3">
            Review your last 12 mistakes, including unfinished challenges.
          </p>
          <div className="mt-4">
            {!mistakes.length ? (
              <div className="rounded-2xl border border-dashed border-slate-700 p-4 text-center">
                <CheckCircle2
                  className="text-emerald-400 mx-auto mb-3"
                  size={26}
                />
                <p className="text-sm text-slate-300">A fresh start.</p>
                <p className="text-xs text-slate-500 mt-2">
                  Missed questions will appear here with their flowcharts and
                  correct answers.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {mistakes.map((mistake, index) => {
                  const { question, selectedAnswer, difficulty, date } =
                    mistake;
                  const open = expanded === index;
                  return (
                    <article
                      key={`${date}-${index}`}
                      className="rounded-2xl border border-slate-800 bg-slate-950/40 overflow-hidden"
                    >
                      <button
                        onClick={() => setExpanded(open ? null : index)}
                        aria-expanded={open}
                        aria-controls={`mistake-${index}`}
                        className="w-full text-left p-4 flex items-center justify-between gap-3 hover:bg-slate-800/30 transition-colors"
                      >
                        <div className="min-w-0">
                          <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">
                            {difficulty} · {dateLabel(date)}
                          </div>
                          <h3 className="text-sm font-semibold leading-snug">
                            {question.title}
                          </h3>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs font-mono">
                            <span className="text-rose-400">
                              Your answer: {question.options[selectedAnswer]}
                            </span>
                            <span className="text-emerald-400">
                              Correct:{" "}
                              {question.options[question.correctAnswer]}
                            </span>
                          </div>
                        </div>
                        {open ? (
                          <ChevronUp
                            size={18}
                            className="shrink-0 text-brand-400"
                          />
                        ) : (
                          <ChevronDown
                            size={18}
                            className="shrink-0 text-slate-500"
                          />
                        )}
                      </button>
                      {open && (
                        <div id={`mistake-${index}`} className="p-4 pt-0">
                          <p className="text-xs leading-relaxed text-slate-400 mb-4">
                            {question.description}
                          </p>
                          <div className="relative h-[360px] sm:h-[420px] rounded-xl overflow-hidden border border-slate-800">
                            <Flowchart data={question.flowchart} />
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </motion.main>
  );
}
