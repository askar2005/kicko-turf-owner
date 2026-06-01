import { useState } from "react";

interface AdminProfile {
  id: string;
  name: string;
  email: string;
  mobile: string;
  token?: string;
}

interface LoginProps {
  onAdminLoginSuccess: (admin: AdminProfile) => void;
}

export default function Login({ onAdminLoginSuccess }: LoginProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState(["", "", "", ""]);

  // Forgot password states
  const [forgotStep, setForgotStep] = useState<'none' | 'email' | 'reset'>('none');
  const [forgotOtp, setForgotOtp] = useState(["", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");

  const handleSubmit = async () => {
    setError(null);
    if (!email.trim() || !password.trim()) {
      setError("Please fill all details");
      return;
    }
    if (!isLogin && (!name.trim() || !mobile.trim())) {
      setError("Please fill all details");
      return;
    }

    try {
      setLoading(true);

      if (isLogin) {
        // Standard Login
        const res = await fetch("http://localhost:5000/api/auth/owner/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Authentication failed");
        onAdminLoginSuccess(data);
      } else {
        // Registration - Send OTP
        const res = await fetch("http://localhost:5000/api/auth/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, name })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to send OTP");
        setOtpStep(true);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError(null);
    try {
      setLoading(true);
      const enteredOtp = otp.join('');

      // 1. Verify OTP
      const verifyRes = await fetch("http://localhost:5000/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: enteredOtp })
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(verifyData.error || "Invalid OTP");

      // 2. Register Owner
      const regRes = await fetch("http://localhost:5000/api/auth/owner/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone: mobile, password })
      });
      const regData = await regRes.json();
      if (!regRes.ok) throw new Error(regData.error || "Registration failed");

      onAdminLoginSuccess(regData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendForgotOtp = async () => {
    setError(null);
    if (!email.trim()) {
      setError("Please enter your email");
      return;
    }
    try {
      setLoading(true);
      const res = await fetch("http://localhost:5000/api/auth/forgot-password/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role: "owner" })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send OTP");
      setForgotStep("reset");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setError(null);
    const enteredOtp = forgotOtp.join('');
    if (enteredOtp.length < 4 || !newPassword.trim()) {
      setError("Please fill all details");
      return;
    }
    try {
      setLoading(true);
      const res = await fetch("http://localhost:5000/api/auth/forgot-password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: enteredOtp, newPassword, role: "owner" })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reset password");

      // Success
      setForgotStep("none");
      setIsLogin(true);
      setPassword("");
      setError("Password reset successfully. Please login.");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-rose-50 via-teal-50 to-indigo-50 flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-lg rounded-3xl bg-white/80 backdrop-blur-md border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 sm:p-10">
        <div className="flex flex-col items-center gap-3 mb-10 text-center">
          <div className="h-16 w-16 rounded-2xl bg-teal-100/50 flex items-center justify-center mb-2 shadow-sm border border-teal-50">
            <div className="h-8 w-8 rounded-xl bg-teal-400/80" />
          </div>
          <h1 className="text-3xl font-serif text-slate-800 tracking-tight">
            {forgotStep !== 'none' ? "Reset Password" : `Turf Owner ${isLogin ? "Login" : "Register"}`}
          </h1>
          <p className="text-slate-500 text-sm">
            {forgotStep === 'email' ? "Enter your email to receive a reset code" :
              forgotStep === 'reset' ? "Enter the verification code and new password" :
                "Enter your credentials to access the workspace"}
          </p>
        </div>

        {forgotStep === 'email' ? (
          <div className="space-y-5">
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5 ml-1">Email ID</label>
              <input
                className="w-full rounded-2xl bg-white border border-slate-200 text-slate-800 px-4 py-3.5 outline-none focus:ring-2 focus:ring-rose-200 transition-all shadow-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@email.com"
                type="email"
              />
            </div>
            {error && <p className="text-rose-500 text-sm mt-1 ml-1 font-medium">{error}</p>}
            <button
              className="mt-6 w-full rounded-full bg-teal-500 hover:bg-teal-600 text-white font-medium py-3.5 transition-all shadow-md hover:shadow-lg disabled:opacity-60"
              onClick={handleSendForgotOtp}
              disabled={loading}
            >
              {loading ? "Sending..." : "Send Reset Code"}
            </button>
            <p className="text-sm text-center text-slate-500 mt-4 cursor-pointer hover:underline" onClick={() => setForgotStep('none')}>
              Back to Login
            </p>
          </div>
        ) : forgotStep === 'reset' ? (
          <div className="space-y-5">
            <p className="text-slate-600 text-sm font-medium text-center mb-4">
              We've sent a code to <span className="font-bold">{email}</span>.
            </p>
            <div className="flex justify-center gap-3 mb-6">
              {forgotOtp.map((digit, idx) => (
                <input
                  key={idx}
                  id={`forgot-otp-${idx}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  className="w-12 h-14 rounded-2xl bg-white border border-slate-200 text-slate-800 text-2xl font-bold text-center outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-all shadow-sm"
                  value={digit}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val.length > 1) return;
                    const newOtp = [...forgotOtp];
                    newOtp[idx] = val;
                    setForgotOtp(newOtp);
                    if (val && idx < 3) document.getElementById(`forgot-otp-${idx + 1}`)?.focus();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Backspace' && !forgotOtp[idx] && idx > 0) {
                      document.getElementById(`forgot-otp-${idx - 1}`)?.focus();
                    }
                  }}
                />
              ))}
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5 ml-1">New Password</label>
              <input
                className="w-full rounded-2xl bg-white border border-slate-200 text-slate-800 px-4 py-3.5 outline-none focus:ring-2 focus:ring-rose-200 transition-all shadow-sm"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                type="password"
              />
            </div>
            {error && <p className="text-rose-500 text-sm mt-1 ml-1 font-medium">{error}</p>}
            <button
              className="mt-6 w-full rounded-full bg-teal-500 hover:bg-teal-600 text-white font-medium py-3.5 transition-all shadow-md hover:shadow-lg disabled:opacity-60"
              onClick={handleResetPassword}
              disabled={loading || forgotOtp.some(d => !d)}
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
            <p className="text-sm text-center text-slate-500 mt-4 cursor-pointer hover:underline" onClick={() => setForgotStep('email')}>
              Back
            </p>
          </div>
        ) : otpStep ? (
          <div className="space-y-6 text-center">
            <p className="text-slate-600 text-sm font-medium">
              We've sent a 4-digit verification code to <span className="font-bold">{email}</span>.
            </p>
            <div className="flex justify-center gap-3">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  id={`otp-${idx}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  className="w-12 h-14 rounded-2xl bg-white border border-slate-200 text-slate-800 text-2xl font-bold text-center outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-all shadow-sm"
                  value={digit}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val.length > 1) return;
                    const newOtp = [...otp];
                    newOtp[idx] = val;
                    setOtp(newOtp);
                    if (val && idx < 3) document.getElementById(`otp-${idx + 1}`)?.focus();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
                      document.getElementById(`otp-${idx - 1}`)?.focus();
                    }
                  }}
                />
              ))}
            </div>
            {error && <p className="text-rose-500 text-sm mt-1 font-medium">{error}</p>}
            <button
              className="mt-4 w-full rounded-full bg-teal-500 hover:bg-teal-600 text-white font-medium py-3.5 transition-all shadow-md hover:shadow-lg disabled:opacity-60"
              onClick={handleVerifyOtp}
              disabled={loading || otp.some(d => !d)}
            >
              {loading ? "Verifying..." : "Verify & Complete Registration"}
            </button>
            <p className="text-sm text-center text-slate-500 cursor-pointer hover:underline mt-4" onClick={() => setOtpStep(false)}>
              Back to Registration
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {!isLogin && (
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1.5 ml-1">Owner Name</label>
                <input
                  className="w-full rounded-2xl bg-white border border-slate-200 text-slate-800 px-4 py-3.5 outline-none focus:ring-2 focus:ring-rose-200 transition-all shadow-sm"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter owner name"
                />
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5 ml-1">Email ID</label>
              <input
                className="w-full rounded-2xl bg-white border border-slate-200 text-slate-800 px-4 py-3.5 outline-none focus:ring-2 focus:ring-rose-200 transition-all shadow-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@email.com"
                type="email"
              />
            </div>

            {!isLogin && (
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1.5 ml-1">Phone</label>
                <input
                  className="w-full rounded-2xl bg-white border border-slate-200 text-slate-800 px-4 py-3.5 outline-none focus:ring-2 focus:ring-rose-200 transition-all shadow-sm"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="Phone number"
                />
              </div>
            )}

            <div>
              <div className="flex justify-between mb-1.5">
                <label className="text-sm font-medium text-slate-700 ml-1">Password</label>
                {isLogin && (
                  <button type="button" onClick={() => setForgotStep('email')} className="text-xs text-teal-600 font-medium hover:underline">
                    Forgot Password?
                  </button>
                )}
              </div>
              <input
                className="w-full rounded-2xl bg-white border border-slate-200 text-slate-800 px-4 py-3.5 outline-none focus:ring-2 focus:ring-rose-200 transition-all shadow-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                type="password"
              />
            </div>

            {error && (
              <p className={`text-sm mt-1 ml-1 font-medium ${error.includes('successfully') ? 'text-teal-600' : 'text-rose-500'}`}>
                {error}
              </p>
            )}

            <button
              className="mt-6 w-full rounded-full bg-teal-500 hover:bg-teal-600 text-white font-medium py-3.5 transition-all shadow-md hover:shadow-lg disabled:opacity-60"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? "Processing..." : isLogin ? "Login" : "Register"}
            </button>

            <p className="text-sm text-center text-slate-500 mt-4 cursor-pointer hover:underline" onClick={() => { setIsLogin(!isLogin); setOtpStep(false); setError(null); }}>
              {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
