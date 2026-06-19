import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Bell, Check, Info } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import "../../styles/NotificationBell.css";

const timeAgo = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  
  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1) return `hace ${interval} año${interval === 1 ? '' : 's'}`;
  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) return `hace ${interval} mes${interval === 1 ? '' : 'es'}`;
  interval = Math.floor(seconds / 86400);
  if (interval >= 1) return `hace ${interval} día${interval === 1 ? '' : 's'}`;
  interval = Math.floor(seconds / 3600);
  if (interval >= 1) return `hace ${interval} hora${interval === 1 ? '' : 's'}`;
  interval = Math.floor(seconds / 60);
  if (interval >= 1) return `hace ${interval} min${interval === 1 ? '' : 's'}`;
  return "hace unos segundos";
};

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const { user } = useAuth();

  // Función para obtener las notificaciones de Laravel
  const fetchNotifications = async () => {
    try {
      const { data } = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/notifications/unread`,
      );
      if (data.success) {
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error("Error al cargar notificaciones", error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = async (notification) => {
    try {
      await axios.put(
        `${import.meta.env.VITE_API_BASE_URL}/notifications/${notification.id}/read`,
      );
      setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
      setIsOpen(false);

      let url = notification.data.url;
      const type = notification.data.alert_type || notification.data.type;

      console.log("Notification from Bell clicked:", notification);
      
      const isTecnico = user?.role_id === 2;

      // Normalización de URLs y Tipos
      if (type === 'work_order_finished' || type === 'new_report') {
        url = isTecnico ? '/trabajos-tecnico' : '/reportes-globales';
      } else if (type === 'new_quote' || type === 'quote_approved' || type === 'quote_rejected' || type === 'payment_received' || type === 'payment_validated' || type?.includes('quote') || type?.includes('payment')) {
        if (isTecnico) {
          url = '/trabajos-tecnico';
        } else {
          const qId = notification.data.quote_id;
          url = qId ? `/vista-cotizaciones?quoteId=${qId}` : '/vista-cotizaciones';
        }
      } else if (type === 'new_service_requested' || type === 'service_assigned') {
        url = isTecnico ? '/trabajos-tecnico' : '/tablero-servicios';
      } else if (type === 'new_work_order' || type === 'work_order_assigned' || type === 'work_order_rescheduled') {
        url = isTecnico ? '/trabajos-tecnico' : '/levantamientos';
      } else if (type === 'work_order_cancelled_client') { const propId = notification.data.property_id; url = propId ? `/propiedad/${propId}/tablero` : '/propiedades'; } else if (url === '/VistaServiciosAdmin' || url === '/tablero-servicios') {
        url = isTecnico ? '/trabajos-tecnico' : '/tablero-servicios';
      }

      // Fallback de seguridad
      if (!url) {
        if (type?.includes('quote') || type?.includes('payment')) {
          if (isTecnico) {
            url = '/trabajos-tecnico';
          } else {
            const qId = notification.data.quote_id;
            url = qId ? `/vista-cotizaciones?quoteId=${qId}` : '/vista-cotizaciones';
          }
        }
        else if (type?.includes('service') || type?.includes('work_order')) url = isTecnico ? '/trabajos-tecnico' : '/tablero-servicios';
        else url = isTecnico ? '/trabajos-tecnico' : '/VistaRoot';
      }

      console.log("Final URL from Bell:", url);

      if (url) {
        navigate(url);
      }
    } catch (error) {
      console.error("Error al marcar como leída", error);
    }
  };

  return (
    <div
      className="notification-bell-container"
      ref={dropdownRef}
      style={{ position: "relative", marginRight: "20px" }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          position: "relative",
          padding: "5px",
        }}
      >
        <Bell size={24} color="#333" />
        {notifications.length > 0 && (
          <span
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              backgroundColor: "#F26522",
              color: "white",
              borderRadius: "50%",
              fontSize: "0.7rem",
              fontWeight: "bold",
              width: "18px",
              height: "18px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {notifications.length > 9 ? "9+" : notifications.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <span>Notificaciones</span>
            <span className="notification-badge">
              {notifications.length} nuevas
            </span>
          </div>

          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="notification-empty">
                No tienes notificaciones nuevas.
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className="notification-item"
                >
                  <div className="notification-item-icon">
                    <Info size={20} />
                  </div>
                  <div>
                    <h4 className="notification-item-title">
                      {notif.data.title}
                    </h4>
                    <p className="notification-item-message">
                      {notif.data.message}
                    </p>
                    {notif.created_at && (
                      <span style={{ fontSize: '11px', color: '#888', marginTop: '5px', display: 'block' }}>
                        {timeAgo(notif.created_at)}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
            <div
              className="notification-footer"
              onClick={() => {
                setIsOpen(false);
                navigate("/notificaciones");
              }}
            >
              Ver todas las notificaciones
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
