'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Smartphone,
  Mail,
  User,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Heart,
  RefreshCw,
  AlertCircle,
  KeyRound,
} from 'lucide-react';
import { usePlayerStore } from '@/lib/store/usePlayerStore';
import { auth } from '@/lib/firebase';
import {
  signInWithPhoneNumber,
  RecaptchaVerifier,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';

export default function LoginPage() {
  const router = useRouter();
  const { setUser, theme } = usePlayerStore();
  const isDark = theme === 'dark';

  const [authMethod, setAuthMethod] = useState<'phone' | 'email' | 'google'>('phone');

  // Input States
  const [userName, setUserName] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneInput, setPhoneInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  
  const [step, setStep] = useState<'input' | 'otp'>('input');
  const [otpValues, setOtpValues] = useState<string[]>(['', '', '', '', '', '']);
  const [demoOtp, setDemoOtp] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(30);
  const [isResendDisabled, setIsResendDisabled] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [confirmationResult, setConfirmationResult] = useState<any>(null);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const setupRecaptcha = () => {
    if (!(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: (response: any) => {
          // reCAPTCHA solved, allow signInWithPhoneNumber.
        }
      });
    }
  };

  // 30-Second Countdown Timer for Resend OTP
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 'otp' && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setIsResendDisabled(false);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  // Step 1: Send SMS / Email Auth Handler
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!userName.trim()) {
      setErrorMessage('Please enter your name or username to continue');
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      if (authMethod === 'phone') {
        setupRecaptcha();
        const appVerifier = (window as any).recaptchaVerifier;
        const rawDigits = phoneInput.replace(/\D/g, '');
        if (rawDigits.length < 10) {
          setErrorMessage('Please enter a valid 10-digit mobile number');
          setIsLoading(false);
          return;
        }
        const fullPhone = `${countryCode}${rawDigits}`;

        const confirmation = await signInWithPhoneNumber(auth, fullPhone, appVerifier);
        setConfirmationResult(confirmation);
        setStep('otp');
        setSuccessMessage(`Verification code sent to ${fullPhone}`);
      } else {
        setErrorMessage('Firebase Email Authentication requires a password. Switching to Phone Auth is recommended for OTP experience.');
        setIsLoading(false);
        return;
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to send verification. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Handle 6-Digit Passcode Input Auto-Focus
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newValues = [...otpValues];
    newValues[index] = value.slice(-1);
    setOtpValues(newValues);

    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim().replace(/\D/g, '').slice(0, 6);

    if (pastedData.length === 6) {
      setOtpValues(pastedData.split(''));
      otpInputRefs.current[5]?.focus();
    }
  };

  // Step 2: Verify OTP Submit Handler
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const otpCode = otpValues.join('');
    if (otpCode.length !== 6) {
      setErrorMessage('Please enter complete 6-digit OTP passcode');
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      if (authMethod === 'phone' && confirmationResult) {
        const result = await confirmationResult.confirm(otpCode);
        const user = result.user;

        const userData = {
          name: userName.trim(),
          phone: user.phoneNumber,
          uid: user.uid,
          isPro: true
        };

        localStorage.setItem('jiya_auth_token', await user.getIdToken());
        setUser(userData);
        router.push('/');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid verification OTP code');
    } finally {
      setIsLoading(false);
    }
  };

  // Google Sign-In Handler
  const handleGoogleSignIn = async () => {
    setErrorMessage('');
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const googleUser = {
        name: user.displayName || 'Google Streamer',
        email: user.email,
        avatarUrl: user.photoURL || '',
        isPro: true,
      };

      localStorage.setItem('jiya_auth_token', await user.getIdToken());
      setUser(googleUser);
      router.push('/');
    } catch (err: any) {
      setErrorMessage(err.message || 'Google Sign-In failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex flex-col items-center justify-center p-6 sm:p-10 bg-[#070A10] text-white relative overflow-y-auto select-none">
      {/* Background Radial Aura Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40 blur-[130px] scale-150">
        <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-pink-600 animate-pulse" />
        <div className="absolute bottom-1/4 right-1/3 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-purple-600 to-rose-600 animate-pulse delay-1000" />
      </div>

      {/* Main Spacious & Professional Glassmorphic Card Container */}
      <div className="relative z-10 w-full max-w-lg sm:max-w-xl rounded-3xl sm:rounded-[36px] border border-white/15 bg-slate-900/90 backdrop-blur-3xl shadow-[0_20px_80px_rgba(0,0,0,0.7)] p-5 sm:p-10 space-y-6 sm:space-y-8 my-auto">
        {/* App Logo & Header Section */}
        <div className="flex flex-col items-center text-center space-y-3">
          <Link href="/" className="flex items-center gap-3.5 group">
            <div className="relative">
              <div className="absolute -inset-1.5 rounded-2xl bg-gradient-to-r from-red-500 via-pink-500 to-purple-600 opacity-80 blur-md group-hover:opacity-100 transition-opacity animate-pulse" />
              <div className="relative w-14 h-14 rounded-2xl overflow-hidden border border-white/25 bg-slate-950 p-1 shadow-2xl flex items-center justify-center">
                <img src="/logo.png" alt="JIYA Logo" className="w-full h-full object-cover rounded-xl" />
              </div>
            </div>
            <div className="text-left">
              <h1 className="font-black text-3xl tracking-tight leading-none text-white">JIYA</h1>
              <p className="text-xs font-bold text-pink-400 flex items-center gap-1 mt-1.5 leading-none">
                Made with <Heart className="w-3.5 h-3.5 fill-red-500 text-red-500 animate-pulse shrink-0 inline-block" /> for her
              </p>
            </div>
          </Link>

          <div className="pt-2">
            <h2 className="text-2xl font-black tracking-tight text-white">Sign In to Your Account</h2>
          </div>
        </div>

        {/* Authentication Method Selector Tabs */}
        <div className="grid grid-cols-3 p-1.5 rounded-2xl bg-slate-950/90 border border-white/10 text-xs font-extrabold gap-1.5 shadow-inner">
          <button
            onClick={() => {
              setAuthMethod('phone');
              setErrorMessage('');
              setSuccessMessage('');
              setStep('input');
            }}
            className={`py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${
              authMethod === 'phone'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 scale-[1.02]'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Smartphone className="w-4 h-4" /> SMS OTP
          </button>

          <button
            onClick={() => {
              setAuthMethod('email');
              setErrorMessage('');
              setSuccessMessage('');
              setStep('input');
            }}
            className={`py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${
              authMethod === 'email'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 scale-[1.02]'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Mail className="w-4 h-4" /> Email
          </button>

          <button
            onClick={() => {
              setAuthMethod('google');
              setErrorMessage('');
              setSuccessMessage('');
            }}
            className={`py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${
              authMethod === 'google'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 scale-[1.02]'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Google
          </button>
        </div>

        {/* Feedback Messages */}
        {errorMessage && (
          <div className="px-5 py-4 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-extrabold flex items-center gap-3.5 shadow-lg animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span className="leading-normal">{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="px-5 py-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 text-xs font-extrabold flex items-center gap-3.5 shadow-lg animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span className="leading-normal">{successMessage}</span>
          </div>
        )}

        {/* TAB 1 & 2: PHONE / EMAIL OTP FLOW */}
        {(authMethod === 'phone' || authMethod === 'email') && (
          <>
            {step === 'input' ? (
              /* STEP 1: USERNAME + CONTACT INFO FORM */
              <form onSubmit={handleSendOtp} className="space-y-5">
                {/* Username Input Field */}
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-slate-400 tracking-wider">
                    Full Name / Username
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="e.g. Alex Rivera"
                      className="w-full pl-11 pr-5 py-3.5 rounded-2xl bg-slate-950 border border-white/15 text-xs font-extrabold text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Contact Input (Phone or Email) */}
                {authMethod === 'phone' ? (
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-slate-400 tracking-wider">
                      Mobile Phone Number
                    </label>
                    <div className="flex items-center gap-3">
                      <select
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        className="px-2.5 sm:px-4 py-3 sm:py-3.5 rounded-2xl bg-slate-950 border border-white/15 text-xs font-extrabold text-white focus:outline-none shrink-0"
                      >
                        <option value="+91">🇮🇳 +91</option>
                        <option value="+1">🇺🇸 +1</option>
                        <option value="+44">🇬🇧 +44</option>
                        <option value="+86">🇨🇳 +86</option>
                      </select>

                      <input
                        type="tel"
                        required
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="9876543210"
                        className="flex-1 min-w-0 px-4 sm:px-5 py-3 sm:py-3.5 rounded-2xl bg-slate-950 border border-white/15 text-xs font-extrabold text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 focus:outline-none transition-all"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-slate-400 tracking-wider">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="email"
                        required
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        placeholder="user@example.com"
                        className="w-full pl-11 pr-5 py-3.5 rounded-2xl bg-slate-950 border border-white/15 text-xs font-extrabold text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 focus:outline-none transition-all"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading || !userName.trim() || (authMethod === 'phone' ? phoneInput.length < 8 : !emailInput.trim())}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 text-white font-extrabold text-xs shadow-xl shadow-blue-600/30 hover:scale-[1.01] active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 mt-4"
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Get Verification Code</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* STEP 2: 6-DIGIT PASSCODE SCREEN */
              <form onSubmit={handleVerifyOtp} className="space-y-6 animate-in fade-in">
                {demoOtp && (
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900/50 via-indigo-900/50 to-purple-900/50 border border-blue-500/50 text-blue-200 text-xs font-bold text-center space-y-2.5 shadow-2xl">
                    <div className="flex items-center justify-center gap-2 text-xs font-black uppercase text-blue-300 tracking-wider">
                      <KeyRound className="w-4 h-4 text-blue-400" />
                      <span>Verification OTP Passcode</span>
                    </div>
                    <div className="font-mono text-3xl font-black tracking-widest text-white drop-shadow-md">
                      {demoOtp}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (demoOtp && demoOtp.length === 6) {
                          setOtpValues(demoOtp.split(''));
                          otpInputRefs.current[5]?.focus();
                        }
                      }}
                      className="px-4 py-1.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs shadow-md transition-transform active:scale-95 inline-flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                      <span>Auto-Fill Code</span>
                    </button>
                  </div>
                )}

                <div className="space-y-3 text-center">
                  <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-300">
                    <span>
                      Sent to <span className="font-extrabold text-white">{authMethod === 'phone' ? `${countryCode} ${phoneInput}` : emailInput}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setStep('input');
                        setOtpValues(['', '', '', '', '', '']);
                        setErrorMessage('');
                        setSuccessMessage('');
                      }}
                      className="text-blue-400 hover:underline font-bold"
                    >
                      Edit
                    </button>
                  </div>

                  {/* 6 Individual Digit Input Boxes */}
                  <div className="flex items-center justify-center gap-1.5 sm:gap-2.5 pt-2">
                    {otpValues.map((val, index) => (
                      <input
                        key={index}
                        ref={(el) => {
                          otpInputRefs.current[index] = el;
                        }}
                        type="text"
                        maxLength={1}
                        value={val}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        onPaste={handlePaste}
                        className="w-10 h-12 sm:w-12 sm:h-14 rounded-xl sm:rounded-2xl bg-slate-950 border border-white/20 text-center text-lg sm:text-xl font-black text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40 focus:outline-none shadow-inner"
                      />
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || otpValues.join('').length !== 6}
                  className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-extrabold text-xs shadow-xl shadow-blue-600/30 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Verify & Enter Jiya</span>
                    </>
                  )}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    disabled={isResendDisabled || isLoading}
                    onClick={() => handleSendOtp()}
                    className="text-xs font-bold text-slate-400 hover:text-white disabled:opacity-40"
                  >
                    {isResendDisabled ? `Resend Code in ${timer}s` : 'Resend Verification Code'}
                  </button>
                </div>
              </form>
            )}
          </>
        )}

        {/* TAB 3: GOOGLE OAUTH FLOW */}
        {authMethod === 'google' && (
          <div className="space-y-6 animate-in fade-in text-center py-3">
            <p className="text-xs text-slate-300 font-medium">
              Click below to authenticate instantly with your Google Account.
            </p>

            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full py-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-black text-xs shadow-2xl transition-all flex items-center justify-center gap-3 border border-white/20 active:scale-95 cursor-pointer"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin text-slate-900" />
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
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
                  <span>Sign in with Google</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Security Guarantee Footer */}
        <div id="recaptcha-container"></div>
        <div className="pt-5 border-t border-white/10 flex items-center justify-center gap-2 text-xs text-slate-400 font-semibold">
          <ShieldCheck className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
          <span>Encrypted 256-bit Secure Authentication Engine</span>
        </div>
      </div>
    </div>
  );
}
