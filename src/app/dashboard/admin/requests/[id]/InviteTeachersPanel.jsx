"use client";

import { useActionState, useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AuthErrorAlert from "@/components/AuthErrorAlert";
import { supabase } from "@/utils/supabase/client";



export default function InviteTeachersPanel({ requestId, subjectId, alreadyInvitedIds = [], onInvite }) {
  const [state, formAction, pending] = useActionState(onInvite, {});
  const [query, setQuery] = useState("");

  // server-fed suggestions via props? We'll fetch here (client) to keep it simple.
  // Note: If you prefer server-side only, you can lift this into the page and pass down.
  const [teachers, setTeachers] = useState(null);

  // lightweight client fetch once mounted
  useEffect(() => {
    let isMounted = true;
    (async () => {

      // Teachers who:
      // - role = 'teacher'
      // - vetting_status = 'approved'
      // - teach this subject (join teacher_subjects)
      // - and NOT already invited for this request
      const { data: rows } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, role")
        .eq("role", "teacher");

      // join teacher_profiles and teacher_subjects client-side (simpler; small lists in MVP)
      const [{ data: tprofs = [] }, { data: skills = [] }] = await Promise.all([
        supabase.from("teacher_profiles").select("user_id, vetting_status"),
        supabase.from("teacher_subjects").select("teacher_user_id, subject_id").eq("subject_id", subjectId),
      ]);

      const approved = new Set(tprofs.filter(tp => tp.vetting_status === "approved").map(tp => tp.user_id));
      const skill = new Set(skills.map(s => s.teacher_user_id));
      const invited = new Set(alreadyInvitedIds);

      const filtered = (rows || []).filter(
        t => approved.has(t.id) && skill.has(t.id) && !invited.has(t.id)
      );

      if (isMounted) setTeachers(filtered);
    })();

    return () => { isMounted = false; };
  }, [subjectId, alreadyInvitedIds]);

  const visible = (teachers || []).filter(t =>
    !query ? true : t.full_name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <form action={formAction} className="rounded-2xl border p-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="font-medium">Invite teachers</div>
        <div className="text-xs text-muted-foreground">
          Only approved teachers who teach this subject are shown.
        </div>
      </div>

      <AuthErrorAlert title="Couldn’t invite" message={state?.error} />

      <div className="grid gap-2 sm:grid-cols-2">
        <Input
          placeholder="Search by name…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <input type="hidden" name="request_id" value={requestId} />
      <input type="hidden" name="subject_id" value={subjectId} />

      <div className="rounded-lg border">
        <div className="bg-muted/50 px-3 py-2 text-xs text-muted-foreground">Suggested teachers</div>
        <div className="max-h-64 overflow-y-auto divide-y">
          {teachers === null && (
            <div className="px-3 py-3 text-sm text-muted-foreground">Loading…</div>
          )}
          {teachers?.length === 0 && (
            <div className="px-3 py-3 text-sm text-muted-foreground">No eligible teachers found.</div>
          )}
          {visible.map(t => (
            <label key={t.id} className="flex items-center gap-3 px-3 py-2 text-sm">
              <input
                type="checkbox"
                name="teacher_ids"
                value={t.id}
                className="h-4 w-4"
              />
              <span className="font-medium">{t.full_name}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Inviting…" : "Invite selected"}
        </Button>
        {state?.ok && (
          <span className="text-sm text-muted-foreground">
            {state.info ?? `${state.count || 0} invitation(s) sent.`}
          </span>
        )}
      </div>
    </form>
  );
}
