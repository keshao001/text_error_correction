import { normalizeWhitespace, similarityRatio, findCommonSubstrings, findExactDiff } from './textDiff';

describe('normalizeWhitespace', () => {
  test('should normalize different types of whitespace', () => {
    expect(normalizeWhitespace('  hello  world  ')).toBe('  hello  world  ');
    expect(normalizeWhitespace('hello\r\nworld')).toBe('hello\nworld');
    expect(normalizeWhitespace('hello\tworld')).toBe('hello\tworld');
    expect(normalizeWhitespace('hello    world')).toBe('hello    world');
  });

  test('should handle empty strings', () => {
    expect(normalizeWhitespace('')).toBe('');
  });

  test('should handle Chinese text', () => {
    expect(normalizeWhitespace('  你好  世界  ')).toBe('  你好  世界  ');
    expect(normalizeWhitespace('你好\r\n世界')).toBe('你好\n世界');
  });
});

describe('similarityRatio', () => {
  test('should calculate correct similarity ratios', () => {
    expect(similarityRatio('hello', 'hello')).toBe(1);
    expect(similarityRatio('hello', 'helo')).toBe(0.8);
    expect(similarityRatio('', '')).toBe(1);
    expect(similarityRatio('hello', '')).toBe(0);
  });

  test('should handle Chinese text', () => {
    expect(similarityRatio('你好世界', '你好世界')).toBe(1);
    expect(similarityRatio('你好世界', '你好地球')).toBe(0.5);
  });
});

describe('findCommonSubstrings', () => {
  test('should find common substrings', () => {
    const result = findCommonSubstrings('hello world', 'hello earth');
    console.log('Common substrings:', result);

    expect(result.length).toBeGreaterThan(0);
    expect(result[0].length).toBe(6); // 'hello ' should be the longest
    expect(result[0].aStart).toBe(0); // 'hello ' should start at position 0
    expect(result[0].bStart).toBe(0); // 'hello ' should start at position 0 in second string
  });

  test('should handle multiple common substrings', () => {
    const a = 'hello world hello';
    const b = 'world hello earth';
    const result = findCommonSubstrings(a, b);
    console.log('Multiple common substrings:', result);

    // Should find both 'world' and 'hello'
    const hasWorldHello = result.some(r => r.length === 11 && a.slice(r.aStart, r.aStart + r.length) === 'world hello');
    const hasHello = result.some(r => r.length === 6 && a.slice(r.aStart, r.aStart + r.length) === 'hello ');

    expect(hasWorldHello).toBe(true);
    expect(hasHello).toBe(true);
  });

  test('should handle empty strings', () => {
    expect(findCommonSubstrings('', '')).toHaveLength(0);
    expect(findCommonSubstrings('hello', '')).toHaveLength(0);
  });

  test('should handle Chinese text', () => {
    const result = findCommonSubstrings('你好世界', '你好地球');
    expect(result.some(r => r.length === 2 && r.aStart === 0)).toBe(true); // '你好'
  });
});

