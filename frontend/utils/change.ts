
const demos = [
  {
    originText: '这段话有一个搓误，这段话有一段逻辑上的错误，将要修改参数a，结束',
    changedText: '这段话有一个**搓[错]**误，**[此处逻辑不通，]**这段话有一段逻辑上的错误，将要修改参数**a[b]**，**结束[完毕]**',
    preview: '这段话有一个错误，此处逻辑不通，这段话有一段逻辑上的错误，将要修改参数b，完毕',
    changes: [
      {
        pos: 6,
        oldText: '搓',
        newText: '错'
      },
      {
        pos: 9,
        oldText: '',
        newText: '此处逻辑不通，'
      },
      {
        pos: 28,
        oldText: 'a',
        newText: 'b'
      },
      {
        pos: 30,
        oldText: '结束',
        newText: '完毕'
      }
    ]
  }
]

const applyChanges = (originText: string, changes: any[]) => {
  let resultText = originText;
  let currentOffset = 0; // To keep track of changes in length

  changes.forEach(change => {
    const { pos, oldText, newText } = change;

    // Ensure pos is within the valid range
    if (pos < 0 || pos > resultText.length) {
      throw new Error(`Invalid position: ${pos}`);
    }

    // Calculate the effective position considering previous changes
    const effectivePos = pos + currentOffset;

    resultText = resultText.slice(0, effectivePos) +
      newText +
      resultText.slice(effectivePos + oldText.length);

    // Update currentOffset based on the change in length
    currentOffset += (newText.length - oldText.length);
  });

  return resultText
}


export {
  demos,
  applyChanges
}