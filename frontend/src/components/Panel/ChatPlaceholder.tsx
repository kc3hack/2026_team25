import { useMemo, useRef, useState } from "react";
import { Loader2, Send } from "lucide-react";

import { sendChatMessage } from "../../lib/api";
import { calculateScores } from "../../lib/scoreEngine";
import { PRESETS, type ChatMessage, type Store, type StoreWithScore, type Weights } from "../../types";

type Props = {
  stores: Store[];
  selectedGenre: string | null;
  topStoreNames: string[];
  weights: Weights;
  onSelectSuggestion: (store: StoreWithScore, nextWeights: Weights) => void;
};

const MODE_TO_PRESET: Record<string, Weights> = {
  金欠: PRESETS["金欠モード"],
  デート: PRESETS["デートモード"],
  急ぎ: PRESETS["急ぎモード"],
};

function clampWeight(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function buildOptimizedWeights(input: string, detectedMode: string | null, current: Weights): Weights {
  if (detectedMode && MODE_TO_PRESET[detectedMode]) {
    return MODE_TO_PRESET[detectedMode];
  }

  const text = input.toLowerCase();
  const next: Weights = { ...current };

  if (/(安い|コスパ|節約|予算|金欠)/.test(text)) next.price += 32;
  if (/(駅近|近い|アクセス|歩き|移動)/.test(text)) next.access += 28;
  if (/(評価|高評価|レビュー|口コミ|うまい|美味)/.test(text)) next.rating += 26;
  if (/(デート|おしゃれ|雰囲気|映え|落ち着)/.test(text)) next.vibe += 30;
  if (/(早い|急ぎ|サクッ|すぐ|時短|待たない)/.test(text)) next.speed += 34;
  if (/(ゆっくり|長居|まったり)/.test(text)) next.speed -= 24;

  return {
    price: clampWeight(next.price),
    access: clampWeight(next.access),
    rating: clampWeight(next.rating),
    vibe: clampWeight(next.vibe),
    speed: clampWeight(next.speed),
  };
}

export default function ChatPlaceholder({
  stores,
  selectedGenre,
  topStoreNames,
  weights,
  onSelectSuggestion,
}: Props) {
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
  const [suggestedStores, setSuggestedStores] = useState<StoreWithScore[]>([]);
  const [lastWeights, setLastWeights] = useState<Weights | null>(null);
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

      const nextWeights = buildOptimizedWeights(text, response.detected_mode, weights);
      const top3 = calculateScores(stores, nextWeights)
        .filter((store) => store.visible)
        .sort((a, b) => b.normalizedScore - a.normalizedScore)
        .slice(0, 3);

      setLastWeights(nextWeights);
      setSuggestedStores(top3);
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
              className={`max-w-[85%] rounded-2xl border-2 border-black px-3 py-2 text-sm whitespace-pre-wrap shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] ${message.role === "user"
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

          {suggestedStores.length > 0 && (
            <div className="mt-2 rounded-2xl border-2 border-black bg-white p-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <p className="mb-2 text-xs font-black text-gray-700">要望に合う上位3店舗</p>
              <div className="flex flex-col gap-2">
                {suggestedStores.map((store, index) => (
                  <button
                    key={store.id}
                    type="button"
                    onClick={() => {
                      if (!lastWeights) return;
                      onSelectSuggestion(store, lastWeights);
                    }}
                    className="flex items-center justify-between rounded-xl border-2 border-black bg-[#FDFBF7] px-3 py-2 text-left shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-black text-black">
                        {index + 1}位 {store.name}
                      </span>
                      <span className="block text-[11px] font-semibold text-gray-600">{store.genre}</span>
                    </span>
                    <span className="ml-2 shrink-0 rounded-md bg-black px-2 py-0.5 text-[10px] font-black text-white">
                      {(store.normalizedScore * 100).toFixed(0)}%
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

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
