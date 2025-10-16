// Add this redirects() function to /Users/raillyhugo/Railly/website/next.config.mjs
// Inside the nextConfig object

async redirects() {
  return [
    // Blog post redirects to railly.dev
    {
      source: '/blog/og-image',
      destination: 'https://railly.dev/blog/og-image',
      permanent: true,
    },
    {
      source: '/blog/storybook-vite',
      destination: 'https://railly.dev/blog/storybook-vite',
      permanent: true,
    },
    {
      source: '/blog/how-to-setup-python-environment',
      destination: 'https://railly.dev/blog/how-to-setup-python-environment',
      permanent: true,
    },
    {
      source: '/blog/noise-contrast',
      destination: 'https://railly.dev/blog/noise-contrast',
      permanent: true,
    },
    {
      source: '/blog/one-hunter',
      destination: 'https://railly.dev/blog/one-hunter',
      permanent: true,
    },
    {
      source: '/blog/spotigen-chat-gpt-plugin',
      destination: 'https://railly.dev/blog/spotigen-chat-gpt-plugin',
      permanent: true,
    },
    {
      source: '/blog/tinte',
      destination: 'https://railly.dev/blog/tinte',
      permanent: true,
    },
    // Redirect main blog page
    {
      source: '/blog',
      destination: 'https://railly.dev/blog',
      permanent: true,
    },
  ];
}
