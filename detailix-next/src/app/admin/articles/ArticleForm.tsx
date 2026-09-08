"use client";

import { useActionState } from "react";
import type { ArticleActionState } from "./actions";

type Article = { id: string; title: string; excerpt: string; content: string };

const initialState: ArticleActionState = { error: null };

export function ArticleForm({
  action,
  article,
}: {
  action: (prev: ArticleActionState, formData: FormData) => Promise<ArticleActionState>;
  article?: Article;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="checkout-form">
      {article && <input type="hidden" name="id" value={article.id} />}

      <label>
        Titre
        <input type="text" name="title" required maxLength={150} defaultValue={article?.title} />
      </label>
      <label>
        Résumé (affiché dans la liste des guides)
        <textarea name="excerpt" required maxLength={300} rows={2} defaultValue={article?.excerpt} />
      </label>
      <label>
        Contenu
        <textarea name="content" required maxLength={20000} rows={16} defaultValue={article?.content} />
      </label>
      <p className="form-hint">
        Texte brut uniquement — une ligne vide sépare les paragraphes. Le HTML n&apos;est pas interprété : il
        s&apos;affiche tel quel plutôt que d&apos;être exécuté.
      </p>

      {state.error && <p className="form-error">{state.error}</p>}

      <button type="submit" className="btn-primary" disabled={pending}>
        {pending ? "Enregistrement…" : article ? "Mettre à jour" : "Publier l'article"}
      </button>
    </form>
  );
}
