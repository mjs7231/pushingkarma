# encoding: utf-8
from django.conf.urls import include, url
from pk import api as pk_api, views as pk_views
from pk.apps.budget import api as budget_api
from pk.apps.notes import api as note_api
from pk.apps.stocks import views as stock_views
from rest_framework import routers

api = routers.DefaultRouter(trailing_slash=False)
api.register('user', pk_api.AccountViewSet)
api.register('notes', note_api.NotesViewSet)
api.register('accounts', budget_api.AccountsViewSet)
api.register('categories', budget_api.CategoriesViewSet)
api.register('transactions', budget_api.TransactionsViewSet)
api.register('stocks', stock_views.StocksViewSet)
api.register('keyval', budget_api.KeyValueViewSet)

urlpatterns = [
    url(r'^api/', include(api.urls)),
    url(r'', pk_views.index, name='index'),
]
