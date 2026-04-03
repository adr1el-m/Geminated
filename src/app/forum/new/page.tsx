import Link from 'next/link';
import forumStyles from '../forum.module.css';
import NewTopicForm from '@/components/NewTopicForm';

export default function NewTopicPage() {
  return (
    <div className={forumStyles.pageContainer}>
      <header className={forumStyles.header}>
        <div className={forumStyles.titleBlock}>
          <h1 className={forumStyles.title}>Start a New Topic</h1>
          <p className={forumStyles.subtitle}>
            Ask questions, share challenges, and spark discussions with educators across your region and beyond. New topics are reviewed by an admin before publication.
          </p>
        </div>
        <Link href="/forum" className="btn btn-primary" style={{ height: 'fit-content' }}>
          ← Back to Forums
        </Link>
      </header>

      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div className="card" style={{ padding: '2rem' }}>
          <NewTopicForm />
        </div>
      </div>
    </div>
  );
}
