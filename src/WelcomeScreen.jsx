import { useState } from 'react';
import { db } from './firebase';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';

export default function WelcomeScreen({ onAccessGranted }) {
  const [mode, setMode] = useState('select'); // 'select', 'create', or 'join'
  const [familyName, setFamilyName] = useState('');
  const [password, setPassword] = useState('');
  const [members, setMembers] = useState(['']); // For creating new family
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateFamily = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    console.log('Starting family creation...');
    
    if (!familyName || !password || members.every(m => !m.trim())) {
      setError('Por favor complete todos los campos requeridos');
      return;
    }

    try {
      console.log('Checking if family exists...');
      const familiesRef = collection(db, 'families');
      const q = query(familiesRef, where("name", "==", familyName));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        setError('Este nombre de familia ya existe');
        return;
      }

      console.log('Creating new family in Firestore...');
      const newFamily = await addDoc(familiesRef, {
        name: familyName,
        password,
        members: members.filter(m => m.trim() !== ''),
        created: new Date().toISOString()
      });

      console.log('Family created successfully:', newFamily.id);
      const familyData = {
        familyId: newFamily.id,
        familyName,
        members: members.filter(m => m.trim() !== '')
      };

      console.log('Calling onAccessGranted with:', familyData);
      if (typeof onAccessGranted !== 'function') {
        console.error('onAccessGranted is not a function!');
        return;
      }
      onAccessGranted(familyData);
    } catch (error) {
      console.error('Error in handleCreateFamily:', error);
      setError('Error al crear familia: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinFamily = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    console.log('Attempting to join family:', familyName);

    try {
      // Check if family exists and password matches
      const familiesRef = collection(db, 'families');
      const q = query(familiesRef, where("name", "==", familyName));
      console.log('Querying Firestore for family:', familyName);
      
      const querySnapshot = await getDocs(q);
      console.log('Query results:', querySnapshot.size, 'documents found');

      if (querySnapshot.empty) {
        console.log('No family found with name:', familyName);
        setError('No existe una familia con este nombre');
        setIsLoading(false);
        return;
      }

      const familyDoc = querySnapshot.docs[0];
      const familyData = familyDoc.data();
      console.log('Found family:', familyData.name);

      if (familyData.password !== password) {
        console.log('Password mismatch');
        setError('Contraseña incorrecta');
        setIsLoading(false);
        return;
      }

      console.log('Login successful, calling onAccessGranted');
      onAccessGranted({
        familyId: familyDoc.id,
        familyName: familyData.name,
        members: familyData.members
      });
    } catch (error) {
      console.error('Error joining family:', error);
      setError('Error al unirse a la familia: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const addMember = () => {
    setMembers([...members, '']);
  };

  const updateMember = (index, value) => {
    const newMembers = [...members];
    newMembers[index] = value;
    setMembers(newMembers);
  };

  if (mode === 'select') {
    return (
      <div className="welcome-container">
        <h1>Bienvenido a Tareas Familiares</h1>
        <div className="welcome-buttons">
          <button onClick={() => setMode('create')}>Crear Nueva Lista Familiar</button>
          <button onClick={() => setMode('join')}>Unirse a Lista Existente</button>
        </div>
      </div>
    );
  }

  if (mode === 'create') {
    return (
      <div className="welcome-container">
        <h2>Crear Nueva Lista Familiar</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleCreateFamily} className="family-form">
          <input
            type="text"
            value={familyName}
            onChange={(e) => setFamilyName(e.target.value)}
            placeholder="Nombre de la Familia"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
            required
          />
          <div className="members-section">
            <h3>Miembros de la Familia</h3>
            {members.map((member, index) => (
              <input
                key={index}
                type="text"
                value={member}
                onChange={(e) => updateMember(index, e.target.value)}
                placeholder={`Miembro ${index + 1}`}
              />
            ))}
            <button type="button" onClick={addMember}>+ Añadir Miembro</button>
          </div>
          <div className="form-buttons">
            <button type="button" onClick={() => setMode('select')}>Volver</button>
            <button type="submit" disabled={isLoading}>
              {isLoading ? 'Creando...' : 'Crear Familia'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="welcome-container">
      <h2>Unirse a Lista Familiar</h2>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleJoinFamily} className="family-form">
        <input
          type="text"
          value={familyName}
          onChange={(e) => setFamilyName(e.target.value)}
          placeholder="Nombre de la Familia"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Contraseña"
          required
        />
        <div className="form-buttons">
          <button type="button" onClick={() => setMode('select')}>Volver</button>
          <button type="submit">Unirse</button>
        </div>
      </form>
    </div>
  );
} 