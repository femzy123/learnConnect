import SignupForm from "./SignupForm";

export const metadata = { title: "Sign up — LearnConect" };


export default function SignupPage() {

  return (
    <div className="min-h-screen px-4 flex items-center justify-center">
      <div className="w-full max-w-md space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Create your account</h1>
          <p className="text-sm text-muted-foreground">It takes less than a minute.</p>
        </div>

        <SignupForm />

        <div className="text-sm">
          Already have an account? <a className="underline" href="/auth/login">Log in</a>
        </div>
      </div>
    </div>
  );
}
