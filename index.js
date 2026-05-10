const express = require("express");
const { chromium } = require("playwright");

const app = express();
const PORT = process.env.PORT || 3000;

/* =========================
   CACHE SEMPLICE IN MEMORIA
========================= */
const cache = {};
const CACHE_TTL = 60 * 1000; // 60 sec

function getCache(key) {
  const c = cache[key];
  if (!c) return null;
  if (Date.now() - c.time > CACHE_TTL) return null;
  return c.data;
}

function setCache(key, data) {
  cache[key] = { data, time: Date.now() };
}

/* =========================
   BROWSER SINGLETON
========================= */
let browserInstance = null;

async function getBrowser() {
  if (!browserInstance) {
    browserInstance = await chromium.launch({
      headless: true
    });
  }
  return browserInstance;
}

/* =========================
   1. LEAGUE PLAYERS (STATISTICHE)
========================= */
app.get("/league/:tournamentId/:seasonId/players", async (req, res) => {

  const { tournamentId, seasonId } = req.params;
  const cacheKey = `league-${tournamentId}-${seasonId}`;

  const cached = getCache(cacheKey);
  if (cached) return res.json(cached);

  let browser;

  try {
    browser = await getBrowser();
    const page = await browser.newPage();

    console.log("Fetching league data...");

    const responsePromise = page.waitForResponse(r =>
      r.url().includes(`/unique-tournament/${tournamentId}/season/${seasonId}/statistics`)
    );

    await page.goto("https://www.sofascore.com", {
      waitUntil: "domcontentloaded"
    });

    const response = await responsePromise;
    const json = await response.json();

    const results = json.results || [];

    const players = results.map(r => ({
      id: r.player.id,
      name: r.player.name,
      rating: r.rating,
      stats: r.statistics
    }));

    setCache(cacheKey, players);

    await page.close();

    res.json(players);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   2. PLAYER DETAILS (ANAGRAFICA)
========================= */
app.get("/player/:id/details", async (req, res) => {

  const playerId = req.params.id;
  const cacheKey = `player-${playerId}`;

  const cached = getCache(cacheKey);
  if (cached) return res.json(cached);

  let browser;

  try {
    browser = await getBrowser();
    const page = await browser.newPage();

    console.log("Fetching player details...");

    const responsePromise = page.waitForResponse(r =>
      r.url().includes(`/player/${playerId}`)
    );

    await page.goto(`https://www.sofascore.com/player/${playerId}`, {
      waitUntil: "domcontentloaded"
    });

    const response = await responsePromise;
    const json = await response.json();

    const p = json.player;

    const data = {
      id: p.id,
      fullName: p.name,
      nickname: p.shortName,
      dob: p.dateOfBirthTimestamp,
      nationality: p.country?.name,
      height: p.height,
      foot: p.preferredFoot,
      position: p.position,
      jersey: p.jerseyNumber,
      marketValue: p.proposedMarketValue
    };

    setCache(cacheKey, data);

    await page.close();

    res.json(data);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   3. FANTACALCIO STATS
========================= */
app.get("/fantacalcio/stats/:stagioneId", async (req, res) => {

  const { stagioneId } = req.params;

  const url =
    `https://www.fantacalcio.it/api/v1/Excel/stats/${stagioneId}/1`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    res.json(data);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   4. SYNC ENDPOINT (PER APPS SCRIPT)
========================= */
app.get("/sync/league/:tournamentId/:seasonId", async (req, res) => {

  const { tournamentId, seasonId } = req.params;

  let browser;

  try {
    browser = await getBrowser();
    const page = await browser.newPage();

    console.log("SYNC START");

    const responsePromise = page.waitForResponse(r =>
      r.url().includes(`/unique-tournament/${tournamentId}/season/${seasonId}/statistics`)
    );

    await page.goto("https://www.sofascore.com", {
      waitUntil: "domcontentloaded"
    });

    const response = await responsePromise;
    const json = await response.json();

    const results = json.results || [];

    const anagrafica = results.map(r => ({
      id: r.player.id,
      name: r.player.name,
      position: r.player.position || "",
      nationality: r.player.country?.name || "",
      height: r.player.height || "",
      foot: r.player.preferredFoot || "",
      jersey: r.player.jerseyNumber || "",
      marketValue: r.player.proposedMarketValue || "",
      rating: r.rating
    }));

    const statistiche = results.map(r => ({
      id: r.player.id,
      name: r.player.name,
      rating: r.rating,
      stats: r.statistics
    }));

    console.log("SYNC COMPLETE");

    res.json({
      anagrafica,
      statistiche
    });

    await page.close();

  } catch (err) {
    console.error("SYNC ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   START SERVER
========================= */
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});