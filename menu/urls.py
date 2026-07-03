from django.urls import path
from .views import MenuItemListAPIView

urlpatterns = [
    path('items/', MenuItemListAPIView.as_view()),
]