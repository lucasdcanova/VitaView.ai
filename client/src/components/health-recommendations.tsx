import { useState } from "react";
import { 
  AlertCircle,
  PillBottle,
  HeartPulse
} from "lucide-react";

type Recommendation = {
  id: number;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
};

// Sample recommendations data
const sampleRecommendations: Recommendation[] = [
  {
    id: 1,
    priority: 'medium',
    title: 'Consulta com nutricionista',
    description: 'Seus níveis de colesterol estão próximos do limite superior.'
  },
  {
    id: 2,
    priority: 'high',
    title: 'Suplementação de Vitamina D',
    description: 'Seus níveis estão abaixo do recomendado.'
  },
  {
    id: 3,
    priority: 'low',
    title: 'Manter atividade física',
    description: 'Continue com a rotina atual de exercícios.'
  }
];

export default function HealthRecommendations() {
  const [recommendations] = useState<Recommendation[]>(sampleRecommendations);
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'yellow';
      case 'medium':
        return 'primary';
      case 'low':
        return 'green';
      default:
        return 'gray';
    }
  };
  
  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertCircle className="text-yellow-600" size={18} />;
      case 'medium':
        return <PillBottle className="text-primary-600" size={18} />;
      case 'low':
        return <HeartPulse className="text-green-600" size={18} />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Recomendações</h2>
          <p className="text-sm text-gray-500 mt-1">Baseadas nos seus resultados</p>
        </div>
        <span className="text-xs font-medium bg-primary-100 text-primary-800 rounded-full px-3 py-1 flex items-center">
          <span className="inline-block h-2 w-2 rounded-full bg-primary-600 mr-1.5"></span>
          {recommendations.length} novas
        </span>
      </div>
      
      <div className="space-y-4">
        {recommendations.map((recommendation) => (
          <div 
            key={recommendation.id}
            className={`border-l-4 border-${getPriorityColor(recommendation.priority)}-500 bg-${getPriorityColor(recommendation.priority)}-50 rounded-lg p-4 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 cursor-pointer`}
          >
            <div className="flex items-start">
              <div className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-${getPriorityColor(recommendation.priority)}-100 text-${getPriorityColor(recommendation.priority)}-700 mr-4`}>
                {getPriorityIcon(recommendation.priority)}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h3 className="font-medium text-gray-800 text-base">{recommendation.title}</h3>
                  <div className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium bg-${getPriorityColor(recommendation.priority)}-100 text-${getPriorityColor(recommendation.priority)}-800`}>
                    {recommendation.priority === 'high' ? 'Alta prioridade' : 
                    recommendation.priority === 'medium' ? 'Média prioridade' : 'Baixa prioridade'}
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-1">{recommendation.description}</p>
                
                <div className="flex items-center mt-3 pt-2 border-t border-gray-100">
                  <button className={`mr-4 text-${getPriorityColor(recommendation.priority)}-600 hover:text-${getPriorityColor(recommendation.priority)}-800 font-medium flex items-center text-sm`}>
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Marcar como concluído
                  </button>
                  <button className="text-gray-500 hover:text-gray-700 flex items-center text-sm">
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Mais detalhes
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <button className="w-full mt-6 px-4 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors flex items-center justify-center shadow-sm">
        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        Ver plano de saúde completo
      </button>
    </div>
  );
}
