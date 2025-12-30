import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useBusiness } from "../context/BusinessContext";

export default function LockScreen() {
  const { config, login } = useBusiness();
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const shakeAnimation = new Animated.Value(0);

  const triggerShakeAnimation = () => {
    shakeAnimation.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const handlePinInput = (digit: string) => {
    if (pin.length < 6) {
      const newPin = pin + digit;
      setPin(newPin);
      setError("");

      // Auto-validate when PIN is complete
      if (newPin.length === 6) {
        validatePin(newPin);
      }
    }
  };

  const handlePinDelete = () => {
    setPin(pin.slice(0, -1));
    setError("");
  };

  const validatePin = async (enteredPin: string) => {
    try {
      const success = await login(enteredPin);
      if (success) {
        router.replace("/dashboard/" as any);
      } else {
        // Show error and reset
        triggerShakeAnimation();
        setError("Incorrect PIN");
        setTimeout(() => {
          setPin("");
          setError("");
        }, 1000);
      }
    } catch (err) {
      triggerShakeAnimation();
      setError("Login failed");
      setTimeout(() => {
        setPin("");
        setError("");
      }, 1000);
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
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.logoCircle}>
            <Ionicons name="lock-closed" size={40} color="#007AFF" />
          </View>
          <Text style={styles.title}>Screen Locked</Text>
          <Text style={styles.subtitle}>{config.businessName}</Text>
          <Text style={styles.userName}>{config.userName}</Text>
        </View>

        <View style={styles.pinSection}>
          <Text style={styles.pinLabel}>Enter your PIN to unlock</Text>

          {/* PIN Display */}
          <Animated.View
            style={[
              styles.pinDotsContainer,
              { transform: [{ translateX: shakeAnimation }] }
            ]}
          >
            {[...Array(6)].map((_, index) => (
              <View
                key={index}
                style={[
                  styles.pinDot,
                  index < pin.length && !error && styles.pinDotFilled,
                  index < pin.length && error && styles.pinDotError,
                ]}
              />
            ))}
          </Animated.View>

          {error && <Text style={styles.errorText}>{error}</Text>}

          {/* Digital Pad */}
          <View style={styles.digitalPad}>
            <View style={styles.digitalPadRow}>
              {["1", "2", "3"].map((key) => (
                <TouchableOpacity
                  key={key}
                  style={styles.digitalPadButton}
                  onPress={() => handlePinInput(key)}
                  activeOpacity={0.6}
                >
                  <Text style={styles.digitalPadText}>{key}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.digitalPadRow}>
              {["4", "5", "6"].map((key) => (
                <TouchableOpacity
                  key={key}
                  style={styles.digitalPadButton}
                  onPress={() => handlePinInput(key)}
                  activeOpacity={0.6}
                >
                  <Text style={styles.digitalPadText}>{key}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.digitalPadRow}>
              {["7", "8", "9"].map((key) => (
                <TouchableOpacity
                  key={key}
                  style={styles.digitalPadButton}
                  onPress={() => handlePinInput(key)}
                  activeOpacity={0.6}
                >
                  <Text style={styles.digitalPadText}>{key}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.digitalPadRow}>
              <View style={styles.digitalPadButtonEmpty} />
              <TouchableOpacity
                style={styles.digitalPadButton}
                onPress={() => handlePinInput("0")}
                activeOpacity={0.6}
              >
                <Text style={styles.digitalPadText}>0</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.digitalPadButton}
                onPress={handlePinDelete}
                activeOpacity={0.6}
              >
                <Ionicons name="backspace-outline" size={26} color="#1C1C1E" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9F9FB",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 60,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#E5F0FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#007AFF",
    marginBottom: 4,
  },
  userName: {
    fontSize: 14,
    color: "#6e6e73",
  },
  pinSection: {
    alignItems: "center",
  },
  pinLabel: {
    fontSize: 17,
    fontWeight: "500",
    color: "#1C1C1E",
    marginBottom: 40,
    letterSpacing: -0.4,
  },
  pinDotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
  },
  pinDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#D1D1D6",
    marginHorizontal: 12,
  },
  pinDotFilled: {
    backgroundColor: "#1C1C1E",
  },
  pinDotError: {
    backgroundColor: "#FF3B30",
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 14,
    marginBottom: 20,
    textAlign: "center",
    fontWeight: "500",
  },
  digitalPad: {
    width: "100%",
    paddingHorizontal: 40,
  },
  digitalPadRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  digitalPadButton: {
    width: 75,
    height: 75,
    borderRadius: 37.5,
    backgroundColor: "#F2F2F7",
    alignItems: "center",
    justifyContent: "center",
  },
  digitalPadButtonEmpty: {
    width: 75,
    height: 75,
  },
  digitalPadText: {
    fontSize: 32,
    fontWeight: "300",
    color: "#1C1C1E",
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000000",
    marginTop: 16,
    marginBottom: 8,
  },
  signupButton: {
    backgroundColor: "#007AFF",
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 16,
  },
  signupButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
