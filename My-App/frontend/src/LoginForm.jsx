import { useState } from "react";
import {
  getRulesText,
  validateEmailFormat,
  validatePassword
} from "./utils/credentialRules";

function LoginForm({ onLogin, onSwitchToSignup }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const rules = getRulesText();

  const handleChange = (e) => {
    const { name, value } = e.target;
    const next = { ...form, [name]: value };
    setForm(next);

    // Live validate only the changed field
    if (name === "email") {
      setFieldErrors((prev) => ({
        ...prev,
        email: validateEmailFormat(value) ? "" : "Invalid email format"
      }));
    } else if (name === "password") {
      setFieldErrors((prev) => ({
        ...prev,
        password: validatePassword(value) ? "" : "Invalid password format"
      }));
    }
  };

  const validate = () => {
    const nextErrors = {};
    if (!validateEmailFormat(form.email)) nextErrors.email = "Invalid email format";
    if (!validatePassword(form.password))
      nextErrors.password = "Password must be 8-16 chars, include uppercase and a special character";
    return nextErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const nextFieldErrors = validate();
    setFieldErrors(nextFieldErrors);
    if (Object.keys(nextFieldErrors).length > 0) return;

    try {
      const response = await fetch("http://localhost:5000/login", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      onLogin(data);
    } catch (err) {
      setError(err.message || "Login failed. Please check your credentials.");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="alert alert-danger mb-3" role="alert">
          {error}
        </div>
      )}

      <div className="mb-3">
        <label className="form-label fw-semibold">Email</label>
        <div className="text-muted" style={{ fontSize: "0.85rem" }}>{rules.email}</div>
        <input
          type="email"
          name="email"
          className="form-control"
          placeholder="Enter your email"
          value={form.email}
          onChange={handleChange}
          required
        />
        {fieldErrors.email && (
          <div className="text-danger" style={{ fontSize: "0.85rem" }}>
            {fieldErrors.email}
          </div>
        )}
      </div>

      <div className="mb-4">
        <label className="form-label fw-semibold">Password</label>
        <div className="text-muted" style={{ fontSize: "0.85rem" }}>{rules.password}</div>
        <input
          type="password"
          name="password"
          className="form-control"
          placeholder="Enter your password"
          value={form.password}
          onChange={handleChange}
          required
        />
        {fieldErrors.password && (
          <div className="text-danger" style={{ fontSize: "0.85rem" }}>
            {fieldErrors.password}
          </div>
        )}
      </div>

      <button type="submit" className="btn btn-primary w-100 mb-3">
        Login
      </button>

      <div className="text-center">
        <p className="text-muted mb-0">
          Don't have an account?{" "}
          <a
            href="#"
            className="text-primary text-decoration-none fw-semibold"
            onClick={onSwitchToSignup}
          >
            Sign Up
          </a>
        </p>
      </div>

      <hr className="my-4" />

      <div className="text-muted" style={{ fontSize: "0.85rem" }}>
        <p className="mb-2 fw-semibold">Demo Credentials:</p>
        <p className="mb-1">
          <strong>Admin:</strong> admin1@shopstores.com / Admin@123
        </p>
        <p className="mb-1">
          <strong>User:</strong> user1@shopstores.com / User@123
        </p>
        <p className="mb-0">
          <strong>Store Owner:</strong> owner1@shopstores.com / Owner@123
        </p>
      </div>
    </form>
  );
}

export default LoginForm;
