from django.contrib import admin
from django.urls import path, include
from . import views

urlpatterns = [
    # 登录
    path('', views.login), # 登录
    path('index', views.index), # 首页
    path('login_out', views.login_out), # 退出登录

    # 文本模块
    path('wbjc',views.wbjc), # 跳转文本纠错页面
    path('wbgl',views.wbgl), # 跳转文本管理页面
    path('get_wb',views.get_wb), # 获取文本
    path('del_wb',views.del_wb), # 删除文本
    path('correct_text',views.correct_textv2), # 纠错文本
    # path('correct_textv2', views.correct_textv2),  # RAG增强，纠错文本

    # 文档模块
    path('wdjc',views.wdjc), # 跳转文档纠错页面
    path('wdgl',views.wdgl), # 跳转文档管理页面
    path('get_wd',views.get_wd), # 获取文档
    path('del_doc',views.del_doc), # 删除文档
    path('correct_doc', views.correct_doc), # 纠错文档
    path('get_result/<doc_id>',views.getdoccorrectresult), # 根据文档ID获取纠错结果
]
