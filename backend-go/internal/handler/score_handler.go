package handler

import (
\t"encoding/json"

\t"wagamama-gourmet/backend-go/internal/scoring"

\t"github.com/aws/aws-lambda-go/events"
)

type scoreResponse struct {
\tStores []scoring.StoreScore `json:"stores"`
}

func Score(request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
\tvar input scoring.ScoreInput
\tif err := json.Unmarshal([]byte(request.Body), &input); err != nil {
\t\treturn events.APIGatewayProxyResponse{StatusCode: 400, Body: "invalid request"}, nil
\t}

\tstores := []scoring.Store{}
\tresult := make([]scoring.StoreScore, 0, len(stores))
\tfor _, store := range stores {
\t\tresult = append(result, scoring.Calculate(store, input))
\t}

\tbody, err := json.Marshal(scoreResponse{Stores: result})
\tif err != nil {
\t\treturn events.APIGatewayProxyResponse{StatusCode: 500, Body: "failed to serialize response"}, nil
\t}

\treturn events.APIGatewayProxyResponse{
\t\tStatusCode: 200,
\t\tHeaders: map[string]string{
\t\t\t"Content-Type": "application/json",
\t\t},
\t\tBody: string(body),
\t}, nil
}
