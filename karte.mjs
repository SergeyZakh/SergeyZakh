// Erzeugt die Profilkarte im Neofetch-Stil als SVG, hell und dunkel.
// Aufruf: node karte.mjs  →  light_mode.svg, dark_mode.svg im selben Ordner
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ordner = dirname(fileURLToPath(import.meta.url));

// Zahlen, die später eine Action täglich einsetzt
const zahlen = { repos: 1, sterne: 1, follower: 1, beitraege: 312 };

const BREITE = 66;          // Zeichen pro Zeile rechts
const ZEICHEN = 8.8;        // Breite eines Zeichens bei 16px Consolas
const ZEILE = 20;           // Zeilenabstand
const TEXT_X = 230;
const TEXT_Y = 40;

// Zeilen: [schluessel, wert] oder {titel} oder null (Leerzeile)
const zeilen = [
  { kopf: 'sz@github' },
  ['OS', 'Windows 11, Linux in Docker'],
  ['Uptime', '26 years'],
  ['Kernel', 'Fachinformatiker Systemintegration'],
  ['Shell', 'leidenschaftliche Neugier'],
  ['IDE', 'VS Code, IntelliJ, Claude Code'],
  null,
  ['Languages.Programming', 'TS, JS, PHP, Python, C, Java, ASM'],
  ['Languages.Scripting', 'Bash, PowerShell'],
  ['Languages.Computer', 'HTML, CSS, SQL, YAML, HCL, LaTeX'],
  ['Languages.Real', 'Deutsch, Russisch, Englisch'],
  null,
  ['Infra', 'Docker, Kubernetes, Terraform, Azure'],
  ['Projects', 'Ausbildungs-Berichtsheft, Fundus (bald)'],
  null,
  { titel: 'Contact' },
  ['GitHub', 'SergeyZakh'],
  ['LinkedIn', 'sergey-zakharov-jr'],
  null,
  { titel: 'GitHub Stats' },
  { stats: [['Repos', zahlen.repos], ['Stars', zahlen.sterne], ['Followers', zahlen.follower]] },
  { stats: [['Contributions (last year)', zahlen.beitraege]] },
];

// Pixelbild: S über Z, je 7 × 9
const S = ['.######', '#######', '##.....', '##.....', '######.', '.######', '.....##', '#######', '######.'];
const Z = ['#######', '#######', '....##.', '...##..', '..##...', '.##....', '##.....', '#######', '#######'];
const bild = [...S, '.......', '.......', ...Z];
const PIXEL = 20, ABSTAND = 2, BILD_X = 38, BILD_Y = 30;

const farben = {
  dark:  { grund: '#161b22', text: '#c9d1d9', key: '#ffa657', value: '#a5d6ff', punkte: '#616e7f', oben: '#ffa657', unten: '#f778ba', schatten: '#30363d' },
  light: { grund: '#f6f8fa', text: '#24292f', key: '#953800', value: '#0a3069', punkte: '#c2cfde', oben: '#bc4c00', unten: '#bf3989', schatten: '#d0d7de' },
};

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function textzeile(y, teile, zeichen) {
  // textLength hält die Breite fest, auch wenn der Betrachter eine andere Schrift als Consolas hat
  const spans = teile.map(([klasse, inhalt]) => `<tspan class="${klasse}">${esc(inhalt)}</tspan>`).join('');
  return `<text x="${TEXT_X}" y="${y}" textLength="${(zeichen * ZEICHEN).toFixed(1)}" lengthAdjust="spacingAndGlyphs">${spans}</text>`;
}

function rechteSeite() {
  const out = [];
  let y = TEXT_Y;
  for (const z of zeilen) {
    if (z === null) { y += ZEILE; continue; }
    if (z.kopf) {
      const strich = ' ' + '─'.repeat(BREITE - z.kopf.length - 1);
      out.push(textzeile(y, [['key', z.kopf], ['punkte', strich]], BREITE));
    } else if (z.titel) {
      const anfang = '- ' + z.titel + ' ';
      out.push(textzeile(y, [['text', anfang], ['punkte', '─'.repeat(BREITE - anfang.length)]], BREITE));
    } else if (z.stats) {
      // Mehrere Werte in einer Zeile, getrennt mit |
      const teile = [];
      let laenge = 0;
      z.stats.forEach(([k, v], i) => {
        if (i > 0) { teile.push(['text', ' | ']); laenge += 3; }
        const wert = Number(v).toLocaleString('en-US');
        teile.push(['key', `${k}: `], ['value', wert]);
        laenge += k.length + 2 + wert.length;
      });
      out.push(textzeile(y, [['punkte', '. '], ...teile], laenge + 2));
    } else {
      const [k, v] = z;
      const links = k ? `${k}: ` : '';
      // ". " + Schlüssel + Punkte + " " + Wert ergibt genau BREITE Zeichen
      const punkte = '.'.repeat(Math.max(3, BREITE - 3 - links.length - v.length));
      out.push(textzeile(y, [['punkte', k ? '. ' : '  '], ['key', links], ['punkte', k ? punkte : ' '.repeat(punkte.length)], ['value', ' ' + v]], BREITE));
    }
    y += ZEILE;
  }
  return { svg: out.join('\n  '), unten: y };
}

function pixelbild() {
  const schatten = [], koerper = [];
  bild.forEach((reihe, r) => [...reihe].forEach((p, s) => {
    if (p !== '#') return;
    const x = BILD_X + s * (PIXEL + ABSTAND), y = BILD_Y + r * (PIXEL + ABSTAND);
    schatten.push(`<rect x="${x + 4}" y="${y + 4}" width="${PIXEL}" height="${PIXEL}"/>`);
    koerper.push(`<rect x="${x}" y="${y}" width="${PIXEL}" height="${PIXEL}"/>`);
  }));
  const hoehe = bild.length * (PIXEL + ABSTAND);
  return { schatten, koerper, hoehe };
}

function karte(modus) {
  const f = farben[modus];
  const rechts = rechteSeite();
  const p = pixelbild();
  const hoehe = Math.max(rechts.unten, BILD_Y + p.hoehe) + 20;
  const breite = TEXT_X + BREITE * ZEICHEN + 30;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${breite.toFixed(0)}" height="${hoehe}" viewBox="0 0 ${breite.toFixed(0)} ${hoehe}" font-family="Consolas, Menlo, 'DejaVu Sans Mono', 'Courier New', monospace" font-size="16px">
<title>sz@github</title>
<style>
  text { white-space: pre; fill: ${f.text}; }
  .key { fill: ${f.key}; }
  .value { fill: ${f.value}; }
  .punkte { fill: ${f.punkte}; }
</style>
<defs>
  <linearGradient id="verlauf" gradientUnits="userSpaceOnUse" x1="0" y1="${BILD_Y}" x2="0" y2="${BILD_Y + p.hoehe}">
    <stop offset="0" stop-color="${f.oben}"/>
    <stop offset="1" stop-color="${f.unten}"/>
  </linearGradient>
</defs>
<rect width="100%" height="100%" rx="15" fill="${f.grund}"/>
<g fill="${f.schatten}">
  ${p.schatten.join('\n  ')}
</g>
<g fill="url(#verlauf)">
  ${p.koerper.join('\n  ')}
</g>
  ${rechts.svg}
</svg>
`;
}

for (const modus of ['dark', 'light']) {
  writeFileSync(join(ordner, `${modus}_mode.svg`), karte(modus));
}
console.log('geschrieben: dark_mode.svg, light_mode.svg');
