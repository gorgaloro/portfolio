import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import { SimpleLayout } from '@/components/SimpleLayout'
import { LINKS, toFollowLinks, normalizeHref as normalizeHrefGlobal, formatLinkText as formatLinkTextGlobal } from '@/lib/links'

type ProjectCardProps = {
  name: string;
  tagline: string;
  logoUrl?: string;
  description: ReactNode;
  website?: string;
  status?: string;
  outcomes?: string;
  helpNeeded?: ReactNode;
  launchStatusRows?: {
    phase: string;
    done?: boolean;
    narrative?: string | string[];
  }[];
  followLinks?: { label: string; href: string }[];
  involvementNeeds?: { label: string; seeking: boolean }[];
  launchSummary?: ReactNode;
};

// --- Inline SVG Icons ---
const GlobeIcon = () => (
  <svg
    className="h-4 w-4 text-neutral-500"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 0 20 15.3 15.3 0 0 1 0-20z" />
  </svg>
);

const InfoIcon = () => (
  <svg
    className="h-4 w-4 text-neutral-500"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

const ChartIcon = () => (
  <svg
    className="h-4 w-4 text-neutral-500"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

const HelpIcon = () => (
  <svg
    className="h-4 w-4 text-neutral-500"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.82 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

// Minimal social icons
const InstagramIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.3" cy="6.7" r="1.2" fill="currentColor" stroke="none" />
  </svg>
);

const XIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M4 4l16 16M20 4L4 20" />
  </svg>
);

const BlueskyIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 10c2.7-4.5 7-7 9-7-1.2 3.8-3 6-5 7 2 .8 3.7 3 5 7-2 0-5.8-1.7-9-5-3.2 3.3-7 5-9 5 1.3-4 3-6.2 5-7-2-1-3.8-3.2-5-7 2 0 6.3 2.5 9 7z" />
  </svg>
);

const SubstackIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <path d="M6 8h12M6 11h12M8 16h8" />
  </svg>
);

const LinkedInIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
    <rect x="3" y="3" width="18" height="18" rx="3" className="text-[#0A66C2]" />
    <rect x="6.2" y="10" width="2.4" height="7" className="text-white" />
    <circle cx="7.4" cy="7.4" r="1.2" className="text-white" />
    <path d="M12 10.2c1.8 0 3 1.1 3 3.3V17h-2.4v-3.1c0-.9-.5-1.5-1.4-1.5-.9 0-1.5.6-1.5 1.5V17H7.3v-7h2.3v.9c.5-.6 1.3-1 2.4-1z" className="text-white" />
  </svg>
);

const GitHubIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.7c-3 .6-3.6-1.3-3.6-1.3-.5-1.1-1.1-1.4-1.1-1.4-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.8.8.1-.7.3-1.1.6-1.3-2.4-.3-4.9-1.2-4.9-5.4 0-1.2.4-2.1 1-2.9-.1-.3-.4-1.4.1-2.8 0 0 .9-.3 2.9 1.1a9.9 9.9 0 0 1 5.4 0c2-1.4 2.9-1.1 2.9-1.1.5 1.4.2 2.5.1 2.8.6.8 1 1.8 1 2.9 0 4.2-2.5 5.1-4.9 5.4.3.3.6.8.6 1.6v2.3c0 .3.2.6.7.5A10 10 0 0 0 12 2z" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="3" y="4" width="18" height="17" rx="2" />
    <line x1="8" y1="3" x2="8" y2="7" />
    <line x1="16" y1="3" x2="16" y2="7" />
    <line x1="3" y1="9" x2="21" y2="9" />
  </svg>
);

const socialIconFor = (label: string) => {
  const l = label.toLowerCase();
  if (l.includes('instagram') || l === 'ig') return <InstagramIcon />;
  if (l === 'x' || l.includes('twitter')) return <XIcon />;
  if (l.includes('bluesky') || l.includes('bsky')) return <BlueskyIcon />;
  if (l.includes('substack')) return <SubstackIcon />;
  if (l.includes('linkedin')) return <LinkedInIcon />;
  if (l.includes('luma')) return <CalendarIcon />;
  if (l.includes('github')) return <GitHubIcon />;
  return <GlobeIcon />;
};

