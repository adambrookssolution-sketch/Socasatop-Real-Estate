const { execSync } = require('child_process');
const fs = require('fs');

const API_URL = 'https://graph.facebook.com/v22.0';

const FB_IPS = [
  '31.13.85.8', '31.13.85.36', '157.240.1.35', '157.240.22.35',
  '157.240.25.1', '157.240.25.35', '157.240.1.1', '157.240.22.1',
  '157.240.11.35', '157.240.12.35', '157.240.3.35',
];

function graphPost(endpoint, data, token) {
  const tmpFile = '/tmp/ig_payload.json';
  fs.writeFileSync(tmpFile, JSON.stringify(data));

  for (const ip of FB_IPS) {
    const cmd = `curl -4 -s --connect-timeout 3 --max-time 15 --connect-to graph.facebook.com:443:${ip}:443 -X POST "${API_URL}${endpoint}" -H "Authorization: Bearer ${token}" -H "Content-Type: application/json" -d @${tmpFile} 2>/dev/null`;
    let result;
    try {
      result = execSync(cmd, { encoding: 'utf-8', timeout: 20000, stdio: ['pipe', 'pipe', 'pipe'] });
    } catch (e) {
      result = e.stdout || '';
    }
    if (result && result.trim()) {
      try { return JSON.parse(result); } catch (e) { /* try next */ }
    }
  }
  throw new Error('Instagram API request failed - all IPs exhausted');
}

function graphGet(endpoint, token) {
  for (const ip of FB_IPS) {
    const cmd = `curl -4 -s --connect-timeout 3 --max-time 10 --connect-to graph.facebook.com:443:${ip}:443 "${API_URL}${endpoint}&access_token=${token}" 2>/dev/null`;
    let result;
    try {
      result = execSync(cmd, { encoding: 'utf-8', timeout: 15000, stdio: ['pipe', 'pipe', 'pipe'] });
    } catch (e) {
      result = e.stdout || '';
    }
    if (result && result.trim()) {
      try { return JSON.parse(result); } catch (e) { /* try next */ }
    }
  }
  throw new Error('Instagram API GET request failed');
}

// Reply to a comment on an Instagram post
function replyToComment(commentId, message, token) {
  return graphPost(`/${commentId}/replies`, { message }, token);
}

// Send a DM to an Instagram user (must have messaged us first within 24h)
function sendDM(recipientId, message, token) {
  return graphPost('/me/messages', {
    recipient: { id: recipientId },
    message: { text: message },
  }, token);
}

// Send a DM with an image
function sendDMImage(recipientId, imageUrl, token) {
  return graphPost('/me/messages', {
    recipient: { id: recipientId },
    message: {
      attachment: {
        type: 'image',
        payload: { url: imageUrl },
      },
    },
  }, token);
}

// Send a DM with quick reply buttons
function sendDMQuickReplies(recipientId, text, quickReplies, token) {
  return graphPost('/me/messages', {
    recipient: { id: recipientId },
    message: {
      text,
      quick_replies: quickReplies.map(qr => ({
        content_type: 'text',
        title: qr,
        payload: qr,
      })),
    },
  }, token);
}

// Get comments on a media post
function getComments(mediaId, token) {
  return graphGet(`/${mediaId}/comments?fields=id,text,from,timestamp`, token);
}

// Get Instagram Business Account ID from Page ID
function getIGAccountId(pageId, token) {
  return graphGet(`/${pageId}?fields=instagram_business_account`, token);
}

module.exports = {
  replyToComment,
  sendDM,
  sendDMImage,
  sendDMQuickReplies,
  getComments,
  getIGAccountId,
  graphPost,
  graphGet,
};
