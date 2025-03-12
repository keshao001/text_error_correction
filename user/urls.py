from django.contrib import admin
from django.urls import path, include
from . import views

urlpatterns = [
    path('user', views.user), # 跳转用户页面
    path('login_check', views.login_check), # 登录验证
    path('register',views.register), # 注册页面
    path('change_password', views.change_password), # 修改密码页面
    path('get_users',views.get_user), # 获取用户信息
    path('edit_user',views.edit_user), # 编辑用户信息
    path('del_user',views.del_user), # 删除用户信息
    path('password', views.password), # 跳转忘记密码页面
    path('get_session',views.get_session),
]
