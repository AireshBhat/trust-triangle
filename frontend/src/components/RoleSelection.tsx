import { UserCircle, FileCheck, Shield } from 'lucide-react';
import { Role } from '../App';

interface RoleSelectionProps {
  onRoleSelect: (role: Role) => void;
}

export default function RoleSelection({ onRoleSelect }: RoleSelectionProps) {
  const roles = [
    {
      id: 'employee' as const,
      title: 'Employee',
      description: 'Request and receive verifiable credentials from issuers',
      icon: UserCircle,
      gradient: 'from-blue-500 to-cyan-500',
      shadowColor: 'shadow-blue-500/50',
    },
    {
      id: 'issuer' as const,
      title: 'Issuer / Witness',
      description: 'Issue verifiable credentials and statements to employees',
      icon: FileCheck,
      gradient: 'from-emerald-500 to-teal-500',
      shadowColor: 'shadow-emerald-500/50',
    },
    {
      id: 'verifier' as const,
      title: 'Verifier',
      description: 'Verify and validate credentials presented by employees',
      icon: Shield,
      gradient: 'from-amber-500 to-orange-500',
      shadowColor: 'shadow-amber-500/50',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
      <div className="max-w-6xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            P2P Credential System
          </h1>
          <p className="text-slate-400 text-lg">
            Select your role to begin the decentralized credential flow
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <button
                key={role.id}
                onClick={() => onRoleSelect(role.id)}
                className="group relative bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 hover:border-slate-600 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${role.gradient} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-300`}
                />

                <div className="relative z-10">
                  <div className={`w-16 h-16 bg-gradient-to-br ${role.gradient} rounded-xl flex items-center justify-center mb-6 shadow-lg ${role.shadowColor} group-hover:shadow-2xl transition-shadow duration-300`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>

                  <h3 className="text-2xl font-bold text-white mb-3">
                    {role.title}
                  </h3>

                  <p className="text-slate-400 leading-relaxed">
                    {role.description}
                  </p>
                </div>

                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <p className="text-slate-500 text-sm">
            Each role runs independently and communicates via P2P network
          </p>
        </div>
      </div>
    </div>
  );
}
