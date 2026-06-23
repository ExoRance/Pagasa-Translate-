const https = require('https');
const cheerio = require('cheerio');
const { URL } = require('url');

const LANDING_URL = 'https://www.pagasa.dost.gov.ph/tropical-cyclone/severe-weather-bulletin';

function fetchHtml(url, timeout = 10000) {
  return new Promise((resolve) => {
    try {
      const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PAGASA-Translate/1.0)' } }, (res) => {
        let raw = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => raw += chunk);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) resolve(raw);
          else resolve('');
        });
      });
      req.on('error', () => resolve(''));
      req.setTimeout(timeout, () => { req.destroy(); resolve(''); });
    } catch (e) {
      resolve('');
    }
  });
}

function absoluteUrl(base, href) {
  try { return new URL(href, base).toString(); } catch (e) { return href; }
}

function splitAreas(text) {
  if (!text) return [];
  // Remove common lead-ins
  text = text.replace(/\b(The following (areas|provinces|cities|municipalities) (are|are under|are under the)|Areas under this signal:?)\b\s*/ig, '');
  // Replace bullet characters and parentheses
  text = text.replace(/[()\u2022·•]/g, '');
  const parts = text.split(/,|;|\band\b|\n|\/|\||\u00B7/).map(s => s.trim()).filter(Boolean);
  // Remove stray words
  return parts.map(p => p.replace(/^:\s*/, '').replace(/^and\s+/i, '')).filter(Boolean);
}

function findCandidateBulletinLink(landingHtml) {
  const $ = cheerio.load(landingHtml);
  const anchors = [];
  $('a').each((i, el) => {
    const $el = $(el);
    anchors.push({ href: $el.attr('href') || '', text: $el.text().trim() });
  });

  // Score anchors by heuristics
  const scored = anchors.map(a => {
    let score = 0;
    if (/Severe Weather Bulletin/i.test(a.text)) score += 5;
    if (/Weather Bulletin|Severe Weather|Severe Weather Bulletin|Bulletin No\.?/i.test(a.text)) score += 3;
    if (/tropical-cyclone|weather-bulletin|severe-weather-bulletin|bulletin/i.test(a.href)) score += 2;
    return { ...a, score };
  }).filter(a => a.score > 0).sort((a,b) => b.score - a.score);

  for (const c of scored) {
    const href = (c.href || '').trim();
    if (!href) continue;
    if (href.startsWith('#') || href.toLowerCase().startsWith('javascript:')) continue;
    // ignore iframe pages that may be dynamic placeholders
    if (/iframe/i.test(href)) continue;
    // convert to absolute
    return absoluteUrl(LANDING_URL, href);
  }

  // Try looking for article link text nodes
  const articleLink = $('a:contains("Severe Weather Bulletin")').first();
  if (articleLink && articleLink.attr('href')) return absoluteUrl(LANDING_URL, articleLink.attr('href'));

  return null;
}

function extractParagraphsFromHtml(html) {
  const $ = cheerio.load(html);
  // normalize some tags to preserve natural breaks
  $('br').replaceWith('\n');
  $('p').each((i, el) => { $(el).prepend('\n').append('\n'); });

  const selectors = ['article', '.entry-content', '.post-content', '#content', 'main', '.page-content', 'body'];
  for (const sel of selectors) {
    const root = $(sel).first();
    if (root && root.length) {
      // Prefer explicit <p> text if present
      const ps = root.find('p');
      if (ps && ps.length) {
        const arr = ps.toArray().map(p => $(p).text().replace(/\s+/g, ' ').trim()).filter(Boolean);
        if (arr.length) return arr;
      }
      // Otherwise take the large text block and try to split on known headings
      const text = root.text() || '';
      const norm = text.replace(/\s+/g, ' ').trim();
      if (norm.length > 50) {
        const parts = norm.split(/(?=(?:Issued at|Issued:|Location of Eye\/center|Location of Eye|Location of center|Movement|Maximum sustained winds|Forecast Position|Wind Signal|Signal No\.|Tropical Cyclone Wind Signal|Typhoon|Tropical Storm))/i).map(s => s.trim()).filter(Boolean);
        if (parts.length) return parts;
        return [norm];
      }
    }
  }

  // fallback to all <p> anywhere
  const allP = $('p').toArray().map(p => $(p).text().replace(/\s+/g, ' ').trim()).filter(Boolean);
  if (allP.length) return allP;

  // final fallback: normalize body/raw html and try heading-based splits
  const bodyText = $('body').text() || html || '';
  const normBody = bodyText.replace(/\s+/g, ' ').trim();
  if (!normBody) return [];
  const parts = normBody.split(/(?=(?:Issued at|Location of Eye\/center|Movement|Maximum sustained winds|Wind Signal|Signal No\.|Forecast Position|Typhoon|Tropical Storm))/i).map(s => s.trim()).filter(Boolean);
  return parts.length ? parts : [normBody];
}

