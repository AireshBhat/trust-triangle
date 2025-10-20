import { useState, useEffect } from 'react';
import RoleSelection from './components/RoleSelection';
import EmployeeView from './components/EmployeeView';
import IssuerView from './components/IssuerView';
import VerifierView from './components/VerifierView';

export type Role = 'employee' | 'issuer' | 'verifier' | null;

function App() {
  const [selectedRole, setSelectedRole] = useState<Role>(null);

  useEffect(() => {
    const savedRole = localStorage.getItem('selectedRole') as Role;
    if (savedRole) {
      setSelectedRole(savedRole);
    }
  }, []);

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
    if (role) {
      localStorage.setItem('selectedRole', role);
    }
  };

  const handleBackToRoleSelection = () => {
    setSelectedRole(null);
    localStorage.removeItem('selectedRole');
  };

  if (!selectedRole) {
    return <RoleSelection onRoleSelect={handleRoleSelect} />;
  }

  return (
    <>
      {selectedRole === 'employee' && <EmployeeView onBack={handleBackToRoleSelection} />}
      {selectedRole === 'issuer' && <IssuerView onBack={handleBackToRoleSelection} />}
      {selectedRole === 'verifier' && <VerifierView onBack={handleBackToRoleSelection} />}
    </>
  );
}

export default App;
