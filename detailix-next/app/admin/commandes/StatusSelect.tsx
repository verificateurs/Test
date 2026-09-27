"use client";

const STATUS_OPTIONS = ["pending", "paid", "shipped", "cancelled"];

type Props = {
  orderId: string;
  status: string;
  action: (fd: FormData) => void;
};

export function StatusSelect({ orderId, status, action }: Props) {
  return (
    <form action={action} style={{ display: "inline" }}>
      <input type="hidden" name="id" value={orderId} />
      <select
        name="status"
        defaultValue={status}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        style={{ background: "var(--bg-card)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "4px 8px", fontSize: "var(--text-xs)" }}
      >
        {STATUS_OPTIONS.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
    </form>
  );
}
