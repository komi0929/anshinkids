import ConciergeClient from "./concierge-client";
import { getMyProfile } from "@/app/actions/mypage";

export const dynamic = "force-dynamic";

export default async function ConciergePage() {
  const profileRes = await getMyProfile();
  
  let isGuest = false;
  const loadedAllergens = new Set<string>();

  if (profileRes.success && profileRes.data) {
    const profile = profileRes.data;
    (profile.allergen_tags || []).forEach((a: string) => loadedAllergens.add(a));
    if (profile.children_profiles && Array.isArray(profile.children_profiles)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (profile.children_profiles as any[]).forEach((c: any) => {
        (c.allergens || []).forEach((a: string) => loadedAllergens.add(a));
        (c.customAllergens || []).forEach((a: string) => loadedAllergens.add(a));
      });
    }
  } else if (profileRes.error === "ログインが必要です") {
    isGuest = true;
  }

  return (
    <ConciergeClient 
      initialAllergens={Array.from(loadedAllergens)} 
      initialIsGuest={isGuest} 
    />
  );
}
