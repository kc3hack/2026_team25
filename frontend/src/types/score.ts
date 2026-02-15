export type ScoreRequest = {
  priceWeight: number;
  groupWeight: number;
  timeWeight: number;
};

export type StoreScore = {
  id: string;
  name: string;
  score: number;
};

export type ScoreResponse = {
  stores: StoreScore[];
};
