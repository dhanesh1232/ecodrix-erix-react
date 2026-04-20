"use client";

import * as React from "react";
import { useErixClient } from "@/context/ErixProvider";
import type { 
  CheckoutSession, 
  CheckoutProduct, 
  CreateOrderPayload,
  VerifyPayload 
} from "@ecodrix/erix-api";

export type CheckoutStep = "summary" | "verification" | "shipping" | "payment" | "success" | "error";

interface CheckoutState {
  step: CheckoutStep;
  session: CheckoutSession | null;
  product: CheckoutProduct | null;
  loading: boolean;
  error: string | null;
  isVerified: boolean;
}

export function useCheckout(productId: string) {
  const sdk = useErixClient();
  const [state, setState] = React.useState<CheckoutState>({
    step: "summary",
    session: null,
    product: null,
    loading: false,
    error: null,
    isVerified: false,
  });

  const initSession = React.useCallback(async (quantity: number = 1) => {
    try {
      setState(s => ({ ...s, loading: true, error: null }));
      
      // Fetch product info if not already fetched
      let product = state.product;
      if (!product) {
        product = await sdk.checkout.getProduct(productId);
      }

      const session = await sdk.checkout.createSession({ productId, quantity });
      
      setState(s => ({ 
        ...s, 
        session, 
        product, 
        loading: false 
      }));
    } catch (err: any) {
      setState(s => ({ 
        ...s, 
        loading: false, 
        error: err.message || "Failed to initialize checkout" 
      }));
    }
  }, [sdk, productId, state.product]);

  const applyCoupon = async (couponCode: string) => {
    if (!state.session) return;
    try {
      setState(s => ({ ...s, loading: true }));
      const updatedSession = await sdk.checkout.applyCoupon({
        sessionId: state.session.sessionId,
        couponCode
      });
      setState(s => ({ ...s, session: updatedSession, loading: false }));
    } catch (err: any) {
      setState(s => ({ ...s, loading: false, error: err.message }));
    }
  };

  const verifyIdentity = async (payload: Omit<VerifyPayload, "sessionId">) => {
    if (!state.session) return;
    try {
      setState(s => ({ ...s, loading: true }));
      const res = await sdk.checkout.verify({
        sessionId: state.session.sessionId,
        ...payload
      });
      if (res.verified) {
        setState(s => ({ ...s, isVerified: true, loading: false }));
        return true;
      }
      return false;
    } catch (err: any) {
      setState(s => ({ ...s, loading: false, error: err.message }));
      return false;
    }
  };

  const placeOrder = async (orderPayload: Omit<CreateOrderPayload, "sessionId">) => {
    if (!state.session) return;
    try {
      setState(s => ({ ...s, loading: true }));
      const res = await sdk.checkout.createOrder({
        sessionId: state.session.sessionId,
        ...orderPayload
      });
      setState(s => ({ ...s, step: "success", loading: false }));
      return res;
    } catch (err: any) {
      setState(s => ({ ...s, loading: false, error: err.message }));
    }
  };

  const setStep = (step: CheckoutStep) => {
    setState(s => ({ ...s, step }));
  };

  return {
    ...state,
    initSession,
    applyCoupon,
    verifyIdentity,
    placeOrder,
    setStep,
  };
}
