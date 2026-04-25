import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Bell, Check, Info } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import "../../styles/NotificationBell.css";

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

      if (notification.data.url) {
        navigate(notification.data.url);
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
