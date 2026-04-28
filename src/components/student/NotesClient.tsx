"use client";

import { useState, useRef } from "react";
import {
  DndContext, DragOverlay, closestCorners, KeyboardSensor, PointerSensor,
  useSensor, useSensors, type DragStartEvent, type DragOverEvent, type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, sortableKeyboardCoordinates, useSortable,
  verticalListSortingStrategy, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Plus, Trash2, CheckSquare, Square,
  Palette, X, GripVertical, Camera, MoreHorizontal,
  Trophy, Zap, Gift, Check,
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { MascotImage, type MascotVariant } from "@/components/brand/MascotImage";

// ── TYPES ──────────────────────────────────────────────────────────────────────
type CheckItem = { id: string; text: string; done: boolean };
type NoteColor = "white" | "violet" | "amber" | "emerald" | "rose" | "sky";
type BoardCol  = "todo" | "inprogress" | "review" | "done";

type NoteCard = {
  id: string;
  col: BoardCol;
  title: string;
  content: string;
  checklist: CheckItem[];
  color: NoteColor;
  coverImage?: string;
  tags: string[];
  createdAt: Date;
};

// ── COLOR MAPS ─────────────────────────────────────────────────────────────────
const COLOR_MAP: Record<NoteColor, string> = {
  white:   "bg-card",
  violet:  "bg-gradient-to-br from-violet-50/70 to-card dark:from-violet-900/20 dark:to-card",
  amber:   "bg-gradient-to-br from-amber-50/70 to-card dark:from-amber-900/15 dark:to-card",
  emerald: "bg-gradient-to-br from-emerald-50/70 to-card dark:from-emerald-900/15 dark:to-card",
  rose:    "bg-gradient-to-br from-rose-50/70 to-card dark:from-rose-900/15 dark:to-card",
  sky:     "bg-gradient-to-br from-sky-50/70 to-card dark:from-sky-900/15 dark:to-card",
};

const COLOR_DOT: Record<NoteColor, string> = {
  white:   "bg-slate-300 dark:bg-slate-500",
  violet:  "bg-violet-400",
  amber:   "bg-amber-400",
  emerald: "bg-emerald-400",
  rose:    "bg-rose-400",
  sky:     "bg-sky-400",
};

const COL_CONFIG: Record<BoardCol, {
  label: string;
  color: string;
  headerBg: string;
  dot: string;
  badgeBg: string;
}> = {
  todo: {
    label: "To Do",
    color: "text-amber-700 dark:text-amber-300",
    headerBg: "bg-amber-50 border border-amber-100 dark:bg-amber-900/20 dark:border-amber-800/30",
    dot: "bg-amber-400",
    badgeBg: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  },
  inprogress: {
    label: "In Progress",
    color: "text-blue-700 dark:text-blue-300",
    headerBg: "bg-blue-50 border border-blue-100 dark:bg-blue-900/20 dark:border-blue-800/30",
    dot: "bg-blue-400",
    badgeBg: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  },
  review: {
    label: "In Review",
    color: "text-violet-700 dark:text-violet-300",
    headerBg: "bg-violet-50 border border-violet-100 dark:bg-violet-900/20 dark:border-violet-800/30",
    dot: "bg-violet-400",
    badgeBg: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  },
  done: {
    label: "Done",
    color: "text-emerald-700 dark:text-emerald-300",
    headerBg: "bg-emerald-50 border border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800/30",
    dot: "bg-emerald-400",
    badgeBg: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  },
};

const COL_MASCOT: Record<BoardCol, MascotVariant> = {
  todo:       "thinking",
  inprogress: "laptop",
  review:     "thinking",
  done:       "celebrate",
};

const COLS: BoardCol[] = ["todo", "inprogress", "review", "done"];

const SAMPLE: NoteCard[] = [
  {
    id: "1", col: "inprogress", title: "UI/UX Design Notes", color: "violet",
    content: "Key principles from today's lesson",
    checklist: [
      { id: "c1", text: "Study Gestalt principles", done: true },
      { id: "c2", text: "Practice wireframing", done: false },
      { id: "c3", text: "Read Don Norman's book", done: false },
    ],
    tags: ["design", "ux"], createdAt: new Date(),
  },
  {
    id: "2", col: "todo", title: "Web Dev Setup", color: "amber",
    content: "Project setup tasks for this week",
    checklist: [
      { id: "c4", text: "Next.js project", done: true },
      { id: "c5", text: "Tailwind CSS", done: true },
      { id: "c6", text: "Auth flow", done: false },
    ],
    tags: ["coding"], createdAt: new Date(),
  },
  {
    id: "3", col: "done", title: "Study Goals", color: "emerald",
    content: "Complete 5 courses this month and maintain streak.",
    checklist: [
      { id: "c8", text: "Enroll in React course", done: true },
      { id: "c9", text: "Finish lesson 1-5", done: true },
    ],
    tags: ["goals"], createdAt: new Date(),
  },
  {
    id: "4", col: "review", title: "Database Design", color: "sky",
    content: "Review schema before submitting capstone",
    checklist: [
      { id: "c10", text: "Normalize tables", done: true },
      { id: "c11", text: "Add indexes", done: false },
      { id: "c12", text: "Root indexes", done: false },
      { id: "c13", text: "Review with mentor", done: false },
    ],
    tags: ["db", "backend"], createdAt: new Date(),
  },
  {
    id: "5", col: "todo", title: "Learn TypeScript", color: "sky",
    content: "Basic types and composition",
    checklist: [
      { id: "c14", text: "Watch lesson 1", done: false },
      { id: "c15", text: "Practice examples", done: false },
    ],
    tags: ["coding"], createdAt: new Date(),
  },
  {
    id: "6", col: "inprogress", title: "Responsive Layout", color: "violet",
    content: "Build mobile-first layout",
    checklist: [
      { id: "c16", text: "Create grid system", done: false },
      { id: "c17", text: "Test on mobile", done: false },
    ],
    tags: ["design"], createdAt: new Date(),
  },
];

// ── HELPERS ────────────────────────────────────────────────────────────────────
function getCardMascot(tags: string[]): MascotVariant {
  if (tags.some(t => ["coding", "code", "dev", "frontend"].includes(t))) return "laptop";
  if (tags.some(t => ["design", "ux", "ui"].includes(t))) return "thinking";
  if (tags.some(t => ["goals", "goal"].includes(t))) return "fire";
  if (tags.some(t => ["db", "backend", "data"].includes(t))) return "book";
  return "wave";
}

function getProgressColor(pct: number) {
  if (pct === 100) return "from-emerald-400 to-emerald-500";
  if (pct >= 50)   return "from-violet-400 to-violet-600";
  return "from-amber-400 to-orange-400";
}

// ── SORTABLE CHECKLIST ITEM ────────────────────────────────────────────────────
function SortableCheckItem({
  item, onToggle, onEdit, onDelete,
}: {
  item: CheckItem;
  onToggle: () => void;
  onEdit: (text: string) => void;
  onDelete: () => void;
}) {
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({ id: item.id });

  const style = { transform: CSS.Transform.toString(transform), transition };

  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState(item.text);

  const commitEdit = () => {
    const t = draft.trim();
    if (t) onEdit(t);
    else   setDraft(item.text);
    setEditing(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group/check flex items-center gap-1.5 rounded-lg py-0.5 px-1 -mx-1 transition-all",
        isDragging && "opacity-40 scale-95 bg-accent",
      )}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="shrink-0 touch-none cursor-grab active:cursor-grabbing opacity-0 group-hover/check:opacity-60 hover:!opacity-100 transition-opacity"
        tabIndex={-1}
      >
        <GripVertical size={11} className="text-muted-foreground" />
      </button>

      {/* Checkbox */}
      <button onClick={onToggle} className="shrink-0">
        {item.done
          ? <CheckSquare size={13} className="text-emerald-500 fill-emerald-500" />
          : <Square      size={13} className="text-muted-foreground/40" />
        }
      </button>

      {/* Text / editable */}
      {editing ? (
        <input
          autoFocus
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={e => {
            if (e.key === "Enter")  { e.preventDefault(); commitEdit(); }
            if (e.key === "Escape") { setDraft(item.text); setEditing(false); }
          }}
          className="flex-1 text-[11px] bg-transparent border-b border-primary/40 focus:outline-none text-foreground pb-px"
        />
      ) : (
        <button
          onClick={() => { setDraft(item.text); setEditing(true); }}
          className={cn(
            "flex-1 text-[11px] text-left transition-colors hover:text-primary",
            item.done ? "line-through text-muted-foreground/40" : "text-foreground/75",
          )}
        >
          {item.text}
        </button>
      )}

      {/* Delete */}
      <button
        onClick={onDelete}
        className="shrink-0 opacity-0 group-hover/check:opacity-60 hover:!opacity-100 transition-opacity"
      >
        <X size={10} className="text-muted-foreground hover:text-red-500 transition-colors" />
      </button>
    </div>
  );
}

