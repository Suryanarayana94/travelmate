import { useEffect, useMemo, useRef, useState } from 'react';
import { BadgeCheck, Camera, Check, KeyRound, Mail, MapPin, Phone, Save, Sparkles, Trash2, UserRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ROLE_MAP } from '../../lib/constants';
import { formatDate } from '../../lib/format';
import { Avatar, InlineNotice, Spinner } from '../../components/ui';

const splitList = (list) => (Array.isArray(list) ? list.join(', ') : '');
const joinList = (value) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 20);

const ProfilePage = () => {
  const { user, updateProfile, changePassword } = useAuth();
  const { success, error: toastError } = useToast();
  const fileInputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    state: '',
    bio: '',
    website: '',
    languages: '',
    specialities: '',
    experienceYears: 0,
    dailyRate: 0,
    vehicleTypes: '',
    serviceAreas: '',
    hotelCategory: '',
    amenities: ''
  });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    setForm({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      city: user.city || '',
      state: user.state || '',
      bio: user.bio || '',
      website: user.website || '',
      languages: splitList(user.languages),
      specialities: splitList(user.specialities),
      experienceYears: user.experienceYears || 0,
      dailyRate: user.dailyRate || 0,
      vehicleTypes: splitList(user.vehicleTypes),
      serviceAreas: splitList(user.serviceAreas),
      hotelCategory: user.hotelCategory || '',
      amenities: splitList(user.amenities)
    });
  }, [user]);

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  const role = ROLE_MAP[user.role];

  const onFile = (event) => {
    const selected = event.target.files?.[0];
    if (!selected) return;
    if (selected.size > 3 * 1024 * 1024) {
      setError('Please choose an image smaller than 3 MB.');
      return;
    }
    setError('');
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  const removeSelectedFile = () => {
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    const data = new FormData();
    ['name', 'email', 'phone', 'city', 'state', 'bio', 'website', 'hotelCategory'].forEach((key) =>
      data.append(key, form[key])
    );
    ['languages', 'specialities', 'vehicleTypes', 'serviceAreas', 'amenities'].forEach((key) =>
      data.append(key, JSON.stringify(joinList(form[key])))
    );
    data.append('experienceYears', form.experienceYears);
    data.append('dailyRate', form.dailyRate);
    if (file) data.append('profileImage', file);

    try {
      await updateProfile(data);
      setFile(null);
      setPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      success('Profile saved. Your dashboards now show the new details.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const savePassword = async (event) => {
    event.preventDefault();
    setPasswordError('');
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return setPasswordError('New passwords do not match.');
    }
    setPasswordSaving(true);
    try {
      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      success('Password changed successfully.');
    } catch (requestError) {
      setPasswordError(requestError.message);
    } finally {
      setPasswordSaving(false);
    }
  };

  const completion = useMemo(() => {
    const fields = [form.name, form.email, form.phone, form.city, form.bio, user.profileImage || file];
    return Math.round((fields.filter(Boolean).length / fields.length) * 100);
  }, [form, user.profileImage, file]);

  return (
    <div className="dashboard-page profile-page">
      <div className="dashboard-split profile-layout">
        <section className="panel">
          <div className="panel-head">
            <div>
              <h2><UserRound size={19} /> Profile details</h2>
              <p>These details appear on your dashboard and on the services you publish.</p>
            </div>
            <span className={`role-chip role-chip-${role.color} compact`}>{role.label}</span>
          </div>

          {error && <InlineNotice type="error">{error}</InlineNotice>}

          <div className="avatar-editor">
            <div className="avatar-preview">
              <Avatar user={user} src={preview} size={96} />
              {file && (
                <button type="button" className="avatar-remove" onClick={removeSelectedFile} aria-label="Remove selected photo">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
            <div>
              <h3>Profile photo</h3>
              <p>JPG, PNG, WEBP or GIF up to 3 MB. Square images look best.</p>
              <div className="avatar-actions">
                <button type="button" className="btn btn-outline btn-small" onClick={() => fileInputRef.current?.click()}>
                  <Camera size={15} /> {user.profileImage ? 'Change photo' : 'Upload photo'}
                </button>
                {file && <span className="file-name"><Check size={14} /> {file.name}</span>}
              </div>
              <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={onFile} hidden />
            </div>
          </div>

          <form className="profile-form" onSubmit={save}>
            <div className="field-grid">
              <label className="field">
                <span><UserRound size={15} /> {user.role === 'traveller' ? 'Full name' : 'Name / business name'}</span>
                <input required value={form.name} onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))} />
              </label>
              <label className="field">
                <span><Mail size={15} /> Email</span>
                <input type="email" required value={form.email} onChange={(e) => setForm((c) => ({ ...c, email: e.target.value }))} />
              </label>
            </div>
            <div className="field-grid">
              <label className="field">
                <span><Phone size={15} /> Phone</span>
                <input value={form.phone} onChange={(e) => setForm((c) => ({ ...c, phone: e.target.value }))} placeholder="+91 ..." />
              </label>
              <label className="field">
                <span><MapPin size={15} /> City</span>
                <input value={form.city} onChange={(e) => setForm((c) => ({ ...c, city: e.target.value }))} />
              </label>
            </div>
            <div className="field-grid">
              <label className="field">
                <span>State</span>
                <input value={form.state} onChange={(e) => setForm((c) => ({ ...c, state: e.target.value }))} />
              </label>
              <label className="field">
                <span>Languages (comma separated)</span>
                <input value={form.languages} onChange={(e) => setForm((c) => ({ ...c, languages: e.target.value }))} placeholder="English, Hindi, Telugu" />
              </label>
            </div>
            <label className="field">
              <span>About you</span>
              <textarea rows="4" maxLength="800" value={form.bio} onChange={(e) => setForm((c) => ({ ...c, bio: e.target.value }))} placeholder="Tell travellers what makes your service special..." />
            </label>

            {user.role === 'guide' && (
              <div className="field-section">
                <h4>Guide details</h4>
                <div className="field-grid">
                  <label className="field">
                    <span>Specialities</span>
                    <input value={form.specialities} onChange={(e) => setForm((c) => ({ ...c, specialities: e.target.value }))} placeholder="Heritage walks, Food trails" />
                  </label>
                  <label className="field">
                    <span>Years of experience</span>
                    <input type="number" min="0" max="60" value={form.experienceYears} onChange={(e) => setForm((c) => ({ ...c, experienceYears: e.target.value }))} />
                  </label>
                </div>
                <div className="field-grid">
                  <label className="field">
                    <span>Typical day rate (₹)</span>
                    <input type="number" min="0" value={form.dailyRate} onChange={(e) => setForm((c) => ({ ...c, dailyRate: e.target.value }))} />
                  </label>
                  <label className="field">
                    <span>Service areas</span>
                    <input value={form.serviceAreas} onChange={(e) => setForm((c) => ({ ...c, serviceAreas: e.target.value }))} placeholder="Goa, Karnataka coast" />
                  </label>
                </div>
              </div>
            )}

            {user.role === 'transport' && (
              <div className="field-section">
                <h4>Agency details</h4>
                <div className="field-grid">
                  <label className="field">
                    <span>Vehicle types</span>
                    <input value={form.vehicleTypes} onChange={(e) => setForm((c) => ({ ...c, vehicleTypes: e.target.value }))} placeholder="Sedan, SUV, Tempo Traveller" />
                  </label>
                  <label className="field">
                    <span>Years in operation</span>
                    <input type="number" min="0" max="60" value={form.experienceYears} onChange={(e) => setForm((c) => ({ ...c, experienceYears: e.target.value }))} />
                  </label>
                </div>
                <div className="field-grid">
                  <label className="field">
                    <span>Service areas</span>
                    <input value={form.serviceAreas} onChange={(e) => setForm((c) => ({ ...c, serviceAreas: e.target.value }))} placeholder="Maharashtra, Goa, Karnataka" />
                  </label>
                  <label className="field">
                    <span>Website</span>
                    <input value={form.website} onChange={(e) => setForm((c) => ({ ...c, website: e.target.value }))} placeholder="https://" />
                  </label>
                </div>
              </div>
            )}

            {user.role === 'hotel' && (
              <div className="field-section">
                <h4>Property details</h4>
                <div className="field-grid">
                  <label className="field">
                    <span>Category</span>
                    <select value={form.hotelCategory} onChange={(e) => setForm((c) => ({ ...c, hotelCategory: e.target.value }))}>
                      <option value="">Select category</option>
                      <option value="budget">Budget</option>
                      <option value="standard">Standard</option>
                      <option value="premium">Premium</option>
                      <option value="heritage">Heritage</option>
                      <option value="homestay">Homestay</option>
                    </select>
                  </label>
                  <label className="field">
                    <span>Amenities</span>
                    <input value={form.amenities} onChange={(e) => setForm((c) => ({ ...c, amenities: e.target.value }))} placeholder="Breakfast, Wi-Fi, AC" />
                  </label>
                </div>
                <div className="field-grid">
                  <label className="field">
                    <span>Service areas</span>
                    <input value={form.serviceAreas} onChange={(e) => setForm((c) => ({ ...c, serviceAreas: e.target.value }))} placeholder="Goa, Kerala, Rajasthan" />
                  </label>
                  <label className="field">
                    <span>Website</span>
                    <input value={form.website} onChange={(e) => setForm((c) => ({ ...c, website: e.target.value }))} placeholder="https://" />
                  </label>
                </div>
              </div>
            )}

            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? <><Spinner size={16} /> Saving...</> : <><Save size={16} /> Save profile</>}
              </button>
              <span className="muted-note">Stored securely in MongoDB.</span>
            </div>
          </form>
        </section>

        <aside className="dashboard-aside">
          <section className="panel">
            <h2><Sparkles size={19} /> Profile strength</h2>
            <div className="completion-ring" style={{ '--value': `${completion}%` }}>
              <strong>{completion}%</strong>
            </div>
            <p className="sidebar-note">Complete your name, photo, phone, city and bio to make your profile more useful to travellers.</p>
            <ul className="check-list">
              <li className={form.name ? 'done' : ''}><Check size={14} /> Name added</li>
              <li className={form.phone ? 'done' : ''}><Check size={14} /> Phone added</li>
              <li className={form.city ? 'done' : ''}><Check size={14} /> City added</li>
              <li className={form.bio ? 'done' : ''}><Check size={14} /> Bio added</li>
              <li className={user.profileImage || file ? 'done' : ''}><Check size={14} /> Photo uploaded</li>
            </ul>
          </section>

          <section className="panel">
            <h2><BadgeCheck size={19} /> Account</h2>
            <div className="info-list">
              <div><span><small>Role</small>{role.label}</span></div>
              <div><span><small>Member since</small>{formatDate(user.createdAt)}</span></div>
              <div><span><small>Last sign-in</small>{formatDate(user.lastLoginAt)}</span></div>
              <div><span><small>Status</small>{user.verified ? 'Verified provider' : 'Active account'}</span></div>
            </div>
          </section>

          <section className="panel">
            <h2><KeyRound size={19} /> Change password</h2>
            {passwordError && <InlineNotice type="error">{passwordError}</InlineNotice>}
            <form className="profile-form compact" onSubmit={savePassword}>
              <label className="field">
                <span>Current password</span>
                <input type="password" required value={passwordForm.currentPassword} onChange={(e) => setPasswordForm((c) => ({ ...c, currentPassword: e.target.value }))} />
              </label>
              <label className="field">
                <span>New password</span>
                <input type="password" required minLength="8" value={passwordForm.newPassword} onChange={(e) => setPasswordForm((c) => ({ ...c, newPassword: e.target.value }))} />
              </label>
              <label className="field">
                <span>Confirm new password</span>
                <input type="password" required minLength="8" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm((c) => ({ ...c, confirmPassword: e.target.value }))} />
              </label>
              <button type="submit" className="btn btn-outline btn-small" disabled={passwordSaving}>
                {passwordSaving ? <Spinner size={15} /> : 'Update password'}
              </button>
            </form>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default ProfilePage;
