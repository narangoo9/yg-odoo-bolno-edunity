"use client";

import { useState, useTransition, useEffect } from "react";
import { useSession } from "next-auth/react";
import { postComment, getComments, deleteComment } from "@/modules/comments/application/actions";
import { MessageSquare, Reply, Trash2 } from "lucide-react";

type ContentType = "LESSON" | "COURSE" | "CAPSTONE" | "PROGRAM";

interface Author {
  id: string;
  name: string;
  avatarUrl: string | null;
}

interface Comment {
  id: string;
  body: string;
  createdAt: Date;
  author: Author;
  replies?: Comment[];
}

interface Props {
  contentType: ContentType;
  contentId: string;
}

function Avatar({ author }: { author: Author }) {
  return (
    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground overflow-hidden flex-shrink-0">
      {author.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={author.avatarUrl} alt={author.name} className="w-full h-full object-cover" />
      ) : (
        author.name.slice(0, 2).toUpperCase()
      )}
    </div>
  );
}

function CommentItem({
  comment,
  currentUserId,
  userRole,
  contentType,
  contentId,
  onRefresh,
}: {
  comment: Comment;
  currentUserId: string;
  userRole: string;
  contentType: ContentType;
  contentId: string;
  onRefresh: () => void;
}) {
  const [showReply, setShowReply] = useState(false);
  const [replyBody, setReplyBody] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleReply() {
    if (!replyBody.trim()) return;
    startTransition(async () => {
      await postComment({ contentType, contentId, body: replyBody, parentId: comment.id });
      setReplyBody("");
      setShowReply(false);
      onRefresh();
    });
  }

  function handleDelete() {
    if (!confirm("Сэтгэгдлийг устгах уу?")) return;
    startTransition(async () => {
      await deleteComment(comment.id);
      onRefresh();
    });
  }

  const canDelete =
    comment.author.id === currentUserId ||
    userRole === "SUPER_ADMIN" ||
    userRole === "ORG_ADMIN";

  return (
    <div className="flex gap-3">
      <Avatar author={comment.author} />
      <div className="flex-1 min-w-0">
        <div className="bg-muted/50 rounded-xl px-4 py-3">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-sm font-semibold text-slate-800">{comment.author.name}</span>
            <span className="text-xs text-muted-foreground/80">
              {new Date(comment.createdAt).toLocaleDateString("mn-MN")}
            </span>
          </div>
          <p className="text-sm text-foreground whitespace-pre-wrap">{comment.body}</p>
        </div>

        <div className="flex items-center gap-3 mt-1 px-1">
          <button
            onClick={() => setShowReply(!showReply)}
            className="flex items-center gap-1 text-xs text-muted-foreground/80 hover:text-muted-foreground"
          >
            <Reply size={12} />
            Хариулах
          </button>
          {canDelete && (
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="flex items-center gap-1 text-xs text-muted-foreground/80 hover:text-red-500 disabled:opacity-40"
            >
              <Trash2 size={12} />
              Устгах
            </button>
          )}
        </div>

        {showReply && (
          <div className="mt-2 flex gap-2">
            <textarea
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              rows={2}
              placeholder="Хариулт бичих..."
              className="flex-1 border border-border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <div className="flex flex-col gap-1">
              <button
                onClick={handleReply}
                disabled={isPending || !replyBody.trim()}
                className="px-3 py-1.5 bg-violet-600 text-white rounded-lg text-xs font-medium disabled:opacity-40"
              >
                Илгээх
              </button>
              <button
                onClick={() => setShowReply(false)}
                className="px-3 py-1.5 border border-border rounded-lg text-xs text-muted-foreground"
              >
                Цуцлах
              </button>
            </div>
          </div>
        )}

        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-3 space-y-3 pl-4 border-l-2 border-border">
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                currentUserId={currentUserId}
                userRole={userRole}
                contentType={contentType}
                contentId={contentId}
                onRefresh={onRefresh}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function DiscussionThread({ contentType, contentId }: Props) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  async function fetchComments() {
    const result = await getComments(contentType, contentId);
    setComments((result.comments ?? []) as Comment[]);
    setLoading(false);
  }

  useEffect(() => {
    fetchComments();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentType, contentId]);

  function handlePost() {
    if (!body.trim() || !session?.user) return;
    startTransition(async () => {
      await postComment({ contentType, contentId, body });
      setBody("");
      fetchComments();
    });
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-slate-800 flex items-center gap-2">
        <MessageSquare size={16} />
        Хэлэлцүүлэг ({comments.length})
      </h3>

      {session?.user && (
        <div className="flex gap-3">
          <Avatar author={{ id: session.user.id, name: session.user.name ?? "?", avatarUrl: session.user.image ?? null }} />
          <div className="flex-1">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
              placeholder="Санал бодлоо бичнэ үү..."
              className="w-full border border-border rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              onClick={handlePost}
              disabled={isPending || !body.trim()}
              className="mt-2 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-500 disabled:opacity-40 transition-colors"
            >
              {isPending ? "Илгээж байна..." : "Нийтлэх"}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2].map((i) => (
            <div key={i} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-muted" />
              <div className="flex-1 h-16 bg-muted rounded-xl" />
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="text-muted-foreground/80 text-sm text-center py-8">Сэтгэгдэл байхгүй байна</p>
      ) : (
        <div className="space-y-4">
          {comments.map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              currentUserId={session?.user?.id ?? ""}
              userRole={(session?.user as { role?: string })?.role ?? "STUDENT"}
              contentType={contentType}
              contentId={contentId}
              onRefresh={fetchComments}
            />
          ))}
        </div>
      )}
    </div>
  );
}
