import { Card, CardContent } from "@/components/ui/card";

export default function RequestSummary({ categoryName, subjectName, topic, status }) {
  return (
    <Card>
      <CardContent className="p-6 space-y-2 text-sm">
        <div>
          <span className="text-muted-foreground">Category:</span>{" "}
          <strong>{categoryName || "—"}</strong>
        </div>
        <div>
          <span className="text-muted-foreground">Subject:</span>{" "}
          <strong>{subjectName || "—"}</strong>
        </div>
        <div>
          <span className="text-muted-foreground">Topic:</span>{" "}
          <strong>{topic || "—"}</strong>
        </div>
        <div>
          <span className="text-muted-foreground">Status:</span>{" "}
          <strong className="capitalize">{status}</strong>
        </div>
      </CardContent>
    </Card>
  );
}
