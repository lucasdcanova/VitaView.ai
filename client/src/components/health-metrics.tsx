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
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Métricas Principais</h2>
        <button className="text-sm text-primary-600 hover:text-primary-800 font-medium">
          Ver detalhes
        </button>
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-3 bg-gray-50 rounded-lg">
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-6 w-2/3" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {displayMetrics?.map((metric) => (
            <div 
              key={metric.id} 
              className={`p-3 rounded-lg ${getStatusClass(metric.status)}`}
            >
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">{getMetricDisplayName(metric.name)}</span>
                <div className="flex items-center">
                  {getChangeIcon(metric.change)}
                  <span 
                    className={`text-xs ${metric.change === '0' ? 'text-gray-600' : getChangeTextColor(metric.change, metric.name)}`}
                  >
                    {Math.abs(parseFloat(metric.change))}
                  </span>
                </div>
              </div>
              <div className="flex items-baseline mt-1">
                <span className="text-xl font-semibold">{metric.value}</span>
                <span className="text-xs text-gray-500 ml-1">{getMetricUnit(metric.name)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
