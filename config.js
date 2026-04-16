// ============================================================
// JA AGRO INTELLIGENCE — Configuração do Supabase
// Este arquivo é importado por todas as páginas do sistema
// NÃO suba este arquivo no GitHub público
// ============================================================

const SUPABASE_URL  = 'https://gohoqgctcqltorfeohom.supabase.co';
const SUPABASE_KEY  = 'sb_publishable_IIGhKrHztb4-JvhN1lKG5A_eqJe3evt';

// Cliente Supabase — disponível globalmente como window.sb
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession:   true,
    detectSessionInUrl: true,
  }
});

// Versão do sistema
const JA_VERSION = '1.0.0';

// URL base do sistema (GitHub Pages)
const JA_BASE_URL = 'https://alanjader.github.io/ja-agro';