// ── ADD CHECK ITEM INPUT ───────────────────────────────────────────────────────
function AddCheckItem({ onAdd }: { onAdd: (text: string) => void }) {
  const [open, setOpen] = useState(false);
  const [val,  setVal]  = useState("");

  const commit = () => {
    if (val.trim()) onAdd(val.trim());
    setVal("");
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors mt-1 pl-1"
      >
        <Plus size={10} /> Add item
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1.5 mt-1 pl-1">
      <input
        autoFocus
        value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => {
          if (e.key === "Enter")  { e.preventDefault(); commit(); }
          if (e.key === "Escape") { setVal(""); setOpen(false); }
        }}
        onBlur={() => { if (!val.trim()) setOpen(false); }}
        placeholder="Task нэмэх..."
        className="flex-1 text-[11px] bg-muted rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary/30 text-foreground placeholder:text-muted-foreground"
      />
      <button
        onClick={commit}
        className="w-5 h-5 rounded-md bg-primary flex items-center justify-center hover:bg-primary/80 transition-colors"
      >
        <Check size={10} className="text-white" />
      </button>
      <button onClick={() => { setVal(""); setOpen(false); }}>
        <X size={10} className="text-muted-foreground hover:text-foreground transition-colors" />
      </button>
    </div>
  );
}

