import { UserRegistrationForm } from "@/components/forms/user-registration-form";

export default function RegisterPage() {
  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-semibold text-white">Join Advanced DB Commerce</h1>
      <p className="text-slate-400">
        Create an account to receive tailored product recommendations and track your activity.
      </p>
      <UserRegistrationForm />
    </section>
  );
}
