import sharp from 'sharp';

export interface TextCardOptions {
  text: string;
  style: 'quote' | 'title' | 'bullet_points' | 'statistic';
  width: number;
  height: number;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  accentColor?: string;
}

/**
 * Generate a text card image using Sharp
 */
export async function generateTextCard(options: TextCardOptions): Promise<Buffer> {
  const { width, height, backgroundColor } = options;

  // Create SVG text card
  const svg = buildTextCardSvg(options);

  // Parse background color to RGBA
  const bgColor = parseColor(backgroundColor);

  // Render with Sharp
  const image = await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: bgColor,
    },
  })
    .composite([{
      input: Buffer.from(svg),
      top: 0,
      left: 0,
    }])
    .png()
    .toBuffer();

  return image;
}

function buildTextCardSvg(options: TextCardOptions): string {
  const { text, style, width, height, textColor, fontFamily, accentColor } = options;

  // Calculate font size based on text length
  const maxChars = 100;
  const baseFontSize = 64;
  const fontSize = Math.max(32, baseFontSize * Math.min(1, maxChars / Math.max(1, text.length)));

  let svgContent = '';

  switch (style) {
    case 'quote':
      svgContent = `
        <text x="50%" y="45%" text-anchor="middle" font-size="${fontSize}" fill="${textColor}" font-family="${fontFamily}">
          ${wrapText(text, 30, fontSize)}
        </text>
        <text x="50%" y="85%" text-anchor="middle" font-size="${fontSize * 0.5}" fill="${accentColor ?? textColor}" font-family="${fontFamily}">
          <tspan>—</tspan>
        </text>
      `;
      break;

    case 'title':
      svgContent = `
        <text x="50%" y="50%" text-anchor="middle" font-size="${fontSize * 1.2}" font-weight="bold" fill="${textColor}" font-family="${fontFamily}">
          ${wrapText(text, 25, fontSize * 1.2)}
        </text>
      `;
      break;

    case 'statistic': {
      const parts = text.split(':');
      const number = parts[0]?.trim() ?? text;
      const label = parts[1]?.trim() ?? '';
      svgContent = `
        <text x="50%" y="40%" text-anchor="middle" font-size="${fontSize * 2}" font-weight="bold" fill="${accentColor ?? textColor}" font-family="${fontFamily}">
          <tspan>${escapeXml(number)}</tspan>
        </text>
        <text x="50%" y="60%" text-anchor="middle" font-size="${fontSize * 0.6}" fill="${textColor}" font-family="${fontFamily}">
          <tspan>${escapeXml(label)}</tspan>
        </text>
      `;
      break;
    }

    case 'bullet_points': {
      const points = text.split('\n').filter(Boolean);
      const lineHeight = fontSize * 1.5;
      const startY = (height - (points.length * lineHeight)) / 2;
      svgContent = points.map((point, i) => `
        <text x="15%" y="${startY + (i * lineHeight)}" font-size="${fontSize * 0.6}" fill="${textColor}" font-family="${fontFamily}">
          <tspan>• ${escapeXml(point)}</tspan>
        </text>
      `).join('');
      break;
    }
  }

  return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      ${svgContent}
    </svg>
  `;
}

function wrapText(text: string, maxCharsPerLine: number, fontSize: number): string {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + ' ' + word).length > maxCharsPerLine) {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = currentLine ? `${currentLine} ${word}` : word;
    }
  }
  if (currentLine) lines.push(currentLine);

  // Calculate line height based on font size
  const lineHeight = fontSize * 1.3;

  return lines.map((line, i) =>
    `<tspan x="50%" dy="${i === 0 ? 0 : lineHeight}">${escapeXml(line)}</tspan>`
  ).join('');
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function parseColor(hex: string): { r: number; g: number; b: number; alpha: number } {
  // Remove # if present
  const cleanHex = hex.replace('#', '');

  // Parse RGB
  const r = parseInt(cleanHex.slice(0, 2), 16);
  const g = parseInt(cleanHex.slice(2, 4), 16);
  const b = parseInt(cleanHex.slice(4, 6), 16);

  return { r, g, b, alpha: 1 };
}
