# VitaView AI - Design System

> Referencia completa da linguagem visual do VitaView.ai.
> Estetica minimalista monocromatica com foco em legibilidade, acessibilidade e performance mobile.

---

## 1. Paleta de Cores

### 1.1 Cores Primarias (Light Mode)

| Token               | Hex       | HSL             | Uso                                       |
|----------------------|-----------|-----------------|-------------------------------------------|
| `--charcoal-gray`   | `#212121` | 0 0% 13%        | Texto principal, botoes, icones            |
| `--medium-gray`     | `#9E9E9E` | 0 0% 62%        | Texto secundario, placeholders             |
| `--light-gray`      | `#E0E0E0` | 0 0% 88%        | Bordas, backgrounds de hover, dividers     |
| `--pure-white`      | `#FFFFFF` | 0 0% 100%       | Cards, superficies elevadas                |
| `--background-gray` | `#F4F4F4` | 0 0% 96%        | Background global da aplicacao             |
| `--alert-red`       | `#D32F2F` | 0 72% 51%       | Erros, acoes destrutivas, alertas          |

### 1.2 Superficies

| Token          | Light       | Dark        | Uso                          |
|----------------|-------------|-------------|------------------------------|
| `--surface-0`  | `#F4F4F4`   | `#0F1115`   | Background da app            |
| `--surface-1`  | `#FFFFFF`   | `#171A20`   | Cards, paineis               |
| `--surface-2`  | `#F7F7F7`   | `#1D2129`   | Background secundario        |
| `--surface-3`  | `#EEEEEE`   | `#2A3039`   | Background terciario         |

### 1.3 Conteudo (Hierarquia Textual)

| Token              | Light     | Dark      | Uso                     |
|--------------------|-----------|-----------|-------------------------|
| `--content-strong` | `#212121` | `#EEF2F8` | Titulos, texto enfatico |
| `--content-default`| `#424242` | `#D8DDE8` | Texto de corpo          |
| `--content-muted`  | `#757575` | `#AAB3C3` | Texto auxiliar          |
| `--content-subtle` | `#9E9E9E` | `#8D97A9` | Labels terciarios       |

### 1.4 Bordas (Strokes)

| Token             | Light     | Dark      | Uso                    |
|-------------------|-----------|-----------|------------------------|
| `--stroke-soft`   | `#ECECEC` | `#262C35` | Dividers sutis         |
| `--stroke-default`| `#E0E0E0` | `#353D49` | Bordas de componentes  |
| `--stroke-strong` | `#C9C9C9` | `#4A5564` | Bordas com enfase      |

### 1.5 Escala de Cinzas (Gray Scale)

```
50:  #F4F4F4   (background-gray)
100: #E0E0E0   (light-gray)
200: #BDBDBD
300: #9E9E9E   (medium-gray)
400: #757575
500: #616161
600: #424242
700: #212121   (charcoal-gray)
800: #1A1A1A
900: #121212
950: #0A0A0A
```

### 1.6 Chart Colors (Monocromatico)

| Token      | Hex       |
|------------|-----------|
| `chart-1`  | `#212121` |
| `chart-2`  | `#424242` |
| `chart-3`  | `#616161` |
| `chart-4`  | `#9E9E9E` |
| `chart-5`  | `#BDBDBD` |

### 1.7 Variaveis CSS do Sistema

```css
--background:          0 0% 96%      /* #F4F4F4 */
--foreground:          0 0% 13%      /* #212121 */
--card:                0 0% 100%     /* #FFFFFF */
--card-foreground:     0 0% 13%      /* #212121 */
--primary:             0 0% 13%      /* #212121 */
--primary-foreground:  0 0% 100%     /* #FFFFFF */
--secondary:           0 0% 62%      /* #9E9E9E */
--muted:               0 0% 88%      /* #E0E0E0 */
--muted-foreground:    0 0% 62%      /* #9E9E9E */
--accent:              0 0% 88%      /* #E0E0E0 */
--destructive:         0 72% 51%     /* #D32F2F */
--border:              0 0% 88%      /* #E0E0E0 */
--input:               0 0% 88%      /* #E0E0E0 */
--ring:                0 0% 13%      /* #212121 */
--radius:              0.5rem        /* 8px */
```

