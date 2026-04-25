import { useState } from "react";
import { 
  Calendar, Users, FileText, BarChart3, CheckSquare, Settings, 
  LogOut, Plus, Search, Bell, ChevronRight, Clock, MapPin, 
  Edit, Trash2, Eye, Download, ArrowLeft, X, Check, AlertCircle,
  User, Lock, Mail, CreditCard, Home, Menu, ChevronDown,
  Timer, Star, TrendingUp, UserCheck, UserX, HelpCircle,
  Clipboard, PieChart, Activity, Zap, Filter, MoreVertical,
  Send, MessageSquare, Bookmark, Archive, RefreshCw
} from "lucide-react";

const COLORS = {
  bg: "#0B1120",
  surface: "#111827",
  surfaceLight: "#1F2937",
  surfaceHover: "#273548",
  border: "#2D3B4F",
  borderLight: "#374151",
  primary: "#06B6D4",
  primaryDark: "#0891B2",
  primaryGlow: "rgba(6,182,212,0.15)",
  accent: "#F59E0B",
  accentGlow: "rgba(245,158,11,0.15)",
  success: "#10B981",
  danger: "#EF4444",
  warning: "#F59E0B",
  textPrimary: "#F1F5F9",
  textSecondary: "#94A3B8",
  textMuted: "#64748B",
};

const font = "'Segoe UI', system-ui, -apple-system, sans-serif";

