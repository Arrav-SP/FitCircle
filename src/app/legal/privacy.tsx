import { LEGAL } from '@/config/legal';
import { LegalPage, List, P, Section } from '@/features/legal/LegalPage';

// Every statement here matches how FitCircle actually works (see supabase/migrations). Change both together.
export default function PrivacyPolicyScreen() {
  return (
    <LegalPage title="Privacy Policy">
      <Section title="Who runs FitCircle">
        <P>
          FitCircle is a small, free app for working out with friends. It is run by {LEGAL.operator}, who decides how
          your data is used. Contact: {LEGAL.contactEmail}.
        </P>
      </Section>

      <Section title="What FitCircle stores">
        <List
          items={[
            'Your account: what Google shares when you sign in (your email address, name, profile picture link and Google account ID; FitCircle never shows the picture), and when you signed in.',
            'Your profile: the username and display name you choose.',
            'Your settings: weight units, time zone, weekly workout goal, water goal, who sees your workouts, which notifications you want, and which version of these terms you agreed to and when.',
            'Your workouts: title, start time, duration, notes, exercises, sets, reps and weights, and any exercises you create.',
            'Your health entries: water, body weight, steps and sleep you type in.',
            'Friends and streaks: who you are friends with, invite links you create, who you hide workouts from, your streaks and their daily results, deals, sealed notes, dares, cover passes and milestones.',
            'Reactions you give to friends’ workouts and milestones.',
            'If you turn on notifications: a push address for your browser or phone, and the notifications waiting to be sent.',
          ]}
        />
        <P>FitCircle does not use location, contacts, your camera, advertising or analytics, and does not import data from other health apps.</P>
      </Section>

      <Section title="Why">
        <P>
          Only to run the app for you: to show you your history and progress, to share what you choose with your friends,
          to keep streaks with a partner, and to send the notifications you switch on. Nothing is sold, and nothing is used
          for advertising.
        </P>
        <P>
          Workouts, body weight and sleep can be health data. FitCircle stores them only because you ask it to, and you
          agree to that when you start using the app. You can withdraw by deleting your account.
        </P>
      </Section>

      <Section title="What your friends see">
        <List
          items={[
            'Friends see your display name and username, and your workouts (exercises, sets and duration, never your notes) unless you hide them: one workout, from chosen friends, or from everyone.',
            'A streak partner sees whether you trained on each streak day, never your workouts themselves; plus the deal, your sealed note once it opens, and dares between you.',
            'Your water, body weight, steps, sleep, goals and settings are never visible to anyone else.',
            'People who are not your friends see nothing.',
          ]}
        />
      </Section>

      <Section title="Who handles your data for FitCircle">
        <List
          items={[
            `Supabase stores the database, handles sign-in and sends notifications. Data is stored in ${LEGAL.dataRegion}.`,
            'Google signs you in and shares the account details listed above.',
            'Expo (EAS Hosting) serves the app’s pages to your browser and, like any web host, sees your IP address when you load them.',
            'If you turn on notifications, your browser’s push service (Google, Apple or Mozilla, depending on your device) delivers them. What it carries is encrypted.',
          ]}
        />
        <P>These services may process data outside your country.</P>
      </Section>

      <Section title="How long it is kept">
        <P>
          Until you delete it or your account. Notifications are removed from the queue within 7 days. {LEGAL.operator}{' '}
          keeps backup copies of the database for {LEGAL.backupRetention}, so deleted data can remain in a backup until it
          expires.
        </P>
      </Section>

      <Section title="Your choices and rights">
        <List
          items={[
            'See and download everything FitCircle holds about you: Profile, then Your data.',
            'Correct your name, goals and settings at any time in Profile.',
            'Delete any workout or health entry, or your whole account: Profile, then Your data, then Delete account. This happens at once and cannot be undone. Streaks you shared stay in your partner’s history without your name.',
            'Turn notifications off at any time in Profile, then Notifications.',
            `For anything else, including a complaint, email ${LEGAL.contactEmail}.`,
          ]}
        />
      </Section>

      <Section title="Cookies and storage on your device">
        <P>
          FitCircle uses no cookies and no tracking. It keeps a few things in your browser’s own storage so the app works:
          your sign-in session, theme and colour, pinned friends, the body-figure choice, when you last used the app (to
          sign you out after a long break), an invite link you opened before signing in, and an unsaved workout. Signing
          out clears what belongs to your account.
        </P>
      </Section>

      <Section title="Security">
        <P>
          Access rules in the database make sure each person can only read and change what this policy describes. Data
          travels over encrypted connections. No system is perfectly secure; if something goes wrong that affects you,{' '}
          {LEGAL.operator} will tell you.
        </P>
      </Section>

      <Section title="Children">
        <P>FitCircle is not for anyone under {LEGAL.minimumAge}.</P>
      </Section>

      <Section title="Changes">
        <P>
          If this policy changes in a way that matters, FitCircle will ask you to agree again before you continue. The date
          at the top shows the latest version.
        </P>
      </Section>
    </LegalPage>
  );
}
