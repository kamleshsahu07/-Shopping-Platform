import { useState } from "react";
import AddUserForm from "./AddUserForm";
import AddStoreForm from "./AddStoreForm";
import AddAdminForm from "./AddAdminForm";

const SECTION_CONFIG = [
  { key: "users", label: "Users" },
  { key: "stores", label: "Stores" },
  { key: "ratings", label: "Ratings" },
  { key: "admins", label: "Admins" }
];

function AdminDashboard({ user }) {
  const [data, setData] = useState({
    users: [],
    stores: [],
    ratings: [],
    admins: []
  });
  const [activeSection, setActiveSection] = useState("users");
  const [activeForm, setActiveForm] = useState(null);
  const [userFilters, setUserFilters] = useState({ name: "", email: "", address: "", role: "" });
  const [storeFilters, setStoreFilters] = useState({ name: "", email: "", address: "", rating: "" });
  const [ratingFilters, setRatingFilters] = useState({ user_id: "", store_id: "", rating: "" });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ oldPassword: "", newPassword: "" });
  const [isResetting, setIsResetting] = useState(false);

  const fetchAdminData = async () => {
    try {
      const res = await fetch("http://localhost:5000/admin", { credentials: "include" });
      if (res.ok) {
        const result = await res.json();
        setData({
          users: result.users || [],
          stores: result.stores || [],
          ratings: result.ratings || [],
          admins: result.admins || []
        });
      }
    } catch (err) {
      console.error("ERROR:", err);
    }
  };

  const handleSectionChange = (sectionKey) => {
    setActiveSection(sectionKey);
    setActiveForm(null);
  };

  const toggleForm = (formType) => {
    setActiveForm(activeForm === formType ? null : formType);
  };

  const handleAddUser = async (newUser) => {
    try {
      const response = await fetch("http://localhost:5000/users", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newUser, role: newUser.role || "USER" })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      alert("User Added");
      fetchAdminData();
      setActiveForm(null);
    } catch (error) {
      alert(error.message);
    }
  };

  const handleAddStore = async (newStore) => {
    try {
      const response = await fetch("http://localhost:5000/stores", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newStore,
          owner_id: newStore.owner_id ? Number(newStore.owner_id) : null,
          rating: newStore.rating ? Number(newStore.rating) : null
        })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      alert("Store Added");
      fetchAdminData();
      setActiveForm(null);
    } catch (error) {
      alert(error.message);
    }
  };

  const handleAddAdmin = async (newAdmin) => {
    try {
      const response = await fetch("http://localhost:5000/admins", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newAdmin, role: "ADMIN" })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      alert("Admin Added");
      fetchAdminData();
      setActiveForm(null);
    } catch (error) {
      alert(error.message);
    }
  };

  const handleResetData = async () => {
    if (!window.confirm("Are you sure you want to delete ALL data and reset to fresh sample data? This will create 3 admins, 4 store owners, 24 users, 12 stores, and ratings.")) {
      return;
    }

    setIsResetting(true);
    try {
      const response = await fetch("http://localhost:5000/admin/reset-data", {
        method: "POST",
        credentials: "include"
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message);

      alert(result.message);
      // Refresh the data after reset
      setTimeout(() => {
        fetchAdminData();
      }, 2000);
    } catch (error) {
      alert("Error resetting data: " + error.message);
    } finally {
      setIsResetting(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:5000/users/${user.id}/password`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(passwordForm)
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      alert("Password updated!");
      setShowPasswordModal(false);
      setPasswordForm({ oldPassword: "", newPassword: "" });
    } catch (error) {
      alert(error.message);
    }
  };

  const sectionTitle = SECTION_CONFIG.find((item) => item.key === activeSection)?.label || "Users";
  const filteredUsers = (data.users || []).filter((u) =>
    u.name.toLowerCase().includes(userFilters.name.toLowerCase()) &&
    u.email.toLowerCase().includes(userFilters.email.toLowerCase()) &&
    (u.address || "").toLowerCase().includes(userFilters.address.toLowerCase()) &&
    (userFilters.role === "" || u.role === userFilters.role)
  );
  const filteredStores = (data.stores || []).filter((s) =>
    s.name.toLowerCase().includes(storeFilters.name.toLowerCase()) &&
    (s.email || "").toLowerCase().includes(storeFilters.email.toLowerCase()) &&
    (s.address || "").toLowerCase().includes(storeFilters.address.toLowerCase()) &&
    (storeFilters.rating === "" || (s.rating !== null && s.rating >= parseFloat(storeFilters.rating)))
  );
  const filteredRatings = (data.ratings || []).filter((r) =>
    (ratingFilters.user_id === "" || r.user_id.toString().includes(ratingFilters.user_id)) &&
    (ratingFilters.store_id === "" || r.store_id.toString().includes(ratingFilters.store_id)) &&
    (ratingFilters.rating === "" || r.rating >= parseFloat(ratingFilters.rating))
  );
  const displayedAdmins = (data.admins || []).length > 0 ? data.admins : (data.users || []).filter((u) => u.role === "ADMIN");

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Admin Workspace</h2>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-danger" onClick={handleResetData} disabled={isResetting}>
            {isResetting ? "Resetting..." : "Reset All Data"}
          </button>
          <button className="btn btn-outline-secondary" onClick={() => setShowPasswordModal(true)}>
            Change Password
          </button>
        </div>
      </div>

      <div className="btn-group mb-4" role="group">
        {SECTION_CONFIG.map((section) => (
          <button
            key={section.key}
            type="button"
            className={`btn ${activeSection === section.key ? "btn-primary" : "btn-outline-primary"}`}
            onClick={() => handleSectionChange(section.key)}
          >
            {section.label}
          </button>
        ))}
      </div>

      <div className="card shadow-sm">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">{sectionTitle}</h5>
          <div className="d-flex gap-2">
            {activeSection === "users" && (
              <button className="btn btn-primary btn-sm" onClick={() => toggleForm("user")}>
                {activeForm === "user" ? "Close" : "Add User"}
              </button>
            )}
            {activeSection === "stores" && (
              <button className="btn btn-primary btn-sm" onClick={() => toggleForm("store")}>
                {activeForm === "store" ? "Close" : "Add Store"}
              </button>
            )}
            {activeSection === "admins" && (
              <button className="btn btn-primary btn-sm" onClick={() => toggleForm("admin")}>
                {activeForm === "admin" ? "Close" : "Add Admin"}
              </button>
            )}
          </div>
        </div>

        <div className="card-body">
          {activeSection === "users" && (
            <>
              <div className="row g-3 mb-4">
                <div className="col-md-3">
                  <input type="text" className="form-control" placeholder="Search name" value={userFilters.name} onChange={(e) => setUserFilters({ ...userFilters, name: e.target.value })} />
                </div>
                <div className="col-md-3">
                  <input type="text" className="form-control" placeholder="Search email" value={userFilters.email} onChange={(e) => setUserFilters({ ...userFilters, email: e.target.value })} />
                </div>
                <div className="col-md-3">
                  <input type="text" className="form-control" placeholder="Search address" value={userFilters.address} onChange={(e) => setUserFilters({ ...userFilters, address: e.target.value })} />
                </div>
                <div className="col-md-3">
                  <select className="form-select" value={userFilters.role} onChange={(e) => setUserFilters({ ...userFilters, role: e.target.value })}>
                    <option value="">All Roles</option>
                    <option value="USER">USER</option>
                    <option value="ADMIN">ADMIN</option>
                    <option value="STORE_OWNER">STORE_OWNER</option>
                  </select>
                </div>
              </div>
              <table className="table table-hover">
                <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th></tr></thead>
                <tbody>
                  {filteredUsers.map((u) => <tr key={u.id}><td>{u.id}</td><td>{u.name}</td><td>{u.email}</td><td>{u.role}</td></tr>)}
                </tbody>
              </table>
            </>
          )}

          {activeSection === "stores" && (
            <>
              <div className="row g-3 mb-4">
                <div className="col-md-3">
                  <input type="text" className="form-control" placeholder="Search store" value={storeFilters.name} onChange={(e) => setStoreFilters({ ...storeFilters, name: e.target.value })} />
                </div>
                <div className="col-md-3">
                  <input type="text" className="form-control" placeholder="Search email" value={storeFilters.email} onChange={(e) => setStoreFilters({ ...storeFilters, email: e.target.value })} />
                </div>
                <div className="col-md-3">
                  <input type="text" className="form-control" placeholder="Search address" value={storeFilters.address} onChange={(e) => setStoreFilters({ ...storeFilters, address: e.target.value })} />
                </div>
                <div className="col-md-3">
                  <input type="number" className="form-control" placeholder="Min rating" value={storeFilters.rating} onChange={(e) => setStoreFilters({ ...storeFilters, rating: e.target.value })} min="0" max="5" step="0.1" />
                </div>
              </div>
              <table className="table table-hover">
                <thead><tr><th>ID</th><th>Store</th><th>Email</th><th>Address</th><th>Rating</th><th>Owner ID</th></tr></thead>
                <tbody>
                  {filteredStores.map((s) => <tr key={s.id}><td>{s.id}</td><td>{s.name}</td><td>{s.email}</td><td>{s.address}</td><td>{s.rating}</td><td>{s.owner_id || "-"}</td></tr>)}
                </tbody>
              </table>
            </>
          )}

          {activeSection === "ratings" && (
            <>
              <div className="row g-3 mb-4">
                <div className="col-md-4">
                  <input type="text" className="form-control" placeholder="Filter by user ID" value={ratingFilters.user_id} onChange={(e) => setRatingFilters({ ...ratingFilters, user_id: e.target.value })} />
                </div>
                <div className="col-md-4">
                  <input type="text" className="form-control" placeholder="Filter by store ID" value={ratingFilters.store_id} onChange={(e) => setRatingFilters({ ...ratingFilters, store_id: e.target.value })} />
                </div>
                <div className="col-md-4">
                  <input type="number" className="form-control" placeholder="Min rating" value={ratingFilters.rating} onChange={(e) => setRatingFilters({ ...ratingFilters, rating: e.target.value })} min="1" max="5" step="0.1" />
                </div>
              </div>
              <table className="table table-hover">
                <thead><tr><th>ID</th><th>User ID</th><th>Store ID</th><th>Rating</th></tr></thead>
                <tbody>
                  {filteredRatings.map((r) => <tr key={r.id}><td>{r.id}</td><td>{r.user_id}</td><td>{r.store_id}</td><td>{r.rating}</td></tr>)}
                </tbody>
              </table>
            </>
          )}

          {activeSection === "admins" && (
            <table className="table table-hover">
              <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th></tr></thead>
              <tbody>
                {displayedAdmins.map((a) => <tr key={a.id}><td>{a.id}</td><td>{a.name}</td><td>{a.email}</td><td>{a.role}</td></tr>)}
              </tbody>
            </table>
          )}

          {activeForm && (
            <div className="mt-4 p-4 border rounded bg-light">
              <h5>{activeForm === "user" ? "Add User" : activeForm === "store" ? "Add Store" : "Add Admin"}</h5>
              {activeForm === "user" && <AddUserForm onClose={() => setActiveForm(null)} onAddUser={handleAddUser} />}
              {activeForm === "store" && <AddStoreForm users={data.users} stores={data.stores} onClose={() => setActiveForm(null)} onAddStore={handleAddStore} />}
              {activeForm === "admin" && <AddAdminForm onClose={() => setActiveForm(null)} onAddAdmin={handleAddAdmin} />}
            </div>
          )}
        </div>
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Change Password</h5>
                <button type="button" className="btn-close" onClick={() => setShowPasswordModal(false)}></button>
              </div>
              <form onSubmit={handlePasswordChange}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Current Password</label>
                    <input type="password" className="form-control" value={passwordForm.oldPassword} onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">New Password</label>
                    <input type="password" className="form-control" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} required />
                    <small className="text-muted">Min 8 chars, 1 uppercase, 1 special character</small>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowPasswordModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Update</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;