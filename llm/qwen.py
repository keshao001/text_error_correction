import requests
class ChatCompletion:
    def __init__(self, url="http://10.129.2.71:8000/v1/chat/completions", model="gpt-3.5-turbo"):
        self.url = url
        self.model = model
    def get_response(self, user_message):
        headers = {
            "Content-Type": "application/json"
        }
        payload = {
            "model": self.model,
            "messages": [
                {
                    "role": "user",
                    "content": user_message
                }
            ]
        }
        prompt = ("""#你是一个智能的文本纠错助手，能够帮我纠正句子中的错别字、重复字。
                    ##例子1，关于错别字的纠错：我向你输入一段话：“今天的天气真不错，我想出去万。”
                      在这个句子当中，有一个错别字“玩”，所以你需要将其修改为“玩”，并且将正确的句子返回给我：“今天的天气真不错，我想出去玩。”
                    ##例子2，关于重复字的纠错：我向你输入一段话：“今天是周六，我想去吃火火锅。”
                      在这个句子当中，有一个重复字“火”，所以你需要将其删除，并且将正确的句子返回给我：“今天是周六，我想去吃火锅。”
                     ##例子3，关于缺字的纠错：我向你输入一段话：“我想去火锅，但我忘记带伞。”
                      在这个句子当中，有一个缺字“吃”，所以你需要将其补全，并且将正确的句子返回给我：“我想去吃火锅，但我忘记带伞。”
                    ##例子4，关于错别字、重复字、缺字的综合纠错：我向你输入一段话：“当前，航空航天领正经历一场技树革命，许多新兴技术正在推动动飞行器和航天器的性能提升。”
                      在这个句子当中，有一个错别字“树”，一个重复字“动”，同时缺少“域”字，所以你需要将“树”其修改为“术”，删除重复字“动”，增加缺字“域”并且将正确的句子返回给我：“当前，航空航天领域正经历一场技术革命，许多新兴技术正在推动飞行器和航天器的性能提升。”
                    #请注意:
                    1、句子当中可能有0个或者多个错别字、重复字、缺字的错误。
                    2、你只需要将正确的句子返回给我即可，如果句子没有错，则将原句子返回给我。
                    ## 以下 <context>中的内容可以帮助你进行纠错，如果没有帮助请忽略。
                
                    """)
        # 错误：当前，航航空航天领域正经历一场技术革命，许多新兴技术正在推动飞行器和航天器的性能提升。下一代发动机技树（如电动推进和混合动力发动机）正在改变航空运输方式，使其更加环保和高效。
        # 正确：当前，航空航天领域正经历一场技术革命，许多新兴技术正在推动飞行器和航天器的性能提升。下一代发动机技术（如电动推进和混合动力发动机）正在改变航空运输方式，使其更加环保和高效。
        user_message = prompt + user_message


        # 发送 POST 请求并获取响应
        response = requests.post(self.url, json=payload, headers=headers)

        # 检查响应状态
        if response.status_code == 200:
            return response.json()["choices"][0]["message"]["content"]  # 返回响应的 JSON 数据
        else:
            raise Exception(f"请求失败: {response.status_code}, {response.text}")



# 使用示例
if __name__ == "__main__":

    chat = ChatCompletion()


    try:
        result = chat.get_response("今天是周一，可以出去万足球。")
        print(result)  # 打印返回的结果
    except Exception as e:
        print(e)
