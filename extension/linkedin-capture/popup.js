/* LinkedIn Capture — Popup Logic
   Orchestrates: extract profile → API classify → edit tags/notes → confirm → create contact */

let extractedData = null;
let settings = {};
let selectedTags = { network_roles: [], life_projects: [], metro_areas: [], focus_areas: [] };
let taskTemplates = [];

// Tag definitions (match HubSpot properties)
const TAG_OPTIONS = {
  network_roles: [
    'Associate', 'Community Organizer', 'Connector', 'Entrepreneur',
    'Friend', 'Hiring Manager', 'Subject Matter Expert', 'Talent Acquisition',
  ],
  life_projects: [
    'Baseball Community', 'Bay Area Connectors', 'Bay Area Organizers',
    'Entrepreneurial Society', 'Fog City Fans', 'Friends & Associates',
    'Greener Horizons', 'TechHustle', 'USC Alumni', 'Warm Data',
  ],
  metro_areas: ['Bay Area', 'Los Angeles', 'New York', 'Seattle', 'Austin', 'Denver', 'Chicago'],
  focus_areas: ['Founder', 'Funder', 'Climate Tech', 'AI/ML', 'Product', 'Engineering', 'Design', 'Sales', 'Marketing'],
};

// DOM refs
const extractBtn = document.getElementById('extractBtn');
const stepExtract = document.getElementById('step-extract');
const stepPreview = document.getElementById('step-preview');
const stepSuccess = document.getElementById('step-success');
const profileHeader = document.getElementById('profileHeader');
const companyMatch = document.getElementById('companyMatch');
const dupWarn = document.getElementById('dupWarn');
const dealSection = document.getElementById('dealSection');
const dealSelect = document.getElementById('dealSelect');
const captureNotes = document.getElementById('captureNotes');
const nextSteps = document.getElementById('nextSteps');
const taskEnabled = document.getElementById('taskEnabled');
const taskFields = document.getElementById('taskFields');
const taskTemplate = document.getElementById('taskTemplate');
const taskDueDate = document.getElementById('taskDueDate');
const taskPriority = document.getElementById('taskPriority');
const taskDescription = document.getElementById('taskDescription');
const cancelBtn = document.getElementById('cancelBtn');
const saveBtn = document.getElementById('saveBtn');
const messageEl = document.getElementById('message');
const successMsg = document.getElementById('successMsg');
const hubspotLink = document.getElementById('hubspotLink');

function showMessage(text, type) {
  messageEl.textContent = text;
  messageEl.className = `msg msg-${type}`;
}

function hideMessage() {
  messageEl.className = 'msg hidden';
}

function setLoading(btn, loading, label) {
  btn.disabled = loading;
  btn.innerHTML = loading ? '<span class="spinner"></span>' + label : label;
}

