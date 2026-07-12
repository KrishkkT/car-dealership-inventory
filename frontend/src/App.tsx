import React, { useState, useEffect } from 'react';
import { 
  Car, Search, LogOut, Plus, Edit2, Trash2, Shield, User, ShoppingBag, 
  RotateCcw, SlidersHorizontal, CheckCircle, AlertCircle, X, ChevronRight 
} from 'lucide-react';

const API_BASE = 'http://localhost:3000/api';

interface Vehicle {
  id: number;
  make: string;
  model: string;
  category: string;
  price: string | number;
  quantity: number;
}

interface DecodedUser {
  id: number;
  email: string;
  role: 'user' | 'admin';
}

export default function App() {
  // Auth State
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<DecodedUser | null>(
    localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null
  );
  
  // Navigation & Tabs
  const [view, setView] = useState<'dashboard' | 'auth'>(token ? 'dashboard' : 'auth');
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');

  // Input fields for Auth
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Vehicles Data State
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useState({
    make: '',
    model: '',
    category: '',
    minPrice: '',
    maxPrice: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  // Modal / Admin form states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  // Form states for adding/editing vehicles
  const [makeInput, setMakeInput] = useState('');
  const [modelInput, setModelInput] = useState('');
  const [categoryInput, setCategoryInput] = useState('');
  const [priceInput, setPriceInput] = useState('');
  const [quantityInput, setQuantityInput] = useState('');
  const [restockAmount, setRestockAmount] = useState<{ [id: number]: string }>({});

  // Feedback Notifications
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Auto-hide alerts
  useEffect(() => {
    if (errorMsg || successMsg) {
      const timer = setTimeout(() => {
        setErrorMsg(null);
        setSuccessMsg(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMsg, successMsg]);

  // Fetch Vehicles
  const fetchVehicles = async (params = searchParams) => {
    if (!token) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      // Build search URL
      const query = new URLSearchParams();
      if (params.make) query.append('make', params.make);
      if (params.model) query.append('model', params.model);
      if (params.category) query.append('category', params.category);
      if (params.minPrice) query.append('minPrice', params.minPrice);
      if (params.maxPrice) query.append('maxPrice', params.maxPrice);

      const url = `${API_BASE}/vehicles/search?${query.toString()}`;
      
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.status === 401) {
        handleLogout();
        return;
      }
      if (!res.ok) {
        throw new Error('Failed to fetch inventory');
      }
      const data = await res.json();
      setVehicles(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not fetch vehicles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchVehicles();
    }
  }, [token]);

  // Handle Authentication
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email || !password) {
      setErrorMsg('Please enter both email and password');
      return;
    }

    const endpoint = authTab === 'login' ? 'login' : 'register';

    try {
      const res = await fetch(`${API_BASE}/auth/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      if (authTab === 'register') {
        setSuccessMsg('Registration successful! Please log in.');
        setAuthTab('login');
        setPassword('');
      } else {
        // Logged in
        localStorage.setItem('token', data.token);
        
        // Decode token to extract payload
        const payloadBase64 = data.token.split('.')[1];
        const decodedUser = JSON.parse(atob(payloadBase64)) as DecodedUser;
        
        localStorage.setItem('user', JSON.stringify(decodedUser));
        setToken(data.token);
        setUser(decodedUser);
        setView('dashboard');
        setSuccessMsg('Successfully logged in!');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication error');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setView('auth');
    setVehicles([]);
  };

  // Add Vehicle
  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!makeInput || !modelInput || !categoryInput || !priceInput || !quantityInput) {
      setErrorMsg('Please fill in all fields');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/vehicles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          make: makeInput,
          model: modelInput,
          category: categoryInput,
          price: parseFloat(priceInput),
          quantity: parseInt(quantityInput)
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add vehicle');

      setSuccessMsg('Vehicle added successfully');
      setShowAddModal(false);
      
      // Reset inputs
      setMakeInput('');
      setModelInput('');
      setCategoryInput('');
      setPriceInput('');
      setQuantityInput('');
      
      fetchVehicles();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error adding vehicle');
    }
  };

  // Open Edit Modal
  const openEditModal = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setMakeInput(vehicle.make);
    setModelInput(vehicle.model);
    setCategoryInput(vehicle.category);
    setPriceInput(vehicle.price.toString());
    setQuantityInput(vehicle.quantity.toString());
    setShowEditModal(true);
  };

  // Update Vehicle
  const handleUpdateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle) return;

    try {
      const res = await fetch(`${API_BASE}/vehicles/${selectedVehicle.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          make: makeInput,
          model: modelInput,
          category: categoryInput,
          price: parseFloat(priceInput),
          quantity: parseInt(quantityInput)
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update vehicle');

      setSuccessMsg('Vehicle details updated');
      setShowEditModal(false);
      setSelectedVehicle(null);
      fetchVehicles();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error updating vehicle');
    }
  };

  // Purchase Vehicle
  const handlePurchase = async (vehicleId: number) => {
    try {
      const res = await fetch(`${API_BASE}/vehicles/${vehicleId}/purchase`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Purchase failed');

      setSuccessMsg('Vehicle purchased successfully!');
      fetchVehicles();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error purchasing vehicle');
    }
  };

  // Restock Vehicle
  const handleRestock = async (vehicleId: number) => {
    const amount = parseInt(restockAmount[vehicleId] || '');
    if (isNaN(amount) || amount <= 0) {
      setErrorMsg('Please enter a valid positive quantity to restock');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/vehicles/${vehicleId}/restock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ quantity: amount })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Restock failed');

      setSuccessMsg('Stock restocked successfully');
      setRestockAmount(prev => ({ ...prev, [vehicleId]: '' }));
      fetchVehicles();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error restocking');
    }
  };

  // Delete Vehicle
  const handleDelete = async (vehicleId: number) => {
    if (!confirm('Are you sure you want to remove this vehicle from the inventory?')) return;

    try {
      const res = await fetch(`${API_BASE}/vehicles/${vehicleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Deletion failed');

      setSuccessMsg('Vehicle removed from catalog');
      fetchVehicles();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error deleting vehicle');
    }
  };

  // Run Search
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchVehicles();
  };

  // Clear Search Filters
  const handleClearFilters = () => {
    const cleared = { make: '', model: '', category: '', minPrice: '', maxPrice: '' };
    setSearchParams(cleared);
    fetchVehicles(cleared);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Toast Feedback */}
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        maxWidth: '350px'
      }}>
        {errorMsg && (
          <div className="glass" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '16px',
            borderLeft: '4px solid var(--color-error)',
            background: 'rgba(244, 63, 94, 0.1)',
            color: '#fff',
            borderRadius: '8px',
            animation: 'slideIn 0.3s ease'
          }}>
            <AlertCircle size={20} color="var(--color-error)" />
            <span style={{ fontSize: '0.9rem', flex: 1 }}>{errorMsg}</span>
            <button onClick={() => setErrorMsg(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
              <X size={16} />
            </button>
          </div>
        )}
        {successMsg && (
          <div className="glass" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '16px',
            borderLeft: '4px solid var(--color-success)',
            background: 'rgba(16, 185, 129, 0.1)',
            color: '#fff',
            borderRadius: '8px',
            animation: 'slideIn 0.3s ease'
          }}>
            <CheckCircle size={20} color="var(--color-success)" />
            <span style={{ fontSize: '0.9rem', flex: 1 }}>{successMsg}</span>
            <button onClick={() => setSuccessMsg(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
              <X size={16} />
            </button>
          </div>
        )}
      </div>

      {/* VIEW 1: AUTHENTICATION */}
      {view === 'auth' && (
        <div style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '20px',
        }}>
          <div className="glass" style={{
            width: '100%',
            maxWidth: '420px',
            padding: '40px 32px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{
                background: 'var(--color-accent-gradient)',
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
                boxShadow: '0 8px 16px rgba(56, 189, 248, 0.3)'
              }}>
                <Car size={32} color="#fff" />
              </div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '6px' }}>
                <span className="text-gradient">REV_DRIVE</span>
              </h2>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                Dealership Inventory Portal
              </p>
            </div>

            {/* Tab Toggles */}
            <div style={{
              display: 'flex',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '10px',
              padding: '4px',
              marginBottom: '28px',
              border: '1px solid var(--border-color)'
            }}>
              <button 
                onClick={() => setAuthTab('login')}
                style={{
                  flex: 1,
                  background: authTab === 'login' ? 'rgba(255,255,255,0.08)' : 'none',
                  border: 'none',
                  color: authTab === 'login' ? '#fff' : 'var(--color-text-muted)',
                  padding: '10px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: pointerHand
                }}
              >
                Sign In
              </button>
              <button 
                onClick={() => setAuthTab('register')}
                style={{
                  flex: 1,
                  background: authTab === 'register' ? 'rgba(255,255,255,0.08)' : 'none',
                  border: 'none',
                  color: authTab === 'register' ? '#fff' : 'var(--color-text-muted)',
                  padding: '10px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: pointerHand
                }}
              >
                Register
              </button>
            </div>

            <form onSubmit={handleAuthSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label className="form-label">Email Address</label>
                <input 
                  type="email" 
                  className="form-input" 
                  placeholder="name@dealership.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div style={{ marginBottom: '28px' }}>
                <label className="form-label">Password</label>
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '14px' }}>
                {authTab === 'login' ? 'Access Inventory' : 'Create Account'}
                <ChevronRight size={18} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* VIEW 2: DASHBOARD */}
      {view === 'dashboard' && user && (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          
          {/* Glass Navbar */}
          <nav className="glass-nav" style={{
            position: 'sticky',
            top: 0,
            zIndex: 100,
            padding: '16px 40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                background: 'var(--color-accent-gradient)',
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 10px rgba(56, 189, 248, 0.3)'
              }}>
                <Car size={20} color="#fff" />
              </div>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '0.5px' }}>
                <span className="text-gradient">REV_DRIVE</span>
              </h1>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              {/* User Role Indicator */}
              <div className="glass" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '0.8rem',
                fontWeight: 600,
                border: '1px solid rgba(255, 255, 255, 0.05)'
              }}>
                {user.role === 'admin' ? (
                  <>
                    <Shield size={14} color="#f59e0b" />
                    <span style={{ color: '#f59e0b' }}>Admin Portal</span>
                  </>
                ) : (
                  <>
                    <User size={14} color="var(--color-accent)" />
                    <span style={{ color: 'var(--color-accent)' }}>User Portal</span>
                  </>
                )}
                <span style={{ color: 'var(--color-text-muted)' }}>({user.email})</span>
              </div>

              {user.role === 'admin' && (
                <button onClick={() => setShowAddModal(true)} className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                  <Plus size={16} /> Add Vehicle
                </button>
              )}

              <button onClick={handleLogout} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <LogOut size={16} /> Logout
              </button>
            </div>
          </nav>

          {/* Main Dashboard Container */}
          <main style={{ flex: 1, padding: '40px' }}>
            
            {/* Catalog Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '32px'
            }}>
              <div>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '6px' }}>Inventory Fleet</h2>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                  Explore and manage your active vehicle catalog
                </p>
              </div>

              {/* Filters Toggle & Active Counter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button 
                  onClick={() => setShowFilters(!showFilters)} 
                  className="btn-secondary"
                  style={{
                    borderColor: showFilters ? 'var(--color-accent)' : 'var(--border-color)',
                    background: showFilters ? 'rgba(56, 189, 248, 0.05)' : ''
                  }}
                >
                  <SlidersHorizontal size={16} /> Search Filters
                </button>
                <div className="glass" style={{ padding: '10px 16px', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 600 }}>
                  Active Listings: <span style={{ color: 'var(--color-accent)' }}>{vehicles.length}</span>
                </div>
              </div>
            </div>

            {/* Filter Drawer / Accordion */}
            {showFilters && (
              <div className="glass" style={{
                padding: '24px',
                borderRadius: '16px',
                marginBottom: '32px',
                background: 'rgba(11, 15, 25, 0.4)'
              }}>
                <form onSubmit={handleSearchSubmit}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '16px',
                    marginBottom: '20px'
                  }}>
                    <div>
                      <label className="form-label">Make</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="e.g. Toyota"
                        value={searchParams.make}
                        onChange={(e) => setSearchParams(prev => ({ ...prev, make: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="form-label">Model</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="e.g. Camry"
                        value={searchParams.model}
                        onChange={(e) => setSearchParams(prev => ({ ...prev, model: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="form-label">Category</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="e.g. SUV, Sedan"
                        value={searchParams.category}
                        onChange={(e) => setSearchParams(prev => ({ ...prev, category: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="form-label">Min Price ($)</label>
                      <input 
                        type="number" 
                        className="form-input" 
                        placeholder="Min"
                        value={searchParams.minPrice}
                        onChange={(e) => setSearchParams(prev => ({ ...prev, minPrice: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="form-label">Max Price ($)</label>
                      <input 
                        type="number" 
                        className="form-input" 
                        placeholder="Max"
                        value={searchParams.maxPrice}
                        onChange={(e) => setSearchParams(prev => ({ ...prev, maxPrice: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <button type="button" onClick={handleClearFilters} className="btn-secondary" style={{ padding: '8px 16px' }}>
                      Reset
                    </button>
                    <button type="submit" className="btn-primary" style={{ padding: '8px 20px' }}>
                      <Search size={16} /> Apply Filters
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Fleet Grid */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  border: '3px solid rgba(255,255,255,0.05)',
                  borderTopColor: 'var(--color-accent)',
                  borderRadius: '50%',
                  display: 'inline-block',
                  animation: 'spin 1s linear infinite'
                }}></div>
                <p style={{ marginTop: '12px', color: 'var(--color-text-muted)' }}>Loading inventory...</p>
              </div>
            ) : vehicles.length === 0 ? (
              <div className="glass" style={{
                textAlign: 'center',
                padding: '60px 40px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px'
              }}>
                <Car size={48} color="var(--color-text-muted)" style={{ opacity: 0.5 }} />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>No Vehicles in Catalog</h3>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', maxWidth: '400px' }}>
                  No vehicles match your filters, or the database is currently empty.
                </p>
                {(searchParams.make || searchParams.model || searchParams.category || searchParams.minPrice || searchParams.maxPrice) && (
                  <button onClick={handleClearFilters} className="btn-secondary">
                    Clear Active Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="dashboard-grid">
                {vehicles.map((vehicle) => (
                  <div key={vehicle.id} className="glass hover-glow" style={{
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    position: 'relative'
                  }}>
                    {/* Badge */}
                    <div style={{
                      position: 'absolute',
                      top: '16px',
                      right: '16px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: 'var(--color-accent)',
                      border: '1px solid rgba(255, 255, 255, 0.05)'
                    }}>
                      {vehicle.category}
                    </div>

                    {/* Fleet Card Header */}
                    <div style={{
                      padding: '24px 24px 12px 24px',
                      borderBottom: '1px solid var(--border-color)',
                      background: 'rgba(255, 255, 255, 0.01)'
                    }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                        {vehicle.make}
                      </span>
                      <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '2px', color: '#fff' }}>
                        {vehicle.model}
                      </h3>
                    </div>

                    {/* Vehicle Properties */}
                    <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Listing Price</span>
                        <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>
                          ${parseFloat(vehicle.price as string).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Inventory Status</span>
                        {vehicle.quantity > 0 ? (
                          <span style={{
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            color: 'var(--color-success)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            {vehicle.quantity} In Stock
                          </span>
                        ) : (
                          <span style={{
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            color: 'var(--color-error)',
                            background: 'rgba(244, 63, 94, 0.1)',
                            padding: '2px 8px',
                            borderRadius: '4px'
                          }}>
                            Out of Stock
                          </span>
                        )}
                      </div>

                      {/* Admin Restock Input Panel */}
                      {user.role === 'admin' && (
                        <div style={{
                          marginTop: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          background: 'rgba(255,255,255,0.02)',
                          padding: '8px',
                          borderRadius: '8px',
                          border: '1px dashed var(--border-color)'
                        }}>
                          <input 
                            type="number" 
                            className="form-input" 
                            placeholder="+ Qty" 
                            style={{ padding: '6px 10px', fontSize: '0.8rem', maxWidth: '70px' }}
                            value={restockAmount[vehicle.id] || ''}
                            onChange={(e) => setRestockAmount(prev => ({ ...prev, [vehicle.id]: e.target.value }))}
                          />
                          <button 
                            onClick={() => handleRestock(vehicle.id)}
                            className="btn-secondary" 
                            style={{ padding: '6px 12px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                          >
                            <RotateCcw size={12} /> Restock
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Actions Panel */}
                    <div style={{
                      padding: '16px 24px 24px 24px',
                      display: 'flex',
                      gap: '12px',
                      background: 'rgba(0,0,0,0.1)'
                    }}>
                      {user.role === 'admin' ? (
                        <>
                          <button onClick={() => openEditModal(vehicle)} className="btn-secondary" style={{ flex: 1, padding: '8px', justifyContent: 'center' }}>
                            <Edit2 size={16} /> Edit
                          </button>
                          <button onClick={() => handleDelete(vehicle.id)} className="btn-danger" style={{ padding: '8px 12px' }}>
                            <Trash2 size={16} />
                          </button>
                        </>
                      ) : (
                        <button 
                          onClick={() => handlePurchase(vehicle.id)} 
                          className="btn-primary" 
                          disabled={vehicle.quantity <= 0}
                          style={{ flex: 1, padding: '10px', justifyContent: 'center' }}
                        >
                          <ShoppingBag size={16} /> {vehicle.quantity > 0 ? 'Purchase Vehicle' : 'Unavailable'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      )}

      {/* MODAL 1: ADD VEHICLE */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(8px)',
          zIndex: 1000,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '20px'
        }}>
          <div className="glass" style={{
            width: '100%',
            maxWidth: '500px',
            padding: '32px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8)',
            animation: 'fadeIn 0.2s ease'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Add New Fleet Vehicle</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: pointerHand }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddVehicle}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label className="form-label">Make</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Tesla"
                    value={makeInput}
                    onChange={(e) => setMakeInput(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label">Model</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Model S"
                    value={modelInput}
                    onChange={(e) => setModelInput(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label className="form-label">Category</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Sedan, SUV, Electric"
                  value={categoryInput}
                  onChange={(e) => setCategoryInput(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '28px' }}>
                <div>
                  <label className="form-label">Price ($)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    placeholder="e.g. 75000"
                    value={priceInput}
                    onChange={(e) => setPriceInput(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label">Initial Quantity</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    placeholder="e.g. 3"
                    value={quantityInput}
                    onChange={(e) => setQuantityInput(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Vehicle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT VEHICLE */}
      {showEditModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(8px)',
          zIndex: 1000,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '20px'
        }}>
          <div className="glass" style={{
            width: '100%',
            maxWidth: '500px',
            padding: '32px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8)',
            animation: 'fadeIn 0.2s ease'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Update Fleet Details</h3>
              <button onClick={() => setShowEditModal(false)} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: pointerHand }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateVehicle}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label className="form-label">Make</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Tesla"
                    value={makeInput}
                    onChange={(e) => setMakeInput(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label">Model</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Model S"
                    value={modelInput}
                    onChange={(e) => setModelInput(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label className="form-label">Category</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Sedan, SUV, Electric"
                  value={categoryInput}
                  onChange={(e) => setCategoryInput(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '28px' }}>
                <div>
                  <label className="form-label">Price ($)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    placeholder="e.g. 75000"
                    value={priceInput}
                    onChange={(e) => setPriceInput(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label">Total Quantity</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    placeholder="e.g. 3"
                    value={quantityInput}
                    onChange={(e) => setQuantityInput(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowEditModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
    </div>
  );
}

const pointerHand = 'pointer' as const;
