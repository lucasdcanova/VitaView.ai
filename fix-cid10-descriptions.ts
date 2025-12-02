import * as fs from 'fs';
import * as path from 'path';
import OpenAI from 'openai';

// Configuração
const BATCH_SIZE = 50;
const INPUT_FILE = './client/src/data/cid10-database.ts';
const BACKUP_FILE = './client/src/data/cid10-database.backup.ts';
const OUTPUT_FILE = './client/src/data/cid10-database.ts';
const PROGRESS_FILE = './cid10-fix-progress.json';
const REPORT_FILE = './cid10-changes-report.md';

interface CID10Entry {
    code: string;
    description: string;
    category: string;
}

interface ProgressData {
    processedCount: number;
    totalCount: number;
    correctedEntries: CID10Entry[];
    lastBatchIndex: number;
}

// Inicializar OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Função para extrair dados do arquivo TypeScript
function loadCID10Database(): CID10Entry[] {
    console.log('📖 Carregando base de dados CID-10...');
    const fileContent = fs.readFileSync(INPUT_FILE, 'utf-8');

    // Extrair o array JSON do arquivo TypeScript
    const match = fileContent.match(/export const CID10_DATABASE = (\[[\s\S]*\]);/);
    if (!match) {
        throw new Error('Não foi possível extrair os dados do arquivo');
    }

    const data = JSON.parse(match[1]) as CID10Entry[];
    console.log(`✅ ${data.length} entradas carregadas`);
    return data;
}

// Função para criar backup
function createBackup(): void {
    console.log('💾 Criando backup...');
    fs.copyFileSync(INPUT_FILE, BACKUP_FILE);
    console.log(`✅ Backup criado: ${BACKUP_FILE}`);
}

// Função para corrigir descrições usando OpenAI
async function correctDescriptions(entries: CID10Entry[]): Promise<CID10Entry[]> {
    const prompt = `Você é um especialista em terminologia médica CID-10 em português do Brasil.

Corrija as seguintes descrições de códigos CID-10:
- Expanda todas as abreviações médicas
- Corrija erros gramaticais e de concordância
- Adicione acentuação correta
- Mantenha a precisão e terminologia médica
- Use português formal e claro

IMPORTANTE: Retorne APENAS um array JSON válido, sem texto adicional.

Formato de entrada e saída:
[
  {"code": "A00", "description": "Descrição original"},
  ...
]

Códigos para corrigir:
${JSON.stringify(entries.map(e => ({ code: e.code, description: e.description })))}`;

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: 'Você é um especialista em terminologia médica CID-10. Retorne apenas JSON válido, sem markdown ou texto adicional.',
                },
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            temperature: 0.3,
            max_tokens: 4000,
        });

        const content = response.choices[0].message.content?.trim() || '';

        // Remover markdown se presente
        const jsonContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        const corrected = JSON.parse(jsonContent) as Array<{ code: string; description: string }>;

        // Mesclar com categorias originais
        return entries.map((entry, index) => ({
            ...entry,
            description: corrected[index]?.description || entry.description,
        }));
    } catch (error) {
        console.error('❌ Erro ao processar lote:', error);
        throw error;
    }
}

