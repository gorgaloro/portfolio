import type { NextConfig } from "next";
import nextMDX from "@next/mdx";
import rehypePrism from "@mapbox/rehype-prism";
import remarkGfm from "remark-gfm";

const nextConfig: NextConfig = {
  pageExtensions: ["js", "jsx", "ts", "tsx", "mdx"],
  outputFileTracingIncludes: {
    "/articles/*": ["./src/app/articles/**/*.mdx"],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async redirects() {
    return [
      {
        source: "/speaking",
        destination: "/",
        permanent: true,
      },
      {
        source: "/uses",
        destination: "/",
        permanent: true,
      },
      {
        source: "/community",
        destination: "/projects",
        permanent: true,
      },
      {
        source: "/community-organizer",
        destination: "/projects",
        permanent: true,
      },
    ];
  },
};

const withMDX = nextMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [rehypePrism],
  },
});

export default withMDX(nextConfig);
