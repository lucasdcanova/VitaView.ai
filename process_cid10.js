import fs from 'fs';
import path from 'path';

// Função para processar o arquivo CID10-categorias.cnv do SUS
function processCID10Data() {
  const filePath = path.join('attached_assets', 'CID10-categorias.cnv');
  
  if (!fs.existsSync(filePath)) {
    console.error('Arquivo CID10-categorias.cnv não encontrado');
    return;
  }

  const data = fs.readFileSync(filePath, 'latin1');
  const lines = data.split(/\r?\n/);
  
  const cid10Database = [];
  
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

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Parse: "      1  A00   Colera                                       A00,"
    const match = line.match(/^\s*(\d+)\s+([A-Z]\d{2}(?:\.\d)?)\s+(.+?)\s+\2,?\s*$/);
    if (match) {
      const [, , code, description] = match;
      const chapter = code.charAt(0);
      const category = chapterMap[chapter] || 'Outros';
      
      let cleanDescription = description
        .replace(/\s+/g, ' ')
        .replace(/NCOP/g, 'não classificado em outra parte')
        .replace(/NE/g, 'não especificado')
        .replace(/c\//g, 'com ')
        .replace(/s\//g, 'sem ')
        .replace(/p\//g, 'por ')
        .replace(/outr/gi, 'outras')
        .replace(/doenc/gi, 'doenças')
        .replace(/infecc/gi, 'infecções')
        .replace(/bacter/gi, 'bacterianas')
        .replace(/orig/gi, 'origem')
        .replace(/presum/gi, 'presumível')
        .replace(/tuberc/gi, 'tuberculose')
        .replace(/respirat/gi, 'respiratória')
        .replace(/conf/gi, 'confirmação')
        .replace(/bacteriol/gi, 'bacteriológica')
        .replace(/histolog/gi, 'histológica')
        .replace(/sist/gi, 'sistema')
        .replace(/orgaos/gi, 'órgãos')
        .replace(/intestinais/gi, 'intestinais')
        .replace(/alimentares/gi, 'alimentares')
        .replace(/protozoarios/gi, 'protozoários')
        .replace(/virais/gi, 'virais')
        .replace(/gastroenterite/gi, 'gastroenterite')
        .replace(/miliar/gi, 'miliar')
        .trim();

      // Capitalizar primeira letra
      cleanDescription = cleanDescription.charAt(0).toUpperCase() + cleanDescription.slice(1);

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