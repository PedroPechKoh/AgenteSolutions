import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Header from "./Shared/Header";
import "../styles/CustomizeLogin.css";

const CustomizeLogin = () => {
  const navigate = useNavigate();

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedColor, setSelectedColor] = useState("#000000");
  const [imageToDelete, setImageToDelete] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchCurrentSettings = async () => {
      try {
        const response = await axios.get(
          "http://127.0.0.1:8000/api/ui/settings/login-settings",
        );
        if (response.data.success) {
          if (response.data.settings.imageUrl)
            setPreviewUrl(response.data.settings.imageUrl);
          if (response.data.settings.colorHex)
            setSelectedColor(response.data.settings.colorHex);
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      }
    };
    fetchCurrentSettings();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setImageToDelete(false);
      setStatusMessage("");
    }
  };

  const handleDeleteImage = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setImageToDelete(true);
    setStatusMessage("");
  };

  const handleSaveChanges = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMessage("");

    try {
      await axios.post(
        "http://127.0.0.1:8000/api/ui/settings/login-background/color",
        { color_hex: selectedColor },
      );

      if (imageToDelete) {
        await axios.delete(
          "http://127.0.0.1:8000/api/ui/settings/login-background/image",
        );
        setImageToDelete(false);
      } else if (selectedFile) {
        const formData = new FormData();
        formData.append("background_image", selectedFile);
        await axios.post(
          "http://127.0.0.1:8000/api/ui/settings/login-background/image",
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          },
        );
        setSelectedFile(null);
      }
      setStatusMessage("¡Éxito! Todos los cambios han sido guardados.");
    } catch (error) {
      console.error("Save error:", error);
      setStatusMessage("Error al guardar los cambios.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="main-container">
      <div className="top-bar-orange"></div>
      <div className="top-bar-black"></div>

      <div className="content-wrapper">
        <Header rolTexto="ADMINISTRADOR" />

        <div className="customize-wrapper">
          <h2 className="customize-title">PERSONALIZAR PANTALLA DE LOGIN</h2>

          <div className="customize-card">
            <div className="customize-grid">
              <div>
                <span className="customize-section-title">
                  1. IMAGEN DE FONDO
                </span>

                <div
                  className="preview-box"
                  style={{ backgroundColor: selectedColor }}
                >
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <span
                      style={{
                        color: "#fff",
                        textShadow: "1px 1px 3px rgba(0,0,0,0.8)",
                        fontWeight: "bold",
                      }}
                    >
                      Vista previa del color
                    </span>
                  )}
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                  <label className="btn-choose-file">
                    📂 ELEGIR FOTO
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/webp"
                      onChange={handleFileChange}
                      style={{ display: "none" }}
                    />
                  </label>

                  {(previewUrl || selectedFile) && (
                    <button
                      type="button"
                      onClick={handleDeleteImage}
                      className="btn-delete-file"
                      title="Eliminar imagen"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>

              <div>
                <span className="customize-section-title">
                  2. COLOR PREDETERMINADO
                </span>

                <div className="color-picker-container">
                  <input
                    type="color"
                    value={selectedColor}
                    onChange={(e) => setSelectedColor(e.target.value)}
                    className="color-picker-input"
                  />
                  <div>
                    <div
                      style={{
                        fontWeight: "900",
                        fontSize: "1.3rem",
                        color: "#000000",
                      }}
                    >
                      {selectedColor.toUpperCase()}
                    </div>{" "}
                  </div>
                </div>

                <p className="color-note">
                  <strong>Nota:</strong> Este color será el fondo de tu sistema
                  de inicio de sesión.
                  <br />
                  Si subes una imagen, el color quedará oculto detrás de la
                  foto, pero se mostrará unos milisegundos mientras la foto
                  carga.
                </p>
              </div>
            </div>

            <div style={{ borderTop: "2px solid #ccc", paddingTop: "20px" }}>
              <button
                onClick={handleSaveChanges}
                disabled={isSaving}
                className="btn-save-all"
              >
                {isSaving
                  ? "GUARDANDO CAMBIOS..."
                  : "💾 GUARDAR TODOS LOS CAMBIOS"}
              </button>
            </div>

            {statusMessage && (
              <p
                style={{
                  marginTop: "15px",
                  fontWeight: "bold",
                  padding: "10px",
                  borderRadius: "10px",
                  textAlign: "center",
                  fontSize: "1rem",
                  backgroundColor: statusMessage.includes("Error")
                    ? "#ff4444"
                    : "#4CAF50",
                  color: "white",
                }}
              >
                {statusMessage}
              </p>
            )}
          </div>

          <button onClick={() => navigate(-1)} className="btn-back">
            Volver al panel
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomizeLogin;
