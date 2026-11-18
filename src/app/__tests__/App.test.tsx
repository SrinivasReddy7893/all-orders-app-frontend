import React from 'react';
import { Text } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';

import App from '../App';

jest.useFakeTimers();

const allText = (tree: ReactTestRenderer.ReactTestRenderer) =>
  tree.root
    .findAllByType(Text)
    .map(node => [node.props.children].flat().join(''))
    .join(' | ');

test('opens on the welcome screen with one way in', async () => {
  let tree!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    tree = ReactTestRenderer.create(<App />);
  });
  await ReactTestRenderer.act(() => jest.advanceTimersByTime(1000));

  const text = allText(tree);
  expect(text).toContain('All Orders');
  expect(text).toContain('Get started');
  expect(text).toContain('Privacy Policy');

  ReactTestRenderer.act(() => tree.unmount());
});
