"use client";

import React from "react";
import { DropdownSelect, Field } from "@/components/ui/primitives";
import { Switch } from "@/components/ui/overlay";
import { PasswordInput } from "@/components/ui/PasswordInput";
import type { IntegrationFieldSchema } from "@/lib/types";

interface SchemaFormRendererProps {
  fields: IntegrationFieldSchema[];
  values: Record<string, unknown>;
  hasSecrets?: Record<string, boolean>;
  onChange: (key: string, value: unknown) => void;
  disabled?: boolean;
}

export function SchemaFormRenderer({
  fields,
  values,
  hasSecrets = {},
  onChange,
  disabled = false,
}: SchemaFormRendererProps) {
  if (!fields || fields.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {fields.map((f) => {
        const rawVal = values[f.key] ?? f.default ?? "";
        const isSecretStored = Boolean(hasSecrets[f.key]);

        if (f.field_type === "boolean") {
          return (
            <div
              key={f.key}
              className="rounded-xl border border-stone-200/80 bg-stone-50/60 p-3.5 dark:border-stone-800 dark:bg-stone-950/40"
            >
              <Switch
                label={f.label}
                description={f.help_text || undefined}
                checked={Boolean(rawVal)}
                onChange={(checked) => onChange(f.key, checked)}
                disabled={disabled}
              />
            </div>
          );
        }

        if (f.field_type === "select" && f.options && f.options.length > 0) {
          return (
            <Field key={f.key} label={f.label} required={f.required} hint={f.help_text || undefined}>
              <DropdownSelect
                value={String(rawVal || f.default || f.options[0]?.value || "")}
                onChange={(val) => onChange(f.key, String(val))}
                ariaLabel={f.label}
                options={f.options}
              />
            </Field>
          );
        }

        if (f.field_type === "secret") {
          const hintText = isSecretStored
            ? `${f.help_text ? `${f.help_text} · ` : ""}Encrypted secret stored. Leave blank to keep existing.`
            : f.help_text || undefined;
          const displayVal =
            typeof rawVal === "string" && rawVal.startsWith("••••") ? "" : String(rawVal || "");

          return (
            <Field key={f.key} label={f.label} required={f.required && !isSecretStored} hint={hintText}>
              <PasswordInput
                autoComplete="new-password"
                disabled={disabled}
                placeholder={
                  isSecretStored
                    ? String(values[f.key] || "••••••••••••")
                    : f.placeholder || `Enter ${f.label}`
                }
                value={displayVal}
                onChange={(e) => onChange(f.key, e.target.value)}
                className="font-mono"
              />
            </Field>
          );
        }

        return (
          <Field key={f.key} label={f.label} required={f.required} hint={f.help_text || undefined}>
            <input
              type={
                f.field_type === "number"
                  ? "number"
                  : f.field_type === "email"
                    ? "email"
                    : f.field_type === "url"
                      ? "url"
                      : "text"
              }
              disabled={disabled}
              required={f.required}
              placeholder={f.placeholder}
              value={String(rawVal)}
              onChange={(e) =>
                onChange(
                  f.key,
                  f.field_type === "number" ? Number(e.target.value) : e.target.value
                )
              }
              className="input font-mono text-xs"
            />
          </Field>
        );
      })}
    </div>
  );
}

