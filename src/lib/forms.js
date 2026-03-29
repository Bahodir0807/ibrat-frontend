import { zodResolver } from "@hookform/resolvers/zod";

export function createZodResolver(schema) {
  return zodResolver(schema);
}
