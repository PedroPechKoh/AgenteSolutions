import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Bell, Check, Info } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

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
        "http://127.0.0.1:8000/api/notifications/unread",
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
        `http://127.0.0.1:8000/api/notifications/${notification.id}/read`,
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
        <div
          style={{
            position: "absolute",
            top: "40px",
            right: "-10px",
            width: "320px",
            backgroundColor: "white",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            borderRadius: "8px",
            zIndex: 1000,
            overflow: "hidden",
            border: "1px solid #eee",
          }}
        >
          <div
            style={{
              backgroundColor: "#F26522",
              padding: "12px 15px",
              color: "white",
              fontWeight: "bold",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span>Notificaciones</span>
            <span
              style={{
                fontSize: "0.8rem",
                backgroundColor: "rgba(255,255,255,0.2)",
                padding: "2px 8px",
                borderRadius: "12px",
              }}
            >
              {notifications.length} nuevas
            </span>
          </div>

          <div style={{ maxHeight: "300px", overflowY: "auto" }}>
            {notifications.length === 0 ? (
              <div
                style={{ padding: "20px", textAlign: "center", color: "#888" }}
              >
                No tienes notificaciones nuevas.
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  style={{
                    padding: "15px",
                    borderBottom: "1px solid #eee",
                    cursor: "pointer",
                    display: "flex",
                    gap: "10px",
                    transition: "background 0.2s",
                    ":hover": { backgroundColor: "#f9f9f9" },
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "#f9f9f9")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "transparent")
                  }
                >
                  <div style={{ color: "#F26522", marginTop: "2px" }}>
                    <Info size={20} />
                  </div>
                  <div>
                    <h4
                      style={{
                        margin: "0 0 5px 0",
                        fontSize: "0.9rem",
                        color: "#333",
                      }}
                    >
                      {notif.data.title}
                    </h4>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "0.8rem",
                        color: "#666",
                        lineHeight: "1.4",
                      }}
                    >
                      {notif.data.message}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div
              style={{
                padding: "12px",
                textAlign: "center",
                backgroundColor: "#f9f9f9",
                borderTop: "1px solid #eee",
                cursor: "pointer",
                fontWeight: "bold",
                color: "#F26522",
                fontSize: "0.9rem",
              }}
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
