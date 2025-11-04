"use client";

import React, { useEffect, useRef, useState } from "react";
import CreateUserForm from "./CreateUserForm";

export default function CreateUserModal({ onSuccessAction }: { onSuccessAction?: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const closeTimeout = useRef<number | null>(null);

  const handleSuccess = async () => {
    // call parent server action (revalidate) then close modal (with animation)
    await onSuccessAction?.();
    // trigger animated close
    setIsClosing(true);
    closeTimeout.current = window.setTimeout(() => {
      setIsClosing(false);
      setOpen(false);
    }, 200);
  };

  const closeModal = () => {
    setIsClosing(true);
    closeTimeout.current = window.setTimeout(() => {
      setIsClosing(false);
      setOpen(false);
    }, 200);
  };

  useEffect(() => {
  if (!open) return;

    // save focused element before opening
    previouslyFocused.current = document.activeElement as HTMLElement | null;

    // focus first focusable element inside modal
    const modal = modalRef.current;
    const focusable = modal?.querySelectorAll<HTMLElement>(
      'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable && focusable.length > 0) {
      focusable[0].focus();
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        return;
      }

      if (e.key === "Tab") {
        // trap focus inside modal
        if (!focusable || focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      // restore focus
      previouslyFocused.current?.focus();
      // clear timeout if any
      if (closeTimeout.current) {
        clearTimeout(closeTimeout.current);
        closeTimeout.current = null;
      }
    };
  }, [open]);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:ring-4 focus:ring-blue-100 transition-colors"
      >
        Créer un utilisateur
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" aria-modal="true" role="dialog">
          <div
            className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${isClosing ? "opacity-0" : "opacity-100"}`}
            onClick={closeModal}
          />

          <div className="relative w-full max-w-2xl mx-4">
            <div
              ref={modalRef}
              className={`bg-white rounded-lg shadow-lg p-6 transition-transform duration-200 ${
                isClosing ? "opacity-0 translate-y-2 scale-95" : "opacity-100 translate-y-0 scale-100"
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Créer un nouvel utilisateur</h3>
                <button
                  onClick={closeModal}
                  className="text-gray-500 hover:text-gray-700"
                  aria-label="Fermer"
                >
                  ✕
                </button>
              </div>

              <div>
                <CreateUserForm onSuccessAction={handleSuccess} />
              </div>

              <div className="mt-4 text-right">
                <button
                  onClick={closeModal}
                  className="px-3 py-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
