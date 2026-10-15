import { LEGAL } from '@/config/legal';
import { LegalPage, List, P, Section } from '@/features/legal/LegalPage';

export default function TermsScreen() {
  return (
    <LegalPage title="Terms">
      <Section title="The service">
        <P>
          FitCircle is a free app, run by {LEGAL.operator}, for logging workouts and keeping workout streaks with friends.
          By using it you agree to these terms and to the Privacy Policy.
        </P>
      </Section>

      <Section title="Who can use it">
        <P>
          You must be at least {LEGAL.minimumAge} and sign in with your own Google account. You are responsible for what
          happens on your account.
        </P>
      </Section>

      <Section title="Not medical advice">
        <P>
          FitCircle records what you enter. It does not give medical, health or training advice, and its numbers are not
          checked by anyone. Talk to a doctor before starting or changing an exercise routine, and stop if something hurts.
        </P>
      </Section>

      <Section title="How to behave">
        <List
          items={[
            'Be kind in everything other people can see: names, workout titles, deals, sealed notes and dares.',
            'Do not use FitCircle to harass anyone, to share anything unlawful, or to try to reach data that is not yours.',
            'Do not try to break, overload or get around how the app works.',
          ]}
        />
        <P>{LEGAL.operator} may remove content or close an account that breaks these rules.</P>
      </Section>

      <Section title="Your content">
        <P>
          What you enter stays yours. You let FitCircle store it and show it to the people the Privacy Policy describes,
          only to run the app. Deleting it or your account ends that.
        </P>
      </Section>

      <Section title="No guarantees">
        <P>
          FitCircle is offered as it is, for free. It may change, have mistakes, be unavailable or close. Streaks, passes
          and rewards are a game between friends and have no value outside the app. Keep your own copy of anything
          important: Profile, then Your data.
        </P>
      </Section>

      <Section title="Ending">
        <P>You can stop at any time by deleting your account: Profile, then Your data.</P>
      </Section>

      <Section title="Law">
        <P>These terms are governed by the laws of {LEGAL.jurisdiction}. Questions: {LEGAL.contactEmail}.</P>
      </Section>
    </LegalPage>
  );
}
