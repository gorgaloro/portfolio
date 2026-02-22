/* LinkedIn Profile Capture — Content Script
   Robust DOM extraction with multiple fallback strategies.
   Runs on *://*.linkedin.com/in/* pages. */

(function () {
  'use strict';

  function text(el) {
    return el ? el.textContent.trim() : '';
  }

  function splitName(fullName) {
    // Remove verification badges, emojis, pronouns in parens
    const cleaned = fullName
      .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '')
      .replace(/\(.*?\)/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    const parts = cleaned.split(/\s+/);
    if (parts.length === 0) return { firstname: '', lastname: '' };
    if (parts.length === 1) return { firstname: parts[0], lastname: '' };
    return { firstname: parts[0], lastname: parts.slice(1).join(' ') };
  }

  function extractProfile() {
    // === NAME ===
    // Try multiple h1 selectors, then fall back to any h1 on the page
    let nameText = '';
    const h1Selectors = [
      'h1.text-heading-xlarge',
      'h1.inline.t-24',
      'h1.break-words',
      '.pv-text-details__left-panel h1',
      'h1',
    ];
    for (const sel of h1Selectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent.trim()) {
        nameText = el.textContent.trim();
        break;
      }
    }

    // === HEADLINE ===
    let headline = '';
    const headlineSelectors = [
      '.text-body-medium.break-words',
      '.text-body-medium',
      'div.text-body-medium',
      '.pv-text-details__left-panel .text-body-medium',
    ];
    for (const sel of headlineSelectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent.trim()) {
        headline = el.textContent.trim();
        break;
      }
    }

    // === LOCATION ===
    let location = '';
    const locationSelectors = [
      '.pv-text-details__left-panel .text-body-small:not(.inline-show-more-text)',
      'span.text-body-small.inline.t-black--light.break-words',
      '.text-body-small.t-black--light',
    ];
    for (const sel of locationSelectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent.trim()) {
        location = el.textContent.trim();
        break;
      }
    }

    // === CONNECTION DEGREE ===
    let connectionDegree = '';
    const degreeEl = document.querySelector('.dist-value');
    if (degreeEl) {
      connectionDegree = text(degreeEl).replace(/[^\d]/g, '');
    }
    // Fallback: look for "1st", "2nd", "3rd" near the name
    if (!connectionDegree) {
      const badges = document.querySelectorAll('span.dist-value, .pvs-header__subtitle span');
      for (const badge of badges) {
        const t = text(badge);
        const m = t.match(/(\d)(st|nd|rd)/);
        if (m) { connectionDegree = m[1]; break; }
      }
    }

    // === ABOUT ===
    let about = '';
    const aboutSelectors = [
      '#about ~ div .inline-show-more-text--is-collapsed',
      '#about ~ div .inline-show-more-text',
      '#about + div + div .inline-show-more-text',
      '#about ~ div .pv-shared-text-with-see-more span[aria-hidden="true"]',
      '#about ~ div span[aria-hidden="true"]',
    ];
    for (const sel of aboutSelectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent.trim().length > 10) {
        about = el.textContent.trim();
        break;
      }
    }

    // === EXPERIENCE (current company + title) ===
    let currentCompany = '';
    let currentTitle = '';
    const experienceSection = document.querySelector('#experience');
    if (experienceSection) {
      const expContainer = experienceSection.closest('section');
      if (expContainer) {
        const firstRole = expContainer.querySelector('.pvs-list__paged-list-item, li.artdeco-list__item');
        if (firstRole) {
          // Try aria-hidden spans (LinkedIn hides duplicate text for screen readers)
          const spans = firstRole.querySelectorAll('span[aria-hidden="true"]');
          if (spans.length >= 2) {
            currentTitle = spans[0].textContent.trim();
            currentCompany = spans[1].textContent.trim().split('·')[0].trim();
          } else {
            // Fallback to class-based selectors
            currentTitle = text(firstRole.querySelector('.t-bold span[aria-hidden="true"]')) || '';
            currentCompany = text(firstRole.querySelector('.t-normal span[aria-hidden="true"]')) || '';
            currentCompany = currentCompany.split('·')[0].trim();
          }
        }
      }
    }

    // === EDUCATION ===
    let university = '';
    let degree = '';
    let field = '';
    const eduSection = document.querySelector('#education');
    if (eduSection) {
      const eduContainer = eduSection.closest('section');
      if (eduContainer) {
        const firstEdu = eduContainer.querySelector('.pvs-list__paged-list-item, li.artdeco-list__item');
        if (firstEdu) {
          const spans = firstEdu.querySelectorAll('span[aria-hidden="true"]');
          if (spans.length >= 1) {
            university = spans[0].textContent.trim();
          }
          if (spans.length >= 2) {
            const degreeField = spans[1].textContent.trim();
            if (degreeField.includes(',')) {
              const parts = degreeField.split(',');
              degree = parts[0].trim();
              field = parts.slice(1).join(',').trim();
            } else {
              degree = degreeField;
            }
          }
        }
      }
    }

    // === LINKEDIN URL ===
    const linkedin_url = window.location.href.split('?')[0].replace(/\/+$/, '');

    const { firstname, lastname } = splitName(nameText);

    return {
      firstname,
      lastname,
      fullName: nameText,
      headline,
      about,
      location,
      connectionDegree,
      currentCompany,
      currentTitle,
      university,
      degree,
      field,
      linkedin_url,
    };
  }

  // Listen for messages from popup/background
  browser.runtime.onMessage.addListener((msg) => {
    if (msg.action === 'extractProfile') {
      try {
        const profile = extractProfile();
        console.log('[linkedin-capture] Extracted:', profile.firstname, profile.lastname, '|', profile.linkedin_url);
        return Promise.resolve({ success: true, profile });
      } catch (err) {
        console.error('[linkedin-capture] Error:', err);
        return Promise.resolve({ success: false, error: err.message });
      }
    }
  });
})();
