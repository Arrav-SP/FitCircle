import { SubPage } from '@/components/SubPage';
import { Feed } from '@/features/feed/FeedList';

export default function ActivityScreen() {
  return (
    <SubPage title="Activity" subtitle="Your friends' workouts and streak milestones" parent="/friends">
      <Feed />
    </SubPage>
  );
}
