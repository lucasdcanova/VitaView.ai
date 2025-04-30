import { useState, useEffect } from "react";

type HealthScoreProps = {
  score: number;
};

export default function HealthScore({ score }: HealthScoreProps) {
  const [displayScore, setDisplayScore] = useState(0);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayScore(score);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [score]);
  
  // Calculate the health status based on the score
  const getHealthStatus = () => {
    if (score >= 80) return { text: "excelente", color: "text-green-600" };
    if (score >= 70) return { text: "bom", color: "text-primary-600" };
    if (score >= 60) return { text: "regular", color: "text-yellow-600" };
    return { text: "atenção", color: "text-red-600" };
  };
  
  const status = getHealthStatus();
  
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-lg font-semibold mb-4 text-gray-800">Score de Saúde</h2>
      <div className="flex justify-center items-center">
        <div className="relative w-44 h-44">
          <svg className="w-full h-full" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#edf2f7" strokeWidth="10" />
            <circle 
              cx="50" 
              cy="50" 
              r="45" 
              fill="none" 
              stroke="#3b82f6" 
              strokeWidth="10" 
              strokeDasharray="283" 
              strokeDashoffset={283 - (283 * displayScore / 100)} 
              transform="rotate(-90 50 50)" 
              className="transition-all duration-1000 ease-out" 
            />
          </svg>
          <div className="absolute inset-0 flex flex-col justify-center items-center">
            <span className="text-4xl font-bold text-primary-700">{displayScore}</span>
            <span className="text-sm text-gray-500">de 100</span>
          </div>
        </div>
      </div>
      <p className="text-center mt-4 text-sm text-gray-600">
        Seu score de saúde está <span className={`font-medium ${status.color}`}>{status.text}</span>
        {score < 80 && ", mas poderia melhorar."}
        {score >= 80 && "."}
      </p>
    </div>
  );
}
