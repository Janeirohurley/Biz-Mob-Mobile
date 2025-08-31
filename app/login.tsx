import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useBusiness } from "../context/BusinessContext";

export default function LoginScreen() {
  const { config, login } = useBusiness();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!password.trim()) {
      setError("Please enter your password");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const success = await login(password);
      if (!success) {
        setError("Incorrect password. Please try again.");
        return
      }
      router.replace("/");
    } catch (err) {
      setError("Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!config) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="warning-outline" size={64} color="#FF3B30" />
          <Text style={styles.errorTitle}>No Account Found</Text>
          <Text style={styles.errorText}>Please create an account first</Text>
          <TouchableOpacity
            style={styles.signupButton}
            onPress={() => router.push('/signup')}
            activeOpacity={0.7}
          >
            <Text style={styles.signupButtonText}>Create Account</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.logoCircle}>
              <Ionicons name="book-outline" size={36} color="#007AFF" />
            </View>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to continue</Text>
          </View>

          <View style={styles.businessCard}>
            <View style={styles.businessIcon}>
              <Ionicons name="business" size={24} color="#007AFF" />
            </View>
            <View style={styles.businessInfo}>
              <Text style={styles.businessName}>{config.businessName}</Text>
              <Text style={styles.businessOwner}>Welcome back, {config.userName}</Text>
            </View>
          </View>

          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <View style={[styles.passwordContainer, error && styles.inputError]}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Enter your password"
                  placeholderTextColor="#8E8E93"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (error) setError("");
                  }}
                  autoFocus
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="#8E8E93"
                  />
                </TouchableOpacity>
              </View>
              {error && <Text style={styles.errorText}>{error}</Text>}
            </View>

            <TouchableOpacity
              style={[styles.loginButton, (!password.trim() || isLoading) && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={!password.trim() || isLoading}
              activeOpacity={0.7}
            >
              <Text style={styles.loginButtonText}>
                {isLoading ? "Signing In..." : "Sign In"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.signupLink}
              onPress={() => router.push('/signup')}
              activeOpacity={0.7}
            >
              <Text style={styles.signupLinkText}>Don't have an account? Sign Up</Text>
            </TouchableOpacity>

            <View style={styles.securityNote}>
              <Ionicons name="lock-closed" size={16} color="#8E8E93" />
              <Text style={styles.securityText}>
                Your data is encrypted and stored securely on this device
              </Text>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: "#8E8E93",
  },
  businessCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  businessIcon: {
    width: 40,
    height: 40,
    borderRadius: 24,
    backgroundColor: "#F0F4FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  businessInfo: {
    flex: 1,
  },
  businessName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 4,
  },
  businessOwner: {
    fontSize: 13,
    color: "#8E8E93",
  },
  form: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
  },
  field: {
    marginBottom: 24,
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
    color: "#000000",
    marginBottom: 8,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F2F2F7",
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "transparent",
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 13,
    color: "#000000",
  },
  inputError: {
    borderColor: "#FF3B30",
  },
  // errorText: {
  //   fontSize: 14,
  //   color: "#FF3B30",
  //   marginTop: 8,
  // },
  loginButton: {
    backgroundColor: "#007AFF",
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
    marginBottom: 20,
  },
  loginButtonDisabled: {
    opacity: 0.5,
  },
  loginButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  signupLink: {
    alignItems: "center",
    marginBottom: 20,
  },
  signupLinkText: {
    fontSize: 13,
    color: "#007AFF",
  },
  securityNote: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  securityText: {
    fontSize: 12,
    color: "#8E8E93",
    textAlign: "center",
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  errorTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#000000",
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 12,
    color: "#8E8E93",
    textAlign: "center",
    marginBottom: 24,
  },
  signupButton: {
    backgroundColor: "#007AFF",
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  signupButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});