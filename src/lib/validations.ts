import { z } from "zod";

export const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const signUpSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
});

export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
export const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "text/plain",
  "text/markdown",
  "text/md",
  "application/octet-stream", // For .md files
];

export const fileUploadSchema = z.object({
  file: z
    .any()
    .refine((file) => file?.size <= MAX_FILE_SIZE, "File size must be less than 100MB")
    .refine(
      (file) => ALLOWED_FILE_TYPES.includes(file?.type) || file?.name?.endsWith(".md"),
      "Only PDF, Markdown, and plain text files are allowed"
    ),
});
