/* Dados institucionais da Monvatti usados na landing. Tudo aqui precisa ser real. */

export const MONVATTI = {
  /**
   * Endereço da landing page oficial da Monvatti. Deixe vazio até existir.
   * Quando preenchido (ex.: "https://..."), o botão "Conheça a Monvatti" e o link do rodapé
   * passam a abrir esse endereço em nova aba. Vazio: continuam levando para /sobre.
   */
  siteOficial: "",

  /** Clientes operados pela consultoria (mesmo número do topo da página). */
  clientes: 150,

  /**
   * Fotos reais da equipe em public/equipe/, cada uma em 2 larguras (1200 e 2000 px, webp).
   * A primeira é a principal (maior). Com a lista vazia, a faixa de fotos não aparece.
   */
  fotosEquipe: [
    {
      base: "/equipe/equipe-palco",
      w: 2000,
      h: 719,
      alt: "Equipe Monvatti reunida no palco do Tray Experience, todos com a camiseta da Monvatti",
      legenda: "Equipe Monvatti no Tray Experience",
    },
    {
      base: "/equipe/equipe-selfie",
      w: 2000,
      h: 971,
      alt: "Equipe Monvatti tirando uma selfie em grupo no palco do evento",
      legenda: "Bastidores do evento",
    },
  ] as { base: string; w: number; h: number; alt: string; legenda: string }[],
};

export function linkInstitucional(): { href: string; externo: boolean } {
  const url = MONVATTI.siteOficial.trim();
  return url ? { href: url, externo: true } : { href: "/sobre", externo: false };
}