const normalizeHref = normalizeHrefGlobal;
const formatLinkText = (label: string, href: string) => formatLinkTextGlobal(label, href);

// Section label band used in card body
const SectionLabel = ({ children }: { children: any }) => (
  <div className="block w-full rounded bg-neutral-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-neutral-600">
    {children}
  </div>
);

// Categorize follow links into three equal columns (with URL-level de-duplication)
const categorizeFollowLinks = (links: { label: string; href: string }[]) => {
  const updates: { label: string; href: string }[] = [];
  const social: { label: string; href: string }[] = [];
  const dev: { label: string; href: string }[] = [];
  const seen = new Set<string>();

  links.forEach((link) => {
    const norm = normalizeHref(link.href);
    if (seen.has(norm)) return; // skip duplicates by normalized URL
    seen.add(norm);

    const l = link.label.toLowerCase();
    if (l.includes('website') || l.includes('substack')) {
      updates.push(link);
    } else if (l.includes('instagram') || l === 'ig' || l === 'x' || l.includes('twitter') || l.includes('bluesky') || l.includes('bsky') || l.includes('linkedin') || l.includes('luma')) {
      social.push(link);
    } else if (l.includes('github') || l.includes('gitlab')) {
      dev.push(link);
    } else {
      updates.push(link); // default bucket
    }
  });

  return { updates, social, dev };
};

