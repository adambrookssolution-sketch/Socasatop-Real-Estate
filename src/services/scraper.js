const axios = require('axios');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const aiService = require('./ai');
let browserScraper = null;
try { browserScraper = require('./browser_scraper'); } catch (e) { /* optional */ }

const UPLOAD_DIR = process.env.IMPORT_UPLOAD_DIR || '/root/socasatop/wp-images/wp-content/uploads/imported';

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function needsBrowser(html) {
  if (!html || typeof html !== 'string') return true;
  if (/just a moment|checking your browser|attention required|cf-browser-verification|challenges\.cloudflare\.com|ddos protection|verifying you are human/i.test(html)) return true;
  if (html.length < 3000) return true;
  const hasContent = /<article|<section|<main|class=["'][^"']*(card|listing|property|imovel|result)[^"']*["']/i.test(html);
  const hasSpaMarker = /<div\s+id=["']?(root|app|__next|__nuxt)/i.test(html);
  if (hasSpaMarker && !hasContent) return true;
  return false;
}

async function fetchHTML(url, opts = {}) {
  const allowBrowser = opts.allowBrowser !== false;
  try {
    const response = await axios.get(url, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
      },
      maxRedirects: 5,
      validateStatus: s => s < 500,
    });
    const html = response.data;
    if (allowBrowser && browserScraper && needsBrowser(html)) {
      try {
        const result = await browserScraper.fetchRenderedHTML(url);
        if (result && result.html && result.html.length > (html?.length || 0)) {
          return result.html;
        }
      } catch (e) { /* fallback to axios result */ }
    }
    return html;
  } catch (e) {
    if (allowBrowser && browserScraper) {
      try {
        const result = await browserScraper.fetchRenderedHTML(url);
        if (result && result.html) return result.html;
      } catch (err) { /* rethrow original */ }
    }
    throw e;
  }
}

function stripHTML(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');
}

function extractJsonLd(html) {
  const matches = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
  const results = [];
  for (const m of matches) {
    const jsonText = m.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '').trim();
    try {
      results.push(JSON.parse(jsonText));
    } catch (e) {
      // ignore parse errors
    }
  }
  return results;
}

function extractImageUrls(html, baseUrl) {
  const urls = new Set();
  const imgMatches = html.match(/<img[^>]+src=["']([^"']+)["']/gi) || [];
  for (const m of imgMatches) {
    const src = m.match(/src=["']([^"']+)["']/i)[1];
    if (!src || src.startsWith('data:')) continue;
    try {
      const abs = new URL(src, baseUrl).href;
      if (/\.(jpg|jpeg|png|webp)(\?|$)/i.test(abs)) urls.add(abs);
    } catch (e) { /* ignore */ }
  }
  const ogMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
  if (ogMatch) {
    try { urls.add(new URL(ogMatch[1], baseUrl).href); } catch (e) {}
  }
  return Array.from(urls);
}

function extractLinks(html, baseUrl) {
  const urls = new Set();
  const linkMatches = html.match(/<a[^>]+href=["']([^"']+)["']/gi) || [];
  for (const m of linkMatches) {
    const href = m.match(/href=["']([^"']+)["']/i)[1];
    if (!href || href.startsWith('#') || href.startsWith('javascript:')) continue;
    try {
      const abs = new URL(href, baseUrl).href;
      if (new URL(abs).hostname === new URL(baseUrl).hostname) urls.add(abs);
    } catch (e) {}
  }
  return Array.from(urls);
}

