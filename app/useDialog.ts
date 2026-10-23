"use client";

import { useEffect, useRef, type RefObject } from "react";

/**
 * Comportamiento de teclado de una ventana modal (role="dialog").
 * Poner el ref devuelto en el contenedor de la ventana, con tabIndex={-1}:
 *  - al abrir, el foco entra en la ventana (en el primer campo con teclado fisico,
 *    en el propio contenedor en pantallas tactiles para no abrir el teclado);
 *  - Escape cierra la ventana de arriba y Tab no sale de ella;
 *  - al cerrar, el foco vuelve al elemento que la abrio.
 * Con varias ventanas apiladas (p. ej. la galeria sobre la reserva) solo responde la ultima.
 * `dismissible` en false evita que Escape interrumpa una operacion en curso (p. ej. un pago).
 */

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const stack: HTMLElement[] = [];

function focusables(root: HTMLElement) {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => el.getClientRects().length > 0 && getComputedStyle(el).visibility !== "hidden",
  );
}

export function useDialog(
  active: boolean,
  onClose: () => void,
  dismissible = true,
): RefObject<HTMLDivElement | null> {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  const dismissibleRef = useRef(dismissible);
  useEffect(() => {
    closeRef.current = onClose;
    dismissibleRef.current = dismissible;
  });

  useEffect(() => {
    const root = ref.current;
    if (!active || !root) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    stack.push(root);

    const touch = window.matchMedia("(pointer: coarse)").matches;
    const items = focusables(root);
    const first = touch ? undefined : items.find((el) => /^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName)) ?? items[0];
    (first ?? root).focus({ preventScroll: true });

    const onKeyDown = (e: KeyboardEvent) => {
      if (stack[stack.length - 1] !== root) return;
      if (e.key === "Escape") {
        if (!dismissibleRef.current) return;
        e.preventDefault();
        closeRef.current();
        return;
      }
      if (e.key !== "Tab") return;
      const list = focusables(root);
      if (list.length === 0) {
        e.preventDefault();
        root.focus();
        return;
      }
      const firstEl = list[0];
      const lastEl = list[list.length - 1];
      const current = document.activeElement;
      if (!root.contains(current) || current === root) {
        e.preventDefault();
        (e.shiftKey ? lastEl : firstEl).focus();
      } else if (e.shiftKey && current === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && current === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      const i = stack.lastIndexOf(root);
      if (i >= 0) stack.splice(i, 1);
      if (opener && opener.isConnected) opener.focus({ preventScroll: true });
    };
  }, [active]);

  return ref;
}
