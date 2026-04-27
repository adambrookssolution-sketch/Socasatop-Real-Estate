const supabase = require('../config/supabase');
const aiCurator = require('../services/ai_curator');
const imageCurator = require('../services/image_curator');
const creditos = require('../services/creditos');
const permissions = require('../services/permissions');

const CUSTO_DESCRICAO = 1;
const CUSTO_IMAGEM_BASICA = 1;
const CUSTO_IMAGEM_DECORADA = 3;

async function findParceiro(phone) {
  if (permissions.isADM(phone)) return { tipo: 'adm', id: 0 };
  const gestor = await permissions.getGestor(phone);
  if (gestor) return { tipo: 'gestor', id: gestor.id, imobiliaria_id: gestor.imobiliaria_id };
  const corretor = await permissions.getCorretor(phone);
  if (corretor) return { tipo: 'corretor', id: corretor.id, imobiliaria_id: corretor.imobiliaria_id };
  return null;
}

async function podeGerenciarImovel(parceiro, imovelId) {
  if (parceiro.tipo === 'adm') return true;
  const { data } = await supabase
    .from('imoveis')
    .select('corretor_id, imobiliaria_id')
    .eq('id', imovelId)
    .maybeSingle();
  if (!data) return false;
  if (parceiro.tipo === 'corretor' && data.corretor_id === parceiro.id) return true;
  if (parceiro.tipo === 'gestor' && parceiro.imobiliaria_id && data.imobiliaria_id === parceiro.imobiliaria_id) return true;
  return false;
}

async function solicitarCuradoria({ phone, imovelId, tipo }) {
  const parceiro = await findParceiro(phone);
  if (!parceiro) throw new Error('Voce nao tem permissao para usar a Curadoria.');
  if (!(await podeGerenciarImovel(parceiro, imovelId))) {
    throw new Error('Voce nao tem permissao para curar este imovel.');
  }

  const { data: imovel } = await supabase.from('imoveis').select('*').eq('id', imovelId).maybeSingle();
  if (!imovel) throw new Error('Imovel nao encontrado.');

  let custo = 0;
  if (tipo === 'descricao') custo = CUSTO_DESCRICAO;
  else if (tipo === 'imagens') custo = (imovel.images || []).filter(u => typeof u === 'string' && /\.(jpg|jpeg|png|webp)$/i.test(u)).length * CUSTO_IMAGEM_DECORADA;
  else if (tipo === 'completa') custo = CUSTO_DESCRICAO + (imovel.images || []).filter(u => typeof u === 'string' && /\.(jpg|jpeg|png|webp)$/i.test(u)).length * CUSTO_IMAGEM_DECORADA;
  else throw new Error('Tipo invalido. Use: descricao, imagens, completa');

  if (parceiro.tipo !== 'adm') {
    const saldo = await creditos.getSaldo(parceiro.tipo, parceiro.id);
    if ((saldo.creditos_disponiveis || 0) < custo) {
      throw new Error('Saldo insuficiente. Voce tem ' + (saldo.creditos_disponiveis || 0) + ' creditos, necessarios: ' + custo + '. Compre creditos antes.');
    }
  }

  const { data: job, error } = await supabase
    .from('curadoria_jobs')
    .insert({
      imovel_id: imovelId,
      solicitado_por_phone: phone,
      tipo: tipo,
      status: 'pendente',
      custo_creditos: custo,
      versao_anterior: { titulo: imovel.titulo, details: imovel.details, images: imovel.images },
    })
    .select()
    .single();
  if (error) throw error;

  setImmediate(async () => {
    try {
      await processarJob(job.id, parceiro);
    } catch (e) {
      await supabase
        .from('curadoria_jobs')
        .update({ status: 'erro', erro_msg: e.message, pronto_at: new Date().toISOString() })
        .eq('id', job.id);
    }
  });

  return { job_id: job.id, custo: custo, tipo: tipo };
}