---

## 2. Dark Mode

### 2.1 Implementacao

- Ativado via `<html class="dark">`
- Configuracao Tailwind: `darkMode: ["class"]`
- Persistido em `localStorage` (key: `vitaview-theme`) e cookie
- Toggle disponivel no header

### 2.2 Variaveis Override

```css
.dark {
  --background:          220 15% 8%    /* #0F1115 */
  --foreground:          220 20% 94%   /* #F2F4F8 */
  --card:                220 14% 11%   /* #171A20 */
  --primary:             220 20% 92%   /* texto claro */
  --primary-foreground:  220 15% 10%   /* fundo escuro */
  --secondary:           220 14% 18%
  --muted:               220 14% 16%
  --muted-foreground:    220 12% 70%
  --border:              220 12% 22%
  --ring:                220 16% 78%
}
```

### 2.3 Background Gradient (Dark)

```css
background-image:
  radial-gradient(1200px circle at 4% -20%, rgba(149, 163, 188, 0.18), transparent 48%),
  radial-gradient(900px circle at 100% 0%, rgba(102, 112, 132, 0.2), transparent 46%),
  linear-gradient(160deg, rgba(20, 24, 31, 0.9) 0%, rgba(14, 17, 23, 0.96) 100%);
```

### 2.4 Mapeamento Legacy (dark mode bridge)

Classes utilitarias do Tailwind sao remapeadas automaticamente:

| Classe Light         | Valor Dark         |
|----------------------|--------------------|
| `.bg-white`          | `--surface-1`      |
| `.bg-gray-50`        | `--surface-0`      |
| `.bg-gray-100`       | `--surface-2`      |
| `.bg-gray-200`       | `--surface-3`      |
| `.text-gray-900`     | `--content-strong`  |
| `.text-gray-700`     | `--content-default` |
| `.text-gray-500`     | `--content-subtle`  |
| `.border-gray-200`   | `--stroke-default`  |

---

## 3. Tipografia

### 3.1 Fontes

| Papel     | Familia                              | Pesos       | Uso                            |
|-----------|--------------------------------------|-------------|--------------------------------|
| Heading   | `Montserrat`, system-ui, sans-serif  | 400-700     | Titulos, labels, botoes        |
| Body      | `Open Sans`, system-ui, sans-serif   | 400-600     | Corpo, inputs, paragrafos      |

```css
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&family=Open+Sans:wght@400;500;600&display=swap');
```

### 3.2 Escala Tipografica

| Elemento | Mobile          | Desktop (md+)   | Tracking     | Weight |
|----------|-----------------|------------------|--------------|--------|
| h1       | `text-4xl` 36px | `text-5xl` 48px  | `tight`      | 700    |
| h2       | `text-2xl` 24px | `text-3xl` 30px  | `tight`      | 700    |
| h3       | `text-xl` 20px  | `text-2xl` 24px  | normal       | 700    |
| h4       | `text-lg` 18px  | `text-xl` 20px   | normal       | 700    |
| body     | 14px            | 16px             | normal       | 400    |

### 3.3 Base Font Size (Responsivo)

```css
html { font-size: 14px; }                     /* Mobile */
@media (min-width: 640px) { font-size: 16px; } /* Desktop */
```

### 3.4 iOS Safari: Prevencao de Zoom

```css
@supports (-webkit-touch-callout: none) {
  @media (pointer: coarse) {
    input, textarea, select { font-size: 16px !important; }
  }
}
```

---

## 4. Espacamento

### 4.1 Padroes por Contexto

