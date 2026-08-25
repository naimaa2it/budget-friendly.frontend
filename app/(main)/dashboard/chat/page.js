import ChatInbox from "@/components/dashboard/Chat/ChatInbox";

export const metadata = { title: "Live Chat | Dashboard" };

export default function ChatPage() {
  return (
    <div className="p-6">
      <ChatInbox />
    </div>
  );
}
