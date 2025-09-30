// frontend/src/components/PasswordManager.jsx
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Key,
  Mail,
  Lock,
  CheckCircle,
  AlertCircle,
  Loader,
  X,
} from "lucide-react";
import api from "../services/api";

function PasswordManager({
  role,
  initialMode = "change",
  redirectAfterReset = true,
}) {
  const location = useLocation();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    oldPassword: "",
    newPassword: "",
    otp: "",
  });
  const [mode, setMode] = useState(initialMode); // change | forgot | reset
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // 'success' or 'error'
  const [loading, setLoading] = useState(false);

  // Prefill behavior:
  // 1) if location.state.email (from login link) use that
  // 2) otherwise if logged-in user (localStorage) use that when in "change" mode
  useEffect(() => {
    if (location?.state?.email) {
      setForm((s) => ({ ...s, email: location.state.email }));
    } else if (initialMode === "change") {
      try {
        const stored = localStorage.getItem("user");
        if (stored) {
          const parsed = JSON.parse(stored);
          const email = parsed?.email ?? parsed?.data?.email;
          if (email) setForm((s) => ({ ...s, email }));
        }
      } catch (e) {
        console.error(e);
      }
    }
    setMode(initialMode);
  }, [location?.state, initialMode]);

  const handleSubmit = async () => {
    setMessage("");
    setMessageType("");
    setLoading(true);
    try {
      let res;
      if (mode === "change") {
        res = await api.post(`/${role}/change-password`, {
          email: form.email,
          oldPassword: form.oldPassword,
          newPassword: form.newPassword,
        });
        setMessage(res.data.message || "Password changed successfully!");
        setMessageType("success");
      } else if (mode === "forgot") {
        res = await api.post(`/${role}/forgot-password`, { email: form.email });
        setMessage(res.data.message || "OTP sent to your email.");
        setMessageType("success");
        setMode("reset");
      } else if (mode === "reset") {
        res = await api.post(`/${role}/reset-password`, {
          email: form.email,
          otp: form.otp,
          newPassword: form.newPassword,
        });
        setMessage(res.data.message || "Password reset successful!");
        setMessageType("success");
        if (redirectAfterReset) {
          setTimeout(() => {
            navigate(`/${role}/login`);
          }, 1800);
        }
      }
    } catch (err) {
      setMessage(
        err?.response?.data?.message || err.message || "Something went wrong."
      );
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    navigate(`/${role}/dashboard`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 font-sans">
      <style>
        {`
          @keyframes fade-in-up {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in-up {
            animation: fade-in-up 0.6s ease-out;
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .animate-spin-slow {
            animation: spin 2s linear infinite;
          }
        `}
      </style>
      <div className="bg-white/10 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-white/30 w-full max-w-lg text-white animate-fade-in-up">
        <div className="flex justify-end -mt-4 -mr-4 mb-2">
          <button
            onClick={handleClose}
            className="text-white/70 hover:text-white transition duration-200"
            aria-label="Close Form"
          >
            <X size={24} />
          </button>
        </div>
        <div className="text-center mb-6">
          <Key
            size={48}
            className="text-cyan-400 mx-auto mb-2 drop-shadow-md"
          />
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white drop-shadow-lg">
            Password <span className="text-cyan-400">Manager</span>
          </h2>
          <p className="mt-1 text-white/80 text-base">
            Manage your {role.toUpperCase()} account password.
          </p>
        </div>

        <div className="flex gap-4 mb-5 justify-center">
          {["forgot", "reset"].map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                setMessage("");
                setMessageType("");
              }}
              className={`px-4 py-2 rounded-full font-semibold text-sm transition-all duration-300 ${
                mode === m
                  ? "bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-lg border border-white/20"
                  : "bg-white/20 text-white hover:bg-white/30"
              }`}
              type="button"
            >
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <div className="relative">
            <Mail
              size={20}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70"
            />
            <input
              type="email"
              placeholder="Email Address"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full p-2.5 pl-10 rounded-md text-sm bg-white/20 placeholder-white/50 text-white border border-white/30 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition"
              disabled={mode === "change" || mode === "reset"}
            />
          </div>

          {mode === "change" && (
            <>
              <div className="relative">
                <Lock
                  size={20}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70"
                />
                <input
                  type="password"
                  placeholder="Current Password"
                  value={form.oldPassword}
                  onChange={(e) =>
                    setForm({ ...form, oldPassword: e.target.value })
                  }
                  className="w-full p-2.5 pl-10 rounded-md text-sm bg-white/20 placeholder-white/50 text-white border border-white/30 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition"
                />
              </div>
              <div className="relative">
                <Lock
                  size={20}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70"
                />
                <input
                  type="password"
                  placeholder="New Password"
                  value={form.newPassword}
                  onChange={(e) =>
                    setForm({ ...form, newPassword: e.target.value })
                  }
                  className="w-full p-2.5 pl-10 rounded-md text-sm bg-white/20 placeholder-white/50 text-white border border-white/30 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition"
                />
              </div>
            </>
          )}

          {mode === "reset" && (
            <>
              <div className="relative">
                <Key
                  size={20}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70"
                />
                <input
                  type="text"
                  placeholder="OTP"
                  value={form.otp}
                  onChange={(e) => setForm({ ...form, otp: e.target.value })}
                  className="w-full p-2.5 pl-10 rounded-md text-sm bg-white/20 placeholder-white/50 text-white border border-white/30 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition"
                />
              </div>
              <div className="relative">
                <Lock
                  size={20}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70"
                />
                <input
                  type="password"
                  placeholder="New Password"
                  value={form.newPassword}
                  onChange={(e) =>
                    setForm({ ...form, newPassword: e.target.value })
                  }
                  className="w-full p-2.5 pl-10 rounded-md text-sm bg-white/20 placeholder-white/50 text-white border border-white/30 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition"
                />
              </div>
            </>
          )}

          <button
            onClick={handleSubmit}
            className="w-full py-2.5 text-sm bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-lg font-semibold shadow-lg hover:from-cyan-600 hover:to-teal-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            type="button"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader size={20} className="mr-2 animate-spin-slow" /> Please
                wait...
              </>
            ) : (
              <>
                {mode === "forgot"
                  ? "Send OTP"
                  : mode === "reset"
                  ? "Reset Password"
                  : "Change Password"}
              </>
            )}
          </button>
        </div>

        {message && (
          <p
            className={`mt-4 text-center text-sm font-medium flex items-center justify-center gap-1.5 ${
              messageType === "success" ? "text-green-400" : "text-red-400"
            }`}
          >
            {messageType === "success" ? (
              <CheckCircle size={20} />
            ) : (
              <AlertCircle size={20} />
            )}
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

export default PasswordManager;
