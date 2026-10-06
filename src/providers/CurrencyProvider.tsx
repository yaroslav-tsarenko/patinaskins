"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";

export type Currency = "GBP" | "EUR" | "USD";

/** The store's base currency: what the numbers in the database mean. Every
 *  other currency is derived from it at display time, so this is the one value
 *  that must agree with how prices were imported. */
export const BASE_CURRENCY: Currency = "GBP";

interface Rates {
  GBP: number;
  EUR: number;
  USD: number;
}

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  /** Takes an amount in BASE_CURRENCY and returns it in the selected one. */
  convert: (amountInBase: number) => number;
  rates: Rates;
}

const DEFAULT_RATES: Rates = { GBP: 1, EUR: 1.17, USD: 1.27 };

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>(BASE_CURRENCY);
  const [rates, setRates] = useState<Rates>(DEFAULT_RATES);

  useEffect(() => {
    const stored = localStorage.getItem("currency") as Currency | null;
    if (stored && ["GBP", "EUR", "USD"].includes(stored)) {
      setCurrencyState(stored);
    }
  }, []);

  useEffect(() => {
    fetch("/api/exchange-rates")
      .then((r) => r.json())
      .then((data) => {
        if (data.rates) {
          setRates({ GBP: 1, EUR: data.rates.EUR, USD: data.rates.USD });
        }
      })
      .catch(() => {});
  }, []);

  const setCurrency = (c: Currency) => {
    setCurrencyState(c);
    localStorage.setItem("currency", c);
  };

  const convert = useCallback(
    (amountInBase: number) => {
      if (currency === BASE_CURRENCY) return amountInBase;
      return Math.round(amountInBase * rates[currency] * 100) / 100;
    },
    [currency, rates]
  );

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, convert, rates }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}
