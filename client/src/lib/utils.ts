import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Gera uma cor aleatória mas consistente com base em uma string
 * O mesmo input sempre produzirá a mesma cor
 */
export function getRandomColor(input: string): string {
  // Criar um valor hash simples da string
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = input.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Cores pré-definidas para categorias comuns
  const commonCategories: Record<string, string> = {
    'Hemograma': '#e53935', // vermelho
    'Glicemia': '#8e24aa', // roxo
    'Colesterol': '#43a047', // verde
    'Triglicerídeos': '#fb8c00', // laranja
    'Creatinina': '#1e88e5', // azul
    'TSH': '#00897b', // turquesa
    'T4': '#00acc1', // ciano
    'Ácido Úrico': '#6d4c41', // marrom
    'TGO': '#f4511e', // vermelho-alaranjado
    'TGP': '#d81b60', // rosa
    'HDL': '#2e7d32', // verde escuro
    'LDL': '#ef6c00', // laranja escuro
    'VLDL': '#6a1b9a', // roxo escuro
    'Hemoglobina': '#b71c1c', // vermelho escuro
    'Hematócrito': '#880e4f', // rosa escuro
    'Proteína C Reativa': '#283593', // índigo
  };
  
  // Verificar se é uma categoria comum
  for (const category in commonCategories) {
    if (input.toLowerCase().includes(category.toLowerCase())) {
      return commonCategories[category];
    }
  }
  
  // Caso não seja uma categoria comum, gerar cor com base no hash
  const h = Math.abs(hash) % 360; // matiz (0-360)
  const s = 65 + (Math.abs(hash >> 3) % 26); // saturação (65-90%)
  const l = 40 + (Math.abs(hash >> 6) % 21); // luminosidade (40-60%)
  
  return `hsl(${h}, ${s}%, ${l}%)`;
}
