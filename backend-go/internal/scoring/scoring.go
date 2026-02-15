package scoring

type ScoreInput struct {
\tPriceWeight float64 `json:"priceWeight"`
\tGroupWeight float64 `json:"groupWeight"`
\tTimeWeight  float64 `json:"timeWeight"`
}

type Store struct {
\tID         string  `json:"id"`
\tName       string  `json:"name"`
\tPriceScore float64 `json:"priceScore"`
\tGroupScore float64 `json:"groupScore"`
\tTimeScore  float64 `json:"timeScore"`
}

type StoreScore struct {
\tID    string  `json:"id"`
\tName  string  `json:"name"`
\tScore float64 `json:"score"`
}

func Calculate(store Store, input ScoreInput) StoreScore {
\tscore := (store.PriceScore * input.PriceWeight) +
\t\t(store.GroupScore * input.GroupWeight) +
\t\t(store.TimeScore * input.TimeWeight)

\treturn StoreScore{
\t\tID:    store.ID,
\t\tName:  store.Name,
\t\tScore: score,
\t}
}
