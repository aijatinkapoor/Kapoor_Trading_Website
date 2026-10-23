import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

function AdminDashboard() {
  const navigate = useNavigate()

  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])

  const [loadingProducts, setLoadingProducts] = useState(true)
  const [loadingOrders, setLoadingOrders] = useState(true)

  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [showProductForm, setShowProductForm] =
    useState(false)

  const [editingProduct, setEditingProduct] =
    useState(null)

  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    price: "",
    image_url: "",
    is_available: true,
  })

  const [selectedImage, setSelectedImage] =
    useState(null)

  const [uploadingImage, setUploadingImage] =
    useState(false)

  const token = localStorage.getItem(
    "admin_token"
  )

  useEffect(() => {
    if (!token) {
      navigate("/admin/login")
      return
    }

    loadProducts()
    loadOrders()
  }, [])

  async function loadProducts() {
    try {
      setLoadingProducts(true)

      const response = await fetch(
        "http://127.0.0.1:8000/products/"
      )

      if (!response.ok) {
        throw new Error("Failed to load products")
      }

      const data = await response.json()

      setProducts(data)
    } catch (error) {
      console.error(error)
      setError(error.message)
    } finally {
      setLoadingProducts(false)
    }
  }

  async function loadOrders() {
    try {
      setLoadingOrders(true)

      const response = await fetch(
        "http://127.0.0.1:8000/admin/orders",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (response.status === 401) {
        logout()
        return
      }

      if (!response.ok) {
        throw new Error("Failed to load orders")
      }

      const data = await response.json()

      setOrders(data)
    } catch (error) {
      console.error(error)
      setError(error.message)
    } finally {
      setLoadingOrders(false)
    }
  }

  function logout() {
    localStorage.removeItem("admin_token")
    navigate("/admin/login")
  }

  function handleProductChange(event) {
    const { name, value } = event.target

    setProductForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  function openAddProduct() {
    setEditingProduct(null)

    setProductForm({
      name: "",
      description: "",
      price: "",
      image_url: "",
      is_available: true,
    })

    setSelectedImage(null)
    setShowProductForm(true)
    setError("")
    setSuccess("")
  }

  function openEditProduct(product) {
    setEditingProduct(product)

    setProductForm({
      name: product.name,
      description: product.description || "",
      price: product.price,
      image_url: product.image_url || "",
      is_available: product.is_available,
    })

    setSelectedImage(null)
    setShowProductForm(true)
    setError("")
    setSuccess("")
  }

  function closeProductForm() {
    setShowProductForm(false)
    setEditingProduct(null)
    setSelectedImage(null)
  }

  function handleImageChange(event) {
    const file = event.target.files[0]

    if (!file) {
      setSelectedImage(null)
      return
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ]

    if (!allowedTypes.includes(file.type)) {
      setError(
        "Only JPG, PNG and WEBP images are allowed."
      )
      event.target.value = ""
      setSelectedImage(null)
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError(
        "Image size must be less than 5MB."
      )
      event.target.value = ""
      setSelectedImage(null)
      return
    }

    setError("")
    setSelectedImage(file)
  }

  async function uploadImage() {
    if (!selectedImage) {
      return productForm.image_url
    }

    setUploadingImage(true)
    setError("")

    try {
      const formData = new FormData()

      formData.append(
        "file",
        selectedImage
      )

      const response = await fetch(
        "http://127.0.0.1:8000/admin/upload-image",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      )

      if (response.status === 401) {
        logout()
        return null
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Image upload failed"
        )
      }

      return data.image_url
    } catch (error) {
      console.error(error)
      throw error
    } finally {
      setUploadingImage(false)
    }
  }

  async function saveProduct(event) {
    event.preventDefault()

    setError("")
    setSuccess("")

    try {
      let imageUrl = productForm.image_url

      if (selectedImage) {
        imageUrl = await uploadImage()

        if (!imageUrl) {
          return
        }
      }

      const url = editingProduct
        ? `http://127.0.0.1:8000/admin/products/${editingProduct.id}`
        : "http://127.0.0.1:8000/admin/products"

      const method = editingProduct
        ? "PUT"
        : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: productForm.name,
          description:
            productForm.description,
          price: Number(productForm.price),
          image_url: imageUrl || null,
          is_available:
            productForm.is_available,
        }),
      })

      if (response.status === 401) {
        logout()
        return
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Failed to save product"
        )
      }

      setSuccess(
        editingProduct
          ? "Product updated successfully."
          : "Product created successfully."
      )

      closeProductForm()

      await loadProducts()
    } catch (error) {
      console.error(error)
      setError(error.message)
    }
  }

  async function deleteProduct(productId) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this product?"
    )

    if (!confirmed) {
      return
    }

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/admin/products/${productId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (response.status === 401) {
        logout()
        return
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Failed to delete product"
        )
      }

      setSuccess(
        "Product deleted successfully."
      )

      await loadProducts()
    } catch (error) {
      console.error(error)
      setError(error.message)
    }
  }

  async function toggleProduct(product) {
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/admin/products/${product.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            is_available:
              !product.is_available,
          }),
        }
      )

      if (response.status === 401) {
        logout()
        return
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Failed to update product"
        )
      }

      await loadProducts()
    } catch (error) {
      console.error(error)
      setError(error.message)
    }
  }

  async function updateOrderStatus(
    orderId,
    status
  ) {
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/admin/orders/${orderId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status,
          }),
        }
      )

      if (response.status === 401) {
        logout()
        return
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Failed to update order"
        )
      }

      await loadOrders()
    } catch (error) {
      console.error(error)
      setError(error.message)
    }
  }

  return (
    <div className="admin-dashboard">

      <header className="admin-header">

        <div>
          <h1>Admin Dashboard</h1>

          <p>
            Manage products and orders
          </p>
        </div>

        <div className="admin-header-actions">

          <button
            onClick={() => navigate("/")}
          >
            View Store
          </button>

          <button
            onClick={logout}
            className="logout-button"
          >
            Logout
          </button>

        </div>

      </header>

      <main className="admin-main">

        {error && (
          <div className="admin-error">
            <span>{error}</span>

            <button
              onClick={() => setError("")}
            >
              ×
            </button>
          </div>
        )}

        {success && (
          <div className="admin-success">
            <span>{success}</span>

            <button
              onClick={() => setSuccess("")}
            >
              ×
            </button>
          </div>
        )}

        <section className="admin-section">

          <div className="section-header">

            <div>
              <h2>Products</h2>

              <p>
                Manage products shown in your store.
              </p>
            </div>

            <button
              className="primary-admin-button"
              onClick={openAddProduct}
            >
              + Add Product
            </button>

          </div>

          {showProductForm && (
            <div className="product-form-card">

              <div className="section-header">

                <h3>
                  {editingProduct
                    ? "Edit Product"
                    : "Add Product"}
                </h3>

                <button
                  className="close-button"
                  onClick={closeProductForm}
                >
                  ×
                </button>

              </div>

              <form onSubmit={saveProduct}>

                <label>
                  Product Name
                </label>

                <input
                  type="text"
                  name="name"
                  value={productForm.name}
                  onChange={
                    handleProductChange
                  }
                  required
                />

                <label>
                  Description
                </label>

                <textarea
                  name="description"
                  value={
                    productForm.description
                  }
                  onChange={
                    handleProductChange
                  }
                />

                <label>
                  Price
                </label>

                <input
                  type="number"
                  name="price"
                  value={productForm.price}
                  onChange={
                    handleProductChange
                  }
                  min="0"
                  step="0.01"
                  required
                />

                <label>
                  Product Image
                </label>

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                />

                {selectedImage && (
                  <p className="selected-file">
                    Selected:{" "}
                    {selectedImage.name}
                  </p>
                )}

                {productForm.image_url &&
                  !selectedImage && (
                    <div className="current-image-preview">

                      <img
                        src={
                          productForm.image_url
                        }
                        alt="Current product"
                      />

                      <p>
                        Current product image
                      </p>

                    </div>
                  )}

                <label className="checkbox-label">

                  <input
                    type="checkbox"
                    checked={
                      productForm.is_available
                    }
                    onChange={(event) =>
                      setProductForm(
                        (current) => ({
                          ...current,
                          is_available:
                            event.target
                              .checked,
                        })
                      )
                    }
                  />

                  Product is available

                </label>

                <div className="form-actions">

                  <button
                    type="submit"
                    className="primary-admin-button"
                    disabled={uploadingImage}
                  >
                    {uploadingImage
                      ? "Uploading Image..."
                      : editingProduct
                      ? "Update Product"
                      : "Create Product"}
                  </button>

                  <button
                    type="button"
                    className="secondary-admin-button"
                    onClick={
                      closeProductForm
                    }
                  >
                    Cancel
                  </button>

                </div>

              </form>

            </div>
          )}

          {loadingProducts ? (

            <p>Loading products...</p>

          ) : products.length === 0 ? (

            <p>No products found.</p>

          ) : (

            <div className="admin-products-grid">

              {products.map((product) => (

                <div
                  className="admin-product-card"
                  key={product.id}
                >

                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                    />
                  ) : (
                    <div className="admin-no-image">
                      No Image
                    </div>
                  )}

                  <div className="admin-product-info">

                    <h3>
                      {product.name}
                    </h3>

                    <p>
                      {product.description ||
                        "No description"}
                    </p>

                    <strong>
                      ₹
                      {Number(
                        product.price
                      ).toFixed(2)}
                    </strong>

                    <span
                      className={
                        product.is_available
                          ? "available-badge"
                          : "unavailable-badge"
                      }
                    >
                      {product.is_available
                        ? "Available"
                        : "Disabled"}
                    </span>

                    <div className="admin-product-actions">

                      <button
                        onClick={() =>
                          openEditProduct(
                            product
                          )
                        }
                      >
                        Edit
                      </button>

                      <button
                        onClick={() =>
                          toggleProduct(
                            product
                          )
                        }
                      >
                        {product.is_available
                          ? "Disable"
                          : "Enable"}
                      </button>

                      <button
                        className="danger-button"
                        onClick={() =>
                          deleteProduct(
                            product.id
                          )
                        }
                      >
                        Delete
                      </button>

                    </div>

                  </div>

                </div>

              ))}

            </div>

          )}

        </section>

        <section className="admin-section">

          <div className="section-header">

            <div>
              <h2>Orders</h2>

              <p>
                View and manage customer orders.
              </p>
            </div>

            <button
              className="secondary-admin-button"
              onClick={loadOrders}
            >
              Refresh
            </button>

          </div>

          {loadingOrders ? (

            <p>Loading orders...</p>

          ) : orders.length === 0 ? (

            <p>No orders found.</p>

          ) : (

            <div className="orders-list">

              {orders.map((order) => (

                <div
                  className="admin-order-card"
                  key={order.id}
                >

                  <div className="order-header">

                    <div>
                      <h3>
                        Order #{order.id}
                      </h3>

                      <p>
                        {new Date(
                          order.created_at
                        ).toLocaleString()}
                      </p>
                    </div>

                    <select
                      value={order.status}
                      onChange={(event) =>
                        updateOrderStatus(
                          order.id,
                          event.target.value
                        )
                      }
                    >
                      <option value="pending">
                        Pending
                      </option>

                      <option value="confirmed">
                        Confirmed
                      </option>

                      <option value="processing">
                        Processing
                      </option>

                      <option value="shipped">
                        Shipped
                      </option>

                      <option value="delivered">
                        Delivered
                      </option>

                      <option value="cancelled">
                        Cancelled
                      </option>
                    </select>

                  </div>

                  <div className="customer-info">

                    <h4>
                      Customer
                    </h4>

                    <p>
                      <strong>Name:</strong>{" "}
                      {order.customer?.name}
                    </p>

                    <p>
                      <strong>Phone:</strong>{" "}
                      {order.customer?.phone}
                    </p>

                    <p>
                      <strong>Address:</strong>{" "}
                      {order.customer?.address},{" "}
                      {order.customer?.city} -{" "}
                      {order.customer?.pincode}
                    </p>

                  </div>

                  <div className="order-items">

                    <h4>
                      Items
                    </h4>

                    {order.items.map(
                      (item) => (

                        <div
                          className="admin-order-item"
                          key={item.id}
                        >

                          <div>

                            <strong>
                              {
                                item.products
                                  ?.name
                              }
                            </strong>

                            <p>
                              ₹
                              {Number(
                                item.unit_price
                              ).toFixed(2)}
                              {" "}×{" "}
                              {item.quantity}
                            </p>

                          </div>

                          <strong>
                            ₹
                            {Number(
                              item.total_price
                            ).toFixed(2)}
                          </strong>

                        </div>
                      )
                    )}

                  </div>

                  <div className="admin-order-total">

                    <span>
                      Total
                    </span>

                    <strong>
                      ₹
                      {Number(
                        order.total_price
                      ).toFixed(2)}
                    </strong>

                  </div>

                </div>

              ))}

            </div>

          )}

        </section>

      </main>

    </div>
  )
}

export default AdminDashboard