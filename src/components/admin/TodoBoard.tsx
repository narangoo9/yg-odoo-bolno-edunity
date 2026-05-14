"use client";

import { useState, useCallback, useEffect } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Trash2, CheckCircle2, Circle, Clock, Loader2 } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/toaster";

type TodoStatus = "pending" | "inProgress" | "completed";

interface Todo {
  id: string;
  text: string;
  status: TodoStatus;
  priority: "low" | "medium" | "high";
  createdAt: Date;
  orderIndex: number;
}

interface Column {
  id: TodoStatus;
  labelKey: string;
  color: string;
  icon: React.ElementType;
}

const COLUMNS: Column[] = [
  { id: "pending",    labelKey: "todo.pending",    color: "text-muted-foreground",   icon: Circle },
  { id: "inProgress", labelKey: "todo.inProgress", color: "text-amber-500",   icon: Clock },
  { id: "completed",  labelKey: "todo.completed",  color: "text-emerald-500", icon: CheckCircle2 },
];

const PRIORITY_COLORS: Record<string, string> = {
  low:    "bg-muted text-muted-foreground dark:bg-slate-700 dark:text-muted-foreground/60",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  high:   "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const PRIORITY_LABELS: Record<string, string> = {
  low: "Бага", medium: "Дунд", high: "Өндөр",
};

