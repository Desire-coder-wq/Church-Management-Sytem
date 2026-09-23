import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faEye, 
  faEyeSlash, // Changed from faEyeOff to faEyeSlash
  faChurch, 
  faArrowLeft, 
  faEnvelope, 
  faLock, 
  faUsers, 
  faHeart, 
  faChartBar, 
  faShieldHalved,
  faArrowRight
} from "@fortawesome/free-solid-svg-icons";
import { api, getError } from "../../api/client";
import { useAuthStore } from "../../stores/auth-store";
import churchImage from "../../../Assets/Images/Church.jpg";

export function AuthForm({ signup = false }: { signup?: boolean }) {
  const [form, setForm] = useState({
    churchName: "",
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [waitingForServer, setWaitingForServer] = useState(false);
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);

  useEffect(() => {
    // Start a sleeping API while the user is filling in the form.
    void api.get("/health", { timeout: 90_000 }).catch(() => undefined);
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (signup && form.churchName.trim().length < 2)
      next.churchName = "Enter your church name (at least 2 characters).";
    if (signup && form.fullName.trim().length < 2)
      next.fullName = "Enter your full name (at least 2 characters).";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      next.email = "Enter a valid email address.";
    if (!form.password) next.password = "Enter your password.";
    else if (
      signup &&
      (form.password.length < 8 ||
        !/[a-z]/.test(form.password) ||
        !/[A-Z]/.test(form.password) ||
        !/[0-9]/.test(form.password))
    )
      next.password =
        "Use 8 or more characters, uppercase and lowercase letters, and a number.";
    if (
      signup &&
      (!form.confirmPassword || form.confirmPassword !== form.password)
    )
      next.confirmPassword = "Enter the same password again.";
    setErrors(next);
    setNotice("");
    if (Object.keys(next).length) return;
    setBusy(true);
    const waitingTimer = window.setTimeout(() => setWaitingForServer(true), 8_000);
    try {
      const payload = signup
        ? {
            churchName: form.churchName.trim(),
            fullName: form.fullName.trim(),
            email: form.email.trim().toLowerCase(),
            password: form.password,
          }
        : { email: form.email.trim().toLowerCase(), password: form.password };
      const { data } = await api.post(
        signup ? "/auth/signup" : "/auth/login",
        payload,
        { timeout: 120_000 },
      );
      setSession(data.accessToken, data.user);
      navigate("/dashboard");
    } catch (error) {
      if (signup && axios.isAxiosError(error) && !error.response) {
        setNotice("We could not confirm whether registration completed. Try signing in with this email before submitting the registration form again.");
      } else {
        setNotice(getError(error));
      }
    } finally {
      window.clearTimeout(waitingTimer);
      setWaitingForServer(false);
      setBusy(false);
    }
  }

  const names: (keyof typeof form)[] = signup
    ? ["churchName", "fullName", "email", "password", "confirmPassword"]
    : ["email", "password"];
  const labels = {
    churchName: "Church name",
    fullName: "Administrator full name",
    email: "Email address",
    password: "Password",
    confirmPassword: "Confirm password",
  };

  return (
    <main className="min-h-screen lg:grid lg:grid-cols-2">
      {/* Left Side - Dark Blue Panel */}
      <aside className="relative hidden bg-navy p-16 text-white lg:flex lg:flex-col lg:justify-between overflow-hidden">
        {/* Background Image Overlay */}
        <div 
          className="absolute inset-0 z-0 opacity-20 bg-cover bg-center"
          style={{ backgroundImage: `url(${churchImage})` }}
        ></div>
        <div className="absolute inset-0 z-0 bg-navy/80"></div>

        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-3 text-xl font-semibold">
            <FontAwesomeIcon icon={faChurch} className="text-gold text-3xl" />
            <div>
              <div className="font-bold">Church Pledge</div>
              <div className="text-xs font-normal text-slate-300">Faith. Giving. Greater Impact.</div>
            </div>
          </Link>
          
          <div className="mt-16">
            <p className="mb-5 flex items-center gap-3 text-xs font-semibold uppercase tracking-widest text-slate-300">
             Built for your ministry
            </p>
            <h1 className="text-5xl font-bold leading-tight">
            
              <br />
              <span className="text-gold">Support every purpose.</span>
            </h1>
            <p className="mt-6 max-w-md leading-7 text-slate-300">
              Your members, campaigns and collections in one organized church
              workspace.
            </p>

            {/* Feature Icons Row */}
            <div className="mt-12 grid grid-cols-4 gap-4 text-center">
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-2xl">
                  <FontAwesomeIcon icon={faUsers} />
                </div>
                <span className="text-xs font-medium">Manage<br/>Members</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-2xl">
                  <FontAwesomeIcon icon={faHeart} />
                </div>
                <span className="text-xs font-medium">Track<br/>Pledges</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-2xl">
                  <FontAwesomeIcon icon={faChartBar} />
                </div>
                <span className="text-xs font-medium">View<br/>Reports</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-2xl">
                  <FontAwesomeIcon icon={faShieldHalved} />
                </div>
                <span className="text-xs font-medium">Secure<br/>& Reliable</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="relative z-10 mt-16 flex items-center gap-3 text-sm text-slate-400">
     
        </div>
      </aside>

      {/* Right Side - Form */}
      <section className="flex items-center justify-center bg-white px-6 py-10">
        <div className="w-full max-w-md">
          <Link
            to="/"
            className="mb-8 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-navy transition-colors"
          >
            <FontAwesomeIcon icon={faArrowLeft} size="sm" />
            Back to home
          </Link>
          
          <h2 className="text-3xl font-bold text-navy">
            {signup ? "Register your church" : "Welcome back"}
          </h2>
          <p className="mt-3 mb-8 text-slate-500">
            {signup
              ? "Create your workspace and administrator account."
              : "Sign in to your church workspace."}
          </p>

          {notice && (
            <p
              role="alert"
              className="mb-5 rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-100"
            >
              {notice}
            </p>
          )}

          {busy && waitingForServer && (
            <p role="status" className="mb-5 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
              The server is responding slowly. Please keep this page open while we finish your request.
            </p>
          )}

          <form noValidate onSubmit={submit} className="space-y-5">
            {names.map((name) => (
              <div key={name}>
                <label htmlFor={name} className="mb-1 block text-sm font-semibold text-navy">
                  {labels[name]}
                </label>
                <div className="relative">
                  {/* Input Icon */}
                  <div className="absolute left-3 top-3.5 text-slate-400">
                    {name === "email" ? <FontAwesomeIcon icon={faEnvelope} /> : 
                     name.includes("password") ? <FontAwesomeIcon icon={faLock} /> : 
                     <FontAwesomeIcon icon={faChurch} />}
                  </div>
                  
                  <input
                    id={name}
                    className={`w-full rounded-lg border bg-slate-50 py-3 pl-10 pr-4 text-navy outline-none transition-all focus:border-navy focus:bg-white focus:ring-1 focus:ring-navy ${
                      errors[name] ? "border-red-500" : "border-slate-200"
                    }`}
                    type={
                      name === "email"
                        ? "email"
                        : name === "confirmPassword" ||
                            (name === "password" && !visible)
                          ? "password"
                          : "text"
                    }
                    value={form[name]}
                    aria-invalid={!!errors[name]}
                    aria-describedby={`${name}-help`}
                    autoComplete={
                      name === "password"
                        ? signup
                          ? "new-password"
                          : "current-password"
                        : name === "email"
                          ? "email"
                          : "off"
                    }
                    onChange={(event) =>
                      setForm({ ...form, [name]: event.target.value })
                    }
                  />
                  {name === "password" && (
                    <button
                      type="button"
                      className="absolute right-3 top-3.5 text-slate-400 hover:text-navy"
                      aria-label={visible ? "Hide password" : "Show password"}
                      onClick={() => setVisible(!visible)}
                    >
                      {/* FIXED: Changed faEyeOff to faEyeSlash */}
                      {visible ? <FontAwesomeIcon icon={faEyeSlash} /> : <FontAwesomeIcon icon={faEye} />}
                    </button>
                  )}
                </div>
                <p
                  id={`${name}-help`}
                  className={`mt-1 text-xs ${errors[name] ? "text-red-500" : "text-slate-400"}`}
                >
                  {errors[name] ||
                    (name === "password" && signup
                      ? "8+ characters, uppercase and lowercase letters, and a number."
                      : "")}
                </p>
              </div>
            ))}

            <button 
              disabled={busy} 
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-navy py-3 font-semibold text-white transition-colors hover:bg-slate-800 disabled:opacity-70"
            >
              {busy
                ? "Please wait…"
                : signup
                  ? "Create church workspace"
                  : "Sign in"}
              {!busy && <FontAwesomeIcon icon={faArrowRight} size="sm" />}
            </button>
          </form>
          
          <p className="mt-7 text-center text-sm text-slate-500">
            {signup ? "Already have an account?" : "New church?"}{" "}
            <Link
              to={signup ? "/login" : "/signup"}
              className="font-semibold text-navy underline underline-offset-4 hover:text-gold transition-colors"
            >
              {signup ? "Sign in" : "Register your church"}
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