async function processarJob(jobId, parceiro) {
  const { data: job } = await supabase.from('curadoria_jobs').select('*').eq('id', jobId).maybeSingle();
  if (!job) return;

  await supabase.from('curadoria_jobs').update({ status: 'processando', iniciado_at: new Date().toISOString() }).eq('id', jobId);

  const { data: imovel } = await supabase.from('imoveis').select('*').eq('id', job.imovel_id).maybeSingle();
  if (!imovel) throw new Error('Imovel sumiu');

  let resultado = {};
  if (job.tipo === 'descricao' || job.tipo === 'completa') {
    const desc = await aiCurator.curarDescricaoCompleta(imovel);
    resultado.descricao = desc;
  }
  if (job.tipo === 'imagens' || job.tipo === 'completa') {
    try {
      const img = await imageCurator.curarImagens({ imovel, opcoes: { melhorarQualidade: true, decorar: true, estiloDecoracao: 'modern', maxImagens: 10 } });
      resultado.imagens = img;
    } catch (e) {
      resultado.imagens_erro = e.message;
    }
  }

  if (parceiro && parceiro.tipo !== 'adm' && job.custo_creditos > 0) {
    try {
      await creditos.debitarCreditos({
        parceiroTipo: parceiro.tipo,
        parceiroId: parceiro.id,
        quantidade: job.custo_creditos,
        imovelId: job.imovel_id,
        motivo: 'curadoria ' + job.tipo,
      });
    } catch (e) {
      throw new Error('Falha ao debitar creditos: ' + e.message);
    }
  }

  await supabase.from('curadoria_jobs').update({
    status: 'pronto',
    versao_nova: resultado,
    pronto_at: new Date().toISOString(),
  }).eq('id', jobId);
}

async function aprovarJob(jobId, phone) {
  const parceiro = await findParceiro(phone);
  if (!parceiro) throw new Error('Sem permissao');

  const { data: job } = await supabase.from('curadoria_jobs').select('*').eq('id', jobId).maybeSingle();
  if (!job) throw new Error('Job nao encontrado');
  if (job.status !== 'pronto') throw new Error('Job nao esta pronto. Status: ' + job.status);
  if (!(await podeGerenciarImovel(parceiro, job.imovel_id))) throw new Error('Sem permissao para este imovel');

  const updates = {};
  const versao = job.versao_nova || {};
  if (versao.descricao) {
    if (versao.descricao.titulo_novo) updates.titulo = versao.descricao.titulo_novo;
    if (versao.descricao.descricao_nova) updates.details = versao.descricao.descricao_nova;
  }
  if (versao.imagens && versao.imagens.versao_nova && Array.isArray(versao.imagens.versao_nova.images)) {
    updates.images = versao.imagens.versao_nova.images;
  }

  if (Object.keys(updates).length > 0) {
    await supabase.from('imoveis').update(updates).eq('id', job.imovel_id);
  }

  await supabase.from('curadoria_jobs').update({ status: 'aprovado', aprovado_at: new Date().toISOString() }).eq('id', jobId);
  return { aplicado: true, updates };
}

async function rejeitarJob(jobId, phone) {
  const parceiro = await findParceiro(phone);
  if (!parceiro) throw new Error('Sem permissao');

  const { data: job } = await supabase.from('curadoria_jobs').select('*').eq('id', jobId).maybeSingle();
  if (!job) throw new Error('Job nao encontrado');
  if (!(await podeGerenciarImovel(parceiro, job.imovel_id))) throw new Error('Sem permissao para este imovel');

  if (parceiro.tipo !== 'adm' && job.custo_creditos > 0 && job.status === 'pronto') {
    try {
      await creditos.reembolsarCreditos({
        parceiroTipo: parceiro.tipo,
        parceiroId: parceiro.id,
        quantidade: job.custo_creditos,
        imovelId: job.imovel_id,
        motivo: 'rejeicao da curadoria',
      });
    } catch (e) { /* log only */ }
  }

  await supabase.from('curadoria_jobs').update({ status: 'rejeitado' }).eq('id', jobId);
  return { rejeitado: true };
}

async function listarJobs({ phone, status, limit = 30 }) {
  const parceiro = await findParceiro(phone);
  if (!parceiro) return [];

  let query = supabase
    .from('curadoria_jobs')
    .select('*, imoveis(id, titulo, neighborhood, corretor_id, imobiliaria_id)')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (status) query = query.eq('status', status);

  const { data } = await query;
  if (!data) return [];

  if (parceiro.tipo === 'adm') return data;
  return data.filter(j => {
    const im = j.imoveis;
    if (!im) return false;
    if (parceiro.tipo === 'corretor' && im.corretor_id === parceiro.id) return true;
    if (parceiro.tipo === 'gestor' && parceiro.imobiliaria_id && im.imobiliaria_id === parceiro.imobiliaria_id) return true;
    return false;
  });
}

async function getJob(jobId) {
  const { data } = await supabase.from('curadoria_jobs').select('*, imoveis(id, titulo)').eq('id', jobId).maybeSingle();
  return data;
}

module.exports = {
  solicitarCuradoria,
  aprovarJob,
  rejeitarJob,
  listarJobs,
  getJob,
  findParceiro,
};
