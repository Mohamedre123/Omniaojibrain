"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator, Copy } from "lucide-react";

const CURRENCIES = ["ج.م", "ر.س", "د.إ", "د.ك", "$", "€"];

export default function PricingPage() {
  const [cost, setCost] = useState("100");
  const [shipping, setShipping] = useState("0");
  const [fees, setFees] = useState("3");
  const [margin, setMargin] = useState("40");
  const [currency, setCurrency] = useState("ج.م");

  const num = (v: string) => {
    const n = parseFloat(v);
    return isFinite(n) ? n : 0;
  };

  const r = useMemo(() => {
    const baseCost = num(cost) + num(shipping);
    const feePct = num(fees) / 100;
    const marginPct = num(margin) / 100;
    const denom = 1 - feePct - marginPct;
    if (denom <= 0) return null; // الهامش + الرسوم ≥ 100% → غير ممكن
    const price = baseCost / denom;
    const profit = price - baseCost - price * feePct;

    const round9 = (x: number) => {
      const n = Math.ceil(x);
      return Math.ceil(n / 10) * 10 - 1;
    };
    const psych = round9(price);

    const bundle = (qty: number, discount: number) => {
      const gross = price * qty * (1 - discount);
      const profitB = gross - qty * baseCost - gross * feePct;
      return { qty, discount, gross, profit: profitB };
    };

    return {
      baseCost,
      price,
      psych,
      profit,
      realMargin: (profit / price) * 100,
      bundles: [bundle(2, 0.1), bundle(3, 0.15)],
    };
  }, [cost, shipping, fees, margin]);

  const fmt = (x: number) => `${x.toLocaleString("en-US", { maximumFractionDigits: 1 })} ${currency}`;

  function copySummary() {
    if (!r) return;
    const lines = [
      `السعر المقترح: ${fmt(r.price)} (سعر نفسي: ${fmt(r.psych)})`,
      `الربح للقطعة: ${fmt(r.profit)} — هامش ${r.realMargin.toFixed(0)}%`,
      `باقة 2 قطعة (خصم 10%): ${fmt(r.bundles[0].gross)} — ربحك ${fmt(r.bundles[0].profit)}`,
      `باقة 3 قطع (خصم 15%): ${fmt(r.bundles[1].gross)} — ربحك ${fmt(r.bundles[1].profit)}`,
    ];
    navigator.clipboard.writeText(lines.join("\n"));
    toast.success("اتنسخ الملخّص");
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-start gap-4 mb-6">
        <div className="size-12 rounded-xl bg-primary/10 grid place-items-center text-primary shrink-0">
          <Calculator className="size-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">حاسبة التسعير والعروض</h1>
          <p className="text-muted-foreground mt-1">احسب السعر المثالي وربحك، وجهّز باقات وأسعار نفسية</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 items-start">
        <Card className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>تكلفة المنتج</Label>
              <Input value={cost} onChange={(e) => setCost(e.target.value)} inputMode="decimal" className="mt-1" />
            </div>
            <div>
              <Label>تكلفة الشحن</Label>
              <Input value={shipping} onChange={(e) => setShipping(e.target.value)} inputMode="decimal" className="mt-1" />
            </div>
            <div>
              <Label>رسوم المنصّة/الدفع %</Label>
              <Input value={fees} onChange={(e) => setFees(e.target.value)} inputMode="decimal" className="mt-1" />
            </div>
            <div>
              <Label>هامش الربح المطلوب %</Label>
              <Input value={margin} onChange={(e) => setMargin(e.target.value)} inputMode="decimal" className="mt-1" />
            </div>
          </div>
          <div>
            <Label>العملة</Label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </Card>

        <div className="space-y-4">
          {!r ? (
            <Card className="p-6 text-center text-sm text-destructive">
              مجموع الهامش + الرسوم لازم يكون أقلّ من 100%. قلّل الهامش المطلوب.
            </Card>
          ) : (
            <>
              <Card className="p-5">
                <div className="text-sm text-muted-foreground">السعر المقترح للبيع</div>
                <div className="text-3xl font-extrabold text-primary mt-1">{fmt(r.price)}</div>
                <div className="mt-2 text-sm">
                  سعر نفسي مقترح: <span className="font-bold">{fmt(r.psych)}</span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg bg-muted/40 p-3">
                    <div className="text-muted-foreground text-xs">ربحك للقطعة</div>
                    <div className="font-bold text-emerald-600 dark:text-emerald-400">{fmt(r.profit)}</div>
                  </div>
                  <div className="rounded-lg bg-muted/40 p-3">
                    <div className="text-muted-foreground text-xs">الهامش الفعلي</div>
                    <div className="font-bold">{r.realMargin.toFixed(0)}%</div>
                  </div>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">إجمالي التكلفة للقطعة: {fmt(r.baseCost)}</div>
              </Card>

              <Card className="p-5 space-y-3">
                <div className="font-semibold text-sm">باقات مقترحة (Bundles)</div>
                {r.bundles.map((b) => (
                  <div key={b.qty} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                    <div>
                      <span className="font-bold">{b.qty} قطع</span>
                      <span className="text-muted-foreground"> · خصم {(b.discount * 100).toFixed(0)}%</span>
                    </div>
                    <div className="text-left">
                      <div className="font-bold">{fmt(b.gross)}</div>
                      <div className="text-xs text-emerald-600 dark:text-emerald-400">ربحك {fmt(b.profit)}</div>
                    </div>
                  </div>
                ))}
              </Card>

              <Button variant="outline" onClick={copySummary} className="w-full">
                <Copy className="size-4" /> نسخ الملخّص
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
