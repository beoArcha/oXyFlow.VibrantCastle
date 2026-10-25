import { describe, it, expect, beforeEach, afterEach, mock } from "bun:test";
import React, { createRef, act } from "react";
import { setupDomEnvironment, renderIntoDom } from "@test-utils/domTestUtils";
import { Button, Badge, KbdKey, StatRow, Input, Switch, Tooltip } from "../index";

describe("Core UI Primitives (Button, Badge, KbdKey, StatRow, Input, Switch, Tooltip)", () => {
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

  describe("Input Component", () => {
    it("renders text input and handles value changes", async () => {
      const handleChange = mock((_e: React.ChangeEvent<HTMLInputElement>) => {});
      const { container, changeInput, unmount } = await renderIntoDom(
        <Input placeholder="Enter hero name..." onChange={handleChange} defaultValue="Valen" />
      );

      const input = container.querySelector("input") as HTMLInputElement;
      expect(input).not.toBeNull();
      expect(input.placeholder).toBe("Enter hero name...");
      expect(input.value).toBe("Valen");

      await changeInput(input, "Aurelia");
      expect(handleChange).toHaveBeenCalled();

      await unmount();
    });

    it("renders label linked via htmlFor to input id", async () => {
      const { container, unmount } = await renderIntoDom(
        <Input label="Hero Name" id="hero-name-input" />
      );

      const label = container.querySelector("label");
      const input = container.querySelector("input");
      expect(label).not.toBeNull();
      expect(label?.textContent).toBe("Hero Name");
      expect(label?.getAttribute("for")).toBe("hero-name-input");
      expect(input?.id).toBe("hero-name-input");

      await unmount();
    });

    it("renders error message with role='alert' and sets aria-invalid", async () => {
      const { container, unmount } = await renderIntoDom(
        <Input id="error-input" error="Name is required" helperText="Will be hidden by error" />
      );

      const input = container.querySelector("input");
      expect(input?.getAttribute("aria-invalid")).toBe("true");

      const errorText = container.querySelector("[role='alert']");
      expect(errorText).not.toBeNull();
      expect(errorText?.textContent).toBe("Name is required");
      expect(input?.getAttribute("aria-describedby")).toBe("error-input-error");
      expect(container.textContent).not.toContain("Will be hidden by error");

      await unmount();
    });

    it("renders helperText when no error is present", async () => {
      const { container, unmount } = await renderIntoDom(
        <Input id="helper-input" helperText="Max 24 characters" />
      );

      const input = container.querySelector("input");
      expect(input?.getAttribute("aria-invalid")).toBe("false");
      expect(container.textContent).toContain("Max 24 characters");
      expect(input?.getAttribute("aria-describedby")).toBe("helper-input-helper");

      await unmount();
    });

    it("renders leftIcon and rightIcon slots", async () => {
      const { container, unmount } = await renderIntoDom(
        <Input
          leftIcon={<span data-testid="left-search">🔍</span>}
          rightIcon={<span data-testid="right-clear">✖</span>}
        />
      );

      expect(container.querySelector("[data-testid='left-search']")).not.toBeNull();
      expect(container.querySelector("[data-testid='right-clear']")).not.toBeNull();

      await unmount();
    });

    it("disables input and applies disabled styling", async () => {
      const { container, unmount } = await renderIntoDom(<Input disabled value="Locked" />);
      const input = container.querySelector("input");
      expect(input?.disabled).toBe(true);
      expect(input?.className).toContain("cursor-not-allowed");
      expect(input?.className).toContain("opacity-50");

      await unmount();
    });

    it("forwards ref to the underlying HTMLInputElement", async () => {
      const inputRef = createRef<HTMLInputElement>();
      const { unmount } = await renderIntoDom(<Input ref={inputRef} />);
      expect(inputRef.current).not.toBeNull();
      expect(inputRef.current?.tagName).toBe("INPUT");

      await unmount();
    });
  });

  describe("Switch Component", () => {
    it("renders switch button with WAI-ARIA role and aria-checked attribute", async () => {
      const { container, unmount } = await renderIntoDom(<Switch checked={true} />);
      const switchBtn = container.querySelector("[role='switch']");
      expect(switchBtn).not.toBeNull();
      expect(switchBtn?.getAttribute("aria-checked")).toBe("true");
      await unmount();

      const { container: offContainer, unmount: offUnmount } = await renderIntoDom(<Switch checked={false} />);
      const offSwitch = offContainer.querySelector("[role='switch']");
      expect(offSwitch?.getAttribute("aria-checked")).toBe("false");
      await offUnmount();
    });

    it("invokes onCheckedChange when clicked", async () => {
      const handleChange = mock((_checked: boolean) => {});
      const { container, click, unmount } = await renderIntoDom(
        <Switch checked={false} onCheckedChange={handleChange} />
      );

      const switchBtn = container.querySelector("[role='switch']") as HTMLElement;
      await click(switchBtn);

      expect(handleChange).toHaveBeenCalledTimes(1);
      expect(handleChange).toHaveBeenCalledWith(true);

      await unmount();
    });

    it("supports clicking on associated label to toggle switch", async () => {
      const handleChange = mock((_checked: boolean) => {});
      const { container, click, unmount } = await renderIntoDom(
        <Switch
          id="sound-toggle"
          checked={true}
          onCheckedChange={handleChange}
          label="Sound Effects"
          description="Enable environmental audio"
        />
      );

      expect(container.textContent).toContain("Sound Effects");
      expect(container.textContent).toContain("Enable environmental audio");

      const label = container.querySelector("label") as HTMLElement;
      await click(label);

      expect(handleChange).toHaveBeenCalledTimes(1);
      expect(handleChange).toHaveBeenCalledWith(false);

      await unmount();
    });

    it("prevents interactions when disabled", async () => {
      const handleChange = mock((_checked: boolean) => {});
      const { container, click, unmount } = await renderIntoDom(
        <Switch checked={false} onCheckedChange={handleChange} disabled={true} />
      );

      const switchBtn = container.querySelector("[role='switch']") as HTMLButtonElement;
      expect(switchBtn.disabled).toBe(true);

      await click(switchBtn);
      expect(handleChange).toHaveBeenCalledTimes(0);

      await unmount();
    });

    it("supports different sizes (sm, md, lg)", async () => {
      for (const size of ["sm", "md", "lg"] as const) {
        const { container, unmount } = await renderIntoDom(<Switch checked={true} size={size} />);
        const switchBtn = container.querySelector("[role='switch']");
        expect(switchBtn).not.toBeNull();
        await unmount();
      }
    });

    it("forwards ref to the button element", async () => {
      const switchRef = createRef<HTMLButtonElement>();
      const { unmount } = await renderIntoDom(<Switch ref={switchRef} checked={false} />);
      expect(switchRef.current).not.toBeNull();
      expect(switchRef.current?.getAttribute("role")).toBe("switch");

      await unmount();
    });
  });

  describe("Tooltip Component", () => {
    it("does not render tooltip content initially", async () => {
      const { container, unmount } = await renderIntoDom(
        <Tooltip content="Attack power: +15">
          <button>Hover me</button>
        </Tooltip>
      );

      expect(container.querySelector("[role='tooltip']")).toBeNull();

      await unmount();
    });

    it("shows tooltip on mouse enter and hides on mouse leave with delayDuration=0", async () => {
      const { container, unmount } = await renderIntoDom(
        <Tooltip content="Attack power: +15" delayDuration={0}>
          <button id="trigger-btn">Hover me</button>
        </Tooltip>
      );

      const button = container.querySelector("#trigger-btn") as HTMLElement;

      await act(async () => {
        button.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
      });

      const tooltip = document.querySelector("[role='tooltip']");
      expect(tooltip).not.toBeNull();
      expect(tooltip?.textContent).toBe("Attack power: +15");

      await act(async () => {
        button.dispatchEvent(new MouseEvent("mouseout", { bubbles: true }));
      });

      expect(document.querySelector("[role='tooltip']")).toBeNull();

      await unmount();
    });

    it("shows tooltip on keyboard focus and hides on blur with delayDuration=0", async () => {
      const { container, unmount } = await renderIntoDom(
        <Tooltip content="Press [E] to interact" delayDuration={0}>
          <button id="focus-btn">Focus me</button>
        </Tooltip>
      );

      const button = container.querySelector("#focus-btn") as HTMLButtonElement;

      await act(async () => {
        button.focus();
        button.dispatchEvent(new Event("focus", { bubbles: true }));
      });

      const tooltip = document.querySelector("[role='tooltip']");
      expect(tooltip).not.toBeNull();
      expect(tooltip?.textContent).toBe("Press [E] to interact");
      expect(button.getAttribute("aria-describedby")).toBe(tooltip?.id);

      await act(async () => {
        button.blur();
        button.dispatchEvent(new Event("blur", { bubbles: true }));
      });

      expect(document.querySelector("[role='tooltip']")).toBeNull();

      await unmount();
    });

    it("respects disabled prop and does not show tooltip", async () => {
      const { container, unmount } = await renderIntoDom(
        <Tooltip content="Hidden tip" disabled={true} delayDuration={0}>
          <button id="disabled-btn">Disabled</button>
        </Tooltip>
      );

      const button = container.querySelector("#disabled-btn") as HTMLElement;
      await act(async () => {
        button.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
      });

      expect(container.querySelector("[role='tooltip']")).toBeNull();

      await unmount();
    });
  });
});

