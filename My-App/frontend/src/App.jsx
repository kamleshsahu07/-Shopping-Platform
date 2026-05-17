import { useEffect, useState } from "react";
import "./App.css";
import LoginForm from "./LoginForm";
import SignupForm from "./SignupForm";
import AdminDashboard from "./AdminDashboard";
import UserDashboard from "./UserDashboard";
import StoreOwnerDashboard from "./StoreOwnerDashboard";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showLogin, setShowLogin] = useState(true);
  const [showSignup, setShowSignup] = useState(false);

  // Check if user is already logged in on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch("http://localhost:5000/me", {
        credentials: "include"
      });
      if (res.ok) {
        const user = await res.json();
        setIsLoggedIn(true);
        setCurrentUser(user);
      }
    } catch (error) {
      console.error("Auth check error:", error);
    }
  };

  const handleLogin = (user) => {
    setIsLoggedIn(true);
    setCurrentUser(user);
    setShowLogin(false);
  };

  const handleSignup = () => {
    setShowSignup(true);
    setShowLogin(false);
  };

  const handleLogout = async () => {
    try {
      await fetch("http://localhost:5000/logout", {
        method: "POST",
        credentials: "include"
      });
      setIsLoggedIn(false);
      setCurrentUser(null);
      setShowLogin(true);
      setShowSignup(false);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleSignupSuccess = () => {
    setShowSignup(false);
    setShowLogin(true);
  };

  // Show login/signup page if not logged in
  if (!isLoggedIn) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-5">
              <div className="card shadow-lg rounded-4 border-0">
                <div className="card-body p-5">
                  <div className="text-center mb-4">
                    <h1 className="h3 fw-bold text-primary">@Shopping</h1>
                    <p className="text-muted">Store Rating Platform</p>
                  </div>

                  {showLogin ? (
                    <LoginForm 
                      onLogin={handleLogin} 
                      onSwitchToSignup={handleSignup} 
                    />
                  ) : (
                    <SignupForm 
                      onSignupSuccess={handleSignupSuccess}
                      onSwitchToLogin={() => setShowSignup(false)}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show role-based dashboard
  return (
    <div>
      <nav className="navbar navbar-expand-lg bg-body-tertiary shadow-sm">
        <div className="container-fluid">
          <h2 className="navbar-brand mb-0">@Shopping</h2>
          <div className="d-flex align-items-center">
            <span className="text-muted me-3">
              Welcome, {currentUser?.name} ({currentUser?.role})
            </span>
            <button className="btn btn-primary" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="container-fluid px-4 px-md-5 py-5">
        {currentUser?.role === "ADMIN" && (
          <AdminDashboard user={currentUser} />
        )}
        {currentUser?.role === "USER" && (
          <UserDashboard user={currentUser} />
        )}
        {currentUser?.role === "STORE_OWNER" && (
          <StoreOwnerDashboard user={currentUser} />
        )}
      </main>
    </div>
  );
}

export default App;