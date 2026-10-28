// Planeta em SVG. Muda de aparência conforme o estágio (0 = árido ... 4 = vivo),
// que vem de indiceEstagio(dias) em lib/streak.ts.

const PALETA = [
  { base: "#8a6a48", terra: "#a98a62", atmos: "#c9a26b", nuvens: 0 },
  { base: "#6b7a4a", terra: "#8a9a52", atmos: "#a3b86c", nuvens: 0.15 },
  { base: "#1d6f8f", terra: "#4a9a4a", atmos: "#5cc0d8", nuvens: 0.45 },
  { base: "#1b6fa8", terra: "#2f8f46", atmos: "#6ac8f0", nuvens: 0.65 },
  { base: "#1e88c7", terra: "#38b05a", atmos: "#8fe0ff", nuvens: 0.85 },
];

const ARVORES: [number, number][] = [
  [70, 62], [90, 70], [60, 78], [78, 85], [125, 128], [145, 132], [135, 148],
  [155, 140], [58, 134], [62, 144], [100, 60], [118, 138], [148, 122], [50, 76],
];
const QTD_ARVORES = [0, 2, 5, 9, 14];

export function Planet({ estagio, size = 280 }: { estagio: number; size?: number }) {
  const i = Math.min(Math.max(estagio, 0), PALETA.length - 1);
  const p = PALETA[i];

  return (
    <div className="planet-float" style={{ width: size, height: size }}>
      <svg
        viewBox="0 0 200 200"
        width={size}
        height={size}
        role="img"
        aria-label={`Planeta no estágio ${i + 1} de ${PALETA.length}`}
      >
        <defs>
          <clipPath id="planeta-clip">
            <circle cx="100" cy="100" r="90" />
          </clipPath>
          <radialGradient id="planeta-luz" cx="35%" cy="30%" r="80%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.22" />
            <stop offset="55%" stopColor="#000000" stopOpacity="0" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.6" />
          </radialGradient>
          <radialGradient id="planeta-atmos" cx="50%" cy="50%" r="50%">
            <stop offset="86%" stopColor={p.atmos} stopOpacity="0.35" />
            <stop offset="100%" stopColor={p.atmos} stopOpacity="0" />
          </radialGradient>
        </defs>

        <circle cx="100" cy="100" r="99" fill="url(#planeta-atmos)" />
        <circle cx="100" cy="100" r="90" fill={p.base} />

        <g clipPath="url(#planeta-clip)">
          <path d="M40 70 C55 45 90 40 105 58 C118 72 100 90 80 92 C60 94 35 90 40 70Z" fill={p.terra} />
          <path d="M110 120 C130 105 165 112 168 135 C170 158 135 170 118 158 C104 148 98 128 110 120Z" fill={p.terra} />
          <path d="M45 125 C58 115 75 122 72 138 C69 152 48 152 42 140 C38 133 40 128 45 125Z" fill={p.terra} />

          {i === 0 && (
            <g stroke="#5b4430" strokeWidth="1.2" fill="none" opacity="0.7">
              <path d="M60 60 l14 10 l-6 14" />
              <path d="M130 130 l-12 8 l8 12" />
              <path d="M85 110 l10 6 l-4 10" />
            </g>
          )}

          {ARVORES.slice(0, QTD_ARVORES[i]).map(([x, y]) => (
            <g key={`${x}-${y}`}>
              <circle cx={x} cy={y} r="4.2" fill="#14532d" />
              <circle cx={x - 1} cy={y - 1.2} r="2.2" fill="#22c55e" />
            </g>
          ))}

          {p.nuvens > 0 && (
            <g className="cloud-drift" fill="#ffffff" opacity={p.nuvens}>
              <ellipse cx="80" cy="42" rx="22" ry="5" />
              <ellipse cx="150" cy="86" rx="20" ry="4.5" />
              <ellipse cx="60" cy="160" rx="24" ry="5" />
            </g>
          )}

          <circle cx="100" cy="100" r="90" fill="url(#planeta-luz)" />
        </g>
      </svg>
    </div>
  );
}
