
// app/page.tsx

import { JackieCatalog } from "@/components/catalog/JackieCatalog"
import { Suspense } from "react";

export default function Home() {
  return (
      <Suspense fallback={<div className="min-h-screen bg-white" />}>
        <JackieCatalog />
      </Suspense>
  );
}