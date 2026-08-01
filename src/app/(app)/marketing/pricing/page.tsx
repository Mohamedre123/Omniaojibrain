"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator, Copy, RotateCcw } from "lucide-react";

type Mode = "product" | "ecom" | "service";
type EcomModel = "ecom" | "drop";
const CURRENCIES = ["ج.م", "ر.س", "د.إ", "د.ك", "$", "€"];
const KEY = "oji_pricing_v2";

const num = (v: string) => { const x = parseFloat(v); return isFinite(x) ? x : 0; };

const DEFAULTS = {
  currency: "ج.م",
  // منتج
  cost: "100", shipping: "0", fees: "3", margin: "40",
  // متجر / إعلانات
  model: "ecom" as EcomModel, sp: "500", pc: "180", sh: "60", cod: "1.5", handling: "15",
  conf: "70", deliv: "85", returnCost: "40", adCost: "90",
  // خدمة / فريلانس
  targetIncome: "20000", billableHours: "120", fixedMonthly: "2000",
  projectHours: "20", projectCosts: "0", profitPct: "20",
};
type State = typeof DEFAULTS;

export default function PricingPage() {
  const [mode, setMode] = useState<Mode>("product");
  const [f, setF] = useState<State>(DEFAULTS);
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setF({ ...DEFAULTS, ...JSON.parse(raw) });
    } catch { /* ignore */ }
    setRestored(true);
  }, []);
  useEffect(() => {
    if (!restored) return;
    try { localStorage.setItem(KEY, JSON.stringify(f)); } catch { /* ignore */ }
  }, [f, restored]);

  const set = (k: keyof State, v: string) => setF((p) => ({ ...p, [k]: v }));
  const fmt = (x: number) => `${x.toLocaleString("en-US", { maximumFractionDigits: 1 })} ${f.currency}`;

  // ===== وضع تسعير المنتج =====
  const product = useMemo(() => {
    const baseCost = num(f.cost) + num(f.shipping);
    const feePct = num(f.fees) / 100;
    const marginPct = num(f.margin) / 100;
    const denom = 1 - feePct - marginPct;
    if (denom <= 0) return null;
    const price = baseCost / denom;
    const profit = price - baseCost - price * feePct;
    const round9 = (x: number) => Math.ceil(Math.ceil(x) / 10) * 10 - 1;
    const bundle = (qty: number, discount: number) => {
      const gross = price * qty * (1 - discount);
      return { qty, discount, gross, profit: gross - qty * baseCost - gross * feePct };
    };
    return { baseCost, price, psych: round9(price), profit, realMargin: (profit / price) * 100, bundles: [bundle(2, 0.1), bundle(3, 0.15)] };
  }, [f.cost, f.shipping, f.fees, f.margin]);

  // ===== وضع ربحية المتجر / الإعلانات =====
  const ecom = useMemo(() => {
    const SP = num(f.sp), PC = num(f.pc), SH = num(f.sh), handling = num(f.handling);
    const codFee = SP * (num(f.cod) / 100);
    const conf = Math.min(Math.max(num(f.conf) / 100, 0), 1);
    const deliv = Math.min(Math.max(num(f.deliv) / 100, 0), 1);
    const grossPerDelivered = SP - PC - SH - codFee - handling;
    const returnLoss = f.model === "ecom" ? SH + num(f.returnCost) : 0;
    const profitPerConfirmed = deliv * grossPerDelivered - (1 - deliv) * returnLoss;
    const profitPerLead = conf * profitPerConfirmed;
    const beRoas = profitPerConfirmed > 0 ? SP / profitPerConfirmed : Infinity;
    const netPerConfirmed = profitPerConfirmed - num(f.adCost);
    return {
      SP, grossPerDelivered, profitPerConfirmed, profitPerLead, beCPO: profitPerConfirmed,
      beCPL: profitPerLead, beRoas, netPerConfirmed, netMargin: SP > 0 ? (netPerConfirmed / SP) * 100 : 0,
      profitable: netPerConfirmed > 0, possible: profitPerConfirmed > 0,
    };
  }, [f.sp, f.pc, f.sh, f.cod, f.handling, f.conf, f.deliv, f.returnCost, f.adCost, f.model]);

  // ===== وضع تسعير الخدمة / الفريلانس =====
  const service = useMemo(() => {
    const billable = num(f.billableHours);
    const hourly = billable > 0 ? (num(f.targetIncome) + num(f.fixedMonthly)) / billable : 0;
    const baseCost = num(f.projectHours) * hourly + num(f.projectCosts);
    const price = baseCost * (1 + num(f.profitPct) / 100);
    return { hourly, baseCost, price, profit: price - baseCost };
  }, [f.targetIncome, f.billableHours, f.fixedMonthly, f.projectHours, f.projectCosts, f.profitPct]);

  function copySummary() {
    let lines: string[] = [];
    if (mode === "product" && product) lines = [
      `السعر المقترح: ${fmt(product.price)} (نفسي: ${fmt(product.psych)})`,
      `ربح القطعة: ${fmt(product.profit)} — هامش ${product.realMargin.toFixed(0)}%`,
    ];
    else if (mode === "ecom") lines = [
      `ربح الأوردر قبل الإعلان: ${fmt(ecom.profitPerConfirmed)}`,
      `أقصى تكلفة إعلان للأوردر: ${fmt(ecom.beCPO)} · BE ROAS: ${ecom.possible ? ecom.beRoas.toFixed(2) : "غير ممكن"}`,
      `صافي الربح للأوردر: ${fmt(ecom.netPerConfirmed)} (هامش ${ecom.netMargin.toFixed(0)}%)`,
    ];
    else lines = [
      `سعر الساعة: ${fmt(service.hourly)}`,
      `سعر المشروع المقترح: ${fmt(service.price)} — ربحك ${fmt(service.profit)}`,
    ];
    navigator.clipboard.writeText(lines.join("\n"));
    toast.success("اتنسخ الملخّص");
  }

  const MODES: { v: Mode; l: string }[] = [
    { v: "product", l: "تسعير منتج" },
    { v: "ecom", l: "ربحية متجر / إعلانات" },
    { v: "service", l: "خدمة / فريلانس" },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex items-start gap-4 mb-6">
        <div className="size-12 rounded-xl bg-primary/10 grid place-items-center text-primary shrink-0">
          <Calculator className="size-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">حاسبة التسعير الشاملة</h1>
          <p className="text-muted-foreground mt-1">كل اللي تحتاجه للتسعير في مكان واحد: منتج · ربحية متجر وإعلانات (BE ROAS) · خدمة/فريلانس.</p>
        </div>
      </div>

      {/* اختيار الوضع */}
      <div className="flex flex-wrap gap-2 mb-5">
        {MODES.map((m) => (
          <button key={m.v} onClick={() => setMode(m.v)} className={`px-4 py-2 rounded-lg text-sm border transition-all ${mode === m.v ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:border-primary/50"}`}>
            {m.l}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        {/* ===== المدخلات ===== */}
        <Card className="p-5 space-y-4">
          {mode === "product" && (
            <div className="grid grid-cols-2 gap-3">
              <NumField label="تكلفة المنتج" value={f.cost} onChange={(v) => set("cost", v)} />
              <NumField label="تكلفة الشحن" value={f.shipping} onChange={(v) => set("shipping", v)} />
              <NumField label="رسوم المنصّة/الدفع %" value={f.fees} onChange={(v) => set("fees", v)} />
              <NumField label="هامش الربح المطلوب %" value={f.margin} onChange={(v) => set("margin", v)} />
            </div>
          )}

          {mode === "ecom" && (
            <>
              <div>
                <Label className="mb-2 block text-sm">النموذج</Label>
                <div className="inline-flex rounded-lg border bg-background p-0.5 text-sm">
                  <button onClick={() => set("model", "ecom")} className={`px-4 py-1.5 rounded-md font-medium transition-all ${f.model === "ecom" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>تجارة (ECOM)</button>
                  <button onClick={() => set("model", "drop")} className={`px-4 py-1.5 rounded-md font-medium transition-all ${f.model === "drop" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>دروبشيبينج</button>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">{f.model === "ecom" ? "أنت تتحمّل الشحن والمرتجعات." : "المورّد يتحمّل الشحن والمرتجعات."}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <NumField label="سعر البيع" value={f.sp} onChange={(v) => set("sp", v)} />
                <NumField label="تكلفة المنتج" value={f.pc} onChange={(v) => set("pc", v)} />
                <NumField label="تكلفة الشحن" value={f.sh} onChange={(v) => set("sh", v)} />
                <NumField label="رسوم COD %" value={f.cod} onChange={(v) => set("cod", v)} hint="نسبة من سعر البيع" />
                <NumField label="تكاليف إضافية/تغليف" value={f.handling} onChange={(v) => set("handling", v)} />
                {f.model === "ecom" && <NumField label="تكلفة شحن المرتجع" value={f.returnCost} onChange={(v) => set("returnCost", v)} />}
              </div>
              <div className="border-t pt-4 grid grid-cols-2 gap-3">
                <NumField label="نسبة التأكيد %" value={f.conf} onChange={(v) => set("conf", v)} />
                <NumField label="نسبة التسليم %" value={f.deliv} onChange={(v) => set("deliv", v)} hint="من المؤكّد" />
                <NumField label="تكلفة الإعلان للأوردر" value={f.adCost} onChange={(v) => set("adCost", v)} hint="CPP الفعلي (اختياري)" />
              </div>
            </>
          )}

          {mode === "service" && (
            <div className="grid grid-cols-2 gap-3">
              <NumField label="الدخل الشهري المستهدف" value={f.targetIncome} onChange={(v) => set("targetIncome", v)} />
              <NumField label="ساعات العمل الفعّالة/شهر" value={f.billableHours} onChange={(v) => set("billableHours", v)} hint="اللي بتشتغلها فعلاً" />
              <NumField label="مصاريف ثابتة شهرية" value={f.fixedMonthly} onChange={(v) => set("fixedMonthly", v)} hint="أدوات، اشتراكات..." />
              <NumField label="ساعات المشروع" value={f.projectHours} onChange={(v) => set("projectHours", v)} />
              <NumField label="تكاليف مباشرة للمشروع" value={f.projectCosts} onChange={(v) => set("projectCosts", v)} />
              <NumField label="هامش ربح إضافي %" value={f.profitPct} onChange={(v) => set("profitPct", v)} />
            </div>
          )}

          <div className="pt-2">
            <Label className="text-xs">العملة</Label>
            <select value={f.currency} onChange={(e) => set("currency", e.target.value)} className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={copySummary} className="flex-1"><Copy className="size-4" /> نسخ الملخّص</Button>
            <Button variant="ghost" onClick={() => setF(DEFAULTS)}><RotateCcw className="size-4" /> تصفير</Button>
          </div>
        </Card>

        {/* ===== النتائج ===== */}
        <div className="space-y-4 lg:sticky lg:top-6">
          {mode === "product" && (
            !product ? (
              <Card className="p-6 text-center text-sm text-destructive">مجموع الهامش + الرسوم لازم يكون أقلّ من 100%. قلّل الهامش.</Card>
            ) : (
              <>
                <Card className="p-5">
                  <div className="text-sm text-muted-foreground">السعر المقترح للبيع</div>
                  <div className="text-3xl font-extrabold text-primary mt-1">{fmt(product.price)}</div>
                  <div className="mt-2 text-sm">سعر نفسي مقترح: <span className="font-bold">{fmt(product.psych)}</span></div>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <Metric label="ربحك للقطعة" value={fmt(product.profit)} good />
                    <Metric label="الهامش الفعلي" value={`${product.realMargin.toFixed(0)}%`} />
                  </div>
                </Card>
                <Card className="p-5 space-y-3">
                  <div className="font-semibold text-sm">باقات مقترحة</div>
                  {product.bundles.map((b) => (
                    <div key={b.qty} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                      <div><span className="font-bold">{b.qty} قطع</span> <span className="text-muted-foreground">· خصم {(b.discount * 100).toFixed(0)}%</span></div>
                      <div className="text-left"><div className="font-bold">{fmt(b.gross)}</div><div className="text-xs text-emerald-600 dark:text-emerald-400">ربحك {fmt(b.profit)}</div></div>
                    </div>
                  ))}
                </Card>
              </>
            )
          )}

          {mode === "ecom" && (
            <>
              <Card className={`p-5 border-2 ${ecom.profitable ? "border-emerald-500/40" : "border-destructive/40"}`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">صافي الربح للأوردر (بعد الإعلان)</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${ecom.profitable ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-destructive/15 text-destructive"}`}>{ecom.profitable ? "ربح ✅" : "خسارة ⚠️"}</span>
                </div>
                <div className={`text-3xl font-extrabold mt-1 ${ecom.profitable ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>{fmt(ecom.netPerConfirmed)}</div>
                <div className="text-sm text-muted-foreground mt-1">الهامش الصافي: {ecom.netMargin.toFixed(0)}%</div>
              </Card>
              <div className="grid grid-cols-2 gap-3">
                <Metric label="ربح الأوردر قبل الإعلان" value={fmt(ecom.profitPerConfirmed)} sub="بحساب المرتجعات" />
                <Metric label="ربح الأوردر لو اتسلّم" value={fmt(ecom.grossPerDelivered)} sub="من غير مرتجعات" />
                <Metric label="أقصى تكلفة إعلان للأوردر" value={fmt(ecom.beCPO)} sub="نقطة التعادل" highlight />
                <Metric label="BE ROAS" value={ecom.possible ? ecom.beRoas.toFixed(2) : "غير ممكن"} sub="لازم ROAS الفعلي أعلى منه" highlight />
              </div>
              <Card className="p-4 text-xs text-muted-foreground leading-relaxed">
                {!ecom.possible ? (
                  <span className="text-destructive font-medium">بالأرقام دي مفيش ربح ممكن حتى قبل الإعلان — قلّل التكلفة أو ارفع السعر أو حسّن نسبة التسليم.</span>
                ) : (
                  <>💡 عشان تكسب: خلّي تكلفة الأوردر من الإعلان أقلّ من <b>{fmt(ecom.beCPO)}</b>، أو الـ ROAS الفعلي أعلى من <b>{ecom.beRoas.toFixed(2)}</b>. أقصى تكلفة لكل ليد: <b>{fmt(ecom.beCPL)}</b>.</>
                )}
              </Card>
            </>
          )}

          {mode === "service" && (
            <>
              <Card className="p-5">
                <div className="text-sm text-muted-foreground">سعر المشروع المقترح</div>
                <div className="text-3xl font-extrabold text-primary mt-1">{fmt(service.price)}</div>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <Metric label="سعر الساعة" value={fmt(service.hourly)} />
                  <Metric label="ربحك من المشروع" value={fmt(service.profit)} good />
                </div>
              </Card>
              <Card className="p-4 text-xs text-muted-foreground leading-relaxed">
                💡 سعر الساعة اتحسب من: (دخلك المستهدف + مصاريفك الثابتة) ÷ ساعات عملك الفعّالة. متنساش تحسب وقت المراجعات والتعديلات ضمن ساعات المشروع.
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function NumField({ label, value, onChange, hint }: { label: string; value: string; onChange: (v: string) => void; hint?: string }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} inputMode="decimal" className="mt-1" />
      {hint && <p className="text-[10px] text-muted-foreground mt-0.5">{hint}</p>}
    </div>
  );
}

function Metric({ label, value, sub, highlight, good }: { label: string; value: string; sub?: string; highlight?: boolean; good?: boolean }) {
  return (
    <div className={`rounded-lg border p-3 ${highlight ? "bg-primary/5 border-primary/30" : "bg-muted/30"}`}>
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className={`font-bold mt-0.5 ${highlight ? "text-primary" : good ? "text-emerald-600 dark:text-emerald-400" : ""}`}>{value}</div>
      {sub && <div className="text-[10px] text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}
