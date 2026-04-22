const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const API_URL = process.env.WHATSAPP_API_URL; // https://graph.facebook.com/v22.0
const PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

function httpPost(url, data, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(data);
    const parsed = new URL(url);
    const options = {
      hostname: parsed.hostname,
      port: parsed.port || 443,
      path: parsed.pathname + parsed.search,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
      timeout: timeoutMs,
    };

    const req = https.request(options, (res) => {
      let chunks = '';
      res.on('data', d => chunks += d);
      res.on('end', () => {
        try { resolve(JSON.parse(chunks)); }
        catch (e) { resolve(chunks); }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timeout')); });
    req.write(body);
    req.end();
  });
}

function httpGet(url, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const mod = parsed.protocol === 'https:' ? https : http;
    const options = {
      hostname: parsed.hostname,
      port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method: 'GET',
      headers: { 'Authorization': `Bearer ${TOKEN}` },
      timeout: timeoutMs,
    };

    const req = mod.request(options, (res) => {
      let chunks = '';
      res.on('data', d => chunks += d);
      res.on('end', () => {
        try { resolve(JSON.parse(chunks)); }
        catch (e) { resolve(null); }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timeout')); });
    req.end();
  });
}

function downloadMedia(mediaId) {
  // Keep sync curl for media download (called rarely, not in card loop)
  const { execSync } = require('child_process');
  try {
    const infoCmd = `curl -s --connect-timeout 5 --max-time 15 "${API_URL}/${mediaId}" -H "Authorization: Bearer ${TOKEN}" 2>/dev/null`;
    const infoResult = execSync(infoCmd, { encoding: 'utf-8', timeout: 20000, stdio: ['pipe', 'pipe', 'pipe'] });
    const mediaInfo = JSON.parse(infoResult);
    if (!mediaInfo || !mediaInfo.url) { console.log(' Media info failed for', mediaId); return null; }

    const mimeType = mediaInfo.mime_type || 'image/jpeg';
    const ext = mimeType.includes('video') ? '.mp4' : mimeType.includes('png') ? '.png' : '.jpg';
    const filename = `${mediaId}${ext}`;
    const uploadDir = '/root/socasatop/uploads';
    const filePath = path.join(uploadDir, filename);
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    const dlCmd = `curl -s -L --connect-timeout 5 --max-time 60 -o "${filePath}" -H "Authorization: Bearer ${TOKEN}" "${mediaInfo.url}" 2>/dev/null`;
    execSync(dlCmd, { timeout: 65000, stdio: ['pipe', 'pipe', 'pipe'] });

    if (fs.existsSync(filePath)) {
      const size = fs.statSync(filePath).size;
      if (size > 100) {
        console.log(` Media downloaded: ${filename} (${size} bytes)`);
        return { filename, filePath, mimeType };
      }
    }
  } catch (e) { /* download failed */ }
  console.log(' Media download failed for', mediaId);
  return null;
}

async function sendText(to, text) {
  return httpPost(`${API_URL}/${PHONE_ID}/messages`, {
    messaging_product: 'whatsapp',
    to,
    type: 'text',
    text: { body: text },
  });
}

async function sendImage(to, imageUrl, caption) {
  return httpPost(`${API_URL}/${PHONE_ID}/messages`, {
    messaging_product: 'whatsapp',
    to,
    type: 'image',
    image: { link: imageUrl, caption },
  });
}

async function sendVideo(to, videoUrl, caption) {
  return httpPost(`${API_URL}/${PHONE_ID}/messages`, {
    messaging_product: 'whatsapp',
    to,
    type: 'video',
    video: { link: videoUrl, caption },
  }, 60000);
}

async function markRead(messageId) {
  try {
    await httpPost(`${API_URL}/${PHONE_ID}/messages`, {
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: messageId,
    });
  } catch (e) { /* non-critical */ }
}

module.exports = { sendText, sendImage, sendVideo, markRead, downloadMedia };
