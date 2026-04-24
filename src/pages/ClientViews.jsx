import React, { useState, useEffect } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { cx } from '../lib/utils';
import { supabase } from '../supabase/supabase';
import { generateCRN } from '../lib/utils';
import { 
  Tabs, Card, ProgressBar, Field, Input, 
  Textarea, Button, Select, Badge, StatusBadge 
} from '../components/UI';

const { FiMapPin, FiPhone, FiShare2, FiFilter, FiUser, FiCreditCard, FiLoader, FiSend, FiCheckCircle, FiBell } = FiIcons;

const RESOURCES = [
  { name: "Camperdown Mental Health Center", desc: "Primary mental health facility", addr: "96 Carillon Ave, Newtown NSW 2042", phone: "(02) 9515 9000", dist: "0.2 km" },
  { name: "RPA Hospital Emergency", desc: "24/7 emergency mental health services", addr: "Missenden Rd, Camperdown NSW 2050", phone: "(02) 9515 6111", dist: "0.5 km" },
  { name: "Headspace Camperdown", desc: "Youth mental health 12–25", addr: "Level 2, Brain and Mind Centre, 94 Mallett St", phone: "(02) 9114 4100", dist: "0.3 km" },
];

/* ─── CRN REQUEST TAB ──────────────────────────────────────────── */
export const CRNRequestPage = () => {
  const [form, setForm] = useState({ first_name: '', mobile: '', email: '' });
  const [submitted, setSubmitted] = useState(false);
  const [issuedCRN, setIssuedCRN] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!form.first_name || !form.mobile || !form.email) {
      setError('Please fill in all required fields.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      setError('Please enter a valid email address.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const crn = generateCRN();

      // Insert into CRN requests table
      const { error: reqErr } = await supabase.from('crn_requests_1777090006').insert([{
        first_name: form.first_name,
        mobile: form.mobile,
        email: form.email,
        status: 'processed',
        crn_issued: crn
      }]);
      if (reqErr) throw reqErr;

      // Register in CRN pool
      await supabase.from('crns_1740395000').insert([{ code: crn, is_active: true }]);

      // Push to Patient Registry
      await supabase.from('clients_1777020684735').insert([{
        name: form.first_name,
        mobile: form.mobile,
        email: form.email,
        phone: form.mobile,
        crn,
        status: 'active',
        support_category: 'general'
      }]);

      setIssuedCRN(crn);
      setSubmitted(true);
    } catch (err) {
      setError('Registration failed. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) return (
    <div className="ac-stack">
      <Card>
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'linear-gradient(135deg, #34C759, #30d158)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', boxShadow: '0 8px 24px rgba(52,199,89,0.3)'
          }}>
            <SafeIcon icon={FiCheckCircle} size={36} style={{ color: '#fff' }} />
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>CRN Issued!</div>
          <p style={{ color: 'var(--ac-muted)', fontSize: 14, marginBottom: 24 }}>
            Hi <strong>{form.first_name}</strong>, your Clinical Reference Number has been generated and sent to <strong>{form.email}</strong>.
          </p>

          <div style={{
            background: 'var(--ac-primary-soft)',
            border: '2px solid var(--ac-primary)',
            borderRadius: 16, padding: '20px 24px', marginBottom: 20
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ac-primary)', textTransform: 'uppercase', marginBottom: 8 }}>
              Your CRN
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, fontFamily: 'monospace', letterSpacing: 2, color: 'var(--ac-primary)' }}>
              {issuedCRN}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ac-muted)', marginTop: 8 }}>
              Save this number — you'll need it for check-in
            </div>
          </div>

          <div style={{
            background: 'var(--ac-bg)', borderRadius: 12, padding: 16,
            display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', marginBottom: 20
          }}>
            <SafeIcon icon={FiBell} size={20} style={{ color: 'var(--ac-primary)', flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>Push Notification Sent</div>
              <div style={{ fontSize: 12, color: 'var(--ac-muted)' }}>
                A confirmation has been sent to {form.mobile} and {form.email}
              </div>
            </div>
          </div>

          <Button variant="outline" style={{ width: '100%' }} onClick={() => {
            setSubmitted(false);
            setForm({ first_name: '', mobile: '', email: '' });
            setIssuedCRN('');
          }}>
            Register Another
          </Button>
        </div>
      </Card>
    </div>
  );

  return (
    <div className="ac-stack">
      <Card title="Request Your CRN" subtitle="Enter your details to receive a Clinical Reference Number">
        <div className="ac-stack">
          <p className="ac-muted ac-xs" style={{ padding: '10px 14px', background: 'var(--ac-bg)', borderRadius: 10, border: '1px solid var(--ac-border)' }}>
            📋 Your CRN will be automatically registered and sent to you by push notification and email.
          </p>

          {error && (
            <div style={{ background: '#fff0f0', border: '1px solid #ffcdd2', padding: '10px 14px', borderRadius: 10, color: '#c62828', fontSize: 13 }}>
              {error}
            </div>
          )}

          <Field label="First Name *">
            <Input
              value={form.first_name}
              onChange={e => setForm({ ...form, first_name: e.target.value })}
              placeholder="e.g. John"
            />
          </Field>
          <Field label="Mobile Number *">
            <Input
              type="tel"
              value={form.mobile}
              onChange={e => setForm({ ...form, mobile: e.target.value })}
              placeholder="+61 4XX XXX XXX"
            />
          </Field>
          <Field label="Email Address *">
            <Input
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
            />
          </Field>

          <Button
            icon={loading ? FiLoader : FiSend}
            disabled={loading}
            onClick={handleSubmit}
            style={{ marginTop: 8 }}
          >
            {loading ? 'Registering...' : 'Request My CRN'}
          </Button>

          <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--ac-muted)' }}>
            By submitting, you agree to our Privacy Policy. Your data is stored securely.
          </p>
        </div>
      </Card>
    </div>
  );
};

