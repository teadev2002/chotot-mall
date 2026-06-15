import React, { useState, useContext, useEffect } from 'react';
import { ShopContext } from '../../context/ShopContext';
import { ShoppingBag, ArrowLeft, ArrowRight, CheckCircle2, CreditCard, Lock } from 'lucide-react';

export default function Checkout() {
  const { cart, placeOrder, setView, currentUser } = useContext(ShopContext);

  // Checkout Wizard Step
  const [step, setStep] = useState(1); // 1 = Shipping, 2 = Payment, 3 = Success

  // Form States
  const [shippingForm, setShippingForm] = useState({
    name: currentUser ? currentUser.name : '',
    email: currentUser ? currentUser.email : '',
    address: '',
    city: '',
    zipCode: '',
    phone: ''
  });

  // Prefill shipping name/email if user logs in
  useEffect(() => {
    if (currentUser) {
      setShippingForm((prev) => ({
        ...prev,
        name: prev.name || currentUser.name,
        email: prev.email || currentUser.email
      }));
    } else {
      setShippingForm((prev) => ({
        ...prev,
        name: '',
        email: ''
      }));
    }
  }, [currentUser]);

  const [paymentForm, setPaymentForm] = useState({
    method: 'Credit Card',
    cardNumber: '',
    cardExpiry: '',
    cardCvv: '',
    paypalEmail: ''
  });

  const [formErrors, setFormErrors] = useState({});
  const [placedOrderId, setPlacedOrderId] = useState('');
  const [purchasedItems, setPurchasedItems] = useState([]);
  const [billedTotal, setBilledTotal] = useState(0);

  // Calculations
  const checkoutItems = step === 3 ? purchasedItems : cart;
  const subtotal = checkoutItems.reduce((sum, item) => sum + item.price * item.qty, 0);
  const tax = Number((subtotal * 0.08).toFixed(2));
  const shipping = subtotal > 150 ? 0 : 10.00;
  const total = step === 3 ? billedTotal : Number((subtotal + tax + shipping).toFixed(2));

  // Handlers
  const handleShippingChange = (e) => {
    const { name, value } = e.target;
    setShippingForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePaymentChange = (e) => {
    const { name, value } = e.target;
    setPaymentForm((prev) => ({ ...prev, [name]: value }));
  };

  const validateShipping = () => {
    const errors = {};
    if (!shippingForm.name.trim()) errors.name = 'Full Name is required';
    if (!shippingForm.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(shippingForm.email)) {
      errors.email = 'Email is invalid';
    }
    if (!shippingForm.address.trim()) errors.address = 'Street Address is required';
    if (!shippingForm.city.trim()) errors.city = 'City is required';
    if (!shippingForm.zipCode.trim()) errors.zipCode = 'ZIP Code is required';
    if (!shippingForm.phone.trim()) errors.phone = 'Phone number is required';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validatePayment = () => {
    const errors = {};
    if (paymentForm.method === 'Credit Card') {
      if (!paymentForm.cardNumber.trim()) {
        errors.cardNumber = 'Card Number is required';
      } else if (!/^\d{16}$/.test(paymentForm.cardNumber.replace(/\s/g, ''))) {
        errors.cardNumber = 'Card Number must be 16 digits';
      }
      if (!paymentForm.cardExpiry.trim()) {
        errors.cardExpiry = 'Expiry date is required';
      } else if (!/^(0[1-9]|1[0-2])\/?([0-9]{2})$/.test(paymentForm.cardExpiry)) {
        errors.cardExpiry = 'Expiry must be MM/YY format';
      }
      if (!paymentForm.cardCvv.trim()) {
        errors.cardCvv = 'CVV code is required';
      } else if (!/^\d{3,4}$/.test(paymentForm.cardCvv)) {
        errors.cardCvv = 'CVV must be 3 or 4 digits';
      }
    } else {
      if (!paymentForm.paypalEmail.trim()) {
        errors.paypalEmail = 'PayPal email address is required';
      } else if (!/\S+@\S+\.\S+/.test(paymentForm.paypalEmail)) {
        errors.paypalEmail = 'PayPal email is invalid';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (validateShipping()) {
        setStep(2);
      }
    }
  };

  const handlePrevStep = () => {
    if (step === 2) {
      setStep(1);
    }
  };

  const handlePlaceOrderSubmit = (e) => {
    e.preventDefault();
    if (validatePayment()) {
      // Store current cart items and total snapshot for receipt screen
      setPurchasedItems([...cart]);
      setBilledTotal(total);

      // Perform context action
      const orderId = placeOrder(shippingForm, paymentForm);

      setPlacedOrderId(orderId);
      setStep(3);
    }
  };

  // Switch back to shop Catalog
  const handleReturnToShop = () => {
    setView('storefront');
  };

  if (step === 3) {
    return (
      <div className="container anim-fade-in" style={{ padding: '2rem 1.5rem' }}>
        <div className="order-success-screen">
          <div className="success-icon-wrapper">
            <CheckCircle2 size={48} strokeWidth={2.5} />
          </div>
          <h1 className="hero-title" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Order Placed Successfully!</h1>
          <p style={{ color: 'var(--clr-text-secondary)', marginBottom: '2rem' }}>
            Thank you for shopping with us. Your order <span style={{ fontWeight: 700, color: 'var(--clr-primary)' }}>{placedOrderId}</span> is being processed.
          </p>

          {/* Receipt Breakdown */}
          <div style={{ background: 'var(--clr-bg-app)', border: '1px solid var(--clr-border)', borderRadius: 'var(--radius-md)', padding: '1.5rem', textAlign: 'left', marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, borderBottom: '1px solid var(--clr-border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Order Summary</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {purchasedItems.map((item) => (
                <div key={item.cartItemId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span>{item.title} (x{item.qty})</span>
                  <span style={{ fontWeight: 600 }}>${(item.price * item.qty).toFixed(2)}</span>
                </div>
              ))}
              <div className="checkout-divider"></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--clr-text-secondary)' }}>
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--clr-text-secondary)' }}>
                <span>Estimated Tax</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--clr-text-secondary)' }}>
                <span>Shipping Fees</span>
                <span>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.05rem', color: 'var(--clr-text-primary)', marginTop: '0.5rem' }}>
                <span>Total Amount Paid</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <button className="btn btn-primary" onClick={handleReturnToShop}>
            <ShoppingBag size={16} />
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  // Redirect if cart is empty and not on success step
  if (cart.length === 0) {
    return (
      <div className="container" style={{ padding: '5rem 2rem', textAlign: 'center' }}>
        <ShoppingBag size={48} style={{ margin: '0 auto 1.5rem', opacity: 0.5 }} />
        <h2>Your Cart is Empty</h2>
        <p style={{ color: 'var(--clr-text-muted)', marginTop: '0.5rem' }}>Add items to your cart before proceeding to checkout.</p>
        <button className="btn btn-primary" onClick={handleReturnToShop} style={{ marginTop: '1.5rem' }}>
          Back to Catalog
        </button>
      </div>
    );
  }

  return (
    <div className="container anim-fade-in" style={{ padding: '2rem 1.5rem' }}>
      <h1 className="hero-title" style={{ fontSize: '2rem', marginBottom: '2rem' }}>Checkout</h1>

      <div className="checkout-layout">
        {/* Left Column: Form Steps */}
        <div>
          {/* Progress Indicators */}
          <div className="checkout-steps">
            <div className={`step-indicator ${step === 1 ? 'active' : 'completed'}`}>
              <span
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: step === 1 ? 'var(--clr-primary)' : 'var(--clr-success)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem'
                }}
              >
                1
              </span>
              Shipping Information
            </div>
            <div className={`step-indicator ${step === 2 ? 'active' : ''}`}>
              <span
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: step === 2 ? 'var(--clr-primary)' : 'var(--clr-border)',
                  color: step === 2 ? 'white' : 'var(--clr-text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem'
                }}
              >
                2
              </span>
              Payment Details
            </div>
          </div>

          {/* Form Content */}
          {step === 1 ? (
            <div className="checkout-card anim-scale-in">
              <h2 className="checkout-card-title">Shipping Address</h2>
              
              <div className="form-group">
                <label className="form-label" htmlFor="ship-name">Full Name</label>
                <input
                  type="text"
                  id="ship-name"
                  name="name"
                  className="form-input"
                  value={shippingForm.name}
                  onChange={handleShippingChange}
                  placeholder="John Doe"
                />
                {formErrors.name && <span style={{ fontSize: '0.75rem', color: 'var(--clr-danger)' }}>{formErrors.name}</span>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="ship-email">Email Address</label>
                <input
                  type="email"
                  id="ship-email"
                  name="email"
                  className="form-input"
                  value={shippingForm.email}
                  onChange={handleShippingChange}
                  placeholder="johndoe@example.com"
                />
                {formErrors.email && <span style={{ fontSize: '0.75rem', color: 'var(--clr-danger)' }}>{formErrors.email}</span>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="ship-address">Street Address</label>
                <input
                  type="text"
                  id="ship-address"
                  name="address"
                  className="form-input"
                  value={shippingForm.address}
                  onChange={handleShippingChange}
                  placeholder="123 Shopping Avenue"
                />
                {formErrors.address && <span style={{ fontSize: '0.75rem', color: 'var(--clr-danger)' }}>{formErrors.address}</span>}
              </div>

              <div className="grid-2col">
                <div className="form-group">
                  <label className="form-label" htmlFor="ship-city">City</label>
                  <input
                    type="text"
                    id="ship-city"
                    name="city"
                    className="form-input"
                    value={shippingForm.city}
                    onChange={handleShippingChange}
                    placeholder="New York"
                  />
                  {formErrors.city && <span style={{ fontSize: '0.75rem', color: 'var(--clr-danger)' }}>{formErrors.city}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="ship-zip">ZIP / Postal Code</label>
                  <input
                    type="text"
                    id="ship-zip"
                    name="zipCode"
                    className="form-input"
                    value={shippingForm.zipCode}
                    onChange={handleShippingChange}
                    placeholder="10001"
                  />
                  {formErrors.zipCode && <span style={{ fontSize: '0.75rem', color: 'var(--clr-danger)' }}>{formErrors.zipCode}</span>}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="ship-phone">Phone Number</label>
                <input
                  type="tel"
                  id="ship-phone"
                  name="phone"
                  className="form-input"
                  value={shippingForm.phone}
                  onChange={handleShippingChange}
                  placeholder="+1 (555) 123-4567"
                />
                {formErrors.phone && <span style={{ fontSize: '0.75rem', color: 'var(--clr-danger)' }}>{formErrors.phone}</span>}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button className="btn btn-primary" onClick={handleNextStep}>
                  Continue to Payment
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handlePlaceOrderSubmit} className="checkout-card anim-scale-in">
              <h2 className="checkout-card-title">
                <CreditCard size={20} />
                Payment Method
              </h2>

              {/* Payment selector tabs */}
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <label
                  className={`btn btn-secondary ${paymentForm.method === 'Credit Card' ? 'active' : ''}`}
                  style={{ flex: 1, cursor: 'pointer', display: 'flex', justifyContent: 'center' }}
                >
                  <input
                    type="radio"
                    name="method"
                    value="Credit Card"
                    checked={paymentForm.method === 'Credit Card'}
                    onChange={handlePaymentChange}
                    style={{ display: 'none' }}
                  />
                  Credit / Debit Card
                </label>
                <label
                  className={`btn btn-secondary ${paymentForm.method === 'PayPal' ? 'active' : ''}`}
                  style={{ flex: 1, cursor: 'pointer', display: 'flex', justifyContent: 'center' }}
                >
                  <input
                    type="radio"
                    name="method"
                    value="PayPal"
                    checked={paymentForm.method === 'PayPal'}
                    onChange={handlePaymentChange}
                    style={{ display: 'none' }}
                  />
                  PayPal
                </label>
              </div>

              {paymentForm.method === 'Credit Card' ? (
                <div className="anim-fade-in">
                  <div className="form-group">
                    <label className="form-label" htmlFor="card-num">Card Number</label>
                    <input
                      type="text"
                      id="card-num"
                      name="cardNumber"
                      className="form-input"
                      value={paymentForm.cardNumber}
                      onChange={handlePaymentChange}
                      placeholder="1234 5678 1234 5678"
                      maxLength="19"
                    />
                    {formErrors.cardNumber && <span style={{ fontSize: '0.75rem', color: 'var(--clr-danger)' }}>{formErrors.cardNumber}</span>}
                  </div>

                  <div className="grid-2col">
                    <div className="form-group">
                      <label className="form-label" htmlFor="card-exp">Expiration Date</label>
                      <input
                        type="text"
                        id="card-exp"
                        name="cardExpiry"
                        className="form-input"
                        value={paymentForm.cardExpiry}
                        onChange={handlePaymentChange}
                        placeholder="MM/YY"
                        maxLength="5"
                      />
                      {formErrors.cardExpiry && <span style={{ fontSize: '0.75rem', color: 'var(--clr-danger)' }}>{formErrors.cardExpiry}</span>}
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="card-cvv">Security Code (CVV)</label>
                      <input
                        type="password"
                        id="card-cvv"
                        name="cardCvv"
                        className="form-input"
                        value={paymentForm.cardCvv}
                        onChange={handlePaymentChange}
                        placeholder="123"
                        maxLength="4"
                      />
                      {formErrors.cardCvv && <span style={{ fontSize: '0.75rem', color: 'var(--clr-danger)' }}>{formErrors.cardCvv}</span>}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="form-group anim-fade-in">
                  <label className="form-label" htmlFor="paypal-email">PayPal Email Address</label>
                  <input
                    type="email"
                    id="paypal-email"
                    name="paypalEmail"
                    className="form-input"
                    value={paymentForm.paypalEmail}
                    onChange={handlePaymentChange}
                    placeholder="paypal@example.com"
                  />
                  {formErrors.paypalEmail && <span style={{ fontSize: '0.75rem', color: 'var(--clr-danger)' }}>{formErrors.paypalEmail}</span>}
                </div>
              )}

              {/* Secure transaction notice */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--clr-text-muted)', background: 'var(--clr-bg-app)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginTop: '1.5rem' }}>
                <Lock size={14} style={{ color: 'var(--clr-success)' }} />
                Your transaction is secured with 256-bit bank-grade encryption.
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={handlePrevStep}>
                  <ArrowLeft size={16} />
                  Back
                </button>
                <button type="submit" className="btn btn-primary">
                  Place Simulated Order (${total.toFixed(2)})
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Right Column: Checkout Summary Sidebar */}
        <aside className="checkout-summary-card">
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem' }}>Order Details</h2>

          {/* List of items being checked out */}
          <div className="checkout-summary-list">
            {checkoutItems.map((item) => (
              <div key={item.cartItemId} style={{ display: 'flex', gap: '0.75rem', borderBottom: '1px solid var(--clr-border)', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
                <img src={item.image} alt={item.title} style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: 'var(--radius-xs)', border: '1px solid var(--clr-border)' }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {item.title}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)' }}>
                    Qty: {item.qty} | Color: {item.color} | Size: {item.size}
                  </span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--clr-primary)', marginTop: '0.25rem' }}>
                    ${(item.price * item.qty).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Checkout cost breakdowns */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div className="summary-item" style={{ color: 'var(--clr-text-secondary)' }}>
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="summary-item" style={{ color: 'var(--clr-text-secondary)' }}>
              <span>Shipping Fee</span>
              <span>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span>
            </div>
            <div className="summary-item" style={{ color: 'var(--clr-text-secondary)' }}>
              <span>Estimated Tax (8%)</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            
            <div className="checkout-divider"></div>
            
            <div className="summary-item" style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--clr-text-primary)' }}>
              <span>Total Price</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
