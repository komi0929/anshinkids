import { z } from "zod";

/**
 * Enterprise standard response type for Server Actions
 * Ensures consistent handling of successes and errors across the application.
 */
export type ActionResponse<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string; code?: string };

/**
 * Common Zod validation schemas for input sanitization
 */
export const CommonSchemas = {
  UUID: z.string().uuid("Invalid ID format"),
  PageSlug: z.string().min(1).max(100).regex(/^[a-zA-Z0-9\-_]+$/, "Invalid slug format"),
  ChatMessage: z.string()
    .min(1, "メッセージを入力してください")
    .max(1000, "メッセージは1000文字以内で入力してください")
    .refine(s => s.trim().length > 0, "空白のみのメッセージは投稿できません"),
  DisplayName: z.string()
    .min(1, "名前を入力してください")
    .max(20, "名前は20文字以内で入力してください"),
};
