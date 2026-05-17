import { useState } from "react";
import {
  getRulesText,
  validateEmailFormat,
  validateAddress
} from "./utils/credentialRules";

function AddStoreForm({ users, stores, onClose, onAddStore }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    address: "",
    owner_id: "",
    rating: ""
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const rules = getRulesText();

  // Filter only STORE_OWNER users and count their stores
  const storeOwners = (users || []).filter((u) => u.role === "STORE_OWNER").map((owner) => {
    const ownerStores = (stores || []).filter((s) => s.owner_id === owner.id);
    return {
      ...owner,
      storeCount: ownerStores.length,
      storeNames: ownerStores.map((s) => s.name).join(", ") || "No stores yet"
    };
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    const next = { ...form, [name]: value };
    setForm(next);

    if (name === "email") {
      setFieldErrors((prev) => ({
        ...prev,
        email: validateEmailFormat(value) ? "" : "Invalid email format"
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
    if (form.email && !validateEmailFormat(form.email)) nextErrors.email = "Invalid email format";
    if (form.address && !validateAddress(form.address))
      nextErrors.address = "Address must be max 400 characters";
    return nextErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const nextFieldErrors = validateAll();
    setFieldErrors(nextFieldErrors);
    if (Object.keys(nextFieldErrors).length > 0) return;

    if (typeof onAddStore === "function") {
      onAddStore(form);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="row g-3">
      <div className="col-12 col-md-6">
        <label className="form-label fw-semibold">Store Name</label>
        <input
          type="text"
          name="name"
          className="form-control"
          placeholder="Store name"
          value={form.name}
          onChange={handleChange}
          required
        />
      </div>

      <div className="col-12 col-md-6">
        <label className="form-label fw-semibold">Store Email</label>
        <div className="text-muted" style={{ fontSize: "0.85rem" }}>{rules.email}</div>
        <input
          type="email"
          name="email"
          className="form-control"
          placeholder="Store email"
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

      <div className="col-12">
        <label className="form-label fw-semibold">Address</label>
        <div className="text-muted" style={{ fontSize: "0.85rem" }}>{rules.address}</div>
        <textarea
          name="address"
          className="form-control"
          placeholder="Store address"
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

      <div className="col-12 col-md-6">
        <label className="form-label fw-semibold">Owner</label>
        <select
          name="owner_id"
          value={form.owner_id}
          onChange={handleChange}
          className="form-select"
        >
          <option value="">No owner</option>
          {storeOwners.map((owner) => (
            <option key={owner.id} value={owner.id}>
              {owner.name} - {owner.storeCount} store(s) ({owner.storeNames})
            </option>
          ))}
        </select>
        <small className="text-muted">Showing {storeOwners.length} store owner(s)</small>
      </div>

      <div className="col-12 col-md-6">
        <label className="form-label fw-semibold">Rating</label>
        <input
          type="number"
          name="rating"
          className="form-control"
          placeholder="1 - 5"
          value={form.rating}
          onChange={handleChange}
          min="1"
          max="5"
          step="0.1"
        />
      </div>

      <div className="col-12 d-flex gap-3 justify-content-end">
        <button
          type="button"
          className="btn btn-outline-secondary btn-md px-4"
          onClick={onClose}
        >
          Cancel
        </button>

        <button type="submit" className="btn btn-primary btn-md px-4">
          Save Store
        </button>
      </div>
    </form>
  );
}

export default AddStoreForm;
