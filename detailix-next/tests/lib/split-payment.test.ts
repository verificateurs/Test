import { describe, it, expect, afterEach, vi } from "vitest";
import {
  DefaultSplitPaymentProvider,
  SPLIT_PAYMENT_MIN_AMOUNT_EUR,
  isSplitPaymentEnabled,
  shouldShowSplitPayment,
} from "@/lib/split-payment";

describe("DefaultSplitPaymentProvider.computeInstallments", () => {
  const provider = new DefaultSplitPaymentProvider();

  it("splits an amount into 3x and 4x plans", () => {
    const plans = provider.computeInstallments(12000); // 120.00€
    expect(plans).toEqual([
      { count: 3, amountPerInstallment: 4000 },
      { count: 4, amountPerInstallment: 3000 },
    ]);
  });

  it("rounds each installment to the nearest cent", () => {
    const plans = provider.computeInstallments(10000); // 100.00€
    const three = plans.find((p) => p.count === 3)!;
    expect(three.amountPerInstallment).toBe(3333);
  });

  it("returns an empty array for non-positive amounts", () => {
    expect(provider.computeInstallments(0)).toEqual([]);
    expect(provider.computeInstallments(-500)).toEqual([]);
  });
});

describe("isSplitPaymentEnabled / shouldShowSplitPayment", () => {
  const originalValue = process.env.PAYMENT_SPLIT_ENABLED;

  afterEach(() => {
    if (originalValue === undefined) delete process.env.PAYMENT_SPLIT_ENABLED;
    else process.env.PAYMENT_SPLIT_ENABLED = originalValue;
    vi.unstubAllEnvs();
  });

  it("is disabled by default (env var unset)", () => {
    delete process.env.PAYMENT_SPLIT_ENABLED;
    expect(isSplitPaymentEnabled()).toBe(false);
    expect(shouldShowSplitPayment(500)).toBe(false);
  });

  it("stays disabled for any value other than 'true'", () => {
    process.env.PAYMENT_SPLIT_ENABLED = "1";
    expect(isSplitPaymentEnabled()).toBe(false);
  });

  it("enables display above the minimum amount when flag is 'true'", () => {
    process.env.PAYMENT_SPLIT_ENABLED = "true";
    expect(isSplitPaymentEnabled()).toBe(true);
    expect(shouldShowSplitPayment(SPLIT_PAYMENT_MIN_AMOUNT_EUR)).toBe(true);
    expect(shouldShowSplitPayment(SPLIT_PAYMENT_MIN_AMOUNT_EUR - 0.01)).toBe(false);
  });
});
