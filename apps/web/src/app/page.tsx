'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, onAuthStateChanged } from '@/lib/auth';
import { signInWithGoogle, signInWithGithub } from '@/lib/auth';
import { Button } from '@/components/ui/button';

// Check if Firebase is configured
const isFirebaseConfigured = () => {
  if (typeof window === 'undefined') return false;
  return !!(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== 'your-api-key-here' &&
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN &&
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN !== 'your-project.firebaseapp.com'
  );
};

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [configError, setConfigError] = useState(false);

  useEffect(() => {
    // Check if Firebase is configured
    if (!isFirebaseConfigured()) {
      setConfigError(true);
      setLoading(false);
      return;
    }

    try {
      const unsubscribe = onAuthStateChanged((user) => {
        if (user) {
          router.push('/dashboard');
        } else {
          setLoading(false);
        }
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Firebase initialization error:', error);
      setConfigError(true);
      setLoading(false);
    }
  }, [router]);

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      router.push('/dashboard');
    } catch (error) {
      console.error('Google sign in error:', error);
    }
  };

  const handleGithubSignIn = async () => {
    try {
      await signInWithGithub();
      router.push('/dashboard');
    } catch (error) {
      console.error('GitHub sign in error:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (configError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-orange-100">
        <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Configuration Required</h1>
            <p className="text-gray-600 mb-4">
              Firebase configuration is missing. Please set up your environment variables.
            </p>
            <div className="bg-gray-50 p-4 rounded-md text-left text-sm font-mono">
              <p className="font-semibold mb-2">Create <code>apps/web/.env.local</code> with:</p>
              <pre className="text-xs overflow-x-auto">
{`NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_API_URL=http://localhost:4000`}
              </pre>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              See <code>docs/quick-start.md</code> for setup instructions.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Divvai</h1>
          <p className="text-gray-600">Split expenses fast with your group</p>
        </div>

        <div className="space-y-4">
          <Button
            onClick={handleGoogleSignIn}
            className="w-full bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            variant="outline"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </Button>

          <Button
            onClick={handleGithubSignIn}
            className="w-full bg-gray-900 text-white hover:bg-gray-800"
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path
                fillRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                clipRule="evenodd"
              />
            </svg>
            Continue with GitHub
          </Button>
        </div>
      </div>
    </div>
  );
}

