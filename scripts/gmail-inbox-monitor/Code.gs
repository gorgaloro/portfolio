/**
 * Email Inbox Monitor — Google Apps Script
 * 
 * Monitors Gmail for job application emails, classifies them,
 * matches to HubSpot deals, and updates deal stages automatically.
 * 
 * Setup:
 *   1. Create a new Google Apps Script project at script.google.com
 *   2. Paste this file as Code.gs
 *   3. Add Script Property: HUBSPOT_TOKEN = pat-na1-...
 *   4. Create a 15-minute time-based trigger for processNewEmails()
 *   5. Create Gmail label: _processed/inbox-monitor
 *   6. Create Google Sheet "Inbox Monitor Log" and set SHEET_ID property
 * 
 * Pipeline ID: 1320210144
 * 
 * Classification categories:
 *   - confirmation: "thank you for applying", "application received"
 *   - rejection:    "decided to move forward", "position filled"
 *   - interview:    "schedule an interview", "phone screen"
 *   - offer:        "pleased to offer", "offer letter"
 */

// ─── Configuration ───────────────────────────────────────────────────────────

const PIPELINE_ID = '1320210144';

const STAGE_MAP = {
  'Saved': '1',
  'Applied': '2',
  'Interviewing': '3',
  'Offer': '4',
  'Accepted': '5',
  'Rejected': '6',
  'Withdrawn': '7',
  'No Response': '8',
};

// Stage transitions: classification → { from_stages, to_stage }
const TRANSITIONS = {
  confirmation: { to_stage: 'Applied', valid_from: ['Saved'] },
  rejection:    { to_stage: 'Rejected', valid_from: ['Saved', 'Applied', 'Interviewing', 'Offer'] },
  interview:    { to_stage: 'Interviewing', valid_from: ['Applied'] },
  offer:        { to_stage: 'Offer', valid_from: ['Interviewing'] },
};

const LABEL_NAME = '_processed/inbox-monitor';

// ─── Classification Patterns ─────────────────────────────────────────────────