// ── DAILY GOALS CARD ───────────────────────────────────────────────────────────
function DailyGoalsCard() {
  const [goals, setGoals] = useState([
    { id: "g1", text: "Web Dev Setup-ийн 1 дэд даалгавар хийх", done: true },
    { id: "g2", text: "UI/UX Design Notes унших дуусгах", done: false },
  ]);

  const done  = goals.filter(g => g.done).length;
  const total = goals.length;
  const pct   = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-r from-amber-50 via-card to-amber-50/30 dark:from-amber-900/20 dark:via-card dark:to-amber-900/10 p-4 mb-5">
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          <MascotImage variant="fire" size={60} className="animate-float drop-shadow-md" />
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="text-[14px] font-black text-foreground mb-0.5">Өнөөдрийн зорилго</h2>
          <p className="text-[11px] text-muted-foreground mb-2.5">
            Өнөөдөр 2 task хийвэл streak нэмэгдэнэ 🔥
          </p>
          <div className="space-y-1">
            {goals.map(g => (
              <button
                key={g.id}
                onClick={() =>
                  setGoals(prev => prev.map(i => i.id === g.id ? { ...i, done: !i.done } : i))
                }
                className="flex items-center gap-2 w-full text-left"
              >
                {g.done
                  ? <CheckSquare size={14} className="text-emerald-500 fill-emerald-500 shrink-0" />
                  : <Square      size={14} className="text-muted-foreground/40 shrink-0" />
                }
                <span className={cn(
                  "text-[12px] transition-all",
                  g.done ? "line-through text-muted-foreground/40" : "text-foreground/80",
                )}>
                  {g.text}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="shrink-0 flex flex-col items-center gap-1">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800/40 flex flex-col items-center justify-center">
            <span className="text-[16px] font-black text-amber-600 dark:text-amber-400 leading-none">{done}</span>
            <span className="text-[8px] text-amber-500 dark:text-amber-500 font-semibold">/{total}</span>
          </div>
          <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400">Task</span>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-400 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">{pct}%</span>
      </div>
    </div>
  );
}

// ── REWARD PROGRESS ────────────────────────────────────────────────────────────
function RewardProgress({ doneCount }: { doneCount: number }) {
  const target     = 3;
  const pct        = Math.min(100, Math.round((doneCount / target) * 100));
  const milestones = [1, 2, 3];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-r from-accent/60 via-card to-accent/40 dark:from-violet-900/20 dark:via-card dark:to-violet-900/10 p-4 mt-5">
      <div className="flex items-center gap-5">
        <MascotImage variant="celebrate" size={72} className="shrink-0 animate-float drop-shadow-lg" />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <Trophy size={14} className="text-amber-500 shrink-0" />
            <h3 className="text-[14px] font-black text-foreground">Reward Progress</h3>
          </div>
          <p className="text-[11px] text-muted-foreground mb-3">3 task дуусгавал XP авна!</p>

          <div className="relative">
            <div className="flex-1 h-2 bg-accent dark:bg-violet-900/40 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-violet-400 transition-all duration-700"
                style={{ width: `${pct}%` }}
              />
            </div>
            {milestones.map(m => {
              const reached = doneCount >= m;
              return (
                <div
                  key={m}
                  className={cn(
                    "absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full flex items-center justify-center border-2 transition-all",
                    reached
                      ? "bg-primary border-white dark:border-card shadow-md shadow-violet-300/40"
                      : "bg-card border-border",
                  )}
                  style={{ left: `${((m - 0.5) / target) * 100}%`, transform: "translate(-50%, -50%)" }}
                >
                  <Gift size={8} className={reached ? "text-white" : "text-muted-foreground"} />
                </div>
              );
            })}
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-2 shrink-0">
          {[
            { icon: Zap,    label: "+100 XP",      bg: "bg-violet-50 dark:bg-violet-900/30", border: "border-violet-200 dark:border-violet-800/40", ic: "text-primary",       tc: "text-violet-700 dark:text-violet-300" },
            { icon: Trophy, label: "Streak +1 Day", bg: "bg-amber-50 dark:bg-amber-900/20",  border: "border-amber-200 dark:border-amber-800/40",   ic: "text-amber-500",     tc: "text-amber-700 dark:text-amber-300" },
            { icon: Gift,   label: "Master Badge",  bg: "bg-emerald-50 dark:bg-emerald-900/20", border: "border-emerald-200 dark:border-emerald-800/40", ic: "text-emerald-600", tc: "text-emerald-700 dark:text-emerald-300" },
          ].map(b => (
            <div key={b.label} className={cn("flex flex-col items-center gap-1 rounded-2xl border p-2.5 w-[72px]", b.bg, b.border)}>
              <div className="w-8 h-8 rounded-xl bg-card flex items-center justify-center shadow-sm">
                <b.icon size={16} className={b.ic} />
              </div>
              <span className={cn("text-[9px] font-bold text-center leading-tight", b.tc)}>{b.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── CARD ITEM ──────────────────────────────────────────────────────────────────
function CardItem({
  card, onUpdate, onDelete, isDragging,
}: {
  card: NoteCard;
  onUpdate: (id: string, patch: Partial<NoteCard>) => void;
  onDelete: (id: string) => void;
  isDragging?: boolean;
}) {
  const [showColors,    setShowColors]    = useState(false);
  const [showMenu,      setShowMenu]      = useState(false);
  const [editTitle,     setEditTitle]     = useState(false);
  const [showAllChecks, setShowAllChecks] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Sensors for inner checklist DnD (short drag distance)
  const checkSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const doneCount  = card.checklist.filter(c => c.done).length;
  const totalCount = card.checklist.length;
  const progress   = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
  const cardMascot = getCardMascot(card.tags);

  const visibleChecklist = showAllChecks
    ? card.checklist
    : card.checklist.slice(0, 3);

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onUpdate(card.id, { coverImage: reader.result as string });
    reader.readAsDataURL(file);
  };

  const handleCheckDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = card.checklist.findIndex(c => c.id === active.id);
    const newIdx = card.checklist.findIndex(c => c.id === over.id);
    if (oldIdx === -1 || newIdx === -1) return;
    onUpdate(card.id, { checklist: arrayMove(card.checklist, oldIdx, newIdx) });
  };

  const updateCheckItem = (itemId: string, patch: Partial<CheckItem>) =>
    onUpdate(card.id, {
      checklist: card.checklist.map(c => c.id === itemId ? { ...c, ...patch } : c),
    });

  const deleteCheckItem = (itemId: string) =>
    onUpdate(card.id, { checklist: card.checklist.filter(c => c.id !== itemId) });

  const addCheckItem = (text: string) =>
    onUpdate(card.id, {
      checklist: [...card.checklist, { id: `c-${Date.now()}`, text, done: false }],
    });

  return (
    <div className={cn(
      "group relative rounded-2xl border border-border shadow-sm overflow-hidden",
      "transition-all duration-200 hover:-translate-y-1 hover:shadow-md hover:shadow-violet-100/40 dark:hover:shadow-violet-900/30",
      COLOR_MAP[card.color],
      isDragging && "opacity-60 rotate-2 scale-105 shadow-xl shadow-violet-200/50 dark:shadow-violet-900/40",
    )}>
      {/* Cover image */}
      {card.coverImage && (
        <div className="relative h-28 bg-muted">
          <img src={card.coverImage} alt="cover" className="w-full h-full object-cover" />
          <button
            onClick={() => onUpdate(card.id, { coverImage: undefined })}
            className="absolute top-2 right-2 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X size={11} />
          </button>
        </div>
      )}

      <div className="p-3.5 space-y-2.5">
        {/* Title row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {editTitle ? (
              <input
                autoFocus
                value={card.title}
                onChange={e => onUpdate(card.id, { title: e.target.value })}
                onBlur={() => setEditTitle(false)}
                onKeyDown={e => e.key === "Enter" && setEditTitle(false)}
                className="w-full text-[13px] font-bold bg-transparent border-b border-primary/30 focus:outline-none text-foreground pb-0.5"
              />
            ) : (
              <button
                onClick={() => setEditTitle(true)}
                className="text-[13px] font-bold text-foreground text-left w-full hover:text-primary transition-colors line-clamp-1"
              >
                {card.title || "Untitled"}
              </button>
            )}
          </div>

          {/* Context menu */}
          <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors"
              >
                <MoreHorizontal size={13} className="text-muted-foreground" />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-8 z-30 w-44 bg-card rounded-xl shadow-xl border border-border overflow-hidden animate-fade-in">
                  <button
                    onClick={() => { fileRef.current?.click(); setShowMenu(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-foreground hover:bg-muted transition-colors"
                  >
                    <Camera size={12} className="text-muted-foreground" /> Cover photo
                  </button>
                  <div>
                    <button
                      onClick={() => setShowColors(!showColors)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-foreground hover:bg-muted transition-colors"
                    >
                      <Palette size={12} className="text-muted-foreground" /> Card color
                    </button>
                    {showColors && (
                      <div className="px-3 py-2 flex gap-1.5 flex-wrap border-t border-border">
                        {(Object.keys(COLOR_DOT) as NoteColor[]).map(c => (
                          <button
                            key={c}
                            onClick={() => { onUpdate(card.id, { color: c }); setShowColors(false); setShowMenu(false); }}
                            className={cn(
                              "w-5 h-5 rounded-full transition-transform hover:scale-110",
                              COLOR_DOT[c],
                              card.color === c && "ring-2 ring-offset-1 ring-primary",
                            )}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="border-t border-border">
                    <button
                      onClick={() => { onDelete(card.id); setShowMenu(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <Trash2 size={12} /> Delete card
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        {(card.content !== undefined) && (
          <textarea
            value={card.content}
            onChange={e => onUpdate(card.id, { content: e.target.value })}
            placeholder="Тайлбар нэмэх..."
            rows={2}
            className="text-[11px] text-muted-foreground bg-transparent resize-none focus:outline-none w-full leading-relaxed placeholder:text-muted-foreground/40"
          />
        )}

        {/* Tags */}
        {card.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {card.tags.map(tag => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-primary/8 dark:bg-primary/10 rounded-full text-[10px] font-semibold text-primary"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Checklist */}
        {totalCount > 0 && (
          <div className="space-y-1">
            {/* Progress */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full bg-gradient-to-r transition-all duration-500",
                    getProgressColor(progress),
                  )}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-[9px] font-bold text-muted-foreground w-7 text-right">
                {progress}%
              </span>
            </div>

            {/* Sortable checklist — nested DndContext */}
            <DndContext
              sensors={checkSensors}
              collisionDetection={closestCorners}
              onDragEnd={handleCheckDragEnd}
            >
              <SortableContext
                items={visibleChecklist.map(c => c.id)}
                strategy={verticalListSortingStrategy}
              >
                {visibleChecklist.map(item => (
                  <SortableCheckItem
                    key={item.id}
                    item={item}
                    onToggle={() => updateCheckItem(item.id, { done: !item.done })}
                    onEdit={text  => updateCheckItem(item.id, { text })}
                    onDelete={()  => deleteCheckItem(item.id)}
                  />
                ))}
              </SortableContext>
            </DndContext>

            {/* Show more / less toggle */}
            {card.checklist.length > 3 && (
              <button
                onClick={() => setShowAllChecks(v => !v)}
                className="text-[10px] text-muted-foreground hover:text-primary transition-colors pl-[22px]"
              >
                {showAllChecks
                  ? "Хаах ↑"
                  : `+${card.checklist.length - 3} more`}
              </button>
            )}
          </div>
        )}

        {/* Add checklist item */}
        <AddCheckItem onAdd={addCheckItem} />

        {/* Bottom: mascot */}
        <div className="flex items-center justify-end pt-0.5">
          <MascotImage
            variant={cardMascot}
            size={28}
            className="opacity-60 group-hover:opacity-100 transition-opacity"
          />
        </div>
      </div>

      <input ref={fileRef} type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
    </div>
  );
}

// ── SORTABLE BOARD CARD ────────────────────────────────────────────────────────
function SortableCardItem({
  card, onUpdate, onDelete,
}: {
  card: NoteCard;
  onUpdate: (id: string, patch: Partial<NoteCard>) => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: card.id });

  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className={cn("relative", isDragging && "z-50")}>
      <div
        {...attributes}
        {...listeners}
        className="absolute top-3 left-3 z-10 cursor-grab active:cursor-grabbing text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors touch-none opacity-0 group-hover:opacity-100"
      >
        <GripVertical size={13} />
      </div>
      <CardItem card={card} onUpdate={onUpdate} onDelete={onDelete} isDragging={isDragging} />
    </div>
  );
}

// ── MAIN COMPONENT ─────────────────────────────────────────────────────────────
export function NotesClient({ userId }: { userId: string }) {
  const [notes,     setNotes]     = useState<NoteCard[]>(SAMPLE);
  const [activeId,  setActiveId]  = useState<string | null>(null);
  const [overColId, setOverColId] = useState<BoardCol | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const addNote = (col: BoardCol) => {
    setNotes(prev => [...prev, {
      id:        `note-${Date.now()}`,
      col,
      title:     "New Card",
      content:   "",
      checklist: [],
      color:     "white",
      tags:      [],
      createdAt: new Date(),
    }]);
  };

  const updateNote = (id: string, patch: Partial<NoteCard>) =>
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...patch } : n));

  const deleteNote = (id: string) =>
    setNotes(prev => prev.filter(n => n.id !== id));

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) { setOverColId(null); return; }

    const activeNote = notes.find(n => n.id === active.id);
    if (!activeNote) return;

    if (COLS.includes(over.id as BoardCol)) {
      const targetCol = over.id as BoardCol;
      setOverColId(targetCol);
      if (activeNote.col !== targetCol)
        setNotes(prev => prev.map(n => n.id === active.id ? { ...n, col: targetCol } : n));
      return;
    }

    const overNote = notes.find(n => n.id === over.id);
    if (overNote) {
      setOverColId(overNote.col);
      if (overNote.col !== activeNote.col)
        setNotes(prev => prev.map(n => n.id === active.id ? { ...n, col: overNote.col } : n));
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setOverColId(null);
    if (!over) return;

    const activeNote = notes.find(n => n.id === active.id);
    const overNote   = notes.find(n => n.id === over.id);
    if (!activeNote) return;

    if (overNote && activeNote.col === overNote.col && active.id !== over.id) {
      setNotes(prev => {
        const colNotes = prev.filter(n => n.col === activeNote.col);
        const rest     = prev.filter(n => n.col !== activeNote.col);
        return [...rest, ...arrayMove(
          colNotes,
          colNotes.findIndex(n => n.id === active.id),
          colNotes.findIndex(n => n.id === over.id),
        )];
      });
    }
  };

  const activeNote = notes.find(n => n.id === activeId);
  const totalTasks = notes.flatMap(n => n.checklist).length;
  const doneTasks  = notes.flatMap(n => n.checklist).filter(c => c.done).length;
  const donePct    = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const doneCards  = notes.filter(n => n.col === "done").length;

  return (
    <div className="animate-fade-up">

      {/* ── HEADER CARD ── */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-r from-accent/70 via-background to-card dark:from-violet-900/20 dark:via-background dark:to-card p-5 mb-5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-primary/10 border border-border flex items-center justify-center shrink-0">
              <Image src="/assets/mascot/mascot-base.png" alt="" width={28} height={28} unoptimized className="object-contain" />
            </div>
            <div>
              <h1 className="text-[20px] font-black text-foreground">My Learning Board</h1>
              <p className="text-[12px] text-muted-foreground mt-0.5">Өдөр бүр бага багаар ахиц гаргая 🚀</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {totalTasks > 0 && (
              <div className="flex items-center gap-3 px-4 py-2.5 bg-card rounded-2xl border border-border shadow-sm">
                <div className="flex flex-col items-end">
                  <span className="text-[11px] text-muted-foreground">Нийт дэвшил</span>
                  <span className="text-[18px] font-black text-primary leading-none">{donePct}%</span>
                </div>
                <div className="w-20 h-2.5 bg-accent dark:bg-violet-900/30 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-violet-400 transition-all duration-500"
                    style={{ width: `${donePct}%` }}
                  />
                </div>
              </div>
            )}
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30 rounded-2xl">
              <MascotImage variant="fire" size={28} className="shrink-0" />
              <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 whitespace-nowrap">
                Streak хадгалаарай 🔥
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── DAILY GOALS ── */}
      <DailyGoalsCard />

      {/* ── KANBAN BOARD ── */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {COLS.map(col => {
            const colNotes = notes.filter(n => n.col === col);
            const cfg      = COL_CONFIG[col];
            const isTarget = activeId !== null && overColId === col;

            return (
              <div
                key={col}
                id={col}
                className={cn(
                  "flex flex-col min-h-[200px] rounded-2xl transition-all duration-150",
                  isTarget && "ring-2 ring-primary/30 ring-offset-2 ring-offset-background",
                )}
              >
                {/* Column header */}
                <div className={cn("flex items-center justify-between px-3 py-2.5 rounded-2xl mb-3", cfg.headerBg)}>
                  <div className="flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full shrink-0", cfg.dot)} />
                    <span className={cn("text-[12px] font-black", cfg.color)}>{cfg.label}</span>
                    <span className={cn("text-[10px] font-black px-1.5 py-0.5 rounded-full", cfg.badgeBg)}>
                      {colNotes.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MascotImage variant={COL_MASCOT[col]} size={20} className="opacity-70" />
                    <button
                      onClick={() => addNote(col)}
                      className={cn("w-6 h-6 rounded-lg flex items-center justify-center hover:bg-white/60 dark:hover:bg-white/10 transition-colors", cfg.color)}
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                </div>

                {/* Cards */}
                <SortableContext
                  id={col}
                  items={colNotes.map(n => n.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="flex flex-col gap-3 flex-1">
                    {colNotes.map(card => (
                      <SortableCardItem
                        key={card.id}
                        card={card}
                        onUpdate={updateNote}
                        onDelete={deleteNote}
                      />
                    ))}

                    {/* Empty state */}
                    {colNotes.length === 0 && (
                      <button
                        onClick={() => addNote(col)}
                        className={cn(
                          "flex flex-col items-center justify-center gap-2 min-h-[120px] rounded-2xl border-2 border-dashed transition-all",
                          isTarget
                            ? "border-primary/50 bg-accent/30"
                            : "border-border hover:border-primary/40 hover:bg-muted/40",
                        )}
                      >
                        <MascotImage variant={COL_MASCOT[col]} size={40} className="opacity-40" />
                        <div className="text-center">
                          <p className="text-[12px] font-semibold text-muted-foreground">
                            {col === "todo" ? "Шинэ зорилго нэмээрэй!" :
                             col === "inprogress" ? "Ажилд ороорой!" :
                             col === "review" ? "Шалгах зүйл алга" : "Дуусгасан зүйл алга"}
                          </p>
                          <p className="text-[10px] text-muted-foreground/50 flex items-center gap-0.5 justify-center mt-0.5">
                            <Plus size={10} /> card нэмэх
                          </p>
                        </div>
                      </button>
                    )}

                    {colNotes.length > 0 && (
                      <button
                        onClick={() => addNote(col)}
                        className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] text-muted-foreground hover:text-primary hover:bg-muted/50 transition-all border border-dashed border-transparent hover:border-border"
                      >
                        <Plus size={12} /> Шинэ task нэмэх
                      </button>
                    )}
                  </div>
                </SortableContext>
              </div>
            );
          })}
        </div>

        {/* Board-level drag overlay */}
        <DragOverlay dropAnimation={{ duration: 200, easing: "cubic-bezier(0.16,1,0.3,1)" }}>
          {activeNote && (
            <div className="rotate-2 scale-105 shadow-2xl shadow-violet-200/50 dark:shadow-violet-900/40 opacity-95">
              <CardItem card={activeNote} onUpdate={() => {}} onDelete={() => {}} isDragging />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* ── REWARD PROGRESS ── */}
      <RewardProgress doneCount={doneCards} />
    </div>
  );
}
