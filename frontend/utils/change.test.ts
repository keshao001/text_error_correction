// change.test.ts

import { demos, applyChanges } from './change'; // Import the demos array

describe('Text Change Functionality', () => {
    it('should have the correct originText', () => {
        const expectedOriginText = '这段话有一个搓误，这段话有一段逻辑上的错误，将要修改参数a，结束';
        expect(demos[0].originText).toBe(expectedOriginText);
    });

    it('should change the text as expected', () => {
        const expectedChangedText = '这段话有一个**搓[错]**误，**[此处逻辑不通，]**这段话有一段逻辑上的错误，将要修改参数**a[b]**，**结束[完毕]**';
        expect(demos[0].changedText).toBe(expectedChangedText);
    });

    it('should create the correct preview text', () => {
        const expectedPreviewText = '这段话有一个错误，此处逻辑不通，这段话有一段逻辑上的错误，将要修改参数b，完毕';
        expect(demos[0].preview).toBe(expectedPreviewText);
    });

    it('should have the correct changes', () => {
        const expectedChanges = [
            { pos: 6, oldText: '搓', newText: '错' },
            { pos: 9, oldText: '', newText: '此处逻辑不通，' },
            { pos: 28, oldText: 'a', newText: 'b' },
            {
                pos: 30,
                oldText: '结束',
                newText: '完毕'
            }
        ];
        expect(demos[0].changes).toEqual(expectedChanges);
    });

    it('should apply all changes correctly', () => {
        const resultText = applyChanges(demos[0].originText, demos[0].changes);
        expect(resultText).toBe(demos[0].preview);
    });
});
