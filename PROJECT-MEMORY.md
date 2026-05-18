# PROJECT MEMORY — JA Agrotec · Módulo Produtor

> Memória viva do projeto. Atualizada a cada sessão relevante.
> Repositório atual: `alanjader/ja-agro` (pendente de renomeação manual para `ja-agrotec-produtor`).

---

## 1. Visão do Ecossistema

O **JA Agrotec** é o ecossistema principal, composto por três módulos independentes que se integram:

| Módulo | Foco | Status | Repo (alvo) | Supabase |
|---|---|---|---|---|
| **Produtor** | Gestão da fazenda, análises, produção | ✅ Em operação | `ja-agrotec-produtor` | projeto próprio |
| **Cooperativa** | Recebimento, entregas, contratos | 🚧 A criar | `ja-agrotec-cooperativa` | projeto próprio |
| **Agenda** | Agendamentos, planejamento, calendário | 🚧 A criar | `ja-agrotec-agenda` | projeto próprio |

Decisão arquitetural confirmada pelo usuário:
- **Repositórios separados** (um por módulo).
- **Projetos Supabase separados** (isolamento de dados e billing).
- Integração futura via contratos de API + SSO unificado.

---

## 2. Identidade Visual e Naming

- Nome do sistema: **JA Agrotec · Módulo Produtor** (antigo: JA Agro).
- Sigla em headers: **JA AGROTEC** + subtítulo **MÓDULO PRODUTOR**.
- Versão: **1.1.0** (bump da rebrand).
- Toda referência textual `ja-agro` foi migrada para `ja-agrotec` no front-end.
- URLs do repositório ainda apontam para `ja-agro` (pendente de ação manual do usuário).

---

## 3. Sessão atual — Rebrand + Menu Sobre (19 commits)

### Arquivos modificados (rebrand)
- `admin.html` — título, logo da sidebar, link do manifest, grupo “Sobre” com 6 subitens, `_titulos`, subtítulo da sidebar.
- `index.html` — título, logo, footer, manifest.
- `config.js` — `nome`, `versao: '1.1.0'`, `ecossistema`, `modulo`.

### Módulos novos (`modules/`)
- `admin-sobre.js` — página raiz do grupo Sobre.
- `admin-sobre-historia.js` — história do projeto.
- `admin-sobre-ajuda.js` — guia rápido.
- `admin-sobre-troubleshooting.js` — problemas comuns e soluções.
- `admin-sobre-ecossistema.js` — 3 cards (Produtor / Cooperativa / Agenda).
- `admin-sobre-changelog.js` — histórico de versões.

### Infraestrutura criada
- `manifest.json` — PWA básico.
- `vercel.json` — configuração de deploy.
- `README.md` — descrição pública do repositório.
- `docs/ECOSSISTEMA.md` — documento de arquitetura do ecossistema.

### Bug encontrado e corrigido durante validação
**Sintoma:** sub-páginas de Sobre carregavam com “Módulo em construção”.
**Causa raiz:** os módulos declaravam `window.module_sobre_X` (underscore), mas o `loadModule` procurava `window['module_sobre-X']` (hífen, pois `data-module="sobre-historia"`).
**Fix:** trocar para notação de colchetes com hífen em todos os 5 sobre-*.

### Lista cronológica dos 19 commits da sessão
1. `016713f` rebrand admin.html
2. `bccb642` rebrand index.html
3. `fbb9a50` rebrand config.js
4. `2e22f58` feat admin-sobre.js
5. `3dd9cc9` feat admin-sobre-historia.js
6. `e48817a` feat admin-sobre-ajuda.js
7. `27efb5f` feat admin-sobre-troubleshooting.js
8. `aa38d95` feat admin-sobre-ecossistema.js
9. `c253419` feat admin-sobre-changelog.js
10. `ef427aa` feat manifest.json
11. `db385ba` feat vercel.json
12. `83592d4` docs README.md
13. `86ee792` docs/ECOSSISTEMA.md
14. `820812f` fix sobre-historia (bracket notation)
15. `aeadb83` fix sobre-ajuda
16. `67527cc` fix sobre-troubleshooting
17. `04e9729` fix sobre-ecossistema
18. `6a75474` fix sobre-changelog
19. `e84471e` rebrand sidebar subtitle Intelligence → Módulo Produtor

Total acumulado no projeto: **34+ commits**.

---

## 4. Estado atual validável

- Tab title: **JA Agrotec · Módulo Produtor** ✅
- Sidebar: **JA AGROTEC** / **MÓDULO PRODUTOR** ✅
- Menu Sobre com 6 subitens funcionando ✅
- Página Ecossistema com 3 cards (Produtor destacado como “Você está aqui”) ✅
- `manifest.json` exposto para instalação PWA ✅
- Bateria de QA anterior: **0 bugs abertos** ✅

---

## 5. Convenções do projeto (binding)

- Commits direto em `main` estão **autorizados** (fase pré-produção).
- Usuário Alan Jader = ADMIN.
- Fazenda padrão: **Fazenda Águas Claras**.
- Nomenclatura de módulos: `admin-sobre-X.js` → `window['module_sobre-X']` (colchetes + hífen).
- `config.js`: apenas chave **anon** do Supabase (nunca service_role).
- Não renomear o repo pelo agente — isso muda URLs públicas e exige ação manual.

---

## 6. Próximos passos sugeridos

1. **Renomear o repo** `ja-agro` → `ja-agrotec-produtor` (manual). Depois atualizar `urls.base`, `urls.login` em `config.js` e reconfigurar GitHub Pages.
2. **Criar repositório Cooperativa** (`ja-agrotec-cooperativa`) usando este como template.
3. **Criar repositório Agenda** (`ja-agrotec-agenda`).
4. **Definir contrato de integração** Produtor ↔ Cooperativa (fluxo de entrega: contrato, qtde, qualidade, fazenda).
5. **SSO unificado** entre os 3 módulos.
6. **Testar PWA** em dispositivo móvel.
7. **Polimento visual**: logo SVG dedicado, favicons, splash screens.

---

_Atualizado em 18/05/2026 após a sessão de rebrand. Próxima sessão deve começar lendo este arquivo._
