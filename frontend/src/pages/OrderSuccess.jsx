import { useLocation, useNavigate } from "react-router-dom"

function OrderSuccess() {
  const navigate = useNavigate()
  const location = useLocation()

  const order = location.state?.order

  if (!order) {
    return (
      <main className="order-success-page">
        <div className="success-card">
          <h2>Order Not Found</h2>

          <p>
            We could not find the order details.
          </p>

          <button
            onClick={() => navigate("/")}
          >
            Back to Products
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="order-success-page">
      <div className="success-card">

        <div className="success-icon">
          ✓
        </div>

        <h2>Order Placed Successfully!</h2>

        <p className="success-message">
          Thank you for your order.
          We will contact you shortly to confirm
          your order.
        </p>

        <div className="order-details">

          <div className="order-number">
            <span>Order ID</span>
            <strong>#{order.id}</strong>
          </div>

          <div className="order-status">
            <span>Status</span>
            <strong>{order.status}</strong>
          </div>

          <h3>Order Items</h3>

          {order.items?.map((item) => (
            <div
              className="success-item"
              key={item.product_id}
            >
              <div>
                <strong>
                  {item.product_name}
                </strong>

                <p>
                  ₹{Number(item.unit_price).toFixed(2)}
                  {" "}× {item.quantity}
                </p>
              </div>

              <strong>
                ₹{Number(item.total_price).toFixed(2)}
              </strong>
            </div>
          ))}

          <div className="success-total">
            <span>Total</span>

            <strong>
              ₹{Number(order.total_price).toFixed(2)}
            </strong>
          </div>

        </div>

        <button
          className="continue-shopping-button"
          onClick={() => navigate("/")}
        >
          Continue Shopping
        </button>

      </div>
    </main>
  )
}

export default OrderSuccess