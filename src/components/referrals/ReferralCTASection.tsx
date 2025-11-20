"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import clsx from "clsx";
import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";
import { Button } from "@/components/Button";

type ReferralCTASectionProps = {
  deals: Array<{
    deal_id: number;
    job_title?: string | null;
    job_url?: string | null;
    stage_label?: string | null;
    summary?: {
      total_fit_percent?: number | null;
      narrative?: string | null;
    } | null;
  }>;
  companyName?: string;
};

const LINKEDIN_URL =
  process.env.NEXT_PUBLIC_LINKEDIN_URL ||
  "https://www.linkedin.com/in/allenhwalker";
const GITHUB_URL =
  process.env.NEXT_PUBLIC_GITHUB_URL || "https://github.com/allenhwalker";
const SUBSTACK_URL =
  process.env.NEXT_PUBLIC_SUBSTACK_URL || "https://substack.com/@bayconnectors";
const BLUESKY_URL =
  process.env.NEXT_PUBLIC_BLUESKY_URL || "https://bsky.app/profile/bayconnectors.bsky.social";
const PORTFOLIO_URL =
  process.env.NEXT_PUBLIC_PORTFOLIO_URL || "https://www.allenwalker.info";
const EMAIL_ADDRESS =
  process.env.NEXT_PUBLIC_REFERRAL_EMAIL || "referrals@allenwalker.info";
const CALENDLY_URL =
  process.env.NEXT_PUBLIC_CALENDLY_URL || "https://calendly.com/allen-bayconnectors";
const RESUME_PDF_PATH = "/images/Resume/Allen%20Walker%20-%20Resume.pdf";

const SOCIAL_LINKS: Array<{
  label: string;
  href: string;
  icon: ReactNode;
  iconBg: string;
}> = [
  {
    label: "GitHub",
    href: GITHUB_URL,
    iconBg: "bg-zinc-900/5",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5 text-zinc-900">
        <path
          fill="currentColor"
          d="M12 .5a11.5 11.5 0 0 0-3.64 22.42c.57.11.78-.25.78-.55v-2.1c-3.18.7-3.85-1.37-3.85-1.37-.52-1.32-1.28-1.68-1.28-1.68-1.05-.72.08-.71.08-.71 1.17.08 1.78 1.2 1.78 1.2 1.03 1.77 2.71 1.26 3.37.96.1-.76.4-1.26.73-1.55-2.54-.29-5.22-1.27-5.22-5.63 0-1.24.44-2.25 1.16-3.05-.12-.29-.5-1.46.11-3.04 0 0 .95-.3 3.12 1.16a10.8 10.8 0 0 1 5.68 0c2.17-1.46 3.12-1.16 3.12-1.16.61 1.58.23 2.75.11 3.04.72.8 1.16 1.81 1.16 3.05 0 4.38-2.69 5.33-5.24 5.61.41.35.78 1.04.78 2.11v3.13c0 .3.2.67.79.55A11.5 11.5 0 0 0 12 .5Z"
        />
      </svg>
    ),
  },
  {
    label: "Substack",
    href: SUBSTACK_URL,
    iconBg: "bg-orange-500/10",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5 text-orange-500">
        <path fill="currentColor" d="M4 5h16v2H4z" />
        <path fill="currentColor" d="M4 9h16v2H4z" />
        <path fill="currentColor" d="M4 13h16v6l-8-3-8 3z" />
      </svg>
    ),
  },
  {
    label: "Bluesky",
    href: BLUESKY_URL,
    iconBg: "bg-sky-100",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5 text-sky-500">
        <path
          fill="currentColor"
          d="M5.1 4C3.4 4 2 5.4 2 7.1c0 2.5 1.7 4.6 3.6 6.2 1.6 1.4 3.6 2.6 6.4 3.7 2.8-1.1 4.9-2.3 6.4-3.7 1.9-1.6 3.6-3.7 3.6-6.2C22 5.4 20.6 4 18.9 4c-1.2 0-2.2.6-3 1.5-.7.8-1.2 1.8-1.8 2.9-.3.6-.7 1.3-1.1 1.9-.4-.6-.8-1.3-1.1-1.9-.6-1.1-1.1-2.1-1.8-2.9C7.3 4.6 6.3 4 5.1 4Z"
        />
      </svg>
    ),
  },
];

const FIT_SUMMARY_PLACEHOLDER = "Text failed to load.";

