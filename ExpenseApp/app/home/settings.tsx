import type { AppTheme as Theme } from "@/contexts/theme-context";
import { useAppTheme, useThemeColors } from "@/contexts/theme-context";
import { useUiPrefs } from "@/contexts/ui-prefs-context";
import {
  deleteRefreshToken,
  deleteToken,
  deleteUserData,
  useAuthFetch,
} from "@/hooks/auth";
import { useGoalNotifications } from "@/hooks/use-goal-notifications";
import {
  useScheduledNotifications,
  WEEKDAY_LABELS,
} from "@/hooks/use-scheduled-notifications";
import { MaterialIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { MotiView } from "moti";
import React from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  ToastAndroid,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {};

const THEME_OPTIONS: {
  value: Theme;
  label: string;
  icon: React.ComponentProps<typeof MaterialIcons>["name"];
}[] = [
  {
    value: "system",
    label: "Del sistema (por defecto)",
    icon: "brightness-auto",
  },
  { value: "light", label: "Claro", icon: "brightness-high" },
  { value: "dark", label: "Oscuro", icon: "brightness-2" },
];

const Settings = (props: Props) => {
  const authFetch = useAuthFetch();
  const colors = useThemeColors();
  const { appTheme: selectedTheme, setAppTheme: setSelectedTheme } =
    useAppTheme();
  const {
    soundEnabled,
    vibrationEnabled,
    goalNotificationsEnabled,
    setSoundEnabled,
    setVibrationEnabled,
    setGoalNotificationsEnabled,
  } = useUiPrefs();
  const { notifications, addNotification, removeNotification } =
    useScheduledNotifications();
  const { cancelAll: cancelAllGoalNotifs } = useGoalNotifications();
  const insets = useSafeAreaInsets();
  const [themeModalVisible, setThemeModalVisible] = React.useState(false);
  const [uiModalVisible, setUiModalVisible] = React.useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = React.useState(false);
  const [notifModalVisible, setNotifModalVisible] = React.useState(false);
  const [isClosingModal, setIsClosingModal] = React.useState(false);
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showCurrent, setShowCurrent] = React.useState(false);
  const [showNew, setShowNew] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [isChangingPassword, setIsChangingPassword] = React.useState(false);
  const [profileModalVisible, setProfileModalVisible] = React.useState(false);
  const [profileUsername, setProfileUsername] = React.useState("");
  const [profileEmail, setProfileEmail] = React.useState("");
  const [originalProfileUsername, setOriginalProfileUsername] =
    React.useState("");
  const [originalProfileEmail, setOriginalProfileEmail] = React.useState("");
  const [isSavingProfile, setIsSavingProfile] = React.useState(false);
  const [userData, setUserData] = React.useState<{
    username: string;
    email: string;
  } | null>(null);
  // Notif form state
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [selectedWeekday, setSelectedWeekday] = React.useState(2); // 2 = Lunes en expo (1=Dom)
  const [notifTime, setNotifTime] = React.useState(new Date(2000, 0, 1, 8, 0));
  const [showTimePicker, setShowTimePicker] = React.useState(false);
  const [isAddingNotif, setIsAddingNotif] = React.useState(false);

  React.useEffect(() => {
    SecureStore.getItemAsync("userData").then((raw) => {
      if (raw) {
        try {
          setUserData(JSON.parse(raw));
        } catch {}
      }
    });
  }, []);

  const openProfileModal = () => {
    const uname = userData?.username ?? "";
    const uemail = userData?.email ?? "";
    setProfileUsername(uname);
    setProfileEmail(uemail);
    setOriginalProfileUsername(uname);
    setOriginalProfileEmail(uemail);
    setProfileModalVisible(true);
  };

  const closeProfileModal = () => {
    if (isClosingModal) return;
    setIsClosingModal(true);
    setTimeout(() => {
      setProfileModalVisible(false);
      setIsClosingModal(false);
    }, 300);
  };

  const profileHasChanges =
    profileUsername.trim() !== originalProfileUsername ||
    profileEmail.trim() !== originalProfileEmail;

  const handleSaveProfile = async () => {
    if (!profileUsername.trim() || !profileEmail.trim()) {
      ToastAndroid.show("Completa todos los campos", ToastAndroid.SHORT);
      return;
    }
    if (!/.+@.+\..+/.test(profileEmail.trim())) {
      ToastAndroid.show(
        "El correo electrónico no es válido",
        ToastAndroid.SHORT,
      );
      return;
    }
    setIsSavingProfile(true);
    try {
      const body: Record<string, string> = {};
      if (profileUsername.trim() !== originalProfileUsername)
        body.username = profileUsername.trim();
      if (profileEmail.trim() !== originalProfileEmail)
        body.email = profileEmail.trim();
      await authFetch("/users/profile", {
        method: "PUT",
        body: JSON.stringify(body),
      });
      const updated = {
        username: profileUsername.trim() || originalProfileUsername,
        email: profileEmail.trim() || originalProfileEmail,
      };
      setUserData(updated);
      await SecureStore.setItemAsync("userData", JSON.stringify(updated));
      ToastAndroid.show("Perfil actualizado correctamente", ToastAndroid.SHORT);
      closeProfileModal();
    } catch (err: any) {
      if (err?.status === 400) {
        ToastAndroid.show(
          err?.message || "Los datos ingresados no son válidos",
          ToastAndroid.SHORT,
        );
      } else {
        ToastAndroid.show(
          "Ocurrió un error en el servidor",
          ToastAndroid.SHORT,
        );
      }
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    setIsChangingPassword(true);
    try {
      await authFetch("/users/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      ToastAndroid.show(
        "Contraseña actualizada correctamente",
        ToastAndroid.SHORT,
      );
      closePasswordModal();
    } catch (err: any) {
      if (err?.status === 400) {
        ToastAndroid.show(
          "La contraseña actual no es correcta",
          ToastAndroid.SHORT,
        );
      } else {
        ToastAndroid.show(
          "Ocurrió un error en el servidor",
          ToastAndroid.SHORT,
        );
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  const closeThemeModal = () => {
    if (isClosingModal) return;
    setIsClosingModal(true);
    setTimeout(() => {
      setThemeModalVisible(false);
      setIsClosingModal(false);
    }, 300);
  };

  const closeUiModal = () => {
    if (isClosingModal) return;
    setIsClosingModal(true);
    setTimeout(() => {
      setUiModalVisible(false);
      setIsClosingModal(false);
    }, 300);
  };

  const closePasswordModal = () => {
    if (isClosingModal) return;
    setIsClosingModal(true);
    setTimeout(() => {
      setPasswordModalVisible(false);
      setIsClosingModal(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowCurrent(false);
      setShowNew(false);
      setShowConfirm(false);
    }, 300);
  };

  const closeNotifModal = () => {
    if (isClosingModal) return;
    setIsClosingModal(true);
    setTimeout(() => {
      setNotifModalVisible(false);
      setIsClosingModal(false);
      setShowAddForm(false);
      setSelectedWeekday(2);
      setNotifTime(new Date(2000, 0, 1, 8, 0));
    }, 300);
  };

  const handleAddNotification = async () => {
    setIsAddingNotif(true);
    try {
      await addNotification(
        selectedWeekday,
        notifTime.getHours(),
        notifTime.getMinutes(),
      );
      setShowAddForm(false);
      setSelectedWeekday(2);
      setNotifTime(new Date(2000, 0, 1, 8, 0));
    } catch (err: any) {
      if (err?.message === "permission_denied") {
        ToastAndroid.show(
          "Debes permitir el acceso a notificaciones",
          ToastAndroid.SHORT,
        );
      } else {
        ToastAndroid.show(
          "No se pudo programar la notificación",
          ToastAndroid.SHORT,
        );
      }
    } finally {
      setIsAddingNotif(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "¿Cerrar sesión?",
      "Se cerrará tu sesión en este dispositivo.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Cerrar sesión",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteToken();
              await deleteRefreshToken();
              await deleteUserData();
              ToastAndroid.show("Sesión cerrada", ToastAndroid.SHORT);
            } catch {}
            router.replace("/landing");
          },
        },
      ],
    );
  };

  const currentThemeLabel =
    THEME_OPTIONS.find((o) => o.value === selectedTheme)?.label ?? "";

  return (
    <View style={{ flex: 1, backgroundColor: colors.backgroundSecondary }}>
      {/* Modal de Apariencia */}
      <Modal
        visible={themeModalVisible}
        transparent
        animationType="none"
        onRequestClose={closeThemeModal}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.4)",
            justifyContent: "flex-end",
          }}
          onPress={closeThemeModal}
        >
          <MotiView
            from={{ translateY: 300 }}
            animate={{ translateY: isClosingModal ? 300 : 0 }}
            transition={{ type: "timing", duration: 300 }}
          >
            <Pressable
              style={{
                backgroundColor: colors.surface,
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                paddingTop: 12,
                paddingBottom: 36 + insets.bottom,
                paddingHorizontal: 0,
              }}
              onPress={() => {}}
            >
              {/* Handle */}
              <View
                style={{
                  width: 36,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: colors.border,
                  alignSelf: "center",
                  marginBottom: 20,
                }}
              />
              <Text
                style={{
                  fontSize: 17,
                  fontWeight: "bold",
                  paddingHorizontal: 24,
                  marginBottom: 16,
                  color: colors.text,
                }}
              >
                Apariencia
              </Text>
              {THEME_OPTIONS.map((option, index) => (
                <React.Fragment key={option.value}>
                  <Pressable
                    onPress={() => {
                      setSelectedTheme(option.value);
                      closeThemeModal();
                    }}
                    style={({ pressed }) => ({
                      flexDirection: "row",
                      alignItems: "center",
                      paddingHorizontal: 24,
                      paddingVertical: 16,
                      gap: 16,
                      backgroundColor: pressed ? colors.border : colors.surface,
                    })}
                  >
                    <MaterialIcons
                      name={option.icon}
                      size={24}
                      color="#1755ec"
                    />
                    <Text style={{ flex: 1, fontSize: 15, color: colors.text }}>
                      {option.label}
                    </Text>
                    {selectedTheme === option.value && (
                      <MaterialIcons name="check" size={22} color="#1755ec" />
                    )}
                  </Pressable>
                  {index < THEME_OPTIONS.length - 1 && (
                    <View
                      style={{
                        height: 1,
                        backgroundColor: colors.border,
                        marginLeft: 64,
                      }}
                    />
                  )}
                </React.Fragment>
              ))}
            </Pressable>
          </MotiView>
        </Pressable>
      </Modal>

      {/* Modal de Sonidos y Vibraciones */}
      <Modal
        visible={uiModalVisible}
        transparent
        animationType="none"
        onRequestClose={closeUiModal}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.4)",
            justifyContent: "flex-end",
          }}
          onPress={closeUiModal}
        >
          <MotiView
            from={{ translateY: 300 }}
            animate={{ translateY: isClosingModal ? 300 : 0 }}
            transition={{ type: "timing", duration: 300 }}
          >
            <Pressable
              style={{
                backgroundColor: colors.surface,
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                paddingTop: 12,
                paddingBottom: 36 + insets.bottom,
                paddingHorizontal: 0,
              }}
              onPress={() => {}}
            >
              {/* Handle */}
              <View
                style={{
                  width: 36,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: colors.border,
                  alignSelf: "center",
                  marginBottom: 20,
                }}
              />
              <Text
                style={{
                  fontSize: 17,
                  fontWeight: "bold",
                  paddingHorizontal: 24,
                  marginBottom: 16,
                  color: colors.text,
                }}
              >
                Sonidos y Vibraciones
              </Text>

              {/* Opción Sonidos */}
              <Pressable
                onPress={() => setSoundEnabled(!soundEnabled)}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 24,
                  paddingVertical: 16,
                  gap: 16,
                  backgroundColor: pressed ? colors.border : colors.surface,
                })}
              >
                <MaterialIcons name="volume-up" size={24} color="#1755ec" />
                <Text style={{ flex: 1, fontSize: 15, color: colors.text }}>
                  Sonidos
                </Text>
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    borderWidth: 2,
                    borderColor: soundEnabled ? "#1755ec" : colors.textMuted,
                    backgroundColor: soundEnabled ? "#1755ec" : "transparent",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {soundEnabled && (
                    <View
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: "#fff",
                      }}
                    />
                  )}
                </View>
              </Pressable>

              <View
                style={{
                  height: 1,
                  backgroundColor: colors.border,
                  marginLeft: 64,
                }}
              />

              {/* Opción Vibraciones */}
              <Pressable
                onPress={() => setVibrationEnabled(!vibrationEnabled)}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 24,
                  paddingVertical: 16,
                  gap: 16,
                  backgroundColor: pressed ? colors.border : colors.surface,
                })}
              >
                <MaterialIcons name="vibration" size={24} color="#1755ec" />
                <Text style={{ flex: 1, fontSize: 15, color: colors.text }}>
                  Vibraciones
                </Text>
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    borderWidth: 2,
                    borderColor: vibrationEnabled
                      ? "#1755ec"
                      : colors.textMuted,
                    backgroundColor: vibrationEnabled
                      ? "#1755ec"
                      : "transparent",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {vibrationEnabled && (
                    <View
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: "#fff",
                      }}
                    />
                  )}
                </View>
              </Pressable>

              <View
                style={{
                  height: 1,
                  backgroundColor: colors.border,
                  marginLeft: 64,
                }}
              />

              {/* Notificaciones de metas */}
              <Pressable
                onPress={() => {
                  const next = !goalNotificationsEnabled;
                  setGoalNotificationsEnabled(next);
                  if (!next) {
                    cancelAllGoalNotifs().catch(() => {});
                  }
                }}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 24,
                  paddingVertical: 16,
                  gap: 16,
                  backgroundColor: pressed ? colors.border : colors.surface,
                })}
              >
                <MaterialIcons
                  name="notifications-active"
                  size={24}
                  color="#1755ec"
                />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, color: colors.text }}>
                    Notificaciones de metas
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color: colors.textSecondary,
                      marginTop: 2,
                    }}
                  >
                    Recordatorios, avances y deadlines
                  </Text>
                </View>
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    borderWidth: 2,
                    borderColor: goalNotificationsEnabled
                      ? "#1755ec"
                      : colors.textMuted,
                    backgroundColor: goalNotificationsEnabled
                      ? "#1755ec"
                      : "transparent",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {goalNotificationsEnabled && (
                    <View
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: "#fff",
                      }}
                    />
                  )}
                </View>
              </Pressable>
            </Pressable>
          </MotiView>
        </Pressable>
      </Modal>

      {/* Modal de Perfil */}
      <Modal
        visible={profileModalVisible}
        transparent
        animationType="none"
        onRequestClose={closeProfileModal}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.4)",
            justifyContent: "flex-end",
          }}
          onPress={closeProfileModal}
        >
          <MotiView
            from={{ translateY: 400 }}
            animate={{ translateY: isClosingModal ? 400 : 0 }}
            transition={{ type: "timing", duration: 300 }}
          >
            <Pressable
              style={{
                backgroundColor: colors.surface,
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                paddingTop: 12,
                paddingBottom: 36 + insets.bottom,
                paddingHorizontal: 24,
              }}
              onPress={() => {}}
            >
              {/* Handle */}
              <View
                style={{
                  width: 36,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: colors.border,
                  alignSelf: "center",
                  marginBottom: 20,
                }}
              />
              <Text
                style={{
                  fontSize: 17,
                  fontWeight: "bold",
                  color: colors.text,
                  marginBottom: 24,
                }}
              >
                Editar perfil
              </Text>

              {/* Username */}
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: colors.textSecondary,
                  marginBottom: 8,
                }}
              >
                Nombre de usuario
              </Text>
              <View
                style={{
                  borderWidth: 1,
                  borderColor: colors.borderStrong,
                  borderRadius: 12,
                  backgroundColor: colors.backgroundSecondary,
                  paddingHorizontal: 14,
                  marginBottom: 16,
                }}
              >
                <TextInput
                  value={profileUsername}
                  onChangeText={setProfileUsername}
                  placeholder="Nombre de usuario"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  style={{
                    paddingVertical: 14,
                    fontSize: 15,
                    color: colors.text,
                  }}
                />
              </View>

              {/* Email */}
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: colors.textSecondary,
                  marginBottom: 8,
                }}
              >
                Correo electrónico
              </Text>
              <View
                style={{
                  borderWidth: 1,
                  borderColor: colors.borderStrong,
                  borderRadius: 12,
                  backgroundColor: colors.backgroundSecondary,
                  paddingHorizontal: 14,
                  marginBottom: 28,
                }}
              >
                <TextInput
                  value={profileEmail}
                  onChangeText={setProfileEmail}
                  placeholder="correo@ejemplo.com"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={{
                    paddingVertical: 14,
                    fontSize: 15,
                    color: colors.text,
                  }}
                />
              </View>

              {/* Botón Guardar */}
              <Pressable
                onPress={handleSaveProfile}
                disabled={isSavingProfile || !profileHasChanges}
                style={({ pressed }) => ({
                  backgroundColor:
                    isSavingProfile || !profileHasChanges
                      ? colors.borderStrong
                      : pressed
                        ? "#1245c5"
                        : "#1755ec",
                  borderRadius: 14,
                  paddingVertical: 16,
                  alignItems: "center",
                })}
              >
                <Text
                  style={{
                    color:
                      isSavingProfile || !profileHasChanges
                        ? colors.textMuted
                        : "#fff",
                    fontSize: 16,
                    fontWeight: "bold",
                  }}
                >
                  {isSavingProfile ? "Guardando..." : "Guardar cambios"}
                </Text>
              </Pressable>
            </Pressable>
          </MotiView>
        </Pressable>
      </Modal>

      {/* Modal de Contraseña */}
      <Modal
        visible={passwordModalVisible}
        transparent
        animationType="none"
        onRequestClose={closePasswordModal}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.4)",
            justifyContent: "flex-end",
          }}
          onPress={closePasswordModal}
        >
          <MotiView
            from={{ translateY: 400 }}
            animate={{ translateY: isClosingModal ? 400 : 0 }}
            transition={{ type: "timing", duration: 300 }}
          >
            <Pressable
              style={{
                backgroundColor: colors.surface,
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                paddingTop: 12,
                paddingBottom: 36 + insets.bottom,
                paddingHorizontal: 24,
              }}
              onPress={() => {}}
            >
              {/* Handle */}
              <View
                style={{
                  width: 36,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: colors.border,
                  alignSelf: "center",
                  marginBottom: 20,
                }}
              />
              <Text
                style={{
                  fontSize: 17,
                  fontWeight: "bold",
                  color: colors.text,
                  marginBottom: 24,
                }}
              >
                Cambiar contraseña
              </Text>

              {/* Contraseña actual */}
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: colors.textSecondary,
                  marginBottom: 8,
                }}
              >
                Contraseña actual
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: colors.borderStrong,
                  borderRadius: 12,
                  backgroundColor: colors.backgroundSecondary,
                  paddingHorizontal: 14,
                  marginBottom: 16,
                }}
              >
                <TextInput
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  secureTextEntry={!showCurrent}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textMuted}
                  style={{
                    flex: 1,
                    paddingVertical: 14,
                    fontSize: 15,
                    color: colors.text,
                  }}
                />
                <Pressable
                  onPress={() => setShowCurrent((v) => !v)}
                  hitSlop={8}
                >
                  <MaterialIcons
                    name={showCurrent ? "visibility" : "visibility-off"}
                    size={20}
                    color={colors.textMuted}
                  />
                </Pressable>
              </View>

              {/* Nueva contraseña */}
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: colors.textSecondary,
                  marginBottom: 8,
                }}
              >
                Nueva contraseña
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: colors.borderStrong,
                  borderRadius: 12,
                  backgroundColor: colors.backgroundSecondary,
                  paddingHorizontal: 14,
                  marginBottom: 16,
                }}
              >
                <TextInput
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showNew}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textMuted}
                  style={{
                    flex: 1,
                    paddingVertical: 14,
                    fontSize: 15,
                    color: colors.text,
                  }}
                />
                <Pressable onPress={() => setShowNew((v) => !v)} hitSlop={8}>
                  <MaterialIcons
                    name={showNew ? "visibility" : "visibility-off"}
                    size={20}
                    color={colors.textMuted}
                  />
                </Pressable>
              </View>

              {/* Confirmar nueva contraseña */}
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: colors.textSecondary,
                  marginBottom: 8,
                }}
              >
                Confirmar nueva contraseña
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: colors.borderStrong,
                  borderRadius: 12,
                  backgroundColor: colors.backgroundSecondary,
                  paddingHorizontal: 14,
                  marginBottom: 28,
                }}
              >
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirm}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textMuted}
                  style={{
                    flex: 1,
                    paddingVertical: 14,
                    fontSize: 15,
                    color: colors.text,
                  }}
                />
                <Pressable
                  onPress={() => setShowConfirm((v) => !v)}
                  hitSlop={8}
                >
                  <MaterialIcons
                    name={showConfirm ? "visibility" : "visibility-off"}
                    size={20}
                    color={colors.textMuted}
                  />
                </Pressable>
              </View>

              {/* Aviso de formato de nueva contraseña */}
              {newPassword.length > 0 &&
                (newPassword.length < 8 || !/\d/.test(newPassword)) && (
                  <Text
                    style={{
                      fontSize: 13,
                      color: "#e53935",
                      marginBottom: 12,
                      marginTop: -20,
                    }}
                  >
                    Mínimo 8 caracteres y al menos un número
                  </Text>
                )}

              {/* Aviso de no coincidencia */}
              {confirmPassword.length > 0 &&
                newPassword.length >= 8 &&
                /\d/.test(newPassword) &&
                newPassword !== confirmPassword && (
                  <Text
                    style={{
                      fontSize: 13,
                      color: "#e53935",
                      marginBottom: 12,
                      marginTop: -20,
                    }}
                  >
                    Las contraseñas no coinciden
                  </Text>
                )}

              {/* Botón Cambiar */}
              <Pressable
                onPress={handleChangePassword}
                disabled={
                  isChangingPassword ||
                  !currentPassword ||
                  newPassword.length < 8 ||
                  !/\d/.test(newPassword) ||
                  !confirmPassword ||
                  newPassword !== confirmPassword
                }
                style={({ pressed }) => ({
                  backgroundColor:
                    isChangingPassword ||
                    !currentPassword ||
                    newPassword.length < 8 ||
                    !/\d/.test(newPassword) ||
                    !confirmPassword ||
                    newPassword !== confirmPassword
                      ? colors.borderStrong
                      : pressed
                        ? "#1245c5"
                        : "#1755ec",
                  borderRadius: 14,
                  paddingVertical: 16,
                  alignItems: "center",
                })}
              >
                <Text
                  style={{
                    color:
                      isChangingPassword ||
                      !currentPassword ||
                      newPassword.length < 8 ||
                      !/\d/.test(newPassword) ||
                      !confirmPassword ||
                      newPassword !== confirmPassword
                        ? colors.textMuted
                        : "#fff",
                    fontSize: 16,
                    fontWeight: "bold",
                  }}
                >
                  {isChangingPassword ? "Cambiando..." : "Cambiar contraseña"}
                </Text>
              </Pressable>
            </Pressable>
          </MotiView>
        </Pressable>
      </Modal>

      {/* Modal de Notificaciones */}
      <Modal
        visible={notifModalVisible}
        transparent
        animationType="none"
        onRequestClose={closeNotifModal}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.4)",
          }}
        >
          <Pressable style={{ flex: 1 }} onPress={closeNotifModal} />
          <MotiView
            from={{ translateY: 500 }}
            animate={{ translateY: isClosingModal ? 500 : 0 }}
            transition={{ type: "timing", duration: 300 }}
          >
            <View
              style={{
                backgroundColor: colors.surface,
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                paddingTop: 12,
                paddingBottom: 36 + insets.bottom,
                paddingHorizontal: 24,
              }}
            >
              {/* Handle */}
              <View
                style={{
                  width: 36,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: colors.border,
                  alignSelf: "center",
                  marginBottom: 20,
                }}
              />
              {/* Header */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 20,
                }}
              >
                <Text
                  style={{
                    fontSize: 17,
                    fontWeight: "bold",
                    color: colors.text,
                  }}
                >
                  Notificaciones
                </Text>
                {!showAddForm && (
                  <Pressable
                    onPress={() => setShowAddForm(true)}
                    style={({ pressed }) => ({
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 4,
                      backgroundColor: pressed ? "#1245c5" : "#1755ec",
                      paddingHorizontal: 12,
                      paddingVertical: 7,
                      borderRadius: 10,
                    })}
                  >
                    <MaterialIcons name="add" size={18} color="#fff" />
                    <Text
                      style={{
                        color: "#fff",
                        fontSize: 13,
                        fontWeight: "bold",
                      }}
                    >
                      Agregar
                    </Text>
                  </Pressable>
                )}
              </View>

              {/* Lista de notificaciones */}
              <ScrollView
                style={{ maxHeight: showAddForm ? 160 : 320 }}
                showsVerticalScrollIndicator
              >
                {notifications.length === 0 && !showAddForm && (
                  <View style={{ alignItems: "center", paddingVertical: 32 }}>
                    <MaterialIcons
                      name="notifications-none"
                      size={40}
                      color={colors.textMuted}
                    />
                    <Text
                      style={{
                        marginTop: 10,
                        color: colors.textMuted,
                        fontSize: 14,
                      }}
                    >
                      No hay recordatorios programados
                    </Text>
                  </View>
                )}
                {notifications.map((n) => (
                  <View
                    key={n.id}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: colors.backgroundSecondary,
                      borderRadius: 12,
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                      marginBottom: 10,
                    }}
                  >
                    <MaterialIcons
                      name="alarm"
                      size={20}
                      color="#1755ec"
                      style={{ marginRight: 12 }}
                    />
                    <Text
                      style={{
                        flex: 1,
                        fontSize: 15,
                        color: colors.text,
                        fontWeight: "600",
                      }}
                    >
                      {WEEKDAY_LABELS[n.weekday - 1]}
                      {"  ·  "}
                      {String(n.hour).padStart(2, "0")}:
                      {String(n.minute).padStart(2, "0")}
                    </Text>
                    <Pressable
                      onPress={() =>
                        removeNotification(n.id).catch(() =>
                          ToastAndroid.show(
                            "Error al eliminar recordatorio",
                            ToastAndroid.SHORT,
                          ),
                        )
                      }
                      hitSlop={10}
                    >
                      <MaterialIcons
                        name="delete-outline"
                        size={22}
                        color="#e53935"
                      />
                    </Pressable>
                  </View>
                ))}
              </ScrollView>

              {/* Formulario para agregar */}
              {showAddForm && (
                <View
                  style={{
                    marginTop: 8,
                    backgroundColor: colors.backgroundSecondary,
                    borderRadius: 16,
                    padding: 16,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: colors.textSecondary,
                      marginBottom: 12,
                    }}
                  >
                    Día de la semana
                  </Text>
                  {/* Días pills — weekday: 1=Dom,2=Lun,...,7=Sáb */}
                  <View
                    style={{
                      flexDirection: "row",
                      flexWrap: "wrap",
                      gap: 8,
                      marginBottom: 16,
                    }}
                  >
                    {[
                      { label: "Dom", value: 1 },
                      { label: "Lun", value: 2 },
                      { label: "Mar", value: 3 },
                      { label: "Mié", value: 4 },
                      { label: "Jue", value: 5 },
                      { label: "Vie", value: 6 },
                      { label: "Sáb", value: 7 },
                    ].map((d) => (
                      <Pressable
                        key={d.value}
                        onPress={() => setSelectedWeekday(d.value)}
                        style={{
                          paddingHorizontal: 14,
                          paddingVertical: 7,
                          borderRadius: 20,
                          backgroundColor:
                            selectedWeekday === d.value
                              ? "#1755ec"
                              : colors.surface,
                          borderWidth: 1,
                          borderColor:
                            selectedWeekday === d.value
                              ? "#1755ec"
                              : colors.border,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: "600",
                            color:
                              selectedWeekday === d.value
                                ? "#fff"
                                : colors.textSecondary,
                          }}
                        >
                          {d.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: colors.textSecondary,
                      marginBottom: 10,
                    }}
                  >
                    Hora
                  </Text>
                  <Pressable
                    onPress={() => setShowTimePicker(true)}
                    style={({ pressed }) => ({
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 10,
                      backgroundColor: pressed
                        ? colors.surface
                        : colors.background,
                      borderWidth: 1,
                      borderColor: colors.borderStrong,
                      borderRadius: 12,
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                      marginBottom: 16,
                    })}
                  >
                    <MaterialIcons
                      name="access-time"
                      size={20}
                      color="#1755ec"
                    />
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "700",
                        color: colors.text,
                      }}
                    >
                      {String(notifTime.getHours()).padStart(2, "0")}:
                      {String(notifTime.getMinutes()).padStart(2, "0")}
                    </Text>
                  </Pressable>

                  {showTimePicker && (
                    <DateTimePicker
                      value={notifTime}
                      mode="time"
                      is24Hour
                      display="default"
                      onChange={(_event, date) => {
                        setShowTimePicker(false);
                        if (date) setNotifTime(date);
                      }}
                    />
                  )}

                  <View style={{ flexDirection: "row", gap: 10 }}>
                    <Pressable
                      onPress={() => setShowAddForm(false)}
                      style={({ pressed }) => ({
                        flex: 1,
                        paddingVertical: 13,
                        borderRadius: 12,
                        alignItems: "center",
                        backgroundColor: pressed
                          ? colors.borderStrong
                          : colors.surface,
                        borderWidth: 1,
                        borderColor: colors.border,
                      })}
                    >
                      <Text
                        style={{
                          fontSize: 15,
                          fontWeight: "bold",
                          color: colors.textSecondary,
                        }}
                      >
                        Cancelar
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={handleAddNotification}
                      disabled={isAddingNotif}
                      style={({ pressed }) => ({
                        flex: 1,
                        paddingVertical: 13,
                        borderRadius: 12,
                        alignItems: "center",
                        backgroundColor: isAddingNotif
                          ? colors.borderStrong
                          : pressed
                            ? "#1245c5"
                            : "#1755ec",
                      })}
                    >
                      <Text
                        style={{
                          fontSize: 15,
                          fontWeight: "bold",
                          color: isAddingNotif ? colors.textMuted : "#fff",
                        }}
                      >
                        {isAddingNotif ? "Guardando..." : "Agregar"}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </View>
          </MotiView>
        </View>
      </Modal>

      <View
        style={{
          paddingHorizontal: 25,
          paddingVertical: 18,
          backgroundColor: colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          paddingTop: 18 + insets.top,
        }}
      >
        <Pressable
          onPress={() => {
            if (router.canGoBack()) router.back();
            else router.replace("/home" as any);
          }}
          hitSlop={10}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
        >
          <MaterialIcons name="arrow-back" size={26} color={colors.text} />
        </Pressable>
        <Text style={{ fontSize: 24, fontWeight: "bold", color: colors.text }}>
          Configuración
        </Text>
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View
          style={{
            padding: 25,
            gap: 5,
            backgroundColor: "#1755ec",
            margin: 25,
            borderRadius: 20,
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 28 }}>
            {userData?.username ?? ""}
          </Text>
          <Text style={{ color: "#fff" }}>{userData?.email ?? ""}</Text>
        </View>
        <View style={{ marginHorizontal: 25 }}>
          <Text
            style={{
              fontSize: 13,
              fontWeight: "bold",
              color: colors.textSecondary,
              marginBottom: 10,
              textTransform: "capitalize",
            }}
          >
            Cuenta
          </Text>
          <View
            style={{
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.borderStrong,
              overflow: "hidden",
              backgroundColor: colors.surface,
            }}
          >
            {/* Perfil de Usuario */}
            <Pressable
              onPress={openProfileModal}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 18,
                paddingVertical: 16,
                gap: 14,
                backgroundColor: pressed ? colors.border : colors.surface,
              })}
            >
              <MaterialIcons name="person-outline" size={28} color="#1755ec" />
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "bold",
                    color: colors.text,
                  }}
                >
                  Perfil de Usuario
                </Text>
                <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                  Nombre y correo electrónico
                </Text>
              </View>
              <MaterialIcons
                name="keyboard-arrow-right"
                size={22}
                color={colors.textMuted}
              />
            </Pressable>

            {/* Separador */}
            <View
              style={{
                height: 1,
                backgroundColor: colors.border,
                marginLeft: 60,
              }}
            />

            {/* Seguridad */}
            <Pressable
              onPress={() => setPasswordModalVisible(true)}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 18,
                paddingVertical: 16,
                gap: 14,
                backgroundColor: pressed ? colors.border : colors.surface,
              })}
            >
              <MaterialIcons name="lock-outline" size={28} color="#1755ec" />
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "bold",
                    color: colors.text,
                  }}
                >
                  Seguridad
                </Text>
                <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                  Contraseña, autenticación
                </Text>
              </View>
              <MaterialIcons
                name="keyboard-arrow-right"
                size={22}
                color={colors.textMuted}
              />
            </Pressable>

            {/* Separador */}
            <View
              style={{
                height: 1,
                backgroundColor: colors.border,
                marginLeft: 60,
              }}
            />

            {/* Notificaciones */}
            <Pressable
              onPress={() => setNotifModalVisible(true)}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 18,
                paddingVertical: 16,
                gap: 14,
                backgroundColor: pressed
                  ? colors.backgroundSecondary
                  : "transparent",
              })}
            >
              <MaterialIcons
                name="notifications-none"
                size={28}
                color="#1755ec"
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "bold",
                    color: colors.text,
                  }}
                >
                  Notificaciones
                </Text>
                <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                  {notifications.length > 0
                    ? `${notifications.length} recordatorio${notifications.length > 1 ? "s" : ""} activo${notifications.length > 1 ? "s" : ""}`
                    : "Alertas y recordatorios"}
                </Text>
              </View>
              <MaterialIcons
                name="keyboard-arrow-right"
                size={22}
                color={colors.textMuted}
              />
            </Pressable>
          </View>
        </View>

        <View style={{ marginHorizontal: 25, marginTop: 24 }}>
          <Text
            style={{
              fontSize: 13,
              fontWeight: "bold",
              color: colors.textSecondary,
              marginBottom: 10,
              textTransform: "capitalize",
            }}
          >
            Preferencias
          </Text>
          <View
            style={{
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.borderStrong,
              overflow: "hidden",
              backgroundColor: colors.surface,
            }}
          >
            {/* Apariencia */}
            <Pressable
              onPress={() => setThemeModalVisible(true)}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 18,
                paddingVertical: 16,
                gap: 14,
                backgroundColor: pressed ? colors.border : colors.surface,
              })}
            >
              <MaterialIcons name="brightness-6" size={28} color="#1755ec" />
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "bold",
                    color: colors.text,
                  }}
                >
                  Apariencia
                </Text>
                <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                  {currentThemeLabel}
                </Text>
              </View>
              <MaterialIcons
                name="keyboard-arrow-right"
                size={22}
                color={colors.textMuted}
              />
            </Pressable>

            {/* Separador */}
            <View
              style={{
                height: 1,
                backgroundColor: colors.border,
                marginLeft: 60,
              }}
            />

            {/* Interfaz */}
            <Pressable
              onPress={() => setUiModalVisible(true)}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 18,
                paddingVertical: 16,
                gap: 14,
                backgroundColor: pressed ? colors.border : colors.surface,
              })}
            >
              <MaterialIcons name="tune" size={28} color="#1755ec" />
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "bold",
                    color: colors.text,
                  }}
                >
                  Interfaz
                </Text>
                <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                  {`Sonidos ${soundEnabled ? "activados" : "desactivados"} · Vibraciones ${vibrationEnabled ? "activadas" : "desactivadas"}`}
                </Text>
              </View>
              <MaterialIcons
                name="keyboard-arrow-right"
                size={22}
                color={colors.textMuted}
              />
            </Pressable>

            {/* Separador */}
            <View
              style={{
                height: 1,
                backgroundColor: colors.border,
                marginLeft: 60,
              }}
            />

            {/* Idioma y Región */}
            <Pressable
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 18,
                paddingVertical: 16,
                gap: 14,
              }}
            >
              <MaterialIcons name="language" size={28} color="#1755ec" />
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "bold",
                    color: colors.text,
                  }}
                >
                  Idioma y Región
                </Text>
                <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                  Español (México)
                </Text>
              </View>
              <MaterialIcons
                name="keyboard-arrow-right"
                size={22}
                color={colors.textMuted}
              />
            </Pressable>
          </View>
        </View>

        <View style={{ marginHorizontal: 25, marginTop: 24 }}>
          <Text
            style={{
              fontSize: 13,
              fontWeight: "bold",
              color: colors.textSecondary,
              marginBottom: 10,
              textTransform: "capitalize",
            }}
          >
            Soporte
          </Text>
          <View
            style={{
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.borderStrong,
              overflow: "hidden",
              backgroundColor: colors.surface,
            }}
          >
            {/* Ayuda y Soporte */}
            <Pressable
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 18,
                paddingVertical: 16,
                gap: 14,
              }}
            >
              <MaterialIcons name="help-outline" size={28} color="#1755ec" />
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "bold",
                    color: colors.text,
                  }}
                >
                  Ayuda y Soporte
                </Text>
                <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                  Centro de ayuda
                </Text>
              </View>
              <MaterialIcons
                name="keyboard-arrow-right"
                size={22}
                color={colors.textMuted}
              />
            </Pressable>
          </View>
        </View>

        {/* Info de la app */}
        <View
          style={{
            marginHorizontal: 25,
            marginTop: 24,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.borderStrong,
            backgroundColor: colors.surface,
            paddingVertical: 20,
            alignItems: "center",
            gap: 4,
          }}
        >
          <Text
            style={{ fontSize: 15, fontWeight: "bold", color: colors.text }}
          >
            Gestión de Gastos
          </Text>
          <Text style={{ fontSize: 13, color: colors.textSecondary }}>
            Versión 1.0.0
          </Text>
          <Text style={{ fontSize: 12, color: colors.textMuted }}>
            © 2026 Todos los derechos reservados
          </Text>
        </View>

        {/* Botón Cerrar Sesión */}
        <Pressable
          onPress={handleLogout}
          style={({ pressed }) => ({
            marginHorizontal: 25,
            marginTop: 16,
            borderRadius: 16,
            borderWidth: 1.5,
            borderColor: "#e53935",
            backgroundColor: pressed ? "rgba(229,57,53,0.1)" : colors.surface,
            paddingVertical: 16,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
          })}
        >
          <MaterialIcons name="logout" size={22} color="#e53935" />
          <Text style={{ fontSize: 15, fontWeight: "bold", color: "#e53935" }}>
            Cerrar Sesión
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
};

export default Settings;
