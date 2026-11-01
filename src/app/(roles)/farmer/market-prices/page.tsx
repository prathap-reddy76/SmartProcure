import { requireRole } from "@/lib/auth-utils";
import { getFarmerProfile } from "@/actions/farmer/profile-actions";
import { MarketPricesClient } from "./market-prices-client";
import { SessionUser } from "@/types/auth";

export const metadata = {
  title: "Market Prices - SmartProcure",
};

export default async function MarketPricesPage() {
  const session = await requireRole("FARMER");
  const user = session.user as SessionUser;
  const { profile } = await getFarmerProfile();
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Market Prices & Intelligence</h1>
        <p className="text-gray-500 text-sm mt-1">Live and historical agricultural commodity prices from across markets</p>
      </div>
      <MarketPricesClient 
        farmerId={user.id} 
        defaultState={profile?.state || "Andhra Pradesh"} 
        defaultDistrict={profile?.district || ""}
      />
    </div>
  );
}
