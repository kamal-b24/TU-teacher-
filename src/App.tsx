/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, 
  FileText, 
  BookOpen, 
  ChevronRight, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Loader2,
  Trash2,
  Plus,
  BarChart3
} from 'lucide-react';
import { analyzeExam } from './services/geminiService';
import { AppState, UploadedFile, ExamAnalysisResult } from './types';

export default function App() {
  const [gameState, setGameState] = useState<AppState>('HOME');
  const [questionPapers, setQuestionPapers] = useState<UploadedFile[]>([]);
  const [answerSheets, setAnswerSheets] = useState<UploadedFile[]>([]);
  const [result, setResult] = useState<ExamAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = (type: 'QP' | 'AS', files: FileList | null) => {
    if (!files) return;
    
    const newFiles: UploadedFile[] = Array.from(files).map((file) => ({
      id: Math.random().toString(36).substring(7),
      file,
      preview: URL.createObjectURL(file)
    }));

    if (type === 'QP') {
      setQuestionPapers((prev) => [...prev, ...newFiles]);
    } else {
      setAnswerSheets((prev) => [...prev, ...newFiles]);
    }
    setError(null);
  };

  const removeFile = (type: 'QP' | 'AS', id: string) => {
    if (type === 'QP') {
      setQuestionPapers((prev) => prev.filter(f => f.id !== id));
    } else {
      setAnswerSheets((prev) => prev.filter(f => f.id !== id));
    }
  };

  const startAnalysis = async () => {
    if (questionPapers.length === 0 || answerSheets.length === 0) {
      setError("Please upload both the Question Paper and the Answer Sheet.");
      return;
    }

    setGameState('ANALYSING');
    setError(null);

    try {
      const qpFiles = questionPapers.map(f => f.file);
      const asFiles = answerSheets.map(f => f.file);
      const analysisResult = await analyzeExam(qpFiles, asFiles);
      setResult(analysisResult);
      setGameState('RESULT');
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
      setGameState('HOME');
    }
  };

  const reset = () => {
    setGameState('HOME');
    setQuestionPapers([]);
    setAnswerSheets([]);
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-natural-bg text-gray-800 font-sans">
      <header className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-10 backdrop-blur-md bg-white/80">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2" onClick={reset} style={{ cursor: 'pointer' }}>
            <div className="bg-natural-olive p-2 rounded-xl text-white">
              <CheckCircle2 size={24} />
            </div>
            <h1 className="text-xl font-serif font-bold tracking-tight text-natural-olive uppercase">GradeMate AI</h1>
          </div>
          {gameState === 'RESULT' && (
            <button 
              onClick={reset}
              className="text-sm font-medium text-natural-olive hover:opacity-70 transition-opacity"
            >
              New Scan
            </button>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 pb-24">
        <AnimatePresence mode="wait">
          {gameState === 'HOME' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="text-center space-y-2">
                <h2 className="text-4xl font-serif font-semibold text-natural-olive md:text-5xl">Intelligent Exam Checker</h2>
                <p className="text-gray-500 max-w-lg mx-auto italic font-serif">Upload your exam papers and let Gemini AI grade them with expert precision.</p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3">
                  <AlertCircle size={20} />
                  <p className="text-sm font-medium">{error}</p>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-6">
                {/* Question Paper Section */}
                <div className="bg-white rounded-3xl p-6 shadow-card border border-gray-50 space-y-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-[#5A5A40]/10 p-2 rounded-xl text-natural-olive">
                      <BookOpen size={20} />
                    </div>
                    <h3 className="font-serif font-semibold text-xl text-natural-olive">Question Paper</h3>
                  </div>
                  
                  <div className="relative group">
                    <input 
                      type="file" 
                      multiple 
                      accept="image/*"
                      onChange={(e) => handleFileUpload('QP', e.target.files)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="border border-dashed border-gray-200 rounded-2xl py-8 px-4 flex flex-col items-center justify-center gap-2 group-hover:bg-gray-50 transition-colors bg-white">
                      <Upload size={24} className="text-gray-300 group-hover:text-natural-olive" />
                      <span className="text-sm font-medium text-gray-600">Upload Images</span>
                      <span className="text-xs text-gray-400">Supports multiple pages</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 overflow-y-auto max-h-48 pt-2">
                    {questionPapers.map((file) => (
                      <div key={file.id} className="relative aspect-[3/4] rounded-xl overflow-hidden border border-gray-100 group shadow-sm">
                        <img src={file.preview} className="w-full h-full object-cover" alt="Preview" />
                        <button 
                          onClick={() => removeFile('QP', file.id)}
                          className="absolute top-1 right-1 p-1 bg-white/90 hover:bg-white rounded-full text-natural-fail opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Answer Sheet Section */}
                <div className="bg-white rounded-3xl p-6 shadow-card border border-gray-50 space-y-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-natural-success/10 p-2 rounded-xl text-natural-success">
                      <FileText size={20} />
                    </div>
                    <h3 className="font-serif font-semibold text-xl text-natural-olive">Answer Sheet</h3>
                  </div>
                  
                  <div className="relative group">
                    <input 
                      type="file" 
                      multiple 
                      accept="image/*"
                      onChange={(e) => handleFileUpload('AS', e.target.files)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="border border-dashed border-gray-200 rounded-2xl py-8 px-4 flex flex-col items-center justify-center gap-2 group-hover:bg-gray-50 transition-colors bg-white">
                      <Upload size={24} className="text-gray-300 group-hover:text-natural-success" />
                      <span className="text-sm font-medium text-gray-600">Upload Images</span>
                      <span className="text-xs text-gray-400">Handwritten pages</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 overflow-y-auto max-h-48 pt-2">
                    {answerSheets.map((file) => (
                      <div key={file.id} className="relative aspect-[3/4] rounded-xl overflow-hidden border border-gray-100 group shadow-sm">
                        <img src={file.preview} className="w-full h-full object-cover" alt="Preview" />
                        <button 
                          onClick={() => removeFile('AS', file.id)}
                          className="absolute top-1 right-1 p-1 bg-white/90 hover:bg-white rounded-full text-natural-fail opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-center pt-4">
                <button
                  onClick={startAnalysis}
                  disabled={questionPapers.length === 0 || answerSheets.length === 0}
                  className={`
                    w-full max-w-sm flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-semibold text-lg transition-all
                    ${(questionPapers.length > 0 && answerSheets.length > 0) 
                      ? 'bg-natural-olive text-white hover:opacity-90 shadow-card' 
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
                  `}
                >
                  Analyze & Check
                  <ChevronRight size={20} />
                </button>
              </div>

              <div className="pt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
                <FeatureCard 
                  icon={<CheckCircle2 size={18} />} 
                  title="Strict Grading" 
                  desc="Follows paper rules strictly" 
                />
                <FeatureCard 
                  icon={<AlertCircle size={18} />} 
                  title="Error Detection" 
                  desc="Points out exact mistakes" 
                />
                <FeatureCard 
                  icon={<BarChart3 size={18} />} 
                  title="Detailed Breakdown" 
                  desc="Marks for every question" 
                />
                <FeatureCard 
                  icon={<FileText size={18} />} 
                  title="Zero Bias" 
                  desc="Fair and accurate marking" 
                />
              </div>
            </motion.div>
          )}

          {gameState === 'ANALYSING' && (
            <motion.div
              key="analysing"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="flex flex-col items-center justify-center space-y-8 py-20"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-natural-olive/10 blur-3xl rounded-full scale-150 animate-pulse"></div>
                <div className="relative bg-white p-8 rounded-full shadow-card border border-gray-50">
                  <Loader2 size={64} className="text-natural-olive animate-spin" strokeWidth={1.5} />
                </div>
              </div>
              <div className="text-center space-y-3">
                <h2 className="text-3xl font-serif font-bold text-natural-olive">Analyzing Your Papers...</h2>
                <div className="space-y-1">
                  <p className="text-gray-500 animate-pulse font-serif italic text-lg">Reading handwritten content</p>
                  <p className="text-xs text-gray-400 uppercase tracking-widest font-mono">Comparing with marking scheme</p>
                </div>
              </div>
              <div className="w-full max-w-xs bg-gray-200 h-1.5 rounded-full overflow-hidden">
                <motion.div 
                  className="bg-natural-olive h-full"
                  initial={{ width: "0%" }}
                  animate={{ width: "95%" }}
                  transition={{ duration: 15, ease: "linear" }}
                />
              </div>
              <p className="text-xs text-slate-400 text-center max-w-xs italic">
                Scanning multiple pages can take a moment. Gemini is performing deep visual analysis.
              </p>
            </motion.div>
          )}

          {gameState === 'RESULT' && result && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* Score Display */}
              <div className="relative rounded-3xl bg-white shadow-card border border-gray-100 overflow-hidden">
                <div className={`h-1.5 w-full ${result.percentage >= 45 ? 'bg-natural-success' : 'bg-natural-fail'}`} />
                <div className="p-8 flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="space-y-4 text-center md:text-left">
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">{result.subject} Evaluation</p>
                      <h2 className="text-5xl font-serif font-semibold text-natural-olive">Final Assessment</h2>
                    </div>
                    
                    <div className="flex items-center gap-3 justify-center md:justify-start">
                      <div className={`px-5 py-1.5 rounded-full font-bold text-sm flex items-center gap-2 ${result.percentage >= 45 ? 'bg-emerald-50 text-natural-success border border-emerald-100' : 'bg-red-50 text-natural-fail border border-red-100'}`}>
                        {result.percentage >= 45 ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                        {result.gradingStatus === 'Pass' ? 'PASS' : 'FAIL'}
                      </div>
                      <span className="text-gray-500 font-serif italic">Score: <span className="font-sans font-bold text-gray-800">{result.totalMarksObtained}</span> / {result.totalMaximumMarks}</span>
                    </div>
                  </div>

                  <div className="relative flex flex-col items-center">
                    <svg className="w-36 h-36 transform -rotate-90">
                      <circle
                        cx="72"
                        cy="72"
                        r="64"
                        stroke="currentColor"
                        strokeWidth="6"
                        fill="transparent"
                        className="text-gray-100"
                      />
                      <motion.circle
                        cx="72"
                        cy="72"
                        r="64"
                        stroke="currentColor"
                        strokeWidth="6"
                        fill="transparent"
                        strokeDasharray={402.1}
                        initial={{ strokeDashoffset: 402.1 }}
                        animate={{ strokeDashoffset: 402.1 - (402.1 * result.percentage) / 100 }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className={result.percentage >= 45 ? 'text-natural-success' : 'text-natural-fail'}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-4xl font-serif font-bold text-gray-800">{Math.round(result.percentage)}%</span>
                    </div>
                  </div>
                </div>

                {result.questions.some(q => !q.isReadable) && (
                  <div className="mx-8 mb-6 p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-center gap-3 text-amber-800">
                    <AlertCircle size={20} className="shrink-0" />
                    <div>
                      <p className="text-sm font-bold font-serif">Unreadable Pages Detected</p>
                      <p className="text-xs font-serif italic">The examiner had difficulty reading some parts. Please ensure clarity in future uploads.</p>
                    </div>
                  </div>
                )}
                {result.overallComments && (
                  <div className="px-8 pb-8">
                    <div className="p-5 bg-[#F5F5F0] rounded-2xl border border-gray-100 italic text-gray-600 text-sm font-serif leading-relaxed">
                      "{result.overallComments}"
                    </div>
                  </div>
                )}
              </div>

              {/* Detailed Marksheet */}
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <h3 className="text-2xl font-serif font-semibold text-natural-olive flex items-center gap-2">
                    Evaluation Details
                  </h3>
                  <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Question-wise Breakdown</p>
                </div>
                
                <div className="space-y-4">
                  {result.questions.map((q, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className={`bg-white p-6 rounded-3xl shadow-card border-l-4 ${q.marksAwarded === q.maxMarks ? 'border-natural-success' : q.marksAwarded === 0 ? 'border-natural-fail' : 'border-amber-400'}`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <span className="font-serif font-bold text-gray-400 italic">Q{q.questionNumber}.</span>
                          <span className="font-bold text-gray-800">Review</span>
                          {!q.isReadable && (
                            <span className="bg-amber-50 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-100">
                              LOW CLARITY
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <span className={`font-serif font-bold text-2xl ${q.marksAwarded === q.maxMarks ? 'text-natural-success' : q.marksAwarded === 0 ? 'text-natural-fail' : 'text-amber-600'}`}>
                            {q.marksAwarded}
                          </span>
                          <span className="text-gray-300 font-serif italic text-sm ml-1">/{q.maxMarks}</span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 leading-relaxed font-serif italic border-t border-gray-50 pt-3">
                        {q.feedback || "The answer meets all required criteria for full marks."}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="flex justify-center pb-12">
                <button 
                  onClick={reset}
                  className="bg-natural-olive text-white px-10 py-4 rounded-2xl font-semibold shadow-card hover:opacity-90 transition-opacity"
                >
                  Conduct New Assessment
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="max-w-4xl mx-auto px-4 py-8 border-t border-slate-200 text-center">
        <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">
          Powered by Gemini AI Vision Technology
        </p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="bg-white p-5 rounded-2xl shadow-card border border-gray-50 space-y-2">
      <div className="text-natural-olive">{icon}</div>
      <h4 className="text-sm font-bold text-natural-olive font-serif uppercase tracking-wider">{title}</h4>
      <p className="text-[10px] text-gray-500 leading-tight italic font-serif">{desc}</p>
    </div>
  );
}

