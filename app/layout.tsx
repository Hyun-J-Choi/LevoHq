import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LevoHQ",
  description: "Premium AI operating system for service businesses.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-[#0A0A0F] text-[#F5F2E8]">{children}</body>
    </html>
  );
}
