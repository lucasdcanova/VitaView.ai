# VitaView.ai - Vídeo Promocional

Vídeo de 30 segundos apresentando o VitaView.ai com elementos 3D e animações fluidas.

## 🎬 Características

- **Duração**: ~22 segundos (650 frames a 30fps)
- **Resolução**: 1920x1080 (Full HD)
- **Elementos 3D**: Logo rotativo, ícones flutuantes, partículas
- **Design**: Monochrome (preto, cinza, branco) alinhado com o site
- **Transições**: Slides e fades suaves entre cenas

## 📦 Estrutura

```
video/
├── src/
│   ├── components/          # Componentes 3D reutilizáveis
│   │   ├── Logo3D.tsx       # Logo 3D com animação
│   │   ├── FloatingParticles.tsx  # Partículas de fundo
│   │   └── FeatureIcon3D.tsx      # Ícones 3D das features
│   ├── scenes/              # Cenas do vídeo
│   │   ├── IntroScene.tsx   # Intro com logo e título
│   │   ├── FeatureScene.tsx # Template de feature
│   │   └── OutroScene.tsx   # CTA final
│   ├── VitaViewPromo.tsx    # Composição principal
│   ├── Root.tsx             # Registro da composição
│   └── index.ts             # Entry point
├── package.json
├── tsconfig.json
└── remotion.config.ts
```

## 🚀 Instalação

### Opção 1: Script automático

```bash
cd video
chmod +x install.sh
./install.sh
```

### Opção 2: Manual

```bash
cd video
npm install
```

## 🎥 Uso

### Visualizar no Remotion Studio

```bash
npm start
```

Isso abrirá o Remotion Studio no navegador onde você pode:
- Pré-visualizar o vídeo em tempo real
- Ajustar propriedades
- Testar diferentes configurações

### Renderizar o vídeo

```bash
npm run build
```

O vídeo será salvo em `video/output.mp4`.

### Renderizar com configurações personalizadas

```bash
# Renderizar em 60fps
npx remotion render VitaViewPromo output-60fps.mp4 --fps=60

# Renderizar em 4K
npx remotion render VitaViewPromo output-4k.mp4 --width=3840 --height=2160

# Renderizar com codec específico
npx remotion render VitaViewPromo output.mp4 --codec=h264-mkv
```

## 🎨 Cenas

### 1. Intro (3 segundos)
- Logo 3D rotativo com cruz médica
- Título "VitaView.ai"
- Subtítulo "Prontuário Inteligente com IA"
- Partículas flutuantes ao fundo

### 2. Feature: Anamnese com IA (5 segundos)
- Ícone 3D de microfone
- Destaca transcrição de voz e estruturação automática
- 3 highlights principais

### 3. Feature: Prescrição Digital (5 segundos)
- Ícone 3D de documento/prescrição
- Destaca prescrição ilimitada e alertas
- 3 highlights principais

### 4. Feature: Análise de Exames (5 segundos)
- Ícone 3D de tubo de ensaio
- Destaca análise com IA e gráficos
- 3 highlights principais

### 5. Feature: Agenda Inteligente (5 segundos)
- Ícone 3D de calendário
- Destaca triagem e agendamento
- 3 highlights principais

### 6. Outro (2 segundos)
- Logo pequeno no topo
- CTA "Comece Gratuitamente"
- Botão pulsante "Experimente Agora"
- URL "vitaview.ai"

## ⚙️ Personalização

### Ajustar durações

Edite `src/VitaViewPromo.tsx`:

```tsx
const INTRO_DURATION = 90; // 3s
const FEATURE_DURATION = 150; // 5s cada
const OUTRO_DURATION = 60; // 2s
const TRANSITION_DURATION = 20; // 0.67s cada
```

### Mudar cores

Todas as cores estão inline nos componentes:
- `#212121` - Preto principal
- `#424242` - Cinza escuro
- `#E0E0E0` - Cinza claro
- `#FFFFFF` - Branco

### Adicionar/remover features

Edite `src/VitaViewPromo.tsx` e adicione/remova `<TransitionSeries.Sequence>` blocks.

### Customizar elementos 3D

Edite os componentes em `src/components/`:
- `Logo3D.tsx` - Forma e animação do logo
- `FloatingParticles.tsx` - Quantidade e comportamento das partículas
- `FeatureIcon3D.tsx` - Formas dos ícones 3D

## 🔧 Troubleshooting

### Erro: "Cannot find module '@remotion/three'"

```bash
npm install
```

### Vídeo não renderiza / tela preta

Certifique-se de que:
1. Todas as animações usam `useCurrentFrame()` (não CSS)
2. `<ThreeCanvas>` tem `width` e `height`
3. Não há `useFrame()` do React Three Fiber

### Performance lenta no preview

- Reduza `count` em `<FloatingParticles>`
- Simplifique geometrias 3D (menos segmentos)
- Use `npm run build` para renderizar offline

## 📝 Notas Técnicas

- **Todas as animações** são baseadas em `useCurrentFrame()` para renderização determinística
- **CSS animations/transitions são proibidos** no Remotion
- **TransitionSeries** sobrepõe cenas, então a duração total é menor que a soma das cenas
- **Three.js** é renderizado via `@remotion/three` para compatibilidade

## 📄 Licença

Parte do projeto VitaView.ai
