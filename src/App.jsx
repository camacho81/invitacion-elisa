import React, { useState, useEffect } from 'react';
import { CheckCircle, ArrowRight, ShieldAlert, Database, Table, ArrowLeft, Loader2, Utensils, Lock, Flower, Calendar, Clock, MapPin, Heart } from 'lucide-react';

// --- CONFIGURACIÓN DE FIREBASE ---
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCDTiBk2CLWjG54prrneypKGMmOt0xIW_w",
  authDomain: "comunion-5966d.firebaseapp.com",
  projectId: "comunion-5966d",
  storageBucket: "comunion-5966d.firebasestorage.app",
  messagingSenderId: "207475235203",
  appId: "1:207475235203:web:86ec7934a7922c01c6beb6",
  measurementId: "G-K3ZSJGVR96"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const PIN_ADMIN = "6481";

const CalizIcon = ({ size = 24, className = "", strokeWidth = 1.5 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="6" r="3" />
    <path d="M6 11c0 3.3 2.7 6 6 6s6-2.7 6-6H6z" />
    <path d="M12 17v5" />
    <path d="M9 22h6" />
  </svg>
);

export default function App() {
  const [user, setUser] = useState(null);
  const [authCargando, setAuthCargando] = useState(true);
  const [respuestasDb, setRespuestasDb] = useState([]);
  
  const [modoAdmin, setModoAdmin] = useState(false);
  const [mostrarLoginAdmin, setMostrarLoginAdmin] = useState(false);
  const [pin, setPin] = useState('');
  const [errorPin, setErrorPin] = useState(false);
  
  const [clickAdmin, setClickAdmin] = useState(0); 

  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    nombre: '',
    apellido1: '',
    apellido2: '',
    tipoMenu: '' 
  });

  useEffect(() => {
    let montado = true;
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (error) {
        if (montado) setAuthCargando(false);
      }
    };
    
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (montado) {
        if (currentUser) setUser(currentUser);
        setAuthCargando(false);
      }
    });
    initAuth();
    return () => { montado = false; unsubscribe(); };
  }, []);

  useEffect(() => {
    const colRef = collection(db, 'invitados');
    const unsubscribe = onSnapshot(colRef, 
      (snapshot) => {
        const datosExtraidos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        datosExtraidos.sort((a, b) => b.fecha - a.fecha);
        setRespuestasDb(datosExtraidos);
      },
      (error) => { console.log("Esperando conexión..."); }
    );
    return () => unsubscribe();
  }, []); 

  const handleSecretClick = () => {
    const nuevosClicks = clickAdmin + 1;
    setClickAdmin(nuevosClicks);
    if (nuevosClicks >= 5) {
      setMostrarLoginAdmin(true);
      setClickAdmin(0); 
    }
  };

  const handleLoginAdmin = (e) => {
    e.preventDefault();
    if (pin === PIN_ADMIN) {
      setModoAdmin(true);
      setMostrarLoginAdmin(false);
      setPin('');
      setErrorPin(false);
    } else {
      setErrorPin(true);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const nombreNormalizado = formData.nombre.trim().toLowerCase();
    const apellido1Normalizado = formData.apellido1.trim().toLowerCase();
    const apellido2Normalizado = formData.apellido2.trim().toLowerCase();
    
    const yaExiste = respuestasDb.some(invitado => {
      const invNom = (invitado.nombre || '').trim().toLowerCase();
      const invApe1 = (invitado.apellido1 || invitado.apellido || '').trim().toLowerCase();
      const invApe2 = (invitado.apellido2 || '').trim().toLowerCase();
      return invNom === nombreNormalizado && invApe1 === apellido1Normalizado && invApe2 === apellido2Normalizado;
    });

    if (yaExiste) {
      setErrorMsg('Esta persona ya está registrada en la lista de invitados.');
      return;
    }

    setEnviando(true);
    try {
      const colRef = collection(db, 'invitados');
      await addDoc(colRef, {
        nombre: formData.nombre.trim(),
        apellido1: formData.apellido1.trim(),
        apellido2: formData.apellido2.trim(),
        tipoMenu: formData.tipoMenu, 
        fecha: Date.now(), 
        userId: user ? user.uid : 'invitado_' + Date.now()
      });
      setEnviado(true);
    } catch (error) {
      alert("Hubo un problema al guardar. Revisa tu configuración de Firebase.");
    } finally {
      setEnviando(false);
    }
  };

  const resetForm = () => {
    setFormData({ nombre: '', apellido1: '', apellido2: '', tipoMenu: '' });
    setEnviado(false);
    setErrorMsg('');
  };

  const formatearFecha = (timestamp) => {
    const fecha = new Date(timestamp);
    return fecha.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute:'2-digit' });
  };

  if (authCargando) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-pink-100 flex flex-col items-center justify-center p-4">
        <Loader2 className="animate-spin text-pink-500 mb-4" size={48} />
        <p className="text-gray-600 font-medium">Cargando invitación...</p>
      </div>
    );
  }

  if (mostrarLoginAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-pink-100 flex items-center justify-center p-4">
        <div className="bg-white max-w-sm w-full rounded-2xl shadow-xl p-8 text-center animate-in fade-in zoom-in duration-300">
          <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4 text-pink-500"><Lock size={32} /></div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Acceso Privado</h2>
          <p className="text-gray-600 mb-6 text-sm">PIN de administrador</p>
          <form onSubmit={handleLoginAdmin}>
            <input type="password" placeholder="••••" value={pin} onChange={(e) => { setPin(e.target.value); setErrorPin(false); }} className={`w-full px-4 py-3 text-center text-xl tracking-widest rounded-xl border outline-none transition-all duration-200 mb-4 ${errorPin ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-pink-400 focus:ring-2 focus:ring-pink-400'}`} autoFocus />
            {errorPin && <p className="text-red-500 text-sm mb-4">PIN incorrecto</p>}
            <button type="submit" className="w-full bg-pink-400 hover:bg-pink-500 text-white font-medium py-3 px-4 rounded-xl transition-colors mb-3">Entrar</button>
            <button type="button" onClick={() => { setMostrarLoginAdmin(false); setErrorPin(false); setPin(''); }} className="w-full bg-white text-gray-500 hover:text-gray-800 font-medium py-2 px-4 transition-colors">Cancelar</button>
          </form>
        </div>
      </div>
    );
  }

  if (modoAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-pink-400 text-white rounded-xl shadow-lg shadow-pink-200"><Database size={24} /></div>
              <div><h1 className="text-2xl font-bold text-gray-800">Lista de Invitados</h1><p className="text-gray-500 text-sm">Registro de asistencias</p></div>
            </div>
            <button onClick={() => setModoAdmin(false)} className="flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-xl transition-colors font-medium shadow-sm"><ArrowLeft size={18} />Cerrar Panel</button>
          </div>
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="p-4 font-semibold text-gray-600 text-sm">Fecha</th>
                    <th className="p-4 font-semibold text-gray-600 text-sm">Nombre</th>
                    <th className="p-4 font-semibold text-gray-600 text-sm text-center">Menú</th>
                  </tr>
                </thead>
                <tbody>
                  {respuestasDb.length === 0 ? (
                    <tr><td colSpan="3" className="p-8 text-center text-gray-500"><Table size={48} className="mx-auto text-gray-300 mb-3" /><p>Aún no hay invitados.</p></td></tr>
                  ) : (
                    respuestasDb.map((resp) => (
                      <tr key={resp.id} className="border-b border-gray-100 hover:bg-pink-50/50 transition-colors">
                        <td className="p-4 text-sm text-gray-500 whitespace-nowrap">{formatearFecha(resp.fecha)}</td>
                        <td className="p-4 font-medium text-gray-800">{resp.nombre} {resp.apellido1} {resp.apellido2}</td>
                        <td className="p-4 text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${resp.tipoMenu === 'adulto' || resp.esAdulto === 'si' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>
                            {resp.tipoMenu === 'adulto' || resp.esAdulto === 'si' ? 'Adulto' : 'Infantil'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="bg-gray-50 p-4 border-t border-gray-100 flex justify-between items-center text-sm text-gray-500">
              <div className="flex gap-4">
                <span className="text-purple-600 font-medium">Adultos: {respuestasDb.filter(r => r.tipoMenu === 'adulto' || r.esAdulto === 'si').length}</span>
                <span className="text-orange-600 font-medium">Niños: {respuestasDb.filter(r => r.tipoMenu === 'infantil' || r.esAdulto === 'no').length}</span>
              </div>
              <div>Total: <strong>{respuestasDb.length}</strong></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (enviado) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-pink-100 flex items-center justify-center p-4">
        <div className="bg-white max-w-md w-full rounded-2xl shadow-xl p-8 text-center animate-in fade-in zoom-in duration-300">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600"><CheckCircle size={32} /></div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">¡Asistencia confirmada!</h2>
          <p className="text-gray-600 mb-6">Gracias, {formData.nombre}. Hemos registrado tu confirmación.</p>
          <button onClick={resetForm} className="w-full bg-pink-400 hover:bg-pink-500 text-white font-medium py-3 px-4 rounded-xl transition-colors">Confirmar a otra persona</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-pink-100 flex flex-col items-center justify-center p-4 md:p-8 font-sans relative">
      <div className="max-w-5xl w-full flex flex-col md:flex-row gap-6 lg:gap-10 items-center md:items-stretch mt-8 md:mt-0">
        
        {/* TARJETA DE INVITACIÓN */}
        <div className="w-full md:w-1/2 bg-[#FFFCFD] rounded-sm shadow-xl p-8 lg:p-12 relative overflow-hidden flex flex-col items-center text-center">
          <div className="absolute inset-3 border-[1px] border-pink-100/60 pointer-events-none"></div>
          <svg className="absolute top-0 left-0 w-full h-24 text-pink-100/50 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none"><path d="M0,0 L50,100 L100,0" fill="none" stroke="currentColor" strokeWidth="1" /></svg>

          <div className="relative z-10 flex flex-col items-center w-full">
            <Flower size={32} strokeWidth={1.5} className="text-pink-400 mb-6 mt-4" />
            <p className="text-[10px] sm:text-xs tracking-[0.2em] text-slate-400 uppercase font-semibold mb-4">Mi Primera Comunión</p>
            <h1 className="text-5xl sm:text-6xl font-serif text-[#1e293b] mb-6 tracking-tight">Elisa</h1>
            <div className="w-16 h-[1px] bg-pink-200 mb-6"></div>

            <p className="text-slate-500 italic font-serif text-lg sm:text-xl mb-10 px-4">
              "En este día tan especial, Jesús viene a mi corazón por primera vez."
            </p>

            <div className="space-y-6 w-full">
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-2 text-pink-400 font-bold text-[10px] sm:text-xs tracking-widest uppercase mb-1"><Calendar size={14} strokeWidth={2.5} /> Fecha</div>
                <p className="text-slate-700 text-base sm:text-lg">26 de Abril de 2026</p>
              </div>

              <div className="flex flex-col items-center">
                <div className="flex items-center gap-2 text-pink-400 font-bold text-[10px] sm:text-xs tracking-widest uppercase mb-1"><Clock size={14} strokeWidth={2.5} /> Hora</div>
                <p className="text-slate-700 text-base sm:text-lg">10:30h</p>
              </div>

              <div className="flex flex-col items-center">
                <div className="flex items-center gap-2 text-pink-400 font-bold text-[10px] sm:text-xs tracking-widest uppercase mb-1"><MapPin size={14} strokeWidth={2.5} /> Ceremonia</div>
                <p className="text-slate-700 text-base sm:text-lg">Colegio Salesianos de Huelva</p>
              </div>

              <div className="w-24 h-[1px] bg-pink-100 mx-auto my-6"></div>

              <div className="flex flex-col items-center relative">
                <div className="absolute right-0 bottom-0 w-20 h-20 bg-pink-100/60 rounded-tl-[40px] rounded-br-[40px] -z-10 translate-x-4 translate-y-2"></div>
                <p className="text-slate-400 font-bold text-[10px] sm:text-xs tracking-widest uppercase mb-2">Celebración Posterior</p>
                <p className="text-slate-700 text-lg sm:text-xl font-serif italic">Salón Los Jardines de Cartaya</p>
              </div>
            </div>
          </div>
          <Heart size={20} className="text-pink-100 mt-12 fill-pink-100 relative z-10" />
          <svg className="absolute bottom-0 left-0 w-full h-24 text-pink-100/50 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none"><path d="M0,100 L50,0 L100,100" fill="none" stroke="currentColor" strokeWidth="1" /></svg>
        </div>

        {/* FORMULARIO */}
        <div className="w-full md:w-1/2 bg-white rounded-2xl shadow-xl overflow-hidden h-fit">
          <div className="bg-pink-400 p-6 text-white text-center">
            <div 
              className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner cursor-pointer transition-transform hover:scale-105 active:scale-95"
              onClick={handleSecretClick} title="Admin"
            >
              <CalizIcon size={32} className="text-white" strokeWidth={1.5} />
            </div>
            <h2 className="text-2xl font-bold">Confirma tu asistencia</h2>
            <p className="text-pink-50 text-sm mt-1">Por favor, completa tus datos</p>
          </div>
          <form onSubmit={handleSubmit} className="p-6 md:p-8">
            <div className="space-y-5">
              <div><label htmlFor="nombre" className="block text-sm font-semibold text-gray-700 mb-1">Nombre</label><input type="text" id="nombre" name="nombre" required value={formData.nombre} onChange={handleChange} placeholder="Ej. María" className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-pink-400 focus:border-pink-400 outline-none transition-all" /></div>
              <div className="flex flex-col md:flex-row gap-5">
                <div className="flex-1"><label htmlFor="apellido1" className="block text-sm font-semibold text-gray-700 mb-1">1º Apellido</label><input type="text" id="apellido1" name="apellido1" required value={formData.apellido1} onChange={handleChange} placeholder="Ej. García" className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-pink-400 focus:border-pink-400 outline-none transition-all" /></div>
                <div className="flex-1"><label htmlFor="apellido2" className="block text-sm font-semibold text-gray-700 mb-1">2º Apellido</label><input type="text" id="apellido2" name="apellido2" required value={formData.apellido2} onChange={handleChange} placeholder="Ej. Pérez" className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-pink-400 focus:border-pink-400 outline-none transition-all" /></div>
              </div>
              
              <div className="pt-2">
                <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><Utensils size={16} className="text-gray-500" />¿Qué tipo de menú necesitas?</label>
                <div className="flex gap-4">
                  <label className={`flex-1 flex items-center justify-center p-3 border rounded-xl cursor-pointer transition-all ${formData.tipoMenu === 'adulto' ? 'bg-pink-50 border-pink-400 text-pink-600 ring-1 ring-pink-400' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}><input type="radio" name="tipoMenu" value="adulto" required checked={formData.tipoMenu === 'adulto'} onChange={handleChange} className="sr-only" /><span className="font-medium text-sm md:text-base">Menú Adulto</span></label>
                  <label className={`flex-1 flex items-center justify-center p-3 border rounded-xl cursor-pointer transition-all ${formData.tipoMenu === 'infantil' ? 'bg-pink-50 border-pink-400 text-pink-600 ring-1 ring-pink-400' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}><input type="radio" name="tipoMenu" value="infantil" required checked={formData.tipoMenu === 'infantil'} onChange={handleChange} className="sr-only" /><span className="font-medium text-sm md:text-base">Menú Infantil</span></label>
                </div>
              </div>
            </div>
            {errorMsg && <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-medium flex items-center gap-2"><ShieldAlert size={18} />{errorMsg}</div>}
            <button type="submit" disabled={enviando} className={`w-full mt-8 flex items-center justify-center gap-2 font-semibold py-3 px-4 rounded-xl transition-all ${enviando ? 'bg-pink-300 cursor-not-allowed text-white' : 'bg-pink-400 hover:bg-pink-500 text-white shadow-lg shadow-pink-200 focus:ring-4 focus:ring-pink-200 hover:-translate-y-0.5'}`}>{enviando ? <><Loader2 className="animate-spin" size={18} /><span>Enviando...</span></> : <><span>Confirmar Asistencia</span><ArrowRight size={18} /></>}</button>
          </form>
        </div>
      </div>
    </div>
  );
}
