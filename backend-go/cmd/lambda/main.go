package main

import (
\t"wagamama-gourmet/backend-go/internal/handler"

\t"github.com/aws/aws-lambda-go/lambda"
)

func main() {
\tlambda.Start(handler.Score)
}
