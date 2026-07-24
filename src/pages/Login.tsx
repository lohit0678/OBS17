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
  const [regSubjectName, setRegSubjectName] = useState('');
  const [regSubjectCode, setRegSubjectCode] = useState('');
  const [regLabName, setRegLabName] = useState('');

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
        if (res.user.role === 'Admin' || res.user.role === 'HOD') {
          targetPath = '/admin/dashboard';
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
    if (!regName || !regEmail || !regPassword || !regSubjectName) {
      setErrorMsg('Please fill in all registration fields, including Subject Name.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          password: regPassword,
          subjectName: regSubjectName,
          subjectCode: regSubjectCode,
          labName: regLabName || "General Lab"
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setErrorMsg(errorData.error || "Registration failed.");
        setLoading(false);
        return;
      }

      await login(regEmail.trim(), regPassword);
      setSuccessMsg('Account registered and activated successfully! Logging you in...');
      setTimeout(() => {
        navigate('/faculty/dashboard');
      }, 1200);
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
        if (res.user.role === 'Admin') {
          targetPath = '/admin/dashboard';
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
          Lab Monitoring
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

              {/* Subject Name field */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Handling Subject Name
                </label>
                <input
                  type="text"
                  required
                  value={regSubjectName}
                  onChange={(e) => setRegSubjectName(e.target.value)}
                  placeholder="e.g. Data Structures / Python Programming"
                  className="w-full px-4 py-3 border border-slate-200 bg-white rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium"
                />
              </div>

              {/* Subject Code field */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Subject Code
                </label>
                <input
                  type="text"
                  value={regSubjectCode}
                  onChange={(e) => setRegSubjectCode(e.target.value)}
                  placeholder="e.g. CS3401 / CS3451"
                  className="w-full px-4 py-3 border border-slate-200 bg-white rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium"
                />
              </div>

              {/* Lab Room Name field */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Assigned Laboratory Room Name
                </label>
                <input
                  type="text"
                  value={regLabName}
                  onChange={(e) => setRegLabName(e.target.value)}
                  placeholder="e.g. Datascience Laboratory"
                  className="w-full px-4 py-3 border border-slate-200 bg-white rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium"
                />
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
    </div>
  );
}
