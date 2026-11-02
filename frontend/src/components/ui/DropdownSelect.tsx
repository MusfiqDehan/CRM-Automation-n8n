"use client";

import React, { useState, useRef, useEffect, useId } from "react";
import { ChevronDown, Check } from "lucide-react";

export interface DropdownOption<T = string> {
  value: T;
  label: React.ReactNode;
  description?: string;
  icon?: React.ElementType;
  badge?: React.ReactNode;
  disabled?: boolean;
}

export interface DropdownSelectProps<T = string> {
  value: T;
  onChange: (value: T) => void;
  options: DropdownOption<T>[];
  placeholder?: string;
  prefix?: string;
  size?: "sm" | "md" | "lg";
  align?: "left" | "right";
  direction?: "down" | "up" | "auto";
  disabled?: boolean;
  error?: boolean | string;
  fullWidth?: boolean;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
  ariaLabel?: string;
  id?: string;
  name?: string;
}

export function DropdownSelect<T = string>({
  value,
  onChange,
  options,
  placeholder = "Select an option",
  prefix,
  size = "md",
  align = "left",
  direction = "auto",
  disabled = false,
  error,
  fullWidth = true,
  className = "",
  buttonClassName = "",
  menuClassName = "",
  ariaLabel,
  id,
  name,
}: DropdownSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const generatedId = useId();
  const selectId = id || generatedId;

  // Selected Option
  const selectedOption = options.find((opt) => opt.value === value);

  // Close on outside click or blur
  useEffect(() => {
    if (!isOpen) return;

    function handleOutsideClick(event: MouseEvent | TouchEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [isOpen]);

  // Dynamic positioning (auto detect viewport boundaries)
  useEffect(() => {
    if (isOpen && direction === "auto" && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      // If less than 240px below and more room above, flip upward
      if (spaceBelow < 240 && spaceAbove > spaceBelow) {
        setOpenUpward(true);
      } else {
        setOpenUpward(false);
      }
    } else if (direction === "up") {
      setOpenUpward(true);
    } else {
      setOpenUpward(false);
    }
  }, [isOpen, direction]);

  // Sync highlighted index when opened
  useEffect(() => {
    if (isOpen) {
      const idx = options.findIndex((opt) => opt.value === value);
      setHighlightedIndex(idx >= 0 ? idx : 0);
    } else {
      setHighlightedIndex(-1);
    }
  }, [isOpen, options, value]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case "Enter":
      case " ": {
        e.preventDefault();
        if (isOpen) {
          if (highlightedIndex >= 0 && highlightedIndex < options.length) {
            const target = options[highlightedIndex];
            if (!target.disabled) {
              onChange(target.value);
              setIsOpen(false);
              buttonRef.current?.focus();
            }
          }
        } else {
          setIsOpen(true);
        }
        break;
      }
      case "ArrowDown": {
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setHighlightedIndex((prev) => {
            let next = prev + 1;
            while (next < options.length && options[next].disabled) {
              next++;
            }
            return next < options.length ? next : prev;
          });
        }
        break;
      }
      case "ArrowUp": {
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setHighlightedIndex((prev) => {
            let next = prev - 1;
            while (next >= 0 && options[next].disabled) {
              next--;
            }
            return next >= 0 ? next : prev;
          });
        }
        break;
      }
      case "Escape": {
        e.preventDefault();
        setIsOpen(false);
        buttonRef.current?.focus();
        break;
      }
      case "Tab": {
        if (isOpen) {
          setIsOpen(false);
        }
        break;
      }
    }
  };

  const handleSelect = (val: T, optDisabled?: boolean) => {
    if (optDisabled) return;
    onChange(val);
    setIsOpen(false);
    buttonRef.current?.focus();
  };

  // Sizing variants
  const sizeStyles = {
    sm: {
      button: "py-1.5 px-3 text-xs sm:text-sm rounded-xl gap-2 min-h-[34px]",
      icon: "h-3.5 w-3.5",
      menuItem: "py-1.5 px-2.5 text-xs sm:text-sm rounded-lg",
      badge: "text-[10px]",
    },
    md: {
      button: "py-2.5 px-3.5 text-sm rounded-xl gap-2 min-h-[42px]",
      icon: "h-4 w-4",
      menuItem: "py-2 px-3 text-sm rounded-xl",
      badge: "text-xs",
    },
    lg: {
      button: "py-3 px-4 text-base rounded-xl gap-2.5 min-h-[48px]",
      icon: "h-4.5 w-4.5",
      menuItem: "py-2.5 px-3.5 text-base rounded-xl",
      badge: "text-xs",
    },
  }[size];

  const isUp = direction === "up" || (direction === "auto" && openUpward);

  return (
    <div
      ref={containerRef}
      className={`relative ${fullWidth ? "w-full" : "inline-block"} ${className}`}
      onKeyDown={handleKeyDown}
    >
      {/* Hidden input for form support */}
      {name && (
        <input
          type="hidden"
          name={name}
          value={String(value ?? "")}
        />
      )}

      {/* Dropdown Trigger Button */}
      <button
        ref={buttonRef}
        type="button"
        id={selectId}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel || (prefix ? `${prefix}: ${selectedOption?.label}` : undefined)}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`flex items-center justify-between border font-medium transition cursor-pointer select-none outline-none ${
          fullWidth ? "w-full" : ""
        } ${sizeStyles.button} ${
          disabled
            ? "cursor-not-allowed opacity-50 bg-stone-100 dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-400"
            : error
            ? "border-rose-400 dark:border-rose-600 bg-white dark:bg-[#0f1523] text-stone-900 dark:text-stone-100 focus:ring-4 focus:ring-rose-500/15"
            : isOpen
            ? "border-amber-500 bg-white dark:bg-[#0f1523] text-stone-900 dark:text-white shadow-xs ring-4 ring-amber-500/10 dark:ring-amber-500/20"
            : "border-stone-200/90 dark:border-stone-800 bg-white dark:bg-[#0f1523] text-stone-800 dark:text-stone-200 shadow-2xs hover:border-stone-300 dark:hover:border-stone-700 hover:bg-stone-50/80 dark:hover:bg-stone-800/60 focus:border-amber-500 dark:focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 dark:focus:ring-amber-500/20"
        } ${buttonClassName}`}
      >
        <span className="flex items-center gap-2 min-w-0 truncate text-left">
          {prefix && (
            <span className="text-stone-500 dark:text-stone-400 font-normal shrink-0">
              {prefix}
            </span>
          )}
          {selectedOption?.icon && (
            <selectedOption.icon className={`${sizeStyles.icon} text-stone-500 dark:text-stone-400 shrink-0`} />
          )}
          <span className="truncate">
            {selectedOption ? selectedOption.label : (
              <span className="text-stone-400 dark:text-stone-500 font-normal">
                {placeholder}
              </span>
            )}
          </span>
          {selectedOption?.badge && (
            <span className="shrink-0">{selectedOption.badge}</span>
          )}
        </span>

        <ChevronDown
          className={`${sizeStyles.icon} text-stone-400 dark:text-stone-500 transition-transform duration-200 shrink-0 ml-1.5 ${
            isOpen ? "rotate-180 text-amber-600 dark:text-amber-400" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu Popover */}
      {isOpen && (
        <div
          ref={menuRef}
          role="listbox"
          tabIndex={-1}
          aria-activedescendant={
            highlightedIndex >= 0 ? `${selectId}-opt-${highlightedIndex}` : undefined
          }
          className={`absolute z-50 min-w-full w-max max-w-[calc(100vw-32px)] sm:max-w-md rounded-2xl border p-1.5 shadow-xl backdrop-blur-md transition-all animate-fade-up ${
            isUp ? "bottom-full mb-1.5" : "top-full mt-1.5"
          } ${
            align === "right" ? "right-0" : "left-0"
          } border-stone-200/90 dark:border-stone-800/90 bg-white/95 dark:bg-[#0f1523]/95 shadow-stone-900/10 dark:shadow-black/60 ${menuClassName}`}
        >
          <div className="max-h-60 overflow-y-auto space-y-0.5 overscroll-contain pr-0.5">
            {options.length === 0 ? (
              <div className="py-3 px-4 text-center text-xs text-stone-400 dark:text-stone-500">
                No options available
              </div>
            ) : (
              options.map((option, index) => {
                const isSelected = option.value === value;
                const isHighlighted = highlightedIndex === index;
                const Icon = option.icon;

                return (
                  <button
                    key={`${String(option.value)}-${index}`}
                    id={`${selectId}-opt-${index}`}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    disabled={option.disabled}
                    onClick={() => handleSelect(option.value, option.disabled)}
                    onMouseEnter={() => !option.disabled && setHighlightedIndex(index)}
                    className={`group flex w-full items-center justify-between text-left transition cursor-pointer select-none ${
                      sizeStyles.menuItem
                    } ${
                      option.disabled
                        ? "opacity-40 cursor-not-allowed pointer-events-none"
                        : isSelected
                        ? "bg-amber-50 text-amber-700 font-semibold dark:bg-amber-950/70 dark:text-amber-300"
                        : isHighlighted
                        ? "bg-stone-100 text-stone-900 dark:bg-stone-800/80 dark:text-white"
                        : "text-stone-700 dark:text-stone-300 hover:bg-stone-100/70 dark:hover:bg-stone-800/60 hover:text-stone-900 dark:hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      {Icon && (
                        <Icon
                          className={`${sizeStyles.icon} shrink-0 transition ${
                            isSelected
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-stone-400 group-hover:text-stone-600 dark:text-stone-500 dark:group-hover:text-stone-300"
                          }`}
                        />
                      )}
                      <div className="min-w-0">
                        <div className="truncate">{option.label}</div>
                        {option.description && (
                          <div className="text-[11px] text-stone-400 dark:text-stone-500 truncate mt-0.5 font-normal">
                            {option.description}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      {option.badge && (
                        <span className="shrink-0">{option.badge}</span>
                      )}
                      {isSelected && (
                        <Check className={`${sizeStyles.icon} text-amber-600 dark:text-amber-400 shrink-0`} />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

