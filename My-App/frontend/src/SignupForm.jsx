import { useState } from "react";
import {
  getRulesText,
  validateEmailFormat,
  validatePassword,
  validateAddress,
  validateUsernameMinMax
} from "./utils/credentialRules";

function SignupForm({ onSignupSuccess, onSwitchToLogin }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    address: "",
    password: ""
  });
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const rules = getRulesText();

  const handleChange = (e) => {
    const { name, value } = e.target;
    const next = { ...form, [name]: value };
    setForm(next);

    if (name === "name") {
      setFieldErrors((prev) => ({
        ...prev,
        name: validateUsernameMinMax(value) ? "" : "Name must be 20-60 characters"
      }));
    } else if (name === "email") {
      setFieldErrors((prev) => ({
        ...prev,
        email: validateEmailFormat(value) ? "" : "Invalid email format"
      }));
    } else if (name === "address") {
      setFieldErrors((prev) => ({
        ...prev,
        address: validateAddress(value) ? "" : "Address must be max 400 characters"
      }));
    } else if (name === "password") {
      setFieldErrors((prev) => ({
        ...prev,
        password: validatePassword(value)
          ? ""
          : "Password must be 8-16 chars, include uppercase and a special character"
      }));
    }
  };

  const validateAll = () => {
    const nextErrors = {};

    if (!validateUsernameMinMax(form.name)) nextErrors.name = "Name must be 20-60 characters";
    if (!validateEmailFormat(form.email)) nextErrors.email = "Invalid email format";
    if (!validateAddress(form.address)) nextErrors.address = "Address must be max 400 characters";
    if (!validatePassword(form.password))
      nextErrors.password = "Password must be 8-16 chars, include uppercase and a special character";

    return nextErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const nextFieldErrors = validateAll();
    setFieldErrors(nextFieldErrors);
    if (Object.keys(nextFieldErrors).length > 0) return;

    try {
      const response = await fetch("http://localhost:5000/signup", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Signup failed");
      }

      alert("Account created successfully! Please login.");
      onSignupSuccess();
    } catch (err) {
      setError(err.message || "Signup failed. Please try again.");
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
        <label className="form-label fw-semibold">Name</label>
        <div className="text-muted" style={{ fontSize: "0.85rem" }}>{rules.name}</div>
        <input
          type="text"
          name="name"
          className="form-control"
          placeholder="Enter your name"
          value={form.name}
          onChange={handleChange}
          required
        />
        {fieldErrors.name && (
          <div className="text-danger" style={{ fontSize: "0.85rem" }}>
            {fieldErrors.name}
          </div>
        )}
      </div>

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

      <div className="mb-3">
        <label className="form-label fw-semibold">Address</label>
        <div className="text-muted" style={{ fontSize: "0.85rem" }}>{rules.address}</div>
        <textarea
          name="address"
          className="form-control"
          placeholder="Enter your address"
          value={form.address}
          onChange={handleChange}
          rows={2}
        />
        {fieldErrors.address && (
          <div className="text-danger" style={{ fontSize: "0.85rem" }}>
            {fieldErrors.address}
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
          placeholder="Create a password"
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
        Sign Up
      </button>

      <div className="text-center">
        <p className="text-muted mb-0">
          Already have an account?{" "}
          <a
            href="#"
            className="text-primary text-decoration-none fw-semibold"
            onClick={onSwitchToLogin}
          >
            Login
          </a>
        </p>
      </div>
    </form>
  );
}

export default SignupForm;
