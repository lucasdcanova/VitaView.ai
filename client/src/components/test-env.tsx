export const TestEnv = () => {
  return (
    <div style={{ padding: '20px', background: '#f0f0f0', margin: '20px', borderRadius: '8px' }}>
      <h3>Teste de Variáveis de Ambiente</h3>
      <p>VITE_STRIPE_PUBLIC_KEY: {import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'NÃO DEFINIDA'}</p>
      <p>MODE: {import.meta.env.MODE}</p>
      <p>DEV: {String(import.meta.env.DEV)}</p>
      <p>PROD: {String(import.meta.env.PROD)}</p>
    </div>
  );
};