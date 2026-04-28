import type { ElementType } from "react";
import type { NotificationType } from "@prisma/client";
import { Bell, CheckCircle2, BookOpen, Award, CreditCard, AlertCircle } from "lucide-react";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";

const typeConfig: Record<NotificationType, { icon: ElementType; color: string }> = {
  ENROLLMENT_SUCCESS:  { icon: BookOpen,      color: "text-violet-600 bg-violet-100 dark:bg-violet-500/15" },
  COURSE_PUBLISHED:    { icon: BookOpen,      color: "text-violet-600 bg-violet-100 dark:bg-violet-500/15" },
  QUIZ_RESULT:         { icon: CheckCircle2,  color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-500/15" },
  CERTIFICATE_READY:   { icon: Award,         color: "text-amber-600 bg-amber-100 dark:bg-amber-500/15" },
  PAYMENT_SUCCESS:     { icon: CreditCard,    color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-500/15" },
  PAYMENT_FAILED:      { icon: AlertCircle,   color: "text-red-600 bg-red-100 dark:bg-red-500/15" },
  COURSE_REMINDER:     { icon: Bell,          color: "text-muted-foreground bg-muted" },
  LIVE_CLASS_REMINDER: { icon: Bell,          color: "text-indigo-600 bg-indigo-100 dark:bg-indigo-500/15" },
  SYSTEM:              { icon: Bell,          color: "text-muted-foreground bg-muted" },
};

export async function NotificationsPageContent({ userId }: { userId: string }) {
  const notifications = await db.notification.findMany({
    where: { userId },
    orderBy: { sentAt: "desc" },
    take: 50,
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (unreadCount > 0) {
    await db.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }

  return (
    <div className="max-w-2xl space-y-5 animate-fade-up">
      <div>
        <h1 className="text-xl font-bold text-foreground">Мэдэгдэл</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {notifications.length} мэдэгдэл
          {unreadCount > 0 && ` · ${unreadCount} шинэ`}
        </p>
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-2xl border border-dashed border-violet-200 dark:border-violet-800/40">
          <div className="w-14 h-14 mx-auto mb-3 bg-violet-100 dark:bg-violet-500/10 rounded-2xl flex items-center justify-center">
            <Bell size={24} className="text-violet-500" />
          </div>
          <p className="text-sm font-semibold text-foreground">Мэдэгдэл алга</p>
          <p className="text-xs text-muted-foreground mt-1">Шинэ мэдэгдэл ирэхэд энд харагдана</p>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm divide-y divide-border">
          {notifications.map((notification) => {
            const cfg  = typeConfig[notification.type] ?? typeConfig.SYSTEM;
            const Icon = cfg.icon;

            return (
              <div key={notification.id}
                className={`flex items-start gap-3 p-4 transition-colors hover:bg-violet-50/50 dark:hover:bg-violet-500/5 ${
                  !notification.isRead ? "bg-violet-50/30 dark:bg-violet-500/5" : ""
                }`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${cfg.color}`}>
                  <Icon size={15} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{notification.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{notification.body}</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">{formatDate(notification.sentAt)}</p>
                </div>
                {!notification.isRead && (
                  <div className="w-2 h-2 bg-violet-500 rounded-full shrink-0 mt-2" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
