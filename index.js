const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

/* =========================
   CACHE IN MEMORIA
========================= */
const playerCache = new Map();

function getCachedPlayer(id) {
  const c = playerCache.get(id);
  if (!c) return null;
  if (Date.now() - c.time > 60 * 60 * 1000) return null; // 1h TTL
  return c.data;
}

function setCachedPlayer(id, data) {
  playerCache.set(id, {
    data,
    time: Date.now()
  });
}

/* =========================
   FETCH HELPER
========================= */
async function fetchJSON(url) {

  try {

    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
        "Accept": "application/json",
        "Referer": "https://www.sofascore.com/",
        "Origin": "https://www.sofascore.com"
      }
    });

    const text = await res.text();

    console.log("STATUS:", res.status);
    console.log("URL:", url);
    console.log("BODY PREVIEW:", text.slice(0, 200));

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${text}`);
    }

    return JSON.parse(text);

  } catch (err) {
    console.error("FETCH FAILED:", err.message);
    throw err;
  }
}

/* =========================
   PLAYER FULL ENRICHMENT
========================= */
async function getFullPlayer(id, tournamentId, seasonId) {

  const cached = getCachedPlayer(id);
  if (cached) return cached;

  const [info, stats, attr] = await Promise.all([
    fetchJSON(`https://www.sofascore.com/api/v1/player/${id}`),
    fetchJSON(`https://www.sofascore.com/api/v1/player/${id}/statistics/season/${seasonId}/unique-tournament/${tournamentId}`),
    fetchJSON(`https://www.sofascore.com/api/v1/player/${id}/characteristics`)
  ]);

  const p = info.player;

  const result = {
    id,
    anagrafica: {
      name: p.name,
      shortName: p.shortName,
      nationality: p.country?.name || "",
      position: p.position || "",
      height: p.height || "",
      foot: p.preferredFoot || "",
      jersey: p.jerseyNumber || "",
      marketValue: p.proposedMarketValue || ""
    },
    attributi: attr || {},
    statistiche: stats || {}
  };

  setCachedPlayer(id, result);

  return result;
}

/* =========================
   1. LEAGUE (LISTA BASE)
========================= */
app.get("/league/:tournamentId/:seasonId", async (req, res) => {

  const { tournamentId, seasonId } = req.params;

  try {

    const url =
      `https://www.sofascore.com/api/v1/unique-tournament/${tournamentId}/season/${seasonId}/statistics?limit=100&offset=0&accumulation=total&order=-rating`;

    const data = await fetchJSON(url);

    const players = (data.results || []).map(r => ({
      id: r.player.id,
      name: r.player.name,
      rating: r.rating,
      stats: r.statistics
    }));

    res.json(players);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   2. SYNC COMPLETO (PER SHEETS)
========================= */
app.get("/sync/league/:tournamentId/:seasonId", async (req, res) => {

  const { tournamentId, seasonId } = req.params;

  try {

    const url =
      `https://www.sofascore.com/api/v1/unique-tournament/${tournamentId}/season/${seasonId}/statistics?limit=50&offset=0&accumulation=total&order=-rating`;

    const data = await fetchJSON(url);

    const players = data.results || [];

    const enriched = await Promise.all(
      players.map(p =>
        getFullPlayer(p.player.id, tournamentId, seasonId)
      )
    );

    res.json(enriched);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   3. SINGLE PLAYER (DEBUG)
========================= */
app.get("/player/:id/full", async (req, res) => {

  const { id } = req.params;
  const { tournamentId = 23, seasonId = 76457 } = req.query;

  try {
    const player = await getFullPlayer(id, tournamentId, seasonId);
    res.json(player);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   START SERVER
========================= */
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
