import { useNavigate } from "react-router-dom"
import { useCart } from "../CartContext"

function Cart() {
  const navigate = useNavigate()

  const {
    cart,
    updateQuantity,
    cartTotal,
  } = useCart()

  if (cart.length === 0) {
    return (
      <main className="cart-page">

        <div className="cart-page-header">
          <h2>Your Cart</h2>

          <button
            className="continue-shopping-button"
            onClick={() => navigate("/")}
          >
            Continue Shopping
          </button>
        </div>

        <div className="empty-cart">
          <h3>Your cart is empty</h3>

          <p>
            Add some products to your cart to continue.
          </p>

          <button
            className="checkout-button"
            onClick={() => navigate("/")}
          >
            Browse Products
          </button>
        </div>

      </main>
    )
  }

  return (
    <main className="cart-page">

      <div className="cart-page-header">

        <div>
          <h2>Your Cart</h2>

          <p>
            {cart.length}{" "}
            {cart.length === 1
              ? "product"
              : "products"}{" "}
            in your cart
          </p>
        </div>

        <button
          className="continue-shopping-button"
          onClick={() => navigate("/")}
        >
          Continue Shopping
        </button>

      </div>


      <div className="cart-page-layout">

        <section className="cart-products">

          {cart.map((item) => (

            <div
              className="cart-page-item"
              key={item.id}
            >

              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.name}
                />
              ) : (
                <div className="cart-page-no-image">
                  No Image
                </div>
              )}


              <div className="cart-page-item-info">

                <h3>
                  {item.name}
                </h3>

                <p>
                  ₹{Number(item.price).toFixed(2)}
                </p>


                <div className="cart-page-quantity">

                  <button
                    onClick={() =>
                      updateQuantity(item.id, -1)
                    }
                  >
                    −
                  </button>

                  <span>
                    {item.quantity}
                  </span>

                  <button
                    onClick={() =>
                      updateQuantity(item.id, 1)
                    }
                  >
                    +
                  </button>

                </div>

              </div>


              <div className="cart-page-item-total">

                <strong>
                  ₹
                  {(
                    Number(item.price) *
                    item.quantity
                  ).toFixed(2)}
                </strong>

              </div>

            </div>

          ))}

        </section>


        <aside className="cart-summary">

          <h3>
            Order Summary
          </h3>


          <div className="cart-summary-row">

            <span>
              Items
            </span>

            <span>
              {cart.reduce(
                (total, item) =>
                  total + item.quantity,
                0
              )}
            </span>

          </div>


          <div className="cart-summary-row">

            <span>
              Subtotal
            </span>

            <span>
              ₹{cartTotal.toFixed(2)}
            </span>

          </div>


          <hr />


          <div className="cart-summary-total">

            <strong>
              Total
            </strong>

            <strong>
              ₹{cartTotal.toFixed(2)}
            </strong>

          </div>


          <button
            className="checkout-button cart-checkout-button"
            onClick={() => navigate("/checkout")}
          >
            Proceed to Checkout
          </button>

        </aside>

      </div>

    </main>
  )
}

export default Cart