| Contexto         | Mobile        | Tablet (sm)   | Desktop (lg)  |
|------------------|---------------|---------------|---------------|
| Secao da pagina  | `px-4 py-6`   | `px-6 py-8`   | `px-8 py-12`  |
| Card interno     | `p-4`         | `p-6`         | `p-6`         |
| Grid gap         | `gap-4`       | `gap-6`       | `gap-6`       |
| Form field       | `space-y-2`   | `space-y-2`   | `space-y-2`   |
| Field margin     | `mb-4`        | `mb-4`        | `mb-4`        |

### 4.2 Safe Area (iOS / Capacitor)

```css
--safe-area-top:    env(safe-area-inset-top, 0px);
--safe-area-right:  env(safe-area-inset-right, 0px);
--safe-area-bottom: env(safe-area-inset-bottom, 0px);
--safe-area-left:   env(safe-area-inset-left, 0px);
```

Classe utilitaria: `.safe-area-inset` aplica padding em todas as direcoes.

---

## 5. Border Radius

| Token | Valor                         | Pixels | Uso                           |
|-------|-------------------------------|--------|-------------------------------|
| `lg`  | `var(--radius)` = `0.5rem`    | 8px    | Botoes, cards, inputs         |
| `md`  | `calc(var(--radius) - 2px)`   | 6px    | Tooltips, menus               |
| `sm`  | `calc(var(--radius) - 4px)`   | 4px    | Badges internos               |
| `full`| `9999px`                      | pill   | Badges, avatares              |

---

## 6. Sombras

| Contexto          | Classe         | Uso                          |
|-------------------|----------------|------------------------------|
| Cards             | `shadow-sm`    | Elevacao sutil               |
| Toast             | `shadow-md`    | Notificacoes                 |
| Drawers / Modals  | `shadow-xl`    | Paineis sobrepostos          |
| Dialog            | `shadow-lg`    | Modais                       |
| Mobile nav panel  | `shadow-xl`    | Menu lateral mobile          |

---

## 7. Z-Index Scale

| Valor       | Uso                                      |
|-------------|------------------------------------------|
| `z-1`       | Elementos interativos basicos            |
| `z-10`      | Elementos interativos elevados           |
| `z-20`      | Headers desktop (patient-view)           |
| `z-30`      | PatientHeader sticky                     |
| `z-40`      | MobileHeader fixo, FloatingPatientBar    |
| `z-50`      | Dialog overlay, sheet, drawer, tooltips  |
| `z-[100]`   | Toast viewport                           |
| `z-[9999]`  | Skip link acessibilidade                 |
| `z-[10000]` | Botao menu mobile                        |

---

## 8. Componentes UI

### 8.1 Biblioteca Completa (59 componentes)

Localizados em `client/src/components/ui/`:

**Layout & Containers:**
accordion, aspect-ratio, card, carousel, collapsible, drawer, resizable, scroll-area, separator, sheet, sidebar, tabs

**Overlays & Feedback:**
alert, alert-dialog, dialog, hover-card, popover, toast, toaster, tooltip

**Navigation:**
breadcrumb, command, context-menu, dropdown-menu, menubar, navigation-menu, pagination

**Forms:**
button, calendar, checkbox, file-upload, form, input, input-otp, label, radio-group, select, slider, switch, textarea, toggle, toggle-group

**Data Display:**
avatar, badge, chart, clinical-rich-text, lazy-image, lazy-list, logo, progress, quick-summary, skeleton, table

**Misc / Integracoes:**
brand-loader, error-boundary, feature-gate, ios-storekit-purchase, notification-dropdown, stripe-payment

### 8.2 Button

**Variantes:**

| Variante      | Background           | Texto                  | Borda                  |
|---------------|----------------------|------------------------|------------------------|
| `default`     | `--primary` #212121  | `--primary-fg` #FFFFFF | nenhuma                |
| `destructive` | `--destructive`      | branco                 | nenhuma                |
| `outline`     | transparente         | `--foreground`         | `--input` #E0E0E0     |
| `secondary`   | `--secondary`        | `--secondary-fg`       | nenhuma                |
| `ghost`       | transparente         | `--foreground`         | nenhuma                |
| `link`        | transparente         | `--primary`            | nenhuma (underline)    |

**Tamanhos:**

