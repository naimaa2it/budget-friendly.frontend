import ChatWidgetSettings from "@/components/dashboard/Chat/ChatWidgetSettings";

export const metadata = { title: "Chat Widget | Dashboard" };

export default function ChatWidgetPage() {
  return (
    <div className="p-6">
      <ChatWidgetSettings />
    </div>
  );
}
