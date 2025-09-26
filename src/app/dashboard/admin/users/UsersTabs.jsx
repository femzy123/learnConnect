"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

function Pill({ text, tone }) {
  const map = {
    ok: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warn: "bg-amber-50 text-amber-700 border-amber-200",
    danger: "bg-rose-50 text-rose-700 border-rose-200",
    muted: "bg-muted/50 text-muted-foreground border-muted",
  };
  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${map[tone]}`}>{text}</span>;
}
const StatusPill = ({ status }) => <Pill text={(status || "pending").toLowerCase()} tone={status==="approved"?"ok":status==="rejected"?"danger":"warn"} />;
const AccountPill = ({ status }) => <Pill text={(status || "active")} tone={status==="deactivated"?"danger":"ok"} />;

function formatNGN(minor) {
  if (minor == null) return "—";
  const major = Number(minor) / 100;
  return `₦${major.toLocaleString(undefined, { maximumFractionDigits: 2 })}/hr`;
}

export default function UsersTabs({ defaultTab = "teachers", teachersRaw, studentsRaw, toggleAccountAction }) {
  const [tab, setTab] = useState(defaultTab);
  const [q, setQ] = useState("");

  const teachers = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return teachersRaw;
    const includes = (s) => s?.toLowerCase().includes(needle);
    return teachersRaw.filter(
      (t) => includes(t.profiles?.full_name || "") || includes(t.profiles?.phone || "")
    );
  }, [teachersRaw, q]);

  const students = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return studentsRaw;
    const includes = (s) => s?.toLowerCase().includes(needle);
    return studentsRaw.filter(
      (s) => includes(s.full_name || "") || includes(s.phone || "")
    );
  }, [studentsRaw, q]);

  return (
    <Tabs value={tab} onValueChange={setTab} className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">Users</h1>
        <TabsList>
          <TabsTrigger value="teachers">Teachers</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
        </TabsList>
      </div>

      <div className="flex items-center gap-2">
        <Input
          placeholder={`Search ${tab} by name or phone…`}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-full sm:max-w-sm"
        />
        <Button variant="outline" onClick={() => setQ("")}>Clear</Button>
      </div>

      {/* Teachers */}
      <TabsContent value="teachers">
        <div className="overflow-x-auto rounded-2xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Vetting</th>
                <th className="px-4 py-3">Account</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((t) => {
                const acct = t.profiles?.account_status || "active";
                const next = acct === "active" ? "deactivated" : "active";
                return (
                  <tr key={t.user_id} className="border-t">
                    <td className="px-4 py-3">{t.profiles?.full_name || t.user_id}</td>
                    <td className="px-4 py-3">{t.profiles?.phone || "—"}</td>
                    <td className="px-4 py-3"><StatusPill status={t.vetting_status} /></td>
                    <td className="px-4 py-3"><AccountPill status={acct} /></td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" asChild>
                          <Link href={`/dashboard/admin/teachers/${t.user_id}`}>View / Edit</Link>
                        </Button>
                        <form action={toggleAccountAction}>
                          <input type="hidden" name="user_id" value={t.user_id} />
                          <input type="hidden" name="new_status" value={next} />
                          <Button size="sm" type="submit" variant={acct === "active" ? "destructive" : "outline"}>
                            {acct === "active" ? "Deactivate" : "Activate"}
                          </Button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!teachers.length && (
                <tr><td className="px-4 py-6 text-muted-foreground" colSpan={6}>No teachers found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </TabsContent>

      {/* Students */}
      <TabsContent value="students">
        <div className="overflow-x-auto rounded-2xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Account</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => {
                const acct = s.account_status || "active";
                const next = acct === "active" ? "deactivated" : "active";
                return (
                  <tr key={s.id} className="border-t">
                    <td className="px-4 py-3">{s.full_name || s.id}</td>
                    <td className="px-4 py-3">{s.phone || "—"}</td>
                    <td className="px-4 py-3"><AccountPill status={acct} /></td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" asChild variant="outline">
                          <Link href={`/dashboard/admin/students/${s.id}`}>View</Link>
                        </Button>
                        <form action={toggleAccountAction}>
                          <input type="hidden" name="user_id" value={s.id} />
                          <input type="hidden" name="new_status" value={next} />
                          <Button size="sm" type="submit" variant={acct === "active" ? "destructive" : "outline"}>
                            {acct === "active" ? "Deactivate" : "Activate"}
                          </Button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!students.length && (
                <tr><td className="px-4 py-6 text-muted-foreground" colSpan={4}>No students found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </TabsContent>
    </Tabs>
  );
}