const DEFAULT_INTRO = `Hi — I’d like to recommend Allen Walker for a role on our team. He’s a senior program and delivery leader with 20+ years in enterprise systems, GTM operations, SaaS implementations, and AI-enabled workflow design. His background spans healthcare, manufacturing, automotive, and early-stage startups.`;
const ROLE_BRIDGE = 'Enclosed are roles aligned with his skillset and background:';

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function ReferralCTASection({ deals, companyName }: ReferralCTASectionProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(PORTFOLIO_URL);
  const [selectedJobs, setSelectedJobs] = useState<Record<number, boolean>>({});
  const [customIntro, setCustomIntro] = useState(DEFAULT_INTRO);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentUrl(window.location.href);
    }
  }, []);

  const jobs = useMemo(() => {
    return (deals || []).slice(0, 4).map((d) => {
      const summary: any = d.summary || {}
      const fitSummary =
        (typeof summary.fit_summary === "string" && summary.fit_summary.trim()) ||
        FIT_SUMMARY_PLACEHOLDER;

      return {
        id: d.deal_id,
        title: d.job_title || "Untitled Role",
        url: d.job_url || "#",
        fit:
          typeof d.summary?.total_fit_percent === "number"
            ? `${Number(d.summary.total_fit_percent).toFixed(0)}%`
            : "—",
        stage: d.stage_label || "Open to discussion",
        summary: fitSummary,
      };
    });
  }, [deals]);

  useEffect(() => {
    setSelectedJobs((prev) => {
      const next: Record<number, boolean> = {};
      jobs.forEach((job) => {
        next[job.id] = prev[job.id] ?? true;
      });
      return next;
    });
  }, [jobs]);

  const activeJobs = useMemo(() => {
    if (!jobs.length) return [] as typeof jobs;
    return jobs.filter((job) => selectedJobs[job.id] !== false);
  }, [jobs, selectedJobs]);

  const referralEmail = useMemo(() => {
    const introPlain = (customIntro || DEFAULT_INTRO).trim();
    const introWithBridge = `${introPlain}\n\n${ROLE_BRIDGE}`.trim();
    const introSegments = introWithBridge.split(/\n{2,}/);
    const introHtmlPieces = introSegments.map((para) =>
      `<p>${escapeHtml(para).replace(/\n/g, "<br />")}</p>`,
    );

    const hasBridgeSegment = introHtmlPieces.length > 1;
    const bridgeHtml = hasBridgeSegment ? introHtmlPieces[introHtmlPieces.length - 1] : '';
    const previewIntroHtml = hasBridgeSegment
      ? introHtmlPieces.slice(0, introHtmlPieces.length - 1).join('')
      : introHtmlPieces.join('');
    const fullIntroHtml = introHtmlPieces.join('');

    const { plain: jobPlain, html: jobHtml } = activeJobs.length
      ? activeJobs.reduce(
          (acc, job) => {
            const hasLink = job.url !== "#";
            const linkText = hasLink ? job.url : "Link unavailable";
            const summaryText = job.summary || FIT_SUMMARY_PLACEHOLDER;
            const plainTitle = hasLink ? `${job.title} — ${linkText}` : job.title;

            const plainBlock = [
              plainTitle,
              `Application Status: ${job.stage || "Not provided"}`,
              `Fit Summary (Fit Score: ${job.fit})`,
              summaryText,
            ]
              .join("\n");

            const titleHtml = hasLink
              ? `<strong><a href="${linkText}" target="_blank" rel="noreferrer">${escapeHtml(job.title)}</a></strong>`
              : `<strong>${escapeHtml(job.title)}</strong>`;
            const summaryHtml = escapeHtml(summaryText).replace(/\n/g, "<br />");
            const htmlBlock = `
              <div style="margin-bottom:16px;">
                <div>${titleHtml}</div>
                <div><span style="font-weight:600;">Application Status:</span> ${escapeHtml(
                  job.stage || "Not provided",
                )}</div>
                <div><span style="font-weight:600;">Fit Summary:</span> ${escapeHtml(job.fit)}</div>
                <div><em>${summaryHtml}</em></div>
              </div>`;

            acc.plain.push(plainBlock);
            acc.html.push(htmlBlock);
            return acc;
          },
          { plain: [] as string[], html: [] as string[] },
        )
      : {
          plain: [
            "No enriched roles are available yet. Once enrichment runs, refreshed recommendations will flow into this section.",
          ],
          html: [
            '<p>No enriched roles are available yet. Once enrichment runs, refreshed recommendations will flow into this section.</p>',
          ],
        };

    const closingPlain = `

Additional details on Allen’s professional background and how to reach him:

LinkedIn: ${LINKEDIN_URL}
Profile: ${PORTFOLIO_URL}
Email: ${EMAIL_ADDRESS}
Referral Page: ${currentUrl}`;
    const closingHtml = `
      <p>Additional details on Allen’s professional background and how to reach him:</p>
      <p style="margin-top:12px;">
        <strong>LinkedIn:</strong> <a href="${LINKEDIN_URL}" target="_blank" rel="noreferrer">${LINKEDIN_URL}</a><br />
        <strong>Profile:</strong> <a href="${PORTFOLIO_URL}" target="_blank" rel="noreferrer">${PORTFOLIO_URL}</a><br />
        <strong>Email:</strong> <a href="mailto:${EMAIL_ADDRESS}">${EMAIL_ADDRESS}</a><br />
        <strong>Referral Page:</strong> <a href="${currentUrl}" target="_blank" rel="noreferrer">${currentUrl}</a>
      </p>`;

    const jobsPlainJoined = jobPlain.join("\n\n");
    const jobsHtmlJoined = jobHtml.join("" );

    return {
      plain: `${introWithBridge}\n\n${jobsPlainJoined}${closingPlain}`,
      html: `${fullIntroHtml}${jobsHtmlJoined}${closingHtml}`,
      introHtml: previewIntroHtml,
      bridgeHtml,
      jobsHtml: jobsHtmlJoined,
      closingHtml,
    };
  }, [activeJobs, customIntro, currentUrl]);

  const emailLink = useMemo(() => {
    const body = encodeURIComponent(referralEmail.plain.replace(/\n/g, "\r\n"));

    return `mailto:?subject=${encodeURIComponent(
      "Referral Recommendation — Allen Walker"
    )}&body=${body}`;
  }, [referralEmail]);

  async function copyReferralContent(showToast = true) {
    try {
      const supportsRichClipboard =
        typeof window !== "undefined" &&
        typeof window.ClipboardItem !== "undefined" &&
        navigator.clipboard &&
        "write" in navigator.clipboard;

      if (supportsRichClipboard) {
        await navigator.clipboard.write([
          new window.ClipboardItem({
            "text/html": new Blob([referralEmail.html], { type: "text/html" }),
            "text/plain": new Blob([referralEmail.plain], { type: "text/plain" }),
          }),
        ]);
      } else {
        await navigator.clipboard.writeText(referralEmail.plain);
      }

      if (showToast) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.error("Failed to copy referral message", err);
    }
  }

  async function copyReferralMessage() {
    await copyReferralContent(true);
  }

  async function handleGenerateEmailDraft() {
    await copyReferralContent(false);
    if (typeof window !== "undefined") {
      window.location.href = emailLink;
    }
  }

  function handleResumeDownload() {
    if (typeof window === "undefined") return;
    const link = document.createElement("a");
    link.href = RESUME_PDF_PATH;
    link.download = "Allen Walker - Resume.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const renderReferralMessageCard = () => (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-sm font-semibold text-zinc-800">Referral Message</h4>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={copyReferralMessage}>
            {copied ? "Copied" : "Copy Message"}
          </Button>
          <Button variant="tertiary" className="px-3" onClick={handleGenerateEmailDraft}>
            Draft Email
          </Button>
        </div>
      </div>
      <label className="mt-3 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
        Draft Intro
      </label>
      <textarea
        className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        rows={5}
        value={customIntro}
        onChange={(e) => setCustomIntro(e.target.value)}
      />
      <p className="mt-2 text-xs text-zinc-500">
        <span className="font-semibold uppercase tracking-wide text-zinc-500">
          Email Draft Preview –
        </span>{" "}
        Editable in Your Email Client Before Sending
      </p>
      <div className="mt-3 text-sm text-zinc-700">
        <div className="rounded-lg bg-white p-3 shadow-sm space-y-3">
          <div dangerouslySetInnerHTML={{ __html: referralEmail.introHtml }} />
          {referralEmail.bridgeHtml && (
            <div className="pt-3" dangerouslySetInnerHTML={{ __html: referralEmail.bridgeHtml }} />
          )}
          <div className="pt-3 border-t border-zinc-100" dangerouslySetInnerHTML={{ __html: referralEmail.jobsHtml }} />
          <div dangerouslySetInnerHTML={{ __html: referralEmail.closingHtml }} />
        </div>
      </div>
    </div>
  );

  const renderSuggestedRolesCard = () => (
    <div>
      <h4 className="text-sm font-semibold text-zinc-800">Select Roles</h4>
      <div className="mt-2 space-y-2">
        {jobs.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-200 p-3 text-sm text-zinc-500">
            No enriched roles available yet. Refresh after running enrichment in the admin console.
          </div>
        ) : (
          jobs.map((job) => (
            <div key={job.id} className="rounded-lg border border-zinc-200 p-3">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                  checked={selectedJobs[job.id] !== false}
                  onChange={(e) =>
                    setSelectedJobs((prev) => ({ ...prev, [job.id]: e.target.checked }))
                  }
                />
                <div className="flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      {job.url && job.url !== "#" ? (
                        <a
                          href={job.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-semibold text-emerald-600 hover:underline"
                        >
                          {job.title}
                        </a>
                      ) : (
                        <p className="text-sm font-semibold text-zinc-900">{job.title}</p>
                      )}
                      <p className="text-xs text-zinc-500">Application Status: {job.stage}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-zinc-500">Fit Score</p>
                      <p className="text-lg font-semibold text-emerald-600">{job.fit}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderActionButtons = () => (
    <div className="flex flex-wrap gap-2">
      <Button variant="secondary" onClick={copyReferralMessage}>
        {copied ? "Copied" : "Copy Message"}
      </Button>
      <Button variant="tertiary" className="px-3" onClick={handleGenerateEmailDraft}>
        Draft Email
      </Button>
    </div>
  );

  const renderSocialLinks = () => (
    <div className="mt-4 space-y-3">
      {SOCIAL_LINKS.map((link) => (
        <a
          key={link.label}
          href={link.href}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-4 rounded-2xl bg-zinc-50 px-4 py-3 transition hover:bg-white hover:shadow-sm dark:bg-zinc-800/60 dark:hover:bg-zinc-800"
        >
          <span className={`flex h-10 w-10 items-center justify-center rounded-2xl ${link.iconBg}`}>
            {link.icon}
          </span>
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {link.label}
          </span>
          <svg
            className="ml-auto h-4 w-4 text-zinc-400"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M7 4l6 6-6 6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </a>
      ))}
    </div>
  );

  const renderMeetingLink = () => (
    <div className="mt-4">
      <a
        href={CALENDLY_URL}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-4 rounded-2xl bg-zinc-50 px-4 py-3 transition hover:bg-white hover:shadow-sm dark:bg-zinc-800/60 dark:hover:bg-zinc-800"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
          <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5">
            <path
              d="M8 3v2M16 3v2M5 7h14M6 11h2m3 0h2m3 0h2M6 15h2m3 0h2m3 0h2M6 19h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Book a Meeting</span>
        </div>
        <svg
          className="ml-auto h-4 w-4 text-zinc-400"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M7 4l6 6-6 6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </a>
    </div>
  );

  const renderConnectLinks = () => (
    <div className="mt-4 space-y-3">
      <a
        href={LINKEDIN_URL}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-4 rounded-2xl bg-zinc-50 px-4 py-3 transition hover:bg-white hover:shadow-sm dark:bg-zinc-800/60 dark:hover:bg-zinc-800"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#E6F0FF]">
          <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5 text-[#0A66C2]">
            <path
              d="M20.45 3H3.55A.55.55 0 0 0 3 3.55v16.9c0 .3.25.55.55.55h16.9c.3 0 .55-.25.55-.55V3.55A.55.55 0 0 0 20.45 3ZM8.1 18.5H5.6V9.75h2.5ZM6.85 8.6a1.45 1.45 0 1 1 0-2.9 1.45 1.45 0 0 1 0 2.9Zm11.65 9.9h-2.5v-4.3c0-1.05-.02-2.4-1.45-2.4-1.45 0-1.67 1.14-1.67 2.32v4.38h-2.5V9.75h2.4v1.19h.03c.33-.63 1.16-1.3 2.4-1.3 2.57 0 3.05 1.7 3.05 3.9Z"
              fill="currentColor"
            />
          </svg>
        </span>
        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">LinkedIn</span>
        <svg
          className="ml-auto h-4 w-4 text-zinc-400"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M7 4l6 6-6 6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </a>
      <a
        href={`mailto:${EMAIL_ADDRESS}`}
        className="flex items-center gap-4 rounded-2xl bg-zinc-50 px-4 py-3 transition hover:bg-white hover:shadow-sm dark:bg-zinc-800/60 dark:hover:bg-zinc-800"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
          <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5">
            <path
              d="M4 7.5 10.6 12a2.8 2.8 0 0 0 2.8 0L20 7.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <rect
              x="3"
              y="5"
              width="18"
              height="14"
              rx="2"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>
        </span>
        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Email</span>
        <svg
          className="ml-auto h-4 w-4 text-zinc-400"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M7 4l6 6-6 6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </a>
    </div>
  );

  const companyLabel = (companyName && companyName.trim().length > 0)
    ? companyName
    : "your company";

  return (
    <section>
      <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
        Thank You for Your Support
      </h2>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Your efforts helping me connect with roles and opportunities at {companyLabel} is so incredibly meaningful.
      </p>
      <div className="mt-6 space-y-4">
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 shadow-sm dark:border-white/10 dark:bg-zinc-900">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Refer Me Internally</h3>
            <div className="grid gap-6 md:grid-cols-[3fr_2fr] items-start">
              <div className="space-y-4">
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Create a referral email with my background and job details, or download my résumé to share with hiring managers, recruiters, or team members.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="secondary"
                    className="text-xs !bg-[#990000] !text-white hover:!bg-[#7a0000] active:!bg-[#990000]/90"
                    onClick={() => setOpen(true)}
                  >
                    Email Referral
                  </Button>
                  <Button
                    variant="secondary"
                    className="text-xs !bg-[#990000] !text-white hover:!bg-[#7a0000] active:!bg-[#990000]/90"
                    onClick={handleResumeDownload}
                  >
                    PDF Résumé
                  </Button>
                </div>
              </div>
              <div className="flex justify-center">
                <img
                  src="/images/email-referral.png"
                  alt="Preview of the email referral generator"
                  className="w-full max-w-xs"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <CTABox
            title="Connect With Me"
            description="Reach out directly if you’d like to discuss a specific role or connect personally."
          >
            {renderConnectLinks()}
          </CTABox>
          <CTABox
            title="Schedule Time"
            description="If you'd like to talk through roles, feel free to book a short call."
          >
            {renderMeetingLink()}
          </CTABox>
          <CTABox
            title="Follow My Work"
            description="Stay connected with my projects and updates."
          >
            {renderSocialLinks()}
          </CTABox>
        </div>
      </div>

      <Dialog open={open} onClose={setOpen} className="relative z-50">
        <DialogBackdrop className="fixed inset-0 bg-black/40" />
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center px-4 py-8">
            <DialogPanel className="w-[90vw] max-w-[80rem] rounded-2xl bg-white p-6 shadow-xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold text-zinc-900">
                    Email Referral Generator
                  </h3>
                  <p className="mt-1 text-sm text-zinc-600">
                    Generate an editable referral email with selected roles.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="text-sm font-medium text-zinc-500 hover:text-zinc-700"
                >
                  Close
                </button>
              </div>

              <div className="mt-4 space-y-4">
                {/* Mobile layout */}
                <div className="space-y-4 md:hidden">
                  {renderReferralMessageCard()}
                  {renderSuggestedRolesCard()}
                  {renderActionButtons()}
                </div>

                {/* Desktop layout with gutters and 70/30 split */}
                <div className="hidden md:grid grid-cols-[5%_62%_28%_5%] gap-4">
                  <div />
                  <div className="space-y-4">
                    {renderReferralMessageCard()}
                    {renderActionButtons()}
                  </div>
                  <div className="space-y-4">
                    {renderSuggestedRolesCard()}
                  </div>
                  <div />
                </div>
              </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    </section>
  );
}

type CTABoxProps = {
  title: string;
  description: string;
  microcopy?: string;
  actions?: Array<{ label: string; href?: string; onClick?: () => void; className?: string }>;
  children?: ReactNode;
};

function CTABox({ title, description, microcopy, actions = [], children }: CTABoxProps) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-900">
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        {title}
      </h3>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        {description}
      </p>
      {children && <div>{children}</div>}
      {actions.length > 0 && (
        <div className={`mt-4 flex flex-wrap gap-2${children ? " pt-2" : ""}`}>
          {actions.map((action) => (
            <Button
              key={action.label}
              href={action.href}
              onClick={action.onClick}
              variant="secondary"
              className={clsx("text-xs", action.className)}
            >
              {action.label}
            </Button>
          ))}
        </div>
      )}
      {microcopy && <p className="mt-3 text-xs text-zinc-500">{microcopy}</p>}
    </div>
  );
}
