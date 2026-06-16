import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ThroatScan Oracle",
  description: "AI-driven US stock industry analysis MVP",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full bg-[#080b0f] text-zinc-100">
        <main className="min-h-screen">{children}</main>
      </body>
    </html>
  );
}
