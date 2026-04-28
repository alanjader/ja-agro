# CHANGELOG — JA Agro Intelligence

## v2.0.0 — 2026-04-28

### ✨ Novos Módulos
- **Talhões** (`modules/admin-talhoes.js`) — CRUD completo com stats (área, irrigados), filtro por fazenda
- **Safras** (`modules/admin-safras.js`) — Cards com KPIs financeiros, status, encerramento rápido
- **Insumos** (`modules/admin-insumos.js`) — Controle de estoque, alertas críticos, ajuste de inventário
- **Máquinas** (`modules/admin-maquinas.js`) — CRUD, horímetro, registro de manutenção
- **Operadores** (`modules/admin-operadores.js`) — CRUD completo com CNH e dados de admissão
- **Lançamentos** (`modules/admin-lancamentos.js`) — Filtros por período/fazenda/safra/categoria, KPIs em tempo real, cálculo automático
- **Exportar** (`modules/admin-exportar.js`) — CSV de lançamentos, safras, insumos e relatório executivo
- **Offline** (`modules/admin-offline.js`) — Fila de sincronização, gestão de erros, sincronização manual

### 🗄️ Banco de Dados
- **Schema completo v2** (`database/schema.sql`):
  - 9 tabelas: fazendas, usuarios, talhoes, safras, categorias_lancamento, insumos, maquinas, operadores, lancamentos, lancamentos_offline, manutencoes
  - 20+ índices incluindo GIN trigram para busca textual
  - Row Level Security (RLS) com políticas por role e fazenda
  - Função helper `get_user_role()` e `get_user_fazenda()`
  - Triggers automáticos: `atualizado_em`, `custo_total`, atualização de totais de safra, desconto de estoque
  - View `vw_dashboard` para KPIs consolidados

### 🔧 Melhorias Técnicas
- Todos os módulos seguem o padrão `window.module_{nome} = async function() {...}`
- Carregamento lazy automático via `loadModule()` existente no admin.html
- Helpers globais reutilizados: `esc()`, `toast()`, `setLoading()`, `showModal()`, `showConfirm()`
- Filtros combinados com debounce em todos os módulos
- Validação de campos obrigatórios antes de cada operação
- Soft delete (ativo=false) em vez de exclusão física
- Exportação CSV com BOM UTF-8 para compatibilidade com Excel

### 📋 Instruções de Implantação

#### 1. Execute o schema no Supabase SQL Editor
```
Supabase Dashboard → SQL Editor → Colar conteúdo de database/schema.sql → Run
```

#### 2. Crie as categorias padrão (já incluídas no schema)
O script já insere 13 categorias padrão (sementes, fertilizantes, defensivos, etc.)

#### 3. Adicione as novas classes CSS ao admin.html (antes de `</style>`)
```css
/* Badges adicionais */
.badge-yellow  { background:#fff8e1; color:#f9a825; }
.badge-red     { background:var(--danger-lt); color:var(--danger); }
.badge-blue    { background:#e3f2fd; color:#1565c0; }
.badge-orange  { background:#fff3e0; color:#e65100; }
.badge-purple  { background:#f3e5f5; color:#6a1b9a; }

/* Stat cards coloridos */
.stat-card.orange::before { background:#ff6d00; }
.stat-card.blue::before   { background:#1565c0; }
```

#### 4. Adicione o helper showConfirm ao admin.html (já pode existir como showModal adaptado)
Se não existir, adicione antes do `initAuth()`:
```js
window.showConfirm = function(msg, onConfirm) {
  showModal('Confirmar', '<div style="padding:8px 0 16px"><p>'+msg+'</p></div>', onConfirm, 'Confirmar', 'btn-danger');
};
```

### 📊 Arquitetura do Banco

```
fazendas (1) ─── (N) talhoes
fazendas (1) ─── (N) safras
fazendas (1) ─── (N) usuarios
fazendas (1) ─── (N) insumos
fazendas (1) ─── (N) maquinas
fazendas (1) ─── (N) operadores
fazendas (1) ─── (N) lancamentos

safras (1) ─── (N) lancamentos
talhoes (1) ─── (N) lancamentos
categorias_lancamento (1) ─── (N) lancamentos
insumos (1) ─── (N) lancamentos
maquinas (1) ─── (N) lancamentos
maquinas (1) ─── (N) manutencoes
operadores (1) ─── (N) lancamentos
usuarios (1) ─── (N) lancamentos_offline
```