// ─── Sidebar ───
function Sidebar({ active, onNav, collapsed, onToggle }) {
  const items = [
    { id: "dashboard", icon: Home, label: "Dashboard" },
    { id: "meetings", icon: Calendar, label: "Reuniões" },
    { id: "tasks", icon: CheckSquare, label: "Tarefas" },
    { id: "minutes", icon: FileText, label: "Atas" },
    { id: "reports", icon: BarChart3, label: "Relatórios" },
    { id: "users", icon: Users, label: "Usuários" },
    { id: "settings", icon: Settings, label: "Configurações" },
  ];

  return (
    <div style={{
      width: collapsed ? 64 : 240,
      minHeight: "100vh",
      background: COLORS.surface,
      borderRight: `1px solid ${COLORS.border}`,
      display: "flex",
      flexDirection: "column",
      transition: "width 0.25s ease",
      position: "relative",
      zIndex: 10,
    }}>
      {/* Logo */}
      <div style={{
        padding: collapsed ? "20px 12px" : "20px 20px",
        borderBottom: `1px solid ${COLORS.border}`,
        display: "flex",
        alignItems: "center",
        gap: 12,
        cursor: "pointer",
      }} onClick={onToggle}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 800, fontSize: 16, color: "#fff",
          flexShrink: 0,
        }}>S</div>
        {!collapsed && (
          <div>
            <div style={{ fontWeight: 700, fontSize: 17, color: COLORS.textPrimary, letterSpacing: 1 }}>SIGER</div>
            <div style={{ fontSize: 10, color: COLORS.textMuted, letterSpacing: 0.5 }}>Gerenciamento de Reuniões</div>
          </div>
        )}
      </div>

      {/* Nav Items */}
      <nav style={{ flex: 1, padding: "12px 8px", display: "flex", flexDirection: "column", gap: 2 }}>
        {items.map(({ id, icon: Icon, label }) => {
          const isActive = active === id;
          return (
            <button key={id} onClick={() => onNav(id)} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: collapsed ? "11px 0" : "11px 14px",
              justifyContent: collapsed ? "center" : "flex-start",
              borderRadius: 8, border: "none", cursor: "pointer",
              background: isActive ? COLORS.primaryGlow : "transparent",
              color: isActive ? COLORS.primary : COLORS.textSecondary,
              fontSize: 13.5, fontWeight: isActive ? 600 : 400,
              transition: "all 0.15s ease",
              fontFamily: font,
            }}
            onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = COLORS.surfaceHover; }}
            onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
            >
              <Icon size={19} strokeWidth={isActive ? 2.2 : 1.7} />
              {!collapsed && label}
            </button>
          );
        })}
      </nav>

      {/* User */}
      <div style={{
        padding: collapsed ? "16px 8px" : "16px",
        borderTop: `1px solid ${COLORS.border}`,
        display: "flex", alignItems: "center", gap: 10,
        justifyContent: collapsed ? "center" : "flex-start",
      }}>
        <div style={{
          width: 34, height: 34, borderRadius: "50%",
          background: `linear-gradient(135deg, #6366F1, #8B5CF6)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", fontWeight: 700, fontSize: 13, flexShrink: 0,
        }}>JD</div>
        {!collapsed && (
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>João Dev</div>
            <div style={{ fontSize: 11, color: COLORS.textMuted }}>Organizador</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Top Bar ───
function TopBar({ title, subtitle, children }) {
  return (
    <div style={{
      padding: "18px 28px",
      borderBottom: `1px solid ${COLORS.border}`,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      background: COLORS.surface,
    }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 21, fontWeight: 700, color: COLORS.textPrimary, letterSpacing: -0.3 }}>{title}</h1>
        {subtitle && <p style={{ margin: "3px 0 0", fontSize: 13, color: COLORS.textMuted }}>{subtitle}</p>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {children}
      </div>
    </div>
  );
}

// ─── Button ───
function Btn({ children, variant = "primary", icon: Icon, onClick, small, style: s }) {
  const variants = {
    primary: { background: COLORS.primary, color: "#fff", border: "none" },
    secondary: { background: COLORS.surfaceLight, color: COLORS.textPrimary, border: `1px solid ${COLORS.border}` },
    danger: { background: "rgba(239,68,68,0.12)", color: COLORS.danger, border: `1px solid rgba(239,68,68,0.25)` },
    ghost: { background: "transparent", color: COLORS.textSecondary, border: "none" },
  };
  const v = variants[variant];
  return (
    <button onClick={onClick} style={{
      ...v,
      display: "inline-flex", alignItems: "center", gap: 7,
      padding: small ? "6px 12px" : "9px 18px",
      borderRadius: 8, cursor: "pointer",
      fontSize: small ? 12 : 13, fontWeight: 600, fontFamily: font,
      transition: "all 0.15s ease",
      ...s,
    }}
    onMouseEnter={e => { e.currentTarget.style.opacity = "0.85"; }}
    onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
    >
      {Icon && <Icon size={small ? 14 : 16} />}
      {children}
    </button>
  );
}

// ─── Card ───
function Card({ children, style: s, onClick, hover }) {
  return (
    <div onClick={onClick} style={{
      background: COLORS.surface,
      border: `1px solid ${COLORS.border}`,
      borderRadius: 12, padding: 20,
      cursor: onClick ? "pointer" : "default",
      transition: "all 0.15s ease",
      ...s,
    }}
    onMouseEnter={e => { if (hover || onClick) { e.currentTarget.style.borderColor = COLORS.primary; e.currentTarget.style.boxShadow = `0 0 0 1px ${COLORS.primary}30`; }}}
    onMouseLeave={e => { if (hover || onClick) { e.currentTarget.style.borderColor = COLORS.border; e.currentTarget.style.boxShadow = "none"; }}}
    >
      {children}
    </div>
  );
}

// ─── Badge ───
function Badge({ children, color = COLORS.primary }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "3px 10px", borderRadius: 20,
      fontSize: 11, fontWeight: 600,
      background: `${color}18`, color,
      border: `1px solid ${color}30`,
    }}>{children}</span>
  );
}

// ─── Input ───
function Input({ label, icon: Icon, placeholder, type = "text", value, onChange, textarea }) {
  const Comp = textarea ? "textarea" : "input";
  return (
    <div style={{ marginBottom: 16 }}>
      {label && <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, marginBottom: 6, letterSpacing: 0.3 }}>{label}</label>}
      <div style={{ position: "relative" }}>
        {Icon && <Icon size={16} style={{ position: "absolute", left: 12, top: textarea ? 14 : "50%", transform: textarea ? "none" : "translateY(-50%)", color: COLORS.textMuted }} />}
        <Comp
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          rows={textarea ? 4 : undefined}
          style={{
            width: "100%", boxSizing: "border-box",
            padding: Icon ? "10px 14px 10px 38px" : "10px 14px",
            background: COLORS.surfaceLight,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 8, color: COLORS.textPrimary,
            fontSize: 13, fontFamily: font, outline: "none",
            resize: textarea ? "vertical" : "none",
            transition: "border-color 0.15s",
          }}
          onFocus={e => { e.target.style.borderColor = COLORS.primary; }}
          onBlur={e => { e.target.style.borderColor = COLORS.border; }}
        />
      </div>
    </div>
  );
}

// ─── Stat Card ───
function StatCard({ icon: Icon, label, value, change, color = COLORS.primary }) {
  return (
    <Card style={{ flex: 1, minWidth: 180 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: `${color}15`, display: "flex",
          alignItems: "center", justifyContent: "center",
        }}>
          <Icon size={20} color={color} />
        </div>
        {change && (
          <span style={{ fontSize: 11, fontWeight: 600, color: change > 0 ? COLORS.success : COLORS.danger }}>
            {change > 0 ? "+" : ""}{change}%
          </span>
        )}
      </div>
      <div style={{ marginTop: 14 }}>
        <div style={{ fontSize: 26, fontWeight: 800, color: COLORS.textPrimary, letterSpacing: -1 }}>{value}</div>
        <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>{label}</div>
      </div>
    </Card>
  );
}

// ─── Modal ───
function Modal({ open, onClose, title, children, wide }) {
  if (!open) return null;
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20,
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 16, width: wide ? 640 : 480,
        maxHeight: "85vh", overflow: "auto",
        boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
      }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "18px 22px",
          borderBottom: `1px solid ${COLORS.border}`,
        }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: COLORS.textPrimary }}>{title}</h2>
          <button onClick={onClose} style={{
            background: COLORS.surfaceLight, border: "none", borderRadius: 8,
            width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: COLORS.textMuted,
          }}><X size={16} /></button>
        </div>
        <div style={{ padding: "20px 22px" }}>{children}</div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════

function LoginPage({ onLogin }) {
  const [tab, setTab] = useState("login");
  return (
    <div style={{
      minHeight: "100vh", display: "flex",
      background: COLORS.bg, fontFamily: font,
    }}>
      {/* Left Panel */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        justifyContent: "center", alignItems: "center", padding: 40,
        background: `linear-gradient(160deg, ${COLORS.bg} 0%, #0F172A 50%, #1E293B 100%)`,
        position: "relative", overflow: "hidden",
      }}>
        {/* Decorative Elements */}
        <div style={{
          position: "absolute", width: 400, height: 400, borderRadius: "50%",
          background: `radial-gradient(circle, ${COLORS.primary}08, transparent 70%)`,
          top: "-10%", left: "-10%",
        }} />
        <div style={{
          position: "absolute", width: 300, height: 300, borderRadius: "50%",
          background: `radial-gradient(circle, ${COLORS.accent}06, transparent 70%)`,
          bottom: "-5%", right: "-5%",
        }} />

        <div style={{ position: "relative", zIndex: 1, textAlign: "center", maxWidth: 420 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 18, margin: "0 auto 28px",
            background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 32, fontWeight: 800, color: "#fff",
            boxShadow: `0 12px 40px ${COLORS.primary}40`,
          }}>S</div>
          <h1 style={{ margin: 0, fontSize: 38, fontWeight: 800, color: COLORS.textPrimary, letterSpacing: -1 }}>SIGER</h1>
          <p style={{ fontSize: 15, color: COLORS.textSecondary, marginTop: 10, lineHeight: 1.6 }}>
            Sistema de Gerenciamento de Reuniões
          </p>
          <div style={{
            marginTop: 40, display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap",
          }}>
            {["Reuniões", "Atas", "Tarefas", "Dashboard", "IA"].map(f => (
              <span key={f} style={{
                padding: "6px 14px", borderRadius: 20,
                background: COLORS.surfaceLight,
                border: `1px solid ${COLORS.border}`,
                fontSize: 12, color: COLORS.textSecondary,
              }}>{f}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div style={{
        width: 460, display: "flex", flexDirection: "column",
        justifyContent: "center", padding: "40px 48px",
        background: COLORS.surface,
        borderLeft: `1px solid ${COLORS.border}`,
      }}>
        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 32, background: COLORS.surfaceLight, borderRadius: 10, padding: 4 }}>
          {[["login", "Entrar"], ["register", "Cadastrar"]].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} style={{
              flex: 1, padding: "10px 0", border: "none", borderRadius: 8,
              background: tab === id ? COLORS.primary : "transparent",
              color: tab === id ? "#fff" : COLORS.textMuted,
              fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: font,
              transition: "all 0.15s",
            }}>{label}</button>
          ))}
        </div>

        {tab === "login" ? (
          <>
            <h2 style={{ margin: "0 0 6px", fontSize: 24, fontWeight: 700, color: COLORS.textPrimary }}>Bem-vindo de volta</h2>
            <p style={{ margin: "0 0 28px", fontSize: 13, color: COLORS.textMuted }}>Acesse sua conta para gerenciar reuniões</p>
            <Input label="E-MAIL" icon={Mail} placeholder="seu@email.com" type="email" />
            <Input label="SENHA" icon={Lock} placeholder="••••••••" type="password" />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: COLORS.textMuted, cursor: "pointer" }}>
                <input type="checkbox" style={{ accentColor: COLORS.primary }} /> Lembrar-me
              </label>
              <a style={{ fontSize: 12, color: COLORS.primary, textDecoration: "none", cursor: "pointer" }}>Esqueci minha senha</a>
            </div>
            <Btn onClick={onLogin} style={{ width: "100%", justifyContent: "center", padding: "12px 0", fontSize: 14 }}>
              Entrar
            </Btn>
          </>
        ) : (
          <>
            <h2 style={{ margin: "0 0 6px", fontSize: 24, fontWeight: 700, color: COLORS.textPrimary }}>Criar conta</h2>
            <p style={{ margin: "0 0 28px", fontSize: 13, color: COLORS.textMuted }}>Preencha os dados para se registrar</p>
            <Input label="NOME COMPLETO" icon={User} placeholder="João da Silva" />
            <Input label="CPF" icon={CreditCard} placeholder="000.000.000-00" />
            <Input label="E-MAIL" icon={Mail} placeholder="seu@email.com" type="email" />
            <Input label="SENHA" icon={Lock} placeholder="Mínimo 8 caracteres" type="password" />
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, marginBottom: 6, letterSpacing: 0.3 }}>PERFIL</label>
              <select style={{
                width: "100%", padding: "10px 14px", background: COLORS.surfaceLight,
                border: `1px solid ${COLORS.border}`, borderRadius: 8,
                color: COLORS.textPrimary, fontSize: 13, fontFamily: font,
              }}>
                <option>Participante</option>
                <option>Organizador</option>
                <option>Admin</option>
              </select>
            </div>
            <Btn onClick={onLogin} style={{ width: "100%", justifyContent: "center", padding: "12px 0", fontSize: 14 }}>
              Cadastrar
            </Btn>
          </>
        )}
      </div>
    </div>
  );
}

