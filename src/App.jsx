/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { RotateCcw, Trophy, CheckCircle2, XCircle, ArrowRight, X, Layout, Terminal } from "lucide-react";
import Flowchart from "./components/Flowchart";
import Dashboard from "./components/Dashboard.jsx";
import BrandLogo from "./components/BrandLogo.jsx";
import Mistakes from "./components/Mistakes.jsx";
import { readProgress, recordAnswer, recordCompletion, saveProgress } from "./progress.js";
import { generateQuizSet, difficultyForIndex, POINTS, QUESTIONS_PER_LEVEL, TOTAL_QUESTIONS, LEVELS } from "./constants";
export default function App() {
  const [currentStep, setCurrentStep] = useState("start");
  const [questions, setQuestions] = useState([]);
  const [questionIdx, setQuestionIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [results, setResults] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [progress, setProgress] = useState(() => {
    try { return readProgress(window.localStorage); }
    catch { return readProgress({ getItem: () => null }); }
  });
  const [progressSaved, setProgressSaved] = useState(true);
  const highScore = progress.bestScore;
  useEffect(() => {
    try { setProgressSaved(saveProgress(window.localStorage, progress)); }
    catch { setProgressSaved(false); }
  }, [progress]);
  const [showSequenceMap, setShowSequenceMap] = useState(false);
  useEffect(() => {
    resetQuizContent();
  }, []);
  const resetQuizContent = () => {
    setQuestions(generateQuizSet());
    setQuestionIdx(0);
    setScore(0);
    setResults([]);
    setSelectedAnswer(null);
    setIsAnswered(false);
  };
  const currentQuestion = questions[questionIdx] || null;
  const handleStart = () => {
    resetQuizContent();
    setCurrentStep("quiz");
  };
  const currentDifficulty = difficultyForIndex(questionIdx);
  const pointsForCurrent = POINTS[currentDifficulty];
  const handleAnswerSelect = idx => {
    if (isAnswered) return;
    setSelectedAnswer(idx);
    setIsAnswered(true);
    const isCorrect = idx === currentQuestion.correctAnswer;
    setProgress(previous => recordAnswer(previous, currentQuestion, idx, currentDifficulty));
    if (isCorrect) {
      setScore(s => s + pointsForCurrent);
    }
    setResults(prev => [...prev, {
      id: questionIdx,
      difficulty: currentDifficulty,
      correct: isCorrect
    }]);
  };
  const handleNext = () => {
    if (questionIdx === TOTAL_QUESTIONS - 1) {
      setProgress(previous => recordCompletion(previous, score, results));
      setCurrentStep("result");
      return;
    }
    setQuestionIdx(q => q + 1);
    setSelectedAnswer(null);
    setIsAnswered(false);
  };
  const renderStart = () => <Dashboard key="dashboard" progress={progress} onStart={handleStart} onViewMistakes={() => setCurrentStep("mistakes")} />;
  const renderQuiz = () => {
    if (!currentQuestion) return null;
    return <main className="quiz-layout container mx-auto">
        <motion.div key={`q-panel-${questionIdx}`} initial={{
        opacity: 0,
        x: -30
      }} animate={{
        opacity: 1,
        x: 0
      }} className="quiz-question-panel flex flex-col">
          <div className="bg-slate-900/60 border border-slate-800 p-5 lg:p-6 rounded-3xl flex flex-col shadow-2xl shadow-black/20 h-full overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-brand-600/20 text-brand-400 text-[11px] font-black rounded-lg uppercase tracking-widest border border-brand-500/10">
                  Question {questionIdx + 1}
                </span>
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${currentDifficulty === "easy" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : currentDifficulty === "medium" ? "bg-amber-500/10 border-amber-500/20 text-amber-400" : "bg-rose-500/10 border-rose-500/20 text-rose-400"}`}>
                  {currentDifficulty} (+{pointsForCurrent} pts)
                </span>
              </div>
            </div>

            <h2 className="text-lg lg:text-xl font-bold text-white leading-tight mb-2">
              {currentQuestion.title}
            </h2>
            <p className="text-slate-500 text-xs leading-relaxed mb-4 lg:mb-6">
              {currentQuestion.description}
            </p>

            <div className="grid grid-cols-2 gap-3 mb-4 lg:mb-6 shrink-0">
              {currentQuestion.options.map((option, idx) => {
              const isCorrect = idx === currentQuestion.correctAnswer;
              const isSelected = selectedAnswer === idx;
              let variant = "bg-slate-900/40 border-slate-800 text-slate-400 hover:bg-slate-800 hover:border-slate-700";
              if (isAnswered) {
                if (isSelected) {
                  variant = isCorrect ? "bg-emerald-500/10 border-emerald-500 text-emerald-400 font-bold" : "bg-rose-500/10 border-rose-500 text-rose-400 font-bold";
                } else if (isCorrect) {
                  variant = "bg-emerald-500/10 border-emerald-500/40 text-emerald-400/60";
                } else {
                  variant = "bg-slate-900/20 border-slate-800/50 text-slate-700";
                }
              }
              return <button key={idx} id={`option-${idx}`} disabled={isAnswered} onClick={() => handleAnswerSelect(idx)} className={`w-full p-3 lg:p-4 rounded-2xl border-2 text-left font-mono text-sm lg:text-base transition-all flex items-center justify-between group ${variant} ${!isAnswered && "active:scale-[0.98]"}`}>
                    <span className="flex items-center gap-3 lg:gap-4">
                      <span className={`w-6 h-6 lg:w-7 lg:h-7 rounded-lg flex items-center justify-center text-[10px] font-bold border transition-colors ${isSelected ? "bg-brand-600 border-brand-400 text-black" : "bg-slate-800/50 border-slate-700 text-slate-500 group-hover:border-brand-500 group-hover:text-brand-400"}`}>
                        {String.fromCharCode(65 + idx)}
                      </span>
                      {option}
                    </span>
                    {isAnswered && isCorrect && <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-slate-900 shrink-0">
                        <CheckCircle2 className="w-3 h-3" />
                      </div>}
                    {isAnswered && isSelected && !isCorrect && <div className="w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center text-slate-900 shrink-0">
                        <XCircle className="w-3 h-3" />
                      </div>}
                  </button>;
            })}
            </div>

            <div className="mt-auto shrink-0 h-14">
              <AnimatePresence>
                <motion.button initial={{
                opacity: 0,
                scale: 0.9
              }} animate={{
                opacity: 1,
                scale: 1
              }} id="next-step-btn" disabled={!isAnswered} onClick={handleNext} className={` disabled:bg-slate-800 disabled:text-slate-400 w-full py-4 rounded-2xl font-black text-base flex items-center justify-center gap-3 transition-all shadow-xl ${questionIdx === TOTAL_QUESTIONS - 1 ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/20" : "bg-brand-600 hover:bg-brand-500 text-black shadow-brand-950/20"}`}>
                  {questionIdx === TOTAL_QUESTIONS - 1 ? "COMPLETE CHALLENGE" : "CONTINUE"}
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Right Panel: Flowchart Visualization */}
        <motion.div key={`flow-viz-${questionIdx}`} initial={{
        opacity: 0,
        x: 30
      }} animate={{
        opacity: 1,
        x: 0
      }} className="quiz-flow-panel flex flex-col">
          <div className="flex-1 min-h-0 min-w-0 overflow-hidden flex items-center justify-center bg-slate-900/40 border border-slate-800 rounded-3xl relative group">
            <Flowchart data={currentQuestion.flowchart} className="w-full h-full border-none bg-transparent" />
          </div>
        </motion.div>
      </main>;
  };
  const renderResult = () => {
    const stats = Object.fromEntries(LEVELS.map(level => [level, {
      total: QUESTIONS_PER_LEVEL,
      correct: results.filter(r => r.difficulty === level && r.correct).length
    }]));
    return <motion.div initial={{
      opacity: 0,
      scale: 0.95
    }} animate={{
      opacity: 1,
      scale: 1
    }} className="flex-grow flex items-center justify-center lg:p-6 overflow-y-auto custom-scrollbar">
        <div className="bg-slate-900/60 border border-slate-800 p-4 lg:p-8 rounded-[2.5rem] max-w-4xl w-full text-center shadow-2xl backdrop-blur-md my-auto relative scale-[0.9] lg:scale-100">
          <div className="relative mb-2 lg:mb-4 inline-block">
            <div className="w-10 h-10 lg:w-14 lg:h-14 bg-slate-900 rounded-2xl lg:rounded-3xl flex items-center justify-center border border-slate-800 shadow-2xl overflow-hidden relative">
              <Trophy className="w-5 h-5 lg:w-7 lg:h-7 text-brand-500 relative z-10" />
            </div>
          </div>

          <h2 className="text-3xl font-black text-white mb-0.5 lg:mb-1 tracking-tighter uppercase">
            Challenge Complete
          </h2>
          <p className="text-slate-500 mb-4 lg:mb-8 max-w-md mx-auto font-medium text-sm italic">
            Great job! You've navigated through the logic flows.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-8 mb-6 lg:mb-10 text-left">
            <div className="space-y-3 lg:space-y-4">
              <div className="grid grid-cols-2 gap-2 lg:gap-4">
                <div className="bg-slate-950/60 p-2.5 lg:p-4 rounded-xl border border-slate-800/60 text-center">
                  <div className="text-[8px] font-black text-brand-400 uppercase tracking-[0.2em] mb-0.5 lg:mb-1 font-mono">
                    Final Score
                  </div>
                  <div className="text-2xl font-mono font-black text-white">
                    {score}
                  </div>
                </div>
                <div className="bg-slate-950/60 p-2.5 lg:p-4 rounded-xl border border-slate-800/60 text-center">
                  <div className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] mb-0.5 lg:mb-1 font-mono">
                    Steps Taken
                  </div>
                  <div className="text-2xl font-mono font-black text-brand-500">
                    {results.length}/{TOTAL_QUESTIONS}
                  </div>
                </div>
              </div>

              <div className="bg-slate-950/40 p-2 lg:p-3 rounded-xl border border-slate-800/40 text-center">
                <div className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] mb-0.5 font-mono">
                  Personal Best
                </div>
                <div className="text-lg font-mono font-black text-slate-300">
                  {highScore}
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-center space-y-2.5 lg:space-y-3">
              {LEVELS.map(diff => <div key={diff} className="space-y-1 lg:space-y-1.5">
                  <div className="flex justify-between text-[8px] lg:text-[10px] font-black uppercase tracking-widest px-1">
                    <span className={diff === "easy" ? "text-emerald-400" : diff === "medium" ? "text-amber-400" : "text-rose-400"}>
                      {diff} level
                    </span>
                    <span className="text-slate-400">
                      {stats[diff].correct}/{stats[diff].total}
                    </span>
                  </div>
                  <div className="h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
                    <motion.div initial={{
                  width: 0
                }} animate={{
                  width: `${stats[diff].correct / stats[diff].total * 100}%`
                }} className={`h-full rounded-full ${diff === "easy" ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" : diff === "medium" ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]" : "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]"}`} />
                  </div>
                </div>)}
            </div>
          </div>

          <div className="flex md:flex-row flex-col gap-2.5 lg:gap-3.5">
            <button onClick={() => setShowSequenceMap(true)} className="w-full py-3 bg-slate-800 text-white rounded-xl font-black text-xs flex items-center justify-center gap-2.5 hover:bg-slate-700 transition-all border border-slate-700 active:scale-95 shadow-xl">
              <Layout className="w-3.5 h-3.5 shadow-sm" />
              SHOW SEQUENCE MAP
            </button>

            <button id="restart-btn" onClick={() => {
            resetQuizContent();
            setCurrentStep("start");
          }} className="w-full py-3 bg-brand-600 hover:bg-brand-500 text-black rounded-xl font-black text-xs flex items-center justify-center gap-2.5 transition-all shadow-xl active:scale-95">
              <RotateCcw className="w-3.5 h-3.5" />
              BACK TO DASHBOARD
            </button>
          </div>

          {/* Sequence Map Modal */}
          <AnimatePresence>
            {showSequenceMap && <>
                <motion.div initial={{
              opacity: 0
            }} animate={{
              opacity: 1
            }} exit={{
              opacity: 0
            }} onClick={() => setShowSequenceMap(false)} className="fixed inset-0 bg-slate-950/80 rounded-4xl backdrop-blur-sm z-[100] cursor-pointer" />
                <motion.div initial={{
              opacity: 0,
              scale: 0.95
            }} animate={{
              opacity: 1,
              scale: 1
            }} exit={{
              opacity: 0,
              scale: 0.95
            }} className="fixed inset-0 w-full bg-slate-950 rounded-4xl z-[101] flex flex-col items-center justify-center p-20">
                  <button onClick={() => setShowSequenceMap(false)} className="fixed top-3 right-3 md:top-8 md:right-8 w-12 h-12 flex items-center justify-center bg-slate-800/50 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-all z-[102]">
                    <X className="w-6 h-6" />
                  </button>

                  <div className="w-full max-w-4xl mx-auto flex flex-col items-center">
                    <div className="text-center mb-12">
                      <h3 className="text-xl lg:text-3xl font-black text-white uppercase tracking-tighter">
                        Sequence Map
                      </h3>
                      <p className="text-slate-400 text-[10px] md:text-sm font-medium opacity-60">
                        Your analytical accuracy throughout the algorithm
                        challenge
                      </p>
                    </div>

                    <div className="grid grid-cols-5 md:grid-cols-10 gap-y-3 lg:gap-5 md:w-3/4 w-full">
                      {results.map((res, i) => <div key={i} className="flex flex-col items-center gap-2">
                          <div title={`Q${i + 1}: ${res.difficulty}`} className={`lg:w-full w-1/2 aspect-square rounded-full border-2 transition-all cursor-default flex items-center justify-center ${res.correct ? res.difficulty === "easy" ? "bg-emerald-500/20 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.15)]" : res.difficulty === "medium" ? "bg-amber-500/20 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.15)]" : "bg-rose-500/20 border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.15)]" : "bg-slate-900 border-slate-800 opacity-20"}`}>
                            <span className={`text-[10px] font-black ${res.correct ? "text-white" : "text-slate-700"}`}>
                              {i + 1}
                            </span>
                          </div>
                        </div>)}
                    </div>

                    <div className="flex flex-wrap justify-center gap-4 lg:gap-12 w-full pt-12">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-lg bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                        <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">
                          EASY LEVEL
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-lg bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
                        <span className="text-[8px] font-black text-amber-400 uppercase tracking-widest">
                          MEDIUM LEVEL
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-lg bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]"></div>
                        <span className="text-[8px] font-black text-rose-400 uppercase tracking-widest">
                          HARD LEVEL
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </>}
          </AnimatePresence>
        </div>
      </motion.div>;
  };
  return <div className="app-shell bg-slate-950 text-slate-200 font-sans selection:bg-brand-500 selection:text-black">
      {/* Top Navigation Bar */}
      <nav className="relative w-full min-h-16 py-2 border-b border-slate-800/60 bg-slate-950/50 backdrop-blur-md flex items-center justify-between px-4 md:px-8 flex-shrink-0 z-50">
        <button aria-label="Go to dashboard" onClick={() => setCurrentStep("start")} className="shrink-0 rounded-lg bg-black px-2 focus-visible:outline-2 focus-visible:outline-brand-400 transition-opacity hover:opacity-85">
          <BrandLogo className="w-28 sm:w-36 h-12" />
        </button>

        {currentStep === "quiz" && <div className="flex items-center gap-3 md:gap-10">
            <div className="md:flex hidden flex-col items-end">
              <span className="text-[10px] uppercase tracking-widest text-slate-500 font-black">
                Progress
              </span>
              <div className="w-56 h-2 bg-slate-800/80 rounded-full mt-1.5 overflow-hidden border border-slate-700/50">
                <motion.div initial={{
              width: 0
            }} animate={{
              width: `${questionIdx / TOTAL_QUESTIONS * 100}%`
            }} className="h-full bg-brand-500 rounded-full shadow-[0_0_8px_rgba(255,149,0,0.5)]" />
              </div>
            </div>
            <div className="h-8 w-px bg-slate-800"></div>
            <div className="flex flex-col items-center">
              <span className="text-[10px] uppercase tracking-widest text-slate-500 font-black">
                Score
              </span>
              <span className="text-lg font-mono font-black text-brand-400">
                {score.toString().padStart(2, "0")}
              </span>
            </div>
            <button onClick={() => setCurrentStep("start")} className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-400 rounded-xl text-xs font-bold border border-slate-800 transition-all">
              EXIT
            </button>
          </div>}
      </nav>

      <div className="app-content bg-slate-950/20">
        <AnimatePresence mode="wait">
          {currentStep === "start" && renderStart()}
          {currentStep === "mistakes" && <Mistakes key="mistakes" mistakes={progress.mistakes} onBack={() => setCurrentStep("start")} />}
          {currentStep === "quiz" && renderQuiz()}
          {currentStep === "result" && renderResult()}
        </AnimatePresence>
      </div>

      {/* Bottom Status Bar */}
      <footer className="app-footer z-[200] w-full min-h-10 bg-slate-950 border-t border-slate-800/60 flex items-center justify-center px-8 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 flex-shrink-0">
        <span>by Fakhri Gajar</span>
      </footer>
    </div>;
}
