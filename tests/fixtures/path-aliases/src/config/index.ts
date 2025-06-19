export const config = {
  apiUrl: 'https://api.example.com',
  timeout: 5000,
  retries: 3,
  environment: process.env.NODE_ENV || 'development'
};

export const features = {
  enableCache: true,
  debugMode: false,
  maxConnections: 10
};