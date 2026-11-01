import { requireRole } from "@/lib/auth-utils";
import { AIFarmingChatClient } from "./chat-client";
import { SessionUser } from "@/types/auth";

export const metadata = {
  title: "AI Farming Assistant - SmartProcure",
  description: "AI-powered agricultural assistant for crops, soil, pests, irrigation, and farming advisory.",
};

export default async function AIAssistantPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string }>;
}) {
  const session = await requireRole("FARMER");
  const user = session.user as SessionUser;
  const sp = searchParams ? await searchParams : {};

  return (
    <div className="max-w-4xl mx-auto w-full">
      <AIFarmingChatClient
        farmerName={user?.name || undefined}
        initialQuery={sp.q}
      />
    </div>
  );
}
