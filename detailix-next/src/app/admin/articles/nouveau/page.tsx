import type { Metadata } from "next";
import { ArticleForm } from "../ArticleForm";
import { createArticleAction } from "../actions";

export const metadata: Metadata = { title: "Nouvel article", robots: { index: false } };

export default function NewArticlePage() {
  return (
    <div>
      <h1>Nouvel article</h1>
      <div className="admin-card">
        <ArticleForm action={createArticleAction} />
      </div>
    </div>
  );
}
