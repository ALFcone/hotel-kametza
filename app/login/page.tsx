"use client";
/**
 * ---------------------------------------------------------------------
 * ARCHIVO: app/login/page.tsx
 * PROPÓSITO: Pantalla de Acceso. Sirve tanto para que tú (el Admin) 
 *            entres a tu panel, como para que los clientes se registren
 *            o inicien sesión para ver sus reservas.
 * ---------------------------------------------------------------------
 */
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import {
  Lock,
  Mail,
  User,
  ArrowRight,
  Sparkles,
  ChevronLeft,
  Eye,
  EyeOff,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // 1. Verificar si el usuario ya tiene sesión activa al cargar
  useEffect(() => {
    const checkActiveSession = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          if (user.email === "alfesco86@gmail.com") {
            router.push("/admin");
          } else {
            router.push("/dashboard");
          }
        } else {
          setCheckingSession(false);
        }
      } catch (err) {
        console.error("Error checking session:", err);
        setCheckingSession(false);
      }
    };
    checkActiveSession();
  }, [router]);

  // 2. Ingresar con Google
  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/login`,
        },
      });
    } catch (err: any) {
      setError(err.message || "Error al conectar con Google");
      setLoading(false);
    }
  };

  // 3. Autenticación con Correo/Contraseña
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isLogin) {
        const { data, error: loginError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (loginError) throw loginError;

        if (data?.user) {
          if (data.user.email === "alfesco86@gmail.com") {
            router.push("/admin");
          } else {
            router.push("/dashboard");
          }
        }
      } else {
        const { data, error: signupError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
          },
        });
        if (signupError) throw signupError;

        alert("Cuenta creada. ¡Bienvenido!");
        if (data?.user) {
          if (data.user.email === "alfesco86@gmail.com") {
            router.push("/admin");
          } else {
            router.push("/dashboard");
          }
        }
      }
    } catch (err: any) {
      setError(
        err.message === "Invalid login credentials"
          ? "Credenciales incorrectas. Verifica tu correo y contraseña."
          : err.message || "Ocurrió un error inesperado."
      );
      setLoading(false);
    }
  };

  // Toggle entre Login y Registro con animación
  const toggleMode = () => {
    setIsTransitioning(true);
    setError("");
    setTimeout(() => {
      setIsLogin(!isLogin);
      setIsTransitioning(false);
    }, 200);
  };

  // Skeleton loader premium
  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7]">
        <div className="w-full max-w-md p-10">
          {/* Skeleton card */}
          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="w-14 h-14 rounded-2xl animate-shimmer" />
            </div>
            <div className="h-8 w-48 mx-auto rounded-full animate-shimmer" />
            <div className="h-4 w-64 mx-auto rounded-full animate-shimmer" />
            <div className="h-12 w-full rounded-xl animate-shimmer" />
            <div className="h-px w-full animate-shimmer" />
            <div className="h-12 w-full rounded-xl animate-shimmer" />
            <div className="h-12 w-full rounded-xl animate-shimmer" />
            <div className="h-14 w-full rounded-xl animate-shimmer" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans text-stone-800 relative flex items-center justify-center p-4">
      {/* Fondo de Retablo Ayacuchano */}
      <div className="fixed inset-0 z-0">
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/8/86/Retablo_ayacuchano.jpg"
          alt="Fondo Retablo Ayacuchano"
          className="w-full h-full object-cover object-center scale-105"
        />
        <div className="absolute inset-0 bg-[#FFFDF5]/92 backdrop-blur-[3px]" />
      </div>

      <div className="animate-scale-in relative z-10 w-full max-w-md bg-white/80 backdrop-blur-md rounded-[2.5rem] p-8 md:p-10 shadow-2xl border border-stone-100/50">
        {/* Botón de Regresar */}
        <Link
          href="/"
          className="animate-fade-in-up inline-flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-[#e3004f] transition mb-6 group"
        >
          <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          Volver al Inicio
        </Link>

        {/* Encabezado con transición */}
        <div className={`text-center mb-8 transition-all duration-200 ${isTransitioning ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"}`}>
          <div className="inline-flex p-3 bg-gradient-to-br from-rose-50 to-rose-100 rounded-2xl mb-3 text-rose-900 shadow-inner">
            <Sparkles size={24} className="animate-pulse" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-rose-950">
            {isLogin ? "Bienvenido" : "Crea tu Cuenta"}
          </h1>
          <p className="text-stone-500 text-xs mt-1">
            {isLogin
              ? "Ingresa a tu cuenta para gestionar tus reservas y acceder a tu portal."
              : "Regístrate para reservar habitaciones y ver tu historial."}
          </p>
        </div>

        {/* Botón Google */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="animate-fade-in-up flex items-center justify-center gap-3 w-full bg-white border border-stone-200 text-stone-700 font-bold py-3.5 rounded-xl hover:bg-stone-50 hover:border-stone-300 hover:shadow-md transition-all text-sm mb-6 shadow-sm disabled:opacity-50"
          style={{ animationDelay: "100ms" }}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          {isLogin ? "Ingresar con Google" : "Registrarse con Google"}
        </button>

        <div className="flex items-center gap-4 mb-6">
          <div className="h-px bg-stone-200/60 flex-1" />
          <span className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">
            O con correo
          </span>
          <div className="h-px bg-stone-200/60 flex-1" />
        </div>

        {/* Mensaje de Error */}
        {error && (
          <div className="animate-fade-in-up bg-rose-50 text-rose-800 text-xs p-4 rounded-2xl mb-4 border border-rose-100 font-medium">
            {error}
          </div>
        )}

        {/* Formulario con transición */}
        <form
          onSubmit={handleAuth}
          className={`flex flex-col gap-4 transition-all duration-200 ${isTransitioning ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"}`}
        >
          {!isLogin && (
            <div className="relative animate-fade-in-up">
              <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Nombre completo"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full p-3.5 pl-11 bg-white border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-[#e3004f]/10 focus:border-[#e3004f] transition text-sm"
              />
            </div>
          )}

          <div className="relative animate-fade-in-up" style={{ animationDelay: "150ms" }}>
            <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-3.5 pl-11 bg-white border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-[#e3004f]/10 focus:border-[#e3004f] transition text-sm"
            />
          </div>

          <div className="relative animate-fade-in-up" style={{ animationDelay: "200ms" }}>
            <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full p-3.5 pl-11 pr-11 bg-white border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-[#e3004f]/10 focus:border-[#e3004f] transition text-sm"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 password-toggle"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <button
            disabled={loading}
            className="animate-fade-in-up btn-shimmer w-full bg-[#e3004f] hover:bg-black text-white font-bold py-4 rounded-xl transition shadow-lg hover:shadow-rose-950/20 disabled:opacity-50 text-xs tracking-wider uppercase flex items-center justify-center gap-2 mt-2 cursor-pointer"
            style={{ animationDelay: "250ms" }}
          >
            {loading ? (
              "Procesando..."
            ) : (
              <>
                {isLogin ? "Iniciar Sesión" : "Crear Cuenta"} <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Enlace para cambiar entre Login y Registro */}
        <div className="mt-8 text-center text-xs text-stone-500 animate-fade-in-up" style={{ animationDelay: "300ms" }}>
          {isLogin ? "¿No tienes cuenta? " : "¿Ya tienes cuenta? "}
          <button
            onClick={toggleMode}
            className="font-bold text-[#e3004f] hover:underline"
          >
            {isLogin ? "Regístrate aquí" : "Inicia sesión aquí"}
          </button>
        </div>
      </div>
    </div>
  );
}
