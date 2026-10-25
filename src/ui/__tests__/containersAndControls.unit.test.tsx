import React, { createRef } from "react";
import { describe, it, expect, beforeEach, afterEach, mock } from "bun:test";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  ProgressBar,
  Slider,
} from "@ui";
import { renderIntoDom, cleanupDom } from "@test-utils/domTestUtils";

describe("UI Containers and Form Controls (Card, ProgressBar, Slider)", () => {
  beforeEach(async () => {
    await cleanupDom();
  });

  afterEach(async () => {
    await cleanupDom();
  });

  describe("Card Component & Compound Architecture", () => {
    it("renders children with default variant and default styling", async () => {
      const { container } = await renderIntoDom(
        <Card data-testid="test-card">
          <p>Card Body</p>
        </Card>
      );

      const card = container.querySelector("[data-testid='test-card']");
      expect(card).not.toBeNull();
      expect(card?.textContent).toContain("Card Body");
      expect(card?.className).toContain("bg-surface-dark");
      expect(card?.className).toContain("border-border-strong");
    });

    it("forwards ref to the underlying HTMLDivElement", async () => {
      const cardRef = createRef<HTMLDivElement>();
      await renderIntoDom(<Card ref={cardRef}>Ref Card</Card>);

      expect(cardRef.current).not.toBeNull();
      expect(cardRef.current?.tagName.toLowerCase()).toBe("div");
      expect(cardRef.current?.textContent).toBe("Ref Card");
    });

    it("applies theme variants correctly", async () => {
      const { container: subtleContainer } = await renderIntoDom(
        <Card variant="subtle" data-testid="card-subtle">
          Subtle
        </Card>
      );
      const subtle = subtleContainer.querySelector("[data-testid='card-subtle']");
      expect(subtle?.className).toContain("bg-surface-darker");

      const { container: highlightContainer } = await renderIntoDom(
        <Card variant="highlight" data-testid="card-highlight">
          Highlight
        </Card>
      );
      const highlight = highlightContainer.querySelector("[data-testid='card-highlight']");
      expect(highlight?.className).toContain("border-amber-primary");

      const { container: ghostContainer } = await renderIntoDom(
        <Card variant="ghost" data-testid="card-ghost">
          Ghost
        </Card>
      );
      const ghost = ghostContainer.querySelector("[data-testid='card-ghost']");
      expect(ghost?.className).toContain("bg-transparent");
    });

    it("applies interactive classes when interactive prop is true", async () => {
      const { container } = await renderIntoDom(
        <Card interactive data-testid="interactive-card">
          Clickable
        </Card>
      );
      const card = container.querySelector("[data-testid='interactive-card']");
      expect(card?.className).toContain("cursor-pointer");
      expect(card?.className).toContain("hover:border-border-accent");
    });

    it("supports complete compound composition (Card.Header, Title, Description, Content, Footer)", async () => {
      const headerRef = createRef<HTMLDivElement>();
      const titleRef = createRef<HTMLHeadingElement>();
      const descRef = createRef<HTMLParagraphElement>();
      const contentRef = createRef<HTMLDivElement>();
      const footerRef = createRef<HTMLDivElement>();

      const { container } = await renderIntoDom(
        <Card data-testid="full-card">
          <Card.Header ref={headerRef} data-testid="card-header">
            <Card.Title
              ref={titleRef}
              icon={<span data-testid="title-icon">⚔</span>}
              data-testid="card-title"
            >
              Vampire Killer
            </Card.Title>
            <Card.Description ref={descRef} data-testid="card-desc">
              Legendary whip passed down Belmont line
            </Card.Description>
          </Card.Header>
          <Card.Content ref={contentRef} data-testid="card-content">
            <p>Attack: +25 Holy</p>
          </Card.Content>
          <Card.Footer ref={footerRef} data-testid="card-footer">
            <span>Equipped</span>
          </Card.Footer>
        </Card>
      );

      expect(container.querySelector("[data-testid='full-card']")).not.toBeNull();
      expect(container.querySelector("[data-testid='title-icon']")).not.toBeNull();
      expect(container.querySelector("[data-testid='card-title']")?.textContent).toContain("Vampire Killer");
      expect(container.querySelector("[data-testid='card-desc']")?.textContent).toContain("Legendary whip");
      expect(container.querySelector("[data-testid='card-content']")?.textContent).toContain("Attack: +25 Holy");
      expect(container.querySelector("[data-testid='card-footer']")?.textContent).toContain("Equipped");

      // Verify all subcomponent refs are properly bound
      expect(headerRef.current).not.toBeNull();
      expect(titleRef.current?.tagName.toLowerCase()).toBe("h3");
      expect(descRef.current?.tagName.toLowerCase()).toBe("p");
      expect(contentRef.current).not.toBeNull();
      expect(footerRef.current).not.toBeNull();
    });

    it("supports standalone named subcomponent exports interchangeably", async () => {
      const { container } = await renderIntoDom(
        <div>
          <CardHeader data-testid="standalone-header">Header</CardHeader>
          <CardTitle data-testid="standalone-title">Title</CardTitle>
          <CardDescription data-testid="standalone-desc">Desc</CardDescription>
          <CardContent data-testid="standalone-content">Content</CardContent>
          <CardFooter data-testid="standalone-footer">Footer</CardFooter>
        </div>
      );

      expect(container.querySelector("[data-testid='standalone-header']")).not.toBeNull();
      expect(container.querySelector("[data-testid='standalone-title']")).not.toBeNull();
      expect(container.querySelector("[data-testid='standalone-desc']")).not.toBeNull();
      expect(container.querySelector("[data-testid='standalone-content']")).not.toBeNull();
      expect(container.querySelector("[data-testid='standalone-footer']")).not.toBeNull();
    });
  });

  describe("ProgressBar Component", () => {
    it("renders with health variant, label, and numeric readout", async () => {
      const { container } = await renderIntoDom(
        <ProgressBar
          value={75}
          max={100}
          label="Health Points"
          icon={<span data-testid="hp-icon">❤</span>}
        />
      );

      expect(container.textContent).toContain("Health Points");
      expect(container.textContent).toContain("75 / 100");
      expect(container.querySelector("[data-testid='hp-icon']")).not.toBeNull();

      const progressbar = container.querySelector("[role='progressbar']");
      expect(progressbar).not.toBeNull();
      expect(progressbar?.getAttribute("aria-valuenow")).toBe("75");
      expect(progressbar?.getAttribute("aria-valuemin")).toBe("0");
      expect(progressbar?.getAttribute("aria-valuemax")).toBe("100");
      expect(progressbar?.getAttribute("aria-valuetext")).toBe("75 / 100");

      const innerBar = progressbar?.firstElementChild as HTMLElement;
      expect(innerBar.style.width).toBe("75%");
    });

    it("forwards ref to the outer container", async () => {
      const barRef = createRef<HTMLDivElement>();
      await renderIntoDom(<ProgressBar ref={barRef} value={50} max={100} />);

      expect(barRef.current).not.toBeNull();
      expect(barRef.current?.tagName.toLowerCase()).toBe("div");
    });

    it("mathematically clamps negative values to 0%", async () => {
      const { container } = await renderIntoDom(<ProgressBar value={-20} max={100} />);
      const progressbar = container.querySelector("[role='progressbar']");
      const innerBar = progressbar?.firstElementChild as HTMLElement;

      expect(progressbar?.getAttribute("aria-valuenow")).toBe("-20");
      expect(innerBar.style.width).toBe("0%");
    });

    it("mathematically clamps values exceeding max to 100%", async () => {
      const { container } = await renderIntoDom(<ProgressBar value={150} max={100} />);
      const progressbar = container.querySelector("[role='progressbar']");
      const innerBar = progressbar?.firstElementChild as HTMLElement;

      expect(progressbar?.getAttribute("aria-valuenow")).toBe("150");
      expect(innerBar.style.width).toBe("100%");
    });

    it("safely handles NaN and zero max without throwing or breaking layout", async () => {
      const { container } = await renderIntoDom(<ProgressBar value={NaN} max={0} />);
      const progressbar = container.querySelector("[role='progressbar']");
      const innerBar = progressbar?.firstElementChild as HTMLElement;

      expect(progressbar?.getAttribute("aria-valuenow")).toBe("0");
      expect(progressbar?.getAttribute("aria-valuemax")).toBe("1");
      expect(innerBar.style.width).toBe("0%");
    });

    it("supports size presets and custom heightClass", async () => {
      const { container: smContainer } = await renderIntoDom(
        <ProgressBar value={50} max={100} size="sm" />
      );
      expect(smContainer.querySelector("[role='progressbar']")?.className).toContain("h-1.5");

      const { container: lgContainer } = await renderIntoDom(
        <ProgressBar value={50} max={100} size="lg" />
      );
      expect(lgContainer.querySelector("[role='progressbar']")?.className).toContain("h-3");

      const { container: customContainer } = await renderIntoDom(
        <ProgressBar value={50} max={100} heightClass="h-5" />
      );
      expect(customContainer.querySelector("[role='progressbar']")?.className).toContain("h-5");
    });

    it("renders animated shimmer overlay when animated prop is true", async () => {
      const { container } = await renderIntoDom(
        <ProgressBar value={50} max={100} animated />
      );
      const shimmer = container.querySelector(".animate-\\[pulse_2s_infinite\\]");
      expect(shimmer).not.toBeNull();
    });
  });

  describe("Slider Component", () => {
    it("renders label, formatted percentage value, and range input", async () => {
      const handleChange = mock((_val: number) => {});
      const { container } = await renderIntoDom(
        <Slider
          id="music-volume"
          label="Music Volume"
          value={65}
          onChange={handleChange}
          icon={<span data-testid="slider-icon">🎵</span>}
        />
      );

      expect(container.textContent).toContain("Music Volume");
      expect(container.textContent).toContain("65%");
      expect(container.querySelector("[data-testid='slider-icon']")).not.toBeNull();

      const input = container.querySelector("input[type='range']") as HTMLInputElement;
      expect(input).not.toBeNull();
      expect(input.id).toBe("music-volume");
      expect(input.value).toBe("65");
      expect(input.getAttribute("aria-valuenow")).toBe("65");
      expect(input.getAttribute("aria-valuemin")).toBe("0");
      expect(input.getAttribute("aria-valuemax")).toBe("100");
    });

    it("forwards ref to HTMLInputElement", async () => {
      const inputRef = createRef<HTMLInputElement>();
      await renderIntoDom(
        <Slider ref={inputRef} label="Brightness" value={50} onChange={() => {}} />
      );

      expect(inputRef.current).not.toBeNull();
      expect(inputRef.current?.tagName.toLowerCase()).toBe("input");
      expect(inputRef.current?.type).toBe("range");
    });

    it("triggers onChange handler when user adjusts value", async () => {
      const handleChange = mock((_val: number) => {});
      const { container, changeInput } = await renderIntoDom(
        <Slider label="Master Volume" value={20} onChange={handleChange} min={0} max={100} />
      );

      const input = container.querySelector("input[type='range']") as HTMLInputElement;
      await changeInput(input, "80");

      expect(handleChange).toHaveBeenCalledTimes(1);
      expect(handleChange).toHaveBeenCalledWith(80);
    });

    it("supports custom unit and custom formatValue formatter", async () => {
      const { container: unitContainer } = await renderIntoDom(
        <Slider label="Frame Rate" value={60} onChange={() => {}} unit=" FPS" />
      );
      expect(unitContainer.textContent).toContain("60 FPS");

      const { container: formattedContainer } = await renderIntoDom(
        <Slider
          label="Scale"
          value={2}
          onChange={() => {}}
          formatValue={(val) => `${val.toFixed(1)}x Zoom`}
        />
      );
      expect(formattedContainer.textContent).toContain("2.0x Zoom");
    });

    it("handles disabled state properly", async () => {
      const handleChange = mock((_val: number) => {});
      const { container } = await renderIntoDom(
        <Slider label="Disabled Option" value={40} onChange={handleChange} disabled />
      );

      const input = container.querySelector("input[type='range']") as HTMLInputElement;
      expect(input.disabled).toBe(true);
      expect(container.firstElementChild?.className).toContain("opacity-50");
      expect(container.firstElementChild?.className).toContain("pointer-events-none");
    });

    it("hides value display when showValue is false", async () => {
      const { container } = await renderIntoDom(
        <Slider label="Mystery" value={42} onChange={() => {}} showValue={false} />
      );

      expect(container.textContent).toContain("Mystery");
      expect(container.textContent).not.toContain("42%");
    });
  });
});
