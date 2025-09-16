import DeactivatedNotice from "./DeactivatedNotice";
export const metadata = { title: "Account deactivated — LearnConect" };

export default function DeactivatedPage() {
  return (
    <div className="min-h-screen px-4 flex items-center justify-center">
      <div className="w-full max-w-md">
        <DeactivatedNotice />
      </div>
    </div>
  );
}
