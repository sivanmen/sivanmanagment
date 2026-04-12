import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Phone,
  Plus,
  Settings,
  Wifi,
  WifiOff,
  QrCode,
  TestTube,
  Trash2,
  Edit2,
  Star,
  Check,
  X,
  RefreshCw,
  MessageSquare,
  Building2,
  Shield,
  AlertTriangle,
  Copy,
  ChevronDown,
  ChevronUp,
  Send,
  Smartphone,
  Link2,
  Unlink,
} from 'lucide-react';

// Types
interface MessagingInstance {
  id: string;
  name: string;
  provider: string;
  status: string;
  phoneNumber: string | null;
  instanceName: string;
  apiUrl: string;
  apiKey: string;
  webhookUrl: string | null;
  isDefault: boolean;
  isActive: boolean;
  config: Record<string, any>;
  lastConnectedAt: string | null;
  lastErrorMsg: string | null;
  messagesSent: number;
  messagesReceived: number;
  propertyAssignments: {
    id: string;
    property: { id: string; name: string; internalCode: string };
  }[];
}

// Mock data for demo
const mockInstances: MessagingInstance[] = [
  {
    id: 'mi-001',
    name: 'Main WhatsApp',
    provider: 'EVOLUTION_API',
    status: 'MSG_ACTIVE',
    phoneNumber: '+30 2810 123456',
    instanceName: 'sivan-main',
    apiUrl: 'https://evolution-api-production-aad.up.railway.app',
    apiKey: '94e804e4...95d6f',
    webhookUrl: 'https://api.sivanmanagment.com/api/v1/whatsapp/webhook',
    isDefault: true,
    isActive: true,
    config: { autoReply: true, businessHours: '08:00-22:00' },
    lastConnectedAt: '2026-04-12T08:00:00Z',
    lastErrorMsg: null,
    messagesSent: 1847,
    messagesReceived: 923,
    propertyAssignments: [
      { id: 'pa-001', property: { id: 'p-001', name: 'Villa Elounda Seafront', internalCode: 'VES-001' } },
      { id: 'pa-002', property: { id: 'p-002', name: 'Chania Old Town Apt', internalCode: 'COT-001' } },
      { id: 'pa-003', property: { id: 'p-003', name: 'Rethymno Beach House', internalCode: 'RBH-001' } },
    ],
  },
  {
    id: 'mi-002',
    name: 'Backup Line',
    provider: 'EVOLUTION_API',
    status: 'MSG_DISCONNECTED',
    phoneNumber: '+30 2810 654321',
    instanceName: 'sivan-backup',
    apiUrl: 'https://evolution-api-production-aad.up.railway.app',
    apiKey: '94e804e4...95d6f',
    webhookUrl: null,
    isDefault: false,
    isActive: true,
    config: {},
    lastConnectedAt: '2026-04-10T15:30:00Z',
    lastErrorMsg: 'Connection timed out',
    messagesSent: 245,
    messagesReceived: 112,
    propertyAssignments: [],
  },
];

const statusLabels: Record<string, { label: string; color: string; icon: typeof Wifi }> = {
  MSG_ACTIVE: { label: 'Connected', color: 'text-emerald-400 bg-emerald-500/10', icon: Wifi },
  MSG_DISCONNECTED: { label: 'Disconnected', color: 'text-gray-400 bg-gray-500/10', icon: WifiOff },
  MSG_PAIRING: { label: 'Pairing...', color: 'text-amber-400 bg-amber-500/10', icon: QrCode },
  MSG_ERROR: { label: 'Error', color: 'text-red-400 bg-red-500/10', icon: AlertTriangle },
  MSG_SUSPENDED: { label: 'Suspended', color: 'text-orange-400 bg-orange-500/10', icon: Shield },
};

const providerLabels: Record<string, string> = {
  EVOLUTION_API: 'Evolution API',
  WHATSAPP_BUSINESS: 'WhatsApp Business API',
  TWILIO: 'Twilio',
  CUSTOM: 'Custom Provider',
};

