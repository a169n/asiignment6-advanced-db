import { ProfileForm } from "@/components/forms/profile-form";

export default function ProfilePage() {
  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-semibold text-white">Manage profiles</h1>
      <p className="text-slate-400">
        Update a user&apos;s preferences to fine tune their recommendations and saved items.
      </p>
      <ProfileForm />
    </section>
  );
}
