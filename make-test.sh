touch './test/queries/'$1'.json'

echo '{
    "title": "'$1'",
    "query": {},
    "isQueryValid": false,
    "result": "InsightError"
}' > './test/queries/'$1'.json'
