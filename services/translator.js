const translations = require('../data/translations');
const actions = require('./actions');

function normalizeLang(lang) {
  if (!lang) return 'Tagalog';
  const l = ('' + lang).toLowerCase();
  if (['tagalog', 'tl'].includes(l)) return 'Tagalog';
  if (['cebuano', 'ceb', 'visayan'].includes(l)) return 'Cebuano';
  if (['ilokano', 'ilocano', 'il'].includes(l)) return 'Ilokano';
  if (['tagalog', 'cebuano', 'ilokano'].includes(lang)) return lang;
  return 'Tagalog';
}

function ensureAreasArray(areas) {
  if (!areas) return [];
  if (Array.isArray(areas)) return areas;
  return ('' + areas).split(/,|;|\n|\//).map(s => s.trim()).filter(Boolean);
}

// Strip category words and noisy trailing text from cyclone name
function stripCategoryAndSanitize(raw) {
  if (!raw) return '';
  let name = String(raw).trim();
  // Remove category words
  name = name.replace(/\b(Typhoon|Tropical Storm|Severe Tropical Storm|Tropical Depression|Tropical Cyclone)\b/ig, '');
  // Remove common noisy words (verbs, phrases) that sometimes trail the name
  name = name.replace(/\b(was|is|estimated|based|at|the|center|of|eye|estimated based|based on|was estimated)\b/ig, '');
  // Remove parentheses and coordinates or other punctuation
  name = name.replace(/\([^\)]*\)/g, '');
  name = name.replace(/[^A-Za-z0-9\s\-]/g, '');
  name = name.replace(/\s+/g, ' ').trim();
  if (!name) return '';
  return name.split(/\s+/).slice(0,2).join(' ');
}

// Direction and location translation maps
const dirMap = {
  Tagalog: {
    north: 'Hilaga', northeast: 'Hilagang-Silangan', east: 'Silangan', southeast: 'Silangang-Timog',
    south: 'Timog', southwest: 'Timog-Kanluran', west: 'Kanluran', northwest: 'Hilagang-Kanluran'
  },
  Cebuano: {
    north: 'Amihanang', northeast: 'Amihanang-Silangan', east: 'Silangan', southeast: 'Silangang-Habagat',
    south: 'Habagat', southwest: 'Habagat-Kanluran', west: 'Kanluran', northwest: 'Kanlurang-Amihanang'
  },
  Ilokano: {
    north: 'Amian', northeast: 'Amian-Daya', east: 'Daya', southeast: 'Daya-Apungan',
    south: 'Abagatan', southwest: 'Abagatan-Punente', west: 'Punente', northwest: 'Punente-Amian'
  }
};

const locationMap = {
  Tagalog: { 'philippine sea': 'Dagat ng Pilipinas', 'philippine sea (': 'Dagat ng Pilipinas' },
  Cebuano: { 'philippine sea': 'Dag-at sa Pilipinas' },
  Ilokano: { 'philippine sea': 'Dagat ti Pilipinas' }
};

const prepMap = {
  Tagalog: { over: 'sa', in: 'sa', near: 'malapit sa', off: 'malapit sa' },
  Cebuano: { over: 'sa', in: 'sa', near: 'duol sa', off: 'duol sa' },
  Ilokano: { over: 'iti', in: 'iti', near: 'asideg iti', off: 'asideg iti' }
};

function translateMovement(text, lang) {
  if (!text) return '';
  const locale = (lang === 'Tagalog' || lang === 'Cebuano' || lang === 'Ilokano') ? lang : 'Tagalog';
  const raw = String(text).trim();
  const lower = raw.toLowerCase();

  // Find direction (handles north, northwest, northeast, etc., with or without "ward")
  const dirRegex = /(north\s*west(?:ward)?|northwest(?:ward)?|northwestward|north\s*east(?:ward)?|northeast(?:ward)?|northeastward|south\s*west(?:ward)?|southwest(?:ward)?|southwestward|south\s*east(?:ward)?|southeast(?:ward)?|southeastward|north(?:ward)?|south(?:ward)?|east(?:ward)?|west(?:ward)?)/i;
  const dmatch = lower.match(dirRegex);
  let dirTranslated = null;
  if (dmatch) {
    let dir = dmatch[0].toLowerCase().replace(/\s+/g, '');
    dir = dir.replace(/ward$/, '');
    const map = dirMap[locale] || dirMap['Tagalog'];
    dirTranslated = map[dir] || map[dir.toLowerCase()];
  }

  // Find location preposition + place
  const locRegex = /\b(over|in|near|off|offshore|east of|west of|north of|south of)\b\s*(the\s*)?([A-Za-z0-9\-\s,]+)/i;
  const locMatch = raw.match(locRegex);
  let locTranslated = null;
  let prepLocal = '';
  if (locMatch) {
    const prep = (locMatch[1] || '').toLowerCase();
    const place = (locMatch[3] || '').trim().replace(/,$/, '');
    const lmap = locationMap[locale] || {};
    locTranslated = lmap[place.toLowerCase()] || place;
    const pmap = prepMap[locale] || prepMap['Tagalog'];
    prepLocal = pmap[prep] || pmap['over'] || '';
  }

  // Speed
  const speedMatch = raw.match(/\bat\s*([0-9]+(?:\.[0-9]+)?)\s*km\/?h\b/i);
  const speed = speedMatch ? `${speedMatch[1]} km/h` : (raw.match(/[0-9]+\s*km\/?h/i) ? raw.match(/[0-9]+\s*km\/?h/i)[0] : '');

  const parts = [];
  if (dirTranslated) parts.push(dirTranslated);
  else {
    // Fallback: clean and title-case
    parts.push(raw.replace(/\s+/g, ' ').replace(/(^|\s)[a-z]/g, c => c.toUpperCase()));
  }
  if (locTranslated) {
    if (prepLocal) parts.push(`${prepLocal} ${locTranslated}`);
    else parts.push(`sa ${locTranslated}`);
  }
  if (speed) parts.push(speed);
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

function stripPositionCoordinates(positionValue) {
  if (!positionValue) return '';
  let v = String(positionValue);
  // If it contains km and 'of', extract the place after 'of'
  const kmOfMatch = v.match(/of\s+([^\(\n]+)/i);
  if (kmOfMatch && /\d+\s*km/i.test(v)) {
    return kmOfMatch[1].replace(/\([^\)]*\)/g, '').trim();
  }
  // Otherwise remove parenthetical coordinates and numbers
  v = v.replace(/\([^\)]*\)/g, '');
  v = v.replace(/\d+\.?\d*\s*°[NSEW]/ig, '');
  v = v.replace(/\d+\s*km/ig, '');
  return v.replace(/\s+/g, ' ').trim();
}

