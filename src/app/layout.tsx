import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StockFlow IMS — Inventory Management System",
  description: "Sistem inventory profesional untuk mengelola stok, transaksi, gudang, dan laporan dalam satu workspace.",
  keywords: ["inventory management", "sistem gudang", "stock management", "portfolio Dimas Riyanto"],
  robots: { index: true, follow: true },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#14212b" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="id"><body>{children}</body></html>; }
