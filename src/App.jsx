import { useEffect, useState } from "react";

function App() {
  const [dashboard, setDashboard] = useState(null);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/dashboard/")
      .then((response) => response.json())
      .then((data) => setDashboard(data))
      .catch((error) => console.error(error));
  }, []);

  if (!dashboard) {
    return <h1>Loading Dashboard...</h1>;
  }

  return (
    <div style={{ padding: "30px" }}>
      <h1>Restaurant Order Management System</h1>

      <h2>Total Customers: {dashboard.total_customers}</h2>
      <h2>Total Orders: {dashboard.total_orders}</h2>
      <h2>Total Menu Items: {dashboard.total_menu_items}</h2>
      <h2>Total Revenue: Rs. {dashboard.total_revenue}</h2>
    </div>
  );
}

export default App;