const PATTERNS = {
  confirmation: [
    /thank you for (applying|your (application|interest))/i,
    /application (has been |was )?(received|submitted)/i,
    /we('ve| have) received your application/i,
    /successfully (applied|submitted)/i,
    /confirming (your|that|we)/i,
    /your application for .+ has been received/i,
  ],
  rejection: [
    /decided to (move|proceed) forward with other/i,
    /not (moving|proceeding) forward/i,
    /position has been filled/i,
    /unable to (offer|move forward)/i,
    /will not be (moving|advancing)/i,
    /unfortunately.{0,40}(not selected|not advancing|not moving)/i,
    /regret to inform/i,
    /after careful (consideration|review).{0,60}(other candidates|not)/i,
    /we (have|'ve) decided not to/i,
  ],
  interview: [
    /schedule (an?|your) interview/i,
    /phone screen/i,
    /would like to (invite|schedule)/i,
    /availability.{0,30}(interview|call|meet)/i,
    /next (step|round|stage) in (the|our) (process|interview)/i,
    /technical (assessment|interview|screen)/i,
    /meet (with|the) (team|hiring manager)/i,
    /interview (invitation|request|scheduling)/i,
  ],
  offer: [
    /pleased to (offer|extend)/i,
    /offer letter/i,
    /compensation package/i,
    /formal offer/i,
    /we('d| would) like to offer/i,
    /contingent offer/i,
  ],
};

// ─── Utilities ───────────────────────────────────────────────────────────────

function getHubSpotToken() {
  return PropertiesService.getScriptProperties().getProperty('HUBSPOT_TOKEN');
}

function getSheetId() {
  return PropertiesService.getScriptProperties().getProperty('SHEET_ID');
}

function hubspotRequest(method, path, payload) {
  const token = getHubSpotToken();
  if (!token) throw new Error('HUBSPOT_TOKEN not set in Script Properties');

  const options = {
    method: method,
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json',
    },
    muteHttpExceptions: true,
  };

  if (payload && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
    options.payload = JSON.stringify(payload);
  }

  const url = 'https://api.hubapi.com' + path;
  const resp = UrlFetchApp.fetch(url, options);
  const code = resp.getResponseCode();
  const body = resp.getContentText();

  if (code >= 400) {
    Logger.log('HubSpot API error ' + code + ': ' + body);
    throw new Error('HubSpot API ' + code + ': ' + body.substring(0, 200));
  }

  return JSON.parse(body);
}

// ─── Email Classification ────────────────────────────────────────────────────

function classifyEmail(subject, bodyText) {
  const combined = (subject + ' ' + bodyText).substring(0, 5000);

  for (const [category, patterns] of Object.entries(PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(combined)) {
        return {
          classification: category,
          method: 'pattern',
          confidence: 0.85,
          matched_pattern: pattern.source,
        };
      }
    }
  }

  return {
    classification: 'unknown',
    method: 'none',
    confidence: 0,
    matched_pattern: null,
  };
}

// ─── Deal Matching ───────────────────────────────────────────────────────────

function extractDomain(email) {
  const match = email.match(/@([a-z0-9.-]+)/i);
  return match ? match[1].toLowerCase() : null;
}

function searchDealsByDomain(domain) {
  if (!domain) return [];

  // Search companies by domain
  const companySearch = hubspotRequest('POST', '/crm/v3/objects/companies/search', {
    filterGroups: [{
      filters: [{
        propertyName: 'domain',
        operator: 'CONTAINS_TOKEN',
        value: domain.replace(/^www\./, ''),
      }],
    }],
    properties: ['name', 'domain'],
    limit: 5,
  });

  const companyIds = (companySearch.results || []).map(function(c) { return c.id; });
  if (companyIds.length === 0) return [];

  // For each company, get associated deals
  const deals = [];
  companyIds.forEach(function(companyId) {
    try {
      const assocResp = hubspotRequest('GET',
        '/crm/v3/objects/companies/' + companyId + '/associations/deals');
      const dealIds = (assocResp.results || []).map(function(a) { return a.id; });

      dealIds.forEach(function(dealId) {
        try {
          const deal = hubspotRequest('GET',
            '/crm/v3/objects/deals/' + dealId + '?properties=dealname,dealstage,pipeline,closedate,createdate');
          if (deal.properties && deal.properties.pipeline === PIPELINE_ID) {
            deals.push({
              id: deal.id,
              name: deal.properties.dealname,
              stage: deal.properties.dealstage,
              created: deal.properties.createdate,
            });
          }
        } catch (e) {
          Logger.log('Error fetching deal ' + dealId + ': ' + e.message);
        }
      });
    } catch (e) {
      Logger.log('Error fetching associations for company ' + companyId + ': ' + e.message);
    }
  });

  return deals;
}

function findBestDealMatch(deals, subject) {
  if (deals.length === 0) return null;
  if (deals.length === 1) return { deal: deals[0], confidence: 0.80 };

  // Prefer most recent open deal
  const openDeals = deals.filter(function(d) {
    return !['5', '6', '7', '8'].includes(d.stage); // Not closed stages
  });

  if (openDeals.length === 1) return { deal: openDeals[0], confidence: 0.85 };

  // Multiple open deals — try subject matching
  if (openDeals.length > 1) {
    const subjectLower = subject.toLowerCase();
    for (var i = 0; i < openDeals.length; i++) {
      if (openDeals[i].name && subjectLower.includes(openDeals[i].name.toLowerCase())) {
        return { deal: openDeals[i], confidence: 0.90 };
      }
    }
    // Fall back to most recent
    openDeals.sort(function(a, b) {
      return new Date(b.created) - new Date(a.created);
    });
    return { deal: openDeals[0], confidence: 0.60 };
  }

  // No open deals — check recently closed for rejection patterns
  deals.sort(function(a, b) {
    return new Date(b.created) - new Date(a.created);
  });
  return { deal: deals[0], confidence: 0.50 };
}

// ─── Stage Update ────────────────────────────────────────────────────────────

function getStageLabel(stageId) {
  for (var label in STAGE_MAP) {
    if (STAGE_MAP[label] === stageId) return label;
  }
  return stageId;
}

function updateDealStage(dealId, classification, currentStageId) {
  const transition = TRANSITIONS[classification];
  if (!transition) return { updated: false, reason: 'no_transition_defined' };

  const currentLabel = getStageLabel(currentStageId);
  if (!transition.valid_from.includes(currentLabel)) {
    return {
      updated: false,
      reason: 'invalid_transition',
      detail: currentLabel + ' → ' + transition.to_stage + ' not allowed',
    };
  }

  const newStageId = STAGE_MAP[transition.to_stage];
  if (!newStageId) return { updated: false, reason: 'unknown_target_stage' };

  hubspotRequest('PATCH', '/crm/v3/objects/deals/' + dealId, {
    properties: { dealstage: newStageId },
  });

  return {
    updated: true,
    previous_stage: currentLabel,
    new_stage: transition.to_stage,
  };
}

// ─── Logging ─────────────────────────────────────────────────────────────────

function logToSheet(row) {
  const sheetId = getSheetId();
  if (!sheetId) {
    Logger.log('SHEET_ID not set — skipping sheet log');
    return;
  }

  try {
    const ss = SpreadsheetApp.openById(sheetId);
    var sheet = ss.getSheetByName('Inbox Monitor Log');
    if (!sheet) {
      sheet = ss.insertSheet('Inbox Monitor Log');
      sheet.appendRow([
        'Timestamp', 'Sender', 'Domain', 'Subject',
        'Classification', 'Confidence', 'Deal ID', 'Deal Name',
        'Match Confidence', 'Action', 'Previous Stage', 'New Stage', 'Error',
      ]);
    }

    sheet.appendRow([
      new Date().toISOString(),
      row.sender || '',
      row.domain || '',
      row.subject || '',
      row.classification || '',
      row.classification_confidence || '',
      row.deal_id || '',
      row.deal_name || '',
      row.match_confidence || '',
      row.action || '',
      row.previous_stage || '',
      row.new_stage || '',
      row.error || '',
    ]);
  } catch (e) {
    Logger.log('Sheet logging error: ' + e.message);
  }
}

// ─── Main Processing ─────────────────────────────────────────────────────────

function getOrCreateLabel() {
  var label = GmailApp.getUserLabelByName(LABEL_NAME);
  if (!label) {
    label = GmailApp.createLabel(LABEL_NAME);
  }
  return label;
}

function processNewEmails() {
  const processedLabel = getOrCreateLabel();
  const query = '-label:' + LABEL_NAME.replace(/\//g, '-') + ' newer_than:1d category:primary';
  const threads = GmailApp.search(query, 0, 50);

  Logger.log('Found ' + threads.length + ' threads to process');

  var processed = 0;
  var classified = 0;
  var updated = 0;

  for (var t = 0; t < threads.length; t++) {
    var thread = threads[t];
    var messages = thread.getMessages();
    // Process the most recent message in the thread
    var msg = messages[messages.length - 1];

    var sender = msg.getFrom() || '';
    var subject = msg.getSubject() || '';
    var body = msg.getPlainBody() || '';
    var domain = extractDomain(sender);

    var logRow = {
      sender: sender,
      domain: domain,
      subject: subject.substring(0, 200),
    };

    try {
      // 1. Classify
      var result = classifyEmail(subject, body);
      logRow.classification = result.classification;
      logRow.classification_confidence = result.confidence;

      if (result.classification === 'unknown') {
        logRow.action = 'skipped_unknown';
        logToSheet(logRow);
        thread.addLabel(processedLabel);
        processed++;
        continue;
      }

      classified++;

      // 2. Match to deal
      var deals = searchDealsByDomain(domain);
      var match = findBestDealMatch(deals, subject);

      if (!match) {
        logRow.action = 'skipped_no_deal_match';
        logToSheet(logRow);
        thread.addLabel(processedLabel);
        processed++;
        continue;
      }

      logRow.deal_id = match.deal.id;
      logRow.deal_name = match.deal.name;
      logRow.match_confidence = match.confidence;

      // 3. Update stage
      var updateResult = updateDealStage(match.deal.id, result.classification, match.deal.stage);

      if (updateResult.updated) {
        logRow.action = 'stage_updated';
        logRow.previous_stage = updateResult.previous_stage;
        logRow.new_stage = updateResult.new_stage;
        updated++;
      } else {
        logRow.action = 'skipped_' + updateResult.reason;
        if (updateResult.detail) logRow.error = updateResult.detail;
      }

    } catch (e) {
      logRow.action = 'error';
      logRow.error = e.message;
      Logger.log('Error processing email: ' + e.message);
    }

    logToSheet(logRow);
    thread.addLabel(processedLabel);
    processed++;
  }

  Logger.log('Done: processed=' + processed + ' classified=' + classified + ' updated=' + updated);
}

// ─── Setup Helper ────────────────────────────────────────────────────────────

/**
 * Run once to set up the 15-minute trigger.
 * Go to Edit → Current project's triggers, or run this function.
 */
function createTrigger() {
  // Remove existing triggers for this function
  var triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(function(trigger) {
    if (trigger.getHandlerFunction() === 'processNewEmails') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  ScriptApp.newTrigger('processNewEmails')
    .timeBased()
    .everyMinutes(15)
    .create();

  Logger.log('Created 15-minute trigger for processNewEmails');
}

/**
 * Run once to verify HubSpot connection works.
 */
function testConnection() {
  try {
    var resp = hubspotRequest('GET', '/crm/v3/objects/deals?limit=1&properties=dealname');
    Logger.log('HubSpot connection OK. Sample deal: ' + JSON.stringify(resp.results[0]?.properties?.dealname));
  } catch (e) {
    Logger.log('HubSpot connection FAILED: ' + e.message);
  }
}