// Função para salvar progresso
function saveProgress(progress: ProgressData): void {
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

// Função para carregar progresso
function loadProgress(): ProgressData | null {
    if (fs.existsSync(PROGRESS_FILE)) {
        const data = fs.readFileSync(PROGRESS_FILE, 'utf-8');
        return JSON.parse(data);
    }
    return null;
}

// Função para gerar relatório
function generateReport(original: CID10Entry[], corrected: CID10Entry[]): void {
    console.log('📊 Gerando relatório...');

    const changes: Array<{ code: string; before: string; after: string }> = [];

    for (let i = 0; i < original.length; i++) {
        if (original[i].description !== corrected[i].description) {
            changes.push({
                code: original[i].code,
                before: original[i].description,
                after: corrected[i].description,
            });
        }
    }

    let report = `# Relatório de Correção CID-10\n\n`;
    report += `**Data:** ${new Date().toLocaleString('pt-BR')}\n\n`;
    report += `## Estatísticas\n\n`;
    report += `- Total de entradas: ${original.length}\n`;
    report += `- Descrições alteradas: ${changes.length}\n`;
    report += `- Descrições mantidas: ${original.length - changes.length}\n`;
    report += `- Taxa de alteração: ${((changes.length / original.length) * 100).toFixed(2)}%\n\n`;

    report += `## Exemplos de Correções (50 aleatórios)\n\n`;

    const samples = changes.sort(() => Math.random() - 0.5).slice(0, 50);

    for (const change of samples) {
        report += `### ${change.code}\n\n`;
        report += `**Antes:** ${change.before}\n\n`;
        report += `**Depois:** ${change.after}\n\n`;
        report += `---\n\n`;
    }

    fs.writeFileSync(REPORT_FILE, report);
    console.log(`✅ Relatório salvo: ${REPORT_FILE}`);
}

// Função para salvar base corrigida
function saveCorrectedDatabase(entries: CID10Entry[]): void {
    console.log('💾 Salvando base de dados corrigida...');

    const content = `export const CID10_DATABASE = ${JSON.stringify(entries, null, 2)};\n`;
    fs.writeFileSync(OUTPUT_FILE, content);

    console.log(`✅ Base de dados salva: ${OUTPUT_FILE}`);
}

// Função principal
async function main() {
    console.log('🚀 Iniciando correção da base CID-10\n');

    // Verificar API key
    if (!process.env.OPENAI_API_KEY) {
        console.error('❌ OPENAI_API_KEY não configurada');
        console.error('Configure com: export OPENAI_API_KEY=sua-chave-aqui');
        process.exit(1);
    }

    // Carregar dados
    const allEntries = loadCID10Database();
    const totalCount = allEntries.length;

    // Verificar se há progresso anterior
    let progress = loadProgress();
    let startIndex = 0;
    let correctedEntries: CID10Entry[] = [];

    if (progress) {
        console.log(`\n📌 Progresso anterior encontrado: ${progress.processedCount}/${progress.totalCount} processados`);
        const resume = process.argv.includes('--resume');

        if (resume) {
            console.log('▶️  Continuando do último ponto...');
            startIndex = progress.lastBatchIndex;
            correctedEntries = progress.correctedEntries;
        } else {
            console.log('🔄 Iniciando do zero (use --resume para continuar)');
            fs.unlinkSync(PROGRESS_FILE);
        }
    }

    // Criar backup se for primeira execução
    if (startIndex === 0) {
        createBackup();
    }

    // Processar em lotes
    console.log(`\n🔄 Processando ${totalCount} entradas em lotes de ${BATCH_SIZE}...\n`);

    for (let i = startIndex; i < totalCount; i += BATCH_SIZE) {
        const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(totalCount / BATCH_SIZE);
        const batch = allEntries.slice(i, Math.min(i + BATCH_SIZE, totalCount));

        console.log(`📦 Processando lote ${batchNumber}/${totalBatches} (códigos ${i + 1}-${Math.min(i + BATCH_SIZE, totalCount)})...`);

        try {
            const correctedBatch = await correctDescriptions(batch);
            correctedEntries.push(...correctedBatch);

            // Salvar progresso
            const progressData: ProgressData = {
                processedCount: correctedEntries.length,
                totalCount,
                correctedEntries,
                lastBatchIndex: i + BATCH_SIZE,
            };
            saveProgress(progressData);

            console.log(`✅ Lote ${batchNumber} concluído (${correctedEntries.length}/${totalCount})\n`);

            // Aguardar um pouco para evitar rate limits
            if (i + BATCH_SIZE < totalCount) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        } catch (error) {
            console.error(`❌ Erro no lote ${batchNumber}:`, error);
            console.log('💾 Progresso salvo. Execute novamente com --resume para continuar.');
            process.exit(1);
        }
    }

    console.log('\n✅ Processamento concluído!\n');

    // Gerar relatório
    generateReport(allEntries, correctedEntries);

    // Salvar base corrigida
    saveCorrectedDatabase(correctedEntries);

    // Limpar arquivo de progresso
    if (fs.existsSync(PROGRESS_FILE)) {
        fs.unlinkSync(PROGRESS_FILE);
    }

    console.log('\n🎉 Correção da base CID-10 concluída com sucesso!');
    console.log(`📊 Veja o relatório em: ${REPORT_FILE}`);
    console.log(`💾 Backup do original em: ${BACKUP_FILE}`);
}

// Executar
main().catch(console.error);
