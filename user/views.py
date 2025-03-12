import time

from django.shortcuts import render

from .models import User
from django.http import JsonResponse, HttpResponseRedirect
from django.core.paginator import Paginator
#from utils.mypage import Pagination

def register(request):
    """
    注册账号
    :return:
    """
    try:
        # 1.接收前端传过来的数据
        name = request.POST.get('username')
        passwd = request.POST.get('password')
        phone = request.POST.get('phone')
        # 2.验证数据
        user = User.objects.filter(name=name)
        # 3.保存数据到数据库
        # 3.1 判断用户是否存在
        if user:
            return JsonResponse({'message': '用户已存在,请直接登录'}, status=403)
        # 3.2 保存用户信息
        User.objects.create(
            name=name,
            password=passwd,
            phone=phone,
            role=2,
            description=''
        )
        # 4.返回响应
        response_data = {'message': '注册成功'}
        return JsonResponse(response_data)
    except Exception as e:
        print(e)
        return JsonResponse({'message': '注册失败'}, status=401)

def password(request):
    username = request.session['username']
    role = int(request.session['role'])
    user_id = request.session['user_id']
    return render(request,'modify_password.html',locals())
	
	
def get_user(request):
    """
    获取用户列表信息 | 模糊查询
    :param request:
    :return:
    """
    keyword = request.GET.get('name')
    page = request.GET.get("page", '')
    limit = request.GET.get("limit", '')
    role_id = request.GET.get('position','')
    response_data = {}
    response_data['code'] = 0
    response_data['msg'] = ''
    data = []
    if keyword is None:
        results_obj = User.objects.all()
    else:
        results_obj = User.objects.filter(name__contains=keyword).all()
    paginator = Paginator(results_obj, limit)
    results = paginator.page(page)
    if results:
        for user in results:
            record = {
                "id": user.id,
                "name": user.name,
                "password": user.password,
                "phone": user.phone,
                "role": user.role,
                'create_time': user.create_time.strftime('%Y-%m-%d %H:%m:%S'),
                "desc": user.description,
            }
            data.append(record)
        response_data['count'] =len(results_obj)
        response_data['data'] = data

    return JsonResponse(response_data)


def user(request):
    """
    跳转用户页面
    """
    username = request.session['username']
    role = int(request.session['role'])
    user_id= request.session['user_id']
    return render(request, 'user.html', locals())



def login_check(request):
    """
    登录校验
    """
    response_data = {}
    name = request.POST.get('username')
    password = request.POST.get('password')

    user = User.objects.filter(name=name, password=password).first()
    info = {}
    if user:
        # 将用户名存入session中
        request.session["username"] = user.name
        request.session["role"] = user.role
        request.session["user_id"] = user.id

        response_data['message'] = '登录成功'
        return JsonResponse(response_data, status=201)
    else:
        return JsonResponse({'message': '用户名或者密码不正确'}, status=401)


def edit_user(request):
    """
    修改用户
    """
    response_data = {}
    user_id = request.POST.get('id')
    username = request.POST.get('username')
    phone = request.POST.get('phone')

    User.objects.filter(id=user_id).update(
        name=username,
        phone=phone)

    response_data['msg'] = 'success'
    return JsonResponse(response_data, status=201)


def del_user(request):
    """
    删除用户
    """
    user_id = request.POST.get('id')
    result = User.objects.filter(id=user_id).first()
    try:
        if not result:
            response_data = {'error': '删除失败！', 'message': '找不到id为%s' % user_id}
            return JsonResponse(response_data, status=403)
        result.delete()
        response_data = {'message': '删除成功！'}
        return JsonResponse(response_data, status=201)
    except Exception as e:
        response_data = {'message': '删除失败！'}
        return JsonResponse(response_data, status=403)


def change_password(request):
    """
    修改密码
    """

    user = User.objects.filter(name=request.session["username"]).first()
    if user.password == request.POST.get('changePassword'):
        # 修改的密码与原密码重复不予修改
        return JsonResponse({"msg": "修改密码与原密码重复"}), 406
    else:
        # 不重复，予以修改
        User.objects.filter(name=request.session["username"]).update(
            password=request.POST.get('changePassword'))
        # 清除session回到login界面
        del request.session['username']
        return JsonResponse({"msg": "success"})

def get_session(request):
    # 获取用户的会话信息
    username = request.session['username']
    userId = request.session['user_id']
    response_data = {'username': username, 'userId': userId}
    return JsonResponse(response_data)



