import { useEffect, useState } from "react"
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
} from "react-router-dom"

import Checkout from "./pages/Checkout"
import OrderSuccess from "./pages/OrderSuccess"
import AdminLogin from "./pages/AdminLogin"
import AdminDashboard from "./pages/AdminDashboard"
import Cart from "./pages/Cart"

import { CartProvider, useCart } from "./CartContext"


function Store() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  const navigate = useNavigate()

  const {
    cart,
    cartItemCount,
    addToCart,
    updateQuantity,
  } = useCart()


  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/products/`)
      .then((response) => response.json())
      .then((data) => {
        setProducts(data)
        setLoading(false)
      })
      .catch((error) => {
        console.error(
          "Error fetching products:",
          error
        )

        setLoading(false)
      })
  }, [])


  function getCartQuantity(productId) {
    const cartItem = cart.find(
      (item) => item.id === productId
    )

    return cartItem
      ? cartItem.quantity
      : 0
  }


  return (
    <div>

      <header className="navbar">

  <div>
    <h1>
      Kapoor Diesels
    </h1>

    <p>
      Quality products at the best prices
    </p>
  </div>


  <div className="navbar-actions">

    <button
      className="admin-login-nav-button"
      onClick={() => navigate("/admin/login")}
    >
      Admin Login
    </button>

    <button
      className="cart-button"
      onClick={() => navigate("/cart")}
    >
      🛒 Cart ({cartItemCount})
    </button>

  </div>

</header>


      <main>

        <h2>
          Our Products
        </h2>


        {loading ? (
          <p>
            Loading products...
          </p>
        ) : products.length === 0 ? (
          <p>
            No products available.
          </p>
        ) : (

          <div className="products">

            {products
              .filter(
                (product) =>
                  product.is_available
              )
              .map((product) => {

                const quantity =
                  getCartQuantity(product.id)

                return (

                  <div
                    className="product-card"
                    key={product.id}
                  >

                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                      />
                    ) : (
                      <div className="no-image">
                        No Image
                      </div>
                    )}


                    <div className="product-info">

                      <h3>
                        {product.name}
                      </h3>

                      <p>
                        {product.description ||
                          "No description available."}
                      </p>


                      <div className="product-bottom">

                        <strong>
                          ₹
                          {Number(
                            product.price
                          ).toFixed(2)}
                        </strong>


                        {quantity === 0 ? (

                          <button
                            className="add-to-cart-button"
                            onClick={() =>
                              addToCart(product)
                            }
                          >
                            Add to Cart
                          </button>

                        ) : (

                          <div className="product-quantity">

                            <button
                              type="button"
                              className="quantity-button"
                              onClick={() =>
                                updateQuantity(
                                  product.id,
                                  -1
                                )
                              }
                            >
                              −
                            </button>


                            <span className="quantity-number">
                              {quantity}
                            </span>


                            <button
                              type="button"
                              className="quantity-button"
                              onClick={() =>
                                updateQuantity(
                                  product.id,
                                  1
                                )
                              }
                            >
                              +
                            </button>

                          </div>

                        )}

                      </div>

                    </div>

                  </div>

                )
              })}

          </div>

        )}

      </main>

    </div>
  )
}


function App() {
  return (

    <CartProvider>

      <BrowserRouter>

        <Routes>

          <Route
            path="/"
            element={<Store />}
          />

          <Route
            path="/cart"
            element={<Cart />}
          />

          <Route
            path="/checkout"
            element={<Checkout />}
          />

          <Route
            path="/order-success"
            element={<OrderSuccess />}
          />

          <Route
            path="/admin/login"
            element={<AdminLogin />}
          />

          <Route
            path="/admin"
            element={<AdminDashboard />}
          />

        </Routes>

      </BrowserRouter>

    </CartProvider>
  )
}


export default App