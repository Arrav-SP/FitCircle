import { LEGAL } from '@/config/legal';
import { LegalPage, List, P, Section } from '@/features/legal/LegalPage';

export default function ContactScreen() {
  return (
    <LegalPage title="Contact and help">
      <Section title="Get in touch">
        <P>
          FitCircle is run by {LEGAL.operator}. Email {LEGAL.contactEmail} for help, to report a problem, or about your
          data.
        </P>
      </Section>
      <Section title="Things you can do yourself">
        <List
          items={[
            'Download everything FitCircle holds about you: Profile, then Your data.',
            'Delete your account and all your data at once: Profile, then Your data, then Delete account.',
            'Stop notifications: Profile, then Notifications.',
            'Hide your workouts: Profile, then Who sees my workouts, or the eye beside a friend on the Friends screen.',
          ]}
        />
      </Section>
      <Section title="Privacy requests and complaints">
        <P>
          To ask what is held about you, to correct it, or to complain about how it is handled, email {LEGAL.contactEmail}{' '}
          with the email address you sign in with. You may also complain to the data protection authority where you live.
        </P>
      </Section>
    </LegalPage>
  );
}
