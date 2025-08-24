export default function TestComponent() {
  console.log("TestComponent is rendering");
  
  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: '#10b981', 
      color: 'white', 
      fontSize: '24px',
      textAlign: 'center'
    }}>
      <h1>🌱 FailSeed Test Component</h1>
      <p>If you can see this, React is working!</p>
      <p>Time: {new Date().toLocaleTimeString()}</p>
    </div>
  );
}