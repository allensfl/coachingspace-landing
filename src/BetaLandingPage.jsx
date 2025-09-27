import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import './BetaLanding.css';

// Supabase-Konfiguration
const supabaseUrl = 'https://jlvmkfpjnqvtnqepmpsf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impsdm1rZnBqbnF2dG5xZXBtcHNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5MzE3MjMsImV4cCI6MjA3MzUwNzcyM30.xdltEUoQC5zK6Im6NIJBBmHy2XzR36A9NoarPTwatbQ';
const supabase = createClient(supabaseUrl, supabaseKey);

const BetaLandingPage = () => {
  const [currentStep, setCurrentStep] = useState('landing');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: '',
    experience: '',
    goals: '',
    challenges: ''
  });
  const [betaSpots, setBetaSpots] = useState(47);
  const [isLoading, setIsLoading] = useState(false);
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  // Beta-Spots von Supabase laden
  useEffect(() => {
    const fetchBetaSpots = async () => {
      try {
        const { data, error } = await supabase
          .from('beta_users')
          .select('*');
        
        if (error) throw error;
        
        const remainingSpots = Math.max(0, 50 - (data?.length || 0));
        setBetaSpots(remainingSpots);
      } catch (error) {
        console.error('Error fetching beta spots:', error);
      }
    };

    fetchBetaSpots();
  }, []);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Beta-User in Supabase speichern
      const { data, error } = await supabase
        .from('beta_users')
        .insert([
          {
            first_name: formData.firstName,
            last_name: formData.lastName,
            email: formData.email,
            role: formData.role,
            experience: formData.experience,
            goals: formData.goals,
            challenges: formData.challenges,
            status: 'pending',
            created_at: new Date().toISOString()
          }
        ])
        .select();

      if (error) throw error;

      // Spots aktualisieren
      setBetaSpots(prev => Math.max(0, prev - 1));
      
      setCurrentStep('success');
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Es gab einen Fehler bei der Anmeldung. Bitte versuchen Sie es erneut.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Prüfe ob User existiert
      const { data, error } = await supabase
        .from('beta_users')
        .select('*')
        .eq('email', loginData.email)
        .single();

      if (error) throw error;

      if (data) {
        setCurrentStep('passwordReset');
      } else {
        alert('E-Mail nicht gefunden. Bitte registrieren Sie sich zuerst.');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('E-Mail nicht gefunden. Bitte registrieren Sie sich zuerst.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Update user password in database
      const { error } = await supabase
        .from('beta_users')
        .update({ 
          password: newPassword,
          status: 'active',
          last_login: new Date().toISOString()
        })
        .eq('email', loginData.email);

      if (error) throw error;

      setCurrentStep('appRedirect');
    } catch (error) {
      console.error('Password reset error:', error);
      alert('Fehler beim Setzen des Passworts. Bitte versuchen Sie es erneut.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderLandingPage = () => (
    <div className="landing-container">
      <div className="hero-section">
        <div className="hero-content">
          <h1 className="main-title">CoachingSpace Beta</h1>
          <p className="hero-subtitle">
            Die All-in-One Plattform für professionelle Coaches
          </p>
          <div className="beta-spots">
            <span className="spots-number">{betaSpots}</span>
            <span className="spots-text">Beta-Plätze verfügbar</span>
          </div>
        </div>
      </div>

      <div className="features-section">
        <h2 className="section-title">Was Sie erwartet</h2>
        <div className="features-grid">
          <div className="feature-card">
            <img src="/dashboard.png" alt="Dashboard" className="feature-image" />
            <h3>Intelligentes Dashboard</h3>
            <p>Überblick über alle Ihre Coaching-Aktivitäten auf einen Blick</p>
          </div>
          <div className="feature-card">
            <img src="/coaching-room.png" alt="Coaching Room" className="feature-image" />
            <h3>Virtueller Coaching-Raum</h3>
            <p>Professionelle Video-Sessions mit integrierten Tools</p>
          </div>
          <div className="feature-card">
            <img src="/session-prep.png" alt="Session Vorbereitung" className="feature-image" />
            <h3>Session-Vorbereitung</h3>
            <p>Strukturierte Vorbereitung für optimale Coaching-Ergebnisse</p>
          </div>
        </div>
      </div>

      <div className="cta-section">
        <button 
          className="cta-button"
          onClick={() => setCurrentStep('signup')}
        >
          Jetzt Beta-Zugang sichern
        </button>
        <button 
          className="login-button"
          onClick={() => setCurrentStep('login')}
        >
          Bereits registriert? Einloggen
        </button>
      </div>
    </div>
  );

  const renderSignupForm = () => (
    <div className="signup-container">
      <div className="signup-header">
        <h2 className="signup-title">Beta-Zugang beantragen</h2>
        <p className="signup-subtitle">
          Werden Sie Teil der Zukunft des digitalen Coachings
        </p>
      </div>

      <form onSubmit={handleSubmit} className="signup-form">
        <div className="form-grid">
          <div className="form-group">
            <label>Vorname</label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Nachname</label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label>E-Mail-Adresse</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Ihre Rolle</label>
          <select
            name="role"
            value={formData.role}
            onChange={handleInputChange}
            required
          >
            <option value="">Bitte wählen</option>
            <option value="business-coach">Business Coach</option>
            <option value="life-coach">Life Coach</option>
            <option value="executive-coach">Executive Coach</option>
            <option value="career-coach">Career Coach</option>
            <option value="wellness-coach">Wellness Coach</option>
            <option value="other">Andere</option>
          </select>
        </div>

        <div className="form-group">
          <label>Coaching-Erfahrung</label>
          <select
            name="experience"
            value={formData.experience}
            onChange={handleInputChange}
            required
          >
            <option value="">Bitte wählen</option>
            <option value="beginner">Anfänger (&lt; 1 Jahr)</option>
            <option value="intermediate">Fortgeschritten (1-3 Jahre)</option>
            <option value="experienced">Erfahren (3-5 Jahre)</option>
            <option value="expert">Experte (> 5 Jahre)</option>
          </select>
        </div>

        <div className="form-group">
          <label>Ihre Ziele mit CoachingSpace</label>
          <textarea
            name="goals"
            value={formData.goals}
            onChange={handleInputChange}
            placeholder="Was möchten Sie mit unserer Plattform erreichen?"
            rows="3"
            required
          />
        </div>

        <div className="form-group">
          <label>Aktuelle Herausforderungen</label>
          <textarea
            name="challenges"
            value={formData.challenges}
            onChange={handleInputChange}
            placeholder="Welche Herausforderungen haben Sie derzeit in Ihrem Coaching-Business?"
            rows="3"
            required
          />
        </div>

        <div className="form-actions">
          <button 
            type="button" 
            className="back-button"
            onClick={() => setCurrentStep('landing')}
          >
            Zurück
          </button>
          <button 
            type="submit" 
            className="submit-button"
            disabled={isLoading}
          >
            {isLoading ? 'Wird gesendet...' : 'Beta-Zugang beantragen'}
          </button>
        </div>
      </form>
    </div>
  );

  const renderSuccessPage = () => (
    <div className="success-container">
      <div className="success-content">
        <div className="success-icon">✓</div>
        <h2 className="success-title">Vielen Dank für Ihre Anmeldung!</h2>
        <p className="success-message">
          Ihre Beta-Bewerbung wurde erfolgreich eingereicht. Sie erhalten in Kürze 
          eine E-Mail mit Ihren Zugangsdaten und weiteren Informationen.
        </p>
        <div className="success-details">
          <p><strong>E-Mail:</strong> {formData.email}</p>
          <p><strong>Status:</strong> Pending Review</p>
        </div>
        <button 
          className="login-button"
          onClick={() => setCurrentStep('login')}
        >
          Jetzt einloggen
        </button>
      </div>
    </div>
  );

  const renderLoginForm = () => (
    <div className="login-container">
      <div className="login-header">
        <h2 className="login-title">Beta-Zugang</h2>
        <p className="login-subtitle">
          Loggen Sie sich mit Ihrer registrierten E-Mail-Adresse ein
        </p>
      </div>

      <form onSubmit={handleLogin} className="login-form">
        <div className="form-group">
          <label>E-Mail-Adresse</label>
          <input
            type="email"
            value={loginData.email}
            onChange={(e) => setLoginData({...loginData, email: e.target.value})}
            required
          />
        </div>

        <div className="form-actions">
          <button 
            type="button" 
            className="back-button"
            onClick={() => setCurrentStep('landing')}
          >
            Zurück
          </button>
          <button 
            type="submit" 
            className="submit-button"
            disabled={isLoading}
          >
            {isLoading ? 'Wird geprüft...' : 'Weiter'}
          </button>
        </div>
      </form>
    </div>
  );

  const renderPasswordReset = () => (
    <div className="password-container">
      <div className="password-header">
        <h2 className="password-title">Passwort festlegen</h2>
        <p className="password-subtitle">
          Bitte legen Sie ein sicheres Passwort für Ihren Account fest
        </p>
      </div>

      <form onSubmit={handlePasswordReset} className="password-form">
        <div className="form-group">
          <label>Neues Passwort</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            minLength="6"
            required
          />
          <small>Mindestens 6 Zeichen</small>
        </div>

        <div className="form-actions">
          <button 
            type="button" 
            className="back-button"
            onClick={() => setCurrentStep('login')}
          >
            Zurück
          </button>
          <button 
            type="submit" 
            className="submit-button"
            disabled={isLoading || newPassword.length < 6}
          >
            {isLoading ? 'Wird gespeichert...' : 'Passwort festlegen'}
          </button>
        </div>
      </form>
    </div>
  );

  const renderAppRedirect = () => {
    // Automatische Weiterleitung zur App nach 3 Sekunden
    useEffect(() => {
      const timer = setTimeout(() => {
       window.location.href = 'https://appcoachflavien.netlify.app';
      }, 3000);

      return () => clearTimeout(timer);
    }, []);

    return (
      <div className="redirect-container">
        <div className="redirect-content">
          <div className="redirect-icon">🚀</div>
          <h2 className="redirect-title">Willkommen bei CoachingSpace!</h2>
          <p className="redirect-message">
            Sie werden automatisch zur Anwendung weitergeleitet...
          </p>
          <div className="redirect-loading">
            <div className="loading-spinner"></div>
          </div>
          <button 
            className="manual-redirect-button"
            onClick={() => window.location.href = 'https://appcoachflavien.netlify.app'}
          >
            Manuell zur App wechseln
          </button>
        </div>
      </div>
    );
  };

  // Render basierend auf currentStep
  switch (currentStep) {
    case 'landing':
      return renderLandingPage();
    case 'signup':
      return renderSignupForm();
    case 'success':
      return renderSuccessPage();
    case 'login':
      return renderLoginForm();
    case 'passwordReset':
      return renderPasswordReset();
    case 'appRedirect':
      return renderAppRedirect();
    default:
      return renderLandingPage();
  }
};

export default BetaLandingPage;