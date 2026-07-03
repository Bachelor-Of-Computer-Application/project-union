import { useEffect, useState } from "react";
import api from "./api";

export default function Menu() {
  const [groupedMenu, setGroupedMenu] = useState({});
  const [cart, setCart] = useState([]);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const res = await api.get("menu/items/");

        const items = res.data;

        const grouped = {};

        items.forEach((item) => {
          const category = item.category.name;

          if (!grouped[category]) {
            grouped[category] = [];
          }

          grouped[category].push(item);
        });

        setGroupedMenu(grouped);
      } catch (err) {
        console.log(err);
      }
    };

    fetchMenu();
  }, []);

  // Add item to cart
  const addToCart = (item) => {
    const existingItem = cart.find((cartItem) => cartItem.id === item.id);

    if (existingItem) {
      const updatedCart = cart.map((cartItem) =>
        cartItem.id === item.id
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      );

      setCart(updatedCart);
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const categories = Object.keys(groupedMenu);

  return (
    <div style={{ padding: "40px" }}>
      <h1>🍽 Restaurant Menu</h1>

      {categories.length === 0 ? (
        <p>Loading menu...</p>
      ) : (
        categories.map((cat) => (
          <div key={cat} style={{ marginBottom: "30px" }}>
            <h2>{cat}</h2>

            <div
              style={{
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
              }}
            >
              {groupedMenu[cat].map((item) => (
                <div
                  key={item.id}
                  style={{
                    border: "1px solid gray",
                    borderRadius: "8px",
                    padding: "10px",
                    width: "220px",
                  }}
                >
                  <h3>{item.name}</h3>

                  <p>Price: Rs {item.price}</p>

                  <p>
                    {item.is_available
                      ? "✅ Available"
                      : "❌ Not Available"}
                  </p>

                  <button onClick={() => addToCart(item)}>
                    Add to Cart
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      <hr />

      <h2>🛒 Cart</h2>

      {cart.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        cart.map((item) => (
          <div key={item.id}>
            <h3>{item.name}</h3>

            <p>Quantity: {item.quantity}</p>

            <p>Price: Rs {item.price}</p>

            <hr />
          </div>
        ))
      )}
    </div>
  );
}