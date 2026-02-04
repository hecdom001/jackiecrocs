import { Suspense } from "react";
import HelpPageClient from "./HelpPageClient";

export default function HelpPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-white" />}>
            <HelpPageClient />
        </Suspense>
    );
}