import type { XpAction } from "@prisma/client";

export const XP_ACTION_LABELS: Record<XpAction, string> = {
  LESSON_COMPLETE: "Хичээл дуусгасан",
  QUIZ_PASS: "Шалгалт давсан",
  QUIZ_PERFECT: "Төгс дүнтэй шалгалт",
  COURSE_COMPLETE: "Курс дуусгасан",
  STREAK_BONUS: "Өдрийн streak",
  DAILY_CHALLENGE: "Өдрийн сорил",
  REVIEW_SUBMIT: "Үнэлгээ илгээсэн",
  REFERRAL_SIGNUP: "Урилга амжилттай",
  SECTION_COMPLETE: "Хэсэг дуусгасан",
  TASK_COMPLETE: "Даалгавар дууссан",
  NOTE_CREATE: "Тэмдэглэл үүсгэсэн",
  FINAL_TASK_SUBMIT: "Эцсийн даалгавар илгээсэн",
  PEER_REVIEW_COMPLETE: "Peer review хийсэн",
};

export function getXpActionLabel(action: XpAction): string {
  return XP_ACTION_LABELS[action] ?? "XP олсон";
}
