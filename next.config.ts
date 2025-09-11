import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  sassOptions: {
    // includePaths: [path.join(__dirname, 'src')],
    prependData: `@import "~@/styles/resources.scss";`,
    crossOrigin: 'anonymous',
    swcMinify: true,
    optimizeFonts: false,
    reactStrictMode: true,
    generateEtags: false,
    poweredByHeader: false,
  },
};

export default nextConfig;
