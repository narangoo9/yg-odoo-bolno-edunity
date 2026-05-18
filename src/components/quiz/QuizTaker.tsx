"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Clock, CheckCircle2, XCircle, ArrowRight, ArrowLeft,
  Trophy, RotateCcw, BookOpen, AlertCircle, Loader2,
} from "lucide-react";
import { startQuizAttempt, submitQuiz } from "@/modules/quizzes/application/actions";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/index";
import { cn } from "@/lib/utils";

interface QuizMeta {
  id: string;
  title: string;
  description: string | null;
  timeLimit: number | null;
  passingScore: number;
  maxAttempts: number;
  courseTitle: string;
  courseId: string;
  questionCount: number;
  totalPoints: number;
}

interface Question {
  id: string;
  type: string;
  text: string;
  points: number;
  mediaUrl: string | null;
  options: { id: string; text: string }[];
}

interface Props {
  quiz: QuizMeta;
  attemptsUsed: number;
  canRetake: boolean;
  bestScore: number | null;
  bestMaxScore: number | null;
}

type Stage = "intro" | "taking" | "result";

export function QuizTaker(props: Props) {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("intro");
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [textAnswers, setTextAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [result, setResult] = useState<{ score: number; maxScore: number; percentage: number; passed: boolean } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = useCallback(() => {
    if (!attemptId) return;
    startTransition(async () => {
      const payload = questions.map((q) => ({
        questionId: q.id,
        selectedIds: answers[q.id] ?? [],
        textAnswer: textAnswers[q.id],
      }));
      const result = await submitQuiz({ attemptId, answers: payload });
      if ("error" in result) return;
      setResult(result.data!);
      setStage("result");
    });
  }, [attemptId, questions, answers, textAnswers]);

  // Timer
  useEffect(() => {
    if (stage !== "taking" || timeLeft === null) return;
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }
    const t = setTimeout(() => setTimeLeft((prev) => (prev ?? 0) - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, stage, handleSubmit]);

  const handleStart = () => {
    startTransition(async () => {
      const result = await startQuizAttempt(props.quiz.id);
      if ("error" in result) return;
      setAttemptId(result.data!.attempt.id);
      setQuestions(result.data!.questions);
      setStage("taking");
      if (props.quiz.timeLimit) setTimeLeft(props.quiz.timeLimit * 60);
    });
  };

  const toggleOption = (questionId: string, optionId: string, multi: boolean) => {
    setAnswers((prev) => {
      const current = prev[questionId] ?? [];
      if (multi) {
        return {
          ...prev,
          [questionId]: current.includes(optionId)
            ? current.filter((x) => x !== optionId)
            : [...current, optionId],
        };
      }
      return { ...prev, [questionId]: [optionId] };
    });
  };

  // ─── INTRO STAGE ────────────────────────────────────────────────────────────
  if (stage === "intro") {
    return (
      <div className="max-w-2xl mx-auto animate-fade-up">
        <Link href={`/student/courses/${props.quiz.courseId}/learn`} className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-4">
          <ArrowLeft size={14} /> Курс руу буцах
        </Link>

        <div className="bg-white rounded-2xl border border-border p-8">
          <div className="text-xs text-muted-foreground/80 mb-1">{props.quiz.courseTitle}</div>
          <h1 className="text-2xl font-bold text-foreground mb-2">{props.quiz.title}</h1>
          {props.quiz.description && (
            <p className="text-muted-foreground text-sm leading-relaxed mb-6">{props.quiz.description}</p>
          )}

          {/* Meta grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <InfoBox label="Асуулт" value={`${props.quiz.questionCount}`} />
            <InfoBox label="Нийт оноо" value={`${props.quiz.totalPoints}`} />
            <InfoBox label="Хугацаа" value={props.quiz.timeLimit ? `${props.quiz.timeLimit} мин` : "Хязгааргүй"} />
            <InfoBox label="Тэнцэх" value={`${props.quiz.passingScore}%`} />
          </div>

          {/* Previous attempts */}
          {props.attemptsUsed > 0 && (
            <div className="bg-muted/50 rounded-xl p-4 mb-6 flex items-start gap-3">
              <Trophy size={18} className="text-amber-500 shrink-0 mt-0.5" />
              <div className="flex-1 text-sm">
                <p className="font-medium text-foreground">
                  Өмнөх оролдлого: {props.attemptsUsed}/{props.quiz.maxAttempts}
                </p>
                {props.bestScore !== null && props.bestMaxScore && (
                  <p className="text-muted-foreground mt-0.5">
                    Хамгийн сайн үр дүн: {props.bestScore}/{props.bestMaxScore} (
                    {Math.round((props.bestScore / props.bestMaxScore) * 100)}%)
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Rules */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertCircle size={18} className="text-blue-500 shrink-0 mt-0.5" />
            <div className="text-xs text-blue-900 leading-relaxed">
              <p className="font-medium mb-1">Анхаарах зүйлс:</p>
              <ul className="space-y-0.5 list-disc ml-4">
                <li>Нэг удаа эхлүүлсний дараа зогсоох боломжгүй</li>
                {props.quiz.timeLimit && <li>Хугацаа дуусахад автомат илгээгдэнэ</li>}
                <li>Илгээсний дараа үр дүн шууд гарна</li>
              </ul>
            </div>
          </div>

          {!props.canRetake ? (
            <div className="text-center py-4">
              <p className="text-red-600 font-medium mb-1">Оролдлогын тоо дууслаа</p>
              <p className="text-muted-foreground text-sm">Та энэ шалгалтыг дахин өгөх боломжгүй</p>
            </div>
          ) : (
            <Button onClick={handleStart} disabled={isPending} size="lg" className="w-full">
              {isPending ? (
                <><Loader2 size={16} className="animate-spin mr-2" /> Эхлүүлж байна...</>
              ) : (
                <>Шалгалт эхлүүлэх <ArrowRight size={16} /></>
              )}
            </Button>
          )}
        </div>
      </div>
    );
  }

  // ─── TAKING STAGE ────────────────────────────────────────────────────────────
  if (stage === "taking") {
    const question = questions[currentIdx];
    const selected = answers[question.id] ?? [];
    const isMulti = question.type === "MULTIPLE_CHOICE";
    const answeredCount = questions.filter(
      (q) => (answers[q.id]?.length ?? 0) > 0 || textAnswers[q.id]
    ).length;

    return (
      <div className="max-w-3xl mx-auto animate-fade-up">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-muted-foreground">{props.quiz.title}</p>
            <p className="text-sm font-semibold text-foreground">
              Асуулт {currentIdx + 1} / {questions.length}
            </p>
          </div>
          {timeLeft !== null && (
            <div className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono text-sm font-bold",
              timeLeft < 60 ? "bg-red-50 text-red-600 border border-red-200" : "bg-muted text-foreground"
            )}>
              <Clock size={14} />
              {formatTime(timeLeft)}
            </div>
          )}
        </div>

        {/* Progress */}
        <Progress value={(answeredCount / questions.length) * 100} className="mb-6 h-1" />

        {/* Question card */}
        <div className="bg-white rounded-2xl border border-border p-6 mb-4">
          <div className="flex items-start gap-3 mb-5">
            <span className="w-8 h-8 rounded-lg bg-violet-600 text-white text-sm font-bold flex items-center justify-center shrink-0">
              {currentIdx + 1}
            </span>
            <div className="flex-1">
              <p className="text-foreground font-medium leading-relaxed">{question.text}</p>
              <p className="text-xs text-muted-foreground/80 mt-1">{question.points} оноо</p>
            </div>
          </div>

          {question.mediaUrl && (
            <img src={question.mediaUrl} className="rounded-lg mb-4 max-h-60 mx-auto" alt="" />
          )}

          {/* Options */}
          {(question.type === "SINGLE_CHOICE" || question.type === "MULTIPLE_CHOICE" || question.type === "TRUE_FALSE") && (
            <div className="space-y-2">
              {question.options.map((opt) => {
                const isSelected = selected.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    onClick={() => toggleOption(question.id, opt.id, isMulti)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all",
                      isSelected
                        ? "border-slate-900 bg-violet-600 text-white"
                        : "border-border bg-white hover:border-slate-300 hover:bg-muted/50"
                    )}
                  >
                    <div className={cn(
                      "w-5 h-5 shrink-0 flex items-center justify-center",
                      isMulti ? "rounded" : "rounded-full",
                      "border-2",
                      isSelected ? "border-white bg-white" : "border-slate-300"
                    )}>
                      {isSelected && (
                        isMulti
                          ? <CheckCircle2 size={12} className="text-foreground" />
                          : <div className="w-2 h-2 bg-violet-600 rounded-full" />
                      )}
                    </div>
                    <span className="text-sm">{opt.text}</span>
                  </button>
                );
              })}
            </div>
          )}

          {question.type === "SHORT_ANSWER" && (
            <textarea
              value={textAnswers[question.id] ?? ""}
              onChange={(e) => setTextAnswers((prev) => ({ ...prev, [question.id]: e.target.value }))}
              rows={4}
              placeholder="Хариултаа бичнэ үү..."
              className="w-full p-3 border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-slate-300 resize-none"
            />
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
            disabled={currentIdx === 0}
          >
            <ArrowLeft size={14} /> Өмнөх
          </Button>

          <div className="flex-1 flex flex-wrap gap-1.5 justify-center">
            {questions.map((q, i) => {
              const answered = (answers[q.id]?.length ?? 0) > 0 || textAnswers[q.id];
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIdx(i)}
                  className={cn(
                    "w-7 h-7 rounded text-xs font-medium transition-colors",
                    i === currentIdx
                      ? "bg-violet-600 text-white"
                      : answered
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-muted text-muted-foreground hover:bg-muted"
                  )}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>

          {currentIdx === questions.length - 1 ? (
            <Button variant="success" onClick={handleSubmit} disabled={isPending}>
              {isPending ? <><Loader2 size={14} className="animate-spin mr-1" /> Илгээж байна...</> : "Илгээх"}
            </Button>
          ) : (
            <Button onClick={() => setCurrentIdx((i) => Math.min(questions.length - 1, i + 1))}>
              Дараах <ArrowRight size={14} />
            </Button>
          )}
        </div>
      </div>
    );
  }

  // ─── RESULT STAGE ────────────────────────────────────────────────────────────
  if (stage === "result" && result) {
    return (
      <div className="max-w-lg mx-auto animate-fade-up text-center">
        <div className="bg-white rounded-2xl border border-border p-8">
          <div className={cn(
            "w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4",
            result.passed ? "bg-emerald-100" : "bg-red-100"
          )}>
            {result.passed
              ? <Trophy size={36} className="text-emerald-600" />
              : <XCircle size={36} className="text-red-500" />
            }
          </div>

          <h2 className="text-2xl font-bold text-foreground mb-1">
            {result.passed ? "Баяр хүргэе! 🎉" : "Харамсалтай нь"}
          </h2>
          <p className="text-muted-foreground text-sm mb-6">
            {result.passed ? "Та шалгалтаа амжилттай тэнцлээ" : "Та шалгалтаа тэнцсэнгүй"}
          </p>

          <div className="bg-muted/50 rounded-xl p-5 mb-5">
            <p className="text-5xl font-bold text-foreground">{result.percentage}%</p>
            <p className="text-sm text-muted-foreground mt-1">
              {result.score} / {result.maxScore} оноо
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" asChild className="flex-1">
              <Link href={`/student/courses/${props.quiz.courseId}/learn`}>
                <BookOpen size={14} /> Курс руу
              </Link>
            </Button>
            {!result.passed && props.attemptsUsed + 1 < props.quiz.maxAttempts && (
              <Button onClick={() => { setStage("intro"); setResult(null); router.refresh(); }} className="flex-1">
                <RotateCcw size={14} /> Дахин оролдох
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-muted/50 rounded-lg p-3 text-center">
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className="text-sm font-bold text-foreground">{value}</p>
    </div>
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}
