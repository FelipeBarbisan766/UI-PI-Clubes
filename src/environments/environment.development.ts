export const environment = {
  production: false,
  name: 'development',
  apiUrl: 'http://localhost:5000/api',
  googleClientId: '612959761839-amghu5hs5c6ms3vm34qgfcbe64pak5os.apps.googleusercontent.com',
  mpBackUrls: {
    success: 'http://localhost:5000/api/payment/success',
    failure: 'http://localhost:5000/api/payment/failure',
    pending: 'http://localhost:5000/api/payment/pending',
  }
};
