// Antes animava os blocos ao rolar; agora o conteúdo já aparece pronto (site mais limpo).
export function Reveal({
  children,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}
