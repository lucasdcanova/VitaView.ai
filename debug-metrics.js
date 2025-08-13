// Debug script para verificar métricas de saúde
console.log('🔍 Verificando métricas de saúde...');

// Fazer requisição para verificar se o usuário está logado
fetch('http://localhost:5000/api/user', { 
  credentials: 'include' 
})
.then(res => res.json())
.then(user => {
  console.log('👤 Usuário logado:', user);
  
  // Buscar exames
  return fetch('http://localhost:5000/api/exams', { 
    credentials: 'include' 
  });
})
.then(res => res.json())
.then(exams => {
  console.log('📋 Exames encontrados:', exams.length);
  console.log('📋 Exames:', exams);
  
  // Buscar métricas
  return fetch('http://localhost:5000/api/health-metrics', { 
    credentials: 'include' 
  });
})
.then(res => res.json())
.then(metrics => {
  console.log('📊 Métricas encontradas:', metrics.length);
  console.log('📊 Métricas:', metrics);
  
  // Buscar métricas mais recentes
  return fetch('http://localhost:5000/api/health-metrics/latest', { 
    credentials: 'include' 
  });
})
.then(res => res.json())
.then(latestMetrics => {
  console.log('📊 Métricas mais recentes:', latestMetrics.length);
  console.log('📊 Métricas mais recentes:', latestMetrics);
})
.catch(error => {
  console.error('❌ Erro:', error);
});