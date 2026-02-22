// Central link registry and link helpers
// Use these across the site to keep URLs and display formatting consistent.

export type LinkKey =
  | 'website'
  | 'substack'
  | 'linkedin'
  | 'instagram'
  | 'x'
  | 'bluesky'
  | 'luma'
  | 'github';

export type LinkMap = Partial<Record<LinkKey, string>>;

export const LINK_LABELS: Record<LinkKey, string> = {
  website: 'Website',
  substack: 'Substack',
  linkedin: 'LinkedIn',
  instagram: 'Instagram',
  x: 'X',
  bluesky: 'Bluesky',
  luma: 'Luma',
  github: 'GitHub',
};

// Registry of canonical links per initiative
export const LINKS = {
  fogCityFans: {
    website: 'https://fogcityfans.com',
    instagram: 'https://www.instagram.com/fogcityfans/',
    x: 'https://x.com/fogcityfans',
    bluesky: 'https://bsky.app/profile/fogcityfans.bsky.social',
    substack: 'https://bayconnectors.substack.com',
    // linkedin intentionally omitted for now
    github: 'https://github.com/gorgaloro',
  } as LinkMap,

  careerCoPilot: {
    website: 'https://careercopilot.lovable.app/',
    substack: 'https://bayconnectors.substack.com',
    linkedin: 'https://www.linkedin.com/in/allenhwalker/',
    github: 'https://github.com/gorgaloro',
  } as LinkMap,

  mobileNetworkingAssistant: {
    substack: 'https://bayconnectors.substack.com',
    linkedin: 'https://www.linkedin.com/in/allenhwalker/',
    github: 'https://github.com/gorgaloro',
  } as LinkMap,

  startupAdvisoryNetwork: {
    substack: 'https://bayconnectors.substack.com',
    linkedin: 'https://www.linkedin.com/in/allenhwalker/',
    x: 'https://x.com/BayConnector',
  } as LinkMap,

  bayAreaConnectors: {
    website: 'https://bayconnectors.com/',
    substack: 'https://bayconnectors.substack.com',
    instagram: 'https://www.instagram.com/bayconnectors/',
    bluesky: 'https://bsky.app/profile/bayconnectors.bsky.social',
    x: 'https://x.com/BayConnector',
    linkedin: 'https://www.linkedin.com/company/bayconnectors/',
    luma: 'https://luma.com/techconnections?k=c',
    github: 'https://github.com/gorgaloro',
  } as LinkMap,

  greenerHorizons: {
    substack: 'https://greenerhorizons.substack.com',
    linkedin: 'https://linkedin.com/company/greenerhorizons',
    x: 'https://x.com/greenerhorizons',
  } as LinkMap,
} as const;

// Convert a LinkMap to the component-friendly array format, in a consistent order.
const DEFAULT_ORDER: LinkKey[] = [
  'website',
  'instagram',
  'luma',
  'x',
  'bluesky',
  'substack',
  'linkedin',
  'github',
];

export const toFollowLinks = (map: LinkMap, order: LinkKey[] = DEFAULT_ORDER) =>
  order
    .filter((key) => !!map[key])
    .map((key) => ({ label: LINK_LABELS[key], href: map[key]! }));

// Shared normalizer for deduping/grouping
export const normalizeHref = (href: string) =>
  href.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '').toLowerCase();

// Format link text for display (keeps full href for the actual link)
export const formatLinkText = (label: string, href: string) => {
  const normalized = href.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '');
  const l = label.toLowerCase();

  // Instagram -> @handle
  if (l.includes('instagram') || l === 'ig') {
    const m = normalized.match(/^(?:instagram\.com)\/([^/?#]+)/i);
    if (m?.[1]) return `@${m[1]}`;
  }

  // X / Twitter -> @handle
  if (l === 'x' || l.includes('twitter')) {
    const m = normalized.match(/^(?:x\.com|twitter\.com)\/([^/?#]+)/i);
    if (m?.[1]) return `@${m[1]}`;
  }

  // Bluesky -> @handle (from /profile/<handle>)
  if (l.includes('bluesky') || l.includes('bsky')) {
    const m = normalized.match(/^bsky\.app\/profile\/([^/?#]+)/i);
    if (m?.[1]) return `@${m[1]}`;
  }

  // Substack -> subdomain.substack.com
  if (normalized.includes('substack.com')) {
    return normalized.split('/')[0];
  }

  // LinkedIn / GitHub -> keep concise path
  if (normalized.startsWith('linkedin.com/') || normalized.startsWith('github.com/')) {
    return normalized;
  }

  // Default -> domain only
  return normalized.split('/')[0];
};
