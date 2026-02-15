import { Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta" });
const space = Space_Grotesk({ subsets: ["latin"], variable: "--font-space" });

export const metadata = {
  title: "Hustle Flow",
  description: "Task manager and project database with AI agent operations",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${jakarta.variable} ${space.variable}`}>{children}</body>
    </html>
  );
}
