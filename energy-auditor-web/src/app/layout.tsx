import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EnergyAudit | Home Appliance Energy Auditor",
  description:
    "Track energy consumption of 15 home appliances over 30 days. Identify energy hogs, calculate monthly costs, and get smart replacement recommendations.",
  keywords: "energy audit, home appliances, electricity cost, smart home, energy saving",
  openGraph: {
    title: "EnergyAudit — Smart Home Energy Management",
    description: "Know exactly where your electricity bill goes.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
