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
        return 'border-yellow-500';
      case 'medium':
        return 'border-primary-500';
      case 'low':
        return 'border-green-500';
      default:
        return 'border-gray-300';
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
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Recomendações</h2>
        <span className="text-xs font-medium bg-primary-100 text-primary-800 rounded-full px-2 py-1">
          {recommendations.length} novas
        </span>
      </div>
      
      <div className="space-y-4">
        {recommendations.map((recommendation) => (
          <div 
            key={recommendation.id}
            className={`border-l-4 ${getPriorityColor(recommendation.priority)} pl-3 py-1`}
          >
            <div className="flex items-start">
              <div className="mt-1 mr-2">
                {getPriorityIcon(recommendation.priority)}
              </div>
              <div>
                <h3 className="font-medium text-gray-800">{recommendation.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{recommendation.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <button className="w-full mt-4 px-4 py-2 bg-primary-50 text-primary-700 rounded-lg font-medium hover:bg-primary-100 transition-colors">
        Ver plano completo
      </button>
    </div>
  );
}
