import ChangePasswordForm from "./ChangePasswordForm";

export const metadata = { title: "Settings — WHVAC Admin" };

export default function SettingsPage() {
  return (
    <div className="p-6 lg:p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-white">Settings</h1>
        <p className="text-white/40 text-sm mt-0.5">Manage your admin account</p>
      </div>

      <div className="bg-white/[0.04] border border-white/8 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/8">
          <h2 className="text-sm font-semibold text-white">Change Password</h2>
          <p className="text-white/30 text-xs mt-0.5">Update your admin login password</p>
        </div>
        <div className="p-5">
          <ChangePasswordForm />
        </div>
      </div>
    </div>
  );
}
