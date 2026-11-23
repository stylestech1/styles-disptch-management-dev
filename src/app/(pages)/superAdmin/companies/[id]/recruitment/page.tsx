"use client";

import { useParams } from "next/navigation";
import CompanyRecruitmentSettings from "@/components/drivers/CompanyRecruitmentSettings";

export default function CompanyRecruitmentSettingsPage() {
  const params = useParams<{ id: string }>();
  return <CompanyRecruitmentSettings companyId={params.id} />;
}
