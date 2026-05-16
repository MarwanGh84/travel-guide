import { ProfileWorkspace } from "@/components/travel/profile-workspace";
import { getTravelProfile } from "@/lib/db/travel";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const profile = await getTravelProfile();
  return <ProfileWorkspace profile={profile} />;
}
