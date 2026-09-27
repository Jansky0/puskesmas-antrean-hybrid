import PetugasClient from "./PetugasClient";

import { ALL_ROOMS } from "@/lib/rooms";

export function generateStaticParams() {
  const params = ALL_ROOMS.map((r) => ({ ruangId: r.code }));
  params.push({ ruangId: "I" });
  return params;
}

export default async function Page({ params }: { params: Promise<{ ruangId: string }> }) {
  const resolvedParams = await params;
  return <PetugasClient ruangId={resolvedParams.ruangId} />;
}
