import { z } from "zod";

export const UserValidationSchema = z.object({
  name: z.string().min(1, "Please enter your name!"),
  email: z.string().email("Please enter a valid email!"),
  // contactNumber: z
  //   .string()
  //   .regex(/^\d{12}$/, "Please provide a valid phone number"),
  // address: z.string().min(1, "Please enter your address!"),
});
export const validationSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters "),
  basicUser: UserValidationSchema,
});

export const defaultValues = {
  password: "",
  basicUser: {
    name: "",
    email: "",
    contactNumber: "",
    address: "",
  },
};
