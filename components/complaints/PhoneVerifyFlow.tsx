'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Phone, CheckCircle, ArrowRight, RefreshCw, Loader2 } from 'lucide-react';
type VerifyStep = 'phone' | 'otp' | 'verified';

interface PhoneVerifyFlowProps {
  onVerified: (sessionToken: string, phone: string) => void;
}

/**
 * Phone verification flow:
 * Step 1: Phone number input → Send OTP
 * Step 2: OTP digit input → Verify → Resend (30s cooldown)
 * Step 3: Verified → Green tick → Proceed button
 */
export default function PhoneVerifyFlow({ onVerified }: PhoneVerifyFlowProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState<VerifyStep>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [demoOtp, setDemoOtp] = useState<string | null>(null);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleSendOTP = useCallback(async () => {
    setError('');
    const phoneClean = phone.replace(/\s+/g, '');

    if (!/^[6-9]\d{9}$/.test(phoneClean)) {
      setError(t('otp.errPhone'));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneClean }),
      });

      const data = await res.json();

      if (data.success) {
        setStep('otp');
        setResendCooldown(30);
        setDemoOtp(data.demo_otp ?? null);
        setOtp(data.demo_otp ?? '');
      } else {
        setError(data.message || 'Failed to send OTP.');
      }
    } catch {
      setError(t('common.networkError'));
    } finally {
      setLoading(false);
    }
  }, [phone]);

  const handleVerifyOTP = useCallback(async () => {
    setError('');

    if (otp.length !== 6) {
      setError(t('otp.errSix'));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.replace(/\s+/g, ''), otp }),
      });

      const data = await res.json();

      if (data.success && data.session_token) {
        setSessionToken(data.session_token);
        setStep('verified');
      } else {
        setError(t('otp.errBad'));
      }
    } catch {
      setError(t('common.networkError'));
    } finally {
      setLoading(false);
    }
  }, [phone, otp]);

  const handleResendOTP = useCallback(() => {
    if (resendCooldown > 0) return;
    handleSendOTP();
  }, [resendCooldown, handleSendOTP]);

  const handleProceed = useCallback(() => {
    if (sessionToken) {
      onVerified(sessionToken, phone.replace(/\s+/g, ''));
    }
  }, [sessionToken, phone, onVerified]);

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Step 1: Phone Input */}
      {step === 'phone' && (
        <div className="space-y-4">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Phone className="w-8 h-8 text-indigo-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              {t('otp.title')}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {t('otp.sub')}
            </p>
          </div>

          <div>
            <label htmlFor="phone-input" className="block text-sm font-medium text-gray-700 mb-1">
              {t('otp.phoneLabel')}
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 bg-gray-100 px-3 py-2.5 rounded-lg border border-gray-300">
                +91
              </span>
              <input
                id="phone-input"
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={phone}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setPhone(val);
                  setError('');
                }}
                placeholder={t('otp.phonePh')}
                className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 outline-none
                  focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all
                  text-gray-900 placeholder-gray-400"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 mt-1">{error}</p>
          )}

          <button
            onClick={handleSendOTP}
            disabled={loading || phone.length !== 10}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg
              bg-indigo-600 text-white font-medium hover:bg-indigo-700
              disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                {t('otp.send')}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      )}

      {/* Step 2: OTP Verification */}
      {step === 'otp' && (
        <div className="space-y-4">
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              {t('otp.enter')}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {demoOtp ? t('otp.demo', { phone }) : t('otp.sentTo', { phone })}
            </p>
          </div>

          {demoOtp && (
            <p className="text-sm text-center text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              {t('otp.yourCode')} <span className="font-mono font-bold tracking-widest">{demoOtp}</span> {t('otp.filled')}
            </p>
          )}

          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={otp}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '');
              setOtp(val);
              setError('');
            }}
            disabled={loading}
            className="w-full max-w-xs mx-auto block px-4 py-2.5 text-center text-xl font-semibold
              rounded-lg border-2 border-gray-300 focus:border-indigo-500 focus:ring-2 
              focus:ring-indigo-200 outline-none tracking-[0.5em] bg-white placeholder-gray-300"
            placeholder="••••••"
            aria-label={t('otp.aria')}
          />

          {error && (
            <p className="text-sm text-red-600 text-center mt-2">{error}</p>
          )}

          <button
            onClick={handleVerifyOTP}
            disabled={loading || otp.length !== 6}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg
              bg-indigo-600 text-white font-medium hover:bg-indigo-700
              disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              t('otp.verify')
            )}
          </button>

          <div className="text-center">
            <button
              onClick={handleResendOTP}
              disabled={resendCooldown > 0 || loading}
              className="text-sm text-indigo-600 hover:text-indigo-800 disabled:text-gray-400
                disabled:cursor-not-allowed transition-colors inline-flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              {resendCooldown > 0
                ? t('otp.resendIn', { s: resendCooldown })
                : t('otp.resend')
              }
            </button>
          </div>

          <button
            onClick={() => { setStep('phone'); setOtp(''); setError(''); }}
            className="w-full text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            {t('otp.change')}
          </button>
        </div>
      )}

      {/* Step 3: Verified */}
      {step === 'verified' && (
        <div className="space-y-4 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>

          <div>
            <h3 className="text-lg font-semibold text-green-800">
              {t('otp.verified')}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {t('otp.verifiedSub', { phone })}
            </p>
          </div>

          <button
            onClick={handleProceed}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg
              bg-green-600 text-white font-medium hover:bg-green-700 transition-all"
          >
            {t('otp.proceed')}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
