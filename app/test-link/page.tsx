export default function TestPage() {
  return (
    <div style={{ padding: '50px', background: 'white', color: 'black', height: '100vh' }}>
      <h1>IT WORKS!</h1>
      <p>If you can see this on your tablet, then the tablet <strong>CAN</strong> reach your Mac.</p>
      <p>Current Time: {new Date().toLocaleTimeString()}</p>
      <div style={{ marginTop: '20px', padding: '10px', border: '1px solid black' }}>
        <h2>Diagnostics:</h2>
        <ul>
          <li>Browser: {typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown'}</li>
          <li>URL: {typeof window !== 'undefined' ? window.location.href : ''}</li>
        </ul>
      </div>
    </div>
  );
}
