import { createClient } from "@/utils/supabase/server";

export const metadata = { title: "Admin — Payments" };

export default async function AdminPaymentsPage() {
  const supabase = await createClient();
  const { data: tx = [] } = await supabase
    .from("transactions")
    .select("created_at, reference, amount, currency, status, student_id, teacher_id, request_id")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="text-2xl font-semibold mb-4">Payments</h1>
      <div className="overflow-x-auto rounded-2xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Reference</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Request</th>
            </tr>
          </thead>
          <tbody>
            {tx.map((t) => (
              <tr key={t.reference} className="border-t">
                <td className="px-4 py-3">{new Date(t.created_at).toLocaleString()}</td>
                <td className="px-4 py-3">{t.reference}</td>
                <td className="px-4 py-3">₦{(t.amount/100).toLocaleString()}</td>
                <td className="px-4 py-3 capitalize">{t.status}</td>
                <td className="px-4 py-3">
                  <a className="underline" href={`/dashboard/admin/requests/${t.request_id}`}>View</a>
                </td>
              </tr>
            ))}
            {!tx.length && (
              <tr><td className="px-4 py-6 text-muted-foreground" colSpan={5}>No payments yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
