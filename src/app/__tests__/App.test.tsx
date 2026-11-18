import React from 'react';
import { Text } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';

import App from '../App';

test('renders the welcome message', async () => {
  let tree!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    tree = ReactTestRenderer.create(<App />);
  });
  const text = tree.root.findByType(Text).props.children;
  expect([text].flat().join('')).toBe('Welcome to All Orders App');
});
