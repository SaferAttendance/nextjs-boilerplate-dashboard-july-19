// app/dashboard/layout.tsx
import React from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section>
      {/* You can add a sidebar or nav here */}
      <nav className="p-4 bg-gray-100 border-b">Dashboard Navigation</nav>
      <main className="p-6">{children}</main>
    </section>
  );
}
