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
<title>Só Casa Top - Parceiros Fundadores</title>
<meta name="description" content="Entre para os 5 parceiros oficiais da sua região no Só Casa Top. Receba clientes qualificados todos os dias direto no WhatsApp.">
<meta property="og:title" content="Só Casa Top - Parceria Fundadores">
<meta property="og:description" content="5 vagas oficiais por região em Brasília. +1 milhão de visualizações por mês. Clientes qualificados todos os dias direto no WhatsApp.">
<meta property="og:image" content="${HERO_IMAGES[0]}">
<meta property="og:type" content="website">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,600&family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
:root {
  --navy: #0f3a5b;
  --navy-dark: #0a2740;
  --navy-light: #1d5278;
  --teal: #2db8c4;
  --teal-dark: #1f8d97;
  --gold: #2db8c4;
  --gold-dark: #1f8d97;
  --gold-light: #b9e6ea;
  --dark: #0f3a5b;
  --dark-2: #1d5278;
  --light: #fbfbfc;
  --cream: #eef4f8;
  --gray: #6b7280;
  --gray-light: #9ca3af;
  --border: #e3eaf0;
  --success: #10b981;
  --danger: #dc2626;
  --warning: #1f8d97;
}
html { -webkit-text-size-adjust: 100%; }
html, body { width: 100%; overflow-x: hidden; font-family: 'Inter', sans-serif; color: #0f3a5b; background: var(--light); line-height: 1.6; -webkit-font-smoothing: antialiased; }
body { min-height: 100vh; }
.container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }

