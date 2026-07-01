import React, { useState } from 'react';
import axios from 'axios';
import { X, CheckCircle2, Loader2 } from 'lucide-react';
import '../../styles/Cliente/Pagos.css';
import mpLogo from '../../assets/Mercado-Pago.png';

const Pago = ({ cotizacion, onClose }) => {
  const [subiendo, setSubiendo] = useState(false);
  const [pagoCompletado, setPagoCompletado] = useState(false);

  // Estado para efectivo
  const [modoEfectivo, setModoEfectivo] = useState(false);
  const [cashAmountType, setCashAmountType] = useState('full'); // 'advance' | 'full'
  const [cashTiming, setCashTiming] = useState('immediate');   // 'immediate' | 'on_completion'
  const [enviandoEfectivo, setEnviandoEfectivo] = useState(false);
  const [efectivoEnviado, setEfectivoEnviado] = useState(false);

  const total    = Number(cotizacion?.total || 0);
  const anticipo = Math.round(total * 0.60 * 100) / 100;
  const restante = Math.round(total * 0.40 * 100) / 100;

  const yaPayoAnticipo = cotizacion?.advance_paid === true;
  const fmt = (n) => `$${Number(n).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const handleMercadoPago = async (stage) => {
    try {
      setSubiendo(true);
      const token = localStorage.getItem('agente_token');

      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/cotizaciones/${cotizacion.id}/mercadopago/preference`,
        { payment_stage: stage },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.data?.init_point) {
        window.location.href = response.data.init_point;
      } else {
        alert('No se recibió el enlace de pago. Intenta de nuevo.');
        setSubiendo(false);
      }
    } catch (error) {
      console.error('Error iniciando MercadoPago:', error);
      alert('Hubo un error al conectar con MercadoPago. Intenta más tarde.');
      setSubiendo(false);
    }
  };

  const handleSolicitarEfectivo = async () => {
    try {
      setEnviandoEfectivo(true);
      const token = localStorage.getItem('agente_token');
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/cotizaciones/${cotizacion.id}/solicitar-efectivo`,
        { cash_amount_type: cashAmountType, cash_timing: cashTiming },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      setEfectivoEnviado(true);
    } catch (error) {
      console.error('Error solicitando efectivo:', error);
      alert('Error al enviar la solicitud. Intenta de nuevo.');
    } finally {
      setEnviandoEfectivo(false);
    }
  };

  // ---------- PANTALLA: Anticipo ya pagado, solo queda el 40% ----------
  if (yaPayoAnticipo && !cotizacion?.remaining_paid) {
    return (
      <div className="tp-modal-overlay" style={{ zIndex: 100000 }}>
        <div className="payment-content-card" style={{ position: 'relative', maxWidth: '550px', width: '90%', margin: '0 auto', maxHeight: '90vh', overflowY: 'auto', background: '#ffffff', borderRadius: '16px', padding: '30px 24px' }}>
          <button onClick={onClose} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} color="#333" /></button>

          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <CheckCircle2 size={30} color="#16a34a" />
            </div>
            <h2 style={{ color: '#1e293b', fontSize: '1.3rem', marginBottom: '6px' }}>Anticipo cubierto</h2>
            <p style={{ color: '#64748b', fontSize: '0.9rem' }}>El 60% de anticipo ya fue acreditado exitosamente.</p>
          </div>

          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px 20px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: '#64748b' }}>
              <span>✅ Anticipo pagado (60%):</span>
              <span style={{ fontWeight: 'bold', color: '#16a34a' }}>{fmt(anticipo)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', borderTop: '1px solid #e2e8f0', paddingTop: '10px' }}>
              <span style={{ fontWeight: 'bold', color: '#f26624' }}>Saldo pendiente (40%):</span>
              <span style={{ fontWeight: 'bold', color: '#f26624' }}>{fmt(restante)}</span>
            </div>
          </div>

          <button
            onClick={() => handleMercadoPago('remaining')}
            disabled={subiendo}
            style={{ width: '100%', background: '#009ee3', color: 'white', padding: '15px', borderRadius: '10px', border: 'none', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}
          >
            {subiendo ? <Loader2 className="spin-icon" size={20} /> : <>Liquidar Saldo (40%) con <img src={mpLogo} alt="MP" style={{ height: '22px', filter: 'brightness(0) invert(1)' }} /></>}
          </button>
        </div>
      </div>
    );
  }

  // ---------- PANTALLA: Solicitud de efectivo enviada ----------
  if (efectivoEnviado) {
    return (
      <div className="tp-modal-overlay" style={{ zIndex: 100000 }}>
        <div className="payment-content-card" style={{ maxWidth: '480px', textAlign: 'center', padding: '50px 24px', background: '#fff', borderRadius: '16px', margin: '0 auto' }}>
          <CheckCircle2 size={60} color="#16a34a" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ color: '#1e293b', marginBottom: '10px' }}>¡Solicitud enviada!</h2>
          <p style={{ color: '#64748b', marginBottom: '20px' }}>El administrador ha sido notificado de tu solicitud de pago en efectivo. Te confirmará cuando reciba el pago.</p>
          <button onClick={onClose} style={{ background: '#f26624', color: 'white', border: 'none', padding: '12px 30px', borderRadius: '25px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem' }}>
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  // ---------- PANTALLA PRINCIPAL: Selector de método de pago ----------
  return (
    <div className="tp-modal-overlay" style={{ zIndex: 100000 }}>
      <div className="payment-content-card" style={{ position: 'relative', maxWidth: '600px', width: '90%', margin: '0 auto', maxHeight: '90vh', overflowY: 'auto', background: '#ffffff', borderRadius: '16px' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', cursor: 'pointer', zIndex: 10 }}><X size={24} color="#333" /></button>

        {/* Encabezado */}
        <div style={{ textAlign: 'center', padding: '30px 24px 16px' }}>
          <h1 style={{ color: '#1e293b', fontSize: '1.4rem', marginBottom: '6px' }}>Selecciona tu método de pago</h1>
          <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Cotización #{cotizacion?.folio || cotizacion?.id}</p>

          {/* Desglose visual */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '18px' }}>
            <div style={{ background: '#fff7ed', border: '1px solid #fdba74', borderRadius: '10px', padding: '12px 18px', minWidth: '130px' }}>
              <div style={{ fontSize: '0.75rem', color: '#9a3412', marginBottom: '4px' }}>Total del servicio</div>
              <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#1e293b' }}>{fmt(total)}</div>
            </div>
            <div style={{ background: '#eff6ff', border: '1px solid #93c5fd', borderRadius: '10px', padding: '12px 18px', minWidth: '130px' }}>
              <div style={{ fontSize: '0.75rem', color: '#1e40af', marginBottom: '4px' }}>Anticipo (60%)</div>
              <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#1d4ed8' }}>{fmt(anticipo)}</div>
            </div>
            <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '10px', padding: '12px 18px', minWidth: '130px' }}>
              <div style={{ fontSize: '0.75rem', color: '#166534', marginBottom: '4px' }}>Al finalizar (40%)</div>
              <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#15803d' }}>{fmt(restante)}</div>
            </div>
          </div>
        </div>

        <div style={{ padding: '0 24px 30px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* OPCIÓN 1: Anticipo 60% */}
          <div style={{ border: '2px solid #3b82f6', borderRadius: '14px', overflow: 'hidden' }}>
            <div style={{ background: '#eff6ff', padding: '14px 18px' }}>
              <p style={{ fontWeight: 'bold', color: '#1e40af', margin: 0, fontSize: '0.95rem' }}>💳 Pagar Anticipo (60%) — {fmt(anticipo)}</p>
              <p style={{ color: '#3b82f6', margin: '4px 0 0', fontSize: '0.8rem' }}>Autoriza el inicio del trabajo pagando el anticipo hoy.</p>
            </div>
            <div style={{ padding: '14px 18px', background: 'white' }}>
              <button
                onClick={() => handleMercadoPago('advance')}
                disabled={subiendo}
                style={{ width: '100%', background: '#009ee3', color: 'white', padding: '13px', borderRadius: '8px', border: 'none', fontWeight: 'bold', fontSize: '0.95rem', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
              >
                {subiendo ? <Loader2 className="spin-icon" size={18} /> : <>Pagar {fmt(anticipo)} con <img src={mpLogo} alt="MP" style={{ height: '20px', filter: 'brightness(0) invert(1)' }} /></>}
              </button>
            </div>
          </div>

          {/* OPCIÓN 2: Pago Total 100% */}
          <div style={{ border: '2px solid #f26624', borderRadius: '14px', overflow: 'hidden' }}>
            <div style={{ background: '#fff7ed', padding: '14px 18px' }}>
              <p style={{ fontWeight: 'bold', color: '#9a3412', margin: 0, fontSize: '0.95rem' }}>💎 Pago Total (100%) — {fmt(total)}</p>
              <p style={{ color: '#f26624', margin: '4px 0 0', fontSize: '0.8rem' }}>Liquida el total en una sola transacción y olvídate de pagos posteriores.</p>
            </div>
            <div style={{ padding: '14px 18px', background: 'white' }}>
              <button
                onClick={() => handleMercadoPago('full')}
                disabled={subiendo}
                style={{ width: '100%', background: '#f26624', color: 'white', padding: '13px', borderRadius: '8px', border: 'none', fontWeight: 'bold', fontSize: '0.95rem', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
              >
                {subiendo ? <Loader2 className="spin-icon" size={18} /> : <>Pagar {fmt(total)} con <img src={mpLogo} alt="MP" style={{ height: '20px', filter: 'brightness(0) invert(1)' }} /></>}
              </button>
            </div>
          </div>

          {/* OPCIÓN 3: Pago en Efectivo */}
          <div style={{ border: '2px solid #16a34a', borderRadius: '14px', overflow: 'hidden' }}>
            <div style={{ background: '#f0fdf4', padding: '14px 18px' }}>
              <p style={{ fontWeight: 'bold', color: '#166534', margin: 0, fontSize: '0.95rem' }}>💵 Solicitar Pago en Efectivo</p>
              <p style={{ color: '#16a34a', margin: '4px 0 0', fontSize: '0.8rem' }}>Coordina el pago en efectivo con el administrador.</p>
            </div>
            <div style={{ padding: '14px 18px', background: 'white' }}>
              {!modoEfectivo ? (
                <button
                  onClick={() => setModoEfectivo(true)}
                  style={{ width: '100%', background: '#16a34a', color: 'white', padding: '13px', borderRadius: '8px', border: 'none', fontWeight: 'bold', fontSize: '0.95rem', cursor: 'pointer' }}
                >
                  Solicitar Pago en Efectivo
                </button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Cuánto */}
                  <div>
                    <p style={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '8px', fontSize: '0.9rem' }}>¿Cuánto deseas pagar?</p>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => setCashAmountType('advance')}
                        style={{ flex: 1, padding: '10px', borderRadius: '8px', border: `2px solid ${cashAmountType === 'advance' ? '#3b82f6' : '#e2e8f0'}`, background: cashAmountType === 'advance' ? '#eff6ff' : 'white', color: cashAmountType === 'advance' ? '#1e40af' : '#64748b', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}
                      >
                        Anticipo 60%<br /><span style={{ fontSize: '0.8rem', fontWeight: 'normal' }}>{fmt(anticipo)}</span>
                      </button>
                      <button
                        onClick={() => setCashAmountType('full')}
                        style={{ flex: 1, padding: '10px', borderRadius: '8px', border: `2px solid ${cashAmountType === 'full' ? '#f26624' : '#e2e8f0'}`, background: cashAmountType === 'full' ? '#fff7ed' : 'white', color: cashAmountType === 'full' ? '#9a3412' : '#64748b', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}
                      >
                        Total 100%<br /><span style={{ fontSize: '0.8rem', fontWeight: 'normal' }}>{fmt(total)}</span>
                      </button>
                    </div>
                  </div>
                  {/* Cuándo */}
                  <div>
                    <p style={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '8px', fontSize: '0.9rem' }}>¿Cuándo lo harás?</p>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => setCashTiming('immediate')}
                        style={{ flex: 1, padding: '10px', borderRadius: '8px', border: `2px solid ${cashTiming === 'immediate' ? '#16a34a' : '#e2e8f0'}`, background: cashTiming === 'immediate' ? '#f0fdf4' : 'white', color: cashTiming === 'immediate' ? '#166534' : '#64748b', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}
                      >
                        🕐 Ahora<br /><span style={{ fontSize: '0.78rem', fontWeight: 'normal' }}>Lo tengo disponible hoy</span>
                      </button>
                      <button
                        onClick={() => setCashTiming('on_completion')}
                        style={{ flex: 1, padding: '10px', borderRadius: '8px', border: `2px solid ${cashTiming === 'on_completion' ? '#16a34a' : '#e2e8f0'}`, background: cashTiming === 'on_completion' ? '#f0fdf4' : 'white', color: cashTiming === 'on_completion' ? '#166534' : '#64748b', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}
                      >
                        📅 Al finalizar<br /><span style={{ fontSize: '0.78rem', fontWeight: 'normal' }}>Cuando el técnico termine</span>
                      </button>
                    </div>
                  </div>
                  {/* Botón enviar */}
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => setModoEfectivo(false)}
                      style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', color: '#64748b', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSolicitarEfectivo}
                      disabled={enviandoEfectivo}
                      style={{ flex: 2, padding: '12px', borderRadius: '8px', border: 'none', background: '#16a34a', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem' }}
                    >
                      {enviandoEfectivo ? <Loader2 className="spin-icon" size={18} /> : '✅ Enviar Solicitud'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Pago;