"use client";

/** Formulaire de suppression avec confirmation navigateur — factorisé car
 * utilisé sur tous les écrans de liste admin (produits, marques, catégories,
 * véhicules, codes promo). Doit être un Client Component : un gestionnaire
 * d'événement (onSubmit) ne peut pas être passé en prop depuis un Server
 * Component. */
export function ConfirmDeleteForm({
  action,
  hiddenFields,
  confirmMessage,
  label = "Supprimer",
}: {
  action: (formData: FormData) => Promise<void>;
  hiddenFields: Record<string, string>;
  confirmMessage: string;
  label?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(confirmMessage)) e.preventDefault();
      }}
    >
      {Object.entries(hiddenFields).map(([key, value]) => (
        <input key={key} type="hidden" name={key} value={value} />
      ))}
      <button type="submit" className="link-button">
        {label}
      </button>
    </form>
  );
}
