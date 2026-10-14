import { AccentPicker } from '@/components/AccentPicker';
import { Card } from '@/components/Card';
import { SegmentedControl } from '@/components/SegmentedControl';
import { SubPage } from '@/components/SubPage';
import { useTheme } from '@/theme/tokens';

const THEME_OPTIONS = [
  { value: 'system', label: 'Device' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
] as const;

export default function AppearanceScreen() {
  const { preference, setPreference } = useTheme();
  return (
    <SubPage title="Appearance" parent="/profile">
      <Card>
        <SegmentedControl
          label="Theme"
          hint="Device follows your phone or computer's light and dark setting."
          options={THEME_OPTIONS}
          value={preference}
          onChange={setPreference}
        />
        <AccentPicker />
      </Card>
    </SubPage>
  );
}
