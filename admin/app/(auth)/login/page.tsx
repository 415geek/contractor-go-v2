import { SignIn } from "@clerk/nextjs";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <SignIn />
    </div>
  );
}
