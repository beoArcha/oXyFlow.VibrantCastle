import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import React from "react";
import { setupDomEnvironment, cleanupDom, renderIntoDom } from "@test-utils";
import { Heading, Paragraph, Text, Label, Code } from "../typography";

describe("Typography Design System Primitives (@ui)", () => {
  beforeEach(() => {
    setupDomEnvironment();
  });

  afterEach(async () => {
    await cleanupDom();
  });

  describe("<Heading />", () => {
    it("renders semantic heading tags corresponding to level prop", async () => {
      // Arrange & Act
      const { unmount } = await renderIntoDom(
        <div>
          <Heading level={1}>Heading 1</Heading>
          <Heading level={2}>Heading 2</Heading>
          <Heading level={3}>Heading 3</Heading>
          <Heading level={4}>Heading 4</Heading>
          <Heading level={5}>Heading 5</Heading>
          <Heading level={6}>Heading 6</Heading>
        </div>
      );

      // Assert
      expect(document.querySelector("h1")?.textContent).toBe("Heading 1");
      expect(document.querySelector("h2")?.textContent).toBe("Heading 2");
      expect(document.querySelector("h3")?.textContent).toBe("Heading 3");
      expect(document.querySelector("h4")?.textContent).toBe("Heading 4");
      expect(document.querySelector("h5")?.textContent).toBe("Heading 5");
      expect(document.querySelector("h6")?.textContent).toBe("Heading 6");

      await unmount();
    });

    it("applies gothic, danger, and size variant styles correctly", async () => {
      // Arrange & Act
      const { unmount } = await renderIntoDom(
        <div>
          <Heading level={1} variant="gothic" size="4xl">Gothic Title</Heading>
          <Heading level={3} variant="danger" size="base">Danger Title</Heading>
        </div>
      );

      // Assert
      const h1 = document.querySelector("h1");
      expect(h1?.className).toContain("text-amber-400");
      expect(h1?.className).toContain("font-black");

      const h3 = document.querySelector("h3");
      expect(h3?.className).toContain("text-red-400");

      await unmount();
    });

    it("renders optional leading icon alongside children", async () => {
      // Arrange & Act
      const { unmount } = await renderIntoDom(
        <Heading level={2} icon={<span data-testid="icon">⚔️</span>}>
          Duelist Chamber
        </Heading>
      );

      // Assert
      expect(document.querySelector("[data-testid='icon']")?.textContent).toBe("⚔️");
      expect(document.querySelector("h2")?.textContent).toContain("Duelist Chamber");

      await unmount();
    });

    it("forwards ref to the underlying HTML heading element", async () => {
      // Arrange
      const ref = React.createRef<HTMLHeadingElement>();

      // Act
      const { unmount } = await renderIntoDom(
        <Heading ref={ref} level={2}>Ref Heading</Heading>
      );

      // Assert
      expect(ref.current).not.toBeNull();
      expect(ref.current?.tagName).toBe("H2");

      await unmount();
    });
  });

  describe("<Paragraph />", () => {
    it("renders semantic paragraph element with default and narrator variants", async () => {
      // Arrange & Act
      const { unmount } = await renderIntoDom(
        <div>
          <Paragraph variant="default" size="sm">Standard body text</Paragraph>
          <Paragraph variant="narrator" size="xs">The clockwork mechanism shuddered.</Paragraph>
        </div>
      );

      // Assert
      const paragraphs = document.querySelectorAll("p");
      expect(paragraphs.length).toBe(2);
      expect(paragraphs[0].textContent).toBe("Standard body text");
      expect(paragraphs[0].className).toContain("text-stone-300");

      expect(paragraphs[1].textContent).toBe("The clockwork mechanism shuddered.");
      expect(paragraphs[1].className).toContain("text-amber-100/90");
      expect(paragraphs[1].className).toContain("italic");

      await unmount();
    });

    it("forwards ref to HTMLParagraphElement", async () => {
      // Arrange
      const ref = React.createRef<HTMLParagraphElement>();

      // Act
      const { unmount } = await renderIntoDom(
        <Paragraph ref={ref}>Ref Paragraph</Paragraph>
      );

      // Assert
      expect(ref.current).not.toBeNull();
      expect(ref.current?.tagName).toBe("P");

      await unmount();
    });
  });

  describe("<Text />", () => {
    it("renders polymorphic tags according to as prop", async () => {
      // Arrange & Act
      const { unmount } = await renderIntoDom(
        <div>
          <Text as="span">Span Text</Text>
          <Text as="div">Div Text</Text>
          <Text as="strong">Strong Text</Text>
          <Text as="em">Em Text</Text>
          <Text as="small">Small Text</Text>
        </div>
      );

      // Assert
      expect(document.querySelector("span[data-slot='text']")?.textContent).toBe("Span Text");
      expect(document.querySelector("div[data-slot='text']")?.textContent).toBe("Div Text");
      expect(document.querySelector("strong[data-slot='text']")?.textContent).toBe("Strong Text");
      expect(document.querySelector("em[data-slot='text']")?.textContent).toBe("Em Text");
      expect(document.querySelector("small[data-slot='text']")?.textContent).toBe("Small Text");

      await unmount();
    });

    it("applies font family, weight, and color variants", async () => {
      // Arrange & Act
      const { unmount } = await renderIntoDom(
        <div>
          <Text family="mono" weight="bold" variant="primary">
            Mono Primary
          </Text>
          <Text family="serif" weight="black" uppercase>
            Serif Black
          </Text>
        </div>
      );

      // Assert
      const elements = document.querySelectorAll("[data-slot='text']");
      expect(elements[0].className).toContain("font-mono");
      expect(elements[0].className).toContain("font-bold");
      expect(elements[0].className).toContain("text-amber-400");

      expect(elements[1].className).toContain("font-serif");
      expect(elements[1].className).toContain("font-black");
      expect(elements[1].className).toContain("uppercase");

      await unmount();
    });
  });

  describe("<Label />", () => {
    it("renders label element with htmlFor attribute and required indicator", async () => {
      // Arrange & Act
      const { unmount } = await renderIntoDom(
        <Label htmlFor="master-volume" required variant="primary">
          Master Volume
        </Label>
      );

      // Assert
      const label = document.querySelector("label");
      expect(label?.getAttribute("for")).toBe("master-volume");
      expect(label?.textContent).toContain("Master Volume");
      expect(label?.textContent).toContain("*");
      expect(label?.className).toContain("text-amber-300");

      await unmount();
    });

    it("renders as span when as='span' is specified", async () => {
      // Arrange & Act
      const { unmount } = await renderIntoDom(
        <Label as="span" variant="muted">
          Stat Modifier
        </Label>
      );

      // Assert
      const span = document.querySelector("span[data-slot='label']");
      expect(span).not.toBeNull();
      expect(span?.textContent).toBe("Stat Modifier");

      await unmount();
    });
  });

  describe("<Code />", () => {
    it("renders code tag with font-mono and theme variants", async () => {
      // Arrange & Act
      const { unmount } = await renderIntoDom(
        <div>
          <Code variant="amber">X: 120, Y: 450</Code>
          <Code variant="plain">FPS: 60</Code>
        </div>
      );

      // Assert
      const codes = document.querySelectorAll("code[data-slot='code']");
      expect(codes.length).toBe(2);
      expect(codes[0].textContent).toBe("X: 120, Y: 450");
      expect(codes[0].className).toContain("font-mono");
      expect(codes[0].className).toContain("text-amber-300");

      expect(codes[1].textContent).toBe("FPS: 60");
      expect(codes[1].className).toContain("bg-transparent");

      await unmount();
    });

    it("forwards ref to the underlying element", async () => {
      // Arrange
      const ref = React.createRef<HTMLElement>();

      // Act
      const { unmount } = await renderIntoDom(
        <Code ref={ref}>DEBUG_ID</Code>
      );

      // Assert
      expect(ref.current).not.toBeNull();
      expect(ref.current?.tagName).toBe("CODE");

      await unmount();
    });
  });
});
