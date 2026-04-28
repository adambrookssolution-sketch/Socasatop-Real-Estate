function render() {
  const HERO_IMAGES = [
    'https://socasatop.com.br/wp-content/uploads/2025/03/2025_03_07-SMPW_05_02_06_B-0939-HDR.png',
    'https://socasatop.com.br/wp-content/uploads/2025/08/CASA-15-14-07-LAGO-SUL.poster.jpg',
    'https://socasatop.com.br/wp-content/uploads/2025/03/2025_03_07-SMPW_05_02_06_B-0924-HDR.jpg',
  ];
  const ABOUT_IMAGES = [
    'https://socasatop.com.br/wp-content/uploads/2024/07/d43d62014668a64853add09be76150d3.jpg',
    'https://socasatop.com.br/wp-content/uploads/2025/03/2025_03_07-SMPW_05_02_06_B-0924-HDR.jpg',
  ];
  const GALLERY = [
    'https://socasatop.com.br/wp-content/uploads/2024/07/d43d62014668a64853add09be76150d3.jpg',
    'https://socasatop.com.br/wp-content/uploads/2025/03/2025_03_07-SMPW_05_02_06_B-0924-HDR.jpg',
    'https://socasatop.com.br/wp-content/uploads/2025/03/2025_03_07-SMPW_05_02_06_B-0939-HDR.png',
    'https://socasatop.com.br/wp-content/uploads/2026/02/6026057414.jpg',
    'https://socasatop.com.br/wp-content/uploads/2026/02/6b710f08d322f126be7ec08a83b38872-1.jpg',
    'https://socasatop.com.br/wp-content/uploads/2025/04/WhatsApp-Image-2025-04-30-at-11.49.49-3.jpeg',
    'https://socasatop.com.br/wp-content/uploads/2025/08/VK4897024-1024x682.jpg',
    'https://socasatop.com.br/wp-content/uploads/2025/08/34c3dc71698646e1a036ce9c581f201d.jpg',
    'https://socasatop.com.br/wp-content/uploads/2026/01/WhatsApp-Image-2026-01-14-at-08.48.38-1.jpeg',
  ];

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<link rel="icon" href="data:,">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>So Casa Top - Parceiros Fundadores</title>
<meta name="description" content="Seja um dos 5 parceiros fundadores da sua regiao. R$ 497/mes vitalicio. Antes que sua concorrencia ocupe o seu lugar.">
<meta property="og:title" content="So Casa Top - Parceria Fundadores">
<meta property="og:description" content="5 vagas por regiao em Brasilia. 66 mil seguidores no Instagram. 340 mil visualizacoes/mes.">
<meta property="og:image" content="${HERO_IMAGES[0]}">
<meta property="og:type" content="website">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,600&family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
:root {
  --gold: #c9a96e;
  --gold-dark: #a68546;
  --gold-light: #e8d4a8;
  --dark: #0a0a14;
  --dark-2: #15151f;
  --light: #faf8f5;
  --gray: #6b7280;
  --gray-light: #9ca3af;
  --border: #e8e4de;
  --success: #10b981;
  --danger: #dc2626;
  --warning: #f59e0b;
}
html, body { max-width: 100vw; overflow-x: hidden; font-family: 'Inter', sans-serif; color: #1a1a2e; background: var(--light); line-height: 1.6; -webkit-font-smoothing: antialiased; }
.container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }

/* NAV */
nav { padding: 16px 0; background: rgba(10,10,20,0.95); backdrop-filter: blur(12px); border-bottom: 1px solid rgba(201,169,110,0.15); position: sticky; top: 0; z-index: 100; }
nav .container { display: flex; align-items: center; justify-content: space-between; }
.logo { font-family: 'Playfair Display', serif; font-size: 24px; font-weight: 700; color: #fff; letter-spacing: -0.5px; }
.logo span { color: var(--gold); font-style: italic; }
.btn { display: inline-flex; align-items: center; justify-content: center; padding: 14px 28px; border-radius: 8px; font-weight: 600; text-decoration: none; cursor: pointer; transition: all 0.25s; border: none; font-size: 15px; font-family: inherit; }
.btn-primary { background: var(--gold); color: #fff; box-shadow: 0 8px 24px -8px rgba(201,169,110,0.6); }
.btn-primary:hover { background: var(--gold-dark); transform: translateY(-2px); box-shadow: 0 12px 32px -8px rgba(201,169,110,0.7); }
.btn-outline { background: transparent; color: #fff; border: 1px solid rgba(255,255,255,0.2); }
.btn-outline:hover { border-color: var(--gold); color: var(--gold); }
.btn-large { padding: 18px 40px; font-size: 17px; }
.btn-pulse { animation: pulseBtn 2s ease-in-out infinite; }
@keyframes pulseBtn {
  0%, 100% { box-shadow: 0 8px 24px -8px rgba(201,169,110,0.6); }
  50% { box-shadow: 0 8px 36px -4px rgba(201,169,110,0.9); }
}

/* HERO */
.hero { position: relative; min-height: 100vh; padding: 80px 0 60px; overflow: hidden; background: var(--dark); color: #fff; display: flex; align-items: center; }
.hero-bg { position: absolute; inset: 0; z-index: 0; }
.hero-bg .slide { position: absolute; inset: 0; background-size: cover; background-position: center; opacity: 0; transition: opacity 1.5s ease; transform: scale(1.05); }
.hero-bg .slide.active { opacity: 0.45; animation: kenBurns 12s ease-in-out infinite; }
@keyframes kenBurns {
  0%, 100% { transform: scale(1.05) translate(0,0); }
  50% { transform: scale(1.15) translate(-1%, -1%); }
}
.hero-bg::after { content: ''; position: absolute; inset: 0; background: linear-gradient(180deg, rgba(10,10,20,0.4) 0%, rgba(10,10,20,0.85) 100%); z-index: 1; }
.hero .container { position: relative; z-index: 2; }
.hero-tag { display: inline-block; padding: 8px 18px; border: 1px solid rgba(201,169,110,0.5); background: rgba(201,169,110,0.12); border-radius: 30px; color: var(--gold); font-size: 12px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 28px; animation: fadeUp 0.8s ease both; }
.hero h1 { font-family: 'Playfair Display', serif; font-size: clamp(2.2rem, 6vw, 4.5rem); font-weight: 700; line-height: 1.05; max-width: 920px; margin-bottom: 24px; letter-spacing: -1.5px; animation: fadeUp 1s ease 0.2s both; }
.hero h1 em { color: var(--gold); font-style: italic; }
.hero p.lead { font-size: clamp(1.05rem, 1.6vw, 1.3rem); color: rgba(255,255,255,0.78); max-width: 720px; margin-bottom: 16px; animation: fadeUp 1s ease 0.4s both; font-weight: 300; }
.hero p.warning { font-size: 14px; color: var(--warning); margin-bottom: 36px; animation: fadeUp 1s ease 0.6s both; font-weight: 500; }
.hero-cta { display: flex; gap: 16px; flex-wrap: wrap; animation: fadeUp 1s ease 0.8s both; }
@keyframes fadeUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
.hero-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 24px; margin-top: 60px; max-width: 720px; animation: fadeUp 1.2s ease 1s both; }
.stat { text-align: left; padding-left: 20px; border-left: 2px solid var(--gold); }
.stat-num { font-family: 'Playfair Display', serif; font-size: clamp(1.6rem, 3vw, 2.4rem); font-weight: 700; color: var(--gold); line-height: 1; margin-bottom: 4px; }
.stat-label { font-size: 12px; color: rgba(255,255,255,0.65); text-transform: uppercase; letter-spacing: 1.5px; }

/* ALERT BANNER */
.alert-banner { background: linear-gradient(90deg, var(--danger), #b91c1c); color: #fff; padding: 14px 0; text-align: center; font-size: 14px; font-weight: 600; position: relative; overflow: hidden; }
.alert-banner::before { content: ''; position: absolute; left: -100%; top: 0; width: 100%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent); animation: shimmer 3s ease-in-out infinite; }
@keyframes shimmer { 0%, 100% { left: -100%; } 50% { left: 100%; } }

/* SECTION BASE */
.section { padding: 100px 0; position: relative; }
.section-tag { display: inline-block; padding: 6px 14px; background: rgba(201,169,110,0.12); color: var(--gold); border-radius: 20px; font-size: 12px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 16px; }
.section-title { font-family: 'Playfair Display', serif; font-size: clamp(2rem, 4vw, 3rem); font-weight: 700; line-height: 1.1; margin-bottom: 16px; max-width: 720px; }
.section-subtitle { font-size: 17px; color: var(--gray); max-width: 640px; margin-bottom: 56px; line-height: 1.7; }
.text-center { text-align: center; }
.text-center .section-title, .text-center .section-subtitle { margin-left: auto; margin-right: auto; }

/* ABOUT */
.about-grid { display: grid; grid-template-columns: 1.1fr 1fr; gap: 64px; align-items: center; }
.about-images { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; position: relative; align-items: stretch; }
.about-images img { width: 100%; aspect-ratio: 3/4; object-fit: cover; border-radius: 14px; box-shadow: 0 20px 50px -20px rgba(0,0,0,0.25); transition: transform 0.5s; display: block; }
.about-images img:hover { transform: translateY(-8px); }
.about-text h2 { font-family: 'Playfair Display', serif; font-size: clamp(2rem, 3.5vw, 2.8rem); font-weight: 700; line-height: 1.15; margin-bottom: 20px; }
.about-text h2 em { color: var(--gold); font-style: italic; }
.about-text p { color: var(--gray); margin-bottom: 16px; font-size: 16px; }
.about-text strong { color: var(--dark); }

/* INSTA */
#instagram { background: linear-gradient(180deg, #fff 0%, var(--light) 100%); }
.insta-card { background: #fff; border: 1px solid var(--border); border-radius: 24px; padding: 48px; max-width: 880px; margin: 0 auto; box-shadow: 0 30px 70px -30px rgba(0,0,0,0.15); }
.insta-header { display: flex; gap: 20px; align-items: center; margin-bottom: 30px; flex-wrap: wrap; }
.insta-avatar { width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, var(--gold), #d4b888); display: flex; align-items: center; justify-content: center; color: #fff; font-family: 'Playfair Display', serif; font-size: 22px; font-weight: 700; flex-shrink: 0; }
.insta-meta h3 { font-size: 22px; font-weight: 700; margin-bottom: 4px; display: flex; align-items: center; gap: 8px; }
.insta-meta h3 .check { color: #1d9bf0; font-size: 18px; }
.insta-meta .handle { color: var(--gray); font-size: 14px; }
.insta-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 24px; padding: 28px 0; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); margin-bottom: 28px; }
.insta-stat { text-align: center; }
.insta-stat-num { font-family: 'Playfair Display', serif; font-size: 36px; font-weight: 700; color: var(--dark); line-height: 1; margin-bottom: 6px; }
.insta-stat-label { font-size: 12px; color: var(--gray); text-transform: uppercase; letter-spacing: 1px; }
.insta-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
.insta-grid img { width: 100%; aspect-ratio: 1/1; object-fit: cover; transition: transform 0.4s, filter 0.4s; }
.insta-grid img:hover { transform: scale(1.04); filter: brightness(1.1); }

/* RECEIVE */
#receive { background: var(--dark); color: #fff; }
#receive .section-title { color: #fff; }
#receive .section-subtitle { color: rgba(255,255,255,0.65); }
.receive-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; }
.receive-card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 28px; transition: all 0.3s; }
.receive-card:hover { border-color: rgba(201,169,110,0.4); transform: translateY(-4px); background: rgba(255,255,255,0.06); }
.receive-icon { width: 48px; height: 48px; border-radius: 12px; background: rgba(201,169,110,0.15); display: flex; align-items: center; justify-content: center; margin-bottom: 18px; color: var(--gold); font-size: 22px; font-weight: 700; }
.receive-card h3 { font-size: 18px; font-weight: 600; margin-bottom: 8px; color: #fff; }
.receive-card p { color: rgba(255,255,255,0.65); font-size: 14px; }

/* VAGAS */
#vagas { background: #fff; }
.regioes-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; margin-top: 48px; }
.regiao-card { background: var(--light); border: 2px solid var(--border); border-radius: 14px; padding: 22px; transition: all 0.3s; cursor: pointer; position: relative; overflow: hidden; }
.regiao-card.disponivel:hover { border-color: var(--gold); transform: translateY(-3px); box-shadow: 0 16px 40px -12px rgba(201,169,110,0.3); }
.regiao-card.esgotado { opacity: 0.55; cursor: not-allowed; background: #f3f4f6; }
.regiao-card.esgotado::after { content: 'ESGOTADO'; position: absolute; top: 12px; right: 12px; background: var(--danger); color: #fff; font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 4px; letter-spacing: 1px; }
.regiao-card.encerrado { opacity: 0.5; cursor: not-allowed; background: #1a1a2e; color: #fff; }
.regiao-card.encerrado .regiao-nome { color: #fff; }
.regiao-card.encerrado::after { content: 'ENCERRADO'; position: absolute; top: 12px; right: 12px; background: #0a0a14; color: var(--gold); font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 4px; letter-spacing: 1px; border: 1px solid var(--gold); }
.regiao-card.selected { border-color: var(--gold); background: #fff; box-shadow: 0 16px 40px -12px rgba(201,169,110,0.4); transform: translateY(-3px); }
.regiao-card .check { position: absolute; top: 12px; right: 12px; width: 26px; height: 26px; border-radius: 50%; background: var(--gold); color: #fff; display: none; align-items: center; justify-content: center; font-size: 16px; font-weight: 700; }
.regiao-card.selected .check { display: flex; }

.summary-bar { position: sticky; bottom: 20px; margin-top: 32px; padding: 20px 24px; background: var(--dark); color: #fff; border-radius: 16px; display: none; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; box-shadow: 0 20px 50px -10px rgba(0,0,0,0.4); z-index: 50; }
.summary-bar.show { display: flex; }
.summary-info span { display: block; }
.summary-info .count { font-size: 13px; color: rgba(255,255,255,0.6); }
.summary-info .total { font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 700; color: var(--gold); margin-top: 2px; }
.regiao-nome { font-size: 17px; font-weight: 700; margin-bottom: 12px; }
.regiao-vagas { display: flex; gap: 5px; align-items: center; margin-bottom: 10px; }
.vaga-dot { width: 16px; height: 16px; border-radius: 50%; transition: transform 0.3s; }
.vaga-dot.ocupada { background: var(--gold); }
.vaga-dot.livre { background: var(--border); border: 2px solid #d4d0ca; }
.regiao-status { font-size: 12px; color: var(--gray); font-weight: 500; }
.regiao-status.disponivel { color: var(--success); }
.regiao-status.last { color: var(--warning); font-weight: 600; }

/* PLAN */
#plano { background: linear-gradient(180deg, var(--dark) 0%, var(--dark-2) 100%); color: #fff; }
.plano-card { max-width: 560px; margin: 0 auto; background: rgba(255,255,255,0.05); backdrop-filter: blur(10px); border: 2px solid rgba(201,169,110,0.4); border-radius: 28px; padding: 50px 44px; text-align: center; position: relative; overflow: hidden; }
.plano-card::before { content: ''; position: absolute; top: -100px; right: -100px; width: 300px; height: 300px; background: radial-gradient(circle, rgba(201,169,110,0.15), transparent); }
.plano-tag { display: inline-block; padding: 6px 18px; background: var(--gold); color: #0a0a14; border-radius: 20px; font-size: 11px; font-weight: 800; letter-spacing: 2px; margin-bottom: 20px; }
.plano-preco { font-family: 'Playfair Display', serif; font-size: clamp(3rem, 7vw, 5rem); font-weight: 700; margin-bottom: 4px; line-height: 1; color: #fff; }
.plano-preco small { font-size: 0.4em; color: rgba(255,255,255,0.6); margin-left: 6px; font-weight: 400; }
.plano-vitalicio { display: inline-block; padding: 4px 12px; background: rgba(16,185,129,0.15); color: var(--success); border-radius: 12px; font-size: 12px; font-weight: 600; margin-top: 8px; }
.plano-warning { color: var(--warning); font-size: 14px; margin-top: 16px; font-style: italic; }
.plano-features { list-style: none; padding: 0; margin: 32px 0; text-align: left; }
.plano-features li { padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.08); font-size: 15px; color: rgba(255,255,255,0.85); display: flex; align-items: center; gap: 12px; }
.plano-features li::before { content: ''; width: 8px; height: 8px; border-radius: 50%; background: var(--gold); flex-shrink: 0; }
.future-pricing { margin-top: 30px; padding-top: 30px; border-top: 1px dashed rgba(255,255,255,0.15); }
.future-pricing-title { font-size: 12px; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 12px; }
.future-pricing-list { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
.future-pricing-list span { padding: 6px 14px; background: rgba(255,255,255,0.05); border-radius: 6px; color: rgba(255,255,255,0.55); font-size: 13px; text-decoration: line-through; }

/* COMMISSION */
#comissao { background: var(--light); }
.com-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; max-width: 800px; margin: 0 auto; }
.com-card { background: #fff; border: 1px solid var(--border); border-radius: 18px; padding: 32px 28px; text-align: center; transition: transform 0.3s; }
.com-card:hover { transform: translateY(-4px); }
.com-percent { font-family: 'Playfair Display', serif; font-size: 56px; font-weight: 700; color: var(--gold); line-height: 1; margin-bottom: 8px; }
.com-card h4 { font-size: 16px; font-weight: 600; margin-bottom: 8px; }
.com-card p { color: var(--gray); font-size: 14px; }
.com-message { text-align: center; margin-top: 32px; font-size: 18px; color: var(--dark); font-weight: 500; max-width: 580px; margin-left: auto; margin-right: auto; }
.com-message em { color: var(--gold); font-style: normal; font-weight: 600; }

/* RISK FREE */
#risco { background: var(--dark); color: #fff; text-align: center; }
#risco .section-title { color: #fff; }
.risco-icon { font-family: 'Playfair Display', serif; font-size: 96px; font-weight: 700; color: var(--gold); line-height: 1; margin-bottom: 16px; animation: float 4s ease-in-out infinite; }
@keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
.risco-text { font-size: 18px; color: rgba(255,255,255,0.8); max-width: 580px; margin: 0 auto 12px; }
.risco-bullets { display: flex; gap: 28px; justify-content: center; flex-wrap: wrap; margin-top: 32px; }
.risco-bullet { color: rgba(255,255,255,0.7); font-size: 14px; }
.risco-bullet::before { content: '+ '; color: var(--gold); font-weight: 700; }

/* REQS */
#requisitos { background: #fff; }
.req-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; max-width: 880px; margin: 0 auto; }
.req-card { padding: 22px 24px; background: var(--light); border-left: 3px solid var(--gold); border-radius: 8px; }
.req-num { color: var(--gold); font-size: 13px; font-weight: 700; letter-spacing: 1.5px; margin-bottom: 6px; }
.req-text { font-size: 16px; font-weight: 600; }

/* FAQ */
#faq { background: var(--light); }
.faq-list { max-width: 800px; margin: 0 auto; }
.faq-item { background: #fff; border: 1px solid var(--border); border-radius: 14px; margin-bottom: 12px; overflow: hidden; transition: all 0.3s; }
.faq-item:hover { border-color: var(--gold); }
.faq-q { padding: 22px 26px; font-weight: 600; cursor: pointer; display: flex; justify-content: space-between; align-items: center; gap: 16px; font-size: 16px; }
.faq-a { padding: 0 26px 22px; color: var(--gray); font-size: 15px; display: none; line-height: 1.75; }
.faq-item.open .faq-a { display: block; animation: fadeUp 0.4s ease both; }
.faq-toggle { width: 28px; height: 28px; border-radius: 50%; background: rgba(201,169,110,0.1); color: var(--gold); display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; transition: all 0.3s; }
.faq-item.open .faq-toggle { transform: rotate(45deg); background: var(--gold); color: #fff; }

/* FINAL CTA */
#final-cta { background: linear-gradient(135deg, var(--gold) 0%, var(--gold-dark) 100%); color: #fff; padding: 100px 0; text-align: center; position: relative; overflow: hidden; }
#final-cta::before { content: ''; position: absolute; inset: 0; background: url('${HERO_IMAGES[0]}') center/cover; opacity: 0.12; }
#final-cta .container { position: relative; z-index: 1; }
#final-cta h2 { font-family: 'Playfair Display', serif; font-size: clamp(2rem, 4.5vw, 3.5rem); font-weight: 700; line-height: 1.15; margin-bottom: 20px; max-width: 760px; margin-left: auto; margin-right: auto; }
#final-cta p { font-size: 18px; color: rgba(255,255,255,0.9); margin-bottom: 36px; max-width: 580px; margin-left: auto; margin-right: auto; }
#final-cta .btn { background: #0a0a14; color: #fff; }
#final-cta .btn:hover { background: #1a1a2e; }

/* FOOTER */
footer { padding: 40px 0; background: var(--dark); color: rgba(255,255,255,0.5); text-align: center; font-size: 13px; }
footer a { color: var(--gold); text-decoration: none; }

/* MODAL */
.modal-overlay { display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(10,10,20,0.85); backdrop-filter: blur(6px); z-index: 1000; align-items: center; justify-content: center; padding: 20px; animation: fadeIn 0.3s ease; }
.modal-overlay.open { display: flex; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
.modal { background: #fff; border-radius: 20px; max-width: 520px; width: 100%; max-height: 92vh; overflow-y: auto; padding: 40px 36px; position: relative; animation: modalUp 0.4s ease both; }
@keyframes modalUp { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
.modal-close { position: absolute; top: 16px; right: 16px; width: 36px; height: 36px; border-radius: 50%; background: var(--light); border: none; font-size: 20px; cursor: pointer; color: var(--gray); transition: all 0.2s; }
.modal-close:hover { background: var(--border); color: var(--dark); }
.modal h2 { font-family: 'Playfair Display', serif; font-size: 28px; margin-bottom: 8px; line-height: 1.2; }
.modal-subtitle { color: var(--gray); margin-bottom: 28px; font-size: 14px; }
.form-group { margin-bottom: 18px; }
.form-group label { display: block; font-size: 13px; font-weight: 500; margin-bottom: 6px; color: #374151; }
.form-group input { width: 100%; padding: 13px 16px; border: 1px solid var(--border); border-radius: 10px; font-size: 15px; font-family: inherit; transition: border 0.2s; }
.form-group input:focus { outline: none; border-color: var(--gold); }
.form-msg { padding: 14px 16px; border-radius: 10px; font-size: 14px; margin-top: 14px; display: none; }
.form-msg.error { background: #fee2e2; color: #991b1b; display: block; }
.form-msg.success { background: #d1fae5; color: #065f46; display: block; }

/* RESPONSIVE */
@media (max-width: 768px) {
  .section { padding: 70px 0; }
  .about-grid { grid-template-columns: 1fr; gap: 40px; }
  .about-images img:nth-child(2) { margin-top: 0; }
  .insta-card { padding: 32px 24px; }
  .insta-stat-num { font-size: 28px; }
  .plano-card { padding: 36px 28px; }
}
@media (max-width: 480px) {
  .hero { padding: 60px 0 40px; min-height: auto; }
  .hero-stats { grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 40px; }
  .stat { padding-left: 14px; }
  .insta-grid { grid-template-columns: repeat(2, 1fr); }
}

/* SCROLL ANIMATIONS */
.reveal { opacity: 0; transform: translateY(30px); transition: opacity 0.8s ease, transform 0.8s ease; }
.reveal.visible { opacity: 1; transform: translateY(0); }
</style>
</head>
<body>

<div class="alert-banner">
  Lago Sul: VAGAS ESGOTADAS | Outras regioes em fase final de preenchimento
</div>

<nav>
  <div class="container">
    <div class="logo">So<span>Casa</span>Top</div>
    <a href="#vagas" class="btn btn-outline">Ver Vagas</a>
  </div>
</nav>

<section class="hero">
  <div class="hero-bg" id="hero-bg">
    ${HERO_IMAGES.map((url, i) => `<div class="slide${i === 0 ? ' active' : ''}" style="background-image:url('${url}')"></div>`).join('')}
  </div>
  <div class="container">
    <span class="hero-tag">Programa Fundadores 2026</span>
    <h1>Seja um dos <em>5 parceiros fundadores</em> da sua regiao no So Casa Top</h1>
    <p class="lead">Antes que sua concorrencia ocupe o seu lugar. Estamos selecionando apenas 5 parceiros por regiao em Brasilia para integrar o ecossistema que esta redesenhando o mercado de alto padrao.</p>
    <p class="warning">> Valor exclusivo Fundadores: R$ 497/mes (vitalicio - nunca mais sera oferecido)</p>
    <div class="hero-cta">
      <a href="#vagas" class="btn btn-primary btn-large btn-pulse">Garantir minha vaga</a>
      <a href="#instagram" class="btn btn-outline btn-large">Ver nossos numeros</a>
    </div>

    <div class="hero-stats">
      <div class="stat"><div class="stat-num">66.2K</div><div class="stat-label">Seguidores Instagram</div></div>
      <div class="stat"><div class="stat-num">340K</div><div class="stat-label">Visualizacoes/mes</div></div>
      <div class="stat"><div class="stat-num">2.3K</div><div class="stat-label">Posts publicados</div></div>
      <div class="stat"><div class="stat-num">5</div><div class="stat-label">Vagas por regiao</div></div>
    </div>
  </div>
</section>

<section class="section" id="sobre">
  <div class="container">
    <div class="about-grid">
      <div class="about-images reveal">
        <img src="${ABOUT_IMAGES[0]}" alt="Imovel So Casa Top" loading="lazy">
        <img src="${ABOUT_IMAGES[1]}" alt="Imovel So Casa Top" loading="lazy">
      </div>
      <div class="about-text reveal">
        <span class="section-tag">O que e o So Casa Top</span>
        <h2>Voce nao entra para anunciar imoveis. <em>Voce entra para participar de um sistema</em> que gera demanda qualificada todos os dias.</h2>
        <p>O So Casa Top e um <strong>ecossistema de geracao, qualificacao e conversao de leads</strong> de alto padrao com tecnologia e inteligencia artificial.</p>
        <p>Nosso WhatsApp filtra cada lead com IA antes de chegar ao parceiro. Apenas leads reais, qualificados, com poder de compra. Voce nao perde tempo com curiosos.</p>
        <a href="#vagas" class="btn btn-primary">Quero minha vaga</a>
      </div>
    </div>
  </div>
</section>

<section class="section" id="instagram">
  <div class="container">
    <div class="text-center" style="margin-bottom: 40px;">
      <span class="section-tag">Prova social</span>
      <h2 class="section-title">A maior rede de imoveis de alto padrao do DF</h2>
      <p class="section-subtitle">Numeros reais do Instagram oficial do So Casa Top</p>
    </div>
    <div class="insta-card reveal">
      <div class="insta-header">
        <div class="insta-avatar">SC</div>
        <div class="insta-meta">
          <h3>So Casa <span class="check">[v]</span></h3>
          <div class="handle">@socasatop_bsb - Painel Profissional</div>
        </div>
      </div>
      <div class="insta-stats">
        <div class="insta-stat"><div class="insta-stat-num">2.337</div><div class="insta-stat-label">Posts</div></div>
        <div class="insta-stat"><div class="insta-stat-num">66,2 mil</div><div class="insta-stat-label">Seguidores</div></div>
        <div class="insta-stat"><div class="insta-stat-num">340 mil</div><div class="insta-stat-label">Visualizacoes/mes</div></div>
      </div>
      <div class="insta-grid">
        ${GALLERY.map(url => `<img src="${url}" alt="Imovel destaque" loading="lazy" onerror="this.style.display='none'">`).join('')}
      </div>
    </div>
  </div>
</section>

<section class="section" id="receive">
  <div class="container">
    <div class="text-center">
      <span class="section-tag">Beneficios</span>
      <h2 class="section-title">O que voce recebe como parceiro fundador</h2>
      <p class="section-subtitle">Tudo o que voce precisa para vender mais com menos esforco</p>
    </div>
    <div class="receive-grid">
      <div class="receive-card reveal"><div class="receive-icon">[L]</div><h3>Leads qualificados</h3><p>Apenas leads reais, filtrados pela IA antes de chegar ate voce.</p></div>
      <div class="receive-card reveal"><div class="receive-icon">[D]</div><h3>Distribuicao inteligente</h3><p>Cada lead vai para o parceiro certo na regiao certa, automaticamente.</p></div>
      <div class="receive-card reveal"><div class="receive-icon">[IA]</div><h3>IA de pre-qualificacao</h3><p>O bot conversa com o lead, entende a necessidade e qualifica antes de te entregar.</p></div>
      <div class="receive-card reveal"><div class="receive-icon">[W]</div><h3>WhatsApp integrado</h3><p>O cliente fala direto com voce. Sem ferramentas externas, sem complicacao.</p></div>
      <div class="receive-card reveal"><div class="receive-icon">[E]</div><h3>Exclusividade territorial</h3><p>Apenas 5 parceiros por regiao. Sua presenca e amplificada, nao diluida.</p></div>
      <div class="receive-card reveal"><div class="receive-icon">[*]</div><h3>Posicionamento como autoridade</h3><p>Apareca como referencia local na maior plataforma de alto padrao do DF.</p></div>
    </div>
  </div>
</section>

<section class="section" id="vagas">
  <div class="container">
    <div class="text-center">
      <span class="section-tag">Vagas em tempo real</span>
      <h2 class="section-title">Vagas disponiveis por regiao</h2>
      <p class="section-subtitle">Atualizado em tempo real. As vagas se esgotam. Garanta a sua agora.</p>
    </div>
    <div class="regioes-grid" id="regioes-grid">
      <p style="grid-column: 1/-1; text-align:center; color:var(--gray);">Carregando regioes...</p>
    </div>
    <div class="summary-bar" id="summary-bar">
      <div class="summary-info">
        <span class="count" id="summary-count">0 regioes selecionadas</span>
        <span class="total" id="summary-total">R$ 0,00 / mes</span>
      </div>
      <button class="btn btn-primary btn-large" onclick="abrirCadastroMulti()">Garantir minhas vagas</button>
    </div>
  </div>
</section>

<section class="section" id="plano">
  <div class="container">
    <div class="text-center">
      <span class="section-tag" style="background:rgba(201,169,110,0.2); color:var(--gold-light);">Oferta Fundadores</span>
      <h2 class="section-title" style="color:#fff;">Plano Fundadores</h2>
      <p class="section-subtitle" style="color:rgba(255,255,255,0.65);">Condicao especial. Vitalicia. Apenas para os primeiros parceiros.</p>
    </div>
    <div class="plano-card reveal">
      <span class="plano-tag">FUNDADORES</span>
      <div class="plano-preco">R$ 497<small>/mes</small></div>
      <span class="plano-vitalicio">Preco vitalicio</span>
      <p class="plano-warning">Este valor nunca mais sera oferecido apos essa fase</p>
      <ul class="plano-features">
        <li>Inclusao ilimitada de imoveis</li>
        <li>Leads qualificados pela IA</li>
        <li>Vaga reservada na sua regiao</li>
        <li>WhatsApp integrado</li>
        <li>Curadoria com IA opcional</li>
        <li>Suporte prioritario</li>
        <li>Sem fidelidade. Cancele quando quiser</li>
      </ul>
      <a href="#vagas" class="btn btn-primary btn-large btn-pulse" style="width:100%;">Garantir minha vaga</a>
      <div class="future-pricing">
        <div class="future-pricing-title">Fases futuras</div>
        <div class="future-pricing-list">
          <span>R$ 997</span>
          <span>R$ 1.497</span>
          <span>R$ 2.000+</span>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="section" id="comissao">
  <div class="container">
    <div class="text-center">
      <span class="section-tag">Modelo de comissao</span>
      <h2 class="section-title">Quanto mais voce vende, menor a nossa comissao</h2>
      <p class="section-subtitle">Voce nao paga comissao fixa. Trabalhamos juntos pelo melhor resultado.</p>
    </div>
    <div class="com-grid" style="grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); max-width: 960px;">
      <div class="com-card reveal"><div class="com-percent">15%</div><h4>Alta performance</h4><p>Resposta rapida, funil atualizado, conversao alta. Voce mantem 85% da comissao.</p></div>
      <div class="com-card reveal"><div class="com-percent">20%</div><h4>Intermediaria</h4><p>Boa aderencia operacional. Faixa padrao de acompanhamento.</p></div>
      <div class="com-card reveal"><div class="com-percent">25%</div><h4>Em desenvolvimento</h4><p>Parceiros em ramp-up. Investimento maior em suporte e leads.</p></div>
    </div>
    <p class="com-message reveal">Nosso interesse e <em>te ajudar a vender mais</em>. Quanto melhor voce performa, melhor para voce e para nos.</p>
  </div>
</section>

<section class="section" id="risco">
  <div class="container">
    <div class="risco-icon">0</div>
    <h2 class="section-title">Zero risco</h2>
    <p class="risco-text">21 dias de experiencia completa. Sem compromisso. Sem fidelidade - nem agora, nem nunca.</p>
    <p class="risco-text">Voce pode sair a qualquer momento.</p>
    <div class="risco-bullets">
      <div class="risco-bullet">21 dias gratuitos completos</div>
      <div class="risco-bullet">Sem taxa de adesao</div>
      <div class="risco-bullet">Sem fidelidade</div>
      <div class="risco-bullet">Cancele quando quiser</div>
    </div>
  </div>
</section>

<section class="section" id="requisitos">
  <div class="container">
    <div class="text-center">
      <span class="section-tag">Requisitos</span>
      <h2 class="section-title">Quem pode ser parceiro fundador</h2>
      <p class="section-subtitle">Buscamos profissionais que ja atuam no alto padrao</p>
    </div>
    <div class="req-list">
      <div class="req-card reveal"><div class="req-num">REQ 01</div><div class="req-text">Minimo de 30 imoveis ativos</div></div>
      <div class="req-card reveal"><div class="req-num">REQ 02</div><div class="req-text">Ticket acima de R$ 1,5 milhao</div></div>
      <div class="req-card reveal"><div class="req-num">REQ 03</div><div class="req-text">Comissao minima de 4%</div></div>
    </div>
  </div>
</section>

<section class="section" id="faq">
  <div class="container">
    <div class="text-center">
      <span class="section-tag">FAQ</span>
      <h2 class="section-title">Perguntas frequentes</h2>
    </div>
    <div class="faq-list">
      <div class="faq-item"><div class="faq-q">Como funciona a exclusividade por regiao?<span class="faq-toggle">+</span></div><div class="faq-a">Cada regiao tem no maximo 5 parceiros oficiais. Quando uma vaga e ocupada, ela so abre novamente se algum parceiro sair. Isso garante que sua presenca seja amplificada e nao diluida.</div></div>
      <div class="faq-item"><div class="faq-q">O preco de R$ 497 e realmente vitalicio?<span class="faq-toggle">+</span></div><div class="faq-a">Sim. Para os parceiros fundadores (primeiros 5 por regiao), o valor de R$ 497/mes nunca aumenta enquanto a parceria estiver ativa. Apos essa fase, novos parceiros pagarao R$ 997, depois R$ 1.497 e R$ 2.000+.</div></div>
      <div class="faq-item"><div class="faq-q">Como sao os 21 dias gratuitos?<span class="faq-toggle">+</span></div><div class="faq-a">Voce tem acesso total a plataforma sem nenhuma cobranca. No 22o dia a primeira mensalidade e cobrada automaticamente. Voce pode cancelar a qualquer momento antes ou depois.</div></div>
      <div class="faq-item"><div class="faq-q">Quais imoveis posso trabalhar?<span class="faq-toggle">+</span></div><div class="faq-a">Apenas imoveis de alto padrao acima de R$ 1,5 milhao na nossa base. Voce pode importar imoveis dos seus sites, cadastrar manualmente ou usar nossa Curadoria com IA.</div></div>
      <div class="faq-item"><div class="faq-q">Como funciona a comissao?<span class="faq-toggle">+</span></div><div class="faq-a">15% para parceiros de alta performance e ate 25% para parceiros em ramp-up. Quanto mais voce vende, menor nossa porcentagem - nosso interesse e que voce venda muito.</div></div>
      <div class="faq-item"><div class="faq-q">Existe taxa de adesao ou setup?<span class="faq-toggle">+</span></div><div class="faq-a">Nao. Apenas a mensalidade. Sem taxa de adesao, sem fidelidade. Voce paga apenas enquanto esta ativo.</div></div>
      <div class="faq-item"><div class="faq-q">Posso participar de mais de uma regiao?<span class="faq-toggle">+</span></div><div class="faq-a">Sim. Voce seleciona quantas regioes quiser e o valor e calculado: R$ 497 por regiao. Exemplo: 2 regioes = R$ 994/mes, 3 regioes = R$ 1.491/mes.</div></div>
      <div class="faq-item"><div class="faq-q">Como funciona o carimbo de origem do lead?<span class="faq-toggle">+</span></div><div class="faq-a">Todo lead gerado pela plataforma recebe ID unico e ficaregistrado por 12 meses. Vendas concretizadas durante esse periodo geram a comissao da Sao Casa Top conforme regua de performance, mesmo se a venda for fechada fora da plataforma.</div></div>
      <div class="faq-item"><div class="faq-q">Por que Lago Sul esta encerrado?<span class="faq-toggle">+</span></div><div class="faq-a">As 5 vagas de Lago Sul ja foram preenchidas nesta fase do programa Fundadores. A regiao podera reabrir caso algum parceiro saia ou em fases futuras. Considere outras regioes premium como Lago Norte, Jardim Botanico ou Park Sul.</div></div>
    </div>
  </div>
</section>

<section id="final-cta">
  <div class="container">
    <h2>Garanta sua vaga antes que sua regiao seja fechada</h2>
    <p>Apos o preenchimento das 5 vagas, sua regiao fica indisponivel. Quando alguem sair, sera priorizado quem entrou primeiro na lista de espera.</p>
    <a href="#vagas" class="btn btn-large btn-pulse">Quero agora</a>
  </div>
</section>

<footer>
  <div class="container">
    So Casa Top - Imoveis de Alto Padrao em Brasilia<br>
    <a href="https://instagram.com/socasatop_bsb" target="_blank">@socasatop_bsb</a>
  </div>
</footer>

<div class="modal-overlay" id="modal-overlay">
  <div class="modal">
    <button class="modal-close" onclick="closeModal()">x</button>
    <h2 id="modal-title">Garantir vaga</h2>
    <p class="modal-subtitle" id="modal-subtitle"></p>
    <form id="form-cadastro" onsubmit="enviarCadastro(event)">
      <input type="hidden" name="regiao_id" id="form-regiao-id">
      <div class="form-group"><label>Nome completo *</label><input type="text" name="nome" required></div>
      <div class="form-group"><label>WhatsApp (com DDD) *</label><input type="tel" name="whatsapp" placeholder="61 99999-9999" required></div>
      <div class="form-group"><label>Email *</label><input type="email" name="email" required></div>
      <div class="form-group"><label>CPF ou CNPJ *</label><input type="text" name="cpf_cnpj" required></div>
      <div class="form-group"><label>CRECI (opcional)</label><input type="text" name="creci"></div>
      <button type="submit" class="btn btn-primary btn-large" style="width:100%; margin-top: 8px;" id="form-submit">Garantir vaga</button>
      <div class="form-msg" id="form-msg"></div>
    </form>
  </div>
</div>

<script>
let regioes = [];

function setupHeroSlider() {
  const slides = document.querySelectorAll('#hero-bg .slide');
  if (slides.length <= 1) return;
  let i = 0;
  setInterval(() => {
    slides[i].classList.remove('active');
    i = (i + 1) % slides.length;
    slides[i].classList.add('active');
  }, 5000);
}

async function loadRegioes() {
  try {
    const r = await fetch('/api/regioes');
    const d = await r.json();
    regioes = d.data || [];
    renderRegioes();
  } catch (e) {
    document.getElementById('regioes-grid').innerHTML = '<p style="text-align:center;color:#dc2626;">Erro ao carregar regioes.</p>';
  }
}

const PRECO_POR_REGIAO = 497;
let selecionadas = new Set();

function isEncerrado(r) { return (r.vagas_total || 0) === 0; }

function renderRegioes() {
  const html = regioes.map(r => {
    const encerrado = isEncerrado(r);
    const dotsOcupadas = Array(r.vagas_ocupadas).fill('<span class="vaga-dot ocupada"></span>').join('');
    const dotsLivres = Array(Math.max(0, r.vagas_total - r.vagas_ocupadas)).fill('<span class="vaga-dot livre"></span>').join('');
    let klass;
    if (encerrado) klass = 'encerrado';
    else if (r.esgotado) klass = 'esgotado';
    else klass = 'disponivel';
    if (selecionadas.has(r.id)) klass += ' selected';

    let statusClass = 'disponivel';
    if (encerrado) statusClass = 'esgotado';
    else if (r.esgotado) statusClass = 'esgotado';
    else if (r.vagas_disponiveis === 1) statusClass = 'last';

    let statusText;
    if (encerrado) statusText = 'Encerrado nesta fase';
    else if (r.esgotado) statusText = 'Vagas esgotadas';
    else if (r.vagas_disponiveis === 1) statusText = 'Ultima vaga!';
    else statusText = r.vagas_disponiveis + ' vagas disponiveis';

    const counter = encerrado ? '0/0' : (r.vagas_ocupadas + '/' + r.vagas_total);

    return '<div class="regiao-card ' + klass + '" data-id="' + r.id + '" onclick="toggleRegiao(' + r.id + ', ' + encerrado + ', ' + r.esgotado + ')">' +
      '<div class="regiao-nome">' + r.nome + '</div>' +
      (encerrado ? '' : '<div class="regiao-vagas">' + dotsOcupadas + dotsLivres + '</div>') +
      '<div class="regiao-status ' + statusClass + '">' + counter + ' - ' + statusText + '</div>' +
      '<div class="check">v</div>' +
      '</div>';
  }).join('');
  document.getElementById('regioes-grid').innerHTML = html;
  atualizarResumo();
}

function toggleRegiao(regiaoId, encerrado, esgotado) {
  if (encerrado) { alert('Lago Sul esta encerrado nesta fase do programa.'); return; }
  if (esgotado) { alert('Esta regiao esta esgotada. Aguarde a abertura de uma vaga.'); return; }
  if (selecionadas.has(regiaoId)) selecionadas.delete(regiaoId);
  else selecionadas.add(regiaoId);
  renderRegioes();
}

function atualizarResumo() {
  const bar = document.getElementById('summary-bar');
  const count = selecionadas.size;
  if (count === 0) { bar.classList.remove('show'); return; }
  bar.classList.add('show');
  const total = count * PRECO_POR_REGIAO;
  document.getElementById('summary-count').textContent = count + (count > 1 ? ' regioes selecionadas' : ' regiao selecionada');
  document.getElementById('summary-total').textContent = 'R$ ' + total.toLocaleString('pt-BR') + ',00 / mes';
}

function abrirCadastroMulti() {
  if (selecionadas.size === 0) { alert('Selecione pelo menos uma regiao.'); return; }
  const nomes = regioes.filter(r => selecionadas.has(r.id)).map(r => r.nome);
  document.getElementById('modal-title').textContent = 'Garantir ' + (nomes.length > 1 ? 'vagas' : 'vaga');
  document.getElementById('modal-subtitle').innerHTML = '<strong>Regioes:</strong> ' + nomes.join(', ') + '<br><strong>Total:</strong> R$ ' + (nomes.length * PRECO_POR_REGIAO).toLocaleString('pt-BR') + ',00/mes (21 dias gratis)';
  document.getElementById('form-regiao-id').value = Array.from(selecionadas).join(',');
  document.getElementById('modal-overlay').classList.add('open');
}

function abrirCadastro(regiaoId, nomeRegiao, esgotado) {
  toggleRegiao(regiaoId, false, esgotado);
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
  document.getElementById('form-msg').className = 'form-msg';
}

async function enviarCadastro(e) {
  e.preventDefault();
  const form = e.target;
  const submitBtn = document.getElementById('form-submit');
  const msgEl = document.getElementById('form-msg');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Enviando...';
  msgEl.className = 'form-msg';
  const data = Object.fromEntries(new FormData(form));
  const ridRaw = String(data.regiao_id || '');
  if (ridRaw.includes(',')) {
    data.regiao_ids = ridRaw.split(',').map(x => parseInt(x.trim())).filter(x => x);
    delete data.regiao_id;
  } else {
    data.regiao_id = parseInt(ridRaw);
  }
  data.source_landing = 'lp_fundadores';
  try {
    const r = await fetch('/api/parceiros', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    const d = await r.json();
    if (!r.ok) {
      msgEl.textContent = d.error || 'Erro no cadastro.';
      msgEl.className = 'form-msg error';
      submitBtn.disabled = false;
      submitBtn.textContent = 'Garantir vaga';
      await loadRegioes();
      return;
    }
    msgEl.textContent = 'Vaga(s) reservada(s)! Voce sera contatado em instantes para finalizar contrato e pagamento.';
    msgEl.className = 'form-msg success';
    submitBtn.style.display = 'none';
    selecionadas.clear();
    await loadRegioes();
    setTimeout(() => { closeModal(); submitBtn.style.display = 'block'; submitBtn.disabled = false; submitBtn.textContent = 'Garantir vaga'; form.reset(); }, 4000);
  } catch (e) {
    msgEl.textContent = 'Erro de rede. Tente novamente.';
    msgEl.className = 'form-msg error';
    submitBtn.disabled = false;
    submitBtn.textContent = 'Garantir vaga';
  }
}

document.querySelectorAll('.faq-item').forEach(item => {
  item.querySelector('.faq-q').addEventListener('click', () => item.classList.toggle('open'));
});

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, { threshold: 0.15 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

setupHeroSlider();
loadRegioes();
setInterval(loadRegioes, 30000);
</script>

</body>
</html>`;
}

module.exports = { render };
