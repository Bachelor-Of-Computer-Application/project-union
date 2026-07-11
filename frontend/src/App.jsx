import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import MenuPage from "./pages/MenuPage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrdersPage from "./pages/OrdersPage";
import OrderDetailPage from "./pages/OrderDetailPage";
import ProfilePage from "./pages/ProfilePage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminDashboard from "./pages/AdminDashboard";
import RestaurantPanel from "./pages/RestaurantPanel";
import DeliveryDashboard from "./pages/DeliveryDashboard";
import DeliveryOrders from "./pages/DeliveryOrders";
import DeliveryProfile from "./pages/DeliveryProfile";
import PaymentSuccessPage from "./pages/PaymentSuccessPage";
import PaymentFailurePage from "./pages/PaymentFailurePage";
import "./App.css";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            {/* Public */}
            <Route path="/"        element={<Home />} />
            <Route path="/menu"    element={<MenuPage />} />
            <Route path="/about"   element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/login"   element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Customer-protected */}
            <Route path="/cart"       element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
            <Route path="/checkout"   element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
            <Route path="/orders"     element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
            <Route path="/orders/:id" element={<ProtectedRoute><OrderDetailPage /></ProtectedRoute>} />
            <Route path="/profile"    element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

            {/* Payment callbacks */}
            <Route path="/orders/payment-success" element={<ProtectedRoute><PaymentSuccessPage /></ProtectedRoute>} />
            <Route path="/orders/payment-failure" element={<ProtectedRoute><PaymentFailurePage /></ProtectedRoute>} />

            {/* Admin-only */}
            <Route path="/admin"      element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
            <Route path="/restaurant" element={<ProtectedRoute adminOnly><RestaurantPanel /></ProtectedRoute>} />

            {/* Delivery */}
            <Route
              path="/delivery"
              element={
                <ProtectedRoute deliveryOnly>
                  <DeliveryDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/delivery/orders"
              element={
                <ProtectedRoute deliveryOnly>
                  <DeliveryOrders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/delivery/profile"
              element={
                <ProtectedRoute deliveryOnly>
                  <DeliveryProfile />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
