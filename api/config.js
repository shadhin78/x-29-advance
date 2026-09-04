module.exports = function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.status(200).json({
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAiqf66FVpOM9UV20LEcOjOPkkFcS_qFIs",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "x-2k29.firebaseapp.com",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "x-2k29",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "x-2k29.firebasestorage.app",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "17156117405",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:17156117405:web:78cb75ef31f3ffdba15574"
  });
};

