import ManagerLayout from "../manager/layout";

export default function InvestorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ManagerLayout>{children}</ManagerLayout>;
}
