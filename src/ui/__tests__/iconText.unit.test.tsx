import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import React from "react";
import { setupDomEnvironment, cleanupDom, renderIntoDom } from "@test-utils";
import { IconText, IconLabel } from "../typography";

describe("IconText & IconLabel Typography Primitives (@ui)", () => {
  beforeEach(() => {
    setupDomEnvironment();
  });

  afterEach(async () => {
    await cleanupDom();
  });

  it("renders with default span tag, inline-flex, and data-slot attributes", async () => {
    const { unmount } = await renderIntoDom(
      <IconText icon={<span data-testid="icon">🛡️</span>}>Guardian Shield</IconText>
    );

    const root = document.querySelector("[data-slot='icon-text']");
    expect(root).not.toBeNull();
    expect(root?.tagName.toLowerCase()).toBe("span");
    expect(root?.className).toContain("inline-flex");
    expect(root?.className).toContain("items-center");
    expect(root?.className).toContain("gap-1.5");

    const iconSlot = document.querySelector("[data-slot='icon-text-icon']");
    expect(iconSlot).not.toBeNull();
    expect(iconSlot?.getAttribute("aria-hidden")).toBe("true");
    expect(iconSlot?.className).toContain("shrink-0");

    const contentSlot = document.querySelector("[data-slot='icon-text-content']");
    expect(contentSlot?.textContent).toBe("Guardian Shield");

    await unmount();
  });

  it("supports polymorphic rendering via as prop ('div', 'label', 'p')", async () => {
    const { unmount } = await renderIntoDom(
      <div>
        <IconText as="div" data-testid="div-icon">Block Item</IconText>
        <IconText as="label" data-testid="label-icon">Form Field</IconText>
        <IconText as="p" data-testid="p-icon">Paragraph Item</IconText>
      </div>
    );

    const divElem = document.querySelector("[data-testid='div-icon']");
    expect(divElem?.tagName.toLowerCase()).toBe("div");
    // div defaults to block flex unless inline={true}
    expect(divElem?.className).toContain("flex");

    const labelElem = document.querySelector("[data-testid='label-icon']");
    expect(labelElem?.tagName.toLowerCase()).toBe("label");

    const pElem = document.querySelector("[data-testid='p-icon']");
    expect(pElem?.tagName.toLowerCase()).toBe("p");

    await unmount();
  });

  it("renders iconPosition='right' placing icon after text content", async () => {
    const { unmount } = await renderIntoDom(
      <IconText
        icon={<span data-testid="arrow">➡️</span>}
        iconPosition="right"
      >
        Proceed
      </IconText>
    );

    const root = document.querySelector("[data-slot='icon-text']");
    expect(root).not.toBeNull();
    const children = root?.children;
    expect(children?.length).toBe(2);
    expect(children?.[0].getAttribute("data-slot")).toBe("icon-text-content");
    expect(children?.[1].getAttribute("data-slot")).toBe("icon-text-icon");

    await unmount();
  });

  it("accepts text passed via label prop as an alternative to children", async () => {
    const { unmount } = await renderIntoDom(
      <IconText
        icon={<span data-testid="gear">⚙️</span>}
        label="Preferences"
      />
    );

    const contentSlot = document.querySelector("[data-slot='icon-text-content']");
    expect(contentSlot?.textContent).toBe("Preferences");

    await unmount();
  });

  it("applies typography variants (size, weight, variant, truncate) and gap properly", async () => {
    const { unmount } = await renderIntoDom(
      <IconText
        size="xs"
        weight="semibold"
        variant="primary"
        gap="2"
        truncate
        icon={<span data-testid="icon">🔥</span>}
      >
        Inferno Flare
      </IconText>
    );

    const root = document.querySelector("[data-slot='icon-text']");
    expect(root?.className).toContain("text-xs");
    expect(root?.className).toContain("font-semibold");
    expect(root?.className).toContain("text-amber-400");
    expect(root?.className).toContain("gap-2");

    const contentSlot = document.querySelector("[data-slot='icon-text-content']");
    expect(contentSlot?.className).toContain("truncate");

    await unmount();
  });

  it("forwards ref to the underlying DOM element", async () => {
    const ref = React.createRef<HTMLDivElement>();

    const { unmount } = await renderIntoDom(
      <IconText ref={ref} as="div">
        Ref Target
      </IconText>
    );

    expect(ref.current).not.toBeNull();
    expect(ref.current?.tagName.toLowerCase()).toBe("div");
    expect(ref.current?.textContent).toContain("Ref Target");

    await unmount();
  });

  it("renders IconLabel semantic alias with default label semantics", async () => {
    const { unmount } = await renderIntoDom(
      <IconLabel
        htmlFor="test-input"
        icon={<span data-testid="lock">🔒</span>}
      >
        Password
      </IconLabel>
    );

    const labelElem = document.querySelector("[data-slot='icon-label']");
    expect(labelElem).not.toBeNull();
    expect(labelElem?.tagName.toLowerCase()).toBe("label");
    expect(labelElem?.getAttribute("for")).toBe("test-input");
    expect(labelElem?.textContent).toContain("Password");

    await unmount();
  });
});
