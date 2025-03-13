# 1.0版本运行步骤：
需要先安装Python的相关依赖：pip install -r requirements.txt

1、创建数据库，数据库名：text_error_correction

2、执行SQL语句，打开text_error_correction.sql文件，运行该文件中的SQL语句

3、源码文件为text_error_correction.zip，修改源代码中的settings.py文件，改成自己的mysql数据库用户名和密码

4、运行命令：python manage.py runserver

5、打开浏览器查看http://127.0.0.1:8000登录前端页面。

6、用户名：admin 密码：123

1.0版本已经开发完成。

大模型在llm包下，目前没有集成。

# 2.0版本运行步骤
前端进行了更新，在fronted包目录下，需要下载依赖并且运行，打开浏览器查看http://127.0.0.1:3000登录前端页面。

2.0版本需要修改前端的页面逻辑，目前正在修改中。
