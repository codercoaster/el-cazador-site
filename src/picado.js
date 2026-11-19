// Papel picado banner — a string of cut-paper flags, each with a punched pattern.
const COLORS = ['oklch(80% 0.155 72)', 'oklch(62% 0.21 358)', 'oklch(43% 0.085 158)', 'oklch(60% 0.07 200)', 'oklch(96% 0.02 82)'];

// flag 60×54 with scalloped bottom; holes cut with evenodd
const outline = 'M0 0H60V44 L55 50 L50 44 L45 50 L40 44 L35 50 L30 44 L25 50 L20 44 L15 50 L10 44 L5 50 L0 44Z';
const patterns = [
  // diamond + dots
  'M30 10 L39 22 L30 34 L21 22Z M12 14a3 3 0 1 0 0.01 0Z M48 14a3 3 0 1 0 0.01 0Z M12 32a3 3 0 1 0 0.01 0Z M48 32a3 3 0 1 0 0.01 0Z',
  // flower
  'M30 12a4 4 0 1 0 0.01 0Z M30 28a4 4 0 1 0 0.01 0Z M22 20a4 4 0 1 0 0.01 0Z M38 20a4 4 0 1 0 0.01 0Z M8 8h6v6h-6Z M46 8h6v6h-6Z M8 32h6v6h-6Z M46 32h6v6h-6Z',
  // heart-ish + triangles
  'M30 34 L20 22 a5 5 0 0 1 10 -6 a5 5 0 0 1 10 6Z M6 8 L14 8 L10 14Z M46 8 L54 8 L50 14Z M10 36 L14 30 L6 30Z M50 36 L54 30 L46 30Z',
];

export function renderPicado(host) {
  const count = Math.ceil(window.innerWidth / 64) + 2;
  let html = '';
  for (let i = 0; i < count; i++) {
    const fill = COLORS[i % COLORS.length];
    const holes = patterns[i % patterns.length];
    html += `<svg viewBox="0 0 64 54" aria-hidden="true"><path d="M0 1H64" stroke="oklch(23% 0.035 40 / .45)" stroke-width="1.5"/><path transform="translate(2 1)" fill="${fill}" fill-rule="evenodd" d="${outline} ${holes}"/></svg>`;
  }
  host.innerHTML = html;
}
