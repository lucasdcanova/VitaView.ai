const fs = require('fs');
const path = require('path');

// Função para processar o arquivo CID10-categorias.cnv do SUS
function processCID10Data() {
  const filePath = path.join('attached_assets', 'CID10-categorias.cnv');
  
  if (!fs.existsSync(filePath)) {
    console.error('Arquivo CID10-categorias.cnv não encontrado');
    return;
  }

  const data = fs.readFileSync(filePath, 'latin1'); // Usar latin1 para caracteres especiais
  const lines = data.split('\n');
  
  const cid10Database = [];
  
  // Mapear capítulos CID-10 para categorias em português
  const chapterMap = {
    'A': 'Infecciosas e Parasitárias',
    'B': 'Infecciosas e Parasitárias', 
    'C': 'Neoplasias',
    'D': 'Sangue e Imunológicas',
    'E': 'Endócrinas e Metabólicas',
    'F': 'Transtornos Mentais',
    'G': 'Sistema Nervoso',
    'H': 'Olho/Ouvido',
    'I': 'Aparelho Circulatório',
    'J': 'Aparelho Respiratório',
    'K': 'Aparelho Digestivo',
    'L': 'Pele e Tecido Subcutâneo',
    'M': 'Sistema Osteomuscular',
    'N': 'Aparelho Geniturinário',
    'O': 'Gravidez e Parto',
    'P': 'Período Perinatal',
    'Q': 'Malformações Congênitas',
    'R': 'Sintomas e Sinais',
    'S': 'Lesões e Traumatismos',
    'T': 'Lesões e Envenenamentos',
    'V': 'Causas Externas',
    'W': 'Causas Externas',
    'X': 'Causas Externas',
    'Y': 'Causas Externas',
    'Z': 'Fatores de Saúde'
  };

  // Processar cada linha do arquivo (ignorar cabeçalho)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Parse da linha: número, código, descrição
    const match = line.match(/^\s*(\d+)\s+([A-Z]\d{2}(?:\.\d)?)\s+(.+?)\s+\1[A-Z]\d{2}/);
    if (match) {
      const [, , code, description] = match;
      const chapter = code.charAt(0);
      const category = chapterMap[chapter] || 'Outros';
      
      // Limpar descrição
      const cleanDescription = description
        .replace(/\s+/g, ' ')
        .replace(/NCOP/g, 'não classificado em outra parte')
        .replace(/NE/g, 'não especificado')
        .replace(/c\//g, 'com ')
        .replace(/s\//g, 'sem ')
        .replace(/p\//g, 'por ')
        .replace(/outr/g, 'outras')
        .replace(/doenc/g, 'doenças')
        .replace(/infecc/g, 'infecções')
        .replace(/bacter/g, 'bacterianas')
        .replace(/orig/g, 'origem')
        .replace(/presum/g, 'presumível')
        .replace(/tuberc/g, 'tuberculose')
        .replace(/respirat/g, 'respiratória')
        .replace(/conf/g, 'confirmação')
        .replace(/bacteriol/g, 'bacteriológica')
        .replace(/histolog/g, 'histológica')
        .replace(/sist/g, 'sistema')
        .replace(/orgaos/g, 'órgãos')
        .trim();

      cid10Database.push({
        code: code,
        description: cleanDescription,
        category: category
      });
    }
  }

  // Gerar arquivo JavaScript com os dados
  const jsContent = `export const CID10_DATABASE = ${JSON.stringify(cid10Database, null, 2)};`;
  
  fs.writeFileSync('client/src/data/cid10-database.ts', jsContent);
  
  console.log(`Processados ${cid10Database.length} códigos CID-10 autênticos do SUS`);
  console.log('Arquivo gerado: client/src/data/cid10-database.ts');
  
  // Mostrar alguns exemplos
  console.log('\nExemplos de códigos processados:');
  cid10Database.slice(0, 10).forEach(item => {
    console.log(`${item.code} - ${item.description} (${item.category})`);
  });
}

processCID10Data();