// Robust normalized body text extraction (collect headings, article, main, large divs and body text)
function getNormalizedBodyText(html) {
  const $ = cheerio.load(html || '');
  let bodyText = '';
  try { bodyText = ($('body').text() || ''); } catch (e) { bodyText = ''; }

  const headings = [];
  try {
    $('h1,h2,h3').each((i, el) => {
      const t = $(el).text() || '';
      if (t && t.trim().length) headings.push(t.trim());
    });
  } catch (e) { }

  const articleText = ($('article').text() || '');
  const mainText = ($('main').text() || '');

  // Collect large divs (heuristic for deeply nested content)
  let largeDivText = '';
  try {
    $('div').each((i, el) => {
      const t = $(el).text() || '';
      if (t && t.trim().length > 80) largeDivText += ' ' + t.trim();
    });
  } catch (e) { }

  const combined = [bodyText, headings.join(' '), articleText, mainText, largeDivText].join(' ');
  const normalized = (combined || html || '').replace(/\s+/g, ' ').trim();
  return normalized;
}

function parseSignals(paragraphs, fullText) {
  const joined = (Array.isArray(paragraphs) ? paragraphs.join('\n\n') : (fullText || ''));
  const signals = [];

  // Match headings and capture content until next signal heading or end
  const signalRegex = /(Tropical Cyclone Wind Signal|TCWS|Wind Signal|Signal(?: No\.?| No|#)?)\s*(?:No\.?\s*|#\s*)?(\d{1,2})\b[:\)\-–\s]*(.*?)(?=(?:Tropical Cyclone Wind Signal|TCWS|Wind Signal|Signal(?: No\.?| No|#)?\s*\d{1,2}\b)|$)/ig;
  let m;
  while ((m = signalRegex.exec(joined)) !== null) {
    const num = m[2];
    const content = (m[3] || '').trim();

    // Areas often follow phrases like "Areas under this signal:" or appear as the first sentence
    let areasText = '';
    const areasMatch = content.match(/(?:Areas (?:under this )?signal[:\s\-–]*|Areas[:\s\-–]*|Areas under this signal[:\s\-–]*)([^\.\n]+)/i);
    if (areasMatch) areasText = areasMatch[1];
    else {
      const firstLine = content.split(/\.|\n/)[0];
      if (firstLine && firstLine.length > 3) areasText = firstLine;
    }

    const areas = splitAreas(areasText);
    const meteorological = safeFirstMatch(content, /(?:Meteorological condition|Meteorological\/Condition|Condition)[:\s\-–]*([^\.]+)/i);
    const impact = safeFirstMatch(content, /(?:Impact|Impacts|Expected impact|Likely impact)[:\s\-–]*([^\.]+)/i);
    const precaution = safeFirstMatch(content, /(?:Precautionary measures|Precautionary|Precautionary\/Precautions|Measures)[:\s\-–]*([^\.]+)/i) || safeFirstMatch(content, /(?:What to do|Recommendations|Advisory)[:\s\-–]*([^\.]+)/i);

    signals.push({
      number: String(num),
      plain_label: `Signal No. ${num}`,
      detail: content || '',
      areas,
      meteorological: meteorological || null,
      impact: impact || null,
      precautionary: precaution || null
    });
  }

  // Simple inline fallback like "Signal No. 1: Area1, Area2"
  if (signals.length === 0) {
    const simpleRegex = /(?:Signal(?: No\.? )?|TCWS|Wind Signal)[\s:]*#?(\d{1,2})[:\s\-–]+([^;\n]+)/ig;
    let sM;
    while ((sM = simpleRegex.exec(joined)) !== null) {
      const num = sM[1];
      const areas = splitAreas(sM[2] || '');
      signals.push({ number: String(num), plain_label: `Signal No. ${num}`, detail: sM[2] || '', areas });
    }
  }

  return signals;
}

function safeFirstMatch(text, regex) {
  const m = text.match(regex);
  return m ? m[1] : null;
}

function parseTechnicalDetails(paragraphs, fullText) {
  let position = null, wind = null, gust = null, movement = null, bulletin_number = null, cyclone_name = null, issued_at = null, forecast_position = null;

  bulletin_number = safeFirstMatch(fullText, /Bulletin\s*(?:No\.?|No|#)\s*(\d+)/i) || safeFirstMatch(fullText, /Severe Weather Bulletin\s*(?:No\.?|No|#)\s*(\d+)/i);

  // cyclone name: look for category + name (e.g., "Typhoon SANTOS")
  const nameMatch = fullText.match(/\b(Typhoon|Tropical Storm|Severe Tropical Storm|Tropical Depression|Tropical Cyclone)\b[\s:,-]*["“']?([A-Za-z0-9 \-\u201C\u201D"']{2,50})["”']?/i);
  if (nameMatch) {
    const category = (nameMatch[1] || '').trim();
    const name = (nameMatch[2] || '').trim().replace(/["“”']/g, '').split(/\s{2,}|,|\(|\n/)[0].trim();
    cyclone_name = `${category} ${name}`.trim();
  } else {
    // fallback for uppercase-only headings
    const capsMatch = fullText.match(/\b(Typhoon)\b[\s\n:-]*([A-Z]{3,})\b/);
    if (capsMatch) cyclone_name = `${capsMatch[1]} ${capsMatch[2]}`;
  }

  issued_at = safeFirstMatch(fullText, /Issued (?:at|:)\s*([^\.\n]+)/i) || safeFirstMatch(fullText, /Issued on\s*([^\.\n]+)/i) || safeFirstMatch(fullText, /Date and Time[:\s\-–]*([^\.\n]+)/i);

  position = safeFirstMatch(fullText, /(?:Location of Eye\/center|Location of Eye|Location|Center (?:located|at)|located at)[:\s\-–]*([^\.\n]+)/i) || safeFirstMatch(fullText, /near\s+([0-9.°'"NSEW\s,km]+?)(?:\.|,|\n)/i);

  forecast_position = safeFirstMatch(fullText, /Forecast Position[:\s\-–]*([^\.\n]+)/i) || safeFirstMatch(fullText, /Forecast Positions? (?:at|:)\s*([^\.\n]+)/i);

  wind = safeFirstMatch(fullText, /maximum\s+sustained\s+winds?\s*(?:of|are|at)?\s*([0-9]+)\s*km\/?h/i) || safeFirstMatch(fullText, /maximum\s+winds?\s*(?:are|of)?\s*([0-9]+)\s*km\/?h/i) || safeFirstMatch(fullText, /Maximum sustained winds(?:\s*are)?[:\s\-–]*([0-9]+(?:\s*km\/?h|\s*kmh)?)/i);
  if (wind && !/km/i.test(wind)) wind = `${wind} km/h`;

  gust = safeFirstMatch(fullText, /gusts?\s*(?:of|up to)?\s*([0-9]+)\s*km\/?h/i) || safeFirstMatch(fullText, /gustiness[:\s\-–]*([0-9]+)\s*km\/?h/i);
  if (gust && !/km/i.test(gust)) gust = `${gust} km/h`;

  movement = safeFirstMatch(fullText, /(?:Movement|Moving)[:\s\-–]*([^\.\n]+)/i) || safeFirstMatch(fullText, /moving\s+(?:towards|to)?\s*([A-Za-z\s]+)\s*(?:at\s*(\d+)\s*km\/?h)?/i);

  return { position, wind, gust, movement, bulletin_number, cyclone_name, issued_at, forecast_position };
}

async function getLatestBulletinRaw() {
  // Fetch landing page
  const landingHtml = await fetchHtml(LANDING_URL);
  if (!landingHtml) {
    return {
      status: 'error',
      message: 'Unable to contact PAGASA weather server. Check your internet connection.'
    };
  }

  // Debug: landing page length
  try { console.log('[pagasaParser] landing length:', (landingHtml && landingHtml.length) || 0); } catch(e){}

  // Only treat "no active" when explicitly stated on the normalized body text (checked later)
  const explicitNoActiveRegex = /\b(no active tropical cyclone|no active system|no active cyclone|no active systems)\b/i;

  let bulletinUrl = findCandidateBulletinLink(landingHtml);
  try { console.log('[pagasaParser] bulletin URL found:', bulletinUrl); } catch(e){}

  let bulletinHtml = '';
  if (bulletinUrl) bulletinHtml = await fetchHtml(bulletinUrl);
  // Fallback: if landing page contains bulletin content itself
  if (!bulletinHtml) bulletinHtml = landingHtml;

  try { console.log('[pagasaParser] bulletin HTML length:', (bulletinHtml && bulletinHtml.length) || 0); } catch(e){}

  // Extract paragraphs/text with resilient logic
  const paragraphs = extractParagraphsFromHtml(bulletinHtml) || [];
  // Extract full normalized body text (search headings, article, main, body and large divs)
  const normalizedBody = getNormalizedBodyText(bulletinHtml) || '';

  try { console.log('[pagasaParser] extracted text length:', (normalizedBody && normalizedBody.length) || 0); } catch(e){}
  try { console.log('[pagasaParser] extracted snippet (1500):', (normalizedBody || '').slice(0,1500)); } catch(e){}

  // Do NOT return no_active unless explicitly stated
  if (explicitNoActiveRegex.test(normalizedBody)) {
    return { status: 'no_active' };
  }

  // Broad detection for bulletin content — but if not found, still attempt partial parse
  const detectionPatterns = [ /typhoon/i, /tropical storm/i, /location of eye\/?center|location of eye|location of center/i, /maximum sustained winds|maximum sustained wind|maximum winds/i, /wind signal|signal no\.?|tcws/i, /issued at|issued:/i ];
  const hasBulletin = detectionPatterns.some(rx => rx.test(normalizedBody));

  // Parse technical details and signals regardless; prefer partial data over failing
  const technical = parseTechnicalDetails(paragraphs, normalizedBody);
  try { console.log('[pagasaParser] detected cyclone name:', technical.cyclone_name || null); } catch(e){}

  const signals = parseSignals(paragraphs, normalizedBody);

  // If no signals could be parsed, but text suggests a bulletin exists, create emergency default
  let parsedSignals = Array.isArray(signals) ? signals : [];
  if (parsedSignals.length === 0 && hasBulletin) {
    parsedSignals = [{ number: '1', plain_label: 'Signal No. 1', detail: 'Monitor updates', areas: [] }];
  }

  const normalizedSignals = parsedSignals.map(s => ({
    number: s.number,
    plain_label: s.plain_label,
    detail: s.detail || '',
    areas: Array.isArray(s.areas) ? s.areas : splitAreas(s.areas || ''),
    meteorological: s.meteorological || null,
    impact: s.impact || null,
    precautionary: s.precautionary || null
  }));

  try { console.log('[pagasaParser] detected signals:', JSON.stringify(normalizedSignals, null, 2)); } catch(e){}

  const intro = (paragraphs && paragraphs[0]) ? paragraphs[0] : '';
  const summary = (intro && intro.length > 0) ? intro.slice(0, 220) : `${technical.cyclone_name || (hasBulletin ? 'Tropical Cyclone' : 'Bulletin') } is within PAR.`;
  const is_final = /final bulletin|this is the final|final warning|final advisory/i.test(normalizedBody);

  return {
    status: hasBulletin ? 'active' : 'active', // prefer active/partial over incorrectly returning no_active
    source: bulletinUrl || LANDING_URL,
    cyclone_name: technical.cyclone_name || null,
    bulletin_number: technical.bulletin_number || null,
    issued_at: technical.issued_at || null,
    is_final,
    intro: intro,
    summary,
    details: {
      position: { label: 'Location of Eye/center', value: technical.position || technical.forecast_position || 'See official bulletin' },
      issued_at: { label: 'Issued at', value: technical.issued_at || '—' },
      forecast_position: { label: 'Forecast Position', value: technical.forecast_position || '—' },
      wind: { label: 'Maximum sustained winds', value: technical.wind || '—' },
      gust: { label: 'Gustiness', value: technical.gust || '—' },
      movement: { label: 'Movement', value: technical.movement || '—' }
    },
    signals: normalizedSignals,
    count: (normalizedSignals && normalizedSignals.length) || 1,
    raw_text: normalizedBody
  };
}

module.exports = { getLatestBulletinRaw };
