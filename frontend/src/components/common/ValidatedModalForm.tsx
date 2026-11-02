"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { InlineAlert, Modal, ModalBody, ModalFooter, ModalHeader } from "@/components/ui/overlay";

interface ValidatedModalFormProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  onSubmit: (e: React.FormEvent) => void;
  submitting?: boolean;
  submitLabel?: string;
  submittingLabel?: string;
  generalError?: string | null;
  children: React.ReactNode;
}

export function ValidatedModalForm({
  isOpen,
  onClose,
  title,
  subtitle,
  onSubmit,
  submitting = false,
  submitLabel = "Save",
  submittingLabel = "Saving...",
  generalError,
  children,
}: ValidatedModalFormProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalHeader title={title} subtitle={subtitle} onClose={onClose} />
      <form onSubmit={onSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
        <ModalBody className="space-y-4">
          {generalError && <InlineAlert tone="error">{generalError}</InlineAlert>}
          {children}
        </ModalBody>
        <ModalFooter>
          <button type="button" onClick={onClose} className="btn-secondary" disabled={submitting}>
            Cancel
          </button>
          <button type="submit" disabled={submitting} className="btn-primary" aria-busy={submitting}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitting ? submittingLabel : submitLabel}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
