"use client";

import { useState } from "react";
import {
  Shield,
  ShieldCheck,
  UserPlus,
  Users,
  Trash2,
  Sparkles,
  KeyRound,
  Brush,
  CheckCircle2,
  AlertCircle,
  Mail,
  User,
  Crown,
  HelpCircle,
  X,
} from "lucide-react";
import Swal from "sweetalert2";
import { addOrUpdateStaff, updateStaffRole, deleteStaffMember } from "../actions";

interface StaffMember {
  email: string;
  role: string;
  name?: string | null;
  created_at?: string | null;
}

interface AdminStaffManagementProps {
  staffList: StaffMember[];
  currentUserEmail: string;
}

export default function AdminStaffManagement({
  staffList,
  currentUserEmail,
}: AdminStaffManagementProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [selectedRole, setSelectedRole] = useState("recepcionista");

  // Contadores
  const totalCount = staffList.length;
  const ownerCount = staffList.filter((s) => s.role === "dueño" || s.role === "admin").length;
  const receptionistCount = staffList.filter((s) => s.role === "recepcionista").length;
  const cleaningCount = staffList.filter((s) => s.role === "limpieza").length;

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      Swal.fire("Error", "Ingresa un correo electrónico válido.", "warning");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("email", email.trim().toLowerCase());
    formData.append("name", name.trim());
    formData.append("role", selectedRole);

    const res = await addOrUpdateStaff(formData);
    setLoading(false);

    if (res?.error) {
      Swal.fire("Error", res.error, "error");
    } else {
      Swal.fire({
        title: "¡Personal Autorizado!",
        text: `El usuario ${email} ahora tiene acceso con el rol de ${selectedRole.toUpperCase()}.`,
        icon: "success",
        confirmButtonColor: "#e3004f",
      });
      setEmail("");
      setName("");
      setSelectedRole("recepcionista");
      setIsModalOpen(false);
    }
  };

  const handleRoleChange = async (targetEmail: string, newRole: string) => {
    const isSelf = targetEmail.toLowerCase() === currentUserEmail.toLowerCase();
    if (isSelf && newRole !== "dueño" && newRole !== "admin") {
      const confirmSelfDemote = await Swal.fire({
        title: "¿Cambiar tu propio rol?",
        text: "Si te quitas el rol de Dueño, perderás acceso a esta sección de administración de roles.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#e3004f",
        cancelButtonColor: "#78716c",
        confirmButtonText: "Sí, cambiar",
        cancelButtonText: "Cancelar",
      });
      if (!confirmSelfDemote.isConfirmed) return;
    }

    setLoading(true);
    const res = await updateStaffRole(targetEmail, newRole);
    setLoading(false);

    if (res?.error) {
      Swal.fire("Error", res.error, "error");
    } else {
      Swal.fire({
        title: "Rol Actualizado",
        text: `Se actualizó el rol de ${targetEmail} a ${newRole.toUpperCase()}.`,
        icon: "success",
        timer: 1800,
        showConfirmButton: false,
      });
    }
  };

  const handleDelete = async (targetEmail: string) => {
    if (targetEmail.toLowerCase() === currentUserEmail.toLowerCase()) {
      Swal.fire("Acción no permitida", "No puedes eliminar tu propia cuenta de acceso.", "info");
      return;
    }

    const confirm = await Swal.fire({
      title: "¿Revocar Acceso?",
      text: `¿Estás seguro de quitar los permisos a ${targetEmail}? Ya no podrá ingresar al panel de administración.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#e3004f",
      cancelButtonColor: "#78716c",
      confirmButtonText: "Sí, revocar acceso",
      cancelButtonText: "Cancelar",
    });

    if (confirm.isConfirmed) {
      setLoading(true);
      const res = await deleteStaffMember(targetEmail);
      setLoading(false);

      if (res?.error) {
        Swal.fire("Error", res.error, "error");
      } else {
        Swal.fire("Acceso Revocado", "El usuario fue retirado del personal.", "success");
      }
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "dueño":
      case "admin":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
            <Crown size={12} className="text-amber-500" /> Dueño / Admin
          </span>
        );
      case "recepcionista":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
            <KeyRound size={12} className="text-blue-500" /> Recepcionista
          </span>
        );
      case "limpieza":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Sparkles size={12} className="text-emerald-500" /> Limpieza
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-stone-100 text-stone-700 border border-stone-200">
            <Shield size={12} /> {role}
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* HEADER DE SECCIÓN */}
      <div className="bg-gradient-to-br from-white via-[#FDFBF7] to-amber-50/70 text-stone-900 p-8 md:p-10 rounded-[2.5rem] shadow-sm relative overflow-hidden border border-amber-200/80">
        <div className="absolute right-0 top-0 w-96 h-96 bg-gradient-to-br from-amber-400/15 to-orange-300/10 blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div>
            <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-amber-800 bg-amber-100/80 px-4 py-1.5 rounded-full border border-amber-300/60 mb-3 shadow-xs">
              <ShieldCheck size={14} className="text-amber-600" /> Portal Exclusivo del Dueño
            </span>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-stone-900 tracking-tight">
              Gestión de Personal y Roles
            </h2>
            <p className="text-stone-600 text-xs md:text-sm mt-2 max-w-xl">
              Autoriza qué colaboradores tienen acceso al panel de administración de Hotel Kametza y define exactamente qué acciones pueden realizar según su cargo.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white font-bold px-6 py-4 rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-amber-900/15 hover:scale-105 active:scale-95 transition-all duration-300 shrink-0 cursor-pointer"
          >
            <UserPlus size={18} /> Autorizar Nuevo Personal
          </button>
        </div>

        {/* METRICAS RÁPIDAS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-8 border-t border-stone-200/70">
          <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-stone-200/70 shadow-xs hover:border-stone-300 transition-colors">
            <span className="text-[10px] uppercase font-bold tracking-widest text-stone-500">Total Equipo</span>
            <div className="text-2xl md:text-3xl font-bold font-serif text-stone-900 mt-1">{totalCount}</div>
          </div>
          <div className="bg-amber-50/80 backdrop-blur-md p-4 rounded-2xl border border-amber-200/80 shadow-xs hover:border-amber-300 transition-colors">
            <span className="text-[10px] uppercase font-bold tracking-widest text-amber-800">Dueños / Admins</span>
            <div className="text-2xl md:text-3xl font-bold font-serif text-amber-900 mt-1">{ownerCount}</div>
          </div>
          <div className="bg-blue-50/80 backdrop-blur-md p-4 rounded-2xl border border-blue-200/80 shadow-xs hover:border-blue-300 transition-colors">
            <span className="text-[10px] uppercase font-bold tracking-widest text-blue-700">Recepcionistas</span>
            <div className="text-2xl md:text-3xl font-bold font-serif text-blue-950 mt-1">{receptionistCount}</div>
          </div>
          <div className="bg-emerald-50/80 backdrop-blur-md p-4 rounded-2xl border border-emerald-200/80 shadow-xs hover:border-emerald-300 transition-colors">
            <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-700">Limpieza</span>
            <div className="text-2xl md:text-3xl font-bold font-serif text-emerald-950 mt-1">{cleaningCount}</div>
          </div>
        </div>
      </div>

      {/* GUÍA DE ROLES & PERMISOS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-3xl p-6 border border-stone-100 shadow-sm relative overflow-hidden group hover:border-amber-200 transition-all">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 font-black">
            <Crown size={20} />
          </div>
          <h3 className="font-bold text-stone-900 text-sm">Dueño / Admin</h3>
          <p className="text-xs text-stone-500 mt-1.5 leading-relaxed">
            Acceso absoluto. Visualiza gráficos de ventas totales, reportes de ingresos, almacén, elimina reservas y autoriza a nuevos miembros.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-stone-100 shadow-sm relative overflow-hidden group hover:border-blue-200 transition-all">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 font-black">
            <KeyRound size={20} />
          </div>
          <h3 className="font-bold text-stone-900 text-sm">Recepcionista</h3>
          <p className="text-xs text-stone-500 mt-1.5 leading-relaxed">
            Turno operativo. Registro de reservas walk-in, cobro de abonos, consumos de minibar, calendario visual y boletas. No ve ingresos totales ni elimina reservas.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-stone-100 shadow-sm relative overflow-hidden group hover:border-emerald-200 transition-all">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 font-black">
            <Brush size={20} />
          </div>
          <h3 className="font-bold text-stone-900 text-sm">Personal de Limpieza</h3>
          <p className="text-xs text-stone-500 mt-1.5 leading-relaxed">
            Housekeeping. Solo visualiza el estado de las habitaciones (libres/ocupadas) y puede cambiar el indicador entre &quot;Limpio&quot; y &quot;Sucia&quot;.
          </p>
        </div>
      </div>

      {/* TABLA DE PERSONAL AUTORIZADO */}
      <div className="bg-white rounded-[2.5rem] border border-stone-100 shadow-sm overflow-hidden">
        <div className="p-6 md:p-8 border-b border-stone-100 flex justify-between items-center flex-wrap gap-4">
          <div>
            <h3 className="text-xl font-bold text-stone-900">Personal Autorizado ({staffList.length})</h3>
            <p className="text-xs text-stone-400 mt-0.5">
              Cualquier usuario con estos correos podrá iniciar sesión en la web y acceder al panel según su rol.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50/70 border-b border-stone-100 text-[10px] font-black uppercase tracking-wider text-stone-400">
                <th className="py-4 px-6">Colaborador / Correo</th>
                <th className="py-4 px-6">Rol Asignado</th>
                <th className="py-4 px-6">Cambiar Rol Rápido</th>
                <th className="py-4 px-6 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs font-medium text-stone-700">
              {staffList.map((staff) => {
                const isSelf = staff.email.toLowerCase() === currentUserEmail.toLowerCase();
                const initial = (staff.name || staff.email).charAt(0).toUpperCase();

                return (
                  <tr
                    key={staff.email}
                    className={`hover:bg-amber-50/30 transition-colors ${
                      isSelf ? "bg-amber-50/15" : ""
                    }`}
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-stone-800 to-stone-900 text-amber-300 font-bold flex items-center justify-center shrink-0 shadow-md shadow-stone-900/10">
                          {initial}
                        </div>
                        <div>
                          <div className="font-bold text-stone-900 flex items-center gap-2">
                            {staff.name || staff.email.split("@")[0]}
                            {isSelf && (
                              <span className="text-[9px] font-black uppercase tracking-widest bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                                Tu sesión
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-stone-400 flex items-center gap-1 font-mono mt-0.5">
                            <Mail size={12} /> {staff.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6">{getRoleBadge(staff.role)}</td>

                    <td className="py-4 px-6">
                      <select
                        value={staff.role}
                        onChange={(e) => handleRoleChange(staff.email, e.target.value)}
                        disabled={loading}
                        className="bg-white border border-stone-200 rounded-xl px-3 py-1.5 text-xs font-bold text-stone-700 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition cursor-pointer"
                      >
                        <option value="dueño">Dueño / Admin</option>
                        <option value="recepcionista">Recepcionista</option>
                        <option value="limpieza">Personal de Limpieza</option>
                      </select>
                    </td>

                    <td className="py-4 px-6 text-center">
                      {isSelf ? (
                        <span className="text-[10px] text-stone-400 font-bold italic">
                          Protegido
                        </span>
                      ) : (
                        <button
                          onClick={() => handleDelete(staff.email)}
                          disabled={loading}
                          className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 p-2 rounded-xl transition cursor-pointer"
                          title="Revocar acceso"
                        >
                          <Trash2 size={14} /> Revocar
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}

              {staffList.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-stone-400 italic">
                    No se encontró personal registrado en la tabla hotel_staff.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: AUTORIZAR NUEVO PERSONAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[2.5rem] p-6 md:p-8 w-full max-w-lg shadow-2xl relative border border-stone-100">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 text-stone-400 hover:text-stone-700 bg-stone-100 hover:bg-stone-200 p-2 rounded-full transition"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-[#e3004f] flex items-center justify-center shadow-inner">
                <UserPlus size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-stone-900">Autorizar Personal</h3>
                <p className="text-xs text-stone-400">Asigna permisos y rol en el sistema</p>
              </div>
            </div>

            <form onSubmit={handleCreateOrUpdate} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-stone-500 ml-1">
                  Correo Electrónico (Gmail o usuario de acceso) *
                </label>
                <div className="relative mt-1">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="email"
                    required
                    placeholder="ejemplo@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-800 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
                  />
                </div>
                <p className="text-[10px] text-stone-400 mt-1 ml-1">
                  El colaborador debe usar este mismo correo para iniciar sesión en la web.
                </p>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-stone-500 ml-1">
                  Nombre o Referencia (Opcional)
                </label>
                <div className="relative mt-1">
                  <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    placeholder="Ej: Carmen Huamán (Recepción Turno Noche)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-800 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-stone-500 ml-1">
                  Rol a Asignar *
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full mt-1 p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-800 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition cursor-pointer"
                >
                  <option value="recepcionista">Recepcionista (Operativa diaria, check-in, cobros)</option>
                  <option value="dueño">Dueño / Admin (Acceso Total a Ventas, Cuartos y Roles)</option>
                  <option value="limpieza">Personal de Limpieza (Solo cambio de estado Limpio/Sucio)</option>
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-[#e3004f] hover:bg-stone-950 text-white font-bold py-3.5 rounded-xl text-xs uppercase tracking-wider transition-all duration-300 shadow-md shadow-rose-950/20 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? "Guardando..." : "Autorizar y Guardar"}
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-xs uppercase tracking-wider transition"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
