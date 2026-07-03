from django.contrib import admin
from django.urls import path, include

# JWT imports
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path('admin/', admin.site.urls),
        path('api/menu/', include('menu.urls')),

    # Apps
    path('api/menu/', include('menu.urls')),
    path('api/orders/', include('orders.urls')),
    path('api/accounts/', include('accounts.urls')),
    path('api/inventory/', include('inventory.urls')),
    path('api/menu/', include('menu.urls')),

    # JWT AUTH
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]