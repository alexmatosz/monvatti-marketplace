export type Canal = {
  id: string;
  nome: string;
  cor: string;
  estado: "ativo" | "breve";
  tagline: string;
  resumo: string;
  diferencial: string;
  itens: { t: string; d: string }[];
};

export const CANAIS: Canal[] = [
  {
    id: "mercado-livre",
    nome: "Mercado Livre",
    cor: "#FFE600",
    estado: "ativo",
    tagline: "O canal mais completo hoje.",
    resumo:
      "O painel aparece dentro do anúncio e da busca, com tudo para decidir preço, produto e posição — sem planilha e sem sair da página.",
    diferencial:
      "Vendas estimadas do concorrente a partir do número público do anúncio — a leitura que a API não entrega pronta.",
    itens: [
      { t: "Métricas do anúncio", d: "Visitas, vendas por dia e por mês, conversão e faturamento estimado." },
      { t: "Concorrência da busca", d: "Quem disputa a 1ª e as demais páginas, com vendas, preço e logística." },
      { t: "Calculadora de margem", d: "Comissão, taxa fixa, frete grátis e imposto descontados do seu preço." },
      { t: "Ranqueamento do anúncio", d: "Em que posição o anúncio aparece para uma palavra-chave." },
      { t: "Tendência por categoria", d: "O ranking oficial de mais vendidos para achar oportunidade de produto." },
      { t: "Logística e tipo", d: "Full, Flex, Coleta ou Correios, e se é Clássico ou Premium." },
      { t: "Exportação para Excel", d: "A busca inteira em uma planilha com um clique." },
      { t: "Conta protegida", d: "Roda pela sua conta vinculada; nunca alteramos preços dos seus anúncios." },
    ],
  },
  {
    id: "shopee",
    nome: "Shopee",
    cor: "#EE4D2D",
    estado: "breve",
    tagline: "Em desenvolvimento.",
    resumo:
      "A mesma leitura de concorrência e margem, adaptada às taxas e à busca da Shopee.",
    diferencial:
      "Margem no padrão da Shopee: comissão, taxa do programa de frete e cupons já no cálculo do lucro.",
    itens: [
      { t: "Vendas estimadas", d: "Leitura do volume do concorrente a partir dos números públicos da Shopee." },
      { t: "Concorrência da busca", d: "Quem aparece nas primeiras posições e por qual preço." },
      { t: "Calculadora de margem Shopee", d: "Comissão, frete e cupons descontados do preço de venda." },
      { t: "Tendência por categoria", d: "Os produtos em alta para achar oportunidade antes de anunciar." },
    ],
  },
  {
    id: "amazon",
    nome: "Amazon",
    cor: "#FF9900",
    estado: "breve",
    tagline: "Em desenvolvimento.",
    resumo:
      "Foco na disputa que define a venda na Amazon: o Buy Box.",
    diferencial:
      "Buy Box e price-to-win: quem está com a caixa de compra e o preço exato para assumir sem derrubar a sua margem.",
    itens: [
      { t: "Buy Box em tempo real", d: "Quem leva a caixa de compra no anúncio e por qual preço." },
      { t: "Preço para ganhar o Buy Box", d: "O valor exato para assumir a oferta principal do anúncio." },
      { t: "Taxas e margem da Amazon", d: "Comissão por categoria e tarifas descontadas do seu preço." },
      { t: "Concorrência da busca", d: "Os vendedores que disputam a mesma palavra-chave." },
    ],
  },
];

export function canalPorId(id: string): Canal | undefined {
  return CANAIS.find((c) => c.id === id);
}
