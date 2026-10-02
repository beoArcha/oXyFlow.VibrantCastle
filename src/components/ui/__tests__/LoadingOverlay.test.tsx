import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import React from "react";
import { LoadingOverlay, IsLoading } from "../index";
import { renderIntoDom, cleanupDom, setupDomEnvironment } from "@test-utils";

describe("LoadingOverlay Component", () => {
  beforeEach(() => {
    setupDomEnvironment();
  });

  afterEach(async () => {
    await cleanupDom();
  });

  it("renders spinner and message when isLoading is true", async () => {
    const { container } = await renderIntoDom(
      <LoadingOverlay isLoading={true} message="Loading Texture..." />
    );

    expect(container.querySelector("[role='status']")).not.toBeNull();
    expect(container.textContent).toContain("Loading Texture...");
    expect(container.querySelector(".animate-spin")).not.toBeNull();
  });

  it("renders null when isLoading is false and no children provided", async () => {
    const { container } = await renderIntoDom(
      <LoadingOverlay isLoading={false} message="Loading Texture..." />
    );

    expect(container.children.length).toBe(0);
  });

  it("renders children wrapped with overlay when isLoading is true", async () => {
    const { container } = await renderIntoDom(
      <LoadingOverlay isLoading={true} message="Saving...">
        <div>Underlying Content</div>
      </LoadingOverlay>
    );

    expect(container.textContent).toContain("Underlying Content");
    expect(container.textContent).toContain("Saving...");
    expect(container.querySelector("[role='status']")).not.toBeNull();
  });

  it("renders only children without overlay when isLoading is false", async () => {
    const { container } = await renderIntoDom(
      <LoadingOverlay isLoading={false} message="Saving...">
        <div>Underlying Content</div>
      </LoadingOverlay>
    );

    expect(container.textContent).toContain("Underlying Content");
    expect(container.querySelector("[role='status']")).toBeNull();
  });

  it("IsLoading alias works identically with loading prop", async () => {
    const { container } = await renderIntoDom(
      <IsLoading loading={true} message="Please wait..." />
    );

    expect(container.textContent).toContain("Please wait...");
    expect(container.querySelector("[role='status']")).not.toBeNull();
  });
});