function UsersPage() {
  const users = [
    { name: "João Dev", email: "joao@siger.com", role: "Admin", status: "Ativo", meetings: 24 },
    { name: "Maria Santos", email: "maria@siger.com", role: "Organizador", status: "Ativo", meetings: 18 },
    { name: "Carlos Mendes", email: "carlos@siger.com", role: "Participante", status: "Ativo", meetings: 15 },
    { name: "Ana Oliveira", email: "ana@siger.com", role: "Participante", status: "Ativo", meetings: 12 },
    { name: "Pedro Lima", email: "pedro@siger.com", role: "Organizador", status: "Inativo", meetings: 8 },
  ];

  const roleColors = { Admin: "#8B5CF6", Organizador: COLORS.primary, Participante: COLORS.textMuted };

  return (
    <div>
      <TopBar title="Usuários" subtitle="Gerenciar usuários do sistema">
        <Btn icon={Plus}>Novo Usuário</Btn>
      </TopBar>

      <div style={{ padding: 28 }}>
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: font }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                {["Usuário", "Perfil", "Status", "Reuniões", "Ações"].map(h => (
                  <th key={h} style={{
                    padding: "14px 18px", textAlign: "left",
                    fontSize: 11, fontWeight: 600, color: COLORS.textMuted,
                    letterSpacing: 0.5, textTransform: "uppercase",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={i} style={{
                  borderBottom: `1px solid ${COLORS.border}`,
                  transition: "background 0.15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = COLORS.surfaceLight; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                >
                  <td style={{ padding: "12px 18px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: "50%",
                        background: `linear-gradient(135deg, ${["#6366F1","#EC4899","#F59E0B","#10B981","#EF4444"][i]}, ${["#8B5CF6","#F43F5E","#D97706","#059669","#DC2626"][i]})`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 12, fontWeight: 700, color: "#fff",
                      }}>{u.name.split(" ").map(w => w[0]).join("")}</div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.textPrimary }}>{u.name}</div>
                        <div style={{ fontSize: 11, color: COLORS.textMuted }}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "12px 18px" }}>
                    <Badge color={roleColors[u.role]}>{u.role}</Badge>
                  </td>
                  <td style={{ padding: "12px 18px" }}>
                    <Badge color={u.status === "Ativo" ? COLORS.success : COLORS.danger}>{u.status}</Badge>
                  </td>
                  <td style={{ padding: "12px 18px", fontSize: 14, fontWeight: 600, color: COLORS.textPrimary }}>{u.meetings}</td>
                  <td style={{ padding: "12px 18px" }}>
                    <div style={{ display: "flex", gap: 4 }}>
                      <Btn icon={Edit} variant="ghost" small />
                      <Btn icon={Trash2} variant="ghost" small />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}

function SettingsPage() {
  return (
    <div>
      <TopBar title="Configurações" subtitle="Preferências da sua conta" />

      <div style={{ padding: 28, maxWidth: 640, margin: "0 auto" }}>
        <Card style={{ marginBottom: 20 }}>
          <h3 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 700, color: COLORS.textPrimary }}>Perfil</h3>
          <div style={{ display: "flex", gap: 20, alignItems: "center", marginBottom: 24 }}>
            <div style={{
              width: 64, height: 64, borderRadius: "50%",
              background: `linear-gradient(135deg, #6366F1, #8B5CF6)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 24, fontWeight: 700, color: "#fff",
            }}>JD</div>
            <Btn variant="secondary" small>Alterar foto</Btn>
          </div>
          <Input label="NOME" value="João Dev" />
          <Input label="E-MAIL" value="joao@siger.com" type="email" />
          <Input label="CPF" value="123.456.789-00" />
          <Btn>Salvar Alterações</Btn>
        </Card>

        <Card style={{ marginBottom: 20 }}>
          <h3 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 700, color: COLORS.textPrimary }}>Preferências de Notificação</h3>
          {[
            ["Lembretes de reunião (24h e 1h antes)", true],
            ["Convites de reunião", true],
            ["Cancelamento de reunião", true],
            ["Atribuição de tarefas", true],
            ["Alertas de ausência de confirmação", false],
          ].map(([label, checked], i) => (
            <div key={i} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "12px 0",
              borderBottom: i < 4 ? `1px solid ${COLORS.border}` : "none",
            }}>
              <span style={{ fontSize: 13, color: COLORS.textSecondary }}>{label}</span>
              <div style={{
                width: 40, height: 22, borderRadius: 12,
                background: checked ? COLORS.primary : COLORS.surfaceLight,
                padding: 2, cursor: "pointer", transition: "background 0.2s",
                display: "flex", alignItems: checked ? "center" : "center",
                justifyContent: checked ? "flex-end" : "flex-start",
              }}>
                <div style={{
                  width: 18, height: 18, borderRadius: "50%",
                  background: "#fff", transition: "all 0.2s",
                }} />
              </div>
            </div>
          ))}
        </Card>

        <Card>
          <h3 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 700, color: COLORS.textPrimary }}>Segurança</h3>
          <Btn variant="secondary" icon={Lock}>Alterar Senha</Btn>
        </Card>
      </div>
    </div>
  );
}



// ═══════════════════════════════════════
// MAIN APP - FASE 1
// ═══════════════════════════════════════
export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [page, setPage] = useState("users");
  const [collapsed, setCollapsed] = useState(false);

  if (!loggedIn) return <LoginPage onLogin={() => setLoggedIn(true)} />;

  const pageMap = {
    users: <UsersPage />,
    settings: <SettingsPage />,
  };

  return (
    <div style={{
      display: "flex", minHeight: "100vh",
      background: COLORS.bg, fontFamily: font,
      color: COLORS.textPrimary,
    }}>
      <Sidebar active={page} onNav={setPage} collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div style={{ flex: 1, minWidth: 0, overflow: "auto", maxHeight: "100vh" }}>
        {pageMap[page] || <UsersPage />}
      </div>
    </div>
  );
}
