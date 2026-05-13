import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Lock, Mail, ChevronRight, UserPlus, Fingerprint } from 'lucide-react';
import { Button } from './Button';

interface LockScreenProps {
  onLogin: (email: string, password?: string) => Promise<any>;
  onSetupPassword: (userId: string, password: string) => Promise<any>;
  onLoginSuccess: (user: any) => void;
}

export function LockScreen({ onLogin, onSetupPassword, onLoginSuccess }: LockScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState<'login' | 'setup'>('login');
  const [userId, setUserId] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const result = await onLogin(email, password);
      if (result.success) {
        onLoginSuccess(result.user);
      } else if (result.needsPasswordSetup) {
        setUserId(result.userId);
        setStep('setup');
      } else {
        setError(result.error || 'Invalid credentials');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setError('');
    setIsLoading(true);
    try {
      const result = await onSetupPassword(userId, password);
      if (result.success) {
        onLoginSuccess(result.user);
      } else {
        setError(result.error || 'Failed to setup password');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950 p-4">
      <div className="absolute inset-0 overflow-hidden opacity-20 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-brand blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-brand-2 blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20 relative z-10"
      >
        <div className="transport-gradient p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Fingerprint size={120} />
          </div>
          
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 shadow-lg">
              <ShieldCheck size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">HealthSync</h1>
              <p className="text-[10px] uppercase tracking-[0.2em] font-black opacity-80">Security Protocol v4.0</p>
            </div>
          </div>

          <h2 className="text-xl font-bold mb-2">
            {step === 'login' ? 'System Auth Required' : 'Initialize Credentials'}
          </h2>
          <p className="text-sm opacity-80 leading-relaxed">
            {step === 'login' 
              ? 'Please verify your identity to access facility records and clinical data.' 
              : 'Welcome for the first time. Set up your secure access password to continue.'}
          </p>
        </div>

        <div className="p-8 bg-[#f8fbff]">
          <form onSubmit={step === 'login' ? handleLogin : handleSetup} className="space-y-5">
            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }} 
                animate={{ opacity: 1, x: 0 }}
                className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs font-bold rounded-xl flex items-center gap-2"
              >
                <div className="w-1 h-1 rounded-full bg-red-600" />
                {error}
              </motion.div>
            )}

            {step === 'login' ? (
              <>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-wider">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="email"
                      required
                      placeholder="name@facility.org"
                      className="w-full pl-12 pr-4 py-3.5 bg-white border border-[#d6deeb] rounded-2xl focus:ring-2 focus:ring-brand/20 outline-none transition-all font-medium text-sm"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-wider">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="password"
                      placeholder="••••••••"
                      className="w-full pl-12 pr-4 py-3.5 bg-white border border-[#d6deeb] rounded-2xl focus:ring-2 focus:ring-brand/20 outline-none transition-all font-medium text-sm"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 italic ml-1">
                    First time? Enter email and leave password blank.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-wider">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="password"
                      required
                       placeholder="Min 8 characters"
                      className="w-full pl-12 pr-4 py-3.5 bg-white border border-[#d6deeb] rounded-2xl focus:ring-2 focus:ring-brand/20 outline-none transition-all font-medium text-sm"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-wider">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="password"
                      required
                      placeholder="••••••••"
                      className="w-full pl-12 pr-4 py-3.5 bg-white border border-[#d6deeb] rounded-2xl focus:ring-2 focus:ring-brand/20 outline-none transition-all font-medium text-sm"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>
              </>
            )}

            <Button 
              type="submit" 
              className="w-full py-4 rounded-2xl gap-2 mt-4 text-base"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="loading-spinner w-5 h-5 border-2 border-white/30 border-t-white" />
              ) : (
                <>
                  {step === 'login' ? 'Authenticate' : 'Initialize Access'}
                  <ChevronRight size={18} />
                </>
              )}
            </Button>
          </form>
          
          <div className="mt-8 text-center">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">
              Encrypted Channel Protocol
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
