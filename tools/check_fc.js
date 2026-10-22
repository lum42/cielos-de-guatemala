// usage: node check_fc.js <dir with forecast json files>
const fs = require("fs"), path = require("path");
const dir = process.argv[2];
for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".json")).sort()) {
  const raw = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
  const d = raw.data || raw.fields || raw;
  const hrs = d.hours || [];
  let gaps = 0;
  for (let i = 1; i < hrs.length; i++) {
    const a = new Date(hrs[i - 1].t + ":00Z").getTime(), b = new Date(hrs[i].t + ":00Z").getTime();
    if (b - a !== 3600000) gaps++;
  }
  const night = hrs.filter((h) => /T(19|20|21|22|23|00|01|02|03|04):00$/.test(h.t)).slice(0, 10);
  const avg = night.length ? Math.round(night.reduce((s, h) => s + (h.c || 0), 0) / night.length) : null;
  const badNum = hrs.filter((h) => typeof h.c !== "number").length;
  console.log(`${f.padEnd(16)} rows=${hrs.length} gaps=${gaps} nonNumC=${badNum} ${hrs[0]?.t}→${hrs[hrs.length - 1]?.t} firstNightAvgCloud=${avg} fetched=${d.fetchedAt} wind=${d.windUnit} vis=${d.visUnit} keys=${Object.keys(d).length}`);
}
