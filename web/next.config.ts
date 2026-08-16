import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Apaga el indicador flotante de Next dev (el círculo "N") — solo ensucia
  // los screenshots de revisión, no existe en producción de todas formas.
  devIndicators: false,
};

export default nextConfig;
