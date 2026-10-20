import { TUser, TUserRole } from "@/types/globalTypes";

export const getEffectiveUserRole = (
  user: Pick<TUser, "role" | "position">
): TUserRole => (user.position?.trim().toLowerCase() === "hr" ? "manager" : user.role);
