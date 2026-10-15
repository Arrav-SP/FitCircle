/**
 * Everything the Privacy Policy, Terms and Contact pages need that only the owner can supply.
 * Values in [BRACKETS] are placeholders and show on the pages exactly as written until replaced.
 * Have the finished pages reviewed by a qualified lawyer before inviting people beyond close friends.
 */
export const LEGAL = {
  /** The person or organisation that runs FitCircle and is responsible for its data. */
  operator: 'Arav Singh Patel',
  /** Where questions, data requests and complaints go. */
  contactEmail: 'fitcircle.support@gmail.com',
  /** The country (and state, if relevant) the operator runs FitCircle from; decides the governing law. */
  jurisdiction: 'India / Madhya Pradesh',
  /** The youngest age allowed to use FitCircle. Under India's DPDP Act anyone under 18 is a child. */
  minimumAge: '18',
  /** Where the Supabase project stores data (Supabase dashboard > Project Settings > General > Region). */
  dataRegion: 'Mumbai, India (AWS ap-south-1)',
  /** How long the operator's own backup copies are kept before being deleted. */
  backupRetention: '4 weeks',
  /** Shown at the top of each page. */
  effectiveDate: '15 October 2026',
} as const;

/** Bump when the Terms or Privacy Policy change in a way people must agree to again. */
export const POLICY_VERSION = '2026-10';
