import React, { useEffect, useState } from 'react';
import { Shield, Upload, RefreshCw, Users, Trash2, Download, AlertTriangle, CheckCircle, Lock, Mail, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { deletePrediction, fetchAdminDashboard, fetchAdminUsers, fetchHistory, retrainModel, uploadDatasetCSV } from '../services/api';
import { AdminDashboardStats, HistoryItem, User } from '../types';

export const AdminPage: React.FC = () => {
  const { user, login, register, logout, isAdmin } = useAuth();

  // Auth Form State
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(false);

  // Admin Dashboard State
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [predictions, setPredictions] = useState<HistoryItem[]>([]);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);
  const [retrainMsg, setRetrainMsg] = useState<string | null>(null);
  const [adminLoading, setAdminLoading] = useState<boolean>(false);

  const loadAdminData = async () => {
    if (!isAdmin) return;
    try {
      const [dashStats, userRecords, histRecords] = await Promise.all([
        fetchAdminDashboard(),
        fetchAdminUsers(),
        fetchHistory(30),
      ]);
      setStats(dashStats);
      setUsersList(userRecords);
      setPredictions(histRecords);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [isAdmin]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    try {
      if (isRegistering) {
        await register(name, email, password);
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleUploadCSV = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile) return;
    setAdminLoading(true);
    setUploadMsg(null);
    try {
      const res = await uploadDatasetCSV(csvFile);
      setUploadMsg(`Dataset updated successfully! Total dataset rows: ${res.total_rows}`);
      setCsvFile(null);
    } catch (err: any) {
      setUploadMsg(`Upload failed: ${err.message}`);
    } finally {
      setAdminLoading(false);
    }
  };

  const handleRetrain = async () => {
    setAdminLoading(true);
    setRetrainMsg(null);
    try {
      const res = await retrainModel();
      setRetrainMsg(`Model retrained cleanly! Log: ${res.message}`);
      loadAdminData();
    } catch (err: any) {
      setRetrainMsg(`Retrain failed: ${err.message}`);
    } finally {
      setAdminLoading(false);
    }
  };

  const handleDeletePrediction = async (id: number) => {
    if (!confirm(`Delete prediction record #${id}?`)) return;
    try {
      await deletePrediction(id);
      setPredictions(predictions.filter((p) => p.id !== id));
      if (stats) setStats({ ...stats, total_predictions: stats.total_predictions - 1 });
    } catch (err) {
      alert('Delete failed');
    }
  };

  const downloadReportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['ID,District,Predicted_Level_m,Risk,Created_At']
        .concat(predictions.map((p) => `${p.id},${p.district},${p.predicted_level},${p.risk},${p.created_at}`))
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `aquasense_predictions_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Render Login / Register if not authenticated or not admin
  if (!user || !isAdmin) {
    return (
      <div className="max-w-md mx-auto py-12 space-y-6">
        <div className="glass rounded-2xl p-8 space-y-6 border border-white/10">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-[#35C9CF]/15 text-[#35C9CF] border border-[#35C9CF]/30 flex items-center justify-center mx-auto">
              <Shield className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-white">
              {isRegistering ? 'Create Account' : 'Admin & User Access Portal'}
            </h2>
            <p className="text-xs text-gray-400">
              Default admin: <span className="mono text-[#35C9CF]">admin@aquasense.ai</span> / <span className="mono text-[#35C9CF]">ChangeMe123!</span>
            </p>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {isRegistering && (
              <div>
                <label className="text-xs text-gray-300 block mb-1">Full Name</label>
                <div className="relative">
                  <UserPlus className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full glass bg-[#0E3A44] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:border-[#35C9CF] outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs text-gray-300 block mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@aquasense.ai"
                  className="w-full glass bg-[#0E3A44] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:border-[#35C9CF] outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-300 block mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full glass bg-[#0E3A44] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:border-[#35C9CF] outline-none"
                />
              </div>
            </div>

            {authError && (
              <div className="p-3 bg-red-500/20 border border-red-500/40 rounded-xl text-xs text-red-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {authError}
              </div>
            )}

            <button
              type="submit"
              disabled={authLoading}
              className="w-full bg-[#35C9CF] hover:bg-[#7FE3D6] text-[#072B34] font-semibold py-2.5 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-[#35C9CF]/20 text-sm"
            >
              {authLoading ? 'Authenticating...' : isRegistering ? 'Register Account' : 'Sign In'}
            </button>
          </form>

          <div className="text-center pt-2 border-t border-white/10">
            <button
              onClick={() => {
                setIsRegistering(!isRegistering);
                setAuthError(null);
              }}
              className="text-xs text-[#35C9CF] hover:underline"
            >
              {isRegistering ? 'Already have an account? Sign in' : "Don't have an account? Register here"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render Admin Dashboard
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Admin Title Header */}
      <div className="glass rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs uppercase tracking-widest text-[#35C9CF] mono font-semibold">
            System Administration
          </span>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#35C9CF]" /> Admin Control & Retraining Engine
          </h2>
        </div>
        <button
          onClick={logout}
          className="glass hover:bg-red-500/20 text-red-400 px-4 py-2 rounded-xl text-xs font-medium transition"
        >
          Sign Out
        </button>
      </div>

      {/* Admin Summary Stats */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="glass rounded-2xl p-5">
            <p className="text-xs text-[#7FE3D6] mono uppercase">Total Users</p>
            <p className="text-3xl font-bold text-white mt-1">{stats.total_users}</p>
          </div>
          <div className="glass rounded-2xl p-5">
            <p className="text-xs text-[#7FE3D6] mono uppercase">Predictions Served</p>
            <p className="text-3xl font-bold text-[#35C9CF] mt-1">{stats.total_predictions}</p>
          </div>
          <div className="glass rounded-2xl p-5">
            <p className="text-xs text-red-400 mono uppercase">Critical Predictions</p>
            <p className="text-3xl font-bold text-red-400 mt-1">{stats.critical_predictions}</p>
          </div>
          <div className="glass rounded-2xl p-5">
            <p className="text-xs text-amber-400 mono uppercase">Open Alerts</p>
            <p className="text-3xl font-bold text-amber-400 mt-1">{stats.open_alerts}</p>
          </div>
        </div>
      )}

      {/* Actions Row: Upload CSV & Retrain Model */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upload Dataset Form */}
        <form onSubmit={handleUploadCSV} className="glass rounded-2xl p-6 space-y-4">
          <h3 className="text-md font-semibold text-white flex items-center gap-2">
            <Upload className="w-4 h-4 text-[#35C9CF]" /> Upload Hydrogeological CSV
          </h3>
          <p className="text-xs text-[#EAF6F4]/60">
            Append new observation well measurements to <span className="mono">groundwater_master.csv</span>.
          </p>

          <input
            type="file"
            accept=".csv"
            onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
            className="w-full text-xs text-gray-300 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#35C9CF]/20 file:text-[#35C9CF] hover:file:bg-[#35C9CF]/30 cursor-pointer"
          />

          {uploadMsg && (
            <p className="text-xs text-[#7FE3D6] bg-[#35C9CF]/10 p-2.5 rounded-xl border border-[#35C9CF]/20">
              {uploadMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={!csvFile || adminLoading}
            className="w-full bg-[#0E3A44] hover:bg-[#35C9CF]/20 border border-[#35C9CF]/40 text-[#35C9CF] font-medium py-2 rounded-xl text-xs transition"
          >
            Upload & Append Dataset
          </button>
        </form>

        {/* Retrain ML Model */}
        <div className="glass rounded-2xl p-6 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-md font-semibold text-white flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-[#35C9CF]" /> Retrain ML Prediction Model
            </h3>
            <p className="text-xs text-[#EAF6F4]/60 mt-1">
              Trigger background training pipeline across Linear Regression, Random Forest, and XGBoost models. Auto-selects highest R² score model.
            </p>

            {retrainMsg && (
              <p className="text-xs text-[#7FE3D6] bg-[#35C9CF]/10 p-2.5 rounded-xl border border-[#35C9CF]/20 mt-3 font-mono">
                {retrainMsg}
              </p>
            )}
          </div>

          <button
            onClick={handleRetrain}
            disabled={adminLoading}
            className="w-full bg-[#35C9CF] hover:bg-[#7FE3D6] text-[#072B34] font-semibold py-2.5 rounded-xl text-xs transition shadow-lg shadow-[#35C9CF]/20"
          >
            {adminLoading ? 'Retraining Pipeline Running...' : 'Execute Model Retraining'}
          </button>
        </div>
      </div>

      {/* Users Management */}
      <div className="glass rounded-2xl p-6 space-y-4">
        <h3 className="text-md font-semibold text-white flex items-center gap-2">
          <Users className="w-4 h-4 text-[#35C9CF]" /> System Accounts ({usersList.length})
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="text-[#7FE3D6] mono uppercase border-b border-white/10">
              <tr className="text-left">
                <th className="py-2">User ID</th>
                <th className="py-2">Name</th>
                <th className="py-2">Email</th>
                <th className="py-2">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {usersList.map((u) => (
                <tr key={u.id}>
                  <td className="py-2 mono text-[#35C9CF]">#{u.id}</td>
                  <td className="py-2 font-medium text-white">{u.name}</td>
                  <td className="py-2 text-gray-300">{u.email}</td>
                  <td className="py-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${u.role === 'admin' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' : 'bg-gray-500/20 text-gray-300'}`}>
                      {u.role}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Predictions Audit & Deletion */}
      <div className="glass rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-md font-semibold text-white">Prediction Audit Log</h3>
          <button
            onClick={downloadReportCSV}
            className="glass hover:bg-[#35C9CF]/20 text-[#35C9CF] px-3 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> Download CSV Report
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="text-[#7FE3D6] mono uppercase border-b border-white/10">
              <tr className="text-left">
                <th className="py-2">ID</th>
                <th className="py-2">District</th>
                <th className="py-2">Predicted Level</th>
                <th className="py-2">Risk</th>
                <th className="py-2">Created</th>
                <th className="py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {predictions.map((p) => (
                <tr key={p.id}>
                  <td className="py-2 mono text-[#35C9CF]">#{p.id}</td>
                  <td className="py-2 text-white">{p.district}</td>
                  <td className="py-2">{p.predicted_level} m</td>
                  <td className="py-2">{p.risk}</td>
                  <td className="py-2 text-gray-400 mono">{new Date(p.created_at).toLocaleString()}</td>
                  <td className="py-2 text-right">
                    <button
                      onClick={() => handleDeletePrediction(p.id)}
                      className="text-red-400 hover:text-red-300 p-1"
                      title="Delete Record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
