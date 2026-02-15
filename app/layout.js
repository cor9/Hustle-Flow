import "./globals.css";

export const metadata = {
  title: "Hustle Flow",
  description: "Task manager and project database with AI agent operations",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
