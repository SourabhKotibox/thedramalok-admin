import { useGetWebSubscriptionPlans, useGetAppProfile } from "@/lib/api-client";

export function useDownloadPermission() {
  const { data: plansData, isLoading: plansLoading } = useGetWebSubscriptionPlans();
  const { data: profileData, isLoading: profileLoading } = useGetAppProfile();

  const plans: any[] = plansData?.data || [];
  
  // Fallback to localStorage user if profileData is loading
  let user = profileData?.user;
  if (!user) {
    try {
      const stored = localStorage.getItem("appUser");
      if (stored) user = JSON.parse(stored);
    } catch {}
  }

  const isSubscribed = user?.subscriptionStatus === "active" && user?.subscriptionPlan !== "free";
  const userPlanKey = (user?.subscriptionPlan || "").toString().toLowerCase().trim();

  // Check if at least one active plan allows downloads
  const anyPlanAllowsDownload =
    plans.length === 0 ||
    plans.some((p: any) => p.downloadAllowed === true || p.downloadStatus === true);

  // Find matching plan for the user
  let matchingPlan: any = null;
  if (isSubscribed) {
    // 1. By subscriptionPlanId
    if (user?.subscriptionPlanId) {
      matchingPlan = plans.find((p: any) => (p.id || p._id) === user.subscriptionPlanId);
    }
    // 2. By plan ID directly
    if (!matchingPlan && user?.subscriptionPlan) {
      matchingPlan = plans.find((p: any) => (p.id || p._id) === user.subscriptionPlan);
    }
    // 3. By level mapping (basic -> 1, standard -> 2, premium -> 3)
    if (!matchingPlan) {
      const levelMap: Record<string, number> = { basic: 1, standard: 2, premium: 3 };
      if (levelMap[userPlanKey]) {
        matchingPlan = plans.find((p: any) => p.level === levelMap[userPlanKey]);
      }
    }
    // 4. By name match (exact or substring)
    if (!matchingPlan) {
      matchingPlan = plans.find((p: any) => {
        const pName = (p.name || "").toLowerCase().trim();
        return (
          pName === userPlanKey ||
          pName.includes(userPlanKey) ||
          userPlanKey.includes(pName)
        );
      });
    }
  }

  // Determine if user's plan permits downloads
  let userPlanAllowsDownload = false;
  let canDownload = false;

  if (isSubscribed) {
    if (matchingPlan) {
      userPlanAllowsDownload =
        matchingPlan.downloadAllowed === true || matchingPlan.downloadStatus === true;
      canDownload = userPlanAllowsDownload;
    } else if (user?.downloadAllowed !== undefined) {
      userPlanAllowsDownload = !!user.downloadAllowed;
      canDownload = userPlanAllowsDownload;
    } else {
      userPlanAllowsDownload = false;
      canDownload = false;
    }
  } else {
    // If not subscribed or guest, allow viewing the download button if any plan supports downloads
    canDownload = anyPlanAllowsDownload;
  }

  return {
    canDownload,
    anyPlanAllowsDownload,
    userPlanAllowsDownload,
    isSubscribed,
    user,
    matchingPlan,
    isLoading: plansLoading || profileLoading,
  };
}