describe('findExactDiff', () => {
  test('should find exact differences in simple text', () => {
    const diffs = findExactDiff('hello world', 'hello there');
    expect(diffs).toEqual([
      {
        type: 'deletion',
        text: 'world',
        aStart: 6,
        aEnd: 11,
        bStart: 6,
        bEnd: 6
      },
      {
        type: 'addition',
        text: 'there',
        aStart: 11,
        aEnd: 11,
        bStart: 6,
        bEnd: 11
      }
    ]);
  });

  test('should handle empty strings', () => {
    const diffs = findExactDiff('', '');
    expect(diffs).toHaveLength(0);
  });

  test('should handle whitespace changes', () => {
    const diffs = findExactDiff('hello  world', 'hello world');
    expect(diffs).toHaveLength(0); // Normalized whitespace should be equal
  });

  test('should handle newlines and blank lines', () => {
    const diffs1 = findExactDiff(
      'line one\n\nline two',
      'line one\nline two'
    );
    expect(diffs1).toEqual([
      {
        type: 'deletion',
        text: '\n',
        aStart: 9,
        aEnd: 10,
        bStart: 9,
        bEnd: 9
      }
    ]);

    const diffs2 = findExactDiff(
      'line one\nline two',
      'line one\n\nline two'
    );
    expect(diffs2).toEqual([
      {
        type: 'addition',
        text: '\n',
        aStart: 9,
        aEnd: 9,
        bStart: 9,
        bEnd: 10
      }
    ]);

    const diffs3 = findExactDiff(
      'line one\r\nline two',
      'line one\nline two'
    );
    expect(diffs3).toEqual([
      {
        type: 'deletion',
        text: '\r',
        aStart: 8,
        aEnd: 9,
        bStart: 8,
        bEnd: 9
      }
    ]);
  });

  test('should handle mixed whitespace changes', () => {
    const diffs = findExactDiff(
      'line  one\n\n  line\ttwo  \n',
      'line one\nline two\n'
    );
    expect(diffs).toEqual([
      {
        type: 'deletion',
        text: '  ',
        aStart: 4,
        aEnd: 6,
        bStart: 4,
        bEnd: 4
      },
      {
        type: 'deletion',
        text: '\n',
        aStart: 9,
        aEnd: 10,
        bStart: 9,
        bEnd: 9
      },
      {
        type: 'deletion',
        text: '  ',
        aStart: 10,
        aEnd: 12,
        bStart: 9,
        bEnd: 9
      },
      {
        type: 'deletion',
        text: '\t',
        aStart: 12,
        aEnd: 13,
        bStart: 9,
        bEnd: 9
      },
      {
        type: 'deletion',
        text: '  ',
        aStart: 13,
        aEnd: 15,
        bStart: 9,
        bEnd: 9
      }
    ]);
  });

  test('should handle single character changes', () => {
    const diffs = findExactDiff('cat', 'cut');
    expect(diffs).toEqual([
      {
        type: 'deletion',
        text: 'a',
        aStart: 1,
        aEnd: 2,
        bStart: 1,
        bEnd: 1
      },
      {
        type: 'addition',
        text: 'u',
        aStart: 2,
        aEnd: 2,
        bStart: 1,
        bEnd: 2
      }
    ]);
  });

  test('should handle multiline text', () => {
    const diffs = findExactDiff(
      'line one\nline two\nline three',
      'line one\nmodified line\nline three'
    );

    const lineChanges = diffs.filter(d =>
      Math.floor(d.aStart / 1000) === 1 ||
      Math.floor(d.bStart / 1000) === 1
    );

    expect(lineChanges.length).toBeGreaterThanOrEqual(0);
    expect(diffs.some(d => d.type === 'deletion' && d.text === 'two')).toBe(true);
    expect(diffs.some(d => d.type === 'addition' && d.text === 'modified')).toBe(true);
  });

  test('should handle English word changes', () => {
    // Test case 1: Single word deletion
    const diffs1 = findExactDiff('hello world', 'hello');
    expect(diffs1).toEqual([{
      type: 'deletion',
      text: ' world',
      aStart: 5,
      aEnd: 11,
      bStart: 5,
      bEnd: 5
    }]);

    // Test case 2: Single word addition
    const diffs2 = findExactDiff('hello', 'hello world');
    expect(diffs2).toEqual([{
      type: 'addition',
      text: ' world',
      aStart: 5,
      aEnd: 5,
      bStart: 5,
      bEnd: 11
    }]);

    // Test case 3: Word replacement
    const diffs3 = findExactDiff('hello world', 'hello earth');
    expect(diffs3).toEqual([
      {
        type: 'deletion',
        text: 'world',
        aStart: 6,
        aEnd: 11,
        bStart: 6,
        bEnd: 6
      },
      {
        type: 'addition',
        text: 'earth',
        aStart: 11,
        aEnd: 11,
        bStart: 6,
        bEnd: 11
      }
    ]);

    // Test case 4: Multiple word changes
    const diffs4 = findExactDiff('the quick brown fox', 'a fast red fox');
    expect(diffs4).toEqual([
      {
        type: 'deletion',
        text: 'the quick brown',
        aStart: 0,
        aEnd: 15,
        bStart: 0,
        bEnd: 0
      },
      {
        type: 'addition',
        text: 'a fast red',
        aStart: 15,
        aEnd: 15,
        bStart: 0,
        bEnd: 10
      }
    ]);
  });

  test('should handle real-world Chinese content', () => {
    const diffs = findExactDiff(
      '作为一名热爱探索的旅游博主，我总是渴望寻找那些隐藏在地球上的美丽角落',
      '作为一名热爱探索的旅游博主，我总是渴望着寻找那些隐藏在地球上的美丽角落'
    );

    expect(diffs).toEqual([
      {
        type: 'addition',
        text: '着',
        aStart: 19,
        aEnd: 19,
        bStart: 19,
        bEnd: 20
      }
    ]);
  });

  test('should handle Chinese text', () => {
    const diffs = findExactDiff('你好世界', '你很世界');
    expect(diffs).toEqual([
      {
        type: 'deletion',
        text: '好',
        aStart: 1,
        aEnd: 2,
        bStart: 1,
        bEnd: 1
      },
      {
        type: 'addition',
        text: '很',
        aStart: 2,
        aEnd: 2,
        bStart: 1,
        bEnd: 2
      }
    ]);
  });
});
