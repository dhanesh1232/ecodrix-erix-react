"use client";

import * as React from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { CheckoutModal } from "./CheckoutModal";
import { ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";

interface ErixCheckoutButtonProps extends ButtonProps {
  productId: string;
  label?: string;
  showIcon?: boolean;
}

/**
 * A drop-in button that launches the ErixCheckout one-click modal.
 */
export function ErixCheckoutButton({ 
  productId, 
  label = "Buy Now", 
  showIcon = true,
  className,
  variant = "default",
  ...props 
}: ErixCheckoutButtonProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className={cn(
          "font-bold rounded-xl transition-all active:scale-95",
          variant === "default" && "bg-primary text-primary-foreground hover:shadow-lg hover:shadow-primary/20",
          className
        )}
        variant={variant}
        {...props}
      >
        {showIcon && <ShoppingCart className="w-4 h-4 mr-2" />}
        {label}
      </Button>

      <CheckoutModal 
        productId={productId} 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
      />
    </>
  );
}
