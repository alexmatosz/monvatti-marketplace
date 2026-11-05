/* Logos reais da Monvatti (pasta Marca/, recortadas para /public). */

export function Marca({ size = 24, tom = "azul" }: { size?: number; tom?: "azul" | "branca" }) {
  const src = tom === "branca" ? "/marca-branca.png" : "/marca.png";
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" aria-hidden="true" style={{ height: size, width: "auto" }} />
  );
}

export function Logo({ tom = "escuro", h = 26 }: { tom?: "escuro" | "claro"; h?: number }) {
  const src = tom === "claro" ? "/monvatti-claro.png" : "/monvatti-escuro.png";
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="Monvatti" style={{ height: h, width: "auto" }} />
  );
}
