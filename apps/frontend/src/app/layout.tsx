import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RAG Platform",
  description: "Enterprise RAG pipeline design and evaluation platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans">{children}</body>
    </html>
  );
}
