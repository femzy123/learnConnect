"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import AuthErrorAlert from "@/components/AuthErrorAlert";

export default function RequestForm({ categories, subjects }) {
  const [categoryId, setCategoryId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [topic, setTopic] = useState("");
  const [goals, setGoals] = useState("");
  const [times, setTimes] = useState("");
  const [budget, setBudget] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const filteredSubjects = useMemo(
    () => subjects.filter((s) => s.category_id === categoryId),
    [subjects, categoryId]
  );

  async function onSubmit(e) {
    e.preventDefault();
    setError("");

    if (!categoryId || !subjectId || !topic.trim()) {
      setError("Please select a category and subject, and enter a topic.");
      return;
    }

    const { data: { user } = {} } = await supabase.auth.getUser();
    if (!user) {
      setError("You need to be logged in to submit a request.");
      return;
    }

    const notes = JSON.stringify({
      goals: goals || null,
      preferred_times: times || null,
      budget: budget || null,
    });

    const { error } = await supabase.from("student_requests").insert({
      student_id: user.id,
      category_id: categoryId,
      subject_id: subjectId,
      topic: topic.trim(),
      notes,
      status: "open",
    });

    if (error) {
      setError(error.message);
      return;
    }

    startTransition(() => router.replace("/dashboard/student?created=1"));
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <AuthErrorAlert title="Couldn’t create request" message={error} />

      <div className="grid gap-2">
        <label className="text-sm" htmlFor="category">Category</label>
        <select
          id="category"
          value={categoryId}
          onChange={(e) => {
            setCategoryId(e.target.value);
            setSubjectId("");
          }}
          className="h-10 w-full rounded-md border bg-background px-3"
          required
        >
          <option value="" disabled>Select a category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="grid gap-2">
        <label className="text-sm" htmlFor="subject">Subject</label>
        <select
          id="subject"
          value={subjectId}
          onChange={(e) => setSubjectId(e.target.value)}
          className="h-10 w-full rounded-md border bg-background px-3"
          required
          disabled={!categoryId}
        >
          <option value="" disabled>
            {categoryId ? "Select a subject" : "Choose a category first"}
          </option>
          {filteredSubjects.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      <div className="grid gap-2">
        <label className="text-sm" htmlFor="topic">Topic (what do you want to learn?)</label>
        <input
          id="topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="h-10 w-full rounded-md border bg-background px-3"
          placeholder="e.g., JavaScript arrays"
          required
        />
      </div>

      <div className="grid gap-2">
        <label className="text-sm" htmlFor="goals">Goals (optional)</label>
        <textarea
          id="goals"
          value={goals}
          onChange={(e) => setGoals(e.target.value)}
          className="min-h-[90px] w-full rounded-md border bg-background p-3"
          placeholder="Tell the teacher what success looks like"
        />
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="grid gap-2">
          <label className="text-sm" htmlFor="times">Preferred times (optional)</label>
          <input
            id="times"
            value={times}
            onChange={(e) => setTimes(e.target.value)}
            className="h-10 w-full rounded-md border bg-background px-3"
            placeholder="e.g., weekday evenings"
          />
        </div>
        <div className="grid gap-2">
          <label className="text-sm" htmlFor="budget">Budget (optional)</label>
          <input
            id="budget"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            className="h-10 w-full rounded-md border bg-background px-3"
            placeholder="e.g., $20/hour"
          />
        </div>
      </div>

      <Button type="submit" disabled={pending} className="h-10">
        {pending ? "Submitting..." : "Submit request"}
      </Button>
    </form>
  );
}
