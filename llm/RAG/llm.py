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
        prompt = ("")
        user_message = prompt + user_message
        # 发送 POST 请求并获取响应
        response = requests.post(self.url, json=payload, headers=headers)
        # 检查响应状态
        if response.status_code == 200:
            return response.json()["choices"][0]["message"]["content"]  # 返回响应的 JSON 数据
        else:
            raise Exception(f"请求失败: {response.status_code}, {response.text}")

