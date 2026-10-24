import { useState } from "react"
import { useNavigate } from "react-router-dom"

function AdminLogin() {
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    username: "",
    password: "",
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


  async function handleLogin(event) {
    event.preventDefault()

    setLoading(true)
    setError("")

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/admin/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.detail || "Login failed"
        )
      }

      localStorage.setItem(
        "admin_token",
        data.access_token
      )

      navigate("/admin")

    } catch (error) {
      console.error(error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }


  return (
    <main className="admin-login-page">

      <div className="admin-login-card">

        <h2>Admin Login</h2>

        <p className="admin-login-subtitle">
          Sign in to manage your store
        </p>


        <form onSubmit={handleLogin}>

          <label>
            Username
          </label>

          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="Enter username"
            required
          />


          <label>
            Password
          </label>

          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter password"
            required
          />


          {error && (
            <p className="error-message">
              {error}
            </p>
          )}


          <button
            type="submit"
            className="admin-login-button"
            disabled={loading}
          >
            {loading
              ? "Logging in..."
              : "Login"}
          </button>

        </form>


        <button
          className="back-to-store-button"
          onClick={() => navigate("/")}
        >
          Back to Store
        </button>

      </div>

    </main>
  )
}

export default AdminLogin