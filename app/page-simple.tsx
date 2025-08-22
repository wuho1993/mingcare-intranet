export default function SimplePage() {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>明家居家護理服務</h1>
      <p>系統啟動中...</p>
      <a href="/services" style={{ 
        display: 'inline-block', 
        padding: '10px 20px', 
        background: '#3B82F6', 
        color: 'white', 
        textDecoration: 'none',
        borderRadius: '5px',
        margin: '10px'
      }}>
        前往服務管理
      </a>
    </div>
  )
}
