"use client"
import { useState } from "react"
import Link from "next/link"
import { useComments, useCreateComment, useLikeComment } from "../lib/hooks"
import { useAuthStore } from "../lib/auth-store"

export default function Comments({ targetType, targetId }: { targetType: string; targetId: string }) {
  const { data: comments = [], isLoading } = useComments(targetType, targetId)
  const createComment = useCreateComment(targetType, targetId)
  const likeComment   = useLikeComment(targetType, targetId)
  const { user }      = useAuthStore()

  const [body, setBody]         = useState("")
  const [replyTo, setReplyTo]   = useState<string | null>(null)
  const [replyBody, setReplyBody] = useState("")

  const submit = async (text: string, parentId?: string) => {
    if (!text.trim()) return
    await createComment.mutateAsync({ body: text, parentId })
    if (parentId) { setReplyBody(""); setReplyTo(null) } else setBody("")
  }

  const Avatar = ({ name }: { name: string }) => (
    <div className="w-8 h-8 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
      {name?.[0]?.toUpperCase()}
    </div>
  )

  const CommentItem = ({ c, isReply }: { c: any; isReply?: boolean }) => (
    <div className={`flex gap-3 ${isReply ? "ml-11" : ""}`}>
      <Avatar name={c.author?.nickname} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-white">{c.author?.nickname}</span>
          {c.author?.isVerified && <span className="text-[10px] text-amber-400 bg-amber-400/10 border border-amber-400/20 px-1.5 py-0.5 rounded-full">✓ 认证</span>}
          <span className="text-xs text-white/25">{new Date(c.createdAt).toLocaleDateString("zh-CN")}</span>
        </div>
        <p className="text-sm text-white/70 leading-relaxed">{c.body}</p>
        <div className="flex items-center gap-4 mt-1.5">
          <button
            onClick={() => user && likeComment.mutate(c.id)}
            className={`text-xs flex items-center gap-1 transition-colors ${c.liked ? "text-[#a8edcf]" : "text-white/30 hover:text-white/60"}`}
          >
            ♥ {c.likeCount > 0 && c.likeCount}
          </button>
          {!isReply && user && (
            <button onClick={() => setReplyTo(replyTo === c.id ? null : c.id)}
              className="text-xs text-white/30 hover:text-white/60 transition-colors">回复</button>
          )}
        </div>
        {/* 回复输入 */}
        {replyTo === c.id && (
          <div className="mt-2 flex gap-2">
            <input
              value={replyBody}
              onChange={e => setReplyBody(e.target.value)}
              onKeyDown={e => e.key === "Enter" && submit(replyBody, c.id)}
              placeholder="回复..."
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-white/25 focus:outline-none focus:border-white/25"
            />
            <button onClick={() => submit(replyBody, c.id)}
              className="text-xs bg-white/10 hover:bg-white/15 border border-white/10 text-white px-3 rounded-lg">发送</button>
          </div>
        )}
        {/* 回复列表 */}
        {c.replies?.length > 0 && (
          <div className="mt-3 space-y-3">
            {c.replies.map((r: any) => <CommentItem key={r.id} c={r} isReply />)}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-5">
      <h2 className="text-sm font-semibold text-white">评论 {comments.length > 0 && `(${comments.length})`}</h2>

      {/* 发评论 */}
      {user ? (
        <div className="flex gap-3">
          <Avatar name={user.nickname} />
          <div className="flex-1 flex gap-2">
            <input
              value={body}
              onChange={e => setBody(e.target.value)}
              onKeyDown={e => e.key === "Enter" && submit(body)}
              placeholder="写下你的评论..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/25"
            />
            <button onClick={() => submit(body)} disabled={createComment.isPending}
              className="bg-[#3eb489]/20 hover:bg-[#3eb489]/30 border border-[#3eb489]/30 text-[#a8edcf] text-sm px-4 rounded-xl transition-colors disabled:opacity-40">
              发送
            </button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-white/30 text-center py-2">
          <Link href="/login" className="text-[#a8edcf]/70 hover:text-[#a8edcf]">登录</Link> 后参与评论
        </p>
      )}

      {/* 评论列表 */}
      {isLoading ? (
        <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />)}</div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-white/25 text-center py-4">还没有评论，来抢沙发</p>
      ) : (
        <div className="space-y-5">{comments.map((c: any) => <CommentItem key={c.id} c={c} />)}</div>
      )}
    </div>
  )
}
