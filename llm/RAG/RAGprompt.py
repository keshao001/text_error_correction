from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_core.prompts import ChatPromptTemplate

class RAGPromptEnhancer:
    def __init__(self, pdf_path, model_path):
        """
        初始化方法，加载 PDF 文件并初始化嵌入模型和向量库。
        :param pdf_path: PDF 文件路径
        :param model_path: 嵌入模型路径
        """
        # 加载 PDF 文件
        loader = PyPDFLoader(pdf_path)
        self.pages = loader.load()  # 加载 PDF 文档，不拆分

        # 定义按句号拆分的文本分割器
        self.text_splitter = RecursiveCharacterTextSplitter(
            separators=["。"],  # 按句号拆分
            chunk_size=40,      # 每个块的最大字符数
            chunk_overlap=5     # 块之间的重叠字符数
        )

        # 按句号拆分文本
        self.split_documents = self.text_splitter.split_documents(self.pages)

        # 使用开源嵌入模型
        self.embedding = HuggingFaceEmbeddings(model_name=model_path)

        # 向量库
        self.vector_store = FAISS.from_documents(self.split_documents, self.embedding)

        # 定义检索器，限制返回的文档数量
        self.retriever = self.vector_store.as_retriever(search_kwargs={"k": 1})  # 返回最相关的1个文档

    def enhance_prompt(self, user_question):
        """
        根据用户问题生成增强后的 prompt。
        :param user_question: 用户输入的问题
        :return: 增强后的 prompt
        """
        # 定义原始 prompt 模板
        template = """
        <context>
        {context}
        </context>
        ## 请修改以下内容：{input}
        """
        prompt = ChatPromptTemplate.from_template(template)

        # 检索与问题相关的文档
        retrieved_docs = self.retriever.invoke(user_question)

        # 将检索到的文档内容拼接为上下文
        if retrieved_docs:
            context = "\n".join([doc.page_content for doc in retrieved_docs])
        else:
            context = "未找到相关上下文。"

        # 将上下文与原始 prompt 结合
        new_prompt = prompt.format(context=context, input=user_question)

        return new_prompt


# 示例用法
if __name__ == "__main__":
    # PDF 文件路径和模型路径
    pdf_path = "C:\\Users\\18817\\Desktop\\RAG.pdf"
    model_path = "D:\\python-work\\python-models\\M3E\\m3e-base"

    # 创建 RAGPromptEnhancer 实例
    enhancer = RAGPromptEnhancer(pdf_path, model_path)

    # 用户输入的问题
    user_question = "贾宝玉是谁的孙子？"

    # 生成增强后的 prompt
    enhanced_prompt = enhancer.enhance_prompt(user_question)

    # 打印增强后的 prompt
    print(enhanced_prompt)
