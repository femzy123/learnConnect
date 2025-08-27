import { createClient } from "@/utils/supabase/server";

export const metadata = { title: "Reset password — LearnConect" };

async function sendReset(formData) {
  "use server";
  const email = String(formData.get("email") || "");
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${
      process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
    }/auth/login?reset=1`,
  });
}

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen px-4 flex items-center justify-center">
      <div className="w-full max-w-md space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Reset password</h1>
          <p className="text-sm text-muted-foreground">
            Enter your email and we’ll send you a reset link.
          </p>
        </div>
        <form action={sendReset} className="grid gap-4">
          <div className="grid gap-2">
            <label htmlFor="email" className="text-sm">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="h-10 rounded-md border bg-background px-3"
            />
          </div>
          <button className="h-10 rounded-md bg-primary px-4 text-primary-foreground">
            Send reset link
          </button>
        </form>
      </div>
    </div>
  );
}
