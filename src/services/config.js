// API Configuration
// Using Google Cloud Service Account for authentication

export const API_CONFIG = {
  // Google Cloud Project Configuration
  PROJECT_ID: 'buoyant-valve-465820-u2',
  SERVICE_ACCOUNT_EMAIL: 'bettermenu-ocr@buoyant-valve-465820-u2.iam.gserviceaccount.com',
  
  // Service Account Private Key (for token generation)
  PRIVATE_KEY: `-----BEGIN PRIVATE KEY-----
MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDA4Fc/aojQhH6p
KTeXZ8FA9HTQ9PoutbJAVkjytoepS9t0xmAQbhyaRr1QSlcrp4YrAYPU+Q6hO1sQ
T+E2WCnVG5oVYskgkxEV9Am5hJgPEUj5aW880RCkYykvb+w9jxpH7iS91wiBiv/y
Tz/oAPYtId/zVMf3woj7WgBA3lHNSOT45liyxq2KP86RlpsMFGNR3zNc3TUvlzGe
AXMKZOM4UqacFDUwbv+wyWJ3xLlpDDV1JKJWoGKeCjKHkthecIr0ZWkm7i25uM3C
CqhPVPsY+0gDS63iOSveCeDg3rEOmKwTEYNoeaZcpRHaFB+KR+PCxYtaAKYquCne
Fs3E7z77AgMBAAECggEAAlKCaZnREuXcrlmIWeKvF+h39WYGIA6YfM3zuQexhRuI
rMxinly+Rl6l9WA05fKfcDQSMnOwkhWc1Yd7+QA3jBx5L7BZOrR4+Egy0iK4r13c
g9rvJaXJl1FRkJd88sj0K8j0qWX8GHpIPfNNbgb2rjRor0ocfK0WlV91xnmPAQWZ
lkhahtUL3X6o7cMYn11goRw4H8iCy9TLENLX12Ynq5T2PnA/91UB3De/LVettRSL
XJJVpq9jmJFhCgO0Po/S3GcO0+tkioMEL6xttOLzfHToa5+mBxFFE6ZLJ9MEfslS
sUFxFfqcex4JO846f2yuOxSz/Rlbj9IPRgZ6EktV1QKBgQDz+hB6qfy4tCgSiHpw
FPXU5ChhFXyj6l9hAuOUXLKUlRuXgIwJ2+er4WThr/5LVF4sJznu4UI5V9fvYbve
/RCtx8xMioueXYT79b529wSFSlS6pobIHEnqgrGX3LtODII6ihLbQnwnHq+Hhi3o
AI/o6KInSl6FJyPp9TLKmZQbBQKBgQDKYZvPu45sP6OT8/CB/pO0YcSUQ1YZA6Jt
ByeWIwbsCziQHo/YUDc7Y368i5qRDjJv4Fjw/i7Q/Zu1BaWgp9CcIOqANlxpsx34
DDFbxX+eLqb3ZsmLWMPSrvr0roAkseW3S01hlSureg0Z5TQtBxerAS6go4RIpwQu
2IFKFrkR/wKBgB5rICDbDspMk+5zm6hbxKatZ6drEWYyc3/Z51v5Dr7dtFn4Sf10
sHbKnFRTKAZmV3Nz1JJG/YW+wQp0igLsVGcGUR996phtGoZ7hiq485RWxyeaWZWb
iU+2ycOgXq4FezsnOeCicm5CMipYfWK+pzKnxofViuFZFu41hwahjUitAoGADd8a
2uY0IN9LyvxRY9ebMCXzX2YuJJDHNUnkQLot40fxnI87tMvqvTtYmHvJIGAkvN5X
ukzx0IlRftrgO17FQa5P5HHVa7lHOJU9XNjwolr4PsTg05hF887ijJrZVaqL4EBd
EW80CxDWjQvUw7FUwffWxlPu4TvxYXSdiAJ+tOkCgYBJ9dySxCxRfoWsz/Ikk0/Y
xBwOa9jBZgIJvYQDl9RmRQGpW2W80PCP+LsUlL1OvkoXnI6XmaHfr9ZLeIo60tAK
hEEFt9QP/4sOwrH6vlQJtjr4O9Ch/ZNbOyz1FlTuu73Aa252OaPcML/b9RlnqrJe
X0DvqNHv3o9DFuFgMnyNOQ==
-----END PRIVATE KEY-----`,
  
  // Token endpoint for service account authentication
  TOKEN_URI: 'https://oauth2.googleapis.com/token',
  
  // Enable/disable API usage (set to false to use mock data only)
  USE_REAL_APIS: true, // Now enabled with service account
};

// API URLs (no API key needed with service account)
export const API_URLS = {
  VISION: 'https://vision.googleapis.com/v1/images:annotate',
  TRANSLATE: 'https://translation.googleapis.com/language/translate/v2',
};