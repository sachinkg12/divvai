import { signInWithPopup, signOut as firebaseSignOut, User } from 'firebase/auth';
import { auth, GoogleAuthProvider, GithubAuthProvider } from './firebase';
import { api } from './api';

export async function signInWithGoogle(): Promise<User> {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

export async function signInWithGithub(): Promise<User> {
  const provider = new GithubAuthProvider();
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

export function getCurrentUser(): User | null {
  return auth.currentUser;
}

export function onAuthStateChanged(callback: (user: User | null) => void) {
  return auth.onAuthStateChanged(callback);
}

