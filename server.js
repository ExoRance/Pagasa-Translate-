import express from 'express';
import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(express.static(path.join(__dirname, 'public'))); // ✅ now after app is defined

const translations = {
    "Bikolano": {
        //Error
        "Not": "Dai",
        "Page": "Impormasyon",
        "Found": "Nakita",
        //PAGASA
        "No": "Dai",
        "Signal": "Sinyal", 
        "Tropical": "Tropikal",
        "Cyclone": "Bagyo",
        "Warning": "Pahiling",
        "Bulletin": "Bultin",
        "Active": "Aktibong",
        "within": "sa uneg kan",
        "Philippine Area of Responsibility": "Teritoryo kan Pilipinas"
    },  
    "Ilokano": { 
        //Error
        "Not": "Saan",
        "Page": "impormasion",
        "Found": "Nabirukan",
        //PAGASA
        "No": "Awan ti",
        "Signal": "Sinyal", 
        "Tropical": "a Tropikal", 
        "Cyclone": "Bagyo",
        "Warning": "Pakdaar",
        "Bulletin": "Bultin",
        "Active": "Aktibong",
        "within": "iti uneg ti",
        "Philippine Area of Responsibility": "Lugar ti Pagrebbengan ti Pilipinas"
    },
    "Cebuano": { 
        //Error
        "Not": "Walay",
        "Page": "Impormasyon",
        "Found": "Nakit-an",
        //PAGASA
        "No": "Walay",
        "Signal": "Sinyal", 
        "Tropical": "Tropikal", 
        "Cyclone": "Storm",
        "Warning": "Pahibalo",
        "Bulletin": "Balita",
        "Active": "Aktibong",
        "within": "sulod sa",
        "Philippine Area of Responsibility": "Teritoryo sa Pilipinas"
    },
    "Tagalog": { 
        //Error
        "Not": "ay di",
        "Page": "Informasyon",
        "Found": "Makuhanan",
        //PAGASA
        "No": "Walang",
        "Signal": "Babala", 
        "Tropical": "tropikal", 
        "Cyclone": "bagyo",
        "Warning": "Babala",
        "Bulletin": "Ulat",
        "Active": "aktibong",
        "within": "sa",
        "Philippine Area of Responsibility": "teritoyo ng Pilipinas"
    }
};

app.get('/api/bulletin', async (req, res) => {
    const lang = req.query.lang || "Tagalog";
    const browser = await puppeteer.launch({ 
        headless: "new",
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' 
    });

    try {
        const page = await browser.newPage();
        await page.goto('https://www.pagasa.dost.gov.ph/tropical-cyclone/severe-weather-bulletin', { 
            waitUntil: 'networkidle2' 
        });
        
        let text = await page.evaluate(() => {
            const header = document.querySelector('.bulletin-title') || document.querySelector('.panel-title') || document.querySelector('h1');
            return header ? header.innerText.trim() : "No Active Tropical Cyclone within Philippine Area of Responsibility";
        });

        const dict = translations[lang];
        if (dict) {
            const sortedKeys = Object.keys(dict).sort((a, b) => b.length - a.length);
            sortedKeys.forEach(key => {
                text = text.replace(new RegExp(key, 'gi'), dict[key]);
            });
        }

        res.json({ translated: text });
    } catch (e) {
        res.status(500).json({ error: e.message });
    } finally {
        await browser.close();
    }
});

app.listen(3000, () => console.log('Server live at http://localhost:3000'));