import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import React from "react";
import { setupDomEnvironment, renderIntoDom } from "../../../test-utils/domTestUtils";
import { Button, Badge, KbdKey, StatRow } from "../index";

describe("Core UI Primitives (Button, Badge, KbdKey, StatRow)", () => {
  beforeEach(() => {
    setupDomEnvironment();
  });

  afterEach(() => {
    if (document.body) {
      document.body.innerHTML = "";
    }
  });

  describe("Button Component", () => {
    it("renders children with default primary variant and medium size", async () => {
      const { container, unmount } = await renderIntoDom(
        <Button>Enter Castle</Button>
      );

      const btn = container.querySelector("button")!;
      expect(btn).not.toBeNull();
      expect(btn.textContent).toContain("Enter Castle");
      expect(btn.type).toBe("button");
      expect(btn.disabled).toBe(false);

      await unmount();
    });

    it("forwards ref to the underlying HTMLButtonElement", async () => {
      const buttonRef = React.createRef<HTMLButtonElement>();

      const { unmount } = await renderIntoDom(
        <Button ref={buttonRef}>Ref Button</Button>
      );

      expect(buttonRef.current).toBeInstanceOf(globalThis.HTMLButtonElement);
      expect(buttonRef.current?.textContent).toContain("Ref Button");

      await unmount();
    });

    it("triggers onClick callback on user interaction", async () => {
      let clickCount = 0;
      const { container, click, unmount } = await renderIntoDom(
        <Button onClick={() => clickCount++}>Click Me</Button>
      );

      const btn = container.querySelector("button")!;
      await click(btn);
      expect(clickCount).toBe(1);

      await click(btn);
      expect(clickCount).toBe(2);

      await unmount();
    });

    it("suppresses click events and sets disabled state when disabled is true", async () => {
      let clickCount = 0;
      const { container, click, unmount } = await renderIntoDom(
        <Button disabled onClick={() => clickCount++}>
          Locked Gate
        </Button>
      );

      const btn = container.querySelector("button")!;
      expect(btn.disabled).toBe(true);
      expect(btn.getAttribute("aria-disabled")).toBe("true");

      await click(btn);
      expect(clickCount).toBe(0);

      await unmount();
    });

    it("handles loading state (isLoading=true) with spinner, aria-busy, and blocked clicks", async () => {
      let clickCount = 0;
      const { container, click, unmount } = await renderIntoDom(
        <Button isLoading onClick={() => clickCount++}>
          Saving Progress
        </Button>
      );

      const btn = container.querySelector("button")!;
      expect(btn.disabled).toBe(true);
      expect(btn.getAttribute("aria-busy")).toBe("true");
      expect(btn.getAttribute("aria-disabled")).toBe("true");
      expect(container.querySelector(".animate-spin")).not.toBeNull();

      await click(btn);
      expect(clickCount).toBe(0);

      await unmount();
    });

    it("renders left and right icons cleanly alongside text", async () => {
      const { container, unmount } = await renderIntoDom(
        <Button
          leftIcon={<span data-testid="left-icon">←</span>}
          rightIcon={<span data-testid="right-icon">→</span>}
        >
          Navigate
        </Button>
      );

      expect(container.querySelector("[data-testid='left-icon']")).not.toBeNull();
      expect(container.querySelector("[data-testid='right-icon']")).not.toBeNull();
      expect(container.textContent).toContain("Navigate");

      await unmount();
    });

    it("applies fullWidth style class when requested", async () => {
      const { container, unmount } = await renderIntoDom(
        <Button fullWidth>Wide Action</Button>
      );

      const btn = container.querySelector("button")!;
      expect(btn.className).toContain("w-full");

      await unmount();
    });
  });

  describe("Badge Component", () => {
    it("renders text content with default amber variant", async () => {
      const { container, unmount } = await renderIntoDom(
        <Badge>Legendary</Badge>
      );

      const badge = container.querySelector("span")!;
      expect(badge).not.toBeNull();
      expect(badge.textContent).toBe("Legendary");
      expect(badge.className).toContain("text-amber-300");

      await unmount();
    });

    it("forwards ref to HTMLSpanElement", async () => {
      const badgeRef = React.createRef<HTMLSpanElement>();

      const { unmount } = await renderIntoDom(
        <Badge ref={badgeRef}>Ref Badge</Badge>
      );

      expect(badgeRef.current).not.toBeNull();
      expect(badgeRef.current?.tagName).toBe("SPAN");

      await unmount();
    });

    it("renders optional icon alongside label", async () => {
      const { container, unmount } = await renderIntoDom(
        <Badge icon={<span data-testid="badge-icon">★</span>}>Elite</Badge>
      );

      expect(container.querySelector("[data-testid='badge-icon']")).not.toBeNull();
      expect(container.textContent).toContain("Elite");

      await unmount();
    });

    it("applies semantic color variants properly", async () => {
      const { container, unmount } = await renderIntoDom(
        <div data-testid="badge-group">
          <Badge variant="red">Danger</Badge>
          <Badge variant="cyan">Mana</Badge>
          <Badge variant="purple">Arcane</Badge>
          <Badge variant="green">Stamina</Badge>
          <Badge variant="stone">Neutral</Badge>
        </div>
      );

      const badges = container.querySelectorAll("span.border");
      expect(badges.length).toBe(5);

      await unmount();
    });
  });

  describe("KbdKey Component", () => {
    it("renders semantic <kbd> element with keyboard label", async () => {
      const { container, unmount } = await renderIntoDom(
        <KbdKey>ESC</KbdKey>
      );

      const kbd = container.querySelector("kbd")!;
      expect(kbd).not.toBeNull();
      expect(kbd.textContent).toBe("ESC");
      expect(kbd.className).toContain("font-mono");

      await unmount();
    });

    it("forwards ref to HTMLElement", async () => {
      const kbdRef = React.createRef<HTMLElement>();

      const { unmount } = await renderIntoDom(
        <KbdKey ref={kbdRef}>W</KbdKey>
      );

      expect(kbdRef.current).not.toBeNull();
      expect(kbdRef.current?.tagName).toBe("KBD");

      await unmount();
    });

    it("propagates standard HTML attributes (title, aria-label)", async () => {
      const { container, unmount } = await renderIntoDom(
        <KbdKey title="Press Space to Jump" aria-label="Jump key">
          SPACE
        </KbdKey>
      );

      const kbd = container.querySelector("kbd")!;
      expect(kbd.title).toBe("Press Space to Jump");
      expect(kbd.getAttribute("aria-label")).toBe("Jump key");

      await unmount();
    });
  });

  describe("StatRow Component", () => {
    it("renders label and value with colon separator", async () => {
      const { container, unmount } = await renderIntoDom(
        <StatRow label="Attack Power" value={145} />
      );

      expect(container.textContent).toContain("Attack Power:");
      expect(container.textContent).toContain("145");

      await unmount();
    });

    it("forwards ref to HTMLDivElement", async () => {
      const rowRef = React.createRef<HTMLDivElement>();

      const { unmount } = await renderIntoDom(
        <StatRow ref={rowRef} label="Health" value="100/100" />
      );

      expect(rowRef.current).not.toBeNull();
      expect(rowRef.current?.tagName).toBe("DIV");

      await unmount();
    });

    it("renders optional leading icon and applies variant style", async () => {
      const { container, unmount } = await renderIntoDom(
        <StatRow
          variant="red"
          icon={<span data-testid="stat-icon">♥</span>}
          label="Health"
          value={250}
        />
      );

      expect(container.querySelector("[data-testid='stat-icon']")).not.toBeNull();
      expect(container.querySelector(".text-red-300")).not.toBeNull();

      await unmount();
    });
  });
});
