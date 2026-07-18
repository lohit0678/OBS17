import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Mail, Lock, Sparkles, ArrowLeft, CheckCircle } from 'lucide-react';
import collegeLogo from '../assets/images/panimalar_logo_final_1783767831926.jpg';
import entranceBg from '../assets/images/panimalar_user_entrance.png';

export default function Login() {
  const { login, register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [isRegister, setIsRegister] = useState(false);
  
  // Login fields (email can be username or email)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Register fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Google Sign-In Simulator Popup State
  const [showGooglePopup, setShowGooglePopup] = useState(false);
  const [googleCustomEmail, setGoogleCustomEmail] = useState('');
  const [googleCustomName, setGoogleCustomName] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both email/username and password.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await login(email.trim(), password);
      if (res.success && res.user) {
        let targetPath = '/faculty/dashboard';
        if (res.user.role === 'HOD') {
          targetPath = '/hod/dashboard';
        } else if (res.user.role === 'Student') {
          targetPath = '/student/dashboard';
        }

        setSuccessMsg('Authentication successful! Loading your academic workspace...');
        setTimeout(() => {
          navigate(targetPath);
        }, 1200);
      } else {
        setErrorMsg(res.error || 'Invalid email/username or password.');
      }
    } catch (err) {
      setErrorMsg('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPassword) {
      setErrorMsg('Please fill in all registration fields.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await register(regName, regEmail, regPassword, 'Data Structures & Algorithms Lab');
      if (res.success) {
        setSuccessMsg('Account registered and activated successfully! Logging you in...');
        setTimeout(() => {
          navigate('/faculty/dashboard');
        }, 1200);
      } else {
        setErrorMsg(res.error || 'Registration failed. Make sure your email is pre-approved by the HOD.');
      }
    } catch (err) {
      setErrorMsg('Connection error during faculty registration.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuthSelect = async (gEmail: string, gName: string) => {
    setLoading(true);
    setShowGooglePopup(false);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      // Create a standard base64 encoded JWT structure to mimic a real Google ID Token
      const header = b64EncodeUnicode(JSON.stringify({ alg: "RS256", kid: "dummy-key-id" }));
      const payload = b64EncodeUnicode(JSON.stringify({
        email: gEmail.trim().toLowerCase(),
        name: gName || "Faculty Colleague",
        picture: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80",
        iss: "https://accounts.google.com",
        aud: "109827364567-dummyclientid.apps.googleusercontent.com"
      }));
      const signature = "mock-signature";
      const dummyCredential = `${header}.${payload}.${signature}`;

      const res = await loginWithGoogle(dummyCredential);
      if (res.success && res.user) {
        let targetPath = '/faculty/dashboard';
        if (res.user.role === 'HOD') {
          targetPath = '/hod/dashboard';
        }
        setSuccessMsg('Google Authentication successful! Opening dashboard...');
        setTimeout(() => {
          navigate(targetPath);
        }, 1200);
      } else {
        setErrorMsg(res.error || 'Google login verification failed. Make sure email is pre-approved.');
      }
    } catch (err) {
      setErrorMsg('Google server link failed.');
    } finally {
      setLoading(false);
    }
  };

  const b64EncodeUnicode = (str: string) => {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function(match, p1) {
      return String.fromCharCode(parseInt(p1, 16));
    }));
  };

  const fillDemoCredentials = (roleEmail: string, pass: string = 'password') => {
    setEmail(roleEmail);
    setPassword(pass);
    setErrorMsg('');
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-950 overflow-hidden">
      {/* Panimalar Engineering College Entrance Background Photo */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 scale-100"
        style={{ backgroundImage: `url(${entranceBg})` }}
      />
      {/* Semi-transparent dark overlay to showcase the college entrance gate clearly while preserving text contrast */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-900/65 to-slate-950/85 backdrop-blur-[1px]" />

      {/* Ambient Blue Glow Orbs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>

      {/* Brand logo header */}
      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-2xl text-center mb-8">
        <div className="inline-flex items-center justify-center p-1 bg-white border border-blue-500/30 rounded-full shadow-lg hover:scale-105 transition-transform duration-300">
          <img 
            src={collegeLogo} 
            alt="Panimalar Engineering College Logo" 
            className="w-24 h-24 object-contain rounded-full"
            referrerPolicy="no-referrer"
          />
        </div>
        <h2 className="mt-4 text-3xl font-extrabold text-white tracking-tight">
          Laboratory Management
        </h2>
        <p className="mt-1.5 text-sm font-bold text-blue-400">
          Academic Laboratory Record & Student Journal ERP
        </p>
      </div>

      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="bg-white border border-blue-100 shadow-xl shadow-blue-900/5 py-8 px-6 sm:px-10 rounded-3xl max-w-md mx-auto">
          
          <div className="mb-6">
            <span className="text-xs font-black uppercase tracking-widest text-blue-400">
              {isRegister ? 'Faculty Activation' : 'Portal Sign In'}
            </span>
            <h3 className="text-lg font-bold text-slate-800 mt-1">
              {isRegister ? 'Activate Faculty Account' : 'Verify Credentials'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {isRegister 
                ? 'Register with your pre-approved institutional email to set up your account.' 
                : 'Enter your credentials to access your secure dashboard.'}
            </p>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-3 text-rose-800 text-xs font-semibold">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex items-start gap-3 text-emerald-800 text-xs font-semibold">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* REGISTER VIEW */}
          {isRegister ? (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              {/* Name field */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="e.g. Dr. Ramesh Kumar"
                  className="w-full px-4 py-3 border border-slate-200 bg-white rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium"
                />
              </div>

              {/* Email field */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Pre-Approved Email ID
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4.5 h-4.5" />
                  </span>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="username@college.edu"
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 bg-white rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium"
                  />
                </div>
              </div>

              {/* Password field */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Create Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4.5 h-4.5" />
                  </span>
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 bg-white rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 mt-6 border border-transparent rounded-xl text-sm font-bold text-white cursor-pointer shadow-md transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none bg-blue-600 hover:bg-blue-700"
              >
                {loading ? 'Activating Account...' : 'Complete Activation'}
              </button>

              <p className="text-center text-xs text-slate-500 mt-4">
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => setIsRegister(false)}
                  className="text-blue-600 hover:underline font-black"
                >
                  Sign In here
                </button>
              </p>
            </form>
          ) : (
            /* STANDARD LOGIN VIEW */
            <div className="space-y-6">
              <form onSubmit={handleLoginSubmit} className="space-y-5">
                {/* Email / Username Input */}
                <div>
                  <label htmlFor="email" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Email or Username
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4.5 h-4.5" />
                    </span>
                    <input
                      id="email"
                      type="text"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin or email@college.edu"
                      className="w-full pl-10 pr-4 py-3 border border-slate-200 bg-white rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <label htmlFor="password" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Security Password
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4.5 h-4.5" />
                    </span>
                    <input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-3 border border-slate-200 bg-white rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl text-sm font-bold text-white cursor-pointer shadow-md transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none bg-[#0B192C] hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {loading ? 'Verifying Security Token...' : 'Enter Workspace'}
                </button>
              </form>

              {/* Google Authentication Section */}
              <div className="space-y-4 border-t border-slate-100 pt-5">
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-slate-400 font-bold">Or sign in with Google</span>
                </div>

                {/* Google Button */}
                <button
                  type="button"
                  onClick={() => setShowGooglePopup(true)}
                  className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-bold shadow-sm transition-all cursor-pointer hover:border-slate-300"
                >
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  <span>Sign In with Google</span>
                </button>
              </div>

              {/* Activation Toggle */}
              <div className="text-center text-xs text-slate-500 pt-2">
                First time utilizing this portal?{' '}
                <button
                  type="button"
                  onClick={() => setIsRegister(true)}
                  className="text-indigo-600 hover:underline font-black"
                >
                  Activate Faculty Profile
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Google Authentication Modal */}
      {showGooglePopup && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col">
            <div className="p-6 border-b border-slate-100 flex flex-col items-center text-center bg-slate-50">
              <svg className="w-10 h-10 mb-2" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              <h3 className="text-lg font-black text-slate-850">Sign in with Google</h3>
              <p className="text-xs text-slate-500 mt-1">Select your approved institutional Google account</p>
            </div>

            <div className="p-6 space-y-4 max-h-[320px] overflow-y-auto">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">HOD Pre-Approved Google Accounts</span>
              
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => handleGoogleAuthSelect('ramesh.kumar@college.edu', 'Dr. Ramesh Kumar')}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/20 text-left transition-all cursor-pointer group"
                >
                  <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-black uppercase text-xs">R</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800">Dr. Ramesh Kumar</p>
                    <p className="text-[10px] text-slate-400 font-semibold truncate">ramesh.kumar@college.edu</p>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-md text-[9px] font-bold">Approved</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleGoogleAuthSelect('suresh.v@college.edu', 'Dr. Suresh V')}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/20 text-left transition-all cursor-pointer group"
                >
                  <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-black uppercase text-xs">S</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800">Dr. Suresh V</p>
                    <p className="text-[10px] text-slate-400 font-semibold truncate">suresh.v@college.edu</p>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-md text-[9px] font-bold">Approved</span>
                </button>

                <div className="pt-3 border-t border-slate-100 space-y-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Enter another Google Email</span>
                  
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={googleCustomName}
                      onChange={(e) => setGoogleCustomName(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                    />
                    <input
                      type="email"
                      placeholder="your.email@college.edu"
                      value={googleCustomEmail}
                      onChange={(e) => setGoogleCustomEmail(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                    />
                    <button
                      type="button"
                      disabled={!googleCustomEmail}
                      onClick={() => handleGoogleAuthSelect(googleCustomEmail, googleCustomName || 'Faculty Colleague')}
                      className="w-full py-2 bg-[#4285F4] hover:bg-blue-600 text-white text-xs font-bold rounded-xl transition cursor-pointer disabled:opacity-50"
                    >
                      Authenticate with Google
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setShowGooglePopup(false)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
