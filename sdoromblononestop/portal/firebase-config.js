// Paste the Firebase Web App configuration from Firebase Console here.
// This browser configuration is safe to expose; never place a service-account
// private key or other server credential in this file.
export const firebaseConfig = {
  apiKey: 'AIzaSyBN0pk20bIlUgJU3vJiM8hwafk5zrw7z9Q',
  authDomain: 'sdo-onestop.firebaseapp.com',
  projectId: 'sdo-onestop',
  storageBucket: 'sdo-onestop.firebasestorage.app',
  messagingSenderId: '560031496143',
  appId: '1:560031496143:web:1b81793d8bf115a81a04ba',
  measurementId: 'G-Z0SKRX1YCG',
};

export const isFirebaseConfigured = Object.values(firebaseConfig).every(Boolean);
