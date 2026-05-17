import { useEffect, useState } from "react";

function UserDashboard({ user }) {
  const [stores, setStores] = useState([]);
  const [searchName, setSearchName] = useState("");
  const [searchAddress, setSearchAddress] = useState("");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ oldPassword: "", newPassword: "" });
  const [ratingModal, setRatingModal] = useState({ show: false, storeId: null, storeName: "", currentRating: null });

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      const response = await fetch("http://localhost:5000/stores/with-user", {
        credentials: "include"
      });
      if (response.ok) {
        const data = await response.json();
        setStores(data);
      }
    } catch (error) {
      console.error("Error fetching stores:", error);
    }
  };

  const handleSearch = async () => {
    try {
      const params = new URLSearchParams();
      if (searchName) params.append("name", searchName);
      if (searchAddress) params.append("address", searchAddress);

      const response = await fetch(`http://localhost:5000/stores/search?${params.toString()}`, {
        credentials: "include"
      });
      if (response.ok) {
        const data = await response.json();
        setStores(data);
      }
    } catch (error) {
      console.error("Error searching stores:", error);
    }
  };

  const handleClearSearch = () => {
    setSearchName("");
    setSearchAddress("");
    fetchStores();
  };

  const openRatingModal = (store) => {
    setRatingModal({
      show: true,
      storeId: store.id,
      storeName: store.name,
      currentRating: store.submitted_rating
    });
  };

  const closeRatingModal = () => {
    setRatingModal({ show: false, storeId: null, storeName: "", currentRating: null });
  };

  const handleSubmitRating = async (rating) => {
    try {
      const response = await fetch(`http://localhost:5000/ratings`, {
        method: ratingModal.currentRating ? "PUT" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          store_id: ratingModal.storeId,
          rating: parseFloat(rating)
        })
      });

      if (response.ok) {
        alert(ratingModal.currentRating ? "Rating updated!" : "Rating submitted!");
        closeRatingModal();
        fetchStores();
      } else {
        const data = await response.json();
        alert(data.message || "Failed to submit rating");
      }
    } catch (error) {
      console.error("Error submitting rating:", error);
      alert("Failed to submit rating");
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

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Stores</h2>
        <button className="btn btn-outline-secondary" onClick={() => setShowPasswordModal(true)}>
          Change Password
        </button>
      </div>

      {/* Search */}
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <input
                type="text"
                className="form-control"
                placeholder="Search by store name"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
              />
            </div>
            <div className="col-md-4">
              <input
                type="text"
                className="form-control"
                placeholder="Search by address"
                value={searchAddress}
                onChange={(e) => setSearchAddress(e.target.value)}
              />
            </div>
            <div className="col-md-4 d-flex gap-2">
              <button className="btn btn-primary" onClick={handleSearch}>Search</button>
              <button className="btn btn-outline-secondary" onClick={handleClearSearch}>Clear</button>
            </div>
          </div>
        </div>
      </div>

      {/* Stores List */}
      <div className="row g-4">
        {stores.map((store) => (
          <div className="col-md-6 col-lg-4" key={store.id}>
            <div className="card h-100 shadow-sm">
              <div className="card-body">
                <h5 className="card-title">{store.name}</h5>
                <p className="card-text text-muted">{store.address}</p>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <span className="badge bg-warning text-dark me-2">
                      ⭐ {store.overall_rating || 0}
                    </span>
                    {store.submitted_rating && (
                      <span className="badge bg-info">
                        Your rating: {store.submitted_rating}
                      </span>
                    )}
                  </div>
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => openRatingModal(store)}
                  >
                    {store.submitted_rating ? "Update Rating" : "Rate"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {stores.length === 0 && (
        <div className="text-center text-muted py-5">
          <p>No stores found.</p>
        </div>
      )}

      {/* Rating Modal */}
      {ratingModal.show && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Rate: {ratingModal.storeName}</h5>
                <button type="button" className="btn-close" onClick={closeRatingModal}></button>
              </div>
              <div className="modal-body">
                <p className="mb-3">
                  {ratingModal.currentRating
                    ? `Your current rating: ${ratingModal.currentRating}`
                    : "Submit your rating for this store"}
                </p>
                <div className="d-flex gap-2 justify-content-center">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      className={`btn btn-lg ${
                        ratingModal.currentRating === num ? "btn-warning" : "btn-outline-warning"
                      }`}
                      onClick={() => handleSubmitRating(num)}
                    >
                      ⭐ {num}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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

export default UserDashboard;