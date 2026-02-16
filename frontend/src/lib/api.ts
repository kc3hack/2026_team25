// ============================================
// api.ts — APIクライアント
// 【B専任】このファイルは B のみが編集する
// ============================================

import type { Store } from "../types";
import { DUMMY_STORES } from "./dummyStores";

const API_BASE = import.meta.env.VITE_API_URL || "";

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
