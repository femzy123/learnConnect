"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import AuthErrorAlert from "@/components/AuthErrorAlert";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
} from "@/components/ui/select";

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
    () => subjects.filter((s) => String(s.category_id) === categoryId),
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

    if (error) { setError(error.message); return; }
    startTransition(() => router.replace("/dashboard/student?created=1"));
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <AuthErrorAlert title="Couldn’t create request" message={error} />

      {/* Category */}
      <div className="grid gap-2">
        <Label htmlFor="category">Category</Label>
        <Select
          value={categoryId}
          onValueChange={(v) => { setCategoryId(v); setSubjectId(""); }}
        >
          <SelectTrigger id="category" className="w-full">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Subject */}
      <div className="grid gap-2">
        <Label htmlFor="subject">Subject</Label>
        <Select
          value={subjectId}
          onValueChange={setSubjectId}
          disabled={!categoryId}
        >
          <SelectTrigger id="subject" className="w-full" disabled={!categoryId}>
            <SelectValue placeholder={categoryId ? "Select a subject" : "Choose a category first"} />
          </SelectTrigger>
          <SelectContent>
            {filteredSubjects.map((s) => (
              <SelectItem key={s.id} value={String(s.id)}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Topic */}
      <div className="grid gap-2">
        <Label htmlFor="topic">Topic (what do you want to learn?)</Label>
        <Input
          id="topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g., JavaScript arrays"
          required
        />
      </div>

      {/* Goals */}
      <div className="grid gap-2">
        <Label htmlFor="goals">Goals (optional)</Label>
        <Textarea
          id="goals"
          value={goals}
          onChange={(e) => setGoals(e.target.value)}
          placeholder="Tell the teacher what success looks like"
        />
      </div>

      {/* Times & Budget */}
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="times">Preferred times (optional)</Label>
          <Input
            id="times"
            value={times}
            onChange={(e) => setTimes(e.target.value)}
            placeholder="e.g., weekday evenings"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="budget">Budget (optional)</Label>
          <Input
            id="budget"
            inputMode="numeric"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="e.g., ₦5,000/hour"
          />
        </div>
      </div>

      <Button type="submit" disabled={pending} className="h-10">
        {pending ? "Submitting..." : "Submit request"}
      </Button>
    </form>
  );
}
