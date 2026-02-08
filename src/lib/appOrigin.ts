/**
 * Helpers for splitting Landing (root domain) vs App/Auth (app subdomain).
 *
 * IMPORTANT: In Lovable preview/published *.lovable.app domains, we keep everything
 * on the same origin so the preview continues to work even without a configured
 * `app.` subdomain.
 */

export function isLovableHost(hostname: string) {
  // Lovable environments can use different base domains (preview/staging/published).
  // In those environments we MUST NOT split by subdomain.
  return hostname.endsWith(".lovable.app") || hostname.endsWith(".lovableproject.com");
}

export function isCustomDomain(hostname: string) {
  return !isLovableHost(hostname);
}

export function isAppHost(hostname: string) {
  // Only consider `app.` as a split-domain in custom domains.
  return isCustomDomain(hostname) && hostname.startsWith("app.");
}

export function isFinanceiroHost(hostname: string) {
  // Only consider `financeiro.` as a split-domain in custom domains.
  return isCustomDomain(hostname) && hostname.startsWith("financeiro.");
}

export function getAppOrigin(hostname = window.location.hostname, protocol = window.location.protocol) {
  // Preview/staging: keep same origin.
  if (!isCustomDomain(hostname)) return window.location.origin;

  // Already on app.
  if (hostname.startsWith("app.")) return `${protocol}//${hostname}`;

  // Root may be www.; normalize to app.
  const base = hostname.startsWith("www.") ? hostname.slice(4) : hostname;
  return `${protocol}//app.${base}`;
}

export function getFinanceiroOrigin(hostname = window.location.hostname, protocol = window.location.protocol) {
  if (!isCustomDomain(hostname)) return window.location.origin;
  if (hostname.startsWith("financeiro.")) return `${protocol}//${hostname}`;
  let base = hostname;
  if (base.startsWith("www.")) base = base.slice(4);
  if (base.startsWith("app.")) base = base.slice(4);
  return `${protocol}//financeiro.${base}`;
}

export function isSuporteHost(hostname: string) {
  return isCustomDomain(hostname) && hostname.startsWith("suporte.");
}

export function getSuporteOrigin(hostname = window.location.hostname, protocol = window.location.protocol) {
  if (!isCustomDomain(hostname)) return window.location.origin;
  if (hostname.startsWith("suporte.")) return `${protocol}//${hostname}`;
  let base = hostname;
  if (base.startsWith("www.")) base = base.slice(4);
  if (base.startsWith("app.")) base = base.slice(4);
  if (base.startsWith("financeiro.")) base = base.slice(11);
  return `${protocol}//suporte.${base}`;
}

export function buildAppUrlFromCurrentLocation(pathname: string) {
  const origin = getAppOrigin();
  const search = window.location.search;
  const hash = window.location.hash;
  return `${origin}${pathname}${search}${hash}`;
}
