import homeStyles from './page.module.css';

export default function Loading() {
  return (
    <div className={homeStyles.pageContainer}>
      <div className="loadingShell">
        <div className="loadingLogo">
          <svg width="56" height="56" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="24" cy="24" r="22" stroke="var(--primary-blue)" strokeWidth="2.5" strokeDasharray="6 4" opacity="0.3" />
            <polygon points="24,8 27.5,17 37,17 29.5,23 32,32 24,27 16,32 18.5,23 11,17 20.5,17" fill="var(--primary-blue)" opacity="0.85" />
          </svg>
        </div>
        <div className="loadingBar">
          <div className="loadingBarFill" />
        </div>
        <p className="loadingText">Loading STAR-LINK</p>

        <style>{`
          .loadingShell {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 60vh;
            gap: 1.5rem;
          }
          .loadingLogo {
            animation: loadingPulse 1.6s ease-in-out infinite;
          }
          .loadingBar {
            width: min(280px, 80vw);
            height: 4px;
            background: var(--border);
            border-radius: 4px;
            overflow: hidden;
          }
          .loadingBarFill {
            width: 40%;
            height: 100%;
            background: var(--primary-blue);
            border-radius: 4px;
            animation: loadingSlide 1.4s ease-in-out infinite;
          }
          .loadingText {
            color: var(--text-muted);
            font-size: 0.9rem;
            font-weight: 600;
            letter-spacing: 0.04em;
          }
          @keyframes loadingPulse {
            0%, 100% { opacity: 0.7; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.06); }
          }
          @keyframes loadingSlide {
            0% { transform: translateX(-100%); }
            50% { transform: translateX(200%); }
            100% { transform: translateX(-100%); }
          }
        `}</style>
      </div>
    </div>
  );
}
