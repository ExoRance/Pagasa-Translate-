const express = require('express');
const path = require('path');
const https = require('https');
const cheerio = require('cheerio');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// TRANSLATIONS (kept exactly as original)
const TRANSLATIONS = {
    Tagalog: {
        intro: (n) => `Ang Bagyong ${n} ay kasalukuyang aktibo sa loob ng Philippine Area of Responsibility (PAR).`,
        position_label: "Kasalukuyang Lokasyon",
        wind_label: "Bilis ng Hangin",
        gust_label: "Pinakamataas na Bugso",
        rainfall_label: "Pag-ulan",
        movement_label: "Direksyon at Bilis ng Galaw",
        affected_label: "Mga Lugar na Apektado",
        what_to_do: "Ano ang Dapat Gawin",
        final_note: (n) => `Ito na ang panghuling balita para sa Bagyong ${n}. Ang lahat ng signal ay aalisin na.`,
        signal_plain: { "4": "PINAKA-MAPANGANIB · Lumikas na agad", "3": "NAPAKA-MAPANGANIB · Ihanda ang lumikas", "2": "MAPANGANIB · Manatili sa loob ng bahay", "1": "BABALA · Bantayan ang mga update" },
        signal_detail: {
            "4": "Sobrang lakas ng hangin — mapanganib na lumabas. Lumikas na sa pinakamalapit na evacuation center.",
            "3": "Malakas ang hangin at ulan. Ihanda ang inyong go-bag at maging handa sa paglikas.",
            "2": "Magsisimula ang malakas na hangin at pag-ulan. Manatili sa loob ng bahay at huwag malapit sa ilog.",
            "1": "Posibleng malakas na ulan. Bantayan ang mga update mula sa lokal na pamahalaan."
        },
        actions: { Evacuate: "🏃 Lumikas agad sa pinakamalapit na evacuation center.", StayIndoors: "🏠 Manatili sa loob ng matibay na gusali.", FindShelter: "🏕️ Hanapin ang pinaka-malapit na ligtas na lugar.", Prepare: "🎒 Ihanda ang emergency kit: tubig, pagkain, gamot, dokumento.", Monitor: "📻 Makinig sa radyo o TV para sa mga update ng PAGASA." },
        speed_unit: "km/h", bulletin_no: "Balita Blg.", final_tag: "PANGHULING BALITA", active_tag: "AKTIBO", no_active: "0 tropical cyclones active ✔️"
    },
    Cebuano: {
        intro: (n) => `Ang Bagyong ${n} aktibo karon sulod sa Philippine Area of Responsibility (PAR).`,
        position_label: "Karon nga Lokasyon",
        wind_label: "Kusog sa Hangin",
        gust_label: "Pinakakusog nga Hangin",
        rainfall_label: "Ulan",
        movement_label: "Direksyon ug Bilis sa Paglihok",
        affected_label: "Mga Apektadong lugar",
        what_to_do: "Unsa ang Buhaton",
        final_note: (n) => `Kini na ang kataposang balita alang sa Bagyong ${n}. Tanang signal aaliton na.`,
        signal_plain: { "4": "PINAKA-DELIKADO · Adto dayon", "3": "SOBRANG DELIKADO · Andam sa paglumayas", "2": "DELIKADO · Pabilin sa sulod sa balay", "1": "PASIDAAN · Bantayan ang mga update" },
        signal_detail: {
            "4": "Hilabihang kusog sa hangin — delikado ang paggawas. Adto na sa pinakaduol na evacuation center.",
            "3": "Kusog ang hangin ug ulan. Andam ang inyong go-bag ug moandam sa paglumayas.",
            "2": "Magsugod ang kusog nga hangin ug ulan. Pabilin sa sulod ug dili moduol sa suba.",
            "1": "Posibleng kusog nga ulan. Bantayan ang mga update gikan sa lokal nga gobyerno."
        },
        actions: { Evacuate: "🏃 Lumayas dayon sa pinakaabot nga evacuation center.", StayIndoors: "🏠 Pabilin sa sulod sa lig-on nga bilding.", FindShelter: "🏕️ Pangitaa ang pinakaabot nga luwas nga dapit.", Prepare: "🎒 Andam ang emergency kit: tubig, pagkaon, tambal, dokumento.", Monitor: "📻 Mamati sa radyo o TV alang sa mga update sa PAGASA." },
        speed_unit: "km/h", bulletin_no: "Balita Blg.", final_tag: "KATAPOSANG BALITA", active_tag: "AKTIBO", no_active: "0 tropical cyclones active ✔️"
    },
    Ilokano: {
        intro: (n) => `Ti Bagyo ${n} aktibo ita iti uneg ti Philippine Area of Responsibility (PAR).`,
        position_label: "Nayannatoy a Lokasyon",
        wind_label: "Tipes ti Angin",
        gust_label: "Pinakanaranggas nga Angin",
        rainfall_label: "Tudo",
        movement_label: "Direksyon ken Tipes ti Panagakar",
        affected_label: "Dagiti Naapektaran a Lugar",
        what_to_do: "Ania ti Aramiden",
        final_note: (n) => `Daytoy ti maudi a damag para iti Bagyo ${n}. Amin a signal mapukaw na.`,
        signal_plain: { "4": "PINAKA-PELIGRO · Aglayas daytoy", "3": "NAPAKAPELIGRO · Mannakaparaso iti panaglayas", "2": "PELIGRO · Agserrek iti balay", "1": "PAKAAMMO · Bantayan dagiti update" },
        signal_detail: {
            "4": "Napigsa unay ti angin — peligroso ti lumuas. Aglayas na iti kasusuok a evacuation center.",
            "3": "Napigsa ti angin ken tudo. Ikkan ti inyong go-bag ken manannakaparaso.",
            "2": "Magrugin ti napigsa a angin ken tudo. Agserrek iti uneg ket saanen nga kumanayon iti karayan.",
            "1": "Posible a napigsa a tudo. Bantayan dagiti update manipud iti lokal a gobyerno."
        },
        actions: { Evacuate: "🏃 Aglayas daytoy iti kasusuok a evacuation center.", StayIndoors: "🏠 Agserrek iti uneg ti nauneg a bilding.", FindShelter: "🏕️ Biruken ti kasusuok a ligtas a lugar.", Prepare: "🎒 Ikkan ti emergency kit: danum, kanen, agas, dokumento.", Monitor: "📻 Dumngeg iti radyo wenno TV para kadagiti update ti PAGASA." },
        speed_unit: "km/h", bulletin_no: "Damag Blg.", final_tag: "MAUDI A DAMAG", active_tag: "AKTIBO", no_active: "0 tropical cyclones active ✔️"
    }
};

