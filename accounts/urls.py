from django.urls import path
from .views import RegisterAPIView, UserRoleAPIView

urlpatterns = [
    path("register/", RegisterAPIView.as_view()),
    path("me/", UserRoleAPIView.as_view()),
]