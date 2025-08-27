import LoginForm from "./LoginForm";
export const metadata = { title: "Log in — LearnConect" };

export default function LoginPage() {
  return (
    <div className="min-h-screen px-4 flex items-center justify-center">
      <div className="w-full max-w-md space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Log in</h1>
          <p className="text-sm text-muted-foreground">Welcome back to LearnConect.</p>
        </div>

        <LoginForm />

        <div className="text-sm">
          <a className="underline" href="/auth/forgot-password">Forgot password?</a>
        </div>
        <div className="text-sm">
          New here? <a className="underline" href="/auth/signup">Create an account</a>
        </div>
      </div>
    </div>
  );
}