| Tamanho   | Height | Padding    | Radius    |
|-----------|--------|------------|-----------|
| `default` | h-10   | px-4 py-2  | rounded-lg|
| `sm`      | h-9    | px-3       | rounded-lg|
| `lg`      | h-11   | px-8       | rounded-lg|
| `icon`    | h-10   | w-10       | rounded-lg|

**Touch target mobile:** min-height 44px.

### 8.3 Card

```
Background: hsl(var(--card))        /* branco / dark surface */
Borda:      1px solid hsl(var(--border))
Radius:     rounded-lg (8px)
Sombra:     shadow-sm

Subcomponentes:
  CardHeader:      flex flex-col space-y-1.5 p-6
  CardTitle:       text-xl font-bold font-heading
  CardDescription: text-sm text-muted-foreground font-body
  CardContent:     p-6 pt-0
  CardFooter:      flex items-center p-6 pt-0
```

### 8.4 Badge

| Variante      | Background          | Texto                |
|---------------|---------------------|----------------------|
| `default`     | `--primary`         | `--primary-fg`       |
| `secondary`   | `--secondary`       | `--secondary-fg`     |
| `destructive` | `--destructive`     | `--destructive-fg`   |
| `outline`     | transparente        | `--foreground`       |
| `success`     | `#424242`           | branco               |
| `muted`       | `--medium-gray`     | branco               |

Padding: `px-2.5 py-0.5`, Font: `text-xs font-bold`, Radius: `rounded-full`.

### 8.5 Input

```
Height:      h-10 (40px)
Padding:     px-3 py-2
Borda:       1px solid hsl(var(--input))
Radius:      rounded-lg
Background:  hsl(var(--background))
Placeholder: hsl(var(--muted-foreground))
Focus:       ring-2 ring-ring ring-offset-2
Disabled:    opacity-50 cursor-not-allowed
Font:        Open Sans, 16px (iOS)
```

### 8.6 Toast

| Variante      | Background    | Texto         | Borda              |
|---------------|---------------|---------------|--------------------|
| `default`     | `--card`      | `--foreground`| `--border`         |
| `destructive` | `--destructive`| branco       | `--destructive`    |
| `success`     | `--charcoal`  | branco        | `--charcoal`       |

Posicao: top (mobile, safe-area-inset), bottom-right (desktop).
Z-index: `z-[100]`. Max-width: `md:max-w-[420px]`.

### 8.7 Alert

| Variante      | Borda             | Icone cor        |
|---------------|-------------------|------------------|
| `default`     | `--border`        | `--foreground`   |
| `destructive` | `--destructive`   | `--destructive`  |
| `warning`     | amber-200         | amber-600        |

### 8.8 Logo

**Variantes:**
- `icon`: PNG transparente, ideal para headers/sidebars
- `full`: PNG com texto, ideal para hero/login
- `legacy`: SVG dinamico com dois Vs entrelaçados

**Tamanhos:**

| Size | Icon       | Full   | Text      |
|------|------------|--------|-----------|
| `sm` | h-8 w-8   | h-10   | text-lg   |
| `md` | h-12 w-12 | h-14   | text-xl   |
| `lg` | h-16 w-16 | h-20   | text-2xl  |
| `xl` | h-20 w-20 | h-28   | text-3xl  |
| `2xl`| h-28 w-28 | h-40   | —         |

Dark mode: `dark:invert` (icon), `dark:brightness-0 dark:invert dark:mix-blend-screen` (full).

### 8.9 Brand Loader

SVG animado com circulos concentricos:
- Stroke width: 1.4px e 1.9px
- Animacao: rotacao 2.2s
- Opacity fundo: 18%
- Logo central: 68% h/w

---

## 9. Layout

### 9.1 Breakpoints (Tailwind defaults)

| Token | Largura  |
|-------|----------|
| `sm`  | 640px    |
| `md`  | 768px    |
| `lg`  | 1024px   |
| `xl`  | 1280px   |
| `2xl` | 1536px   |

### 9.2 Sidebar

