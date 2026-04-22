# Sprint 1 - Base Operacional e Importacao

## Objetivo

Estabelecer a estrutura hierarquica (Imobiliaria / Gestor / Corretor), permitir importacao em massa de imoveis por link, criar o fluxo de vinculacao obrigatoria e implementar controle de visibilidade e canais de publicacao. Toda a operacao via WhatsApp com uma galeria web auxiliar para acoes em lote.

## Funcionalidades entregues

### 1. Cadastros hierarquicos

**ADM > Imobiliaria > Gestor > Corretor**

- Cadastro de Imobiliaria (somente ADM)
- Cadastro de Gestor (somente ADM, vinculado a uma imobiliaria)
- Cadastro de Corretor (ADM ou Gestor)
  - Corretor Autonomo: sem vinculo com imobiliaria
  - Corretor Vinculado: pertence a uma imobiliaria

### 2. Hierarquia de permissoes

| Papel    | Pode fazer                                                                 |
|----------|----------------------------------------------------------------------------|
| ADM      | Cadastrar imobiliarias, gestores, corretores. Vincular, excluir, editar qualquer imovel. Acesso a todas as funcoes de Gestor. |
| Gestor   | Cadastrar corretores da sua imobiliaria. Vincular imoveis da sua imobiliaria. Definir visibilidade e canais. |
| Corretor | Gerenciar apenas os proprios imoveis.                                      |

### 3. Importacao em massa por URL

- Comando `importar [URL]` via WhatsApp
- Scraping com IA (GPT-4o) - funciona com qualquer site (nao depende de parser especifico)
- Deteccao automatica de:
  - Pagina de listagem (extrai links individuais)
  - Pagina de detalhe (extrai dados do imovel)
- Campos capturados: titulo, descricao, preco, tipo, quartos, metragem, bairro, localizacao, imagens
- Imagens baixadas para `/wp-content/uploads/imported/YYYY/MM/`
- Imoveis entram com status `rascunho`
- Deteccao de duplicatas via `source_url`

### 4. Galeria web com multi-selecao

- Comando `galeria` via WhatsApp envia link temporario (token, 24h)
- Interface web responsiva (desktop + mobile)
- Cards compactos (foto + titulo + preco)
- Selecao multipla com clique
- Acoes em lote:
  - Vincular varios imoveis a um corretor
  - Marcar como Explicito ou Oculto
  - Ligar/desligar canais
  - Publicar
  - Perguntar sobre Curadoria (pula para Sprint 2 ou publica direto)
  - Excluir (somente ADM)
- Filtro por status: Todos, Rascunho, Vinculado, Publicado, Oculto, Aguardando Curadoria

### 5. Vinculacao obrigatoria

- Regra: `Imovel -> Corretor (-> Imobiliaria opcional)`
- Imovel sem corretor nao pode ser publicado
- Quando vinculado a corretor com imobiliaria, o `imobiliaria_id` do imovel e preenchido automaticamente

### 6. Controle de visibilidade

- `visibility = 'explicito'`: aparece no site, Instagram e WhatsApp
- `visibility = 'oculto'`: aparece apenas no WhatsApp (site e Instagram filtram)

### 7. Canais de publicacao (independentes)

- `publish_site` (padrao: true para explicito)
- `publish_instagram` (padrao: false)
- `publish_campanhas` (padrao: false)
- `publish_atendimento_privado` (padrao: true)

### 8. Fluxo Curadoria (preparacao para Sprint 2)

- Apos vinculacao, o sistema pergunta na galeria: "Deseja Curadoria com IA?"
- Sim -> status `aguardando_curadoria` (Sprint 2 implementa o processamento)
- Nao -> publica direto

### 9. Ciclo de vida do imovel

```
rascunho -> vinculado -> publicado
                      \-> aguardando_curadoria (Sprint 2)
                                            \-> publicado
publicado <-> oculto
publicado -> inativo / vendido
```

## Comandos WhatsApp

### ADM
- `cadastrar imobiliaria`
- `cadastrar gestor`
- `cadastrar corretor`
- `vincular [ID] [nome corretor]`
- `desvincular [ID]`
- `excluir [ID]`
- `corretor [ID]`

### ADM e Gestor
- `importar [URL]`
- `pendentes`
- `galeria`
- `oculto [ID]` / `explicito [ID]`
- `publicar [ID] [canal]` / `despublicar [ID] [canal]`
- `aprovar [ID]` / `rejeitar [ID]`
- `cancelar` (durante cadastro)
- `ajuda`

Canais validos: `site`, `instagram`, `campanhas`, `privado`

## Endpoints da API

### Imobiliarias
- `GET  /api/imobiliarias`
- `POST /api/imobiliarias`
- `GET  /api/imobiliarias/:id`
- `PUT  /api/imobiliarias/:id`
- `DELETE /api/imobiliarias/:id` (soft delete)

### Gestores
- `GET  /api/gestores`
- `POST /api/gestores`
- `PUT  /api/gestores/:id`
- `DELETE /api/gestores/:id`

### Import
- `POST /api/import/url`

### Galeria (protegido por token)
- `GET  /galeria/:token` - pagina HTML
- `GET  /api/galeria/:token/imoveis`
- `POST /api/galeria/:token/batch` - acao em lote
- `POST /api/galeria/:token/curadoria` - marca ou dispensa curadoria

## Schema do banco

Ver `db/sprint_01_schema.sql`.

### Novas tabelas
- `imobiliarias`
- `gestores`
- `sessao_galeria` (tokens da galeria)

### Colunas adicionadas
- `corretores`: creci, email, especialidade, imobiliaria_id, autonomo
- `imoveis`: status, visibility, publish_site, publish_instagram, publish_campanhas, publish_atendimento_privado, imobiliaria_id, source_url, imported_at, imported_by_phone, curadoria_requested

## Criterios de validacao

- [ ] Cadastrar imobiliaria pelo WhatsApp em menos de 2 minutos
- [ ] Cadastrar gestor vinculado a imobiliaria
- [ ] Cadastrar corretor autonomo (sem imobiliaria)
- [ ] Cadastrar corretor vinculado a imobiliaria
- [ ] Importar 10+ imoveis de um link em menos de 15 minutos
- [ ] Imoveis importados entram como rascunho (nao publicam automaticamente)
- [ ] Deteccao de duplicatas: mesmo link importado duas vezes gera aviso, nao duplica
- [ ] Gestor abre galeria pelo link recebido no WhatsApp
- [ ] Gestor seleciona varios imoveis e vincula ao corretor com uma acao
- [ ] Gestor marca varios imoveis como Oculto com uma acao
- [ ] Imovel Oculto nao aparece no site (socasatop.com.br)
- [ ] Imovel Oculto aparece nas buscas do WhatsApp
- [ ] Imovel sem corretor nao pode ser publicado (sistema bloqueia)
- [ ] ADM consegue excluir qualquer imovel
- [ ] Todos os imoveis existentes continuam funcionando
- [ ] Pergunta sobre Curadoria presente no fluxo

## Instrucoes de deploy

1. Executar `db/sprint_01_schema.sql` no Supabase SQL Editor
2. `npm install` (nenhuma nova dependencia adicionada - axios, openai, supabase ja estao no package.json)
3. `pm2 restart socasatop`

## Variaveis de ambiente novas

```
IMPORT_UPLOAD_DIR=/root/socasatop/wp-images/wp-content/uploads/imported
SITE_BASE_URL=https://socasatop.com.br
```

(opcionais - tem defaults razoaveis)
