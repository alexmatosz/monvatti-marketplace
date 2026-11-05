export type Tag = "Novo" | "Em desenvolvimento" | "Planejado";

export type Post = {
  slug: string;
  data: string;
  tag: Tag;
  motivo: "grafico" | "rank" | "sacola" | "caixa" | "pix";
  cor: string;
  titulo: string;
  resumo: string;
  corpo: string[];
};

export const POSTS: Post[] = [
  {
    slug: "extensao-mercado-livre",
    data: "4 de novembro de 2026",
    tag: "Novo",
    motivo: "grafico",
    cor: "#001AD8",
    titulo: "Cadastro aberto e extensão para o Mercado Livre",
    resumo:
      "O painel do Monvatti Marketplaces aparece dentro do anúncio e da busca, com métricas, concorrência e margem em tempo real.",
    corpo: [
      "A primeira versão pública já está de pé: você instala a extensão no Chrome, entra com o seu e-mail e vincula a sua conta do Mercado Livre uma vez.",
      "A partir daí, o painel aparece sozinho dentro de cada anúncio e da busca — com vendas estimadas do concorrente, visitas, conversão, faturamento e a calculadora de margem com comissão, frete e imposto já descontados.",
      "O cadastro pelo e-mail é o que, em seguida, libera o acesso. Nada de planilha e nada de sair da página do marketplace.",
    ],
  },
  {
    slug: "ranqueamento-e-tendencia",
    data: "4 de novembro de 2026",
    tag: "Novo",
    motivo: "rank",
    cor: "#3145FF",
    titulo: "Ranqueamento do anúncio e tendência por categoria",
    resumo:
      "Descubra em que posição um anúncio aparece para uma palavra-chave e quais produtos mais vendem em cada categoria.",
    corpo: [
      "Duas leituras novas entraram no painel. O ranqueamento mostra em que posição um anúncio aparece na busca para a palavra-chave que você digitar.",
      "A tendência por categoria traz o ranking oficial de mais vendidos, para você achar oportunidade de produto com alta demanda antes de investir no estoque.",
    ],
  },
  {
    slug: "shopee-a-caminho",
    data: "Em breve",
    tag: "Em desenvolvimento",
    motivo: "sacola",
    cor: "#EE4D2D",
    titulo: "Shopee a caminho",
    resumo:
      "Concorrência da busca, vendas estimadas e calculadora de margem no padrão da Shopee — comissão, frete e cupons no cálculo do lucro.",
    corpo: [
      "Estamos levando a mesma leitura de concorrência e margem para a Shopee, adaptada às taxas e à busca do canal.",
      "A calculadora de margem vai considerar comissão, taxa do programa de frete e cupons, para o lucro líquido sair certo na Shopee.",
    ],
  },
  {
    slug: "amazon-buy-box",
    data: "Em breve",
    tag: "Em desenvolvimento",
    motivo: "caixa",
    cor: "#FF9900",
    titulo: "Amazon com Buy Box",
    resumo:
      "Quem está com a caixa de compra e o preço exato para assumir o Buy Box sem derrubar a sua margem.",
    corpo: [
      "Na Amazon, a disputa que define a venda é o Buy Box. O Monvatti Marketplaces vai mostrar quem está com a caixa de compra e por qual preço.",
      "E, principalmente, o preço exato para você assumir o Buy Box — o price-to-win — sem derrubar a margem à toa.",
    ],
  },
  {
    slug: "pagamento-por-pix",
    data: "Planejado",
    tag: "Planejado",
    motivo: "pix",
    cor: "#5B6472",
    titulo: "Pagamento por Pix e planos flexíveis",
    resumo:
      "Assinatura mensal, semestral ou anual, sem fidelidade. O acesso fica vinculado à conta que você conectar.",
    corpo: [
      "O pagamento vai ser por Pix, com planos mensal, semestral e anual — sem fidelidade.",
      "O acesso fica vinculado à conta de marketplace que você conectar, garantindo que cada assinatura corresponde a uma conta.",
    ],
  },
];

export function postPorSlug(slug: string): Post | undefined {
  return POSTS.find((p) => p.slug === slug);
}
