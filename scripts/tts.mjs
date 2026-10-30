import fs from 'node:fs';

const key = process.env.GEMINI_API_KEY;
if (!key) {
  console.log('GEMINI_API_KEY is not set - skipping voice generation.');
  process.exit(0);
}
const base = process.env.GEMINI_BASE || 'https://generativelanguage.googleapis.com';
const model = process.env.TTS_MODEL || 'gemini-2.5-flash-preview-tts';
const voice = process.env.TTS_VOICE || 'Kore';
const propsPath = process.argv[2] || 'props.json';

const props = JSON.parse(fs.readFileSync(propsPath, 'utf8'));
fs.mkdirSync('public/audio', {recursive: true});

function wavFromPcm(pcm, rate) {
  const h = Buffer.alloc(44);
  h.write('RIFF', 0);
  h.writeUInt32LE(36 + pcm.length, 4);
  h.write('WAVE', 8);
  h.write('fmt ', 12);
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20);
  h.writeUInt16LE(1, 22);
  h.writeUInt32LE(rate, 24);
  h.writeUInt32LE(rate * 2, 28);
  h.writeUInt16LE(2, 32);
  h.writeUInt16LE(16, 34);
  h.write('data', 36);
  h.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([h, pcm]);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function speak(text) {
  const url = `${base}/v1beta/models/${model}:generateContent`;
  const body = {
    contents: [{parts: [{text}]}],
    generationConfig: {
      responseModalities: ['AUDIO'],
      speechConfig: {voiceConfig: {prebuiltVoiceConfig: {voiceName: voice}}},
    },
  };
  let lastErr;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {'Content-Type': 'application/json', 'x-goog-api-key': key},
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
      }
      const data = await res.json();
      const part = data.candidates[0].content.parts[0].inlineData;
      const m = /rate=(\d+)/.exec(part.mimeType || '');
      return {pcm: Buffer.from(part.data, 'base64'), rate: m ? Number(m[1]) : 24000};
    } catch (err) {
      lastErr = err;
      console.warn(`TTS attempt ${attempt} failed: ${err.message}`);
      await sleep(1500 * attempt);
    }
  }
  throw lastErr;
}

let ok = 0;
for (let i = 0; i < props.scenes.length; i++) {
  const scene = props.scenes[i];
  const text = (scene.narration_my || (scene.caption_lines_my || []).join(' ')).trim();
  if (!text) continue;
  try {
    const {pcm, rate} = await speak(text);
    const file = `audio/scene-${i + 1}.wav`;
    fs.writeFileSync(`public/${file}`, wavFromPcm(pcm, rate));
    const seconds = pcm.length / (rate * 2);
    scene.audio_file = file;
    scene.duration_sec = Math.max(3, Math.round((seconds + 0.6) * 10) / 10);
    ok++;
    console.log(`Scene ${i + 1}: ${seconds.toFixed(1)}s of audio -> duration ${scene.duration_sec}s`);
  } catch (err) {
    console.warn(`Scene ${i + 1}: voice failed, rendering without audio (${err.message})`);
  }
}

fs.writeFileSync(propsPath, JSON.stringify(props, null, 2));
console.log(`Voice generated for ${ok}/${props.scenes.length} scenes.`);
