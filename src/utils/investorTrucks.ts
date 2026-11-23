import { InvestorTruckItem, TTruck } from "@/types/globalTypes";

export function getInvestorTruck(item: InvestorTruckItem): TTruck {
  return "truck" in item ? item.truck : item;
}

export function getInvestorTrucks(
  items: InvestorTruckItem[] = [],
): TTruck[] {
  return items.map(getInvestorTruck);
}
