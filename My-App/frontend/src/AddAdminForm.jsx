import { useState } from "react";
import {
  getRulesText,
  validateEmailFormat,
  validatePassword,
  validateAddress,
  validateUsernameMinMax
} from "./utils/credentialRules";

function AddAdminForm({ onClose, onAddAdmin }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    address: ""
  });

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
    } else if (name === "password") {
      setFieldErrors((prev) => ({
        ...prev,
        password: validatePassword(value)
          ? ""
          : "Password must be 8-16 chars, include uppercase and a special character"
      }));
    } else if (name === "address") {
      setFieldErrors((prev) => ({
        ...prev,
        address: validateAddress(value) ? "" : "Address must be max 400 characters"
      }));
    }
  };

  const validateAll = () => {
    const nextErrors = {};

    if (!validateUsernameMinMax(form.name)) nextErrors.name = "Name must be 20-60 characters";
    if (!validateEmailFormat(form.email)) nextErrors.email = "Invalid email format";
    if (!validatePassword(form.password))
      nextErrors.password = "Password must be 8-16 chars, include uppercase and a special character";
    if (!validateAddress(form.address)) nextErrors.address = "Address must be max 400 characters";

    return nextErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const nextFieldErrors = validateAll();
    setFieldErrors(nextFieldErrors);
    if (Object.keys(nextFieldErrors).length > 0) return;

    const adminData = { ...form, role: "ADMIN" };
    if (typeof onAddAdmin === "function") {
      onAddAdmin(adminData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="row g-3">
      <div className="col-12 col-md-6">
        <label className="form-label fw-semibold">Name</label>
        <div className="text-muted" style={{ fontSize: "0.85rem" }}>{rules.name}</div>
        <input
          type="text"
          name="name"
          className="form-control"
          placeholder="Enter name"
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

      <div className="col-12 col-md-6">
        <label className="form-label fw-semibold">Email</label>
        <div className="text-muted" style={{ fontSize: "0.85rem" }}>{rules.email}</div>
        <input
          type="email"
          name="email"
          className="form-control"
          placeholder="Enter email"
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

      <div className="col-12 col-md-6">
        <label className="form-label fw-semibold">Password</label>
        <div className="text-muted" style={{ fontSize: "0.85rem" }}>{rules.password}</div>
        <input
          type="password"
          name="password"
          className="form-control"
          placeholder="Enter password"
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

      <div className="col-12 col-md-6">
        <label className="form-label fw-semibold">Address</label>
        <div className="text-muted" style={{ fontSize: "0.85rem" }}>{rules.address}</div>
        <textarea
          name="address"
          className="form-control"
          placeholder="Enter address"
          value={form.address}
          onChange={handleChange}
          rows={3}
        />
        {fieldErrors.address && (
          <div className="text-danger" style={{ fontSize: "0.85rem" }}>
            {fieldErrors.address}
          </div>
        )}
      </div>

      <div className="col-12 d-flex gap-3 justify-content-end">
        <button type="button" className="btn btn-outline-secondary btn-md px-4" onClick={onClose}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary btn-md px-4">
          Save Admin
        </button>
      </div>
    </form>
  );
}

export default AddAdminForm;
