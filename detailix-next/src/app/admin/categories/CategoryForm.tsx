"use client";

import { useActionState } from "react";
import type { CategoryActionState } from "./actions";

type Category = { id: string; label: string; description: string; position: number };

const initialState: CategoryActionState = { error: null };

export function CategoryForm({
  action,
  category,
}: {
  action: (prev: CategoryActionState, formData: FormData) => Promise<CategoryActionState>;
  category?: Category;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="checkout-form">
      {category && <input type="hidden" name="id" value={category.id} />}
      <label>
        Nom
        <input type="text" name="label" required maxLength={120} defaultValue={category?.label} />
      </label>
      <label>
        Description
        <textarea name="description" required maxLength={500} rows={3} defaultValue={category?.description} />
      </label>
      <label>
        Position d&apos;affichage
        <input type="number" name="position" required min={0} step="1" defaultValue={category?.position ?? 0} />
      </label>

      {state.error && <p className="form-error">{state.error}</p>}

      <button type="submit" className="btn-primary" disabled={pending}>
        {pending ? "Enregistrement…" : category ? "Mettre à jour" : "Créer la catégorie"}
      </button>
    </form>
  );
}
