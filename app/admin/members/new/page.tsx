import CreateMemberForm from "./CreateMemberForm";

export const metadata = { title: "Add Member — WHVAC Admin" };

export default function NewMemberPage() {
  return (
    <div className="p-6 lg:p-8 max-w-2xl">
      <div className="mb-6">
        <a href="/admin/members" className="text-white/40 hover:text-white/70 text-sm transition">
          ← Back to members
        </a>
      </div>
      <h1 className="text-xl font-bold text-white mb-1">Add New Member</h1>
      <p className="text-white/40 text-sm mb-6">
        Creates an auth account, NocoDB record, and sends the appropriate payment email.
      </p>
      <CreateMemberForm />
    </div>
  );
}
