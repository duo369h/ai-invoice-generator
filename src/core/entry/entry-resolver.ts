import { ENTRY_AUTHORITY } from "./ENTRY_AUTHORITY";

export function resolveEntry(user: any) {
  return ENTRY_AUTHORITY(user).route;
}
