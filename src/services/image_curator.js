const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');
const axios = require('axios');

const REPLICATE_TOKEN = process.env.REPLICATE_API_TOKEN || '';
const UPLOAD_DIR = process.env.CURADORIA_UPLOAD_DIR || '/root/socasatop/wp-images/wp-content/uploads/curadoria';

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function localPathToPublicUrl(localPath) {
  const base = '/root/socasatop/wp-images';
  if (localPath && localPath.startsWith(base)) {
    return 'https://socasatop.com.br' + localPath.substring(base.length);
  }
  return null;
}

async function downloadToLocal(url, destDir, filename) {
  ensureDir(destDir);
  const destPath = path.join(destDir, filename);
  const response = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: 60000,
    maxContentLength: 30 * 1024 * 1024,
  });
  fs.writeFileSync(destPath, response.data);
  return destPath;
}

async function callReplicate(model, version, input) {
  if (!REPLICATE_TOKEN) {
    throw new Error('REPLICATE_API_TOKEN nao configurado');
  }
  const body = JSON.stringify({ version, input });
  const cmd = `curl -s -X POST "https://api.replicate.com/v1/predictions" -H "Authorization: Token ${REPLICATE_TOKEN}" -H "Content-Type: application/json" -d '${body.replace(/'/g, "'\\''")}'`;
  const startResp = execSync(cmd, { encoding: 'utf-8', timeout: 30000 });
  const start = JSON.parse(startResp);
  if (start.error) throw new Error('Replicate: ' + start.error);
  const id = start.id;

  for (let i = 0; i < 60; i++) {
    await new Promise(r => setTimeout(r, 2000));
    const pollCmd = `curl -s "https://api.replicate.com/v1/predictions/${id}" -H "Authorization: Token ${REPLICATE_TOKEN}"`;
    const pollResp = execSync(pollCmd, { encoding: 'utf-8', timeout: 15000 });
    const poll = JSON.parse(pollResp);
    if (poll.status === 'succeeded') return poll.output;
    if (poll.status === 'failed' || poll.status === 'canceled') {
      throw new Error('Replicate failed: ' + (poll.error || poll.status));
    }
  }
  throw new Error('Replicate timeout');
}

async function upscalarImagem(imageUrl) {
  const output = await callReplicate(
    'real-esrgan',
    'f121d640bd286e1fdc67f9799164c1d5be36ff74576ee11c803ae5b665dd46aa',
    { image: imageUrl, scale: 2, face_enhance: false }
  );
  return Array.isArray(output) ? output[0] : output;
}

async function decorarAmbiente(imageUrl, estilo) {
  const promptStyle = (estilo || 'modern').toLowerCase();
  const prompts = {
    modern: 'a photorealistic modern interior design, minimalist furniture, neutral colors, natural light, high-end finishes, professional architectural photography, 8k',
    classic: 'a photorealistic classic interior design, elegant furniture, warm tones, traditional decor, professional architectural photography, 8k',
    minimalist: 'a photorealistic minimalist interior, clean lines, white and beige tones, sparse but elegant furniture, professional photography, 8k',
    rustic: 'a photorealistic rustic interior, wood elements, warm lighting, cozy furniture, professional architectural photography, 8k',
  };
  const prompt = prompts[promptStyle] || prompts.modern;

  const output = await callReplicate(
    'sdxl-controlnet',
    '0521ee9019e8a87f4d0e3ddf12ce5dd9d7c6f8fe8c7e5d6b4b1c2c2f8e7d6c5b4',
    {
      image: imageUrl,
      prompt: prompt,
      negative_prompt: 'blurry, low quality, distorted, ugly, deformed',
      num_inference_steps: 30,
      strength: 0.7,
    }
  );
  return Array.isArray(output) ? output[output.length - 1] : output;
}

async function selecionarMelhoresImagens(imagens, maxSelected) {
  const max = maxSelected || 10;
  return imagens.slice(0, max);
}

async function curarImagens({ imovel, opcoes }) {
  const opts = opcoes || {};
  const imagensOriginais = (imovel.images || []).filter(u => typeof u === 'string' && /\.(jpg|jpeg|png|webp)$/i.test(u));
  if (imagensOriginais.length === 0) {
    return { sucesso: false, motivo: 'Imovel sem imagens.' };
  }

  const dirSlug = 'imovel_' + imovel.id + '_' + Date.now();
  const destDir = path.join(UPLOAD_DIR, dirSlug);
  ensureDir(destDir);

  const resultados = [];
  const aProcessar = await selecionarMelhoresImagens(imagensOriginais, opts.maxImagens || 10);

  for (let i = 0; i < aProcessar.length; i++) {
    const imgUrl = aProcessar[i];
    const result = { original: imgUrl, melhorada: null, decorada: null, erro: null };
    try {
      if (opts.melhorarQualidade) {
        result.melhorada = await upscalarImagem(imgUrl);
      }
      if (opts.decorar) {
        const fonteParaDecorar = result.melhorada || imgUrl;
        result.decorada = await decorarAmbiente(fonteParaDecorar, opts.estiloDecoracao);
      }
    } catch (e) {
      result.erro = e.message;
    }
    resultados.push(result);
  }

  return {
    sucesso: true,
    imagens: resultados,
    versao_anterior: { images: imovel.images },
    versao_nova: { images: resultados.map(r => r.decorada || r.melhorada || r.original) },
  };
}

module.exports = {
  upscalarImagem,
  decorarAmbiente,
  selecionarMelhoresImagens,
  curarImagens,
  callReplicate,
  localPathToPublicUrl,
};
