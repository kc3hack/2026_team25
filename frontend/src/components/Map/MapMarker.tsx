import type { StoreWithScore } from "../../types";

// createPinElement: Return an HTMLElement representing the pin for a store
export function createPinElement(store: StoreWithScore): HTMLDivElement {
  const el = document.createElement("div");
  el.className = `map-pin ${store.visible ? "map-pin--visible" : "map-pin--hidden"}`;
  el.style.width = `${store.pinSize}px`;
  el.style.height = `${store.pinSize}px`;
  el.style.backgroundColor = store.pinColor;
  el.setAttribute("title", store.name);
  return el;
}

export default createPinElement;
