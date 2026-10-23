import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useCart } from "../CartContext"

function Checkout() {
  const navigate = useNavigate()

  const {
    cart,
    cartTotal,
    clearCart,
  } = useCart()

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    pincode: "",
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")


  function handleChange(event) {
    const { name, value } = event.target

    setFormData((current) => ({
      ...current,
      [name]: value,
    }))
  }


  function goBackToCart() {
    navigate("/cart")
  }


  async function placeOrder(event) {
    event.preventDefault()

    if (cart.length === 0) {
      setError("Your cart is empty.")
      return
    }

    setLoading(true)
    setError("")


    try {

      const orderItems = cart.map((item) => ({
        product_id: item.id,
        quantity: item.quantity,
      }))


      const response = await fetch(
        "http://127.0.0.1:8000/orders/",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            items: orderItems,
            customer: formData,
          }),
        }
      )


      const data = await response.json()


      if (!response.ok) {

        if (Array.isArray(data.detail)) {

          const validationErrors =
            data.detail
              .map((error) => {
                if (
                  typeof error === "string"
                ) {
                  return error
                }

                return error.msg
              })
              .join(", ")

          throw new Error(
            validationErrors ||
            "Please check your information"
          )
        }


        throw new Error(
          data.detail ||
          "Failed to place order"
        )
      }


      clearCart()


      navigate("/order-success", {
        state: {
          order: data.order,
        },
      })


    } catch (error) {

      console.error(error)

      setError(
        error.message ||
        "Something went wrong. Please try again."
      )

    } finally {

      setLoading(false)

    }
  }


  if (cart.length === 0) {

    return (

      <main className="checkout-page">

        <div className="empty-cart">

          <h2>
            Your cart is empty
          </h2>

          <p>
            Add some products before
            proceeding to checkout.
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

    <main className="checkout-page">

      <div className="checkout-header">

        <div>

          <h2>
            Checkout
          </h2>

          <p>
            Enter your details to place your order.
          </p>

        </div>


        <button
          className="continue-shopping-button"
          onClick={goBackToCart}
          disabled={loading}
        >
          ← Back to Cart
        </button>

      </div>


      <div className="checkout-layout">

        {/* =========================
            Customer Form
        ========================= */}

        <form
          className="checkout-form"
          onSubmit={placeOrder}
        >

          <h3>
            Customer Details
          </h3>


          <label htmlFor="name">
            Full Name
          </label>

          <input
            id="name"
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter your full name"
            minLength={2}
            maxLength={100}
            required
            disabled={loading}
          />


          <label htmlFor="phone">
            Phone Number
          </label>

          <input
            id="phone"
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="10-digit mobile number"
            inputMode="numeric"
            maxLength={10}
            required
            disabled={loading}
          />

          <small className="input-help">
            Enter a valid 10-digit Indian mobile number.
          </small>


          <label htmlFor="address">
            Address
          </label>

          <textarea
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="House number, street, area..."
            minLength={5}
            maxLength={500}
            rows={4}
            required
            disabled={loading}
          />


          <label htmlFor="city">
            City
          </label>

          <input
            id="city"
            type="text"
            name="city"
            value={formData.city}
            onChange={handleChange}
            placeholder="Enter your city"
            minLength={2}
            maxLength={100}
            required
            disabled={loading}
          />


          <label htmlFor="pincode">
            Pincode
          </label>

          <input
            id="pincode"
            type="text"
            name="pincode"
            value={formData.pincode}
            onChange={handleChange}
            placeholder="6-digit pincode"
            inputMode="numeric"
            maxLength={6}
            required
            disabled={loading}
          />


          <small className="input-help">
            Enter a valid 6-digit Indian pincode.
          </small>


          {error && (

            <div className="checkout-error">

              <strong>
                Unable to place order
              </strong>

              <p>
                {error}
              </p>

            </div>

          )}


          <button
            type="submit"
            className="place-order-button"
            disabled={loading}
          >

            {loading
              ? "Placing Order..."
              : `Place Order · ₹${cartTotal.toFixed(2)}`}

          </button>

        </form>


        {/* =========================
            Order Summary
        ========================= */}

        <aside className="checkout-summary">

          <h3>
            Order Summary
          </h3>


          <div className="checkout-items">

            {cart.map((item) => (

              <div
                className="summary-item"
                key={item.id}
              >

                <div className="summary-product">

                  {item.image_url ? (

                    <img
                      src={item.image_url}
                      alt={item.name}
                    />

                  ) : (

                    <div className="summary-no-image">
                      No Image
                    </div>

                  )}


                  <div>

                    <strong>
                      {item.name}
                    </strong>

                    <p>
                      ₹
                      {Number(
                        item.price
                      ).toFixed(2)}
                      {" "}× {item.quantity}
                    </p>

                  </div>

                </div>


                <strong>
                  ₹
                  {(
                    Number(item.price) *
                    item.quantity
                  ).toFixed(2)}
                </strong>

              </div>

            ))}

          </div>


          <hr />


          <div className="summary-total">

            <strong>
              Total
            </strong>

            <strong>
              ₹{cartTotal.toFixed(2)}
            </strong>

          </div>


          <div className="checkout-note">

            <strong>
              📞 Order confirmation
            </strong>

            <p>
              After placing your order, we will
              contact you on your phone number
              to confirm the order.
            </p>

          </div>

        </aside>

      </div>

    </main>
  )
}

export default Checkout