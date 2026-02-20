// ============================================
// api.ts — APIクライアント
// 【B専任】このファイルは B のみが編集する
// ============================================

import type { ChatRequest, ChatResponse, Store } from "../types";
import { DUMMY_STORES } from "./dummyStores";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  (typeof window !== "undefined"
    ? `http://${window.location.hostname}:8000`
    : "http://localhost:8000");

/**
 * 全店舗データを取得する
 * バックエンド未起動時はダミーデータにフォールバック
 */
export async function fetchStores(): Promise<Store[]> {
  if (!API_BASE) {
    return DUMMY_STORES;
  }
  try {
    const res = await fetch(`${API_BASE}/api/stores`);
    if (!res.ok) {
      throw new Error(`Failed to fetch stores: ${res.status}`);
    }
    const data = await res.json();
    return data.stores;
  } catch {
    return DUMMY_STORES;
  }
}

/**
 * ヘルスチェック
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`);
    const data = await res.json();
    return data.status === "ok";
  } catch {
    return false;
  }
}

function buildLocalChatFallback(request: ChatRequest): ChatResponse {
  const top = request.context?.topStoreNames?.slice(0, 3) ?? [];
  const genre = request.context?.selectedGenre;

  const lines = [
    "バックエンド未接続のため、ローカル回答モードで提案します。",
    genre ? `ジャンルは「${genre}」優先で探すのがおすすめです。` : "まずジャンルを1つ決めると絞り込みが速くなります。",
    top.length > 0 ? `現在の候補上位: ${top.join("、")}` : "候補店舗を読み込み中です。",
    "予算・移動時間・利用シーンのどれか1つを追加すると、さらに絞れます。",
  ];

  return {
    assistant_message: lines.join("\n"),
    suggested_queries: [
      "予算1000円以下で",
      "駅近優先で",
      "静かなお店で",
    ],
    detected_mode: null,
  };
}

export async function sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
  if (!API_BASE) {
    return buildLocalChatFallback(request);
  }

  try {
    const response = await fetch(`${API_BASE}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: request.message,
        history: request.history.map((item) => ({
          role: item.role,
          content: item.content,
        })),
        context: {
          selected_genre: request.context?.selectedGenre ?? null,
          top_store_names: request.context?.topStoreNames ?? [],
          weights: request.context?.weights,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to chat: ${response.status}`);
    }

    return await response.json();
  } catch {
    return buildLocalChatFallback(request);
  }
}
