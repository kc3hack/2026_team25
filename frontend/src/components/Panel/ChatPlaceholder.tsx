import { useMemo, useRef, useState } from "react";
import { Loader2, Send } from "lucide-react";

import { sendChatMessage } from "../../lib/api";
import type { ChatMessage, Weights } from "../../types";

type Props = {
  selectedGenre: string | null;
  topStoreNames: string[];
  weights: Weights;
};

export default function ChatPlaceholder({ selectedGenre, topStoreNames, weights }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "こんにちは。条件を教えてくれたら、お店選びを一緒に絞り込みます。\n例: 『安くて駅近の店がいい』",
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const canSend = useMemo(() => input.trim().length > 0 && !sending, [input, sending]);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    });
  };

  const postMessage = async (text: string) => {
    const userMessage: ChatMessage = { role: "user", content: text };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setSending(true);
    setError(null);
    scrollToBottom();

    try {
      const response = await sendChatMessage({
        message: text,
        history: nextMessages,
        context: {
          selectedGenre,
          topStoreNames,
          weights,
        },
      });

      setMessages([
        ...nextMessages,
        {
          role: "assistant",
          content: response.assistant_message,
        },
      ]);
    } catch {
      setError("返信の取得に失敗しました。少し待って再試行してください。");
    } finally {
      setSending(false);
      scrollToBottom();
    }
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSend) {
      return;
    }
    await postMessage(input.trim());
  };

  return (
    <div className="flex h-full flex-col bg-[#FDFBF7]">
      <header className="border-b-2 border-black bg-[#FDFBF7] px-4 py-3">
        <h2 className="text-base font-black text-black">AIチャット</h2>
        <p className="text-xs font-semibold text-gray-600">条件を伝えると、候補の絞り込み方を提案します。</p>
      </header>

      <div className="flex-1 overflow-y-auto px-3 py-3">
        <div className="mx-auto flex max-w-2xl flex-col gap-2">
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`max-w-[85%] rounded-2xl border-2 border-black px-3 py-2 text-sm whitespace-pre-wrap shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] ${
                message.role === "user"
                  ? "ml-auto bg-[#FF6B35] font-semibold text-white"
                  : "mr-auto bg-white text-gray-800"
              }`}
            >
              {message.content}
            </div>
          ))}

          {sending && (
            <div className="mr-auto flex items-center gap-2 rounded-2xl border-2 border-black bg-white px-3 py-2 text-xs font-semibold text-gray-600 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <Loader2 size={14} className="animate-spin" />
              返信を生成中...
            </div>
          )}

          {error && <div className="text-xs font-semibold text-red-600">{error}</div>}
          <div ref={bottomRef} />
        </div>
      </div>

      <form onSubmit={onSubmit} className="border-t-2 border-black bg-[#FDFBF7] p-3">
        <div className="mx-auto flex max-w-2xl items-center gap-2">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="例: 2人で静かに話せる、駅近の店"
            className="h-10 flex-1 rounded-xl border-2 border-black bg-white px-3 text-sm font-semibold outline-none"
            maxLength={300}
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!canSend}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border-2 border-black bg-[#FF6B35] text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none"
          >
            <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}
