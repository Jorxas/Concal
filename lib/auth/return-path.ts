/**
 * Empêche les redirections ouvertes : uniquement des chemins relatifs sûrs.
 */
export function getSafeReturnPath(nextParam: string | null): string {
  if (!nextParam || !nextParam.startsWith("/") || nextParam.startsWith("//")) {
    return "/dashboard";
  }
  if (nextParam === "/login" || nextParam === "/register") {
    return "/dashboard";
  }
  return nextParam;
}
