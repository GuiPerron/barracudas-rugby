/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",        // site statique (dossier out/) servi par Cloudflare Pages
  trailingSlash: true,     // /commanditaires/ → commanditaires/index.html
  images: { unoptimized: true }, // images déjà optimisées en WebP par scripts/images.mjs
};
export default nextConfig;
