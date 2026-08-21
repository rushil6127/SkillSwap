import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SkillSwap — Campus Skills Marketplace",
  description: "Exchange skills. Earn credits. Help your campus.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
