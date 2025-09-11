import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  swcMinify: true,
  optimizeFonts: false,
  generateEtags: false,
  poweredByHeader: false,
  crossOrigin: 'anonymous',
  sassOptions: {
    // includePaths: [path.join(__dirname, 'src')],
    prependData: `@import "~@/styles/resources.scss";`,
  },
};

export default nextConfig;
