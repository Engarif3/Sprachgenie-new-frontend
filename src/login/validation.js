import { z } from "zod";

export const validationSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Please enter your password"),
});