function fetchHtml(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            const { statusCode } = res;
            let raw = '';
            res.setEncoding('utf8');
            res.on('data', (chunk) => raw += chunk);
            res.on('end', () => {
                if (statusCode >= 200 && statusCode < 300) {
                    resolve(raw);
                } else {
                    resolve('');
                }
            });
        }).on('error', () => resolve('')).setTimeout(8000, () => resolve(''));
    });
}

async function fetchLiveBulletin(lang) {
    const t = TRANSLATIONS[lang] || TRANSLATIONS.Tagalog;
    const url = 'https://www.pagasa.dost.gov.ph/tropical-cyclone/severe-weather-bulletin';
    
    const html = await fetchHtml(url);
    if (!html) {
        return { status: 'no_active', message: t.no_active, count: 0, collapse: true };
    }

    const $ = cheerio.load(html);
    const fullText = $('body').text();
    
    // Check if there is genuinely no active cyclone content
    const isInactive = 
        /no active tropical cyclone/i.test(fullText) || 
        /no active cyclone/i.test(fullText) ||
        $('.alert-info:contains("No Active")').length > 0 ||
        $('.alert-info:contains("no active")').length > 0;

    if (isInactive) {
        return { status: 'no_active', message: t.no_active, count: 0, collapse: true };
    }

    // Dynamic extraction matching PAGASA DOM structure for live bulletins
    let cycloneName = 'TROPICAL CYCLONE';
    let bulletinNumber = '—';
    
    // 1. Extract Cyclone Title & Bulletin Number
    const titleHeader = $('.tropical-cyclone-weather-bulletin-page, .article-header').text();
    const nameMatch = titleHeader.match(/(Typhoon|Tropical Storm|Severe Tropical Storm|Tropical Depression)\s+"?([A-Za-z]+)"?/i);
    if (nameMatch) {
        cycloneName = `${nameMatch[1]} "${nameMatch[2]}"`.toUpperCase();
    }
    
    const bulletinMatch = titleHeader.match(/Bulletin\s*#?\s*(\d+)/i);
    if (bulletinMatch) {
        bulletinNumber = bulletinMatch[1];
    }

    // 2. Technical Specs Mapping
    let positionValue = 'Tingnan ang opisyal na bulletin';
    let windValue = '—';
    let gustValue = '—';
    let movementValue = '—';

    // Parse technical data sections directly out of structural layout blocks or tables
    $('td, p, div').each((i, el) => {
        const text = $(el).text().trim();
        if (/Location of Eye\/center/i.test(text)) {
            positionValue = $(el).next().text().trim() || text.replace(/Location of Eye\/center/i, '').trim();
        } else if (/Maximum sustained winds/i.test(text) || /Strength/i.test(text)) {
            const windMatch = text.match(/(\d+)\s*km\/h\s*near\s*the\s*center/i);
            const gustMatch = text.match(/gustiness\s*of\s*up\s*to\s*(\d+)\s*km\/h/i);
            if (windMatch) windValue = `${windMatch[1]} ${t.speed_unit}`;
            if (gustMatch) gustValue = `${gustMatch[1]} ${t.speed_unit}`;
        } else if (/Movement/i.test(text)) {
            movementValue = $(el).next().text().trim() || text.replace(/Movement/i, '').trim();
        }
    });

    // Fallback block if table layouts collapse into single string rows
    if (windValue === '—') {
        const fallbackWind = fullText.match(/maximum\s+sustained\s+winds\s+of\s+(\d+)\s*km\/h/i);
        if (fallbackWind) windValue = `${fallbackWind[1]} ${t.speed_unit}`;
    }
    if (gustValue === '—') {
        const fallbackGust = fullText.match(/gustiness\s+of\s+up\s+to\s+(\d+)\s*km\/h/i);
        if (fallbackGust) gustValue = `${fallbackGust[1]} ${t.speed_unit}`;
    }

    // 3. Signal Parsing Framework
    const signals = [];
    const actions = new Set();

    // Loop through known layout columns to safely index listed TCWS numbers
    $('table, tr').each((i, row) => {
        const rowText = $(row).text();
        if (/Signal\s*no\s*\d+/i.test(rowText) || /Signal\s*#?\s*\d+/i.test(rowText)) {
            const numMatch = rowText.match(/Signal\s*no\s*(\d)/i) || rowText.match(/Signal\s*#?\s*(\d)/i);
            if (numMatch) {
                const signalNum = numMatch[1];
                // Extract description or affected location tokens adjacent to signature node arrays
                const locations = $(row).find('td').eq(1).text().trim() || 'Mga nakasaad na lugar';
                signals.push({
                    number: signalNum,
                    text: t.signal_plain[signalNum] || `Signal No. ${signalNum}`,
                    detail: t.signal_detail[signalNum] || '',
                    areas: locations
                });

                // Set actionable mitigation tags matching specific target logic structures
                if (signalNum === '4' || signalNum === '3') {
                    actions.add(t.actions.Evacuate);
                    actions.add(t.actions.Prepare);
                } else if (signalNum === '2') {
                    actions.add(t.actions.StayIndoors);
                    actions.add(t.actions.Prepare);
                } else {
                    actions.add(t.actions.Monitor);
                }
            }
        }
    });

    // Fallback if structure didn't find active arrays but text clearly matches specific signal bands
    if (signals.length === 0 && /Signal\s*no\s*1/i.test(fullText)) {
        signals.push({
            number: "1",
            text: t.signal_plain["1"],
            detail: t.signal_detail["1"],
            areas: "Tingnan ang PAGASA bulletin para sa kumpletong listahan ng mga lugar."
        });
        actions.add(t.actions.Monitor);
    }

    return {
        status: 'active',
        collapse: false,
        count: 1,
        language: lang,
        source: 'pagasa.dost.gov.ph',
        cyclone_name: cycloneName,
        bulletin_number: bulletinNumber,
        is_final: /final/i.test(fullText),
        intro: t.intro(cycloneName),
        details: {
            position: { label: t.position_label, value: positionValue },
            wind: { label: t.wind_label, value: windValue },
            gust: { label: t.gust_label, value: gustValue },
            rainfall: { label: t.rainfall_label, value: 'Sumangguni sa Weather Advisory' },
            movement: { label: t.movement_label, value: movementValue }
        },
        summary: cycloneName + " ay kasalukuyang nasa loob ng PAR.",
        signals: signals,
        actions: Array.from(actions),
        strings: { affected_label: t.affected_label, what_to_do: t.what_to_do, bulletin_no: t.bulletin_no, final_tag: t.final_tag, active_tag: t.active_tag }
    };
}

app.get('/api/bulletin/latest', async (req, res) => {
    const lang = req.query.lang || 'Tagalog';
    const result = await fetchLiveBulletin(lang);
    res.json(result);
});

app.get('/api/bulletin', async (req, res) => {
    const lang = req.query.lang || 'Tagalog';
    const result = await fetchLiveBulletin(lang);
    res.json(result);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`PAGASA Translate running on http://localhost:${PORT}`));