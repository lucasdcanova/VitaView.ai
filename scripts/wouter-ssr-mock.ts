/**
 * Mock do Wouter para SSR
 * Renderiza Link como <a> e fornece hooks básicos.
 */
import React from 'react';

export function Link({ href, to, children, className, ...props }: any) {
  const targetHref = href || to || '#';
  return React.createElement('a', { href: targetHref, className, ...props }, children);
}

export function useLocation(): [string, (to: string) => void] {
  return ['/', () => {}];
}

export function useRoute(pattern: string): [boolean, any] {
  return [false, {}];
}

export function Route({ path, component: Component, children }: any) {
  return null;
}

export function Switch({ children }: any) {
  return React.createElement(React.Fragment, null, children);
}

export function Redirect({ to }: any) {
  return null;
}

export default { Link, useLocation, useRoute, Route, Switch, Redirect };
