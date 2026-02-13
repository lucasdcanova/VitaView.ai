# VitaView.ai - Vídeo Promocional v2.0

Vídeo de ~22 segundos usando **elementos reais do site** VitaView.ai.

## ✨ O que mudou (v2.0)

### Removido ❌
- ~~Elementos 3D com Three.js~~ (causavam erro de WebGL em headless)
- ~~Logo 3D customizado~~
- ~~Partículas 3D flutuantes~~

### Adicionado ✅
- **Logo oficial** VitaView (dois V's entrelaçados do SVG do site)
- **Cores exatas** do site (#212121, #9E9E9E, #757575, #E0E0E0)
- **Textos reais** da landing page
  - "O Prontuário que pensa com você"
  - "Concentre-se no paciente enquanto nossa IA cuida da burocracia"
- **Tipografia** "VitaView" + "AI" em sobrescrito cinza (como no site)
- **Partículas 2D simples** (sem WebGL)
- **Ícones 2D** minimalistas (SVG) para features
- **Design monochrome** consistente com o site

## 🎬 Características

- **Duração**: ~22 segundos (650 frames a 30fps)
- **Resolução**: 1920x1080 (Full HD)
- **Sem dependências 3D** - Renderiza em qualquer ambiente
- **Design fiel** ao site oficial

## 📦 Estrutura

```
video/
├── src/
│   ├── components/
│   │   ├── VitaViewLogo.tsx       # Logo SVG oficial (2 V's)
│   │   ├── SimpleParticles.tsx    # Partículas 2D
│   │   └── FeatureIcons.tsx       # Ícones SVG (mic, doc, lab, calendar, AI)
│   ├── scenes/
│   │   ├── IntroScene.tsx         # Logo + headline + subtitle
│   │   ├── FeatureScene.tsx       # Template de feature
│   │   └── OutroScene.tsx         # CTA final
│   ├── VitaViewPromo.tsx          # Composição principal
│   ├── Root.tsx                   # Registro
│   └── index.ts
├── package.json                   # SEM Three.js
└── README.md
```

## 🚀 Instalação

```bash
cd video
npm install
```

## 🎥 Uso

### Visualizar no Remotion Studio

```bash
npm start
```

Abre em http://localhost:3000

### Renderizar o vídeo

```bash
npm run build
```

Cria `output.mp4` na pasta video/

## 🎨 Cenas

### 1. Intro (3s)
- Logo SVG oficial VitaView (2 V's entrelaçados)
- "VitaView" com "AI" em sobrescrito cinza
- Headline: "O Prontuário que pensa com você"
- Subtitle: "Concentre-se no paciente enquanto nossa IA cuida da burocracia"
- Partículas 2D sutis

### 2. Feature: Anamnese com IA (5s)
- Ícone SVG de microfone
- Título, descrição, 3 highlights
- Layout 2 colunas

### 3. Feature: Prescrição Digital (5s)
- Ícone SVG de documento Rx
- Título, descrição, 3 highlights

### 4. Feature: Análise de Exames (5s)
- Ícone SVG de tubo de ensaio
- Título, descrição, 3 highlights

### 5. Feature: Agenda Inteligente (5s)
- Ícone SVG de calendário
- Título, descrição, 3 highlights

### 6. Outro (2s)
- Logo pequeno
- CTA "Comece Gratuitamente"
- Botão pulsante "Experimente Agora"
- URL "vitaview.ai"
- Tagline: "O prontuário que pensa com você"

## 🎨 Cores Oficiais

- `#212121` - Preto principal
- `#9E9E9E` - Cinza para "AI" e textos secundários
- `#757575` - Cinza para subtítulos
- `#E0E0E0` - Cinza claro para partículas e detalhes
- `#424242` - Cinza escuro para elementos de UI

## 📝 Customização

### Mudar durações

Edite `src/VitaViewPromo.tsx`:

```tsx
const INTRO_DURATION = 90; // 3s
const FEATURE_DURATION = 150; // 5s
const OUTRO_DURATION = 60; // 2s
```

### Mudar cores

Busque e substitua nos componentes:
- `#212121` → sua cor principal
- `#9E9E9E` → sua cor secundária

### Mudar textos

Edite diretamente nos componentes de cena.

## ✅ Vantagens vs. v1.0

1. **Renderiza em qualquer ambiente** (sem necessidade de GPU/WebGL)
2. **Design fiel ao site** (cores, tipografia, logo oficial)
3. **Mais leve** (sem dependências Three.js, @react-three/fiber, @react-three/drei)
4. **Mais fácil de customizar** (SVG inline em vez de geometrias 3D)
5. **Performance melhor** (2D é mais rápido que 3D)

## 🔧 Troubleshooting

### Erro "Module not found @remotion/three"

✅ Resolvido! Three.js foi removido em v2.0.

### Vídeo em branco

Verifique se `npm install` foi executado.

### Performance lenta

Reduza `count` em `<SimpleParticles count={40} />`.

## 📄 Licença

Parte do projeto VitaView.ai
