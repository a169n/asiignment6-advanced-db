import { LoginForm } from "@/components/forms/login-form";

export default function LoginPage() {
  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-semibold text-white">Sign in</h1>
      <p className="text-slate-400">Access your personalized catalog and recommendations.</p>
      <LoginForm />
    </section>
  );
}
