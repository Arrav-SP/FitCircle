import { SubPage } from '@/components/SubPage';
import { NotificationsCard } from '@/features/notifications/NotificationsCard';

export default function NotificationsScreen() {
  return (
    <SubPage title="Notifications" parent="/profile">
      <NotificationsCard />
    </SubPage>
  );
}
