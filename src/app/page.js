import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/utils/supabase/server";

export const metadata = {
  title: "LearnConect — Find the right teacher",
  description: "Students meet vetted teachers for anything they want to learn.",
};

export default async function LandingPage() {
  const supabase = await createClient();
  const { data: { user } = {} } = await supabase.auth.getUser();

  // Work out the dashboard link based on profile role
  let dashboardHref = "/dashboard/student";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profile?.role) dashboardHref = `/dashboard/${profile.role}`;
  }

  return (
    <div>
      <SiteHeader user={user} />

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Learn anything with a vetted teacher
            </h1>
            <p className="mt-4 max-w-prose text-muted-foreground">
              Languages, programming, exams, music—submit what you want to learn and we’ll match
              you with a verified teacher. Pay safely; release after you’re satisfied.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {!user ? (
                <>
                  <Button asChild>
                    <Link href="/auth/signup">Get started</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/auth/login">I already have an account</Link>
                  </Button>
                </>
              ) : (
                <Button asChild>
                  <Link href={dashboardHref}>Go to your dashboard</Link>
                </Button>
              )}
            </div>
            <div className="mt-3 text-xs text-muted-foreground">
              No credit card required to start.
            </div>
          </div>

          {/* Category highlight */}
          <Card className="border-dashed">
            <CardContent className="p-6">
              <div id="categories" className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                {[
                  "Languages",
                  "Programming",
                  "Math",
                  "Science",
                  "Test Prep",
                  "Music",
                  "Art & Design",
                  "Business",
                  "Career Skills",
                ].map((c) => (
                  <div key={c} className="rounded-lg border p-3 text-center">
                    {c}
                  </div>
                ))}
              </div>
              <p className="mt-3 text-center text-xs text-muted-foreground">
                Curated categories → choose a subject, then add your topic.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="mx-auto max-w-6xl px-4 pb-16">
        <h2 className="mb-6 text-2xl font-semibold">How it works</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["1. Request", "Pick category & subject, add your topic and goals."],
            ["2. Match", "We connect you to a vetted teacher that fits your needs."],
            ["3. Pay & schedule", "Pay securely via Paystack and pick a time that works."],
            ["4. Learn & confirm", "Chat, learn, and release payment when you’re satisfied."],
          ].map(([t, d]) => (
            <Card key={t}>
              <CardContent className="p-6">
                <h3 className="text-base font-semibold">{t}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{d}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Big call to action */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="rounded-2xl border p-8 text-center">
          <h2 className="text-2xl font-semibold">Ready to learn or teach?</h2>
          <p className="mt-2 text-muted-foreground">
            Join LearnConect today. Students find the right teacher. Teachers get paid for their expertise.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            {!user ? (
              <>
                <Button asChild className="w-full sm:w-auto">
                  <Link href="/auth/signup">Find a teacher</Link>
                </Button>
                <Button variant="outline" asChild className="w-full sm:w-auto">
                  <Link href="/auth/signup">Start teaching</Link>
                </Button>
              </>
            ) : (
              <Button asChild className="w-full sm:w-auto">
                <Link href={dashboardHref}>Go to your dashboard</Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-10 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} LearnConect. All rights reserved.
      </footer>
    </div>
  );
}
