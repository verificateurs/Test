"use client";

import { updateUserRoleAction } from "./actions";

export function RoleForm({ userId, role, isSelf }: { userId: string; role: string; isSelf: boolean }) {
  return (
    <form action={updateUserRoleAction} className="admin-actions-row">
      <input type="hidden" name="userId" value={userId} />
      <select name="role" defaultValue={role} disabled={isSelf}>
        <option value="CUSTOMER">Client</option>
        <option value="PRO">Pro</option>
        <option value="ADMIN">Admin</option>
      </select>
      <button type="submit" className="btn-secondary" disabled={isSelf}>
        Mettre à jour
      </button>
    </form>
  );
}
