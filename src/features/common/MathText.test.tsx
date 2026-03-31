import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import MathText from "./MathText";

describe("MathText", () => {
  it("renderiza texto simples sem quebrar", () => {
    render(<MathText text="Texto normal" />);
    expect(screen.getByText("Texto normal")).toBeTruthy();
  });

  it("renderiza formula inline com delimitadores $ $", () => {
    render(<MathText text="Derivada: $\\frac{d}{dx}$" />);
    expect(screen.getByText("Derivada:")).toBeTruthy();
    expect(document.querySelector(".katex")).toBeTruthy();
  });

  it("renderiza formula em bloco com delimitadores $$ $$", () => {
    render(<MathText text="$$E=mc^2$$" block />);
    expect(document.querySelector(".katex-display")).toBeTruthy();
  });
});
