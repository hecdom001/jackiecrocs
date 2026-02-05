
// app/page.tsx

import { Suspense } from "react";
import { StoreCatalog } from "@/components/catalog/StoreCatalog";

export default function Home() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-white" />}>
            <StoreCatalog />
        </Suspense>
    );
}
