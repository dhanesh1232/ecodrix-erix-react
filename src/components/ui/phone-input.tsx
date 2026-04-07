"use client";

import * as React from "react";
import PhoneInput from "react-phone-number-input";
import { cn } from "../../lib/utils";
import "react-phone-number-input/style.css";

type Size = "sm" | "md" | "lg";
type Variant = "default" | "ghost" | "filled";
type IconPosition = "left" | "right";

export interface StyledPhoneProps extends Omit<
  React.ComponentProps<typeof PhoneInput>,
  "onChange" | "value"
> {
  value?: string;
  onChange?: (value: string | undefined) => void;
  size?: Size;
  variant?: Variant;
  error?: boolean;
  success?: boolean;
  icon?: React.ReactNode;
  iconPosition?: IconPosition;
  className?: string;
  country?: string;
  helperText?: string;
}

const CustomPhoneInputField = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { size?: Size }
>(({ size = "md", className, ...inputProps }, ref) => {
  return (
    <input
      ref={ref}
      {...inputProps}
      data-slot="input"
      className={cn(
        "erix-text-foreground placeholder:erix-erix-text-muted-foreground selection:erix-erix-bg-primary selection:erix-erix-text-primary-foreground erix-w-full erix-bg-transparent erix-text-sm",
        "focus-visible:erix-erix-ring-0 focus-visible:erix-erix-outline-none erix-border-none erix-h-full",
        className,
      )}
    />
  );
});
CustomPhoneInputField.displayName = "CustomPhoneInputField";

export const StyledPhoneInput = React.forwardRef<any, StyledPhoneProps>(
  (
    {
      className,
      value,
      onChange,
      size = "md",
      variant = "default",
      error,
      success,
      icon,
      iconPosition = "left",
      country = "IN",
      helperText,
      ...props
    },
    ref,
  ) => {
    const sizeClasses: Record<Size, string> = {
      sm: "erix-h-8 erix-text-xs",
      md: "erix-h-10 erix-text-sm",
      lg: "erix-h-12 erix-text-base",
    };

    const variantClasses: Record<Variant, string> = {
      default: "erix-border-primary erix-bg-background erix-transition-colors",
      ghost:
        "erix-border-transparent erix-bg-background hover:erix-bg-background/30",
      filled:
        "erix-border-transparent erix-bg-background hover:erix-bg-background/80",
    };

    const stateClasses = (opts: { error?: boolean; success?: boolean }) =>
      opts.error
        ? "erix-border-destructive aria-invalid:erix-erix-border-destructive aria-invalid:erix-erix-ring-destructive/20"
        : opts.success
          ? "erix-border-blue-500 focus-visible:erix-erix-border-blue-500 focus-visible:erix-erix-ring-blue-500/40"
          : "";

    const iconPadding =
      icon && iconPosition === "left"
        ? "erix-pl-9"
        : icon && iconPosition === "right"
          ? "erix-pr-9"
          : "";

    return (
      <div className="erix-w-full erix-space-y-1.5">
        <div className="erix-relative erix-w-full">
          {icon && iconPosition === "left" && (
            <div className="erix-text-muted-foreground erix-pointer-events-none erix-absolute erix-top-1/2 erix-left-2.5 erix--erix-translate-y-1/2">
              {icon}
            </div>
          )}
          <PhoneInput
            {...props}
            ref={ref}
            international
            defaultCountry={country as any}
            value={value && !value.startsWith("+") ? `+${value}` : value}
            onChange={onChange}
            inputComponent={CustomPhoneInputField as any}
            placeholder="Enter phone number"
            countrySelectProps={{ tabIndex: -1 }}
            className={cn(
              "erix-PhoneInput erix-flex erix-w-full erix-items-center erix-gap-2 erix-rounded-md erix-border erix-bg-background erix-pl-3 erix-py-0",
              "file:erix-erix-text-foreground placeholder:erix-erix-text-muted-foreground selection:erix-erix-bg-primary selection:erix-erix-text-primary-foreground",
              "erix-shadow-sm erix-transition-[color,box-shadow] erix-outline-none erix-text-base md:erix-text-sm",
              "focus-within:erix-erix-border-ring focus-within:erix-erix-ring-ring/50 focus-within:erix-erix-ring-2",
              "disabled:erix-pointer-events-none disabled:erix-cursor-not-allowed disabled:erix-opacity-50",
              sizeClasses[size as Size],
              variantClasses[variant as Variant],
              stateClasses({ error, success }),
              iconPadding,
              className,
            )}
          />
          {icon && iconPosition === "right" && (
            <div className="erix-text-muted-foreground erix-pointer-events-none erix-absolute erix-top-1/2 erix-right-2.5 erix--erix-translate-y-1/2">
              {icon}
            </div>
          )}
        </div>

        {helperText && (
          <p
            className={cn(
              "erix-text-[11px]",
              error
                ? "erix-text-destructive"
                : success
                  ? "erix-text-primary/60"
                  : "erix-text-muted-foreground",
            )}
          >
            {helperText}
          </p>
        )}
        <style
          dangerouslySetInnerHTML={{
            __html: `
          .PhoneInputCountry {
            display: flex;
            align-items: center;
            gap: 0;
            padding-right: 0.5rem;
            border-right: 1px solid hsl(var(--erix-border, 240 5.9% 90%));
            height: 100%;
          }

          .PhoneInputCountrySelect {
            background-color: transparent;
            color: hsl(var(--erix-foreground, 240 10% 3.9%));
            font-size: 0.75rem;
            border: none;
            cursor: pointer;
            padding-left: 0.5rem;
          }
          .PhoneInputCountrySelect:focus {
            outline: none;
            box-shadow: none;
          }

          .PhoneInputCountryIcon {
            width: 1.25rem;
            height: 1rem;
            border-radius: 2px;
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
            overflow: hidden;
            border-right: 1px solid hsl(var(--erix-border, 240 5.9% 90%));
            padding-right: 0.5rem;
            margin-right: 0.5rem;
            box-sizing: content-box;
          }

          .PhoneInputCountrySelectArrow {
            color: hsl(var(--erix-muted-foreground, 240 3.8% 46.1%));
            margin-left: 0.25rem;
            opacity: 0.5;
          }
        `,
          }}
        />
      </div>
    );
  },
);

StyledPhoneInput.displayName = "StyledPhoneInput";
