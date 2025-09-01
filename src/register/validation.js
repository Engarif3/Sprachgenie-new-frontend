// import { z } from "zod";

// export const UserValidationSchema = z.object({
//   name: z.string().min(1, "Please enter your name!"),
//   email: z.string().email("Please enter a valid email!"),
//   // contactNumber: z
//   //   .string()
//   //   .regex(/^\d{12}$/, "Please provide a valid phone number"),
//   // address: z.string().min(1, "Please enter your address!"),
// });
// export const validationSchema = z.object({
//   password: z.string().min(6, "Password must be at least 6 characters "),
//   basicUser: UserValidationSchema,
// });

// export const defaultValues = {
//   password: "",
//   basicUser: {
//     name: "",
//     email: "",
//     contactNumber: "",
//     address: "",
//   },
// };

import { z } from "zod";

// User fields validation
export const UserValidationSchema = z.object({
  name: z.string().min(1, "Please enter your name!"),
  email: z.string().email("Please enter a valid email!"),
  // contactNumber: z
  //   .string()
  //   .regex(/^\d{12}$/, "Please provide a valid phone number"),
  // address: z.string().min(1, "Please enter your address!"),
});

// Full registration validation schema
export const validationSchema = z
  .object({
    password: z
      .string()
      .min(10, "Password must be at least 10 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must include at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(
        /[-!@#$%^&*(),.?":{}|<>]/,
        "Password must include at least one special character"
      ),
    confirmPassword: z.string().min(10, "Please confirm your password"),
    basicUser: UserValidationSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// Default form values
export const defaultValues = {
  password: "",
  confirmPassword: "",
  basicUser: {
    name: "",
    email: "",
    contactNumber: "",
    address: "",
  },
};