| Propriedade       | Valor                             |
|-------------------|-----------------------------------|
| Width (desktop)   | `16rem` (256px)                   |
| Width (mobile)    | `18rem` (288px)                   |
| Width (collapsed) | `3rem` (48px)                     |
| Toggle shortcut   | `Ctrl/Cmd + B`                    |
| Estado persistido | Cookie `vitaview-sidebar_state`   |
| Cookie max-age    | 7 dias                            |

### 9.3 Mobile Header

```
Height:     calc(env(safe-area-inset-top) + 3.5rem)
Position:   fixed top-0 inset-x-0
Z-index:    z-40
Visibility: md:hidden (apenas mobile)
Background: gradiente branco com backdrop-blur-xl
Spacer:     div aria-hidden com mesma altura
```

### 9.4 Mobile Navigation (Bottom)

```
Height:     calc(4rem + env(safe-area-inset-bottom))
Position:   fixed bottom-0 inset-x-0
Z-index:    z-40
Background: pureWhite/95 backdrop-blur-md
Border:     border-t lightGray
Padding:    pb-[env(safe-area-inset-bottom)]
```

### 9.5 Responsive Grid

```css
.responsive-grid {
  grid-template-columns: 1fr;           /* Mobile */
  gap: 1rem;
}
@media (min-width: 640px) {
  grid-template-columns: repeat(2, 1fr); /* Tablet */
  gap: 1.5rem;
}
@media (min-width: 1024px) {
  grid-template-columns: repeat(3, 1fr); /* Desktop */
}
```

### 9.6 Viewport Containment

```css
#root {
  box-sizing: border-box;
  overflow-x: hidden;
  max-width: 100vw;
  width: 100%;
}
#root > * { max-width: 100vw; overflow-x: hidden; }
main { min-width: 0; }  /* flex shrink fix */
```

---

## 10. Animacoes & Transicoes

### 10.1 Transicao Global

```css
body {
  transition: background-color 220ms ease, color 220ms ease;
}
```

### 10.2 Keyframes Customizados

```css
slideUp:  translateY(100%) → translateY(0), opacity 0→1, 0.3s ease-out
fadeIn:   opacity 0→1, 0.2s ease-out
accordion-down:  height 0 → auto, 0.2s ease-out
accordion-up:    height auto → 0, 0.2s ease-out
```

### 10.3 Landing Page Motion

```css
--landing-ease: cubic-bezier(0.22, 1, 0.36, 1);
--landing-fast: 180ms;
--landing-base: 280ms;

/* Hover scale reduzido para 1.03 (nao 1.05/1.10) */
/* Mobile (pointer: coarse): sem transform */
```

### 10.4 Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 11. Acessibilidade

### 11.1 Focus

```css
:focus-visible {
  outline: 3px solid var(--charcoal-gray);
  outline-offset: 2px;
}
/* Ring padrao componentes: ring-2 ring-ring ring-offset-2 */
```

### 11.2 Alto Contraste

```css
@media (prefers-contrast: high) {
  --charcoal-gray: #000000;
  --medium-gray:   #555555;
  --light-gray:    #CCCCCC;
  --border:        0 0% 40%;
  /* Botoes recebem border: 2px solid currentColor */
}
```

### 11.3 Touch Optimization

```css
button, [role="button"], a {
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
}
.tap-target { min-height: 44px; min-width: 44px; }
```

### 11.4 Skip Link

```css
.skip-link {
  position: absolute; top: -40px; left: 0;
  /* Visivel apenas com :focus */
}
```

---

## 12. Icones

**Biblioteca:** `lucide-react` v0.453.0

Todos os icones sao de linha (outline), em `--charcoal-gray` por padrao. Tamanhos comuns:
- `h-4 w-4` — dentro de botoes, badges
- `h-5 w-5` — navegacao, headers
- `h-6 w-6` — destaque em headers de pagina
- `h-8 w-8` — estados vazios, loading

---

## 13. Padroes de Pagina

### 13.1 PatientHeader (Sticky)

