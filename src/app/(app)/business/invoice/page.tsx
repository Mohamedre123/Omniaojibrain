import { GeneratorTool } from "@/components/generator-tool";
import { Receipt } from "lucide-react";

export default function InvoicePage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <GeneratorTool
        tool="invoice"
        title="مولّد فواتير"
        description="فاتورة HTML احترافية قابلة للطباعة"
        icon={<Receipt className="size-6" />}
        savedKind="invoice"
        outputType="html"
        fields={[
          { name: "yourName", label: "اسمك / شركتك", type: "text", required: true },
          { name: "yourContact", label: "بياناتك (إيميل/تليفون/عنوان)", type: "textarea", rows: 2 },
          { name: "clientName", label: "اسم العميل", type: "text", required: true },
          { name: "clientContact", label: "بيانات العميل", type: "textarea", rows: 2 },
          { name: "invoiceNumber", label: "رقم الفاتورة", type: "text", placeholder: "INV-001" },
          { name: "items", label: "البنود (السطر: الخدمة | الكمية | السعر)", type: "textarea", rows: 5, required: true, placeholder: "تصميم لوجو | 1 | 1500\nصفحات سوشيال شهر | 12 | 250" },
          { name: "tax", label: "ضريبة %", type: "number", placeholder: "14" },
          { name: "currency", label: "العملة", type: "text", defaultValue: "ج.م" },
          { name: "dueDate", label: "تاريخ الاستحقاق", type: "text", placeholder: "DD/MM/YYYY" },
          { name: "paymentTerms", label: "شروط الدفع", type: "textarea", rows: 2, placeholder: "تحويل بنكي / فودافون كاش" },
        ]}
      />
    </div>
  );
}
