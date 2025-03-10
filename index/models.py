from django.db import models


class Text(models.Model):
    id=models.AutoField(primary_key=True)
    src = models.CharField(verbose_name='纠正文本',default='',max_length=500)
    dest = models.CharField(verbose_name="纠错后文本",default='',max_length=500)
    owner = models.CharField(verbose_name='',default='',max_length=100)
    status = models.CharField(verbose_name='状态',default='',max_length=100)
    create_time = models.DateTimeField('创建时间', auto_now_add=True)
    modify_time = models.DateTimeField('最后修改时间', auto_now=True)


    def __str__(self):
        return self.src

    class Meta:
        db_table = 'text'


class Document(models.Model):
    id=models.AutoField(primary_key=True)
    name = models.CharField(verbose_name='文档名称',default='',max_length=100)
    src = models.CharField(verbose_name='纠正文本',default='',max_length=500)
    dest = models.CharField(verbose_name="纠错后文本",default='',max_length=500)
    owner = models.CharField(verbose_name='',default='',max_length=100)
    status = models.CharField(verbose_name='状态',default='',max_length=100)
    create_time = models.DateTimeField('创建时间', auto_now_add=True)


    def __str__(self):
        return self.name

    class Meta:
        db_table = 'document'

#
# class Resources(models.Model):
#     # 主键 id，自动增长
#     id = models.AutoField(primary_key=True)
#     # 用户 ID
#     user_id = models.IntegerField(verbose_name='用户ID')
#     # 类型（document 或 text）
#     class Type(models.TextChoices):
#         DOCUMENT = 'document', '文档'
#         TEXT = 'text', '文本'
#     type = models.CharField(
#         verbose_name='类型',
#         max_length=20,
#         choices=Type.choices,
#         default=Type.DOCUMENT
#     )
#     # 文档名称
#     document_name = models.CharField(verbose_name='文档名称', max_length=255, default='')
#     # 纠正文本
#     content = models.TextField(verbose_name='纠正文本', default='')
#     # 纠错后文本
#     update_content = models.TextField(verbose_name='纠错后文本', default='')
#     # 状态
#     status = models.CharField(verbose_name='状态', max_length=50, default='')
#     # 创建时间
#     create_time = models.DateTimeField('创建时间', auto_now_add=True)
#     # 更新时间，默认是创建时自动设置，可以留空
#     update_time = models.DateTimeField('更新时间', auto_now=True)
#
#     def __str__(self):
#         return self.document_name
#
#     class Meta:
#         db_table = 'resources'  # 数据库表名
#         verbose_name = '资源'
#         verbose_name_plural = '资源'
