/* Logos reais da Monvatti (pasta Marca/, recortadas para /public). */

export function Marca({ size = 24, tom = "azul" }: { size?: number; tom?: "azul" | "branca" }) {
  const src = tom === "branca" ? "/marca-branca.png" : "/marca.png";
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" aria-hidden="true" style={{ height: size, width: "auto" }} />
  );
}

export function Logo({
  tom = "escuro",
  h = 26,
  sufixo = true,
}: {
  tom?: "escuro" | "claro";
  h?: number;
  sufixo?: boolean;
}) {
  const src = tom === "claro" ? "/monvatti-claro.png" : "/monvatti-escuro.png";
  const corSufixo = tom === "claro" ? "text-white/55" : "text-aco";
  const corTraco = tom === "claro" ? "bg-white/25" : "bg-platina";
  return (
    <span className="inline-flex items-center gap-2.5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="Monvatti Marketplaces" style={{ height: h, width: "auto" }} />
      {sufixo ? (
        <>
          <span className={`h-5 w-px ${corTraco}`} aria-hidden="true" />
          <span className={`font-display text-[13px] font-medium leading-none ${corSufixo}`}>Marketplaces</span>
        </>
      ) : null}
    </span>
  );
}