function ProjectCard({
  name,
  tagline,
  logoUrl,
  description,
  website,
  status,
  outcomes,
  helpNeeded,
  launchStatusRows,
  followLinks,
  involvementNeeds,
  launchSummary,
}: ProjectCardProps) {
  const groups = followLinks?.length ? categorizeFollowLinks(followLinks) : null;
  /* Launch Status uses native <details>/<summary> for disclosure; no hooks needed. */
  return (
    <article className="grid grid-cols-1 md:grid-cols-[160px_1fr] gap-5 rounded-2xl border border-neutral-200 bg-white/70 p-5 shadow-sm">
      {/* Logo */}
      <div className="relative overflow-hidden rounded-xl bg-white dark:bg-neutral-900/10 w-full aspect-square grid place-items-center">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt={`${name} logo`}
            className="h-full w-full object-contain p-4"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center p-4 text-sm font-medium text-neutral-500">
            {name}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-3">
        <header>
          <h3 className="text-xl font-semibold">{name}</h3>
          <p className="text-sm italic text-neutral-600">{tagline}</p>
        </header>

        <div className="space-y-4">
          <div>
            <SectionLabel>Concept</SectionLabel>
            <div className="mt-2 text-sm text-neutral-700 space-y-3">{description}</div>
          </div>

          {(launchStatusRows?.length || status) ? (
            <div>
              <SectionLabel>Launch status</SectionLabel>
              {launchSummary ? (
                <p className="mt-2 text-sm text-neutral-700">{launchSummary}</p>
              ) : null}
              <details className="group mt-2">
                <summary className="text-sm text-neutral-600 hover:underline cursor-pointer select-none">
                  <span className="group-open:hidden">Expand to see complete launch status</span>
                  <span className="hidden group-open:inline">Collapse detailed launch status</span>
                </summary>
                {launchStatusRows?.length ? (
                  <div className="mt-3 grid grid-cols-[24px_minmax(160px,max-content)_1fr] items-start gap-x-3 gap-y-3">
                    {launchStatusRows.map((row, idx) => (
                      <div key={idx} className="contents">
                        <input
                          type="checkbox"
                          aria-label={row.phase}
                          className="h-4 w-4 cursor-default accent-neutral-700"
                          checked={!!row.done}
                          readOnly
                        />
                        <div className={`text-sm font-medium ${row.done ? 'text-neutral-900' : 'text-neutral-400'}`}>{row.phase}</div>
                        <div className={`text-sm ${row.done ? 'text-neutral-700' : 'text-neutral-400'}`}>
                          {Array.isArray(row.narrative) ? (
                            (() => {
                              const items = row.narrative as string[];
                              const headerIdx = items.findIndex((s) => typeof s === 'string' && s.trim().endsWith(':'));
                              if (headerIdx === -1) {
                                return (
                                  <ul className="list-disc pl-5 space-y-1">
                                    {items.map((item, i) => (
                                      <li key={i}>{item}</li>
                                    ))}
                                  </ul>
                                );
                              }
                              return (
                                <>
                                  {headerIdx > 0 && (
                                    <ul className="list-disc pl-5 space-y-1">
                                      {items.slice(0, headerIdx).map((item, i) => (
                                        <li key={`t-${i}`}>{item}</li>
                                      ))}
                                    </ul>
                                  )}
                                  <ul className="list-disc pl-5 space-y-1">
                                    <li>
                                      {items[headerIdx]}
                                      <ul className="list-[circle] pl-5 space-y-1 mt-1">
                                        {items.slice(headerIdx + 1).map((item, i) => (
                                          <li key={`s-${i}`}>{item}</li>
                                        ))}
                                      </ul>
                                    </li>
                                  </ul>
                                </>
                              );
                            })()
                          ) : row.narrative ? (
                            row.narrative
                          ) : (
                            <span className="text-neutral-400">—</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  status && <p className="mt-3 text-sm text-neutral-700">{status}</p>
                )}
              </details>
            </div>
          ) : null}

          {outcomes && (
            <div>
              <SectionLabel>Outcomes</SectionLabel>
              <p className="mt-2 text-sm text-neutral-700">{outcomes}</p>
            </div>
          )}

          {followLinks?.length ? (
            <div>
              <SectionLabel>Follow the Build</SectionLabel>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
                <div className="space-y-1.5">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500 mb-1.5">Updates</div>
                  {groups?.updates.length ? (
                    groups.updates.map((link) => (
                      <a
                        key={`${name}-updates-${link.label}`}
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 py-1 text-sm text-neutral-700 hover:underline"
                        title={link.label}
                      >
                        <span className="text-neutral-600">{socialIconFor(link.label)}</span>
                        <span className="sr-only">{link.label}</span>
                        <span className="truncate">{formatLinkText(link.label, link.href)}</span>
                      </a>
                    ))
                  ) : (
                    <div className="text-xs text-neutral-400">—</div>
                  )}
                </div>
                <div className="space-y-1.5">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500 mb-1.5">Social Media</div>
                  {groups?.social.length ? (
                    groups.social.map((link) => (
                      <a
                        key={`${name}-social-${link.label}`}
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 py-1 text-sm text-neutral-700 hover:underline"
                        title={link.label}
                      >
                        <span className="text-neutral-600">{socialIconFor(link.label)}</span>
                        <span className="sr-only">{link.label}</span>
                        <span className="truncate">{formatLinkText(link.label, link.href)}</span>
                      </a>
                    ))
                  ) : (
                    <div className="text-xs text-neutral-400">—</div>
                  )}
                </div>
                <div className="space-y-1.5">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500 mb-1.5">Development</div>
                  {groups?.dev.length ? (
                    groups.dev.map((link) => (
                      <a
                        key={`${name}-dev-${link.label}`}
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 py-1 text-sm text-neutral-700 hover:underline"
                        title={link.label}
                      >
                        <span className="text-neutral-600">{socialIconFor(link.label)}</span>
                        <span className="sr-only">{link.label}</span>
                        <span className="truncate">{formatLinkText(link.label, link.href)}</span>
                      </a>
                    ))
                  ) : (
                    <div className="text-xs text-neutral-400">—</div>
                  )}
                </div>
              </div>
            </div>
          ) : null}

          {!followLinks?.length && website && (
            <div className="pt-1">
              <a
                href={website}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-medium text-blue-600 hover:underline"
              >
                {website.replace(/^https?:\/\/(www\.)?/, '')}
              </a>
            </div>
          )}

          {(helpNeeded || involvementNeeds?.length) && (
            <div>
              <SectionLabel>Get involved</SectionLabel>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-[3fr_1fr] items-start gap-4">
                {helpNeeded && (
                  <div className="text-sm text-neutral-700 md:col-start-1 space-y-3">{helpNeeded}</div>
                )}
                {involvementNeeds?.length ? (
                  <div className="md:col-start-2 md:row-start-1">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500 mb-2">Help Needed</div>
                    <div className="flex flex-col gap-2">
                      {involvementNeeds.map((item, idx) => (
                        <div
                          key={`${name}-need-${idx}`}
                          className={`rounded-[5px] border px-3 py-1.5 text-xs font-medium ${
                            item.seeking
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              : 'border-neutral-200 bg-neutral-50 text-neutral-400'
                          }`}
                        >
                          {item.label}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

export const metadata: Metadata = {
  title: 'Projects',
  description: 'Things I’ve made trying to put my dent in the universe.',
};

export default function Projects() {
  return (
    <SimpleLayout
      title="Projects in Motion"
      intro={
        <div className="space-y-4 text-pretty">
          <p>
            I’m a builder. Ideas come from everywhere. A bar conversation, a random thought on an Amtrak ride from Sacramento to San Francisco, a spark from someone I meet at an event, or a life experience that inspires me.
          </p>
          <p>
            AI and vibe coding have empowered me. I’ve always been a community organizer and technically savvy project manager. But now I can truly to let my ideas run wild. Some projects here are half-baked experiments while others are evolving MVPs nearing launch. All of them reflect a period of deep curiosity and growth pushing myself to learn, to build, and to stay fully engaged with the world around me.
          </p>
          <p>
            Welcome to my portfolio. Join me on my journey trying to launch ideas, big and small.
          </p>
        </div>
      }
    >
      {/* Projects */}
      <div className="grid grid-cols-1 gap-6">
        <ProjectCard
          name="Fog City Fans"
          tagline="Local sports, shared wins, smarter meetups."
          description={(
            <>
              <p>
                Fog City Fans is a central hub for sports fans to discover, join, and engage with local watch parties across San Francisco. The platform integrates live game scores, AI-powered matchup highlights, and community-driven event schedules. Fans can build rich profiles, connect with alumni groups and local communities, and receive timely reminders about upcoming games. Bars and venues benefit from promotional tools, featured placement, and drink special integrations that drive foot traffic.
              </p>
              <p>
                By combining event management, live content, and social connection, Fog City Fans transforms casual sports viewing into an organized, community-driven experience.
              </p>
            </>
          )}
          logoUrl="/images/fog-city-fans-logo.png"
          website="https://fogcityfans.com"
          launchSummary={
            'Fog City Fans has completed ideation and market validation, with strong demand confirmed from both bars eager to drive foot traffic and alumni groups seeking organized watch parties. Early commitments from North Beach venues and community groups reinforce the opportunity for a structured, tech-enabled platform. The roadmap is baselined with epics, user stories, workflows, and wireframes in place, plus proof-of-concept APIs and a functional tech stack established. The next phase is MVP development and testing, bringing live scores, AI-powered highlights, and event scheduling into a production-ready application.'
          }
          helpNeeded={(
            <>
              <p>
                Fog City Fans is ready to move from validation into execution. Here’s where support is most impactful right now:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Funding or technical capacity to accelerate MVP build-out.</li>
                <li>Funding for marketing materials (banners, signage, in-bar promotions).</li>
                <li>Marketing budget to promote Fog City Fans across the Bay Area.</li>
                <li>Advisors to help target national brands and secure sponsorships.</li>
                <li>Advisors to build connections with sports teams and alumni associations.</li>
                <li>Bars and event spaces motivated to host and promote watch parties.</li>
              </ul>
            </>
          )}
          launchStatusRows={[
            { phase: 'Ideation & Concept Validation', done: true, narrative: 'Bar crawls in SF generate over $300k in annual revenue. Desire for bars to bring in customers and willing to offer discounts. IRL social clubs growing in SF, but constraints around organizers exist.' },
            { phase: 'Market Validation', done: true, narrative: 'Alumni groups and bar owners in North Beach have confirmed interest. Bars aggressively trying to bring in customers. Assessing monetization models charging users for access or venues for marketing, or hybrid approach. Decision based on feature set and will be reassessed after product launch and feedback collected.' },
            { phase: 'Roadmap & Design', done: true, narrative: [
              'Epics and user stories defined.',
              'High-level workflows and wireframes created.',
              'APIs and AI/ML logic POC completed.',
              'Functional Tech Stack Established.',
              'Design tokens defined (color, spacing, typography) for consistent theming and rapid UI iteration.',
            ] },
            { phase: 'MVP Development & Testing' },
            { phase: 'Traction & Proof of Value' },
            { phase: 'Monetization' },
            { phase: 'GTM Execution' },
          ]}
          followLinks={toFollowLinks(LINKS.fogCityFans)}
          involvementNeeds={[
            { label: 'Technical Co-Founder', seeking: true },
            { label: 'Advisors', seeking: true },
            { label: 'Early Adopters', seeking: true },
            { label: 'Halo Sponsors', seeking: false },
            { label: 'Funding Partners', seeking: false },
          ]}
        />
        <ProjectCard
          name="Career Co-Pilot"
          tagline="Scout, qualify, and close opportunities — your job search, powered by AI."
          description={(
            <p>
              Career Co‑Pilot is an AI‑powered platform that helps job seekers automate discovery, evaluation, and application workflows. The system ingests job postings, enriches company data, optimizes resumes, and streamlines applications into a single organized pipeline. Beyond applications, Career Co‑Pilot uses AI to scout opportunities, surface high‑quality leads, and identify network connections for referrals or warm introductions. Built‑in task management, follow‑up reminders, and customizable playbooks keep the search structured, repeatable, and measurable — transforming the job hunt into a data‑driven workflow that runs like a sales pipeline.
            </p>
          )}
          logoUrl="/images/career-logo.png"
          launchSummary={
            'Early architecture and workflows are complete. System design has been validated with working proof-of-concept scripts for ingestion, enrichment, and resume optimization. Current focus is on expanding API integrations, stabilizing database schemas, and automating end-to-end flows from job discovery to HubSpot sync.'
          }
          launchStatusRows={[
            {
              phase: 'Ideation & Concept Validation',
              done: true,
              narrative: [
                'Hundreds of applications mapped to reveal workflow bottlenecks.',
                'Clear demand for structured automation across discovery, evaluation, and applications.',
              ],
            },
            {
              phase: 'Market Validation',
              done: true,
              narrative: [
                'Strong need identified among job seekers for automation tools.',
                'Early advisor feedback confirms potential for scaling into career management.',
              ],
            },
            {
              phase: 'Roadmap & Design',
              done: true,
              narrative: [
                'Epics and user stories defined.',
                'Data architecture designed with Supabase + HubSpot integration.',
                'AI pipelines prototyped for resume scoring and company enrichment.',
              ],
            },
            { phase: 'MVP Development & Testing' },
            { phase: 'Traction & Proof of Value' },
            { phase: 'Monetization' },
            { phase: 'GTM Execution' },
          ]}
          followLinks={toFollowLinks(LINKS.careerCoPilot)}
          helpNeeded={(
            <>
              <p>
                Career Co‑Pilot is first and foremost a personal project. A place to test workflows, experiment with AI, and explore how job search automation could evolve. While it isn’t structured as a formal startup today, connecting with others passionate about this space would be awesome!
              </p>
              <div>
                <ul className="mt-1 list-disc pl-5 space-y-1 text-sm text-neutral-700">
                  <li><strong>Technical Co‑Founder</strong> (exploratory) — a fellow tinkerer interested in helping push the platform toward production‑ready, or experimenting with adjacent ideas.</li>
                  <li><strong>Advisors / Thought Partners</strong> — people with unique perspectives on recruiting, HR tech, sales pipelines, or career management who are open to conversations.</li>
                  <li><strong>Curious Collaborators</strong> — anyone who enjoys testing, brainstorming, or shaping workflows that could evolve into something bigger.</li>
                </ul>
              </div>
            </>
          )}
          involvementNeeds={[
            { label: 'Technical Co-Founder', seeking: true },
            { label: 'Advisors', seeking: true },
            { label: 'Early Adopters', seeking: false },
            { label: 'Halo Sponsors', seeking: false },
            { label: 'Funding Partners', seeking: false },
          ]}
        />
        <ProjectCard
          name="Mobile Networking Assistant"
          tagline="Capture, follow up, and connect — from your phone."
          description={(
            <p>
              Mobile Networking Assistant is a real-time contact capture app for in-person events. Originally identified as a gap while developing Career Co‑Pilot, the tool addresses the challenge of turning brief encounters into lasting professional connections. By scanning LinkedIn QR codes or entering minimal info, it instantly enriches contacts with AI, generates concise profiles, and associates them with the event or location where they were met. The app also provides icebreakers, conversation cues, and follow-up recommendations, ensuring that casual meetings are captured, organized, and actionable.
            </p>
          )}
          logoUrl="/images/networking-assistant-logo.png"
          launchSummary={
            'The concept and workflows are defined, with strong validation from community organizers and frequent event‑goers. Early feedback confirmed the need for a lightweight, mobile‑first tool that integrates seamlessly with existing enrichment pipelines. Current development leverages Clay AI for rapid enrichment, Airtable for lightweight data management and prototyping, and OpenAI for instant contact summarization and icebreaker generation. Core priorities include QR scanning, LinkedIn data parsing, AI‑driven profiles, and event‑tagging features.'
          }
          launchStatusRows={[
            {
              phase: 'Ideation & Concept Validation',
              done: true,
              narrative: [
                'Pain points identified:',
                'Fragmented networking spaces and lack of intentional community-building.',
                'Startups generate ideas but often lack advisors to validate them in business environments.',
                'Technologists and entrepreneurs often develop solutions in a vacuum, disconnected from real-world problems.',
              ],
            },
            {
              phase: 'Market Validation',
              done: true,
              narrative: [
                'Feedback from Bay Area Connectors, alumni groups, and organizers confirms strong interest.',
                'Broad applicability across professional mixers, alumni events, and industry conferences.',
              ],
            },
            {
              phase: 'Roadmap & Design',
              done: true,
              narrative: [
                'Core user stories defined: contact capture, enrichment, event tagging, and follow‑up.',
                'Prototype wireframes created for QR scanning, AI summaries, and event association.',
                'HubSpot downstream workflows designed for structured contact storage and tagging.',
                'Enrichment stack established: Clay AI for rapid enrichment, Airtable for prototyping and lightweight data management, and OpenAI for summarization, icebreakers, and follow‑up recommendations.',
              ],
            },
            { phase: 'MVP Development & Testing' },
            { phase: 'Traction & Proof of Value' },
            { phase: 'Monetization' },
            { phase: 'GTM Execution' },
          ]}
          followLinks={toFollowLinks(LINKS.mobileNetworkingAssistant)}
          helpNeeded={(
            <>
              <p>
                Mobile Networking Assistant is moving toward MVP development, with the core concept and workflows already validated. The biggest needs now are:
              </p>
              <div>
                <ul className="mt-1 list-disc pl-5 space-y-1 text-sm text-neutral-700">
                  <li><strong>Technical Co‑Founder</strong> — with experience in mobile app development and integrations, to help build out the MVP and bring the product to demo stage.</li>
                  <li><strong>Funding Partners</strong> — to provide seed capital for app development and early pilot programs.</li>
                </ul>
              </div>
            </>
          )}
          involvementNeeds={[
            { label: 'Technical Co-Founder', seeking: true },
            { label: 'Advisors', seeking: false },
            { label: 'Early Adopters', seeking: false },
            { label: 'Halo Sponsors', seeking: false },
            { label: 'Funding Partners', seeking: true },
          ]}
        />
        <ProjectCard
          name="Startup Advisory Network"
          tagline="Playbooks and mentors for early‑stage founders."
          description={(
            <p>
              Startup Advisory Network is a marketplace that connects vetted advisors with early‑stage startups seeking strategic guidance, networks, and expertise. Startups gain access to seasoned operators who can sanity‑check products, provide introductions, and help shape growth strategy. Advisors are compensated through equity or stipends, with built‑in tools to streamline agreements (NDAs, equity terms, milestone tracking). The platform makes advisory relationships transparent, structured, and easy to manage.
            </p>
          )}
          logoUrl="/images/advisors-logo.png"
          launchSummary={
            'Currently in ideation and early validation. Conversations are underway with startup founders and potential advisors to confirm pain points and co‑design the program. No technical build has started. Next step is to refine workflows, validate compensation structures, and assess demand for agreement‑tracking tools.'
          }
          launchStatusRows={[
            {
              phase: 'Ideation & Concept Validation',
              done: true,
              narrative: [
                'Identified demand for structured advisor access and vetted talent.',
                'Advisors seeking low‑commitment opportunities to engage with startups.',
              ],
            },
            { phase: 'Market Validation' },
            {
              phase: 'Roadmap & Design',
              narrative: [
                'Early design discussions: mentorship, funding, pilot project frameworks.',
                'Exploration of event and community‑building models.',
              ],
            },
            { phase: 'MVP Development & Testing' },
            { phase: 'Traction & Proof of Value' },
            { phase: 'Monetization' },
            { phase: 'GTM Execution' },
          ]}
          followLinks={toFollowLinks(LINKS.startupAdvisoryNetwork)}
          helpNeeded={(
            <p>
              Startup Advisory Network is in ideation and early validation. Opportunities exist to help shape the product direction and validate core workflows.
            </p>
          )}
          involvementNeeds={[
            { label: 'Technical Co-Founder', seeking: true },
            { label: 'Advisors', seeking: true },
            { label: 'Early Adopters', seeking: false },
            { label: 'Halo Sponsors', seeking: false },
            { label: 'Funding Partners', seeking: false },
          ]}
        />
      </div>

      {/* Communities */}
      <h2 className="mt-16 text-xl font-semibold text-zinc-800 dark:text-zinc-100">Communities</h2>
      <div className="mt-6 grid grid-cols-1 gap-6">
        <ProjectCard
          name="Bay Area Connectors"
          tagline="A high-trust network for builders and operators."
          description={(
            <p>
              Bay Area Connectors is a community-driven networking platform and event series that brings together entrepreneurs, investors, operators, and organizers across the Bay Area. Through curated meetups, themed panels, and networking mixers, it fosters cross-industry collaboration bridging the gap between technology and business problems.
            </p>
          )}
          logoUrl="/images/bac_logo_s_2x.png"
          launchSummary={
            'Events are actively running in San Francisco, with strong turnout and recurring interest across tech, community organizing, and alumni groups. The foundation is established with a consistent event cadence, early sponsorship discussions, and a growing roster of hosts. Current focus is on codifying workflows, building digital infrastructure, and scaling into a repeatable playbook that can support expansion into new communities and verticals.'
          }
          launchStatusRows={[
            {
              phase: 'Ideation & Concept Validation',
              done: true,
              narrative: [
                'Proven demand for curated community events that cut across industries.',
                'Pain points identified:',
                'Fragmented networking spaces and lack of intentional community-building.',
                'Startups generate ideas but often lack advisors to validate them in business environments.',
                'Technologists and entrepreneurs often develop solutions in a vacuum, disconnected from real-world problems.',
                'Limited in-person socialization has hindered network growth and high-value connections, underscoring the need for more meaningful interactions.',
                'Several venues for startup-focused groups exist, but they emphasize the founder/funder dynamic. Events are often broad and generic, not industry-specific, leaving out opportunities for advisors who have deep industry expertise but no desire to become founders.',
              ],
            },
            {
              phase: 'Market Validation',
              done: true,
              narrative: [
                'Recurring attendance from entrepreneurs, organizers, and sponsors.',
                'Interest from alumni groups and professional associations.',
              ],
            },
            {
              phase: 'Roadmap & Design',
              done: true,
              narrative: [
                'Event workflows mapped (hosts, themes, sponsorship tiers).',
                'Sponsorship tiering structure drafted (Platinum, Gold, Silver, Bronze).',
                'Venue partnerships piloted.',
              ],
            },
            {
              phase: 'MVP Development & Testing',
              narrative: 'Digital platform to manage events, RSVPs, and community data.',
            },
            { phase: 'Traction & Proof of Value' },
            { phase: 'Monetization' },
            { phase: 'GTM Execution' },
          ]}
          followLinks={toFollowLinks(LINKS.bayAreaConnectors)}
          helpNeeded={(
            <>
              <p>
                Bay Area Connectors has proven demand, but scaling the community requires support beyond what one organizer can carry. To take the next step, the most critical needs are:
              </p>
              <div>
                <ul className="mt-1 list-disc pl-5 space-y-1 text-sm text-neutral-700">
                  <li><strong>Advisors</strong> — to help shape the community direction and validate core workflows.</li>
                  <li><strong>Halo Sponsor(s)</strong> — a lead sponsor to underwrite event costs and provide the financial foundation for consistent programming.</li>
                  <li><strong>Community Hosts & Panelists</strong> — leaders across industries willing to co‑host events, speak on panels, and share the work of growing the network.</li>
                  <li><strong>Marketing Support</strong> — partners who can help amplify events and attract the right mix of founders, advisors, and connectors.</li>
                </ul>
              </div>
              <p className="mt-2">The demand is there. What’s needed now are partners who believe in the mission and can help carry it forward.</p>
            </>
          )}
          involvementNeeds={[
            { label: 'Technical Co-Founder', seeking: false },
            { label: 'Advisors', seeking: true },
            { label: 'Early Adopters', seeking: false },
            { label: 'Halo Sponsors', seeking: true },
            { label: 'Funding Partners', seeking: false },
          ]}
        />
        <ProjectCard
          name="Greener Horizons"
          tagline="A community exploring climate tech and sustainability."
          description={(
            <p>
              Greener Horizons is a Bay Area–focused initiative to accelerate clean tech innovation by supporting early‑stage startups with resources, connections, and community. Built in partnership with Clean Start Sacramento, the program is designed to bridge founders, investors, and operators who are passionate about sustainability and climate solutions. The goal is to foster a thriving regional ecosystem where clean tech startups can access mentorship, funding pathways, and real‑world pilot opportunities.
            </p>
          )}
          logoUrl="/images/greener-horizons-logo.png"
          launchSummary={
            'Currently in ideation and early design stages. A partnership with Clean Start provides a foundation for credibility and collaboration. Conversations are underway with Bay Area founders, investors, and ecosystem partners to validate needs and co‑design the program. Next steps include defining the operating model, event cadence, and support infrastructure for participating startups.'
          }
          launchStatusRows={[
            {
              phase: 'Ideation & Concept Validation',
              done: true,
              narrative: [
                'Partnership secured with Clean Start Sacramento to seed Bay Area initiative.',
                'Clear demand for more structured clean tech founder support in the region.',
              ],
            },
            { phase: 'Market Validation' },
            {
              phase: 'Roadmap & Design',
              narrative: [
                'Early design discussions: mentorship, funding, pilot project frameworks.',
                'Exploration of event and community‑building models.',
              ],
            },
            { phase: 'MVP Development & Testing' },
            { phase: 'Traction & Proof of Value' },
            { phase: 'Monetization' },
            { phase: 'GTM Execution' },
          ]}
          followLinks={toFollowLinks(LINKS.greenerHorizons)}
          helpNeeded={(
            <>
              <p>
                Greener Horizons is in the earliest stages of development, with an open call for collaborators and supporters to shape its direction.
              </p>
              <div>
                <div className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">Help Needed:</div>
                <ul className="mt-1 list-disc pl-5 space-y-1 text-sm text-neutral-700">
                  <li><strong>Founders</strong> — to share challenges and help validate program design.</li>
                  <li><strong>Advisors / Mentors</strong> — with clean tech, climate, and startup expertise.</li>
                  <li><strong>Community Partners</strong> — Bay Area orgs interested in sustainability and innovation.</li>
                  <li><strong>Funding Partners</strong> (future) — to support pilot programs and ecosystem growth.</li>
                </ul>
              </div>
            </>
          )}
          involvementNeeds={[
            { label: 'Technical Co-Founder', seeking: false },
            { label: 'Advisors', seeking: true },
            { label: 'Early Adopters', seeking: false },
            { label: 'Halo Sponsors', seeking: false },
            { label: 'Funding Partners', seeking: false },
          ]}
        />
      </div>
    </SimpleLayout>
  );
}