function cleanTextFromHTML(html) {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

async function extractFromPageWithAI(html, url) {
  const jsonld = extractJsonLd(html);
  const cleanText = cleanTextFromHTML(stripHTML(html)).substring(0, 8000);
  const images = extractImageUrls(html, url);

  const prompt = `Voce e um extrator de dados de imoveis a partir de paginas web. Analise o texto e retorne JSON.

URL: ${url}

TEXTO DA PAGINA:
${cleanText}

JSON-LD ENCONTRADO:
${JSON.stringify(jsonld).substring(0, 2000)}

Retorne JSON com a estrutura:
{
  "is_property_listing": boolean,
  "is_property_detail": boolean,
  "property": {
    "titulo": string,
    "descricao": string,
    "preco": number | null,
    "offer_type": "compra" | "aluguel" | null,
    "property_type": "Casa" | "Apartamento" | "Terreno" | "Comercial" | null,
    "bedrooms": number | null,
    "size": number | null,
    "neighborhood": string | null,
    "location": string | null,
    "street": string | null
  } | null,
  "related_links": [string]
}

Regras:
- "is_property_listing" = true se a pagina mostra varios imoveis
- "is_property_detail" = true se a pagina mostra UM imovel especifico
- Se for listagem, preencha "related_links" com URLs dos imoveis individuais (maximo 50)
- Se for detalhe, preencha "property" com os dados
- preco em reais (apenas o numero)
- size em metros quadrados (apenas o numero)
- bedrooms apenas numero
- Responda APENAS o JSON, sem markdown.`;

  const response = await aiService.rawCompletion(prompt, { max_tokens: 2000, temperature: 0.1 });

  let parsed;
  try {
    const cleaned = response.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
    parsed = JSON.parse(cleaned);
  } catch (e) {
    parsed = { is_property_listing: false, is_property_detail: false };
  }

  parsed.images = images;
  return parsed;
}

function phashFromUrl(url) {
  return crypto.createHash('md5').update(url).digest('hex').substring(0, 10);
}

async function downloadImage(url, destDir) {
  try {
    ensureDir(destDir);
    const ext = (url.split('?')[0].match(/\.(jpg|jpeg|png|webp)$/i) || [, 'jpg'])[1].toLowerCase();
    const filename = phashFromUrl(url) + '.' + ext;
    const destPath = path.join(destDir, filename);
    if (fs.existsSync(destPath)) return destPath;

    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 30000,
      maxContentLength: 20 * 1024 * 1024,
    });
    fs.writeFileSync(destPath, response.data);
    return destPath;
  } catch (e) {
    return null;
  }
}

function localPathToPublicUrl(localPath) {
  const wpImagesPrefix = '/root/socasatop/wp-images';
  if (localPath && localPath.startsWith(wpImagesPrefix)) {
    return 'https://socasatop.com.br' + localPath.substring(wpImagesPrefix.length);
  }
  return null;
}

async function scrapeUrl(url) {
  const html = await fetchHTML(url);
  const extracted = await extractFromPageWithAI(html, url);

  if (extracted.is_property_detail && extracted.property) {
    return {
      type: 'detail',
      properties: [{ ...extracted.property, source_url: url, images: extracted.images || [] }],
    };
  }

  if (extracted.is_property_listing && extracted.related_links && extracted.related_links.length > 0) {
    const links = extracted.related_links.slice(0, 50);
    const properties = [];
    for (const link of links) {
      try {
        const sub = await scrapeUrl(link);
        if (sub.properties && sub.properties.length > 0) {
          properties.push(...sub.properties);
        }
      } catch (e) {
        // continue on error
      }
    }
    return { type: 'listing', properties };
  }

  return { type: 'unknown', properties: [] };
}

async function saveImagesForProperty(property, subDir) {
  const now = new Date();
  const yearMonth = now.getFullYear() + '/' + String(now.getMonth() + 1).padStart(2, '0');
  const destDir = path.join(UPLOAD_DIR, yearMonth, subDir);

  const savedUrls = [];
  for (const imgUrl of property.images || []) {
    const localPath = await downloadImage(imgUrl, destDir);
    if (localPath) {
      const publicUrl = localPathToPublicUrl(localPath);
      if (publicUrl) savedUrls.push(publicUrl);
    }
  }
  return savedUrls;
}

module.exports = {
  fetchHTML,
  stripHTML,
  scrapeUrl,
  saveImagesForProperty,
  downloadImage,
  localPathToPublicUrl,
  phashFromUrl,
};
