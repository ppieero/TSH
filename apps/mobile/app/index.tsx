import { Redirect } from 'expo-router';

// Root redirect — auth check happens in (app)/_layout.tsx
export default function Index() {
  return <Redirect href="/onboarding" />;
}