```
Position:   sticky top-0
Z-index:    z-30
Background: bg-card (opaco, sem blur)
Borda:      border-b (quando fullWidth)
Padding:    p-4 md:p-6 (padrao)
            px-4 pt-4 pb-2 md:px-6 md:pt-6 md:pb-3 (compact)
```

Props: `title`, `description`, `patient`, `showTitleAsMain`, `fullWidth`, `compact`, `safeAreaTop`, `icon`, `children`.

### 13.2 Estrutura de Pagina Padrao

```tsx
<div className="flex h-full flex-col overflow-hidden bg-background">
  <main className="flex-1 overflow-y-auto bg-background">
    <PatientHeader title="..." showTitleAsMain fullWidth />
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      {/* conteudo */}
    </div>
  </main>
</div>
```

### 13.3 Agenda Calendar Hero

```css
/* Light */
background:
  radial-gradient(circle at 12% 10%, rgba(59, 130, 246, 0.08), transparent 45%),
  radial-gradient(circle at 88% 18%, rgba(245, 158, 11, 0.07), transparent 40%),
  linear-gradient(145deg, #f8fafc 0%, #eef2f7 52%, #e7ecf4 100%);

/* Dark */
background: linear-gradient(145deg, #161b24 0%, #1d2330 52%, #252e40 100%);
```

---

## 14. Capacitor / iOS Config

```typescript
ios: {
  zoomEnabled: false,
  contentInset: 'never',      // web page gerencia safe areas
  scrollEnabled: true,
  backgroundColor: '#0F1115', // splash screen dark
}
```

Viewport meta:
```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, shrink-to-fit=no" />
```

PWA theme-color: `#FFFFFF` (light) / `#171A20` (dark) — definido via meta tag dinamica.

---

## 15. Dependencias de Design

| Pacote                     | Versao   | Uso                                     |
|----------------------------|----------|-----------------------------------------|
| `tailwindcss`              | latest   | Framework de utilidades CSS              |
| `tailwindcss-animate`      | plugin   | Animacoes declarativas                   |
| `@tailwindcss/typography`  | plugin   | Estilizacao de conteudo rich text        |
| `@radix-ui/*`              | latest   | Primitivas de UI acessiveis              |
| `lucide-react`             | 0.453.0  | Icones de linha                          |
| `framer-motion`            | latest   | Animacoes declarativas (landing page)    |
| `recharts`                 | latest   | Graficos e visualizacao de dados         |
| `react-hook-form`          | latest   | Gerenciamento de formularios             |
| `zod`                      | latest   | Validacao de schemas                     |
| `class-variance-authority` | latest   | Variantes de componentes                 |
| `clsx` + `tailwind-merge`  | latest   | Utilitario `cn()` para classes           |
| `date-fns` + `ptBR`        | latest   | Formatacao de datas em portugues         |

---

## 16. Convencoes

### Nomenclatura de Cores
- Usar tokens semanticos (`--foreground`, `--primary`) em vez de valores diretos
- Classes Tailwind com prefixo de cor: `text-foreground`, `bg-card`, `border-border`
- Cor direta apenas para tokens VitaView: `text-charcoal`, `bg-pureWhite`, `border-lightGray`

### Fontes
- Titulos: sempre `font-heading` (Montserrat Bold)
- Corpo: sempre `font-body` (Open Sans Regular)
- Labels de formulario: `font-heading font-bold text-sm`

### Responsividade
- Mobile-first: estilos base para mobile, override com `sm:`, `md:`, `lg:`
- Touch targets: minimo 44x44px em elementos interativos
- Inputs: sempre 16px no iOS para evitar zoom

### Dark Mode
- Usar classes semanticas do Tailwind (`bg-card`, `text-foreground`, `border-border`)
- Evitar cores hardcoded — preferir variaveis CSS
- Testar ambos os modos ao criar componentes

### Performance
- `will-change: transform` em elementos animados fixos
- `transform: translateZ(0)` para GPU acceleration
- `overflow-x: hidden` no root para evitar scroll horizontal
