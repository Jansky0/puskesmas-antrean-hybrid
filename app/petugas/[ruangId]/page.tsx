import PetugasClient from "./PetugasClient";

export function generateStaticParams() {
  return [
    { ruangId: "LKT" },
    { ruangId: "A" },
    { ruangId: "B" },
    { ruangId: "C" },
    { ruangId: "D" },
    { ruangId: "E" },
    { ruangId: "F" },
    { ruangId: "G" },
    { ruangId: "H" },
    { ruangId: "I" },
  ];
}

export default async function Page({ params }: { params: Promise<{ ruangId: string }> }) {
  const resolvedParams = await params;
  return <PetugasClient ruangId={resolvedParams.ruangId} />;
}
