# VitaView.ai Promo - Quick Start

## 🚀 Start em 2 passos

```bash
# 1. Instalar dependências
cd video
npm install

# 2. Visualizar no browser
npm start
```

Isso abre o Remotion Studio em `http://localhost:3000` onde você pode ver o vídeo em tempo real.

## 🎬 Renderizar o vídeo final

```bash
npm run build
```

O vídeo será salvo como `output.mp4`.

## 📊 Especificações do Vídeo

- **Duração**: ~22 segundos (650 frames)
- **FPS**: 30
- **Resolução**: 1920x1080 (Full HD)
- **Tamanho estimado**: ~50-100MB (depende da compressão)

## 🎨 O que tem no vídeo?

1. **Intro** (3s) - Logo 3D + título
2. **Anamnese com IA** (5s) - Microfone 3D + features
3. **Prescrição Digital** (5s) - Documento 3D + features
4. **Análise de Exames** (5s) - Tubo de ensaio 3D + features
5. **Agenda Inteligente** (5s) - Calendário 3D + features
6. **CTA Final** (2s) - "Comece Gratuitamente"

## 💡 Dicas

- Use `npm start` para preview interativo
- Use `npm run build` para renderizar o arquivo final
- Edite `src/VitaViewPromo.tsx` para ajustar durações
- Cores e textos estão inline nos componentes (fácil de customizar)

## ⚡ Renderização Rápida vs. Qualidade

### Preview rápido (baixa qualidade)
```bash
npx remotion render VitaViewPromo output.mp4 --quality=50
```

### Qualidade máxima
```bash
npx remotion render VitaViewPromo output.mp4 --quality=100
```

## 🎯 Próximos Passos

1. Visualize o vídeo no Remotion Studio
2. Ajuste se necessário (cores, textos, durações)
3. Renderize a versão final
4. Use em landing pages, redes sociais, apresentações!