/* NAV */
nav { padding: 14px 0; background: rgba(255,255,255,0.96); -webkit-backdrop-filter: blur(14px); backdrop-filter: blur(14px); border-bottom: 1px solid var(--border); position: sticky; top: 0; z-index: 100; }
nav .container { display: flex; align-items: center; justify-content: space-between; }
.logo { display: flex; align-items: center; text-decoration: none; }
.logo-img { height: 48px; width: auto; display: block; }
@media (max-width: 600px) {
  .logo-img { height: 38px; }
}
nav .btn-outline { color: #0f3a5b; border-color: var(--border); }
nav .btn-outline:hover { border-color: var(--gold); color: var(--gold); background: transparent; }
.btn { display: inline-flex; align-items: center; justify-content: center; padding: 14px 28px; border-radius: 8px; font-weight: 600; text-decoration: none; cursor: pointer; transition: all 0.25s; border: none; font-size: 15px; font-family: inherit; }
.btn-primary { background: var(--gold); color: #fff; box-shadow: 0 8px 24px -8px rgba(45,184,196,0.6); }
.btn-primary:hover { background: var(--gold-dark); transform: translateY(-2px); box-shadow: 0 12px 32px -8px rgba(45,184,196,0.7); }
.btn-outline { background: transparent; color: #fff; border: 1px solid rgba(255,255,255,0.2); }
.btn-outline:hover { border-color: var(--gold); color: var(--gold); }
.btn-large { padding: 18px 40px; font-size: 17px; }
.btn-pulse { animation: pulseBtn 2s ease-in-out infinite; }
@keyframes pulseBtn {
  0%, 100% { box-shadow: 0 8px 24px -8px rgba(45,184,196,0.6); }
  50% { box-shadow: 0 8px 36px -4px rgba(45,184,196,0.9); }
}

/* HERO */
.hero { position: relative; min-height: 600px; padding: 70px 0 50px; overflow: hidden; background: linear-gradient(180deg, #fbfbfc 0%, #eef4f8 100%); color: #0f3a5b; display: flex; align-items: center; }
@supports (min-height: 88dvh) { .hero { min-height: 88dvh; } }
@media (min-width: 600px) { .hero { min-height: 80vh; } }
.hero-bg { position: absolute; inset: 0; z-index: 0; }
.hero-bg .slide { position: absolute; inset: 0; background-size: cover; background-position: center; opacity: 0; transition: opacity 1.5s ease; transform: scale(1.05); }
.hero-bg .slide.active { opacity: 0.18; animation: kenBurns 12s ease-in-out infinite; }
@keyframes kenBurns {
  0%, 100% { transform: scale(1.05) translate(0,0); }
  50% { transform: scale(1.12) translate(-1%, -1%); }
}
.hero-bg::after { content: ''; position: absolute; inset: 0; background: linear-gradient(180deg, rgba(251,250,247,0.55) 0%, rgba(245,240,230,0.85) 100%); z-index: 1; }
.hero .container { position: relative; z-index: 2; }
.hero-tag { display: inline-block; padding: 7px 16px; border: 1px solid rgba(45,184,196,0.4); background: rgba(45,184,196,0.08); border-radius: 30px; color: var(--gold-dark); font-size: 11px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 24px; animation: fadeUp 0.8s ease both; }
.hero h1 { font-family: 'Playfair Display', serif; font-size: clamp(2rem, 5.2vw, 3.8rem); font-weight: 700; line-height: 1.1; max-width: 880px; margin-bottom: 22px; letter-spacing: -1px; color: #0f3a5b; animation: fadeUp 1s ease 0.2s both; }
.hero h1 em { color: var(--gold-dark); font-style: italic; }
.hero p.lead { font-size: clamp(1rem, 1.4vw, 1.18rem); color: #4a4a5e; max-width: 700px; margin-bottom: 14px; animation: fadeUp 1s ease 0.4s both; font-weight: 400; }
.hero p.warning { font-size: 13px; color: var(--warning); margin-bottom: 32px; animation: fadeUp 1s ease 0.6s both; font-weight: 500; }
.hero-cta { display: flex; gap: 14px; flex-wrap: wrap; animation: fadeUp 1s ease 0.8s both; }
.hero .btn-outline { color: #0f3a5b; border: 1px solid rgba(26,26,46,0.15); }
.hero .btn-outline:hover { border-color: var(--gold); color: var(--gold-dark); }
@keyframes fadeUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
.hero-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 24px; margin-top: 50px; max-width: 720px; animation: fadeUp 1.2s ease 1s both; }
.stat { text-align: left; padding-left: 18px; border-left: 2px solid var(--gold); }
.stat-num { font-family: 'Playfair Display', serif; font-size: clamp(1.5rem, 2.8vw, 2.2rem); font-weight: 700; color: var(--gold-dark); line-height: 1; margin-bottom: 4px; }
.stat-label { font-size: 11px; color: var(--gray); text-transform: uppercase; letter-spacing: 1.5px; }

/* ALERT BANNER */
.alert-banner { background: linear-gradient(90deg, var(--danger), #b91c1c); color: #fff; padding: 14px 0; text-align: center; font-size: 14px; font-weight: 600; position: relative; overflow: hidden; }
.alert-banner::before { content: ''; position: absolute; left: -100%; top: 0; width: 100%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent); animation: shimmer 3s ease-in-out infinite; }
@keyframes shimmer { 0%, 100% { left: -100%; } 50% { left: 100%; } }

/* SECTION BASE */
.section { padding: 100px 0; position: relative; }
.section-tag { display: inline-block; padding: 6px 14px; background: rgba(45,184,196,0.12); color: var(--gold); border-radius: 20px; font-size: 12px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 16px; }
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
.insta-avatar { width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, var(--gold), #7dd0d8); display: flex; align-items: center; justify-content: center; color: #fff; font-family: 'Playfair Display', serif; font-size: 22px; font-weight: 700; flex-shrink: 0; }
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
.receive-card:hover { border-color: rgba(45,184,196,0.4); transform: translateY(-4px); background: rgba(255,255,255,0.06); }
.receive-icon { width: 48px; height: 48px; border-radius: 12px; background: rgba(45,184,196,0.15); display: flex; align-items: center; justify-content: center; margin-bottom: 18px; color: var(--gold); }
.receive-icon svg { width: 22px; height: 22px; }
.receive-card h3 { font-size: 18px; font-weight: 600; margin-bottom: 8px; color: #fff; }
.receive-card p { color: rgba(255,255,255,0.65); font-size: 14px; }

/* VAGAS */
#vagas { background: #fff; }
.regioes-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; margin-top: 48px; }
.regiao-card { background: var(--light); border: 2px solid var(--border); border-radius: 14px; padding: 22px; transition: all 0.3s; cursor: pointer; position: relative; overflow: hidden; }
.regiao-card.disponivel:hover { border-color: var(--gold); transform: translateY(-3px); box-shadow: 0 16px 40px -12px rgba(45,184,196,0.3); }
.regiao-card.esgotado { opacity: 0.55; cursor: not-allowed; background: #f3f4f6; }
.regiao-card.esgotado::after { content: 'ESGOTADO'; position: absolute; top: 12px; right: 12px; background: var(--danger); color: #fff; font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 4px; letter-spacing: 1px; }
.regiao-card.encerrado { opacity: 1; cursor: not-allowed; background: linear-gradient(135deg, #0f3a5b, #0a2740); color: #fff; border-color: var(--gold); }
.regiao-card.encerrado .regiao-nome { color: #fff; }
.regiao-card.encerrado .regiao-status { color: var(--gold); }
.regiao-card.encerrado::after { content: 'ENCERRADO'; position: absolute; top: 12px; right: 12px; background: #0a2740; color: var(--gold); font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 4px; letter-spacing: 1px; border: 1px solid var(--gold); }
.regiao-card.selected { border-color: var(--gold); background: #fff; box-shadow: 0 16px 40px -12px rgba(45,184,196,0.4); transform: translateY(-3px); }
.regiao-card .check { position: absolute; top: 12px; right: 12px; width: 26px; height: 26px; border-radius: 50%; background: var(--gold); color: #fff; display: none; align-items: center; justify-content: center; font-size: 16px; font-weight: 700; }
.regiao-card.selected .check { display: flex; }
.regiao-counter { font-size: 13px; color: var(--gray); margin-bottom: 4px; font-weight: 500; }
.regiao-counter strong { color: var(--gold); font-weight: 700; }
.regioes-toggle-wrapper { text-align: center; margin-top: 24px; }
.btn-toggle-regioes { background: transparent; border: 1px solid var(--border); color: var(--dark); padding: 12px 28px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; display: inline-flex; align-items: center; gap: 8px; font-family: inherit; }
.btn-toggle-regioes:hover { border-color: var(--gold); color: var(--gold); }
.btn-toggle-regioes svg { transition: transform 0.3s; }
.btn-toggle-regioes.expanded svg { transform: rotate(180deg); }

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
.plano-card { max-width: 560px; margin: 0 auto; background: rgba(255,255,255,0.05); backdrop-filter: blur(10px); border: 2px solid rgba(45,184,196,0.4); border-radius: 28px; padding: 50px 44px; text-align: center; position: relative; overflow: hidden; }
.plano-card::before { content: ''; position: absolute; top: -100px; right: -100px; width: 300px; height: 300px; background: radial-gradient(circle, rgba(45,184,196,0.15), transparent); }
.plano-tag { display: inline-block; padding: 6px 18px; background: var(--gold); color: #0a2740; border-radius: 20px; font-size: 11px; font-weight: 800; letter-spacing: 2px; margin-bottom: 20px; }
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
.faq-toggle { width: 28px; height: 28px; border-radius: 50%; background: rgba(45,184,196,0.1); color: var(--gold); display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; transition: all 0.3s; }
.faq-item.open .faq-toggle { transform: rotate(45deg); background: var(--gold); color: #fff; }

/* FINAL CTA */
#final-cta { background: linear-gradient(135deg, var(--gold) 0%, var(--gold-dark) 100%); color: #fff; padding: 100px 0; text-align: center; position: relative; overflow: hidden; }
#final-cta::before { content: ''; position: absolute; inset: 0; background: url('${HERO_IMAGES[0]}') center/cover; opacity: 0.12; }
#final-cta .container { position: relative; z-index: 1; }
#final-cta h2 { font-family: 'Playfair Display', serif; font-size: clamp(2rem, 4.5vw, 3.5rem); font-weight: 700; line-height: 1.15; margin-bottom: 20px; max-width: 760px; margin-left: auto; margin-right: auto; }
#final-cta p { font-size: 18px; color: rgba(255,255,255,0.9); margin-bottom: 36px; max-width: 580px; margin-left: auto; margin-right: auto; }
#final-cta .btn { background: #0a2740; color: #fff; }
#final-cta .btn:hover { background: #0f3a5b; }

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
.reveal { opacity: 1; transform: none; transition: opacity 0.8s ease, transform 0.8s ease; }
.js-reveal-active .reveal:not(.visible) { opacity: 0; transform: translateY(30px); }
.reveal.visible { opacity: 1; transform: translateY(0); }
@media (prefers-reduced-motion: reduce) {
  .reveal, .reveal.visible { opacity: 1 !important; transform: none !important; transition: none !important; }
}
</style>
</head>
<body>

<div class="alert-banner">
  Lago Sul: VAGAS ESGOTADAS &nbsp;&middot;&nbsp; Outras regiões em fase final de preenchimento
</div>

<nav>
  <div class="container">
    <a href="/" class="logo">
      <img src="/img/logo_nav.png" alt="Só Casa Top" class="logo-img">
    </a>
    <a href="#vagas" class="btn btn-primary">Quero ser parceiro</a>
  </div>
</nav>

<section class="hero">
  <div class="hero-bg" id="hero-bg">
    ${HERO_IMAGES.map((url, i) => `<div class="slide${i === 0 ? ' active' : ''}" style="background-image:url('${url}')"></div>`).join('')}
  </div>
  <div class="container">
    <span class="hero-tag">Programa Fundadores &middot; 2026</span>
    <h1>Entre para os <em>5 parceiros oficiais</em> da sua região no Só Casa Top</h1>
    <p class="lead">Receba clientes qualificados todos os dias &mdash; direto no seu WhatsApp.</p>
    <p class="warning">Vagas limitadas por região &middot; R$ 497/mês vitalício para Fundadores</p>
    <div class="hero-cta">
      <a href="#vagas" class="btn btn-primary btn-large btn-pulse">Quero garantir minha vaga</a>
      <a href="#instagram" class="btn btn-outline btn-large">Ver nossos números</a>
    </div>

    <div class="hero-stats">
      <div class="stat"><div class="stat-num" data-count="66200" data-format="thousands-pt">0</div><div class="stat-label">Seguidores no Instagram</div></div>
      <div class="stat"><div class="stat-num" data-count="1000000" data-suffix="+" data-format="million-pt">0</div><div class="stat-label">Visualizações por mês</div></div>
      <div class="stat"><div class="stat-num" data-count="2337" data-format="int-pt">0</div><div class="stat-label">Imóveis publicados</div></div>
      <div class="stat"><div class="stat-num" data-count="5" data-format="int">0</div><div class="stat-label">Vagas por região</div></div>
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
        <span class="section-tag">O que é o Só Casa Top</span>
        <h2>Você não entra para anunciar imóveis. <em>Você entra para participar de um sistema</em> que gera demanda qualificada todos os dias.</h2>
        <p>O Só Casa Top é um <strong>ecossistema de geração, qualificação e conversão de leads</strong> de alto padrão com tecnologia e inteligência artificial.</p>
        <p>Nosso WhatsApp filtra cada lead com IA antes de chegar ao parceiro. Apenas leads reais, qualificados, com poder de compra. Você não perde tempo com curiosos.</p>
        <a href="#vagas" class="btn btn-primary">Quero minha vaga</a>
      </div>
    </div>
  </div>
</section>

<section class="section" id="instagram">
  <div class="container">
    <div class="text-center" style="margin-bottom: 40px;">
      <span class="section-tag">Prova social</span>
      <h2 class="section-title">A maior rede de imóveis de alto padrão do DF</h2>
      <p class="section-subtitle">Números reais do Instagram oficial do Só Casa Top</p>
    </div>
    <div class="insta-card reveal">
      <div class="insta-header">
        <div class="insta-avatar">SC</div>
        <div class="insta-meta">
          <h3>Só Casa <span class="check">&#10003;</span></h3>
          <div class="handle">@socasatop_bsb &middot; Painel Profissional</div>
        </div>
      </div>
      <div class="insta-stats">
        <div class="insta-stat"><div class="insta-stat-num" data-count="2337" data-format="int-pt">0</div><div class="insta-stat-label">Posts</div></div>
        <div class="insta-stat"><div class="insta-stat-num" data-count="66200" data-format="thousands-pt">0</div><div class="insta-stat-label">Seguidores</div></div>
        <div class="insta-stat"><div class="insta-stat-num" data-count="1000000" data-suffix="+" data-format="million-pt">0</div><div class="insta-stat-label">Visualizações/mês</div></div>
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
      <span class="section-tag">Benefícios</span>
      <h2 class="section-title">O que você recebe como parceiro fundador</h2>
      <p class="section-subtitle">Tudo o que você precisa para vender mais com menos esforço</p>
    </div>
    <div class="receive-grid">
      <div class="receive-card reveal">
        <div class="receive-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.663 17h4.673M12 3v1M3 12H2M22 12h-1M5.6 5.6l.7.7M18.4 5.6l-.7.7M12 17a5 5 0 1 1 0-10 5 5 0 0 1 0 10z"/><path d="M9 21h6"/></svg></div>
        <h3>IA integrada</h3>
        <p>Automação de atendimento e qualificação de leads em tempo real.</p>
      </div>
      <div class="receive-card reveal">
        <div class="receive-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg></div>
        <h3>Leads qualificados</h3>
        <p>Clientes reais direto no seu WhatsApp &mdash; sem perder tempo com curiosos.</p>
      </div>
      <div class="receive-card reveal">
        <div class="receive-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div>
        <h3>Proteção de comissão</h3>
        <p>Sistema com ID exclusivo de lead &mdash; carimbo de origem por 12 meses.</p>
      </div>
      <div class="receive-card reveal">
        <div class="receive-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg></div>
        <h3>Geração de demanda</h3>
        <p>Não é portal. É máquina de clientes &mdash; movida por IA e mídia.</p>
      </div>
      <div class="receive-card reveal">
        <div class="receive-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></div>
        <h3>Exclusividade territorial</h3>
        <p>Apenas 5 parceiros por região. Sua presença é amplificada, não diluída.</p>
      </div>
      <div class="receive-card reveal">
        <div class="receive-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></div>
        <h3>Posicionamento de autoridade</h3>
        <p>Apareça como referência local na maior plataforma de alto padrão do DF.</p>
      </div>
    </div>
  </div>
</section>

<section class="section" id="vagas">
  <div class="container">
    <div class="text-center">
      <span class="section-tag">Vagas em tempo real</span>
      <h2 class="section-title">Vagas disponíveis por região</h2>
      <p class="section-subtitle">Atualizado em tempo real. As vagas se esgotam. Garanta a sua agora.</p>
    </div>
    <div class="regioes-grid" id="regioes-grid">
      <p style="grid-column: 1/-1; text-align:center; color:var(--gray);">Carregando regiões...</p>
    </div>
    <div class="regioes-toggle-wrapper" id="regioes-toggle-wrapper" style="display:none;">
      <button class="btn-toggle-regioes" id="btn-toggle-regioes" onclick="toggleRegioesView()">
        <span id="btn-toggle-text">Ver todas as regiões</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
      </button>
    </div>
    <div class="summary-bar" id="summary-bar">
      <div class="summary-info">
        <span class="count" id="summary-count">0 regiões selecionadas</span>
        <span class="total" id="summary-total">R$ 0,00 / mês</span>
      </div>
      <button class="btn btn-primary btn-large" onclick="abrirCadastroMulti()">Quero garantir minhas vagas</button>
    </div>
  </div>
</section>

<section class="section" id="plano">
  <div class="container">
    <div class="text-center">
      <span class="section-tag" style="background:rgba(45,184,196,0.2); color:var(--gold-light);">Oferta Fundadores</span>
      <h2 class="section-title" style="color:#fff;">Plano Fundadores</h2>
      <p class="section-subtitle" style="color:rgba(255,255,255,0.65);">Condição especial. Vitalícia. Apenas para os primeiros parceiros.</p>
    </div>
    <div class="plano-card reveal">
      <span class="plano-tag">FUNDADORES</span>
      <div class="plano-preco">R$ 497<small>/mês</small></div>
      <span class="plano-vitalicio">Preço vitalício</span>
      <p class="plano-warning">Este valor nunca mais será oferecido após esta fase</p>
      <ul class="plano-features">
        <li>Inclusão ilimitada de imóveis</li>
        <li>Leads qualificados pela IA</li>
        <li>Vaga reservada na sua região</li>
        <li>WhatsApp integrado</li>
        <li>Curadoria com IA opcional</li>
        <li>Suporte prioritário</li>
        <li>Sem fidelidade. Cancele quando quiser</li>
      </ul>
      <a href="#vagas" class="btn btn-primary btn-large btn-pulse" style="width:100%;">Quero garantir minha vaga</a>
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
      <span class="section-tag">Modelo de comissão</span>
      <h2 class="section-title">Quanto mais você vende, menor a nossa comissão</h2>
      <p class="section-subtitle">Você não paga comissão fixa. Trabalhamos juntos pelo melhor resultado.</p>
    </div>
    <div class="com-grid" style="grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); max-width: 960px;">
      <div class="com-card reveal"><div class="com-percent">15%</div><h4>Alta performance</h4><p>Resposta rápida, funil atualizado, conversão alta. Você mantém 85% da comissão.</p></div>
      <div class="com-card reveal"><div class="com-percent">20%</div><h4>Intermediária</h4><p>Boa aderência operacional. Faixa padrão de acompanhamento.</p></div>
      <div class="com-card reveal"><div class="com-percent">25%</div><h4>Em desenvolvimento</h4><p>Parceiros em ramp-up. Investimento maior em suporte e leads.</p></div>
    </div>
    <p class="com-message reveal">Nosso interesse é <em>te ajudar a vender mais</em>. Quanto melhor você performa, melhor para você e para nós.</p>
  </div>
</section>

<section class="section" id="risco">
  <div class="container">
    <div class="risco-icon">0</div>
    <h2 class="section-title">Zero risco</h2>
    <p class="risco-text">21 dias de experiência completa. Sem compromisso. Sem fidelidade &mdash; nem agora, nem nunca.</p>
    <p class="risco-text">Você pode sair a qualquer momento.</p>
    <div class="risco-bullets">
      <div class="risco-bullet">21 dias gratuitos completos</div>
      <div class="risco-bullet">Sem taxa de adesão</div>
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
      <p class="section-subtitle">Buscamos profissionais que já atuam no alto padrão</p>
    </div>
    <div class="req-list">
      <div class="req-card reveal"><div class="req-num">REQ 01</div><div class="req-text">Mínimo de 30 imóveis ativos</div></div>
      <div class="req-card reveal"><div class="req-num">REQ 02</div><div class="req-text">Ticket acima de R$ 1,5 milhão</div></div>
      <div class="req-card reveal"><div class="req-num">REQ 03</div><div class="req-text">Comissão mínima de 4%</div></div>
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
      <div class="faq-item"><div class="faq-q">Como funciona a exclusividade por região?<span class="faq-toggle">+</span></div><div class="faq-a">Cada região tem no máximo 5 parceiros oficiais. Quando uma vaga é ocupada, ela só abre novamente se algum parceiro sair. Isso garante que sua presença seja amplificada e não diluída.</div></div>
      <div class="faq-item"><div class="faq-q">O preço de R$ 497 é realmente vitalício?<span class="faq-toggle">+</span></div><div class="faq-a">Sim. Para os parceiros Fundadores (primeiros 5 por região), o valor de R$ 497/mês nunca aumenta enquanto a parceria estiver ativa. Após esta fase, novos parceiros pagarão R$ 997, depois R$ 1.497 e R$ 2.000+.</div></div>
      <div class="faq-item"><div class="faq-q">Como são os 21 dias gratuitos?<span class="faq-toggle">+</span></div><div class="faq-a">Você tem acesso total à plataforma sem nenhuma cobrança. No 22º dia a primeira mensalidade é cobrada automaticamente. Você pode cancelar a qualquer momento antes ou depois.</div></div>
      <div class="faq-item"><div class="faq-q">Quais imóveis posso trabalhar?<span class="faq-toggle">+</span></div><div class="faq-a">Apenas imóveis de alto padrão acima de R$ 1,5 milhão na nossa base. Você pode importar imóveis dos seus sites, cadastrar manualmente ou usar nossa Curadoria com IA.</div></div>
      <div class="faq-item"><div class="faq-q">Como funciona a comissão?<span class="faq-toggle">+</span></div><div class="faq-a">15% para parceiros de alta performance, 20% para intermediária e 25% para parceiros em ramp-up. Quanto mais você vende, menor nossa porcentagem &mdash; nosso interesse é que você venda muito.</div></div>
      <div class="faq-item"><div class="faq-q">Existe taxa de adesão ou setup?<span class="faq-toggle">+</span></div><div class="faq-a">Não. Apenas a mensalidade. Sem taxa de adesão, sem fidelidade. Você paga apenas enquanto está ativo.</div></div>
      <div class="faq-item"><div class="faq-q">Posso participar de mais de uma região?<span class="faq-toggle">+</span></div><div class="faq-a">Sim. Você seleciona quantas regiões quiser e o valor é calculado: R$ 497 por região. Exemplo: 2 regiões = R$ 994/mês, 3 regiões = R$ 1.491/mês.</div></div>
      <div class="faq-item"><div class="faq-q">Como funciona o carimbo de origem do lead?<span class="faq-toggle">+</span></div><div class="faq-a">Todo lead gerado pela plataforma recebe ID único e fica registrado por 12 meses. Vendas concretizadas nesse período geram a comissão do Só Casa Top conforme régua de performance, mesmo que a venda seja fechada fora da plataforma.</div></div>
      <div class="faq-item"><div class="faq-q">Por que Lago Sul está encerrado?<span class="faq-toggle">+</span></div><div class="faq-a">As 5 vagas de Lago Sul já foram preenchidas nesta fase do programa Fundadores. A região poderá reabrir caso algum parceiro saia ou em fases futuras. Considere outras regiões premium como Lago Norte, Jardim Botânico ou Park Sul.</div></div>
    </div>
  </div>
</section>

<section id="final-cta">
  <div class="container">
    <h2>Garanta sua vaga antes que sua região seja fechada</h2>
    <p>Após o preenchimento das 5 vagas, sua região fica indisponível. Quando alguém sair, será priorizado quem entrou primeiro na lista de espera.</p>
    <a href="#vagas" class="btn btn-large btn-pulse">Quero agora</a>
  </div>
</section>

<footer>
  <div class="container">
    Só Casa Top &middot; Imóveis de Alto Padrão em Brasília<br>
    <a href="https://instagram.com/socasatop_bsb" target="_blank">@socasatop_bsb</a>
  </div>
</footer>

<div class="modal-overlay" id="modal-overlay">
  <div class="modal">
    <button class="modal-close" onclick="closeModal()">&times;</button>
    <h2 id="modal-title">Garantir vaga</h2>
    <p class="modal-subtitle" id="modal-subtitle"></p>
    <form id="form-cadastro" onsubmit="enviarCadastro(event)">
      <input type="hidden" name="regiao_id" id="form-regiao-id">
      <div class="form-group">
        <label>Sou *</label>
        <div style="display: flex; gap: 16px; padding: 8px 0;">
          <label style="display: flex; align-items: center; gap: 6px; font-weight: normal; cursor: pointer;">
            <input type="radio" name="tipo_parceiro" value="corretor" checked onchange="onTipoParceiroChange()"> Corretor (PF)
          </label>
          <label style="display: flex; align-items: center; gap: 6px; font-weight: normal; cursor: pointer;">
            <input type="radio" name="tipo_parceiro" value="imobiliaria" onchange="onTipoParceiroChange()"> Imobiliária (PJ)
          </label>
        </div>
      </div>
      <div class="form-group"><label>Nome completo *</label><input type="text" name="nome" required></div>
      <div class="form-group"><label>WhatsApp (com DDD) *</label><input type="tel" name="whatsapp" placeholder="(61) 99999-9999" required></div>
      <div class="form-group"><label>Email *</label><input type="email" name="email" required></div>
      <div class="form-group"><label>CPF ou CNPJ *</label><input type="text" name="cpf_cnpj" id="cpf-cnpj-input" required oninput="onCpfCnpjInput()"></div>
      <div class="form-group"><label>Endereço</label><input type="text" name="endereco" placeholder="Rua, número, bairro, cidade - UF"></div>
      <div class="form-group"><label>CRECI (opcional)</label><input type="text" name="creci"></div>
      <div id="pj-fields" style="display:none; padding: 12px; background: var(--cream); border-radius: 8px; margin-bottom: 12px;">
        <p style="font-size: 12px; color: var(--gray); margin-bottom: 10px;">Dados do representante legal (obrigatório para CNPJ):</p>
        <div class="form-group"><label>Nome do representante *</label><input type="text" name="representante_nome" id="rep-nome"></div>
        <div class="form-group" style="margin-bottom: 0;"><label>CPF do representante *</label><input type="text" name="representante_cpf" id="rep-cpf"></div>
      </div>
      <button type="submit" class="btn btn-primary btn-large" style="width:100%; margin-top: 8px;" id="form-submit">Quero garantir minha vaga</button>
      <div class="form-msg" id="form-msg"></div>
    </form>
  </div>
</div>

<script>
window.addEventListener('error', function(e) {
  console.error('[LP error]', e.message, e.filename, e.lineno);
});

if ('IntersectionObserver' in window) {
  document.documentElement.classList.add('js-reveal-active');
}

var regioes = [];

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
    document.getElementById('regioes-grid').innerHTML = '<p style="text-align:center;color:#dc2626;">Erro ao carregar regiões.</p>';
  }
}

const PRECO_POR_REGIAO = 497;
let selecionadas = new Set();
let regioesExpandidas = false;

function isEncerrado(r) { return (r.vagas_total || 0) === 0; }

function regioesParaExibir() {
  if (regioesExpandidas) return regioes;
  const encerradas = regioes.filter(isEncerrado);
  const restantes = regioes.filter(r => !isEncerrado(r))
    .sort((a, b) => (b.vagas_ocupadas || 0) - (a.vagas_ocupadas || 0));
  return [...encerradas, ...restantes.slice(0, 3)];
}

function renderRegioes() {
  const exibir = regioesParaExibir();
  const html = exibir.map(r => {
    const encerrado = isEncerrado(r);
    const dotsOcupadas = Array(r.vagas_ocupadas).fill('<span class="vaga-dot ocupada"></span>').join('');
    const dotsLivres = Array(Math.max(0, r.vagas_total - r.vagas_ocupadas)).fill('<span class="vaga-dot livre"></span>').join('');
    let klass;
    if (encerrado) klass = 'encerrado';
    else if (r.esgotado) klass = 'esgotado';
    else klass = 'disponivel';
    if (selecionadas.has(r.id)) klass += ' selected';

    let statusText;
    let statusClass = 'disponivel';
    if (encerrado) {
      statusText = 'Vagas esgotadas';
      statusClass = 'esgotado';
    } else if (r.esgotado) {
      statusText = 'Vagas esgotadas';
      statusClass = 'esgotado';
    } else if (r.vagas_disponiveis === 1) {
      statusText = 'Última vaga!';
      statusClass = 'last';
    } else {
      statusText = r.vagas_disponiveis + ' vagas disponíveis';
    }

    let counter;
    if (encerrado) {
      counter = '<strong>5</strong> de 5 vagas preenchidas';
    } else {
      counter = '<strong>' + r.vagas_ocupadas + '</strong> de ' + r.vagas_total + ' vagas preenchidas';
    }

    return '<div class="regiao-card ' + klass + '" data-id="' + r.id + '" onclick="toggleRegiao(' + r.id + ', ' + encerrado + ', ' + r.esgotado + ')">' +
      '<div class="regiao-nome">' + r.nome + '</div>' +
      '<div class="regiao-counter">' + counter + '</div>' +
      (encerrado ? '<div class="regiao-vagas">' + Array(5).fill('<span class="vaga-dot ocupada"></span>').join('') + '</div>' : '<div class="regiao-vagas">' + dotsOcupadas + dotsLivres + '</div>') +
      '<div class="regiao-status ' + statusClass + '">' + statusText + '</div>' +
      '<div class="check">v</div>' +
      '</div>';
  }).join('');
  document.getElementById('regioes-grid').innerHTML = html;

  const totalAtivas = regioes.filter(r => !isEncerrado(r)).length;
  const ocultas = totalAtivas - 3;
  const wrapper = document.getElementById('regioes-toggle-wrapper');
  const txt = document.getElementById('btn-toggle-text');
  const btn = document.getElementById('btn-toggle-regioes');
  if (ocultas > 0) {
    wrapper.style.display = 'block';
    if (regioesExpandidas) {
      txt.textContent = 'Ver menos';
      btn.classList.add('expanded');
    } else {
      txt.textContent = 'Ver mais ' + ocultas + ' regiões';
      btn.classList.remove('expanded');
    }
  } else {
    wrapper.style.display = 'none';
  }

  atualizarResumo();
}

function toggleRegioesView() {
  regioesExpandidas = !regioesExpandidas;
  renderRegioes();
}

function toggleRegiao(regiaoId, encerrado, esgotado) {
  if (encerrado) { alert('Lago Sul está encerrado nesta fase do programa.'); return; }
  if (esgotado) { alert('Esta região está esgotada. Aguarde a abertura de uma vaga.'); return; }
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
  document.getElementById('summary-count').textContent = count + (count > 1 ? ' regiões selecionadas' : ' região selecionada');
  document.getElementById('summary-total').textContent = 'R$ ' + total.toLocaleString('pt-BR') + ',00 / mês';
}

function abrirCadastroMulti() {
  if (selecionadas.size === 0) { alert('Selecione pelo menos uma região.'); return; }
  const nomes = regioes.filter(r => selecionadas.has(r.id)).map(r => r.nome);
  document.getElementById('modal-title').textContent = 'Garantir ' + (nomes.length > 1 ? 'vagas' : 'vaga');
  document.getElementById('modal-subtitle').innerHTML = '<strong>Regiões:</strong> ' + nomes.join(', ') + '<br><strong>Total:</strong> R$ ' + (nomes.length * PRECO_POR_REGIAO).toLocaleString('pt-BR') + ',00/mês (21 dias grátis)';
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

function getTipoParceiro() {
  var sel = document.querySelector('input[name="tipo_parceiro"]:checked');
  return sel ? sel.value : 'corretor';
}

function onTipoParceiroChange() {
  var tipo = getTipoParceiro();
  var pj = document.getElementById('pj-fields');
  var nome = document.getElementById('rep-nome');
  var cpf = document.getElementById('rep-cpf');
  var cpfInput = document.getElementById('cpf-cnpj-input');
  if (!pj) return;
  var show = (tipo === 'imobiliaria');
  pj.style.display = show ? 'block' : 'none';
  if (nome) nome.required = show;
  if (cpf) cpf.required = show;
  if (cpfInput) cpfInput.placeholder = show ? 'CNPJ (apenas numeros)' : 'CPF (apenas numeros)';
}

function onCpfCnpjInput() {
  var el = document.getElementById('cpf-cnpj-input');
  if (!el) return;
  var digits = (el.value || '').replace(/\D/g, '');
  var isPJ = digits.length > 11;
  // auto-switch radio if user types CNPJ length
  var radioPJ = document.querySelector('input[name="tipo_parceiro"][value="imobiliaria"]');
  var radioPF = document.querySelector('input[name="tipo_parceiro"][value="corretor"]');
  if (isPJ && radioPJ && !radioPJ.checked) { radioPJ.checked = true; onTipoParceiroChange(); }
  else if (!isPJ && digits.length === 11 && radioPF && !radioPF.checked) { radioPF.checked = true; onTipoParceiroChange(); }
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
    msgEl.textContent = 'Vaga(s) reservada(s)! Você será contatado em instantes para finalizar contrato e pagamento.';
    msgEl.className = 'form-msg success';
    submitBtn.style.display = 'none';
    selecionadas.clear();
    await loadRegioes();
    setTimeout(() => { closeModal(); submitBtn.style.display = 'block'; submitBtn.disabled = false; submitBtn.textContent = 'Quero garantir minha vaga'; form.reset(); }, 4000);
  } catch (e) {
    msgEl.textContent = 'Erro de rede. Tente novamente.';
    msgEl.className = 'form-msg error';
    submitBtn.disabled = false;
    submitBtn.textContent = 'Garantir vaga';
  }
}

try {
  document.querySelectorAll('.faq-item').forEach(function(item) {
    var q = item.querySelector('.faq-q');
    if (q) q.addEventListener('click', function() { item.classList.toggle('open'); });
  });
} catch(e) { console.error('faq', e); }

try {
  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) entry.target.classList.add('visible');
      });
    }, { threshold: 0.15 });
    document.querySelectorAll('.reveal').forEach(function(el) { observer.observe(el); });
  } else {
    document.querySelectorAll('.reveal').forEach(function(el) { el.classList.add('visible'); });
  }
} catch(e) {
  console.error('reveal', e);
  document.querySelectorAll('.reveal').forEach(function(el) { el.classList.add('visible'); });
}

function formatCount(n, format) {
  n = Math.round(n);
  if (format === 'million-pt') {
    if (n >= 1000000) {
      var m = n / 1000000;
      var s = (m % 1 === 0) ? String(Math.round(m)) : m.toFixed(1).replace('.', ',');
      return s + ' milh' + (Math.round(m) === 1 && m < 1.05 ? 'ão' : 'ões');
    }
    return formatCount(n, 'thousands-pt');
  }
  if (format === 'thousands-pt') {
    if (n >= 1000) {
      var k = n / 1000;
      var s = (k % 1 === 0) ? String(Math.round(k)) : k.toFixed(1).replace('.', ',');
      return s + ' mil';
    }
    return String(n);
  }
  if (format === 'int-pt') {
    return n.toLocaleString('pt-BR');
  }
  return String(n);
}

function animateCount(el) {
  if (el.dataset.counted === '1') return;
  el.dataset.counted = '1';
  var target = parseInt(el.dataset.count, 10) || 0;
  var format = el.dataset.format || 'int';
  var prefix = el.dataset.prefix || '';
  var suffix = el.dataset.suffix || '';
  var dur = 1600;
  var start = performance.now();
  function tick(now) {
    var p = Math.min(1, (now - start) / dur);
    var eased = 1 - Math.pow(1 - p, 3);
    var val = target * eased;
    el.textContent = prefix + formatCount(val, format) + suffix;
    if (p < 1) requestAnimationFrame(tick);
    else el.textContent = prefix + formatCount(target, format) + suffix;
  }
  requestAnimationFrame(tick);
}

try {
  if ('IntersectionObserver' in window) {
    var countObserver = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          countObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    document.querySelectorAll('[data-count]').forEach(function(el) {
      el.textContent = formatCount(0, el.dataset.format || 'int');
      countObserver.observe(el);
    });
  } else {
    document.querySelectorAll('[data-count]').forEach(function(el) {
      var target = parseInt(el.dataset.count, 10) || 0;
      var format = el.dataset.format || 'int';
      var suffix = el.dataset.suffix || '';
      el.textContent = (el.dataset.prefix || '') + formatCount(target, format) + suffix;
    });
  }
} catch(e) {
  console.error('count', e);
}

try { setupHeroSlider(); } catch(e) { console.error('hero', e); }
try { loadRegioes(); setInterval(loadRegioes, 30000); } catch(e) { console.error('regioes', e); }
</script>

</body>
</html>`;
}

module.exports = { render };
