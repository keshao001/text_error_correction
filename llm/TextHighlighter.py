from difflib import SequenceMatcher

class TextHighlighter:
    def __init__(self, original_text, corrected_text):
        """
        初始化方法，接收原始文本和更正后的文本。
        :param original_text: 原始文本
        :param corrected_text: 更正后的文本
        """
        self.original_text = original_text
        self.corrected_text = corrected_text

    def highlight_differences(self):
        """
        比对原始文本和更正后的文本，标记出不同的部分。
        :return: 标记后的文本（HTML格式）
        """
        matcher = SequenceMatcher(None, self.original_text, self.corrected_text)
        highlighted_text = ""
        for tag, i1, i2, j1, j2 in matcher.get_opcodes():
            if tag == 'replace' or tag == 'delete' or tag == 'insert':
                # 标记不同部分
                highlighted_text += f'<span style="text-decoration: underline wavy red;">{self.corrected_text[j1:j2]}</span>'
            else:
                # 相同部分
                highlighted_text += self.corrected_text[j1:j2]
        return highlighted_text


# 示例用法
if __name__ == "__main__":
    # 示例输入和返回文本
    original_text = "当前，航空航天领域正经历一场技术革命，许多新兴技术正在推动飞行器和航天器的性能提升。下一代发动机技树（如电动推进和混合动力发动机）正在改变航空运输方式，使其更加环保和高效。超音速飞行技术也在不断突破，新的超音速客机正在研发中，预计将大大缩短全球飞行时件。"
    corrected_text = "当前，航空航天领域正经历一场技术革命，许多新兴技术正在推动飞行器和航天器的性能提升。下一代发动机技术（如电动推进和混合动力发动机）正在改变航空运输方式，使其更加环保和高效。超音速飞行技术也在不断突破，新的超音速客机正在研发中，预计将大大缩短全球飞行时间。"

    # 创建 TextHighlighter 实例
    highlighter = TextHighlighter(original_text, corrected_text)

    # 获取标记后的文本
    highlighted_text = highlighter.highlight_differences()

    # 输出结果
    print(highlighted_text)
