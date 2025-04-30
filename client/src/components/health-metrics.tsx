import { useQuery } from "@tanstack/react-query";
import { getLatestHealthMetrics } from "@/lib/api";
import { HealthMetric } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";

export default function HealthMetrics() {
  const { data: metrics, isLoading } = useQuery<HealthMetric[]>({
    queryKey: ["/api/health-metrics/latest"],
    queryFn: getLatestHealthMetrics,
  });
  
  // Filter metrics to only show the ones we want to display
  const displayMetrics = metrics?.filter(metric => 
    ['colesterol', 'glicemia', 'hemoglobina', 'vitamina_d'].includes(metric.name)
  );
  
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'normal':
        return 'bg-green-50';
      case 'atenção':
      case 'baixo':
        return 'bg-yellow-50';
      case 'alto':
      case 'deficiente':
        return 'bg-red-50';
      default:
        return 'bg-gray-50';
    }
  };
  
  const getChangeIcon = (change: string) => {
    if (change.startsWith('-')) {
      return <ArrowDown className="w-3 h-3 text-green-600" />;
    } else if (change.startsWith('+')) {
      return <ArrowUp className="w-3 h-3 text-red-600" />;
    }
    return <Minus className="w-3 h-3 text-gray-600" />;
  };
  
  const getChangeTextColor = (change: string, metricName: string) => {
    // For vitamin D, increasing is good, decreasing is bad
    if (metricName === 'vitamina_d') {
      return change.startsWith('+') ? 'text-green-600' : 'text-red-600';
    }
    
    // For others, decreasing is generally good, increasing is bad
    return change.startsWith('-') ? 'text-green-600' : 'text-red-600';
  };
  
  const getMetricDisplayName = (name: string) => {
    switch (name) {
      case 'colesterol': return 'Colesterol';
      case 'glicemia': return 'Glicemia';
      case 'hemoglobina': return 'Hemoglobina';
      case 'vitamina_d': return 'Vitamina D';
      default: return name;
    }
  };
  
  const getMetricUnit = (name: string) => {
    switch (name) {
      case 'colesterol': return 'mg/dL';
      case 'glicemia': return 'mg/dL';
      case 'hemoglobina': return 'g/dL';
      case 'vitamina_d': return 'ng/mL';
      default: return '';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Métricas Principais</h2>
          <p className="text-sm text-gray-500 mt-1">Monitoramento contínuo da sua saúde</p>
        </div>
        <button className="text-sm text-primary-600 hover:text-primary-800 font-medium bg-primary-50 hover:bg-primary-100 transition-colors px-3 py-1.5 rounded-lg flex items-center">
          <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Ver detalhes
        </button>
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-4 bg-gray-50 rounded-xl shadow-sm">
              <Skeleton className="h-5 w-24 mb-2" />
              <Skeleton className="h-8 w-16 mb-3" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {displayMetrics?.map((metric) => (
            <div 
              key={metric.id} 
              className={`p-4 rounded-xl hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 cursor-pointer ${getStatusClass(metric.status)}`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-gray-700">{getMetricDisplayName(metric.name)}</h3>
                  <div className="flex items-baseline mt-1">
                    <span className="text-2xl font-bold">{metric.value}</span>
                    <span className="text-xs text-gray-500 ml-1.5">{getMetricUnit(metric.name)}</span>
                  </div>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  metric.status === 'normal' ? 'bg-green-100 text-green-800' :
                  metric.status === 'atenção' ? 'bg-yellow-100 text-yellow-800' :
                  metric.status === 'alto' ? 'bg-red-100 text-red-800' :
                  metric.status === 'baixo' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {metric.status}
                </div>
              </div>
              
              <div className="mt-4 pt-3 border-t border-gray-100">
                <div className="flex items-center">
                  <div className={`flex items-center mr-2 ${getChangeTextColor(metric.change, metric.name)}`}>
                    {getChangeIcon(metric.change)}
                    <span className="ml-1 text-xs font-medium">
                      {metric.change}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">desde o último exame</span>
                </div>
                
                {/* Mini visual progress indicator */}
                <div className="w-full h-1.5 bg-gray-100 rounded-full mt-2 overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${
                      metric.status === 'normal' ? 'bg-green-500' :
                      metric.status === 'atenção' ? 'bg-yellow-500' :
                      metric.status === 'alto' ? 'bg-red-500' :
                      metric.status === 'baixo' ? 'bg-blue-500' :
                      'bg-gray-400'
                    }`} 
                    style={{ 
                      width: `${
                        metric.status === 'normal' ? '75%' :
                        metric.status === 'atenção' ? '50%' :
                        metric.status === 'alto' ? '90%' :
                        metric.status === 'baixo' ? '30%' :
                        '50%'
                      }` 
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
