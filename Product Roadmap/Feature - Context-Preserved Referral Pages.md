# Feature: Context-Preserved Referral Pages

## Goal
Allow generation of referral-specific pages (e.g. `/referrals/{slug}`) that:
1. are not part of normal site navigation,
2. still render inside the regular site layout (header/footer),
3. and preserve the referral context when the visitor clicks to other pages.

## Behavior Overview
- A referral page is a **standalone route** (e.g. `/referrals/databricks-2025`) generated from admin.
- When a visitor lands on this route, the app **captures the referral context** (referral id/slug) and stores it locally (cookie or localStorage).
- While that context is present, the site shows a **small return-to-referral UI** in the global layout.
- Clicking around the rest of the site should **not** drop the user out of the referral experience — they can always get back to the page they were sent.

## Detailed Workflow

1. **Entry**
   - User opens a URL like `/referrals/{referralSlug}`.
   - On load, the app saves `{referralSlug}` to a client-side store (cookie/localStorage) with a short TTL (e.g. 24–48h).

2. **Rendering the page**
   - Page uses the **normal site layout** (header, footer, nav) so it feels consistent.
   - Page content is the referral-specific content (intro note, roles targeting, job cards, call to action).

3. **Global layout awareness**
   - The global layout checks on every page load: “Do I have an active referral context?”
   - If yes, show a small component in the header/top-right/utility bar:
     - “You’re viewing a referral view for **{company}**”
     - Button: **“Back to referral page”** → links back to `/referrals/{referralSlug}`

4. **Navigation away**
   - If the user clicks to `/about`, `/portfolio`, or any other normal route:
     - Page renders normally
     - Because the referral context is still present, the “Back to referral page” bar/button is still visible
     - Clicking it returns them to the original referral page

5. **Expiration / clearing**
   - If the user comes in without a referral slug, the layout shows **no** referral UI
   - If the context has expired or the user clicks “Dismiss”, the UI no longer shows

## UI Notes
- Keep the referral bar subtle (not a takeover): e.g. a light banner or pill in the header.
- Text example:
  - “Viewing a referral profile for **Databricks** · Back to page”
- This bar is the only thing that’s different from the rest of the site — normal nav stays the same.

## Why this approach
- Lets referral pages live **outside** normal nav (not discoverable)
- Lets visitors still browse the site
- Gives them a way **back** to the page you actually sent them
- Doesn’t require changing every page to a special “referral version”
