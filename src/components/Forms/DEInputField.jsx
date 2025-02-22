import { useState } from "react";
import { Controller, useFormContext } from "react-hook-form";
// import { EyeIcon, EyeOffIcon } from "@heroicons/react/outline";

const DEInputField = ({
  label,
  type,
  name,
  required,
  showPassword,
  togglePassword,
}) => {
  const { control } = useFormContext();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState: { error } }) => (
        <div className="w-full mb-4">
          <label
            htmlFor={name}
            className="block text-sm font-medium text-gray-700"
          >
            {label}
          </label>
          <div className="relative mt-1">
            <input
              id={name}
              type={
                type === "password"
                  ? showPassword
                    ? "text"
                    : "password"
                  : type
              }
              required={required}
              className={`w-full p-2 border rounded-md focus:ring focus:ring-blue-300 focus:outline-none ${
                error ? "border-red-500" : "border-gray-300"
              }`}
              {...field}
            />
            {type === "password" && (
              <button
                type="button"
                onClick={togglePassword}
                className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
              >
                {/* {showPassword ? (
                  <EyeOffIcon className="w-5 h-5" />
                ) : (
                  <EyeIcon className="w-5 h-5" />
                )} */}
              </button>
            )}
          </div>
          {error?.message && (
            <p className="text-sm text-red-500 mt-1">{error.message}</p>
          )}
        </div>
      )}
    />
  );
};

export default DEInputField;
