import { execFile } from "node:child_process";
import {
  appendFile,
  mkdir,
  mkdtemp,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { chromium } from "@playwright/test";

const execFileAsync = promisify(execFile);
const width = 1200;
const height = 675;
const framesPerSecond = 30;
const duration = 6;
const frameCount = framesPerSecond * duration;
const publicDirectory = join(process.cwd(), "public");

function clamp(value) {
  return Math.min(Math.max(value, 0), 1);
}

function ease(value) {
  return 1 - (1 - clamp(value)) ** 3;
}

function between(time, start, end) {
  return ease((time - start) / (end - start));
}

function fadeOut(time, start, end) {
  return 1 - between(time, start, end);
}

function format(value) {
  return Number(value.toFixed(2));
}

function sceneAt(time) {
  const importIn = between(time, 0.1, 0.65);
  const importOut = fadeOut(time, 1.7, 2.05);
  const importOpacity = importIn * importOut;
  const scan = between(time, 0.65, 1.45) * importOpacity;
  const reviewIn = between(time, 2.05, 2.4);
  const reviewOut = fadeOut(time, 3.65, 4.05);
  const reviewOpacity = reviewIn * reviewOut;
  const nodeMove = between(time, 2.65, 3.3);
  const exportIn = between(time, 4.05, 4.45);
  const downloadIn = between(time, 4.75, 5.2);
  const stage =
    time < 2 ? "01 / IMPORTAR" : time < 4 ? "02 / REVISAR" : "03 / EXPORTAR";
  const footer =
    time < 2
      ? "La copia entra desde tu equipo."
      : time < 4
        ? "El cambio conserva su grupo de origen."
        : "Descargas un archivo distinto para revisarlo.";
  const fileY = format(255 - 22 * importIn);
  const nodeX = format(285 + 410 * nodeMove);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="1200" height="675" fill="#e8e5dd"/>
  <g font-family="Arial, sans-serif" fill="#17211e">
    <text x="72" y="62" font-family="monospace" font-size="18" font-weight="700" letter-spacing="3">HIERA.</text>
    <text x="1128" y="62" font-family="monospace" font-size="14" text-anchor="end" fill="#4b5b18" letter-spacing="2">DEMOSTRACION LOCAL</text>
    <path d="M72 88 H1128" stroke="#17211e" stroke-width="2"/>
    <rect x="72" y="126" width="1056" height="418" rx="8" fill="#dde4c7" stroke="#84906a"/>
    <text x="104" y="166" font-family="monospace" font-size="16" font-weight="700" fill="#526048" letter-spacing="2">${stage}</text>
    <text x="1096" y="166" font-family="monospace" font-size="14" text-anchor="end" fill="#526048">BACKUP / LOCAL</text>
    <path d="M104 188 H1096" stroke="#84906a"/>
    <g opacity="${format(importOpacity)}">
      <rect x="210" y="${fileY}" width="780" height="132" rx="6" fill="#eff0e9" stroke="#526048" stroke-width="2"/>
      <rect x="242" y="${fileY + 34}" width="30" height="38" fill="#b8d44b" stroke="#17211e"/>
      <text x="298" y="${fileY + 60}" font-family="monospace" font-size="30" font-weight="700">hiera-backup.json</text>
      <text x="298" y="${fileY + 91}" font-family="monospace" font-size="16" fill="#526048">2.4 MB / GRUPOS Y USUARIOS ENCONTRADOS</text>
      <rect x="242" y="${fileY + 107}" width="716" height="5" fill="#c8ccc0"/>
      <rect x="242" y="${fileY + 107}" width="${format(716 * scan)}" height="5" fill="#718a11"/>
    </g>
    <g opacity="${format(reviewOpacity)}">
      <rect x="180" y="252" width="245" height="84" rx="6" fill="#eff0e9" stroke="#526048" stroke-width="2"/>
      <text x="302" y="302" text-anchor="middle" font-family="monospace" font-size="26" font-weight="700">builder</text>
      <path d="M425 294 H775" stroke="#718a11" stroke-width="3" stroke-dasharray="7 8"/>
      <rect x="775" y="252" width="245" height="84" rx="6" fill="#d9e99e" stroke="#718a11" stroke-width="2"/>
      <text x="897" y="302" text-anchor="middle" font-family="monospace" font-size="26" font-weight="700">moderator</text>
      <rect x="${nodeX}" y="394" width="255" height="52" rx="4" fill="#eff0e9" stroke="#17211e" stroke-width="2"/>
      <text x="${nodeX + 127.5}" y="427" text-anchor="middle" font-family="monospace" font-size="18">essentials.fly</text>
    </g>
    <g opacity="${format(exportIn)}">
      <rect x="310" y="228" width="580" height="246" rx="6" fill="#eff0e9" stroke="#526048" stroke-width="2"/>
      <text x="352" y="280" font-family="monospace" font-size="25" fill="#3d4e20">{</text>
      <text x="384" y="327" font-family="monospace" font-size="25" fill="#3d4e20">&quot;groups&quot;: 4,</text>
      <text x="384" y="365" font-family="monospace" font-size="25" fill="#3d4e20">&quot;changes&quot;: 1,</text>
      <text x="384" y="403" font-family="monospace" font-size="25" fill="#3d4e20">&quot;valid&quot;: true</text>
      <text x="352" y="447" font-family="monospace" font-size="25" fill="#3d4e20">}</text>
      <g opacity="${format(downloadIn)}">
        <rect x="764" y="386" width="80" height="58" rx="4" fill="#b8d44b" stroke="#17211e" stroke-width="2"/>
        <text x="804" y="425" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" font-weight="700">↓</text>
      </g>
    </g>
    <path d="M104 484 H1096" stroke="#84906a"/>
    <text x="104" y="516" font-size="18" fill="#526048">${footer}</text>
  </g>
</svg>`;
}

async function canRun(command) {
  try {
    await execFileAsync(command, ["-version"]);
    return true;
  } catch {
    return false;
  }
}

async function findFfmpeg() {
  const candidates = [process.env.FFMPEG, "ffmpeg"].filter(Boolean);
  const playwrightDirectory = join(
    process.env.LOCALAPPDATA ?? "",
    "ms-playwright",
  );

  try {
    const entries = await readdir(playwrightDirectory, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory() && entry.name.startsWith("ffmpeg-")) {
        candidates.push(
          join(
            playwrightDirectory,
            entry.name,
            process.platform === "win32" ? "ffmpeg-win64.exe" : "ffmpeg-linux",
          ),
        );
      }
    }
  } catch {
    // ffmpeg may be provided by PATH or the FFMPEG environment variable instead.
  }

  for (const candidate of candidates) {
    if (candidate && (await canRun(candidate))) return candidate;
  }

  throw new Error(
    "ffmpeg is required. Install it on PATH or set FFMPEG to its executable path.",
  );
}

async function renderVideo(ffmpeg, input, output) {
  await execFileAsync(
    ffmpeg,
    [
      "-y",
      "-f",
      "image2pipe",
      "-framerate",
      String(framesPerSecond),
      "-vcodec",
      "mjpeg",
      "-i",
      input,
      "-c:v",
      "libvpx",
      "-b:v",
      "1M",
      output,
    ],
    { maxBuffer: 10 * 1024 * 1024 },
  );
}

async function main() {
  const ffmpeg = await findFfmpeg();
  const workDirectory = await mkdtemp(join(tmpdir(), "hiera-landing-demo-"));
  const mjpegFrames = join(workDirectory, "frames.mjpeg");
  const browser = await chromium.launch();

  try {
    await mkdir(publicDirectory, { recursive: true });
    const page = await browser.newPage({ viewport: { width, height } });
    await writeFile(mjpegFrames, "");

    for (let index = 0; index < frameCount; index += 1) {
      const svg = sceneAt(index / framesPerSecond).replace(
        /^<\?xml[^>]*>\s*/,
        "",
      );
      await page.setContent(
        `<style>html,body{margin:0;overflow:hidden}</style>${svg}`,
      );
      await appendFile(
        mjpegFrames,
        await page.screenshot({ type: "jpeg", quality: 90 }),
      );
    }

    await writeFile(
      join(publicDirectory, "hiera-local-workflow-poster.svg"),
      sceneAt(5.4),
    );
    await renderVideo(
      ffmpeg,
      mjpegFrames,
      join(publicDirectory, "hiera-local-workflow.webm"),
    );
  } finally {
    await browser.close();
    await rm(workDirectory, { recursive: true, force: true });
  }
}

await main();
