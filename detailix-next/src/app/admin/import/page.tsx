import type { Metadata } from "next";
import { ImportExportPanel } from "./ImportExportPanel";

export const metadata: Metadata = { title: "Import / export", robots: { index: false } };

export default function AdminImportPage() {
  return (
    <div>
      <h1>Import / export catalogue</h1>
      <ImportExportPanel />
    </div>
  );
}
