function formatDesc(text) {
  if (!text) return '';
  return text
    .replace(/\r\s*\r/g, '<br><br>')
    .replace(/\r/g, '<br>')
    .replace(/\n/g, '<br>')
    .replace(/\\r\\n/g, '<br>')
    .replace(/\\n/g, '<br>')
    .replace(/\\r/g, '<br>');
}

function renderImovel(imovel, corretor) {
  const preco = imovel.amount ? `R$ ${Number(imovel.amount).toLocaleString('pt-BR')}` : 'Consulte';
  const allMedia = (imovel.images || []).filter(img => typeof img === 'string' && img.startsWith('http'));
  const videos = allMedia.filter(m => m.endsWith('.mp4') || m.endsWith('.webm') || m.endsWith('.mov'));
  const photos = allMedia.filter(m => !videos.includes(m));

  // Select OG image optimized for WhatsApp: prefer JPG under 1MB, then poster, then any small file
  let ogImage = '';
  if (photos.length > 0) {
    const fs = require('fs');
    const localSize = (url) => {
      try {
        const lp = url.includes('/wp-content/uploads/')
          ? '/root/socasatop/wp-images' + url.split('socasatop.com.br')[1]
          : '/root/socasatop' + url.split('socasatop.com.br')[1];
        if (fs.existsSync(lp)) return fs.statSync(lp).size;
      } catch(e) {}
      return null;
    };

    const posterUrl = allMedia.find(u => /\.poster\.jpg$/i.test(u));
    if (posterUrl) {
      const sz = localSize(posterUrl);
      if (sz != null && sz < 5000000) ogImage = posterUrl;
    }

    if (!ogImage) {
      const jpgs = photos.filter(u => /\.(jpg|jpeg)$/i.test(u));
      const pngs = photos.filter(u => /\.png$/i.test(u));
      const jpgSizes = jpgs.map(u => ({ url: u, size: localSize(u) })).filter(x => x.size != null && x.size < 5000000);
      const pngSizes = pngs.map(u => ({ url: u, size: localSize(u) })).filter(x => x.size != null && x.size < 5000000);
      jpgSizes.sort((a,b) => a.size - b.size);
      pngSizes.sort((a,b) => a.size - b.size);
      if (jpgSizes.length > 0) ogImage = jpgSizes[0].url;
      else if (pngSizes.length > 0) ogImage = pngSizes[0].url;
    }

    if (!ogImage) {
      const sized = photos.map(u => ({ url: u, size: localSize(u) })).filter(x => x.size != null);
      sized.sort((a,b) => a.size - b.size);
      if (sized.length > 0) ogImage = sized[0].url;
    }

    if (!ogImage) ogImage = photos[0];
  }

  let photoGallery = '';
  for (const img of photos) {
    photoGallery += `<img src="${img}" loading="lazy" style="width:100%;max-height:400px;object-fit:cover;border-radius:8px;margin-bottom:8px;" onerror="this.style.display='none'">`;
  }

  let videoSection = '';
  for (const vid of videos) {
    videoSection += `<video src="${vid}" controls playsinline style="width:100%;max-height:400px;border-radius:8px;margin-bottom:8px;background:#000;"></video>`;
  }

  const admPhone = process.env.ADM_PHONE || '556181288923';
  const whatsappNum = corretor ? corretor.whatsapp : admPhone;
  const whatsappName = corretor ? corretor.nome : 'Só Casa Top';
  const whatsappMsg = encodeURIComponent('Olá, tenho interesse no imóvel ' + imovel.titulo + '\n\nhttps://socasatop.com.br/imovel/' + imovel.id);

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${imovel.titulo} - Só Casa Top</title>
<meta property="og:type" content="website">
<meta property="og:url" content="https://socasatop.com.br/imovel/${imovel.id}">
<meta property="og:title" content="${imovel.titulo} - ${preco}">
<meta property="og:description" content="${imovel.neighborhood || ''} | ${imovel.bedrooms ? imovel.bedrooms + ' quartos | ' : ''}${imovel.size ? imovel.size + 'm\u00b2 | ' : ''}S\u00f3 Casa Top">
<meta property="og:image" content="${ogImage}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:site_name" content="S\u00f3 Casa Top">
<meta property="og:locale" content="pt_BR">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${imovel.titulo} - ${preco}">
<meta name="twitter:description" content="${imovel.neighborhood || ''} | S\u00f3 Casa Top">
<meta name="twitter:image" content="${ogImage}">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; background:#f5f5f5; color:#333; }
  .header { background:linear-gradient(135deg,#0f0c29,#302b63); color:#fff; padding:16px 20px; display:flex; align-items:center; justify-content:space-between; }
  .back-btn { color:rgba(255,255,255,0.8); text-decoration:none; font-size:14px; display:flex; align-items:center; gap:6px; transition:color 0.2s; }
  .back-btn:hover { color:#fff; }
  .header h1 { font-size:18px; flex:1; text-align:center; }
  .header-spacer { width:80px; }
  .header h1 { font-size:18px; }
  .container { max-width:600px; margin:0 auto; padding:16px; }
  .card { background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.1); margin-bottom:16px; }
  .card-body { padding:20px; }
  .price { font-size:28px; font-weight:800; color:#059669; margin-bottom:12px; }
  .title { font-size:20px; font-weight:700; margin-bottom:8px; }
  .location { color:#6b7280; font-size:14px; margin-bottom:16px; }
  .details { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:16px; }
  .detail-item { background:#f8f9fb; padding:12px; border-radius:8px; text-align:center; }
  .detail-label { font-size:11px; color:#9ca3af; text-transform:uppercase; }
  .detail-value { font-size:16px; font-weight:600; margin-top:4px; }
  .section-title { font-size:15px; font-weight:700; color:#302b63; padding:16px 20px 8px; border-top:1px solid #f3f4f6; }
  .media-section { padding:8px 16px 16px; }
  .description { font-size:14px; line-height:1.8; color:#4b5563; padding:16px 20px; border-top:1px solid #f3f4f6; white-space:normal; }
  .wa-btn { display:block; margin:16px 20px; padding:16px; background:#25D366; color:#fff; border-radius:12px; text-decoration:none; font-weight:700; font-size:16px; text-align:center; }
  .wa-btn:hover { background:#1da851; }
  .badge { display:inline-block; padding:4px 10px; border-radius:6px; font-size:12px; font-weight:600; margin-right:6px; margin-bottom:8px; }
  .badge-type { background:#ede9fe; color:#5b21b6; }
  .badge-offer { background:#d1fae5; color:#065f46; }
  .footer { text-align:center; padding:20px; font-size:12px; color:#9ca3af; }
  .no-media { padding:40px 20px; text-align:center; color:#9ca3af; font-size:14px; }
</style>
</head>
<body>
<div class="header"><a href="/" class="back-btn">← Voltar</a><h1>Só Casa Top</h1><div class="header-spacer"></div></div>
<div class="container">
  <div class="card">
    ${videos.length > 0 ? `
      <div class="section-title"> Vídeos (${videos.length})</div>
      <div class="media-section">${videoSection}</div>
    ` : ''}

    ${photos.length > 0 ? `
      <div class="section-title"> Fotos (${photos.length})</div>
      <div class="media-section">${photoGallery}</div>
    ` : ''}

    ${allMedia.length === 0 ? '<div class="no-media"> Mídia não disponível</div>' : ''}

    <div class="card-body">
      <div>
        <span class="badge badge-type">${imovel.property_type || 'Imóvel'}</span>
        <span class="badge badge-offer">${imovel.offer_type === 'compra' ? 'Venda' : imovel.offer_type === 'aluguel' ? 'Aluguel' : imovel.offer_type || ''}</span>
      </div>
      <div class="price">${preco}</div>
      <div class="title">${imovel.titulo}</div>
      <div class="location"> ${imovel.neighborhood || imovel.location || ''} ${imovel.street || ''}</div>
      <div class="details">
        ${imovel.bedrooms ? `<div class="detail-item"><div class="detail-label">Quartos</div><div class="detail-value"> ${imovel.bedrooms}</div></div>` : ''}
        ${imovel.size && imovel.size >= 20 ? `<div class="detail-item"><div class="detail-label">Área</div><div class="detail-value"> ${imovel.size}m²</div></div>` : ''}
        ${imovel.condominium ? `<div class="detail-item"><div class="detail-label">Condomínio</div><div class="detail-value"> Sim</div></div>` : ''}
        ${imovel.financing ? `<div class="detail-item"><div class="detail-label">Financiamento</div><div class="detail-value"> Aceita</div></div>` : ''}
      </div>
    </div>
    ${imovel.details ? `<div class="description">${formatDesc(imovel.details)}</div>` : ''}
    <a href="https://wa.me/${whatsappNum}?text=${whatsappMsg}" class="wa-btn" target="_blank">
       Falar com ${whatsappName} no WhatsApp
    </a>
    <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin:16px 20px;">
      <a href="https://wa.me/?text=${encodeURIComponent(imovel.titulo + ' - ' + preco + ' %0Ahttps://socasatop.com.br/imovel/' + imovel.id)}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:6px;padding:10px 18px;border-radius:10px;font-weight:600;font-size:14px;text-decoration:none;background:#e8f8ee;color:#25d366;border:1px solid #25d366;"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg> WhatsApp</a>
      <a href="mailto:?subject=${encodeURIComponent('Imóvel: ' + imovel.titulo)}&body=${encodeURIComponent(imovel.titulo + ' - ' + preco + '%0A%0AVeja mais: https://socasatop.com.br/imovel/' + imovel.id)}" target="_blank" style="display:inline-flex;align-items:center;gap:6px;padding:10px 18px;border-radius:10px;font-weight:600;font-size:14px;text-decoration:none;background:#eef3ff;color:#4a7eff;border:1px solid #4a7eff;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg> E-mail</a>
      <button onclick="if(navigator.share){navigator.share({title:document.title,text:'Só Casa Top',url:location.href})}else{navigator.clipboard.writeText(location.href).then(function(){alert('Link copiado!')})}" style="display:inline-flex;align-items:center;gap:6px;padding:10px 18px;border-radius:10px;font-weight:600;font-size:14px;cursor:pointer;background:#fff5e6;color:#e8a020;border:1px solid #e8a020;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg> Compartilhar</button>
    </div>
    <button onclick="navigator.clipboard.writeText('https://socasatop.com.br/imovel/${imovel.id}').then(function(){this.textContent=' Link copiado!';var b=this;setTimeout(function(){b.textContent=' Copiar link'},2000)}.bind(this))" style="display:block;width:calc(100% - 40px);margin:0 20px 16px;padding:12px;border-radius:10px;cursor:pointer;background:transparent;color:#c9a84c;border:1px solid #c9a84c;font-weight:600;font-size:14px;"> Copiar link</button>
  </div>
</div>
<div class="footer">Só Casa Top &bull; Imóveis em Brasília<br>ID: #${imovel.id}</div>
</body>
</html>`;
}

module.exports = { renderImovel };
