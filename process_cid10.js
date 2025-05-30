import fs from 'fs';
import path from 'path';

// Função para processar todos os arquivos CID-10 do SUS (categorias + subcategorias)
function processCID10Data() {
  const cid10Database = [];
  
  // Processar categorias principais
  const categoriesPath = path.join('attached_assets', 'CID10-categorias.cnv');
  if (fs.existsSync(categoriesPath)) {
    const categoriesData = fs.readFileSync(categoriesPath, 'latin1');
    const categoriesLines = categoriesData.split(/\r?\n/);
    processLines(categoriesLines, cid10Database, 'categoria');
  }
  
  // Processar subcategorias (códigos expandidos como F10.0, F10.1, etc.)
  const subcatFiles = fs.readdirSync('attached_assets').filter(file => file.startsWith('CID10-subcat-') && file.endsWith('.cnv'));
  
  subcatFiles.forEach(file => {
    const subcatPath = path.join('attached_assets', file);
    const subcatData = fs.readFileSync(subcatPath, 'latin1');
    const subcatLines = subcatData.split(/\r?\n/);
    processLines(subcatLines, cid10Database, 'subcategoria');
  });

  // Processar categorias e subcategorias detalhadas (CID10-catsubcat-*.cnv)
  const catsubcatFiles = fs.readdirSync('attached_assets').filter(file => file.startsWith('CID10-catsubcat-') && file.endsWith('.cnv'));
  
  catsubcatFiles.forEach(file => {
    const catsubcatPath = path.join('attached_assets', file);
    const catsubcatData = fs.readFileSync(catsubcatPath, 'latin1');
    const catsubcatLines = catsubcatData.split(/\r?\n/);
    processCatSubcatLines(catsubcatLines, cid10Database);
  });
  
  // Gerar arquivo JavaScript com os dados
  const jsContent = `export const CID10_DATABASE = ${JSON.stringify(cid10Database, null, 2)};`;
  
  fs.writeFileSync('client/src/data/cid10-database.ts', jsContent);
  
  console.log(`Processados ${cid10Database.length} códigos CID-10 autênticos do SUS (categorias + subcategorias)`);
  console.log('Arquivo gerado: client/src/data/cid10-database.ts');
  
  // Mostrar alguns exemplos
  console.log('\nExemplos de códigos processados:');
  cid10Database.slice(0, 10).forEach(item => {
    console.log(`${item.code} - ${item.description} (${item.category})`);
  });
  
  // Mostrar exemplos de subcategorias F10
  console.log('\nExemplos de subcategorias F10 (álcool):');
  const f10Codes = cid10Database.filter(item => item.code.startsWith('F10'));
  f10Codes.forEach(item => {
    console.log(`${item.code} - ${item.description} (${item.category})`);
  });
}

function processLines(lines, database, type) {
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

    // Parse para categorias: "      1  A00   Colera                                       A00,"
    // Parse para subcategorias: "     39  F10.0 Intox aguda                                  F100,"
    const match = line.match(/^\s*(\d+)\s+([A-Z]\d{2}(?:\.\d)?)\s+(.+?)\s+[A-Z]\d+,?\s*$/);
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
        .replace(/intox/gi, 'intoxicação')
        .replace(/aguda/gi, 'aguda')
        .replace(/sindr/gi, 'síndrome')
        .replace(/dependencia/gi, 'dependência')
        .replace(/abstinencia/gi, 'abstinência')
        .replace(/delirium/gi, 'delírio')
        .replace(/transt/gi, 'transtorno')
        .replace(/psicotico/gi, 'psicótico')
        .replace(/amnesica/gi, 'amnésica')
        .replace(/comport/gi, 'comportamental')
        .replace(/mental/gi, 'mental')
        .replace(/instalacao/gi, 'instalação')
        .replace(/tard/gi, 'tardio')
        .replace(/residual/gi, 'residual')
        .trim();

      // Capitalizar primeira letra
      cleanDescription = cleanDescription.charAt(0).toUpperCase() + cleanDescription.slice(1);

      // Evitar duplicatas (algumas categorias podem aparecer em ambos os arquivos)
      const existing = database.find(item => item.code === code);
      if (!existing) {
        database.push({
          code: code,
          description: cleanDescription,
          category: category
        });
      }
    }
  }
}

// Função específica para processar arquivos CID10-catsubcat-*.cnv
function processCatSubcatLines(lines, database) {
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

    // Formato dos arquivos catsubcat:
    // "    251  N44   Torcao do testiculo                          N44 -N449,"
    // "251 252  N44.0 Torcao de cordon espermatico                N440,"
    // "251 253  N44.1 Torcao do testiculo                         N441,"
    
    const matchCategory = line.match(/^\s*(\d+)\s+([A-Z]\d{2})\s+(.+?)\s+[A-Z]\d+\s*-[A-Z]\d+,?\s*$/);
    const matchSubcat = line.match(/^\s*\d+\s+\d+\s+([A-Z]\d{2}\.\d)\s+(.+?)\s+[A-Z]\d+,?\s*$/);
    
    if (matchCategory) {
      // Categoria principal
      const [, , code, description] = matchCategory;
      const chapter = code.charAt(0);
      const category = chapterMap[chapter] || 'Outros';
      
      let cleanDescription = cleanDescriptionText(description);
      
      const existing = database.find(item => item.code === code);
      if (!existing) {
        database.push({
          code: code,
          description: cleanDescription,
          category: category
        });
      }
    } else if (matchSubcat) {
      // Subcategoria (como N44.0, N44.1, N44.2, etc.)
      const [, code, description] = matchSubcat;
      const chapter = code.charAt(0);
      const category = chapterMap[chapter] || 'Outros';
      
      let cleanDescription = cleanDescriptionText(description);
      
      const existing = database.find(item => item.code === code);
      if (!existing) {
        database.push({
          code: code,
          description: cleanDescription,
          category: category
        });
      }
    }
  }
}

function cleanDescriptionText(description) {
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
    .replace(/intox/gi, 'intoxicação')
    .replace(/aguda/gi, 'aguda')
    .replace(/sindr/gi, 'síndrome')
    .replace(/dependencia/gi, 'dependência')
    .replace(/abstinencia/gi, 'abstinência')
    .replace(/delirium/gi, 'delírio')
    .replace(/transt/gi, 'transtorno')
    .replace(/psicotico/gi, 'psicótico')
    .replace(/amnesica/gi, 'amnésica')
    .replace(/comport/gi, 'comportamental')
    .replace(/mental/gi, 'mental')
    .replace(/instalacao/gi, 'instalação')
    .replace(/tard/gi, 'tardio')
    .replace(/residual/gi, 'residual')
    .replace(/torcao/gi, 'torção')
    .replace(/testiculo/gi, 'testículo')
    .replace(/espermatico/gi, 'espermático')
    .replace(/cordon/gi, 'cordão')
    .trim();

  // Capitalizar primeira letra
  return cleanDescription.charAt(0).toUpperCase() + cleanDescription.slice(1);
}

processCID10Data();