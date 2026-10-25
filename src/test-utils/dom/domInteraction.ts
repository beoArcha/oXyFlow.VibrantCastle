import { act } from "react";
import { flushMicrotasks } from "./domRegistry";
import type { ReactPropsCarrier } from "./domTypes";

function triggerReactSyntheticChange(element: Element) {
  const carrier = element as unknown as ReactPropsCarrier;
  const reactKey = Object.keys(carrier).find((k) => k.startsWith("__reactProps")) as
    | `__reactProps${string}`
    | undefined;
  const props = reactKey ? carrier[reactKey] : undefined;

  if (props && typeof props.onChange === "function") {
    props.onChange({ target: element, currentTarget: element, bubbles: true });
  }
}

export async function dispatchClick(element: Element): Promise<void> {
  await act(async () => {
    element.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    await flushMicrotasks();
  });
}

export async function dispatchKeyDown(
  element: Element,
  key: string,
  eventInit?: KeyboardEventInit
): Promise<void> {
  await act(async () => {
    element.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...eventInit }));
    await flushMicrotasks();
  });
}

export async function dispatchInputChange(
  input: HTMLInputElement | HTMLTextAreaElement,
  value: string
): Promise<void> {
  await act(async () => {
    input.value = value;
    triggerReactSyntheticChange(input);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
    await flushMicrotasks();
  });
}

export async function dispatchSelectChange(
  select: HTMLSelectElement,
  value: string
): Promise<void> {
  await act(async () => {
    select.value = value;
    triggerReactSyntheticChange(select);
    select.dispatchEvent(new Event("change", { bubbles: true }));
    await flushMicrotasks();
  });
}
