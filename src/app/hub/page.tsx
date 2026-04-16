import { redirect } from 'next/navigation';
import TermsModal from '@/components/TermsModal';
import { getCurrentUser, hasAcceptedLatestTerms } from '@/lib/auth';

export default async function HubPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  if (hasAcceptedLatestTerms(user)) {
    redirect('/dashboard');
  }

  return <TermsModal />;
}
