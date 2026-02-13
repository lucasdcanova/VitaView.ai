/**
 * Mock do Framer Motion para SSR (Server-Side Rendering)
 *
 * Substitui motion.X por elementos HTML nativos e remove props de animação.
 * Usado durante o pre-render para gerar HTML estático sem dependências do Framer Motion.
 */
import React from 'react';

// Props de animação do Framer Motion que devem ser removidas
const MOTION_PROPS = new Set([
  'initial', 'animate', 'exit', 'transition', 'variants',
  'whileHover', 'whileTap', 'whileInView', 'whileFocus', 'whileDrag',
  'viewport', 'layout', 'layoutId', 'layoutDependency',
  'drag', 'dragConstraints', 'dragControls', 'dragElastic',
  'dragMomentum', 'dragPropagation', 'dragSnapToOrigin',
  'dragTransition', 'onDrag', 'onDragStart', 'onDragEnd',
  'onAnimationStart', 'onAnimationComplete', 'onUpdate',
  'custom', 'inherit', 'mode',
]);

function filterMotionProps(props: Record<string, any>): Record<string, any> {
  const filtered: Record<string, any> = {};
  for (const [key, value] of Object.entries(props)) {
    if (!MOTION_PROPS.has(key)) {
      filtered[key] = value;
    }
  }
  return filtered;
}

// Criar um proxy que mapeia motion.X para createElement(X) sem props de animação
function createMotionComponent(element: string) {
  return React.forwardRef((props: any, ref: any) => {
    const cleanProps = filterMotionProps(props);
    // Adicionar classe data-animate para o JS vanilla detectar elementos animáveis
    const className = cleanProps.className || '';
    // Se tinha whileInView, marcar para animação por scroll
    if (props.whileInView) {
      cleanProps.className = `${className} animate-on-scroll`.trim();
    }
    return React.createElement(element, { ...cleanProps, ref });
  });
}

// Proxy handler para motion.div, motion.button, etc.
const motionHandler: ProxyHandler<any> = {
  get(_target, prop: string) {
    return createMotionComponent(prop);
  }
};

export const motion = new Proxy({}, motionHandler);

// AnimatePresence simplesmente renderiza os children
export function AnimatePresence({ children }: { children?: React.ReactNode; mode?: string }) {
  return React.createElement(React.Fragment, null, children);
}

// useAnimation mock
export function useAnimation() {
  return {
    start: () => Promise.resolve(),
    stop: () => {},
    set: () => {},
  };
}

// useInView mock
export function useInView() {
  return [null, true];
}

// useMotionValue mock
export function useMotionValue(initial: number) {
  return { get: () => initial, set: () => {}, onChange: () => () => {} };
}

// useTransform mock
export function useTransform(value: any, from: any, to: any) {
  return useMotionValue(to?.[0] ?? 0);
}

export default { motion, AnimatePresence, useAnimation, useInView, useMotionValue, useTransform };
