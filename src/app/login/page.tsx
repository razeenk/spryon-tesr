import LoginFlow from "@/components/LoginFlow";

export const metadata = {
    title: "Sign In — Spryon",
    description: "Sign in to your Spryon restaurant dashboard.",
    icons: { icon: "/favicon-rounded.png" },
};

export default function LoginPage() {
    return <LoginFlow />;
}
