// app/test-error/page.tsx
export default function TestErrorPage() {
  // This throws an error immediately when the page loads
  throw new Error("This is a simulated global error for UI testing");
  
  return <div>You should not see this.</div>;
}