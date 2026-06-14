from django.urls import path
from .views import MenuItemListAPIView

urlpatterns = [
    path('menu-items/', MenuItemListAPIView.as_view()),
]