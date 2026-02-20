from app.models.schemas import ChatRequest, ChatResponse


_MODE_LABELS = {
    "budget": "金欠",
    "date": "デート",
    "quick": "急ぎ",
    "balanced": "バランス",
}


def _detect_mode(message: str, weights: dict | None) -> str:
    text = message.lower()

    if any(keyword in text for keyword in ["安", "節約", "コスパ", "budget"]):
        return "budget"
    if any(keyword in text for keyword in ["デート", "雰囲気", "ロマンチック", "date"]):
        return "date"
    if any(keyword in text for keyword in ["急", "早", "すぐ", "time", "quick"]):
        return "quick"

    if weights:
        top_key = max(weights, key=weights.get)
        if top_key == "price":
            return "budget"
        if top_key == "vibe":
            return "date"
        if top_key in {"speed", "access"}:
            return "quick"

    return "balanced"


def _build_mode_advice(mode: str) -> str:
    if mode == "budget":
        return "価格重視なら、まず予算上限を決めてから候補を3件に絞ると失敗しにくいです。"
    if mode == "date":
        return "デート重視なら、雰囲気と評価を優先して、混雑しづらい時間帯を選ぶのがおすすめです。"
    if mode == "quick":
        return "急ぎなら、アクセスと提供速度が高い店から順に見ていくのが最短です。"
    return "迷ったら、価格・アクセス・評価の3軸を均等に見て候補を比較すると決めやすいです。"


def build_chat_response(payload: ChatRequest) -> ChatResponse:
    weights_dict = payload.context.weights.model_dump() if payload.context and payload.context.weights else None
    mode = _detect_mode(payload.message, weights_dict)
    mode_label = _MODE_LABELS[mode]

    lines: list[str] = [
        f"了解です。いまの相談は『{mode_label}モード』寄りで考えるのがよさそうです。",
        _build_mode_advice(mode),
    ]

    if payload.context and payload.context.selected_genre:
        lines.append(f"ジャンルは『{payload.context.selected_genre}』を軸に探しましょう。")

    if payload.context and payload.context.top_store_names:
        top_names = payload.context.top_store_names[:3]
        lines.append(f"現在の候補上位は {', '.join(top_names)} です。")

    lines.append("気になる条件（予算・利用シーン・移動時間）を1つ追加してくれたら、さらに絞り込みます。")

    suggestions = [
        "予算1000円以下で再提案して",
        "駅から5分以内を優先して",
        "静かなお店だけに絞って",
    ]

    return ChatResponse(
        assistant_message="\n".join(lines),
        suggested_queries=suggestions,
        detected_mode=mode_label,
    )