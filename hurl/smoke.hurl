GET {{base}}

HTTP 200

GET {{base}}/healthz
Accept: application/json

HTTP 200

GET {{base}}/login
Accept: text/html

HTTP 200
[Asserts]
header "Content-Type" contains "text/html"
body contains "root"