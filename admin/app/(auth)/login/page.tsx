"use client";

import { SignIn } from "@clerk/nextjs";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-[420px]">
        <SignIn
          appearance={{
            variables: {
              // Make Clerk's default UI more compact for mobile OTP inputs.
              spacing: "0.5rem",
              fontSize: {
                xs: "12px",
                sm: "14px",
                md: "15px",
                lg: "16px",
                xl: "16px",
              },
            },
          }}
        />
      </div>
    </div>
  );
}
