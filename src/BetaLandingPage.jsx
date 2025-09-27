import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import './BetaLanding.css';

const supabaseUrl = 'https://jlvmkfpjnqvtnqepmpsf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impsdm1rZnBqbnF2dG5xZXBtcHNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5MzE3MjMsImV4cCI6MjA3MzUwNzcyM30.xdltEUoQC5zK6Im6NIJBBmHy2XzR36A9NoarPTwatbQ';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const BetaLandingPage = () => {
  const [currentStep, setCurrentStep] = useState('landing');
  const [availableSpots, setAvailableSpots] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    experience: '',
    coacheeCount: ''
  });
  
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  
  const [userData, setUserData] = useState(null);

  // Load available spots
  const loadAvailableSpots = async () => {
    try {
      const { count, error } = await supabase
        .from('beta_users')
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      setAvailableSpots(Math.max(0, 10 - (count || 0)));
    } catch (err) {
      console.error('Error loading spots:', err);
      setAvailableSpots(8);
    }
  };

  useEffect(() => {
    loadAvailableSpots();
  }, []);

  // Handle beta signup
  const handleBetaSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data: existingUsers, error: checkError } = await supabase
        .from('beta_users')
        .select('email')
        .eq('email', formData.email);

      if (checkError) throw checkError;

      if (existingUsers && existingUsers.length > 0) {
        setError('Diese E-Mail-Adresse ist bereits registriert.');
        setLoading(false);
        return;
      }

      const { count } = await supabase
        .from('beta_users')
        .select('*', { count: 'exact', head: true });

      const spotNumber = (count || 0) + 1;

      const { data, error: insertError } = await supabase
        .from('beta_users')
        .insert([{
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          company: formData.company,
          experience: formData.experience,
          coachee_count: formData.coacheeCount,
          beta_spot_number: spotNumber,
          temp_password: 'beta2024temp!',
          password_changed: false,
          created_at: new Date().toISOString()
        }])
        .select();

      if (insertError) throw insertError;

      setUserData(data[0]);
      setCurrentStep('success');
      loadAvailableSpots();

    } catch (err) {
      console.error('Signup error:', err);
      setError('Anmeldung fehlgeschlagen. Bitte versuche es erneut.');
    } finally {
      setLoading(false);
    }
  };

  // Handle login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data: user, error } = await supabase
        .from('beta_users')
        .select('*')
        .eq('email', loginData.email)
        .single();

      if (error || !user) {
        setError('E-Mail nicht gefunden. Hast du dich für die Beta registriert?');
        setLoading(false);
        return;
      }

      const passwordToCheck = user.password_changed ? user.new_password : user.temp_password;
      
      if (loginData.password !== passwordToCheck) {
        await supabase
          .from('beta_users')
          .update({ login_attempts: (user.login_attempts || 0) + 1 })
          .eq('email', loginData.email);
        
        setError('Falsches Passwort. Verwende das temporäre Passwort aus der E-Mail.');
        setLoading(false);
        return;
      }

      setUserData(user);
      
      if (!user.password_changed) {
        setCurrentStep('password');
      } else {
        setCurrentStep('app');
      }

    } catch (err) {
      console.error('Login error:', err);
      setError('Anmeldung fehlgeschlagen. Bitte versuche es erneut.');
    } finally {
      setLoading(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Passwörter stimmen nicht überein.');
      setLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('Passwort muss mindestens 6 Zeichen haben.');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase
        .from('beta_users')
        .update({ 
          new_password: passwordData.newPassword,
          password_changed: true
        })
        .eq('email', userData.email);

      if (error) throw error;

      setSuccess('Passwort erfolgreich geändert!');
      setTimeout(() => setCurrentStep('app'), 2000);

    } catch (err) {
      console.error('Password change error:', err);
      setError('Passwort-Änderung fehlgeschlagen.');
    } finally {
      setLoading(false);
    }
  };

  // Render landing page
  const renderLandingPage = () => (
    <div className="landing-container">
      <div className="container">
        <div className="hero-section">
          <h1 className="main-title">
            CoachingSpace <span className="beta-accent">Beta</span>
          </h1>
          <p className="subtitle">
            Die All-in-One Plattform für professionelles Coaching
          </p>
          <div className="spots-indicator">
            <span className="pulse-dot"></span>
            Noch {availableSpots} Beta-Plätze verfügbar
          </div>
        </div>

        <div className="features-section">
          <h3 className="section-title">
            Entdecke die CoachingSpace Platform
          </h3>
          
          <div className="screenshots-grid">
            <div className="screenshot-item">
              <img 
               src="/dashboard.png"
                alt="Dashboard Übersicht" 
                className="screenshot-img"
              />
              <h4>Dashboard Übersicht</h4>
              <p>Coachee-Management & Task-Tracking</p>
            </div>
            
            <div className="screenshot-item">
              <img 
               src="/coaching-room.png" 
                alt="Coaching Room" 
                className="screenshot-img"
              />
              <h4>🟢 Coaching Room</h4>
              <p>Komplettes Remote-Cockpit</p>
            </div>
            
            <div className="screenshot-item">
              <img 
                src="/session-prep.png"
                alt="Session Vorbereitung" 
                className="screenshot-img"
              />
              <h4>Session-Planung</h4>
              <p>Strukturierte Coaching-Ansätze</p>
            </div>
          </div>

          <div className="features-grid">
            <div className="features-column">
              <h4>🎯 Hauptfeatures</h4>
              <ul>
                <li>• Coachee-Verwaltung & Profile</li>
                <li>• Session-Dokumentation & Journal</li>
                <li>• Task-Management & Deadlines</li>
                <li>• 🟢 Coaching Room (Remote-Cockpit)</li>
                <li>• 🟣 Coachee-Portal (separater Zugang)</li>
                <li>• 🟡 KI-Assistent (geplant)</li>
              </ul>
            </div>
            
            <div className="features-column">
              <h4>💎 Beta-Vorteile</h4>
              <ul>
                <li>• <strong>Lebenslange Vollversion-Lizenz</strong></li>
                <li>• Wert: 99€/Monat (regulärer Preis)</li>
                <li>• Direkter Einfluss auf Entwicklung</li>
                <li>• Exklusiver Beta-Tester Status</li>
                <li>• Persönlicher Support</li>
                <li>• Alle zukünftigen Updates inklusive</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="signup-section">
          <h2 className="signup-title">
            Jetzt Beta-Tester werden
          </h2>

          <form onSubmit={handleBetaSignup} className="signup-form">
            <div className="form-row">
              <div className="form-group">
                <label>Vorname *</label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  placeholder="Max"
                />
              </div>
              
              <div className="form-group">
                <label>Nachname *</label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  placeholder="Mustermann"
                />
              </div>
            </div>

            <div className="form-group">
              <label>E-Mail-Adresse *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="max@beispiel.com"
              />
            </div>

            <div className="form-group">
              <label>Unternehmen</label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({...formData, company: e.target.value})}
                placeholder="Coaching Praxis GmbH"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Coaching-Erfahrung</label>
                <select
                  value={formData.experience}
                  onChange={(e) => setFormData({...formData, experience: e.target.value})}
                >
                  <option value="" disabled>Erfahrung wählen</option>
                  <option value="Neueinsteiger">Neueinsteiger</option>
                  <option value="1-2 Jahre">1-2 Jahre</option>
                  <option value="3-5 Jahre">3-5 Jahre</option>
                  <option value="5+ Jahre">5+ Jahre</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Anzahl Coachees (optional)</label>
                <select
                  value={formData.coacheeCount}
                  onChange={(e) => setFormData({...formData, coacheeCount: e.target.value})}
                >
                  <option value="" disabled>Anzahl wählen</option>
                  <option value="1-5">1-5</option>
                  <option value="6-15">6-15</option>
                  <option value="16-30">16-30</option>
                  <option value="30+">30+</option>
                </select>
              </div>
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || availableSpots === 0}
              className="submit-button"
            >
              {loading ? 'Wird gesendet...' : `Beta-Platz reservieren (${availableSpots}/10)`}
            </button>
          </form>

          <div className="beta-conditions">
            <h4>⚠️ Wichtig: Bedingungen für kostenlose Vollversion</h4>
            <div className="conditions-content">
              <p><strong>1. Intensive Testphase:</strong> Alle 7 Hauptbereiche gründlich testen (mindestens 2 Stunden)</p>
              <p><strong>2. Detailliertes Feedback:</strong> Strukturiertes Formular per E-Mail ausfüllen</p>
              <p><strong>3. Spezifische Anforderungen:</strong> Mindestens 3 Probleme + 3 Verbesserungsvorschläge</p>
            </div>
            <div className="warning">
              <p>
                <strong>Warnung:</strong> Oberflächliches Feedback wie "App ist cool" berechtigt NICHT zur kostenlosen Vollversion.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Render success screen
  const renderSuccessScreen = () => (
    <div className="success-container">
      <div className="success-card">
        <div className="success-icon">✅</div>
        
        <h2>Willkommen, Beta-Tester #{userData?.beta_spot_number}!</h2>
        
        <p>Du hast erfolgreich einen Beta-Platz reserviert. Hier sind deine Login-Daten:</p>
        
        <div className="credentials-box">
          <h3>🔑 Deine Zugangsdaten</h3>
          <div className="credential-item">
            <span>E-Mail:</span>
            <div className="credential-value">{userData?.email}</div>
          </div>
          <div className="credential-item">
            <span>Temporäres Passwort:</span>
            <div className="credential-value">beta2024temp!</div>
          </div>
        </div>
        
        <div className="next-step-info">
          <p>
            <strong>Nächster Schritt:</strong> Gehe zur Login-Seite und melde dich mit diesen Daten an. 
            Du wirst aufgefordert, ein neues Passwort zu setzen.
          </p>
        </div>
        
        <button
          onClick={() => setCurrentStep('login')}
          className="continue-button"
        >
          Zur Login-Seite
        </button>
      </div>
    </div>
  );

  // Render login page
  const renderLoginPage = () => (
    <div className="login-container">
      <div className="login-card">
        <h2>Beta-Tester Login</h2>
        
        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label>E-Mail-Adresse</label>
            <input
              type="email"
              required
              value={loginData.email}
              onChange={(e) => setLoginData({...loginData, email: e.target.value})}
              placeholder="Deine Beta-E-Mail"
            />
          </div>
          
          <div className="form-group">
            <label>Passwort</label>
            <input
              type="password"
              required
              value={loginData.password}
              onChange={(e) => setLoginData({...loginData, password: e.target.value})}
              placeholder="beta2024temp! oder dein neues Passwort"
            />
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <button type="submit" disabled={loading} className="login-button">
            {loading ? 'Anmeldung...' : 'Anmelden'}
          </button>
        </form>
        
        <button
          onClick={() => setCurrentStep('landing')}
          className="back-button"
        >
          ← Zurück zur Landing Page
        </button>
      </div>
    </div>
  );

  // Render password change page
  const renderPasswordChangePage = () => (
    <div className="password-container">
      <div className="password-card">
        <h2>Neues Passwort setzen</h2>
        
        <p>Hallo {userData?.first_name}! Bitte setze ein neues, sicheres Passwort für dein Beta-Konto.</p>
        
        <form onSubmit={handlePasswordChange} className="password-form">
          <div className="form-group">
            <label>Neues Passwort</label>
            <input
              type="password"
              required
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
              placeholder="Mindestens 6 Zeichen"
            />
          </div>
          
          <div className="form-group">
            <label>Passwort bestätigen</label>
            <input
              type="password"
              required
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
              placeholder="Passwort wiederholen"
            />
          </div>
          
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
          
          <button type="submit" disabled={loading} className="password-button">
            {loading ? 'Wird gesetzt...' : 'Passwort setzen'}
          </button>
        </form>
      </div>
    </div>
  );

  // Render app redirect
  const renderAppRedirect = () => (
    <div className="app-redirect-container">
      <div className="app-redirect-card">
        <div className="success-icon">✅</div>
        
        <h2>Setup erfolgreich!</h2>
        
        <p>Willkommen in der CoachingSpace Beta! Du wirst nun zur App weitergeleitet.</p>
        
        <button
          onClick={() => {
            window.location.href = '/app';
          }}
          className="app-button"
        >
          CoachingSpace Beta starten
        </button>
        
        <div className="next-steps-info">
          <p>
            <strong>Deine nächsten Schritte:</strong><br/>
            1. App erkunden (alle 7 Module)<br/>
            2. Mindestens 2 Stunden testen<br/>
            3. Strukturiertes Feedback per E-Mail
          </p>
        </div>
      </div>
    </div>
  );

  // Main render
  switch (currentStep) {
    case 'landing':
      return renderLandingPage();
    case 'success':
      return renderSuccessScreen();
    case 'login':
      return renderLoginPage();
    case 'password':
      return renderPasswordChangePage();
    case 'app':
      return renderAppRedirect();
    default:
      return renderLandingPage();
  }
};

export default BetaLandingPage;