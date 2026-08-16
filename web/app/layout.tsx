import type { Metadata } from "next";
import { Sora, Wix_Madefor_Text } from "next/font/google";
import { MotionProvider } from "@/components/MotionProvider";
import "./globals.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["700", "800"],
});

const wixMadefor = Wix_Madefor_Text({
  variable: "--font-wix-madefor",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "CobroFlow — Cobra lo que te deben. Controla lo que ganas.",
  description:
    "CobroFlow te muestra cuánto has cobrado, cuánto te deben y qué clientes necesitan seguimiento — todo desde un solo lugar. Empieza gratis.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      data-scroll-behavior="smooth"
      className={`${sora.variable} ${wixMadefor.variable} h-full antialiased`}
    >
      <body className="min-h-dvh flex flex-col">
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
