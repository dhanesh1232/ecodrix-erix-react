"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCheckout, type CheckoutStep } from "@/hooks/checkout/useCheckout";
import { ErixSpinner } from "@/components/ui/erix-spinner";
import { 
  ShoppingBag, 
  Truck, 
  CreditCard, 
  CheckCircle2, 
  AlertCircle,
  Tag,
  ArrowRight,
  ChevronLeft
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CheckoutModalProps {
  productId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function CheckoutModal({ productId, isOpen, onClose }: CheckoutModalProps) {
  const {
    step,
    session,
    product,
    loading,
    error,
    isVerified,
    initSession,
    applyCoupon,
    verifyIdentity,
    placeOrder,
    setStep
  } = useCheckout(productId);

  const [couponCode, setCouponCode] = React.useState("");
  const [customer, setCustomer] = React.useState({
    name: "",
    phone: "",
    email: "",
    address: {
      line1: "",
      city: "",
      state: "",
      pincode: ""
    }
  });

  // Initialize session on mount/open
  React.useEffect(() => {
    if (isOpen) {
      initSession();
    }
  }, [isOpen, initSession]);

  const handleNext = () => {
    if (step === "summary") setStep("verification");
    else if (step === "verification") setStep("shipping");
    else if (step === "shipping") setStep("payment");
  };

  const handleBack = () => {
    if (step === "verification") setStep("summary");
    else if (step === "shipping") setStep("verification");
    else if (step === "payment") setStep("shipping");
  };

  const renderSummary = () => (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {product && (
        <div className="flex gap-4 p-4 rounded-xl bg-muted/50 border border-border">
          <div className="w-24 h-24 rounded-lg overflow-hidden bg-white border border-border flex-shrink-0">
            {product.image ? (
              <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-accent">
                <ShoppingBag className="w-8 h-8 text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="flex flex-col justify-between py-1">
            <div>
              <h3 className="font-semibold text-lg leading-tight">{product.name}</h3>
              <p className="text-muted-foreground text-sm">Qty: {session?.items[0]?.quantity || 1}</p>
            </div>
            <p className="text-xl font-bold text-primary">₹{product.price}</p>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <Label className="text-sm font-medium">Have a coupon?</Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Enter code" 
              className="pl-9 bg-muted/30"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
            />
          </div>
          <Button 
            variant="secondary" 
            onClick={() => applyCoupon(couponCode)}
            disabled={loading || !couponCode}
          >
            Apply
          </Button>
        </div>
        {session?.amounts && session.amounts.discount > 0 && (
          <p className="text-sm text-green-600 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Discount of ₹{session.amounts.discount} applied!
          </p>
        )}
      </div>

      <div className="p-4 rounded-xl border border-border bg-accent/5 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span>₹{session?.amounts.subtotal || 0}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Delivery</span>
          <span className="text-green-600 font-medium">{session?.amounts.delivery === 0 ? "FREE" : `₹${session?.amounts.delivery}`}</span>
        </div>
        {session?.amounts && session.amounts.discount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Discount</span>
            <span className="text-green-600">-₹{session.amounts.discount}</span>
          </div>
        )}
        <div className="pt-2 mt-2 border-t border-border flex justify-between items-center">
          <span className="font-bold text-lg">Total Amount</span>
          <span className="font-bold text-2xl text-primary">₹{session?.amounts.total || 0}</span>
        </div>
      </div>

      <Button className="w-full h-12 text-lg font-semibold rounded-xl" onClick={handleNext}>
        Proceed to Details
        <ArrowRight className="w-5 h-5 ml-2" />
      </Button>
    </motion.div>
  );

  const renderVerification = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      <div className="text-center space-y-2">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
          <Truck className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-xl font-bold">Fastest Verification</h3>
        <p className="text-sm text-muted-foreground">Get started with a single click using Truecaller</p>
      </div>

      <Button 
        className="w-full h-14 bg-[#21b3ff] hover:bg-[#1a9ee6] text-white rounded-xl font-bold text-lg"
        onClick={() => verifyIdentity({ method: "truecaller" })}
        disabled={loading}
      >
        Verify with Truecaller
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or verify with phone</span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Phone Number</Label>
          <Input 
            placeholder="+91 00000 00000" 
            value={customer.phone}
            onChange={(e) => setCustomer(s => ({ ...s, phone: e.target.value }))}
          />
        </div>
        <Button variant="outline" className="w-full h-12" onClick={handleNext}>
          Continue Manually
        </Button>
      </div>
    </motion.div>
  );

  const renderShipping = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-4"
    >
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 col-span-2">
          <Label>Full Name</Label>
          <Input 
            placeholder="John Doe" 
            value={customer.name}
            onChange={(e) => setCustomer(s => ({ ...s, name: e.target.value }))}
          />
        </div>
        <div className="space-y-2 col-span-2">
          <Label>Address Line 1</Label>
          <Input 
            placeholder="House No, Street, Landmark" 
            value={customer.address.line1}
            onChange={(e) => setCustomer(s => ({ ...s, address: { ...s.address, line1: e.target.value } }))}
          />
        </div>
        <div className="space-y-2">
          <Label>Pincode</Label>
          <Input 
            placeholder="000000" 
            value={customer.address.pincode}
            onChange={(e) => setCustomer(s => ({ ...s, address: { ...s.address, pincode: e.target.value } }))}
          />
        </div>
        <div className="space-y-2">
          <Label>City</Label>
          <Input 
            placeholder="District" 
            value={customer.address.city}
            onChange={(e) => setCustomer(s => ({ ...s, address: { ...s.address, city: e.target.value } }))}
          />
        </div>
        <div className="space-y-2 col-span-2">
          <Label>State</Label>
          <Input 
            placeholder="State" 
            value={customer.address.state}
            onChange={(e) => setCustomer(s => ({ ...s, address: { ...s.address, state: e.target.value } }))}
          />
        </div>
      </div>
      <Button className="w-full h-12 mt-4" onClick={handleNext}>
        Proceed to Payment
      </Button>
    </motion.div>
  );

  const renderPayment = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      <div className="space-y-3">
        <h3 className="font-bold">Choose Payment Method</h3>
        <div className="space-y-2">
          <button 
            className={cn(
              "w-full p-4 rounded-xl border flex items-center gap-4 transition-all",
              "border-primary bg-primary/5 ring-2 ring-primary"
            )}
            onClick={() => {}}
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-primary" />
            </div>
            <div className="text-left">
              <p className="font-bold">Online Payment</p>
              <p className="text-xs text-muted-foreground">Cards, UPI, Netbanking (via Razorpay)</p>
            </div>
          </button>
          
          <button 
            className="w-full p-4 rounded-xl border flex items-center gap-4 hover:bg-muted/50 transition-all"
            onClick={() => {}}
          >
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="text-left">
              <p className="font-bold">Cash on Delivery</p>
              <p className="text-xs text-muted-foreground">Pay when your order arrives</p>
            </div>
          </button>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-accent/5 border border-border">
        <div className="flex justify-between font-bold text-lg">
          <span>Payable Now</span>
          <span className="text-primary">₹{session?.amounts?.total || 0}</span>
        </div>
      </div>

      <Button 
        className="w-full h-14 text-xl font-bold bg-green-600 hover:bg-green-700 text-white rounded-xl"
        onClick={() => placeOrder({ customer, paymentProvider: "razorpay" })}
        disabled={loading}
      >
        {loading ? <ErixSpinner /> : "Confirm Order"}
      </Button>
    </motion.div>
  );

  const renderSuccess = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-8 space-y-4"
    >
      <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
        <CheckCircle2 className="w-10 h-10 text-green-600" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Order Placed!</h2>
        <p className="text-muted-foreground">We've sent a confirmation message on WhatsApp.</p>
      </div>
      <Button variant="outline" className="mt-4" onClick={onClose}>
        Continue Shopping
      </Button>
    </motion.div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[440px] p-0 overflow-hidden border-none bg-background rounded-3xl shadow-2xl">
        <DialogHeader className="px-6 pt-6 pb-2">
          <div className="flex items-center gap-2">
            {step !== "summary" && step !== "success" && (
              <Button variant="ghost" size="icon" className="w-8 h-8 -ml-2" onClick={handleBack}>
                <ChevronLeft className="w-5 h-5" />
              </Button>
            )}
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-black italic">E</div>
              {step === "summary" && "Order Summary"}
              {step === "verification" && "Identity"}
              {step === "shipping" && "Delivery Address"}
              {step === "payment" && "Payment"}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="px-6 pb-8 pt-2 h-full">
          <AnimatePresence mode="wait">
            {loading && !session ? (
              <div className="h-64 flex flex-col items-center justify-center gap-4">
                <ErixSpinner className="w-10 h-10" />
                <p className="text-sm text-muted-foreground animate-pulse">Initializing premium checkout...</p>
              </div>
            ) : (
              <>
                {step === "summary" && renderSummary()}
                {step === "verification" && renderVerification()}
                {step === "shipping" && renderShipping()}
                {step === "payment" && renderPayment()}
                {step === "success" && renderSuccess()}
              </>
            )}
          </AnimatePresence>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3 rounded-lg bg-red-50 border border-red-100 flex items-start gap-2 text-red-600 text-sm"
            >
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p>{error}</p>
            </motion.div>
          )}
        </div>

        {/* Brand Footer */}
        <div className="px-6 py-4 bg-muted/30 border-t border-border/50 flex justify-between items-center text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
          <span>Secure Checkout</span>
          <span>Powered by ECODrIx Erix</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
