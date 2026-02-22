
import React from 'react';
import { renderToString } from 'react-dom/server';
import Component from '../client/src/pages/landing-page.tsx';

const html = renderToString(React.createElement(Component));
process.stdout.write(html);