// ── API helpers ────────────────────────────────────────────────────────────────
async function apiCreateTodo(data: { text: string; priority: string; status: TodoStatus; orderIndex: number }): Promise<Todo | null> {
  try {
    const res = await fetch("/api/v1/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!json.success) return null;
    return { ...json.data, createdAt: new Date(json.data.createdAt) };
  } catch {
    return null;
  }
}

async function apiUpdateTodo(id: string, patch: { status?: TodoStatus; priority?: string; text?: string; orderIndex?: number }): Promise<boolean> {
  try {
    const res = await fetch(`/api/v1/todos/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const json = await res.json();
    return json.success === true;
  } catch {
    return false;
  }
}

async function apiDeleteTodo(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/v1/todos/${id}`, { method: "DELETE" });
    const json = await res.json();
    return json.success === true;
  } catch {
    return false;
  }
}

// ── Sortable card ──────────────────────────────────────────────────────────────
function SortableTodoCard({ todo, onDelete }: { todo: Todo; onDelete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: todo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "bg-white dark:bg-[#1e1b4b] rounded-xl border border-border dark:border-border p-3 shadow-sm group",
        isDragging && "shadow-lg"
      )}
    >
      <div className="flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 p-0.5 text-muted-foreground/60 dark:text-muted-foreground hover:text-muted-foreground dark:hover:text-muted-foreground/80 cursor-grab active:cursor-grabbing shrink-0"
        >
          <GripVertical size={14} />
        </button>
        <div className="flex-1 min-w-0">
          <p className={cn("text-sm text-slate-800 dark:text-slate-200", todo.status === "completed" && "line-through text-muted-foreground/80 dark:text-muted-foreground")}>
            {todo.text}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", PRIORITY_COLORS[todo.priority])}>
              {PRIORITY_LABELS[todo.priority]}
            </span>
            <span className="text-xs text-muted-foreground/80">{todo.createdAt.toLocaleDateString("mn-MN")}</span>
          </div>
        </div>
        <button
          onClick={() => onDelete(todo.id)}
          className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground/60 hover:text-red-400 transition-all shrink-0"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

function TodoCard({ todo }: { todo: Todo }) {
  return (
    <div className="bg-white dark:bg-[#1e1b4b] rounded-xl border border-border dark:border-border p-3 shadow-lg">
      <p className="text-sm text-slate-800 dark:text-slate-200">{todo.text}</p>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export function TodoBoard() {
  const { t } = useLanguage();
  const [todos,       setTodos]       = useState<Todo[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [activeId,    setActiveId]    = useState<string | null>(null);
  const [newText,     setNewText]     = useState("");
  const [newPriority, setNewPriority] = useState<"low" | "medium" | "high">("medium");

  // Load todos from API on mount
  useEffect(() => {
    fetch("/api/v1/todos")
      .then(r => r.json())
      .then(json => {
        if (json.success) {
          setTodos((json.data as Todo[]).map((t: Todo) => ({
            ...t,
            createdAt: new Date(t.createdAt),
          })));
        }
      })
      .catch(() => toast({ type: "error", title: "Даалгавар ачааллахад алдаа гарлаа" }))
      .finally(() => setLoading(false));
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const activeTodo = activeId ? todos.find((t) => t.id === activeId) : null;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId   = String(over.id);

    const activeTodo = todos.find((t) => t.id === activeId);
    if (!activeTodo) return;

    const overColumn = COLUMNS.find((c) => c.id === overId);
    if (overColumn && activeTodo.status !== overColumn.id) {
      setTodos((prev) => prev.map((t) => t.id === activeId ? { ...t, status: overColumn.id } : t));
      return;
    }

    const overTodo = todos.find((t) => t.id === overId);
    if (overTodo && overTodo.status !== activeTodo.status) {
      setTodos((prev) => prev.map((t) => t.id === activeId ? { ...t, status: overTodo.status } : t));
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    const draggedId = String(active.id);
    setActiveId(null);
    if (!over) return;

    const overId = String(over.id);
    if (draggedId === overId) return;

    setTodos((prev) => {
      const oldIdx = prev.findIndex((t) => t.id === draggedId);
      const newIdx = prev.findIndex((t) => t.id === overId);
      if (oldIdx === -1 || newIdx === -1) return prev;
      return arrayMove(prev, oldIdx, newIdx);
    });

    // Persist status change and new order
    const movedTodo = todos.find(t => t.id === draggedId);
    if (movedTodo) {
      apiUpdateTodo(draggedId, { status: movedTodo.status, orderIndex: todos.findIndex(t => t.id === draggedId) })
        .catch(() => toast({ type: "error", title: "Байршил хадгалахад алдаа гарлаа" }));
    }
  }

  const addTodo = useCallback(async () => {
    if (!newText.trim()) return;
    const tempId = `temp-${Date.now()}`;
    const optimistic: Todo = {
      id:         tempId,
      text:       newText.trim(),
      status:     "pending",
      priority:   newPriority,
      createdAt:  new Date(),
      orderIndex: todos.length,
    };
    setTodos(prev => [...prev, optimistic]);
    setNewText("");

    const created = await apiCreateTodo({
      text:       optimistic.text,
      priority:   newPriority,
      status:     "pending",
      orderIndex: todos.length,
    });

    if (created) {
      setTodos(prev => prev.map(t => t.id === tempId ? { ...created, createdAt: new Date(created.createdAt) } : t));
    } else {
      setTodos(prev => prev.filter(t => t.id !== tempId));
      toast({ type: "error", title: "Даалгавар үүсгэхэд алдаа гарлаа" });
    }
  }, [newText, newPriority, todos.length]);

  const deleteTodo = useCallback(async (id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
    const ok = await apiDeleteTodo(id);
    if (!ok) toast({ type: "error", title: "Устгахад алдаа гарлаа" });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 size={24} className="animate-spin text-primary/60" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Add form */}
      <div className="bg-white dark:bg-[#1e1b4b] rounded-xl border border-border dark:border-border p-4">
        <div className="flex gap-3">
          <input
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTodo()}
            placeholder={t("todo.addPlaceholder")}
            className="flex-1 px-3 py-2 text-sm border border-border dark:border-border rounded-lg bg-muted/50 dark:bg-slate-700 text-foreground dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-400 focus:bg-white dark:focus:bg-slate-600"
          />
          <select
            value={newPriority}
            onChange={(e) => setNewPriority(e.target.value as "low" | "medium" | "high")}
            className="px-3 py-2 text-sm border border-border dark:border-border rounded-lg bg-white dark:bg-slate-700 text-foreground dark:text-slate-100 focus:outline-none"
          >
            <option value="low">Бага</option>
            <option value="medium">Дунд</option>
            <option value="high">Өндөр</option>
          </select>
          <button
            onClick={addTodo}
            className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 dark:bg-muted text-white dark:text-foreground rounded-lg text-sm font-medium hover:bg-violet-500 dark:hover:bg-white transition-colors shrink-0"
          >
            <Plus size={14} />
            {t("common.add")}
          </button>
        </div>
      </div>

      {/* Columns */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid md:grid-cols-3 gap-5">
          {COLUMNS.map((col) => {
            const colTodos = todos.filter((t) => t.status === col.id);
            const ColIcon = col.icon;
            return (
              <div
                key={col.id}
                id={col.id}
                className="bg-muted/50 dark:bg-violet-600/50 rounded-xl border border-border dark:border-border p-4 min-h-[300px]"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <ColIcon size={15} className={col.color} />
                    <h3 className="text-sm font-semibold text-foreground dark:text-slate-200">{t(col.labelKey)}</h3>
                  </div>
                  <span className="text-xs font-medium bg-white dark:bg-slate-700 border border-border dark:border-border text-muted-foreground dark:text-muted-foreground/60 px-2 py-0.5 rounded-full">
                    {colTodos.length}
                  </span>
                </div>

                <SortableContext
                  items={colTodos.map((t) => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2.5 min-h-[200px]">
                    {colTodos.length === 0 ? (
                      <div className="h-[80px] border-2 border-dashed border-border dark:border-border rounded-xl flex items-center justify-center">
                        <p className="text-xs text-muted-foreground/60 dark:text-muted-foreground">{t("todo.noTodos")}</p>
                      </div>
                    ) : colTodos.map((todo) => (
                      <SortableTodoCard key={todo.id} todo={todo} onDelete={deleteTodo} />
                    ))}
                  </div>
                </SortableContext>
              </div>
            );
          })}
        </div>

        <DragOverlay>
          {activeTodo ? <TodoCard todo={activeTodo} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
