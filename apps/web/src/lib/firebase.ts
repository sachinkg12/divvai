import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, GoogleAuthProvider, GithubAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

// Validate Firebase config
if (typeof window !== 'undefined') {
  if (!firebaseConfig.apiKey || firebaseConfig.apiKey === 'your-api-key-here') {
    console.error(
      'Firebase configuration missing! Please set NEXT_PUBLIC_FIREBASE_API_KEY in .env.local'
    );
  }
  if (!firebaseConfig.authDomain || firebaseConfig.authDomain === 'your-project.firebaseapp.com') {
    console.error(
      'Firebase configuration missing! Please set NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN in .env.local'
    );
  }
  if (!firebaseConfig.projectId || firebaseConfig.projectId === 'your-project-id') {
    console.error(
      'Firebase configuration missing! Please set NEXT_PUBLIC_FIREBASE_PROJECT_ID in .env.local'
    );
  }
}

let app: FirebaseApp;
let auth: Auth;

if (typeof window !== 'undefined') {
  if (!getApps().length) {
    if (firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId) {
      app = initializeApp(firebaseConfig);
    } else {
      console.error('Cannot initialize Firebase: missing configuration');
    }
  } else {
    app = getApps()[0];
  }
  if (app) {
    auth = getAuth(app);
  }
}

export { auth, GoogleAuthProvider, GithubAuthProvider };
export default app;

