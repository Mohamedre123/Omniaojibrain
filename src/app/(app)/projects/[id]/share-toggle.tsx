"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import type { Project } from "@/types/db";
import { Share2, Copy, Check } from "lucide-react";

function genToken() {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function ShareToggle({ project, onUpdate }: { project: Project; onUpdate: () => void }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [shared, setShared] = useState(project.is_shared);
  const [token, setToken] = useState(project.share_token ?? "");
  const [copied, setCopied] = useState(false);

  const shareUrl =
    typeof window !== "undefined" && token
      ? `${window.location.origin}/share/${token}`
      : "";

  async function toggleShare(enable: boolean) {
    startTransition(async () => {
      const supabase = createClient();
      const newToken = enable ? token || genToken() : token;
      const { error } = await supabase
        .from("projects")
        .update({ is_shared: enable, share_token: newToken })
        .eq("id", project.id);
      if (error) {
        toast.error("حدثت مشكلة", { description: error.message });
        return;
      }
      setShared(enable);
      if (enable) setToken(newToken);
      onUpdate();
      toast.success(enable ? "تمّ تفعيلُ المشاركة 🔗" : "تمّ إيقافُ المشاركة");
    });
  }

  function copyLink() {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("تمّ نسخُ الرابط");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={shared ? "default" : "outline"} size="sm">
          <Share2 className="size-4" />
          {shared ? "مُتاحٌ للمشاركة" : "مشاركة"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>مشاركةُ المشروع مع عميلك</DialogTitle>
          <DialogDescription>
            سيتمكّن من الاطّلاع على الاستراتيجية والمخرجات، دون إمكانية التعديل أو الإضافة.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <div className="font-medium text-sm">تفعيلُ الرابطِ العام</div>
              <p className="text-xs text-muted-foreground mt-0.5">
                أيُّ شخصٍ لديه الرابط يستطيع فتح المشروع
              </p>
            </div>
            <Button
              variant={shared ? "destructive" : "gradient"}
              size="sm"
              disabled={pending}
              onClick={() => toggleShare(!shared)}
            >
              {shared ? "إيقاف" : "تفعيل"}
            </Button>
          </div>

          {shared && shareUrl && (
            <div className="space-y-2">
              <label className="text-sm font-medium">رابطُ المشاركة</label>
              <div className="flex gap-2">
                <Input value={shareUrl} readOnly className="font-mono text-xs" />
                <Button variant="outline" size="icon" onClick={copyLink}>
                  {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
