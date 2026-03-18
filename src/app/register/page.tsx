import { Suspense } from "react";
import RegisterFlow from "@/components/RegisterFlow";

export const metadata = {
    title: "Sign Up — Spryon",
    description: "Create your Spryon account and start managing your restaurant digital menu.",
};

export default function RegisterPage() {
    return (
        <Suspense fallback={<div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F7F8FA", fontFamily: "Inter, sans-serif", color: "#9CA3AF", fontSize: 14 }}>Loading…</div>}>
            <RegisterFlow />
        </Suspense>
    );
}
