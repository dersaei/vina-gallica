import "./globals.css";
import Header from "./components/Header/Header";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vina Gallica - French Wine Directory",
  description: "Discover French wine producers by region",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Header />
        <main>{children}</main>
      </body>
    </html>
  );
}