// Mock properties for assignment
const allProperties = [
  { id: 'p-001', name: 'Villa Elounda Seafront', internalCode: 'VES-001' },
  { id: 'p-002', name: 'Chania Old Town Apt', internalCode: 'COT-001' },
  { id: 'p-003', name: 'Rethymno Beach House', internalCode: 'RBH-001' },
  { id: 'p-004', name: 'Heraklion City Suite', internalCode: 'HCS-001' },
  { id: 'p-005', name: 'Agios Nikolaos Villa', internalCode: 'ANV-001' },
  { id: 'p-006', name: 'Plakias Beachfront', internalCode: 'PBF-001' },
  { id: 'p-007', name: 'Kissamos Retreat', internalCode: 'KIS-001' },
  { id: 'p-008', name: 'Ierapetra Penthouse', internalCode: 'IRP-001' },
  { id: 'p-009', name: 'Sitia Panorama', internalCode: 'SPN-001' },
  { id: 'p-010', name: 'Malia Coast Villa', internalCode: 'MCV-001' },
  { id: 'p-011', name: 'Falasarna Sunset', internalCode: 'FSS-001' },
  { id: 'p-012', name: 'Spinalonga View', internalCode: 'SPV-001' },
];

export default function WhatsAppInstancesPage() {
  const { t } = useTranslation();
  const [instances, setInstances] = useState<MessagingInstance[]>(mockInstances);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingInstance, setEditingInstance] = useState<MessagingInstance | null>(null);
  const [expandedInstance, setExpandedInstance] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState<string | null>(null);
  const [testingConnection, setTestingConnection] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState<string | null>(null);
  const [showTestMessageModal, setShowTestMessageModal] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    provider: 'EVOLUTION_API',
    instanceName: '',
    apiUrl: '',
    apiKey: '',
    phoneNumber: '',
    webhookUrl: '',
    isDefault: false,
  });

  const [testMessageData, setTestMessageData] = useState({ to: '', message: '' });

  const handleCreateOrEdit = () => {
    if (editingInstance) {
      setInstances(prev => prev.map(i =>
        i.id === editingInstance.id ? { ...i, ...formData } : i,
      ));
    } else {
      const newInstance: MessagingInstance = {
        id: `mi-${Date.now()}`,
        ...formData,
        status: 'MSG_DISCONNECTED',
        isActive: true,
        config: {},
        lastConnectedAt: null,
        lastErrorMsg: null,
        messagesSent: 0,
        messagesReceived: 0,
        propertyAssignments: [],
      };
      setInstances(prev => [...prev, newInstance]);
    }
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '', provider: 'EVOLUTION_API', instanceName: '', apiUrl: '', apiKey: '',
      phoneNumber: '', webhookUrl: '', isDefault: false,
    });
    setShowCreateModal(false);
    setEditingInstance(null);
  };

  const handleEdit = (inst: MessagingInstance) => {
    setFormData({
      name: inst.name,
      provider: inst.provider,
      instanceName: inst.instanceName,
      apiUrl: inst.apiUrl,
      apiKey: inst.apiKey,
      phoneNumber: inst.phoneNumber || '',
      webhookUrl: inst.webhookUrl || '',
      isDefault: inst.isDefault,
    });
    setEditingInstance(inst);
    setShowCreateModal(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this messaging instance? This cannot be undone.')) {
      setInstances(prev => prev.filter(i => i.id !== id));
    }
  };

  const handleTestConnection = async (id: string) => {
    setTestingConnection(id);
    // Simulate API call
    setTimeout(() => {
      setInstances(prev => prev.map(i =>
        i.id === id ? { ...i, status: 'MSG_ACTIVE', lastConnectedAt: new Date().toISOString(), lastErrorMsg: null } : i,
      ));
      setTestingConnection(null);
    }, 2000);
  };

  const handleSetDefault = (id: string) => {
    setInstances(prev => prev.map(i => ({ ...i, isDefault: i.id === id })));
  };

  const handleToggleActive = (id: string) => {
    setInstances(prev => prev.map(i =>
      i.id === id ? { ...i, isActive: !i.isActive } : i,
    ));
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-surface font-heading flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Phone className="w-5 h-5 text-emerald-400" />
            </div>
            WhatsApp Instances
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Manage Evolution API connections & WhatsApp phone numbers
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowCreateModal(true); }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-accent text-white text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          Add Instance
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-4">
          <p className="text-xs text-on-surface-variant uppercase tracking-wider">Total Instances</p>
          <p className="text-2xl font-bold text-on-surface mt-1">{instances.length}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-xs text-on-surface-variant uppercase tracking-wider">Connected</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">
            {instances.filter(i => i.status === 'MSG_ACTIVE').length}
          </p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-xs text-on-surface-variant uppercase tracking-wider">Messages Sent</p>
          <p className="text-2xl font-bold text-on-surface mt-1">
            {instances.reduce((sum, i) => sum + i.messagesSent, 0).toLocaleString()}
          </p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-xs text-on-surface-variant uppercase tracking-wider">Messages Received</p>
          <p className="text-2xl font-bold text-on-surface mt-1">
            {instances.reduce((sum, i) => sum + i.messagesReceived, 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Instance Cards */}
      <div className="space-y-4">
        {instances.map((inst) => {
          const statusInfo = statusLabels[inst.status] || statusLabels.MSG_DISCONNECTED;
          const StatusIcon = statusInfo.icon;
          const isExpanded = expandedInstance === inst.id;

          return (
            <div key={inst.id} className="glass-card rounded-2xl overflow-hidden">
              {/* Main Card */}
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  {/* Left: Info */}
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${statusInfo.color}`}>
                      <StatusIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-on-surface">{inst.name}</h3>
                        {inst.isDefault && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary/10 text-secondary text-[10px] font-semibold uppercase">
                            <Star className="w-3 h-3" /> Default
                          </span>
                        )}
                        {!inst.isActive && (
                          <span className="px-2 py-0.5 rounded-full bg-gray-500/10 text-gray-400 text-[10px] font-semibold uppercase">
                            Disabled
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-on-surface-variant">
                        <span className="flex items-center gap-1">
                          <Smartphone className="w-3.5 h-3.5" />
                          {inst.phoneNumber || 'No number'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Settings className="w-3.5 h-3.5" />
                          {providerLabels[inst.provider]}
                        </span>
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5" />
                          {inst.propertyAssignments.length} properties
                        </span>
                        <span className={`flex items-center gap-1 ${statusInfo.color.split(' ')[0]}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {statusInfo.label}
                        </span>
                      </div>
                      {inst.lastErrorMsg && (
                        <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {inst.lastErrorMsg}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTestConnection(inst.id)}
                      disabled={testingConnection === inst.id}
                      className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-variant/50 transition-colors disabled:opacity-50"
                      title="Test Connection"
                    >
                      {testingConnection === inst.id ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <TestTube className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => setShowQrModal(inst.id)}
                      className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-variant/50 transition-colors"
                      title="QR Code"
                    >
                      <QrCode className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setShowTestMessageModal(inst.id)}
                      className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-variant/50 transition-colors"
                      title="Send Test Message"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(inst)}
                      className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-variant/50 transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setExpandedInstance(isExpanded ? null : inst.id)}
                      className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-variant/50 transition-colors"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Stats Row */}
                <div className="flex items-center gap-6 mt-4 pt-4 border-t border-border/50">
                  <div className="text-center">
                    <p className="text-lg font-bold text-on-surface">{inst.messagesSent.toLocaleString()}</p>
                    <p className="text-[10px] text-on-surface-variant uppercase">Sent</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-on-surface">{inst.messagesReceived.toLocaleString()}</p>
                    <p className="text-[10px] text-on-surface-variant uppercase">Received</p>
                  </div>
                  <div className="flex-1" />
                  <div className="flex items-center gap-2">
                    {!inst.isDefault && (
                      <button
                        onClick={() => handleSetDefault(inst.id)}
                        className="text-xs text-on-surface-variant hover:text-secondary transition-colors flex items-center gap-1"
                      >
                        <Star className="w-3 h-3" /> Set Default
                      </button>
                    )}
                    <button
                      onClick={() => handleToggleActive(inst.id)}
                      className={`text-xs ${inst.isActive ? 'text-emerald-400' : 'text-gray-400'} hover:opacity-80 transition-colors flex items-center gap-1`}
                    >
                      {inst.isActive ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      {inst.isActive ? 'Active' : 'Disabled'}
                    </button>
                    <button
                      onClick={() => handleDelete(inst.id)}
                      className="text-xs text-red-400 hover:text-red-300 transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="border-t border-border/50 p-5 bg-surface-variant/10">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Connection Details */}
                    <div>
                      <h4 className="text-sm font-semibold text-on-surface mb-3 flex items-center gap-2">
                        <Settings className="w-4 h-4 text-secondary" /> Connection Details
                      </h4>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-on-surface-variant">Instance Name</span>
                          <span className="text-on-surface font-mono">{inst.instanceName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-on-surface-variant">API URL</span>
                          <span className="text-on-surface font-mono truncate ms-4 max-w-[200px]">{inst.apiUrl}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-on-surface-variant">API Key</span>
                          <div className="flex items-center gap-1">
                            <span className="text-on-surface font-mono">{inst.apiKey}</span>
                            <button
                              onClick={() => navigator.clipboard.writeText(inst.apiKey)}
                              className="p-0.5 rounded hover:bg-surface-variant"
                            >
                              <Copy className="w-3 h-3 text-on-surface-variant" />
                            </button>
                          </div>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-on-surface-variant">Webhook URL</span>
                          <span className="text-on-surface font-mono truncate ms-4 max-w-[200px]">
                            {inst.webhookUrl || 'Not configured'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-on-surface-variant">Last Connected</span>
                          <span className="text-on-surface">
                            {inst.lastConnectedAt ? new Date(inst.lastConnectedAt).toLocaleString() : 'Never'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Property Assignments */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-on-surface flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-secondary" /> Assigned Properties
                        </h4>
                        <button
                          onClick={() => setShowAssignModal(inst.id)}
                          className="text-xs text-secondary hover:text-secondary/80 flex items-center gap-1"
                        >
                          <Link2 className="w-3 h-3" /> Manage
                        </button>
                      </div>
                      {inst.propertyAssignments.length === 0 ? (
                        <p className="text-xs text-on-surface-variant italic">
                          No properties assigned. This instance will be available as fallback only.
                        </p>
                      ) : (
                        <div className="space-y-1.5">
                          {inst.propertyAssignments.map((pa) => (
                            <div key={pa.id} className="flex items-center justify-between text-xs p-2 rounded-lg bg-surface/50">
                              <span className="text-on-surface">{pa.property.name}</span>
                              <span className="text-on-surface-variant font-mono">{pa.property.internalCode}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {instances.length === 0 && (
          <div className="glass-card rounded-2xl p-12 text-center">
            <Phone className="w-12 h-12 text-on-surface-variant/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-on-surface mb-2">No WhatsApp Instances</h3>
            <p className="text-sm text-on-surface-variant mb-6">
              Add your first Evolution API instance to start sending WhatsApp messages.
            </p>
            <button
              onClick={() => { resetForm(); setShowCreateModal(true); }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-accent text-white text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Add Instance
            </button>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-on-surface mb-6">
                {editingInstance ? 'Edit Instance' : 'Add WhatsApp Instance'}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1.5">
                    Instance Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-surface-variant/30 border border-border text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-secondary/50"
                    placeholder='e.g. "Main WhatsApp", "Support Line"'
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1.5">
                    Provider
                  </label>
                  <select
                    value={formData.provider}
                    onChange={(e) => setFormData(p => ({ ...p, provider: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-surface-variant/30 border border-border text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/50"
                  >
                    <option value="EVOLUTION_API">Evolution API</option>
                    <option value="WHATSAPP_BUSINESS">WhatsApp Business API</option>
                    <option value="TWILIO">Twilio</option>
                    <option value="CUSTOM">Custom Provider</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1.5">
                    Evolution Instance Name *
                  </label>
                  <input
                    type="text"
                    value={formData.instanceName}
                    onChange={(e) => setFormData(p => ({ ...p, instanceName: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-surface-variant/30 border border-border text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-secondary/50"
                    placeholder="e.g. sivan-main"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1.5">
                    API URL *
                  </label>
                  <input
                    type="url"
                    value={formData.apiUrl}
                    onChange={(e) => setFormData(p => ({ ...p, apiUrl: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-surface-variant/30 border border-border text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-secondary/50 font-mono"
                    placeholder="https://evolution-api.railway.app"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1.5">
                    API Key *
                  </label>
                  <input
                    type="password"
                    value={formData.apiKey}
                    onChange={(e) => setFormData(p => ({ ...p, apiKey: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-surface-variant/30 border border-border text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-secondary/50 font-mono"
                    placeholder="Your Evolution API key"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData(p => ({ ...p, phoneNumber: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-surface-variant/30 border border-border text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-secondary/50"
                    placeholder="+30 2810 123456"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1.5">
                    Webhook URL
                  </label>
                  <input
                    type="url"
                    value={formData.webhookUrl}
                    onChange={(e) => setFormData(p => ({ ...p, webhookUrl: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-surface-variant/30 border border-border text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-secondary/50 font-mono"
                    placeholder="https://api.sivanmanagment.com/api/v1/whatsapp/webhook"
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData(p => ({ ...p, isDefault: e.target.checked }))}
                    className="w-4 h-4 rounded border-border text-secondary focus:ring-secondary"
                  />
                  <span className="text-sm text-on-surface">Set as default instance</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border/50">
                <button
                  onClick={resetForm}
                  className="px-4 py-2.5 rounded-xl border border-border text-sm text-on-surface hover:bg-surface-variant/50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateOrEdit}
                  disabled={!formData.name || !formData.instanceName || !formData.apiUrl || !formData.apiKey}
                  className="px-4 py-2.5 rounded-xl gradient-accent text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {editingInstance ? 'Save Changes' : 'Create Instance'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card rounded-2xl w-full max-w-sm p-6 text-center">
            <QrCode className="w-12 h-12 text-secondary mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-on-surface mb-2">Scan QR Code</h2>
            <p className="text-sm text-on-surface-variant mb-6">
              Open WhatsApp on your phone and scan this QR code to connect this instance.
            </p>
            <div className="w-48 h-48 mx-auto bg-white rounded-xl flex items-center justify-center mb-6">
              <div className="text-gray-400 text-xs text-center p-4">
                <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin text-gray-300" />
                Loading QR code...
              </div>
            </div>
            <button
              onClick={() => setShowQrModal(null)}
              className="px-4 py-2.5 rounded-xl border border-border text-sm text-on-surface hover:bg-surface-variant/50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Test Message Modal */}
      {showTestMessageModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card rounded-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-on-surface mb-4 flex items-center gap-2">
              <Send className="w-5 h-5 text-secondary" />
              Send Test Message
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1.5">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={testMessageData.to}
                  onChange={(e) => setTestMessageData(p => ({ ...p, to: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl bg-surface-variant/30 border border-border text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-secondary/50"
                  placeholder="+972 50 1234567"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1.5">
                  Message *
                </label>
                <textarea
                  value={testMessageData.message}
                  onChange={(e) => setTestMessageData(p => ({ ...p, message: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl bg-surface-variant/30 border border-border text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-secondary/50 resize-none"
                  placeholder="Test message from Sivan Management PMS"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => { setShowTestMessageModal(null); setTestMessageData({ to: '', message: '' }); }}
                className="px-4 py-2.5 rounded-xl border border-border text-sm text-on-surface hover:bg-surface-variant/50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // In production: call API
                  alert(`Sending "${testMessageData.message}" to ${testMessageData.to}`);
                  setShowTestMessageModal(null);
                  setTestMessageData({ to: '', message: '' });
                }}
                disabled={!testMessageData.to || !testMessageData.message}
                className="px-4 py-2.5 rounded-xl gradient-accent text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                Send Test
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Property Assignment Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto p-6">
            <h2 className="text-lg font-semibold text-on-surface mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-secondary" />
              Assign Properties
            </h2>
            <p className="text-sm text-on-surface-variant mb-4">
              Select which properties should use this WhatsApp instance for messaging.
            </p>
            <div className="space-y-2">
              {allProperties.map((prop) => {
                const inst = instances.find(i => i.id === showAssignModal);
                const isAssigned = inst?.propertyAssignments.some(pa => pa.property.id === prop.id);
                return (
                  <label
                    key={prop.id}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-variant/30 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      defaultChecked={isAssigned}
                      className="w-4 h-4 rounded border-border text-secondary focus:ring-secondary"
                    />
                    <div className="flex-1">
                      <p className="text-sm text-on-surface">{prop.name}</p>
                      <p className="text-[10px] text-on-surface-variant font-mono">{prop.internalCode}</p>
                    </div>
                    {isAssigned && (
                      <span className="text-[10px] text-secondary bg-secondary/10 px-2 py-0.5 rounded-full">
                        Assigned
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border/50">
              <button
                onClick={() => setShowAssignModal(null)}
                className="px-4 py-2.5 rounded-xl border border-border text-sm text-on-surface hover:bg-surface-variant/50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowAssignModal(null)}
                className="px-4 py-2.5 rounded-xl gradient-accent text-white text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Save Assignments
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
