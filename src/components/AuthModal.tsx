import React, { useState } from 'react';
import { X, Lock, Mail, User, ShieldCheck, Sparkles, ArrowRight } from 'lucide-react';
import { useAuth, SUPER_ADMIN_EMAILS } from '../context/AuthContext';

export const AuthModal: React.FC = () => {
  const {
    authModalOpen,
    setAuthModalOpen,
    setAdminPanelOpen,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
  } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!authModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (mode === 'signin') {
        await signInWithEmail(email, password);
        const emailLower = email.trim().toLowerCase();
        if (SUPER_ADMIN_EMAILS.includes(emailLower)) {
          setAdminPanelOpen(true);
        }
      } else {
        if (!fullName.trim()) {
          setError('Please provide your full name');
          setSubmitting(false);
          return;
        }
        await signUpWithEmail(fullName, email, password);
      }
    } catch (err: any) {
      if (
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/user-not-found' ||
        err.code === 'auth/invalid-credential'
      ) {
        setError('Invalid email or password. Please verify your credentials.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please sign in instead.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
      } else {
        setError(err.message || 'Authentication failed. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const fbUser = await signInWithGoogle();
      setAuthModalOpen(false);
      const emailLower = (fbUser?.email || '').trim().toLowerCase();
      if (SUPER_ADMIN_EMAILS.includes(emailLower)) {
        setAdminPanelOpen(true);
      }
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Google Sign-In was cancelled.');
      } else if (err.code === 'auth/popup-blocked') {
        setError('Popup was blocked by your browser. Please allow popups for this site.');
      } else {
        setError(err.message || 'Google Sign-In failed. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[460px] animate-in fade-in zoom-in duration-200">
        
        {/* Left Side: Vyuma Branding Panel */}
        <div className="w-full md:w-5/12 bg-[#2874f0] text-white p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <span className="text-2xl font-black tracking-wider text-white">VYUMA</span>
              <span className="text-xs bg-[#ffe500] text-blue-900 font-bold px-2 py-0.5 rounded italic">
                Plus
              </span>
            </div>
            <h3 className="text-2xl font-bold mb-3">
              {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
            </h3>
            <p className="text-blue-100 text-sm leading-relaxed">
              Sign in to manage your Orders, Wishlist, Saved Delivery Addresses, and Razorpay Checkout.
            </p>
          </div>

          <div className="space-y-3 pt-6 border-t border-blue-400/40 text-xs text-blue-100">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#ffe500]" />
              <span>Official Firebase Authentication</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#ffe500]" />
              <span>Real-Time Cloud Firestore Sync</span>
            </div>
          </div>
        </div>

        {/* Right Side: Form & Actions */}
        <div className="w-full md:w-7/12 p-8 flex flex-col justify-between bg-white">
          <button
            onClick={() => setAuthModalOpen(false)}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition p-1 rounded-full hover:bg-gray-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div>
            {/* Google Sign In as Primary Action */}
            <div className="mb-5">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={submitting}
                className="w-full bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 py-2.5 px-4 rounded-lg font-semibold text-xs flex items-center justify-center gap-3 transition shadow-xs cursor-pointer disabled:opacity-60"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>
            </div>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500 text-[11px]">Or continue with email</span>
              </div>
            </div>

            <div className="flex items-center gap-4 mb-4 border-b border-gray-200 pb-2">
              <button
                type="button"
                onClick={() => { setMode('signin'); setError(null); }}
                className={`pb-2 text-xs font-bold transition relative cursor-pointer ${
                  mode === 'signin' ? 'text-[#2874f0]' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Sign In
                {mode === 'signin' && (
                  <span className="absolute bottom-[-9px] left-0 right-0 h-0.5 bg-[#2874f0]" />
                )}
              </button>
              <button
                type="button"
                onClick={() => { setMode('signup'); setError(null); }}
                className={`pb-2 text-xs font-bold transition relative cursor-pointer ${
                  mode === 'signup' ? 'text-[#2874f0]' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Create Account
                {mode === 'signup' && (
                  <span className="absolute bottom-[-9px] left-0 right-0 h-0.5 bg-[#2874f0]" />
                )}
              </button>
            </div>

            {error && (
              <div className="mb-4 p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Your full name"
                      className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-[#2874f0]"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-[#2874f0]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-[#2874f0]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#fb641b] hover:bg-[#e85b16] text-white py-2.5 rounded-lg font-bold text-xs shadow-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 mt-2"
              >
                {submitting ? 'Please wait...' : mode === 'signin' ? 'Sign In to Vyuma' : 'Create Account'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          <p className="text-[11px] text-gray-400 text-center mt-4">
            Protected by Firebase Authentication and Cloud Security Rules.
          </p>
        </div>
      </div>
    </div>
  );
};