function esc(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function loadSettings() {
  const result = await browser.storage.local.get(['apiEndpoint', 'authToken']);
  settings = result;
  if (!settings.apiEndpoint) {
    showMessage('Configure API endpoint in extension options.', 'error');
    extractBtn.disabled = true;
  }
}

async function apiCall(body) {
  const resp = await fetch(`${settings.apiEndpoint}/api/admin/capture-contact`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(settings.authToken ? { Authorization: `Bearer ${settings.authToken}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const json = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(json.error || `API error ${resp.status}`);
  return json;
}

// Render tag chips for a group
function renderTagGroup(groupKey, autoTags) {
  const container = document.getElementById(`tags-${groupKey}`);
  if (!container) return;

  const autoSet = new Set((autoTags || {})[groupKey] || []);
  container.innerHTML = '';

  TAG_OPTIONS[groupKey].forEach((tag) => {
    const isAuto = autoSet.has(tag);
    const isSelected = selectedTags[groupKey].includes(tag);
    const chip = document.createElement('span');
    chip.className = `tag-chip${isSelected ? ' selected' : ''}`;
    chip.innerHTML = esc(tag) + (isAuto ? ' <span class="auto-badge">✨</span>' : '');
    chip.addEventListener('click', () => {
      const idx = selectedTags[groupKey].indexOf(tag);
      if (idx >= 0) {
        selectedTags[groupKey].splice(idx, 1);
        chip.classList.remove('selected');
      } else {
        selectedTags[groupKey].push(tag);
        chip.classList.add('selected');
      }
    });
    container.appendChild(chip);
  });
}

// Setup collapsible tag sections
function setupCollapsibles() {
  document.querySelectorAll('.tag-section-header').forEach((header) => {
    header.addEventListener('click', () => {
      header.parentElement.classList.toggle('collapsed');
    });
  });
}

// Set default task due date (days from now)
function setDefaultDueDate(days) {
  const d = new Date();
  d.setDate(d.getDate() + (days || 3));
  taskDueDate.value = d.toISOString().split('T')[0];
}

// Render the profile preview
function renderPreview(data) {
  const p = data.profile || {};
  const auto = data.auto_tags || {};
  const parsed = data.parsed || {};

  profileHeader.innerHTML = `
    <div class="name">${esc(p.firstname)} ${esc(p.lastname)}</div>
    <div class="headline">${esc(p.headline || p.currentTitle || '')}</div>
    <div class="meta">
      <span>${esc(p.currentCompany || p.company_name || p.company || '')}</span>
      <span>${esc(p.location || '')}</span>
      ${p.connectionDegree || p.connection_degree ? `<span>${esc(p.connectionDegree || p.connection_degree)}° connection</span>` : ''}
    </div>
    ${p.captured_date ? `<div class="meta">Captured: ${new Date(p.captured_date).toLocaleDateString()}</div>` : ''}
  `;

  // Company match
  const companyAlts = document.getElementById('companyAlternatives');
  if (data.company_match) {
    const cm = data.company_match;
    const mc = cm.matched_company;
    const dotClass = cm.status === 'matched' ? 'dot-green' : cm.status === 'created' ? 'dot-yellow' : cm.status === 'ambiguous' ? 'dot-yellow' : 'dot-grey';
    companyMatch.innerHTML = `<span class="dot ${dotClass}"></span>${esc(mc?.name || p.company_name || 'Unknown')} — ${esc(cm.status)}`;
    companyMatch.classList.remove('hidden');

    // Show alternatives if ambiguous
    if (cm.status === 'ambiguous' && cm.alternatives && cm.alternatives.length > 1) {
      let altHtml = '<div class="company-alt-label">Select Company Match</div>';
      cm.alternatives.forEach((alt, idx) => {
        const isSelected = mc && alt.company_id === mc.company_id;
        altHtml += `<div class="company-card${isSelected ? ' selected' : ''}" data-company-id="${esc(alt.company_id)}" data-idx="${idx}">
          <div><span class="cc-name">${esc(alt.name)}</span>${alt.domain ? ` <span class="cc-meta">(${esc(alt.domain)})</span>` : ''}</div>
          <div class="cc-meta">${alt.numberofemployees ? alt.numberofemployees + ' emp' : ''}${alt.industry ? (alt.numberofemployees ? ' · ' : '') + esc(alt.industry) : ''}</div>
        </div>`;
      });
      altHtml += '<button class="company-create-btn" id="createCompanyBtn">+ Create New Company</button>';
      altHtml += '<div id="createCompanyForm" class="company-create-form hidden"><div class="field"><label>Company Name</label><input type="text" id="newCompanyName" value="' + esc(p.company_name || '') + '"></div><div class="field"><label>Domain (optional)</label><input type="text" id="newCompanyDomain" placeholder="example.com"></div></div>';
      companyAlts.innerHTML = altHtml;
      companyAlts.classList.remove('hidden');

      // Click handlers for company cards
      companyAlts.querySelectorAll('.company-card').forEach((card) => {
        card.addEventListener('click', () => {
          companyAlts.querySelectorAll('.company-card').forEach(c => c.classList.remove('selected'));
          card.classList.add('selected');
          const idx = parseInt(card.dataset.idx);
          extractedData.company_match.matched_company = cm.alternatives[idx];
          extractedData.selectedCompanyId = cm.alternatives[idx].company_id;
          document.getElementById('createCompanyForm')?.classList.add('hidden');
        });
      });

      // Create new company toggle
      setTimeout(() => {
        document.getElementById('createCompanyBtn')?.addEventListener('click', () => {
          const form = document.getElementById('createCompanyForm');
          form?.classList.toggle('hidden');
          companyAlts.querySelectorAll('.company-card').forEach(c => c.classList.remove('selected'));
          extractedData.selectedCompanyId = null;
          extractedData.createNewCompany = true;
        });
      }, 0);
    }

    // Deal dropdown
    if (cm.active_deals && cm.active_deals.length > 0) {
      dealSelect.innerHTML = '<option value="">— None —</option>';
      cm.active_deals.forEach((deal) => {
        const opt = document.createElement('option');
        opt.value = deal.deal_id || deal.id;
        opt.textContent = deal.dealname || deal.name || `Deal ${deal.deal_id || deal.id}`;
        dealSelect.appendChild(opt);
      });
      dealSection.classList.remove('hidden');
    }
  }

  // Extracted data preview (experiences, education, certifications)
  const previewEl = document.getElementById('extractedPreview');
  const experiences = p.experiences || parsed.experiences || [];
  const educationArr = Array.isArray(p.education) ? p.education : (parsed.education ? (Array.isArray(parsed.education) ? parsed.education : [parsed.education]) : []);
  const certs = p.certifications || parsed.certifications || [];

  if (experiences.length || educationArr.length || certs.length) {
    let previewHtml = '';

    // Current role
    const currentExp = experiences.find(e => e.is_current);
    if (currentExp) {
      previewHtml += `<div class="ep-section">
        <div class="ep-header">Current Role</div>
        <div class="ep-body">
          <div class="ep-item">
            <div class="ep-item-title">${esc(currentExp.title || '')} at ${esc(currentExp.company || '')}</div>
            ${currentExp.duration ? `<div class="ep-item-sub">${esc(currentExp.duration)}</div>` : ''}
          </div>
        </div>
      </div>`;
    }

    // Experience
    if (experiences.length > 0) {
      previewHtml += `<div class="ep-section collapsed">
        <div class="ep-header"><span>Experience<span class="ep-badge">${experiences.length}</span></span><span class="ep-toggle">▼</span></div>
        <div class="ep-body">`;
      experiences.forEach(exp => {
        previewHtml += `<div class="ep-item">
          <div class="ep-item-title">${esc(exp.title || '')}${exp.company ? ' at ' + esc(exp.company) : ''}${exp.is_current ? ' <span style="color:#16a34a;font-size:10px;">● Current</span>' : ''}</div>
          ${exp.duration ? `<div class="ep-item-sub">${esc(exp.duration)}</div>` : ''}
        </div>`;
      });
      previewHtml += '</div></div>';
    }

    // Education
    if (educationArr.length > 0) {
      previewHtml += `<div class="ep-section collapsed">
        <div class="ep-header"><span>Education<span class="ep-badge">${educationArr.length}</span></span><span class="ep-toggle">▼</span></div>
        <div class="ep-body">`;
      educationArr.forEach(edu => {
        const inst = edu.institution || edu.university || '';
        previewHtml += `<div class="ep-item">
          <div class="ep-item-title">${esc(inst)}</div>
          ${edu.degree || edu.field || edu.field_of_study ? `<div class="ep-item-sub">${esc(edu.degree || '')}${edu.field || edu.field_of_study ? ', ' + esc(edu.field || edu.field_of_study) : ''}</div>` : ''}
        </div>`;
      });
      previewHtml += '</div></div>';
    }

    // Certifications
    if (certs.length > 0) {
      previewHtml += `<div class="ep-section collapsed">
        <div class="ep-header"><span>Certifications<span class="ep-badge">${certs.length}</span></span><span class="ep-toggle">▼</span></div>
        <div class="ep-body">`;
      certs.forEach(cert => {
        previewHtml += `<div class="ep-item">
          <div class="ep-item-title">${esc(cert.name || cert.certification_name || '')}</div>
          ${cert.issuing_organization ? `<div class="ep-item-sub">${esc(cert.issuing_organization)}</div>` : ''}
        </div>`;
      });
      previewHtml += '</div></div>';
    }

    previewEl.innerHTML = previewHtml;
    previewEl.classList.remove('hidden');

    // Setup collapsible for preview sections
    previewEl.querySelectorAll('.ep-header').forEach(header => {
      header.addEventListener('click', () => {
        header.parentElement.classList.toggle('collapsed');
      });
    });
  }

  // Duplicate
  if (data.duplicate_check?.is_duplicate && data.duplicate_check?.existing_contact) {
    const dup = data.duplicate_check.existing_contact;
    dupWarn.innerHTML = `⚠️ Contact already exists: ${esc(dup.firstname || '')} ${esc(dup.lastname || '')} (ID: ${esc(dup.contact_id)}). Tags will be additive.`;
    dupWarn.classList.remove('hidden');
  } else if (data.duplicate) {
    dupWarn.innerHTML = `⚠️ Contact already exists: ${esc(data.duplicate.name)} (ID: ${data.duplicate.contact_id}). Tags will be additive.`;
    dupWarn.classList.remove('hidden');
  }

  // Pre-select auto tags
  Object.keys(TAG_OPTIONS).forEach((group) => {
    const autoForGroup = (auto[group] || []);
    selectedTags[group] = [...autoForGroup];
    renderTagGroup(group, auto);
  });

  // Task templates
  if (data.task_templates && data.task_templates.length > 0) {
    taskTemplates = data.task_templates;
    taskTemplate.innerHTML = '';
    taskTemplates.forEach((t) => {
      const opt = document.createElement('option');
      opt.value = t.template_name;
      opt.textContent = t.label;
      opt.dataset.days = t.default_due_days;
      opt.dataset.priority = t.default_priority;
      opt.dataset.description = t.default_description;
      taskTemplate.appendChild(opt);
    });
  }
}

// Extract profile from content script
extractBtn.addEventListener('click', async () => {
  hideMessage();
  setLoading(extractBtn, true, 'Extracting…');

  try {
    // Send message to content script
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    const tab = tabs[0];

    if (!tab || !tab.url || !tab.url.includes('linkedin.com/in/')) {
      throw new Error('Navigate to a LinkedIn profile page first.');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Full profile extraction via document.body.innerText (pierces Shadow DOM).
    // Extracts: name, headline, location, about, ALL experiences, ALL education,
    // ALL certifications, connection degree, and raw page text.
    // ═══════════════════════════════════════════════════════════════════════
    const extractResults = await browser.tabs.executeScript(tab.id, {
      code: `(function(){
  try {
    // ── Helpers ──
    var SECTIONS = ["About","Experience","Education","Licenses & certifications",
      "Licenses & Certifications","Skills","Recommendations","Activity",
      "Interests","Volunteering","Courses","Projects","Publications",
      "Honors & awards","Languages","Organizations","Patents","Test scores"];
    function isSection(l){ return SECTIONS.indexOf(l) >= 0; }
    function isDuration(l){ return /\\b(\\d{4}|Present|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\\b/.test(l) && /[\\-\\u2013]/.test(l); }
    function isNoise(l){ return !l || l==="Show all" || l.indexOf("Show all ")===0 || l==="\\u2026see more" || l==="see more" || l==="...see more"; }

    // ── NAME from document.title ──
    var nameText = "";
    var titleParts = document.title.split("|");
    if(titleParts.length >= 2 && titleParts[titleParts.length-1].trim().toLowerCase().indexOf("linkedin") >= 0){
      nameText = titleParts.slice(0, titleParts.length-1).join("|").trim();
    }
    if(!nameText){
      var h1 = document.querySelector("h1");
      if(h1) nameText = h1.textContent.trim();
    }
    nameText = nameText.replace(/[\\u200e\\u200f\\u202a-\\u202e]/g,"").replace(/\\(.*?\\)/g,"").replace(/,.*$/,"").replace(/\\s+/g," ").trim();
    var nameParts = nameText.split(" ");
    var fn = nameParts[0] || "";
    var ln = nameParts.slice(1).join(" ") || "";

    // ── Full visible page text ──
    var fullText = document.body.innerText || "";
    var lines = fullText.split("\\n").map(function(l){return l.trim();}).filter(function(l){return l.length > 0;});

    // ── Find section boundaries ──
    function findSection(name){
      for(var i=0;i<lines.length;i++){
        if(lines[i] === name) return i;
      }
      return -1;
    }
    function sectionEnd(startIdx){
      for(var i=startIdx+1;i<lines.length;i++){
        if(isSection(lines[i])) return i;
      }
      return lines.length;
    }

    // ── HEADLINE ──
    var hl = "";
    for(var i=0;i<lines.length-1;i++){
      if(lines[i] === nameText || lines[i].indexOf(nameText) === 0){
        var c = lines[i+1];
        if(c && c.length > 3 && c.indexOf("follower") < 0 && c.indexOf("connection") < 0 && c.indexOf("Contact info") < 0){
          hl = c; break;
        }
      }
    }

    // ── LOCATION ──
    var loc = "";
    if(hl){
      var hlIdx = lines.indexOf(hl);
      for(var j=hlIdx+1; j<Math.min(hlIdx+5,lines.length); j++){
        var cl = lines[j];
        if(cl && cl.length > 2 && cl.length < 80 && cl.indexOf("follower")<0 && cl.indexOf("connection")<0 && cl.indexOf("Contact info")<0 && cl.indexOf("Message")<0 && cl.indexOf("More")!==0 && cl.indexOf("Connect")<0){
          loc = cl; break;
        }
      }
    }

    // ── ABOUT (full text) ──
    var about = "";
    var abIdx = findSection("About");
    if(abIdx >= 0){
      var abEnd = sectionEnd(abIdx);
      var abLines = [];
      for(var j=abIdx+1; j<abEnd; j++){
        if(isNoise(lines[j])) continue;
        abLines.push(lines[j]);
      }
      about = abLines.join("\\n");
    }

    // ── EXPERIENCE (ALL roles) ──
    var experiences = [];
    var expIdx = findSection("Experience");
    if(expIdx >= 0){
      var expEnd = sectionEnd(expIdx);
      var expBlock = [];
      for(var j=expIdx+1; j<expEnd; j++){
        if(!isNoise(lines[j])) expBlock.push(lines[j]);
      }
      // Parse blocks: each role has title, company·type, duration, then description lines
      var cur = null;
      for(var k=0; k<expBlock.length; k++){
        var el = expBlock[k];
        // Duration line signals end of header, start of description
        if(isDuration(el)){
          if(cur){ cur.duration = el; }
          continue;
        }
        // Line with middle dot = company · type or company · duration
        if(el.indexOf("\\xB7") >= 0){
          var dp = el.split("\\xB7").map(function(p){return p.trim();});
          if(cur && !cur.company){
            cur.company = dp[0];
            if(dp[1] && isDuration(dp[1])) cur.duration = dp[1];
          } else if(cur && cur.company && !cur.duration){
            // might be employment type line
          }
          continue;
        }
        // If we have a current role with company+duration, remaining lines are responsibilities
        if(cur && cur.company && cur.duration){
          // Could be next role title or responsibilities
          // Heuristic: if next non-noise line has a dot or duration, this is a new role
          var nextHasDot = k+1 < expBlock.length && expBlock[k+1].indexOf("\\xB7") >= 0;
          if(nextHasDot){
            // New role starting
            experiences.push(cur);
            cur = {title: el, company:"", duration:"", responsibilities:""};
          } else {
            // Responsibilities text
            cur.responsibilities = cur.responsibilities ? cur.responsibilities + "\\n" + el : el;
          }
        } else if(!cur || (cur.company && cur.duration)){
          // Start new role
          if(cur) experiences.push(cur);
          cur = {title: el, company:"", duration:"", responsibilities:""};
        }
      }
      if(cur) experiences.push(cur);
      // Mark first as current
      if(experiences.length > 0) experiences[0].is_current = true;
      // Fallback: parse company from headline
      if(experiences.length > 0 && !experiences[0].company && hl){
        var atIdx = hl.lastIndexOf(" at ");
        if(atIdx > 0) experiences[0].company = hl.substring(atIdx + 4).trim();
      }
    }
    // Headline-only fallback if no experience section
    if(experiences.length === 0 && hl){
      var atIdx2 = hl.lastIndexOf(" at ");
      if(atIdx2 > 0){
        experiences.push({
          title: hl.substring(0, atIdx2).trim(),
          company: hl.substring(atIdx2 + 4).trim(),
          duration: "", responsibilities: "", is_current: true
        });
      }
    }

    // ── EDUCATION (ALL schools) ──
    var education = [];
    var eduIdx = findSection("Education");
    if(eduIdx >= 0){
      var eduEnd = sectionEnd(eduIdx);
      var eduBlock = [];
      for(var j=eduIdx+1; j<eduEnd; j++){
        if(!isNoise(lines[j])) eduBlock.push(lines[j]);
      }
      // Pattern: Institution / Degree, Field / Dates (optional)
      var curEdu = null;
      for(var k=0; k<eduBlock.length; k++){
        var el = eduBlock[k];
        if(isDuration(el)){
          // skip date lines
          continue;
        }
        if(!curEdu){
          curEdu = {institution: el, degree: "", field: ""};
        } else if(!curEdu.degree){
          if(el.indexOf(",") >= 0){
            curEdu.degree = el.split(",")[0].trim();
            curEdu.field = el.split(",").slice(1).join(",").trim();
          } else {
            curEdu.degree = el;
          }
          education.push(curEdu);
          curEdu = null;
        }
      }
      if(curEdu){
        education.push(curEdu);
      }
    }

    // ── CERTIFICATIONS (individual records) ──
    var certifications = [];
    var certIdx = findSection("Licenses & certifications");
    if(certIdx < 0) certIdx = findSection("Licenses & Certifications");
    if(certIdx >= 0){
      var certEnd = sectionEnd(certIdx);
      var certBlock = [];
      for(var j=certIdx+1; j<certEnd; j++){
        if(!isNoise(lines[j])) certBlock.push(lines[j]);
      }
      // Pattern: Cert Name / Issuing Org (line with middle dot or next line) / Date
      var curCert = null;
      for(var k=0; k<certBlock.length; k++){
        var el = certBlock[k];
        if(isDuration(el) || el.indexOf("Credential ID") === 0 || el.indexOf("Show credential") === 0) continue;
        if(el.indexOf("\\xB7") >= 0){
          // Might be "Issued Jun 2020 · No Expiration Date"
          if(el.indexOf("Issued") === 0) continue;
          // Otherwise it's part of the issuer line
          if(curCert && !curCert.issuing_organization){
            curCert.issuing_organization = el.split("\\xB7")[0].trim();
          }
          continue;
        }
        if(!curCert){
          curCert = {name: el, issuing_organization: ""};
        } else if(!curCert.issuing_organization){
          curCert.issuing_organization = el;
          certifications.push(curCert);
          curCert = null;
        } else {
          // New cert starting
          certifications.push(curCert);
          curCert = {name: el, issuing_organization: ""};
        }
      }
      if(curCert) certifications.push(curCert);
    }

    // ── CONNECTION DEGREE ──
    var connDeg = "";
    for(var i=0;i<lines.length;i++){
      var m = lines[i].match(/^(\\d)(st|nd|rd)$/);
      if(m){connDeg=m[1];break;}
    }

    // ── Current role shorthand ──
    var co = experiences.length > 0 ? experiences[0].company : "";
    var ti = experiences.length > 0 ? experiences[0].title : "";

    var url = window.location.href.split("?")[0].replace(/\\/+$/,"");
    var snippet = fullText.substring(0, 5000);

    return JSON.stringify({
      firstname:fn, lastname:ln, fullName:nameText,
      headline:hl, about:about, location:loc,
      connectionDegree:connDeg,
      currentCompany:co, currentTitle:ti,
      experiences:experiences,
      education:education,
      certifications:certifications,
      linkedin_url:url,
      captured_date: new Date().toISOString(),
      rawPageText:snippet
    });
  } catch(e) {
    return JSON.stringify({error:e.message,stack:e.stack});
  }
})()`,
    });

    const rawStr = extractResults && extractResults[0] ? extractResults[0] : null;
    console.log('[linkedin-capture] Raw extraction result:', rawStr);

    const raw = rawStr ? JSON.parse(rawStr) : null;

    if (raw && raw.error) {
      throw new Error('Extraction script error: ' + raw.error);
    }

    if (!raw || !raw.firstname) {
      throw new Error(
        'Name extraction failed. Title was: "' + (tab.title || 'unknown') + '". ' +
        'Parsed: ' + JSON.stringify(raw) + '. Try refreshing the page.'
      );
    }

    const mappedProfile = {
      firstname: raw.firstname || '',
      lastname: raw.lastname || '',
      headline: raw.headline || '',
      company_name: raw.currentCompany || '',
      job_title: raw.currentTitle || '',
      location: raw.location || '',
      linkedin_url: raw.linkedin_url || '',
      about: raw.about || '',
      connection_degree: raw.connectionDegree || '',
      captured_date: raw.captured_date || new Date().toISOString(),
      experiences: raw.experiences || [],
      education: raw.education || [],
      certifications: raw.certifications || [],
      rawPageText: raw.rawPageText || '',
    };

    console.log('[linkedin-capture] Mapped profile:', JSON.stringify({
      name: mappedProfile.firstname + ' ' + mappedProfile.lastname,
      company: mappedProfile.company_name,
      title: mappedProfile.job_title,
      experiences: mappedProfile.experiences.length,
      education: mappedProfile.education.length,
      certifications: mappedProfile.certifications.length,
    }));

    // Send to API extract mode
    const apiResult = await apiCall({
      mode: 'extract',
      profile: mappedProfile,
    });

    extractedData = { ...apiResult, profile: { ...mappedProfile, ...(apiResult.parsed || {}) } };

    // Show preview
    stepExtract.classList.add('hidden');
    stepPreview.classList.remove('hidden');
    renderPreview(extractedData);
    setupCollapsibles();

  } catch (err) {
    showMessage(err.message, 'error');
  } finally {
    setLoading(extractBtn, false, 'Extract Profile');
  }
});

// Task toggle
taskEnabled.addEventListener('change', () => {
  if (taskEnabled.checked) {
    taskFields.classList.remove('hidden');
    setDefaultDueDate(3);
  } else {
    taskFields.classList.add('hidden');
  }
});

// Task template change → update defaults
taskTemplate.addEventListener('change', () => {
  const opt = taskTemplate.selectedOptions[0];
  if (opt) {
    setDefaultDueDate(parseInt(opt.dataset.days || '3', 10));
    taskPriority.value = opt.dataset.priority || 'MEDIUM';
    const desc = (opt.dataset.description || '').replace('{name}', extractedData?.profile?.firstname || '');
    taskDescription.value = desc;
  }
});

// Cancel
cancelBtn.addEventListener('click', () => {
  stepPreview.classList.add('hidden');
  stepExtract.classList.remove('hidden');
  hideMessage();
  extractedData = null;
  selectedTags = { network_roles: [], life_projects: [], metro_areas: [], focus_areas: [] };
});

// Save contact
saveBtn.addEventListener('click', async () => {
  hideMessage();
  setLoading(saveBtn, true, 'Saving…');

  try {
    const profile = extractedData?.profile || {};

    // Determine company ID — from explicit selection, alternatives, or matched
    let companyId = extractedData?.selectedCompanyId
      || extractedData?.company_match?.matched_company?.company_id
      || extractedData?.company_match?.id
      || null;

    // If "Create New Company" was chosen, clear companyId so API creates it
    if (extractedData?.createNewCompany) {
      companyId = null;
      const newName = document.getElementById('newCompanyName')?.value?.trim();
      const newDomain = document.getElementById('newCompanyDomain')?.value?.trim();
      if (newName) profile.company_name = newName;
      if (newDomain) profile.company_domain = newDomain;
    }

    const body = {
      mode: 'confirm',
      profile,
      tags: selectedTags,
      company_id: companyId,
      link_deal_id: dealSelect.value || null,
      capture_notes: captureNotes.value.trim() || null,
      capture_next_steps: nextSteps.value.trim() || null,
    };

    if (taskEnabled.checked) {
      body.task = {
        template: taskTemplate.value,
        description: taskDescription.value.trim() || null,
        due_date: taskDueDate.value || null,
        priority: taskPriority.value || 'MEDIUM',
      };
    }

    const result = await apiCall(body);

    // Show success
    stepPreview.classList.add('hidden');
    stepSuccess.classList.remove('hidden');
    successMsg.textContent = `${profile.firstname} ${profile.lastname} saved!`;

    const successDetail = document.getElementById('successDetail');
    const supabaseInfo = document.getElementById('supabaseInfo');

    // Build detail line
    const detailParts = [];
    if (profile.job_title) detailParts.push(profile.job_title);
    if (profile.company_name) detailParts.push('at ' + profile.company_name);
    if (detailParts.length > 0) {
      successDetail.textContent = detailParts.join(' ');
    } else if (profile.headline) {
      successDetail.textContent = profile.headline;
    }

    // Show HubSpot link if available
    const contact = result.contact || result;
    if (contact.hubspot_url) {
      hubspotLink.href = contact.hubspot_url;
      hubspotLink.classList.remove('hidden');
    }

    // Show Supabase confirmation
    const cid = contact.contact_id || result.contact_id || result.id;
    if (cid) {
      supabaseInfo.textContent = '✓ Saved to database (ID: ' + cid + ')';
      supabaseInfo.classList.remove('hidden');
    }

    // Show sync warning if present
    if (contact.sync_warning) {
      showMessage('Note: ' + contact.sync_warning, 'info');
    }
  } catch (err) {
    showMessage(err.message, 'error');
  } finally {
    setLoading(saveBtn, false, 'Save Contact');
  }
});

// Capture another — reset to extraction step
document.getElementById('captureAnotherBtn')?.addEventListener('click', () => {
  stepSuccess.classList.add('hidden');
  stepExtract.classList.remove('hidden');
  hubspotLink.classList.add('hidden');
  document.getElementById('supabaseInfo')?.classList.add('hidden');
  extractedData = null;
  selectedTags = { networkRoles: [], lifeProjects: [], metroArea: [] };
  hideMessage();
});

// Init
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  setupCollapsibles();
});