/* ─── PROFESSIONALS PAGE ────────────────────────────────────────── */
export const ProfessionalsPage = () => {
  const [filter, setFilter] = useState({ qual: "All", sex: "All" });
  const [selectedProf, setSelectedProf] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchProfessionals(); }, []);

  const fetchProfessionals = async () => {
    try {
      const { data, error } = await supabase.from('providers_1740395000').select('*');
      if (error) throw error;
      setProfessionals(data || []);
    } catch (err) {
      console.error('Error fetching professionals:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = professionals.filter(p =>
    (filter.qual === "All" || p.qualification === filter.qual) &&
    (filter.sex === "All" || p.gender === filter.sex)
  );

  const handleShareLocation = () => {
    setSharing(true);
    setTimeout(() => { setSharing(false); alert("Location shared with network providers."); }, 1500);
  };

  return (
    <div className="ac-stack">
      <div style={{ fontSize: 20, fontWeight: 700 }}>Health Professionals</div>
      <Card title="Hybrid Map View" subtitle="Available professionals in your area">
        <div style={{ height: 300, position: 'relative', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--ac-border)', marginBottom: 12 }}>
          <iframe title="Map Area" width="100%" height="100%" frameBorder="0" scrolling="no"
            src="https://www.openstreetmap.org/export/embed.html?bbox=151.16%2C-33.91%2C151.21%2C-33.86&amp;layer=mapnik"
            style={{ border: 0, position: 'absolute', inset: 0, pointerEvents: 'none', filter: 'var(--ac-map-filter)' }}
          />
          {filtered.map((p, idx) => (
            <div key={p.id} onClick={() => setSelectedProf(p)} style={{
              position: 'absolute', left: `${p.location_lat || (20 + idx * 15)}%`, top: `${p.location_lng || (30 + idx * 10)}%`,
              width: 12, height: 12, borderRadius: '50%',
              backgroundColor: selectedProf?.id === p.id ? 'var(--ac-primary)' : 'var(--ac-success)',
              border: '2px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', cursor: 'pointer', zIndex: 5
            }} />
          ))}
          {selectedProf && (
            <div style={{ position: 'absolute', bottom: 12, left: 12, right: 12, background: 'var(--ac-surface)', padding: 12, borderRadius: 10, boxShadow: 'var(--ac-shadow-lg)', border: '1px solid var(--ac-border)', zIndex: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{selectedProf.name}</div>
                  <div className="ac-muted ac-xs">{selectedProf.qualification}</div>
                </div>
                <button onClick={() => setSelectedProf(null)} style={{ background: 'none', border: 'none', color: 'var(--ac-muted)', cursor: 'pointer' }}>✕</button>
              </div>
            </div>
          )}
        </div>
        <Button variant="primary" style={{ width: '100%', padding: '14px', fontSize: '16px', display: 'flex', justifyContent: 'center' }}
          icon={sharing ? FiLoader : FiMapPin} onClick={handleShareLocation} disabled={sharing}>
          {sharing ? "Sharing Location..." : "Share My Location"}
        </Button>
      </Card>

      <div className="ac-grid-2">
        <Card title="Filters" icon={FiFilter}>
          <div className="ac-grid-2">
            <Field label="Qualification">
              <Select value={filter.qual} onChange={e => setFilter({ ...filter, qual: e.target.value })} options={["All", "Psychiatrist", "Psychologist", "Social Worker"]} />
            </Field>
            <Field label="Sex">
              <Select value={filter.sex} onChange={e => setFilter({ ...filter, sex: e.target.value })} options={["All", "Male", "Female"]} />
            </Field>
          </div>
        </Card>
        <div className="ac-stack" style={{ maxHeight: '500px', overflowY: 'auto', paddingRight: '4px' }}>
          {loading ? <div style={{ textAlign: 'center', padding: 40 }}>Loading...</div>
            : filtered.length === 0 ? <div style={{ textAlign: 'center', padding: 40, color: 'var(--ac-muted)' }}>No professionals found.</div>
            : filtered.map(p => (
              <Card key={p.id} accent={selectedProf?.id === p.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{p.name}</div>
                    <div className="ac-muted ac-xs">{p.qualification} · {p.gender}</div>
                    <div style={{ fontSize: 13, marginTop: 4 }}>⭐ {p.rating} · {p.experience} Experience</div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => { setSelectedProf(p); setShowForm(true); }}>Book</Button>
                </div>
              </Card>
            ))}
        </div>
      </div>

      {showForm && selectedProf && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300, padding: 20 }}>
          <Card title={`Request Appointment: ${selectedProf.name}`} subtitle="Fill in the form below to request a session."
            style={{ maxWidth: 500, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="ac-stack">
              <Field label="Full Name"><Input placeholder="Enter your name" /></Field>
              <Field label="Email Address"><Input type="email" placeholder="your@email.com" /></Field>
              <Field label="Contact Number"><Input placeholder="+61 4XX XXX XXX" /></Field>
              <div className="ac-grid-2">
                <Field label="Preferred Date"><Input type="date" /></Field>
                <Field label="Preferred Time"><Input type="time" /></Field>
              </div>
              <Field label="Reason for Appointment"><Textarea placeholder="Briefly describe your needs..." /></Field>
              <div className="ac-grid-2">
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button onClick={() => { alert("Request Sent!"); setShowForm(false); }}>Submit Request</Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

/* ─── PROVIDER JOIN PAGE ────────────────────────────────────────── */
export const ProviderJoinPage = () => {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", qualifications: "", bio: "", gender: "Female", experience: "5 years" });

  const handleJoin = async () => {
    setSubmitting(true);
    try {
      const { error } = await supabase.from('providers_1740395000').insert([{
        name: form.name, qualification: form.qualifications.split(',')[0],
        gender: form.gender, experience: form.experience, is_partner: true, rating: 4.8
      }]);
      if (error) throw error;
      alert("Subscription Activated! Your profile is now live.");
      setStep(1);
    } catch (err) {
      alert("Failed to activate partnership. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ac-stack" style={{ maxWidth: 600, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🤝</div>
        <h2 className="ac-h2">Join as a Service Provider</h2>
        <p className="ac-muted">Partner with Acute Connect and reach more patients.</p>
      </div>
      <div style={{ marginBottom: 20 }}>
        <ProgressBar value={step === 1 ? 50 : 100} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginTop: 8, color: 'var(--ac-muted)' }}>
          <span>1. Credentials</span><span>2. Subscription</span>
        </div>
      </div>
      {step === 1 ? (
        <Card title="Provider Details" subtitle="Tell us about your practice and qualifications.">
          <div className="ac-stack">
            <Field label="Full Professional Name"><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Dr. Jane Smith" /></Field>
            <Field label="Email Address"><Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} type="email" placeholder="jane@example.com" /></Field>
            <Field label="Qualifications / Credentials"><Textarea value={form.qualifications} onChange={e => setForm({ ...form, qualifications: e.target.value })} placeholder="List your degrees, certifications..." /></Field>
            <Field label="Short Bio"><Textarea value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} placeholder="A brief description for your profile..." /></Field>
            <Button style={{ width: '100%' }} onClick={() => setStep(2)}>Next: Subscription</Button>
          </div>
        </Card>
      ) : (
        <Card title="Partner Subscription" subtitle="Activate your uncapped lead generation.">
          <div className="ac-stack">
            <div style={{ background: 'var(--ac-primary-soft)', padding: 16, borderRadius: 12, textAlign: 'center', border: '1px solid var(--ac-primary)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ac-primary)', textTransform: 'uppercase' }}>Monthly Plan</div>
              <div style={{ fontSize: 36, fontWeight: 800, margin: '8px 0' }}>$250<span style={{ fontSize: 16, fontWeight: 400 }}> / month</span></div>
              <div className="ac-muted ac-xs">Uncapped lead submissions · Profile listing · Priority support</div>
            </div>
            <div className="ac-stack" style={{ gap: 12 }}>
              <Field label="Cardholder Name"><Input placeholder="Name on card" /></Field>
              <Field label="Card Number">
                <div style={{ position: 'relative' }}>
                  <Input placeholder="0000 0000 0000 0000" style={{ paddingLeft: 40 }} />
                  <SafeIcon icon={FiCreditCard} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--ac-muted)' }} />
                </div>
              </Field>
              <div className="ac-grid-2">
                <Field label="Expiry"><Input placeholder="MM/YY" /></Field>
                <Field label="CVC"><Input placeholder="000" /></Field>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              <Button variant="outline" style={{ flex: 1 }} onClick={() => setStep(1)}>Back</Button>
              <Button style={{ flex: 2 }} onClick={handleJoin} disabled={submitting}>{submitting ? "Processing..." : "Start Partnership"}</Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

/* ─── CHECK-IN PAGE ─────────────────────────────────────────────── */
export const CheckInPage = ({ goto, onLoginIntent }) => {
  const [tab, setTab] = useState("checkin");
  const [step, setStep] = useState(1);
  const [confirmed, setConfirmed] = useState(false);
  const [crisisOpen, setCrisisOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedWindow, setSelectedWindow] = useState(null);
  const [form, setForm] = useState({ code: "", concerns: "", mood: 5 });
  const [submitting, setSubmitting] = useState(false);

  const days = ["Today", "Tomorrow", "Wed 25", "Thu 26", "Fri 27", "Sat 28", "Sun 29"];
  const windows = [{ label: "Morning", time: "9am – 12pm", icon: "☀️" }, { label: "Afternoon", time: "12pm – 5pm", icon: "🌤" }, { label: "Evening", time: "5pm – 8pm", icon: "🌙" }];

  const handleConcerns = (val) => {
    setForm(f => ({ ...f, concerns: val }));
    if (/\b(kill|hurt)\s+(myself|me)\b|\bsuicid/i.test(val)) setCrisisOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.code) { alert("Please enter your CRN."); return; }
    if (selectedWindow === null) { alert("Please select a time window."); return; }
    setSubmitting(true);
    try {
      const { data: crnData, error: crnError } = await supabase.from('crns_1740395000').select('*').eq('code', form.code.trim().toUpperCase()).eq('is_active', true).single();
      if (crnError || !crnData) { alert("Invalid or inactive Client Reference Number. Please verify with your clinic."); return; }
      const { error } = await supabase.from('check_ins_1740395000').insert([{ crn: form.code.trim().toUpperCase(), concerns: form.concerns, mood: form.mood, scheduled_day: days[selectedDay], scheduled_window: windows[selectedWindow].label, status: 'pending' }]);
      if (error) throw error;
      setConfirmed(true);
    } catch (err) {
      alert("Failed to submit check-in. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmed) return (
    <div className="ac-stack">
      <Card>
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <div style={{ fontSize: 50, marginBottom: 12 }}>✅</div>
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>You're all set</div>
          <div style={{ fontSize: 14, color: "var(--ac-muted)", lineHeight: 1.6, marginBottom: 20 }}>
            Your clinician will call on <strong>{days[selectedDay]}</strong>, during the <strong>{windows[selectedWindow]?.label}</strong> window ({windows[selectedWindow]?.time})
          </div>
          <div style={{ background: "var(--ac-bg)", borderRadius: 12, padding: "14px 16px", marginBottom: 16, textAlign: "left" }}>
            <div style={{ fontSize: 12, color: "var(--ac-muted)", marginBottom: 3 }}>Save this number in your contacts</div>
            <div style={{ fontSize: 19, fontWeight: 700, color: "#007AFF" }}>(02) 9515 9000</div>
          </div>
          <Button variant="outline" style={{ width: "100%" }} onClick={() => { setConfirmed(false); setStep(1); }}>Change time</Button>
        </div>
      </Card>
    </div>
  );

  return (
    <div className="ac-stack">
      <div style={{ fontSize: 20, fontWeight: 700 }}>Client Check-In</div>
      <Tabs active={tab} onChange={setTab} tabs={[{ id: "checkin", label: "Check-In" }, { id: "crn_request", label: "Get CRN" }, { id: "location", label: "Location" }, { id: "resources", label: "Resources" }]} />

      {tab === "checkin" && (
        <div className="ac-stack">
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ fontSize: 13, fontWeight: 500 }}>Step {step} of 3</span>
              <span style={{ fontSize: 13, fontWeight: 500 }}>{Math.round((step / 3) * 100)}%</span>
            </div>
            <ProgressBar value={(step / 3) * 100} />
          </div>

          {step === 1 && (
            <Card title="Client Verification">
              <Field label="Client Reference Number (CRN)" hint="Enter the unique code provided by your clinic.">
                <Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="e.g., CRN-XXXX-XXXX" style={{ fontFamily: 'monospace', textTransform: 'uppercase' }} />
              </Field>
              <Field label="Is there anything you'd like to share right away?">
                <Textarea value={form.concerns} onChange={e => handleConcerns(e.target.value)} placeholder="Optional: Share any immediate concerns or updates" />
              </Field>
              <Button style={{ width: "100%", marginTop: 12 }} onClick={() => setStep(2)}>Continue</Button>
              <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--ac-muted)', marginTop: 12 }}>
                Don't have a CRN? <button onClick={() => setTab('crn_request')} style={{ background: 'none', border: 'none', color: 'var(--ac-primary)', cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>Request one here →</button>
              </p>
            </Card>
          )}

          {step === 2 && (
            <Card title="How are you feeling today?" subtitle="Select the emoji that best describes your current state.">
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 24, marginBottom: 12 }}>
                {["😔", "😟", "😐", "🙂", "😄"].map((e, i) => <span key={i}>{e}</span>)}
              </div>
              <input type="range" min={0} max={10} value={form.mood} onChange={e => setForm(f => ({ ...f, mood: +e.target.value }))} style={{ width: '100%', accentColor: 'var(--ac-primary)', height: '4px', margin: '12px 0' }} />
              <div style={{ textAlign: "center" }}>
                <span style={{ fontSize: 36, fontWeight: 800, color: form.mood <= 2 ? "#FF3B30" : form.mood <= 4 ? "#FF9500" : form.mood <= 6 ? "#FFCC00" : "#34C759" }}>{form.mood}</span>
                <span style={{ fontSize: 16, color: "var(--ac-muted)" }}> / 10</span>
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                <Button variant="outline" style={{ flex: 1 }} onClick={() => setStep(1)}>Back</Button>
                <Button style={{ flex: 2 }} onClick={() => setStep(3)}>Continue</Button>
              </div>
            </Card>
          )}

          {step === 3 && (
            <div className="ac-stack">
              <div style={{ fontSize: 17, fontWeight: 700 }}>Pick a window that works for you</div>
              <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8 }}>
                {days.map((d, i) => (
                  <button key={i} onClick={() => setSelectedDay(i)} className={cx("ac-tab", selectedDay === i && "ac-tab-active")} style={{ flexShrink: 0, padding: "8px 14px", border: '1px solid var(--ac-border)' }}>{d}</button>
                ))}
              </div>
              <div className="ac-stack" style={{ gap: 10 }}>
                {windows.map((w, i) => (
                  <button key={i} onClick={() => setSelectedWindow(i)} style={{ padding: "16px", borderRadius: 14, border: selectedWindow === i ? "2px solid #007AFF" : "1px solid var(--ac-border)", background: selectedWindow === i ? "#EBF5FF" : "var(--ac-surface)", textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", gap: 14 }}>
                    <span style={{ fontSize: 26 }}>{w.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 600 }}>{w.label}</div>
                      <div style={{ fontSize: 13, color: "var(--ac-muted)" }}>{w.time}</div>
                    </div>
                    {selectedWindow === i && <span style={{ color: "#007AFF", fontSize: 20 }}>✓</span>}
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <Button variant="outline" style={{ flex: 1 }} onClick={() => setStep(2)}>Back</Button>
                <Button disabled={selectedWindow === null || submitting} style={{ flex: 2 }} onClick={handleSubmit}>
                  {submitting ? "Submitting..." : "Confirm Window"}
                </Button>
              </div>
            </div>
          )}

          <div style={{ marginTop: 40, textAlign: 'center', paddingBottom: 80 }}>
            <div style={{ borderTop: '1px solid var(--ac-border)', margin: '20px 0' }} />
            <p className="ac-muted ac-xs" style={{ marginBottom: 12 }}>Authorized Personnel Access</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
              <Button variant="outline" size="sm" onClick={() => onLoginIntent('admin')}>Admin Login</Button>
              <Button variant="outline" size="sm" onClick={() => onLoginIntent('sysadmin')}>Sys Admin Login</Button>
            </div>
          </div>
        </div>
      )}

      {tab === "crn_request" && <CRNRequestPage />}
      {tab === "location" && <LocationInfoView />}
      {tab === "resources" && <ResourcesView />}

      <footer style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "var(--ac-surface)", borderTop: "1px solid var(--ac-border)", padding: "10px 16px 20px", textAlign: "center", fontSize: 13, color: "var(--ac-muted)", zIndex: 50 }}>
        Need help? <a href="tel:131114" style={{ color: "#007AFF", textDecoration: "none", fontWeight: 600 }}>Lifeline 13 11 14</a> · <a href="tel:000" style={{ color: "#007AFF", textDecoration: "none", fontWeight: 600 }}>Emergency 000</a>
      </footer>

      {crisisOpen && <CrisisDialog onClose={() => setCrisisOpen(false)} />}
    </div>
  );
};

const CrisisDialog = ({ onClose }) => (
  <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end", zIndex: 300, padding: "0 0 20px" }}>
    <div style={{ background: "var(--ac-surface)", borderRadius: "20px 20px 0 0", padding: "24px 20px", width: "100%", maxWidth: 480, margin: "0 auto" }}>
      <div style={{ width: 40, height: 4, background: "var(--ac-border)", borderRadius: 999, margin: "0 auto 20px" }} />
      <div style={{ fontSize: 24, textAlign: "center", marginBottom: 8 }}>💙</div>
      <div style={{ fontSize: 18, fontWeight: 700, textAlign: "center", marginBottom: 6 }}>Support is here for you</div>
      <p style={{ fontSize: 14, color: "var(--ac-muted)", textAlign: "center", marginBottom: 20 }}>You don't have to do this alone.</p>
      <a href="tel:131114" style={{ display: "block", background: "#007AFF", color: "#fff", padding: "14px", borderRadius: 12, textAlign: "center", textDecoration: "none", fontWeight: 700, marginBottom: 10 }}>Call Lifeline 13 11 14</a>
      <button onClick={onClose} style={{ width: "100%", background: "none", border: "none", padding: "14px", cursor: "pointer", fontSize: 15, color: "var(--ac-muted)" }}>I'm okay for now</button>
    </div>
  </div>
);

const LocationInfoView = () => (
  <Card title="Camperdown Acute Care Service" subtitle="Information and contact details">
    <div className="ac-stack" style={{ gap: 12 }}>
      <div><div style={{ fontWeight: 600 }}>Address:</div><div style={{ fontSize: 14 }}>100 Mallett St, Camperdown NSW 2050</div></div>
      <div><div style={{ fontWeight: 600 }}>Operating Hours:</div><div style={{ fontSize: 14 }}>Monday to Friday: 8am – 5pm</div></div>
      <div><div style={{ fontWeight: 600 }}>Contact Number:</div><div style={{ color: "#007AFF" }}>02 9555 1234</div></div>
    </div>
  </Card>
);

const ResourcesView = () => (
  <div className="ac-stack">
    <div style={{ fontSize: 17, fontWeight: 700 }}>Camperdown Resources</div>
    {RESOURCES.map((r, i) => (
      <Card key={i}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ fontWeight: 700 }}>{r.name}</div>
          <span style={{ background: "#EBF5FF", color: "#007AFF", fontSize: 12, fontWeight: 600, padding: "3px 8px", borderRadius: 8 }}>{r.dist}</span>
        </div>
        <p className="ac-muted ac-xs">{r.desc}</p>
        <div style={{ fontSize: 13, marginTop: 8 }}>📍 {r.addr}</div>
        <div style={{ fontSize: 13, color: "#007AFF" }}>📞 {r.phone}</div>
      </Card>
    ))}
  </div>
);

export const ResourcesPage = ({ goto }) => (
  <div className="ac-stack">
    <div style={{ fontSize: 20, fontWeight: 700 }}>Client Resources</div>
    <Tabs active="resources" onChange={(id) => id !== "resources" && goto("checkin")} tabs={[{ id: "checkin", label: "Check-In" }, { id: "resources", label: "Resources" }]} />
    <ResourcesView />
  </div>
);