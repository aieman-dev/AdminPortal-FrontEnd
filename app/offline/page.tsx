// app/offline/page.tsx
"use client";

export default function OfflineFallback() {
  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        :root {
          --bg-color: #f9fafb;
          --text-main: #111827;
          --text-muted: #6b7280;
          --card-bg: #ffffff;
          --border-color: #e5e7eb;
          --primary: #4f46e5;
          --primary-hover: #4338ca;
        }
        
        /* Auto-detect Dark Mode */
        @media (prefers-color-scheme: dark) {
          :root {
            --bg-color: #09090b;
            --text-main: #f9fafb;
            --text-muted: #a1a1aa;
            --card-bg: #18181b;
            --border-color: #27272a;
            --primary: #6366f1;
            --primary-hover: #4f46e5;
          }
        }
        
        body {
          margin: 0;
          background-color: var(--bg-color);
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          color: var(--text-main);
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100dvh;
        }
        
        .offline-container {
          text-align: center;
          padding: 2rem;
          max-width: 24rem;
          animation: fade-in 0.6s ease-out;
        }
        
        .icon-wrapper {
          position: relative;
          width: 120px;
          height: 120px;
          margin: 0 auto 2.5rem auto;
          background-color: var(--card-bg);
          border: 1px solid var(--border-color);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
        }
        
        /* Animated Red Pulsing Ring */
        .icon-wrapper::before {
          content: '';
          position: absolute;
          inset: -15px;
          border: 2px solid #ef4444;
          border-radius: 50%;
          opacity: 0;
          animation: pulse-ring 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        h1 {
          font-size: 2rem;
          font-weight: 800;
          margin-bottom: 1rem;
          letter-spacing: -0.025em;
        }
        
        p {
          color: var(--text-muted);
          font-size: 0.95rem;
          line-height: 1.6;
          margin-bottom: 2.5rem;
        }
        
        button {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background-color: var(--primary);
          color: white;
          border: none;
          padding: 1rem 2.5rem;
          font-size: 1rem;
          font-weight: 600;
          border-radius: 9999px;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.3);
        }
        
        button:hover {
          background-color: var(--primary-hover);
          transform: translateY(-2px);
          box-shadow: 0 6px 8px -1px rgba(79, 70, 229, 0.4);
        }
        
        button:active {
          transform: translateY(1px);
        }
        
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes pulse-ring {
          0% { transform: scale(0.8); opacity: 0.5; }
          100% { transform: scale(1.3); opacity: 0; }
        }
      `}} />
      
      <div className="offline-container">
        <div className="icon-wrapper">
          {/* Inline SVG so we don't rely on Lucide loading */}
          <svg xmlns="http://www.w3.org/2000/svg" width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="2" y1="2" x2="22" y2="22"></line>
            <path d="M8.5 16.5a5 5 0 0 1 7 0"></path>
            <path d="M2 8.82a15 15 0 0 1 4.17-2.65"></path>
            <path d="M10.66 5c4.01-.36 8.14.9 11.34 3.82"></path>
          </svg>
        </div>
        
        <h1>Connection Lost</h1>
        <p>
          It looks like you're currently offline. Please check your network connection, and the portal will resume working.
        </p>
        
        <button onClick={() => window.location.reload()}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
            <path d="M3 3v5h5"></path>
          </svg>
          Try Reconnecting
        </button>
      </div>
    </>
  );
}