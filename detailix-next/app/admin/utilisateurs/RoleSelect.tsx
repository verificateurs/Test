"use client";

const ROLES = ["USER", "PRO", "ADMIN"] as const;

type Props = {
  userId: string;
  role: string;
  action: (fd: FormData) => void;
};

export function RoleSelect({ userId, role, action }: Props) {
  return (
    <form action={action} style={{ display: "inline" }}>
      <input type="hidden" name="id" value={userId} />
      <select
        name="role"
        defaultValue={role}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        style={{ background: "var(--bg-card)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "4px 8px", fontSize: "var(--text-xs)" }}
      >
        {ROLES.map((r) => (
          <option key={r} value={r}>{r}</option>
        ))}
      </select>
    </form>
  );
}