function translate(parsed, langParam) {
  const lang = normalizeLang(langParam);
  const t = translations[lang] || translations.Tagalog;

  if (!parsed || parsed.status === 'error') {
    return {
      status: 'error',
      message: parsed?.message || 'Failed to fetch bulletin',
      count: 0,
      collapse: true
    };
  }

  if (parsed.status === 'no_active') {
    return { status: 'no_active', message: t.no_active, count: 0, collapse: true };
  }

  const signals = (parsed.signals || []).map(s => {
    const number = String(s.number || s.num || s.signal || '').trim() || '1';
    return {
      number,
      plain_label: (t.signal_plain && t.signal_plain[number]) ? t.signal_plain[number] : (s.plain_label || `Signal No. ${number}`),
      detail: (t.signal_detail && t.signal_detail[number]) ? t.signal_detail[number] : (s.detail || ''),
      areas: ensureAreasArray(s.areas || [])
    };
  });

  const recommended = actions.recommendActions(signals, t);

  // Derive clean cyclone name via multi-step extraction
function extractName(parsedObj) {
  const sources = [
    parsedObj.cyclone_name,
    parsedObj.raw_text,
    parsedObj.summary,
    parsedObj.intro
  ];

  for (const src of sources) {
    if (!src) continue;

    const text = String(src);

    // STRICT headline match:
    // Typhoon "Francisco"
    const headlineMatch = text.match(
      /Typhoon\s+[""]([A-Za-z\-]+)[""]/i
    );

    if (headlineMatch && headlineMatch[1]) {
      return headlineMatch[1].trim();
    }
  }

  return '';
}

  const extractedName = extractName(parsed);
  const bagyoPrefix = t.bagyo_prefix || 'Bagyong';
  const cycloneDisplay = extractedName 
  ? `${bagyoPrefix} ${extractedName.toUpperCase()}` 
  : ((parsed.cyclone_name || '').toUpperCase() || '');

  // Details translation
  const rawPosition = parsed.details?.position?.value || '';
  const positionClean = stripPositionCoordinates(rawPosition);
  const translatedPosition = positionClean ? translateMovement(positionClean, lang) : '';

  const translatedMovement = translateMovement(parsed.details?.movement?.value || '', lang);
  const translatedWind = parsed.details?.wind?.value || '';
  const translatedGust = parsed.details?.gust?.value || '';

  const introName = extractedName || stripCategoryAndSanitize(parsed.cyclone_name || '');

  return {
    status: 'active',
    collapse: false,
    count: parsed.count || 1,
    language: lang,
    source: parsed.source || 'pagasa.dost.gov.ph',
    cyclone_name: cycloneDisplay,
    bulletin_number: parsed.bulletin_number || '—',
    is_final: !!parsed.is_final,
    intro: (t.intro && typeof t.intro === 'function') ? t.intro(introName) : parsed.intro || '',
    details: {
      position: { label: t.position_label || 'Location', value: translatedPosition || positionClean || '' },
      wind: { label: t.wind_label || 'Maximum sustained winds', value: translatedWind },
      gust: { label: t.gust_label || 'Gustiness', value: translatedGust },
      rainfall: { label: t.rainfall_label || 'Rainfall', value: parsed.details?.rainfall?.value || '' },
      movement: { label: t.movement_label || 'Movement', value: translatedMovement }
    },
    summary: parsed.summary || '',
    signals: signals,
    actions: recommended,
    strings: {
      affected_label: t.affected_label || 'Affected Areas',
      what_to_do: t.what_to_do || 'What to do',
      bulletin_no: t.bulletin_no || 'Bulletin No.',
      final_tag: t.final_tag || 'FINAL',
      active_tag: t.active_tag || 'ACTIVE'
    }
  };
}

module.exports = { translate, normalizeLang };
