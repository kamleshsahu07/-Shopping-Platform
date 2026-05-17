import { useEffect, useState } from "react";

function StoreOwnerDashboard({ user }) {
  const [storeData, setStoreData] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ oldPassword: "", newPassword: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStoreData();
    fetchRatings();
  }, []);

  const fetchStoreData = async () => {
    try {
      const response = await fetch("http://localhost:5000/stores/owner", {
        credentials: "include"
      });
      if (response.ok) {
        const data = await response.json();
        setStoreData(data.stores || []);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching store data:", error);
      setLoading(false);
    }
  };

  const fetchRatings = async () => {
    try {
      const response = await fetch("http://localhost:5000/stores/owner/ratings", {
        credentials: "include"
      });
      if (response.ok) {
        const data = await response.json();
        setRatings(data);
      }
    } catch (error) {
      console.error("Error fetching ratings:", error);
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

      const data = await response.json();

      if (response.ok) {
        alert("Password updated successfully!");
        setShowPasswordModal(false);
        setPasswordForm({ oldPassword: "", newPassword: "" });
      } else {
        alert(data.message || "Failed to update password");
      }
    } catch (error) {
      console.error("Error updating password:", error);
      alert("Failed to update password");
    }
  };

  const calculateAverage = () => {
    if (ratings.length === 0) return 0;
    const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
    return (sum / ratings.length).toFixed(1);
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Store Owner Dashboard</h2>
        <button className="btn btn-outline-secondary" onClick={() => setShowPasswordModal(false)}>
          Change Password
        </button>
      </div>

      {/* Store Stats */}
      <div className="row g-4 mb-4">
        {storeData.length > 0 ? (
          storeData.map((store, index) => {
            const storeRatings = ratings.filter(r => r.store_id === store.id);
            const avgRating = storeRatings.length > 0 
              ? (storeRatings.reduce((sum, r) => sum + r.rating, 0) / storeRatings.length).toFixed(1)
              : "0.0";
            
            return (
              <div key={store.id} className="col-md-4">
                <div className="card shadow-sm">
                  <div className="card-body">
                    <h6 className="text-muted">Store #{index + 1}</h6>
                    <h5>{store.name}</h5>
                    <p className="text-muted mb-2">{store.address}</p>
                    <div className="d-flex justify-content-between">
                      <span className="badge bg-warning text-dark">⭐ {avgRating}</span>
                      <span className="badge bg-info">{storeRatings.length} ratings</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-12">
            <div className="card shadow-sm">
              <div className="card-body text-center">
                <h6 className="text-muted">No store assigned to you yet</h6>
                <p className="text-muted">Contact admin to assign a store to your account.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Ratings List */}
      <div className="card shadow-sm">
        <div className="card-header">
          <h5 className="mb-0">User Ratings for Your Store</h5>
        </div>
        <div className="card-body">
          {ratings.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>User Name</th>
                    <th>User Email</th>
                    <th>Rating</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {ratings.map((rating) => (
                    <tr key={rating.id}>
                      <td>{rating.user_name}</td>
                      <td>{rating.user_email}</td>
                      <td>
                        <span className="badge bg-warning text-dark">
                          ⭐ {rating.rating}
                        </span>
                      </td>
                      <td>{new Date(rating.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center text-muted py-4">
              <p>No ratings yet for your store.</p>
            </div>
          )}
        </div>
      </div>

      {/* Password Change Modal */}
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
                    <input
                      type="password"
                      className="form-control"
                      value={passwordForm.oldPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">New Password</label>
                    <input
                      type="password"
                      className="form-control"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      required
                    />
                    <small className="text-muted">
                      Min 8 characters, include uppercase letter and special character
                    </small>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowPasswordModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Update Password</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StoreOwnerDashboard;