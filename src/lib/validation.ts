import { z } from "zod";

export const chatRequestSchema = z.object({
  conversation_id: z.string().uuid("معرّفُ المحادثةِ غيرُ صحيح"),
  message: z
    .string()
    .min(1, "الرسالةُ فارغة")
    .max(8000, "الرسالةُ طويلةٌ جداً (الحدّ الأقصى 8000 حرف)"),
  attachments: z
    .array(
      z.object({
        url: z.string().url(),
        type: z.string().max(100),
        name: z.string().max(255).optional(),
        base64: z
          .string()
          .max(10 * 1024 * 1024) // 10MB كحدٍّ أقصى للـ base64
          .optional(),
      })
    )
    .max(5, "الحدّ الأقصى خمسةُ مرفقات")
    .optional(),
});

export const newConversationSchema = z.object({
  project_id: z.string().uuid(),
  mode: z.enum(["chat", "strategy", "design", "video", "competitor"]),
  title: z.string().max(200).optional(),
});

export const newProjectSchema = z.object({
  name: z.string().min(1).max(200),
  brief: z.string().max(5000).nullable().optional(),
  business_type: z.string().max(50).default("general"),
  cover_color: z.enum(["violet", "blue", "emerald", "orange", "rose"]).default("violet"),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;
export type NewConversationRequest = z.infer<typeof newConversationSchema>;
export type NewProjectRequest = z.infer<typeof newProjectSchema>;
