/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  outputFileTracingIncludes: {
    "/**": ["./node_modules/@swc/helpers/**"],
  },
  experimental: {
    useTypeScriptCli: true,
  },
};

module.exports = nextConfig;
