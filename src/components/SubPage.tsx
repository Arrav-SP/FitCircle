import type { Href } from 'expo-router';
import type { ReactNode } from 'react';

import { PageHeader } from './PageHeader';
import { Screen } from './Screen';

/** A page opened from a tile: the shared header with its back arrow, then the content. */
export function SubPage({ title, subtitle, parent, children }: { title: string; subtitle?: string; parent: Href; children: ReactNode }) {
  return (
    <Screen>
      <PageHeader title={title} subtitle={subtitle} parent={parent} />
      {children}
    </Screen>
  );
}
