import type { NextConfig } from "next";

const allowedDevOrigins = readAllowedDevOrigins(process.env.NEXTAUTH_URL);

const nextConfig: NextConfig = {
  allowedDevOrigins,
};

export default nextConfig;

function readAllowedDevOrigins(nextAuthUrl: string | undefined) {
  if (!nextAuthUrl) {
    return [];
  }

  try {
    const hostname = new URL(nextAuthUrl).hostname;
    return hostname && hostname !== "localhost" ? [hostname] : [];
  } catch (error) {
    if (error instanceof TypeError) {
      return [];
    }

    throw error;
  }
}
