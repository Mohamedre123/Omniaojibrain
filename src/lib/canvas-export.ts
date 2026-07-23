"use client";

/** تصدير عنصر DOM كصورة PNG أو PDF بدقّة عالية (يُستخدم في مصمّمات الماركتنج) */
export async function exportElement(
  node: HTMLElement,
  opts: { name?: string; format?: "png" | "pdf"; bg?: string; scale?: number } = {}
): Promise<void> {
  const { name = "oji", format = "png", bg = "#ffffff", scale = 2 } = opts;
  const html2canvas = (await import("html2canvas")).default;
  const canvas = await html2canvas(node, { scale, backgroundColor: bg, useCORS: true, logging: false });

  if (format === "png") {
    const link = document.createElement("a");
    link.download = `${name}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    return;
  }

  const { default: jsPDF } = await import("jspdf");
  const img = canvas.toDataURL("image/png");
  const pdf = new jsPDF({ unit: "px", format: [canvas.width, canvas.height] });
  pdf.addImage(img, "PNG", 0, 0, canvas.width, canvas.height);
  pdf.save(`${name}.pdf`);
}

/** يفتّح (+) أو يغمّق (−) لون Hex بنسبة مئوية */
export function shade(hex: string, percent: number): string {
  const h = hex.replace("#", "");
  if (h.length !== 6) return hex;
  const num = parseInt(h, 16);
  const amt = Math.round(2.55 * percent);
  const r = Math.max(0, Math.min(255, (num >> 16) + amt));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + amt));
  const b = Math.max(0, Math.min(255, (num & 0xff) + amt));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

/** يقرأ ملف صورة ويرجّعه Data URL */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(new Error("read error"));
    r.readAsDataURL(file);
  });
}
