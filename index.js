const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

/* =========================
   LEAGUE STATS
========================= */
app.get("/league/:tournamentId/:seasonId/players", async (req, res) => {

  const { tournamentId, seasonId } = req.params;

  try {

    const url =
      `https://api.sofascore.com/api/v1/unique-tournament/${tournamentId}/season/${seasonId}/statistics?limit=50&offset=0&accumulation=total&order=-rating`;

    const response = await fetch(url);
    const json = await response.json();

    const players = (json.results || []).map(r => ({
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
   PLAYER DETAILS
========================= */
app.get("/player/:id/details", async (req, res) => {

  const id = req.params.id;

  try {

    const url =
      `https://api.sofascore.com/api/v1/player/${id}`;

    const response = await fetch(url);
    const json = await response.json();

    const p = json.player;

    res.json({
      id: p.id,
      name: p.name,
      shortName: p.shortName,
      nationality: p.country?.name,
      position: p.position,
      height: p.height,
      foot: p.preferredFoot,
      jersey: p.jerseyNumber,
      marketValue: p.proposedMarketValue
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   SYNC ENDPOINT
========================= */
app.get("/sync/league/:tournamentId/:seasonId", async (req, res) => {

  const { tournamentId, seasonId } = req.params;

  try {

    const url =
      `https://api.sofascore.com/api/v1/unique-tournament/${tournamentId}/season/${seasonId}/statistics?limit=50&offset=0&accumulation=total&order=-rating`;

    const response = await fetch(url);
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

    res.json({ anagrafica, statistiche });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   START
========================= */
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
