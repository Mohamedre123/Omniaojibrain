"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { PLANS, CREDIT_PACKS, BYOK_PROVIDERS } from "@/lib/credits";
import { Coins, Loader2, Check, Trash2, KeyRound, Info } from "lucide-react";

export default function CreditsPage() {
  const [balance, setBalance] = useState<number | null>(null);
  const [plan, setPlan] = useState("free");
  const [byok, setByok] = useState<Record<string, boolean>>({});
  const [keyInputs, setKeyInputs] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState("");

  async function load() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: cr } = await supabase.from("user_credits").select("balance, plan").eq("user_id", user.id).maybeSingle();
    if (cr) { setBalance((cr as { balance: number }).balance); setPlan((cr as { plan: string }).plan || "free"); }
    else setBalance(0);
    const { data: keys } = await supabase.from("oji_connectors").select("service").eq("user_id", user.id).like("service", "byok:%");
    const map: Record<string, boolean> = {};
    for (const k of (keys as { service: string }[] | null) || []) map[k.service.replace("byok:", "")] = true;
    setByok(map);
  }
  useEffect(() => { void load(); }, []);

  async function saveKey(provider: string) {
    const val = (keyInputs[provider] || "").trim();
    if (!val) { toast.error("الصق المفتاح"); return; }
    setSaving(provider);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const service = `byok:${provider}`;
      await supabase.from("oji_connectors").delete().eq("user_id", user.id).eq("service", service);
      const { error } = await supabase.from("oji_connectors").insert({
        user_id: user.id, service, secret: `${service}-${user.id}-${Date.now()}`, config: { key: val }, enabled: true,
      });
      if (error) { toast.error("تعذّر الحفظ", { description: error.message }); return; }
      toast.success("اتحفظ مفتاحك ✅ — استخدامك دلوقتي على حسابك أنت");
      setKeyInputs((p) => ({ ...p, [provider]: "" }));
      void load();
    } finally { setSaving(""); }
  }
  async function removeKey(provider: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("oji_connectors").delete().eq("user_id", user.id).eq("service", `byok:${provider}`);
    void load();
    toast.success("اتشال المفتاح");
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-start gap-4 mb-6">
        <div className="size-12 rounded-2xl bg-primary/10 grid place-items-center text-primary shrink-0"><Coins className="size-6" /></div>
        <div>
          <h1 className="text-2xl font-bold">الرصيد والباقات</h1>
          <p className="text-muted-foreground mt-1">رصيدك، الباقات، شحن الكريديت، ومفتاحك الخاص.</p>
        </div>
      </div>

      <Card className="p-3 mb-4 flex items-start gap-2 text-xs bg-amber-500/10 border-amber-500/30">
        <Info className="size-4 text-amber-600 shrink-0 mt-0.5" />
        <span className="text-muted-foreground">الدفع لسه <b>مش مفعّل</b> — الأزرار عرض توضيحي لحد ما نربط بوابة الدفع. لكن <b>«مفتاحك الخاص»</b> تحت شغّال دلوقتي فعلاً.</span>
      </Card>

      {/* الرصيد */}
      <Card className="p-5 mb-4">
        <div className="text-sm text-muted-foreground">رصيدك الحالي</div>
        <div className="text-3xl font-extrabold text-primary mt-1">{balance === null ? "…" : balance} <span className="text-base font-normal text-muted-foreground">كريديت</span></div>
        <div className="text-xs text-muted-foreground mt-1">باقتك: {PLANS.find((p) => p.id === plan)?.name || "مجاني"}</div>
      </Card>

      {/* الباقات */}
      <h2 className="font-bold mb-3">الباقات</h2>
      <div className="grid sm:grid-cols-3 gap-3 mb-6">
        {PLANS.map((p) => (
          <Card key={p.id} className={`p-5 ${p.id === "pro" ? "ring-2 ring-primary/40" : ""}`}>
            <div className="font-bold text-lg">{p.name}</div>
            <div className="text-2xl font-extrabold mt-1">${p.priceUSD}<span className="text-sm font-normal text-muted-foreground">/شهر</span></div>
            <div className="text-xs text-primary mt-1">{p.credits} كريديت شهرياً</div>
            <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
              {p.features.map((f) => <li key={f} className="flex items-center gap-1.5"><Check className="size-3 text-emerald-500" /> {f}</li>)}
            </ul>
            <Button variant={p.id === "pro" ? "gradient" : "outline"} className="w-full mt-4" disabled title="يتفعّل عند ربط الدفع">
              {p.priceUSD === 0 ? "الباقة الحالية" : "اشترك (قريباً)"}
            </Button>
          </Card>
        ))}
      </div>

      {/* شحن كريديت */}
      <h2 className="font-bold mb-3">شحن كريديت لمرّة واحدة</h2>
      <div className="grid grid-cols-3 gap-3 mb-6">
        {CREDIT_PACKS.map((pk) => (
          <Card key={pk.priceUSD} className="p-4 text-center">
            <div className="text-xl font-extrabold">${pk.priceUSD}</div>
            <div className="text-xs text-primary mt-0.5">{pk.credits} كريديت</div>
            <Button variant="outline" size="sm" className="w-full mt-3" disabled title="يتفعّل عند ربط الدفع">اشحن (قريباً)</Button>
          </Card>
        ))}
      </div>

      {/* المفتاح الخاص BYOK — شغّال دلوقتي */}
      <h2 className="font-bold mb-1 flex items-center gap-2"><KeyRound className="size-5 text-primary" /> مفتاحك الخاص (BYOK)</h2>
      <p className="text-xs text-muted-foreground mb-3">أضف مفتاح الـ AI بتاعك، والموقع يستخدمه لاستخدامك — يبقى <b>بلا حدود وعلى حسابك أنت</b> مباشرة (بيتجاوز الكريديت).</p>
      <div className="space-y-3">
        {BYOK_PROVIDERS.map((prov) => (
          <Card key={prov.id} className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold text-sm">{prov.label} {byok[prov.id] && <span className="text-[10px] rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2 py-0.5">متصل</span>}</div>
              {byok[prov.id] && <button onClick={() => removeKey(prov.id)} className="text-destructive"><Trash2 className="size-4" /></button>}
            </div>
            <div className="flex gap-2">
              <Input value={keyInputs[prov.id] || ""} onChange={(e) => setKeyInputs((p) => ({ ...p, [prov.id]: e.target.value }))} placeholder={byok[prov.id] ? "مفتاح محفوظ — الصق جديد للتغيير" : "الصق المفتاح"} dir="ltr" className="text-xs" />
              <Button size="sm" variant="gradient" onClick={() => saveKey(prov.id)} disabled={saving === prov.id}>
                {saving === prov.id ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />} حفظ
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5">{prov.hint}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
