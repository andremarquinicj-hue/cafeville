import type { Metadata } from "next";
import "./globals.css";
import "./game.css";
import { AuthProvider } from "@/contexts/AuthContext";

export const metadata: Metadata = {
  title: "CaféVille",
  description: "Seu café, seus amigos, sua história.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body><AuthProvider>{children}</AuthProvider></body>
    </html>
  );
}
