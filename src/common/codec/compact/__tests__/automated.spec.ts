import {compactMessages} from './compact-messages';
import {encode, decode} from '..';

for (const [name, message] of Object.entries(compactMessages)) {
  test(name, () => {
    const [decoded] = decode([message]);
    const encoded = encode([decoded])[0];
    expect(encoded).toEqual(message);
  });
}
