// app/help/page.tsx

import { Suspense } from "react";
import HelpPageClient from "../../components/help/HelpPageClient";

export default function HelpPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-white" />}>
            <HelpPageClient />
        </Suspense>
    );
}