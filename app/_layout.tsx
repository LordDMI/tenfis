import { Stack } from "expo-router";
import AuthWrapper from "@/app/components/AuthWrapper";

import "./globals.css";

export default function App() {
    return (
        <AuthWrapper>
            <Stack screenOptions={{ headerShown: false }} />
        </AuthWrapper>
    );
}
