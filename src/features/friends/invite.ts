const PENDING_KEY = 'fitcircle.pendingInvite';

/** The token in an invite link's path, or null for any other path. */
export function tokenFromPath(pathname: string): string | null {
  return pathname.match(/^\/invite\/([A-Za-z0-9]{1,64})\/?$/)?.[1] ?? null;
}

/**
 * Signing in with Google always returns to the home page, so an invite link opened while signed out
 * would be forgotten. Call this before anything redirects; takePendingInvite picks it up after sign-in.
 */
export function rememberInviteFromUrl() {
  const token = tokenFromPath(window.location.pathname);
  if (token) localStorage.setItem(PENDING_KEY, token);
}

export function takePendingInvite(): string | null {
  const token = localStorage.getItem(PENDING_KEY);
  localStorage.removeItem(PENDING_KEY);
  return token;
}

/** Why an invite cannot be accepted, in words; null when it can. Takes a preview status or an accept error. */
export function inviteProblem(status: string, inviterName: string | null): string | null {
  const who = inviterName ?? 'your friend';
  switch (status) {
    case 'ok':
      return null;
    case 'own':
    case 'invite_own':
      return 'This is your own invite link. Send it to a friend; it only works for someone else.';
    case 'friends':
    case 'already_friends':
      return `You and ${who} are already friends.`;
    case 'used':
    case 'invite_used':
      return `This link has already been used. Ask ${who} for a new one.`;
    case 'expired':
    case 'invite_expired':
      return `This link has expired. Ask ${who} for a new one.`;
    case 'not_found':
    case 'invite_not_found':
      return 'This invite link is not valid. Check that you copied the whole link.';
    default:
      return 'Could not check this invite. Check your connection and try again.';
  }
}
