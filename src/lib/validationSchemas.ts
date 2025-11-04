import { z } from "zod";

// Customer validation schema
export const customerSchema = z.object({
  customer_contact: z
    .string()
    .trim()
    .min(1, "Contact information is required")
    .max(1000, "Contact information must be less than 1000 characters"),
  name: z
    .string()
    .trim()
    .max(100, "Name must be less than 100 characters"),
  phone: z
    .string()
    .trim()
    .max(20, "Phone must be less than 20 characters")
    .regex(/^$|^[0-9\s\-\+\(\)]*$/, "Phone must contain only numbers and standard phone characters"),
  address: z
    .string()
    .trim()
    .max(500, "Address must be less than 500 characters"),
  notes: z
    .string()
    .trim()
    .max(1000, "Notes must be less than 1000 characters"),
}).transform((data) => ({
  customer_contact: data.customer_contact,
  name: data.name || undefined,
  phone: data.phone || undefined,
  address: data.address || undefined,
  notes: data.notes || undefined,
}));

// Book validation schema
export const bookSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  author: z.string().trim().min(1, "Author is required").max(200, "Author must be less than 200 characters"),
  isbn: z.string().trim().max(20, "ISBN must be less than 20 characters").regex(/^$|^[0-9\-X]*$/, "ISBN must contain only numbers, hyphens, and X"),
  description: z.string().trim().max(2000, "Description must be less than 2000 characters"),
  price: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, { message: "Price must be a valid positive number" }),
  category: z.string().trim().max(100, "Category must be less than 100 characters"),
  publisher: z.string().trim().max(200, "Publisher must be less than 200 characters"),
  stock_quantity: z.string().refine((val) => !isNaN(parseInt(val)) && parseInt(val) >= 0, { message: "Stock quantity must be a valid non-negative number" }),
  pages: z.string().refine((val) => val === "" || (!isNaN(parseInt(val)) && parseInt(val) > 0), { message: "Pages must be a valid positive number" }),
  language: z.string().trim().min(1, "Language is required").max(50, "Language must be less than 50 characters"),
  cover_image_url: z.string().trim().max(500, "URL must be less than 500 characters").refine(val => val === "" || z.string().url().safeParse(val).success, { message: "Must be a valid URL" }),
});

// Author validation schema
export const authorSchema = z.object({
  name: z.string().trim().min(1, "Author name is required").max(200, "Name must be less than 200 characters"),
  biography: z.string().trim().max(2000, "Biography must be less than 2000 characters"),
  nationality: z.string().trim().max(100, "Nationality must be less than 100 characters"),
  website: z.string().trim().max(500, "URL must be less than 500 characters").refine(val => val === "" || z.string().url().safeParse(val).success, { message: "Must be a valid URL" }),
});

// Category validation schema
export const categorySchema = z.object({
  name: z.string().trim().min(1, "Category name is required").max(100, "Name must be less than 100 characters"),
  description: z.string().trim().max(500, "Description must be less than 500 characters"),
});

// Product validation schema
export const productSchema = z.object({
  sku: z
    .string()
    .trim()
    .min(1, "SKU is required")
    .max(50, "SKU must be less than 50 characters")
    .regex(/^[A-Z0-9\-_]+$/i, "SKU must contain only letters, numbers, hyphens, and underscores"),
  name: z
    .string()
    .trim()
    .min(1, "Product name is required")
    .max(200, "Name must be less than 200 characters"),
  description: z
    .string()
    .trim()
    .max(1000, "Description must be less than 1000 characters"),
  price: z
    .string()
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
      message: "Price must be a valid positive number",
    }),
  category: z
    .string()
    .trim()
    .max(100, "Category must be less than 100 characters"),
  stock_quantity: z
    .string()
    .refine((val) => !isNaN(parseInt(val)) && parseInt(val) >= 0, {
      message: "Stock quantity must be a valid non-negative number",
    }),
  status: z.enum(["active", "inactive"], {
    errorMap: () => ({ message: "Status must be either active or inactive" }),
  }),
});

// User profile validation schema
export const userProfileSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(1, "Full name is required")
    .max(100, "Name must be less than 100 characters")
    .regex(/^[a-zA-Z\s\-'\.]+$/, "Name must contain only letters, spaces, hyphens, apostrophes, and periods"),
  email: z
    .string()
    .trim()
    .email("Must be a valid email address")
    .max(255, "Email must be less than 255 characters"),
});

// User creation validation schema (includes password)
export const userCreationSchema = userProfileSchema.extend({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be less than 72 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

// Password change validation schema
export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be less than 72 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string().min(1, "Confirm password is required"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// CSV value sanitization to prevent CSV injection
export const sanitizeCSVValue = (value: string): string => {
  // Prevent CSV formula injection by prefixing values that start with =, +, -, @
  if (/^[=+\-@]/.test(value)) {
    return "'" + value;
  }
  return value;
};

// Helper function to format zod validation errors for display
export const formatZodError = (error: z.ZodError): string => {
  return error.errors.map((err) => err.message).join(", ");
};
